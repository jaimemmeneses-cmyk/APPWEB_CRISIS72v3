import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SimulationStep, SimulationResult, EventType, GameState, GameMode } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

const stepSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    step: { type: Type.INTEGER },
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    location_zone: { type: Type.STRING, description: "Zone on map: SERVER_ROOM, OFFICES, LOBBY, WAREHOUSE, OUTSIDE, ROOF, UNKNOWN" },
    visual_cue: { type: Type.STRING, enum: ["normal", "fire", "flood", "dark", "panic"] },
    audio_cue: { type: Type.STRING, enum: ["none", "alarm", "rumble", "siren"] },
    options: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          text: { type: Type.STRING },
        },
        required: ["id", "text"],
      },
    },
    effects: {
      type: Type.OBJECT,
      properties: {
        A: {
          type: Type.OBJECT,
          properties: {
            water: { type: Type.INTEGER },
            food: { type: Type.INTEGER },
            energy: { type: Type.INTEGER },
            comms: { type: Type.INTEGER },
            personnel: { type: Type.INTEGER },
            reputation: { type: Type.INTEGER },
            time: { type: Type.INTEGER, description: "Horas que consume esta acción (SIEMPRE POSITIVO, ej: 1, 2, 4)." },
            points: { type: Type.INTEGER },
          },
          required: ["water", "food", "energy", "comms", "personnel", "reputation", "time", "points"],
        },
        B: {
            type: Type.OBJECT,
            properties: {
              water: { type: Type.INTEGER },
              food: { type: Type.INTEGER },
              energy: { type: Type.INTEGER },
              comms: { type: Type.INTEGER },
              personnel: { type: Type.INTEGER },
              reputation: { type: Type.INTEGER },
              time: { type: Type.INTEGER, description: "Horas que consume esta acción (SIEMPRE POSITIVO)." },
              points: { type: Type.INTEGER },
            },
            required: ["water", "food", "energy", "comms", "personnel", "reputation", "time", "points"],
          },
          C: {
            type: Type.OBJECT,
            properties: {
              water: { type: Type.INTEGER },
              food: { type: Type.INTEGER },
              energy: { type: Type.INTEGER },
              comms: { type: Type.INTEGER },
              personnel: { type: Type.INTEGER },
              reputation: { type: Type.INTEGER },
              time: { type: Type.INTEGER, description: "Horas que consume esta acción (SIEMPRE POSITIVO)." },
              points: { type: Type.INTEGER },
            },
            required: ["water", "food", "energy", "comms", "personnel", "reputation", "time", "points"],
          },
      },
      required: ["A", "B", "C"],
    },
  },
  required: ["step", "title", "description", "options", "effects", "location_zone", "visual_cue", "audio_cue"],
};

const resultSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    final_score: { type: Type.INTEGER },
    grade: { type: Type.STRING },
    summary: { type: Type.STRING },
    iso_report: {
        type: Type.OBJECT,
        properties: {
            clause4_context: { type: Type.STRING, description: "Evaluación Cláusula 4 (Contexto): Comprensión del entorno y necesidades de partes interesadas." },
            clause5_leadership: { type: Type.STRING, description: "Evaluación Cláusula 5 (Liderazgo): Compromiso, política y roles." },
            clause6_planning: { type: Type.STRING, description: "Evaluación Cláusula 6 (Planificación): Acciones para riesgos y objetivos." },
            clause7_support: { type: Type.STRING, description: "Evaluación Cláusula 7 (Soporte): Recursos, competencia, toma de conciencia y comunicación." },
            clause8_operation: { type: Type.STRING, description: "Evaluación Cláusula 8 (Operación): Planificación y control, BIA, estrategias y planes de continuidad." },
            clause9_evaluation: { type: Type.STRING, description: "Evaluación Cláusula 9 (Evaluación del desempeño): Monitoreo, medición, análisis y auditoría." },
            clause10_improvement: { type: Type.STRING, description: "Evaluación Cláusula 10 (Mejora): No conformidad y acciones correctivas." },
        },
        required: ["clause4_context", "clause5_leadership", "clause6_planning", "clause7_support", "clause8_operation", "clause9_evaluation", "clause10_improvement"]
    },
    achievements: { type: Type.ARRAY, items: { type: Type.STRING } },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["final_score", "grade", "summary", "iso_report", "achievements", "recommendations"],
};

const advisorSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    advice: { type: Type.STRING, description: "Short, actionable advice from a crisis expert perspective." },
  },
  required: ["advice"]
};

export const startSimulation = async (eventType: EventType, mode: GameMode): Promise<SimulationStep> => {
  const prompt = `
    Eres un motor de simulación de Continuidad de Negocio ISO 22301.
    
    Configuración:
    - Evento: ${eventType}
    - Modo de Juego: ${mode} (Si es TIME_ATTACK, las situaciones son más críticas y rápidas. Si es EXECUTIVE, enfócate en decisiones estratégicas de alto nivel).
    
    Contexto: Oficina corporativa, 50 empleados.
    Objetivo: Sobrevivir 72 horas.
    
    Genera el Paso 1.
    IMPORTANTE:
    - 'reputation' es un nuevo recurso (0-100).
    - 'location_zone' debe ser una de: SERVER_ROOM, OFFICES, LOBBY, WAREHOUSE, OUTSIDE, ROOF, UNKNOWN.
    - 'time' en los efectos SIEMPRE debe ser un número entero POSITIVO (ej: 1, 2, 4), representando las horas que pasan al tomar esa decisión. El reloj avanza hacia las 72h.
    - Todo el texto en ESPAÑOL.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: stepSchema,
    },
  });

  if (!response.text) throw new Error("No response");
  return JSON.parse(response.text) as SimulationStep;
};

export const nextTurn = async (
  currentStep: SimulationStep,
  choiceId: string,
  gameState: GameState
): Promise<SimulationStep> => {
  const lastChoice = currentStep.options.find((o) => o.id === choiceId)?.text;
  
  const prompt = `
    Continúa la simulación ISO 22301.
    Paso Anterior: ${currentStep.description}
    Elección: ${choiceId} - ${lastChoice}
    
    Estado Actual:
    - Hora: ${gameState.hoursPassed}/72 (El tiempo avanza, no retrocede)
    - Recursos: ${JSON.stringify(gameState.resources)}
    - Modo: ${gameState.mode}
    
    Genera el siguiente paso.
    Si el modo es TIME_ATTACK, incrementa la urgencia.
    Introduce fallos en cascada si los recursos son bajos.
    Si reputation baja de 20, introduce problemas legales o de prensa.
    
    REGLAS DE TIEMPO:
    - El valor de 'time' en effects debe ser POSITIVO. Representa el costo en horas de la acción.
    - NO uses valores negativos para 'time'.
    
    IMPORTANTE: Texto en ESPAÑOL.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: stepSchema,
    },
  });

  if (!response.text) throw new Error("No response");
  return JSON.parse(response.text) as SimulationStep;
};

export const generateResult = async (gameState: GameState): Promise<SimulationResult> => {
  const prompt = `
    Genera un informe final de auditoría y simulacro de crisis basado ESTRICTAMENTE en la norma ISO 22301.
    Actúa como un Auditor Líder Certificado.
    
    Historial de Decisiones: ${JSON.stringify(gameState.history.map(h => ({ step: h.step, choice: h.choiceText, outcome: h.outcome })))}
    Recursos Finales: ${JSON.stringify(gameState.resources)}
    Horas Sobrevividas: ${gameState.hoursPassed}/72
    
    Requisitos para el Reporte ISO:
    Debes evaluar el desempeño del usuario mapeando sus decisiones a las siguientes cláusulas de la norma:
    
    1. Cláusula 4 (Contexto): ¿Entendió el usuario el impacto en la organización y partes interesadas?
    2. Cláusula 5 (Liderazgo): ¿Mostró compromiso y política clara o fue errático?
    3. Cláusula 6 (Planificación): ¿Se anticipó a riesgos o solo reaccionó?
    4. Cláusula 7 (Soporte): ¿Gestionó bien los recursos, comunicaciones y competencia del personal?
    5. Cláusula 8 (Operación): ¿Ejecutó planes de continuidad y control operacional efectivos?
    6. Cláusula 9 (Evaluación): Análisis del monitoreo de la situación.
    7. Cláusula 10 (Mejora): Identificación de no conformidades mayores.

    Genera logros (ej. "Cero Fatalidades", "Héroe de la Comunicación") si aplica.
    Recomendaciones accionables y profesionales.
    
    Idioma: ESPAÑOL. Tono: Formal, Auditoría.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: resultSchema,
    },
  });

  if (!response.text) throw new Error("No response");
  return JSON.parse(response.text) as SimulationResult;
};

export const getAdvisorAdvice = async (currentStep: SimulationStep, gameState: GameState): Promise<string> => {
    const prompt = `
      Actúa como el "Jefe de Crisis Virtual" (AI Advisor).
      Situación actual: ${currentStep.description}
      Recursos: ${JSON.stringify(gameState.resources)}
      Hora actual: ${gameState.hoursPassed} de 72.
      
      Dame un consejo breve, táctico y estratégico (máx 2 frases) para ayudar al usuario a decidir.
      Básate en buenas prácticas de gestión de emergencias.
      Idioma: ESPAÑOL.
    `;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: advisorSchema,
        }
    });

    if (!response.text) return "No hay conexión con el asesor.";
    const data = JSON.parse(response.text);
    return data.advice;
}
