import React, { useState, useEffect, useRef } from 'react';
import { GameState, SimulationStep, Resources, EventType, SimulationResult, GameMode } from './types';
import { startSimulation, nextTurn, generateResult } from './services/geminiService';
import { playSound } from './utils/sound';
import ResourceBar from './components/ResourceBar';
import Intro from './components/Intro';
import Map from './components/Map';
import Advisor from './components/Advisor';

const INITIAL_RESOURCES: Resources = {
  water: 100,
  food: 100,
  energy: 100,
  comms: 100,
  personnel: 100,
  reputation: 100,
};

const DECISION_TIME_LIMIT = 90; // 1 minute 30 seconds

export default function App() {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<SimulationStep | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [decisionTime, setDecisionTime] = useState(DECISION_TIME_LIMIT);
  
  // Ref for scrolling to top on new step
  const topRef = useRef<HTMLDivElement>(null);

  const [gameState, setGameState] = useState<GameState>({
    hoursPassed: 0,
    resources: INITIAL_RESOURCES,
    score: 0,
    history: [],
    gameOver: false,
    mode: 'CLASSIC',
    achievements: [],
  });

  // --- TIMER LOGIC ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (started && !loading && !gameState.gameOver && currentStep && decisionTime > 0) {
      interval = setInterval(() => {
        setDecisionTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleTimeout(); // Trigger timeout logic
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [started, loading, gameState.gameOver, currentStep, decisionTime]);


  const handleStart = async (type: EventType, mode: GameMode) => {
    setLoading(true);
    // Reset state
    setGameState({
        hoursPassed: 0,
        resources: INITIAL_RESOURCES,
        score: 0,
        history: [],
        gameOver: false,
        mode: mode,
        achievements: [],
    });

    try {
      const step = await startSimulation(type, mode);
      handleStepUpdate(step);
      setStarted(true);
    } catch (error) {
      console.error("Failed to start simulation", error);
      alert("Error al inicializar la simulación. Verifica tu API Key.");
    } finally {
      setLoading(false);
    }
  };

  const handleStepUpdate = (step: SimulationStep) => {
      setCurrentStep(step);
      setDecisionTime(DECISION_TIME_LIMIT); // RESET TIMER ON NEW STEP
      
      if (step.audio_cue === 'alarm') playSound('alarm');
      if (step.audio_cue === 'rumble') playSound('rumble');
      if (step.audio_cue === 'siren') playSound('alarm');
      
      // Scroll to top using ref
      setTimeout(() => {
          topRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
  };

  const handleTimeout = async () => {
    if (loading || gameState.gameOver) return;
    
    playSound('fail');
    setLoading(true);
    
    // Penalize heavily for timeout
    const finalResources = {
        ...gameState.resources,
        personnel: 0, // Everyone dies/leaves due to inaction
        reputation: 0 // Complete loss of trust
    };

    const finalState: GameState = {
        ...gameState,
        resources: finalResources,
        gameOver: true,
        history: [...gameState.history, {
            step: currentStep?.step || 0,
            description: "El tiempo de decisión se agotó (90s).",
            choiceId: "TIMEOUT",
            choiceText: "NINGUNA - Inacción del Liderazgo",
            outcome: "Fallo crítico por parálisis en la toma de decisiones."
        }]
    };

    setGameState(finalState);

    try {
        const finalResult = await generateResult(finalState);
        setResult(finalResult);
        // Ensure we scroll to top to see results
        setTimeout(() => {
            topRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    } catch (err) {
        console.error("Error generating timeout result", err);
    } finally {
        setLoading(false);
    }
  };

  const handleOptionSelect = async (optionId: string) => {
    if (loading) return; // Prevent multiple clicks
    if (!currentStep) return;
    playSound('click');

    const effect = currentStep.effects[optionId];
    
    // Validate effect existence
    if (!effect) {
       console.warn(`Efecto no encontrado para la opción ${optionId}`);
       return;
    }

    const selectedOption = currentStep.options.find(o => o.id === optionId);

    // Calculate time strictly as additive duration (max(0) prevents going backwards)
    const timeConsumed = Math.max(0, effect.time);

    // Calculate new state
    const newResources = {
      water: Math.max(0, Math.min(100, gameState.resources.water + effect.water)),
      food: Math.max(0, Math.min(100, gameState.resources.food + effect.food)),
      energy: Math.max(0, Math.min(100, gameState.resources.energy + effect.energy)),
      comms: Math.max(0, Math.min(100, gameState.resources.comms + effect.comms)),
      personnel: Math.max(0, Math.min(100, gameState.resources.personnel + effect.personnel)),
      reputation: Math.max(0, Math.min(100, (gameState.resources.reputation || 100) + (effect.reputation || 0))),
    };

    const newHours = gameState.hoursPassed + timeConsumed;
    const newScore = gameState.score + effect.points;

    const newHistoryItem = {
      step: currentStep.step,
      description: currentStep.description,
      choiceId: optionId,
      choiceText: selectedOption?.text || "Desconocido",
      outcome: `T:+${timeConsumed}h, Pers:${effect.personnel}, Rep:${effect.reputation}`
    };

    const nextState: GameState = {
      ...gameState,
      resources: newResources,
      hoursPassed: newHours,
      score: newScore,
      history: [...gameState.history, newHistoryItem],
    };

    setGameState(nextState);
    
    // Check End Conditions (72 hours passed or personnel dead)
    if (newHours >= 72 || newResources.personnel <= 0) {
      if (newResources.personnel <= 0) playSound('fail');
      else playSound('success');
      
      setLoading(true);
      try {
        const finalResult = await generateResult(nextState);
        setResult(finalResult);
        setGameState(prev => ({ ...prev, gameOver: true }));
        // Ensure we scroll to top to see results
        setTimeout(() => {
            topRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } catch (err) {
        console.error("Error generating result", err);
      } finally {
        setLoading(false);
      }
    } else {
      // Next Turn
      setLoading(true);
      try {
        const nextStepData = await nextTurn(currentStep, optionId, nextState);
        handleStepUpdate(nextStepData);
      } catch (err) {
        console.error("Error fetching next turn", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRestart = () => {
    playSound('click');
    setStarted(false);
    setLoading(false);
    setResult(null);
    setCurrentStep(null);
    setDecisionTime(DECISION_TIME_LIMIT);
    setGameState({
      hoursPassed: 0,
      resources: INITIAL_RESOURCES,
      score: 0,
      history: [],
      gameOver: false,
      mode: 'CLASSIC',
      achievements: [],
    });
    window.scrollTo(0, 0);
  };

  // --- RENDER HELPERS ---

  const renderScenario = () => {
    if (!currentStep) return null;

    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 flex flex-col lg:flex-row gap-6 print:hidden">
        {/* Left Column: Context & Map */}
        <div className="w-full lg:w-1/3 space-y-4">
             {/* Map Component */}
             <Map activeZone={currentStep.location_zone} />
             
             {/* Status Card */}
             <div className="bg-gray-800 rounded-lg p-3 md:p-4 border border-gray-700 shadow-lg">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Estado del Sitio</h3>
                <div className="flex items-center gap-2 mb-2">
                    <span className={`w-3 h-3 rounded-full ${currentStep.visual_cue === 'normal' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
                    <span className="text-white font-mono text-sm">{currentStep.visual_cue.toUpperCase()}</span>
                </div>
                <div className="text-gray-500 text-sm">
                    {currentStep.location_zone === "UNKNOWN" ? "Ubicación incierta." : `Zona activa: ${currentStep.location_zone}`}
                </div>
             </div>
        </div>

        {/* Right Column: Narrative & Choices */}
        <div className="w-full lg:w-2/3">
            <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden relative">
            <div className="bg-gray-900 p-4 md:p-6 border-b border-gray-700 flex justify-between items-center">
                <div>
                <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2 border border-blue-500/30">
                    Paso {currentStep.step}
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">{currentStep.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                    {currentStep.audio_cue !== 'none' && (
                        <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75 right-6 top-8"></span>
                    )}
                </div>
            </div>

            <div className="p-4 md:p-8">
                <p className="text-base md:text-xl text-gray-300 leading-relaxed mb-8 font-light border-l-4 border-gray-600 pl-3 md:pl-4">
                {currentStep.description}
                </p>

                <div className="grid gap-3 md:gap-4">
                {currentStep.options.map((option) => {
                    const effect = currentStep.effects[option.id];
                    // Safety check for render if effect is missing (though handleOptionSelect catches it for logic)
                    if (!effect) return null;
                    
                    // Display math.max(0, effect.time) in UI as well for consistency
                    const timeCost = Math.max(0, effect.time);

                    return (
                    <button
                        key={option.id}
                        onClick={() => handleOptionSelect(option.id)}
                        disabled={loading}
                        className="relative group p-4 md:p-5 bg-gray-700/40 hover:bg-gray-700 border border-gray-600 hover:border-blue-500 rounded-lg transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.99]"
                    >
                        <div className="flex items-start gap-3 md:gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:border-blue-500 font-mono font-bold transition-colors text-sm">
                            {option.id}
                        </div>
                        <div className="flex-grow">
                            <p className="text-white font-medium text-base md:text-lg">{option.text}</p>
                            
                            {/* Detailed Effect Preview (Subtle) */}
                            <div className="mt-2 flex flex-wrap gap-2 md:gap-3 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <span className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded">⏱️ +{timeCost}h</span>
                                {effect.personnel !== 0 && <span className={effect.personnel < 0 ? 'text-red-400' : 'text-green-400'}>👥 {effect.personnel}</span>}
                                {effect.reputation !== 0 && <span className={effect.reputation < 0 ? 'text-purple-400' : 'text-purple-300'}>⭐ {effect.reputation}</span>}
                            </div>
                        </div>
                        </div>
                    </button>
                    );
                })}
                </div>
            </div>
            
            {loading && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                    <span className="text-blue-400 font-mono text-xs md:text-sm animate-pulse tracking-widest">
                        {gameState.gameOver ? "GENERANDO REPORTE..." : "CALCULANDO IMPACTO..."}
                    </span>
                </div>
                </div>
            )}
            </div>
        </div>
        
        {/* Advisor Floating Button - Hidden on Print inside component, but also here safely */}
        <Advisor currentStep={currentStep} gameState={gameState} />
      </div>
    );
  };

  const renderResults = () => {
    if (!result) return null;
    
    const isFailure = gameState.resources.personnel <= 0;

    return (
      <div className="max-w-5xl mx-auto p-4 md:p-6 animate-fade-in print:p-0 print:max-w-full">
        <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-6 md:p-12 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
          
          {/* Header */}
          <div className="text-center mb-8 md:mb-12 border-b border-gray-700 pb-6 md:pb-8 print:border-gray-300 print:mb-6 print:pb-4">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 print:text-black">INFORME DE CONTINUIDAD</h2>
            <div className="flex flex-col md:flex-row justify-center items-center gap-6">
                <div className={`text-6xl md:text-7xl font-mono font-bold ${isFailure ? 'text-red-500' : 'text-green-500'} print:text-black`}>
                    {result.grade}
                </div>
                <div className="text-left text-sm md:text-base">
                    <p className="text-gray-400 print:text-black">Puntuación Global: <span className="text-white font-bold print:text-black">{result.final_score}</span></p>
                    <p className="text-gray-400 print:text-black">Seguridad Personal: <span className="text-white font-bold print:text-black">{gameState.resources.personnel}%</span></p>
                    <p className="text-gray-400 print:text-black">Reputación Corporativa: <span className="text-white font-bold print:text-black">{gameState.resources.reputation}%</span></p>
                    <p className="text-gray-400 print:text-black">Horas Sobrevividas: <span className="text-white font-bold print:text-black">{gameState.hoursPassed}h / 72h</span></p>
                </div>
            </div>
          </div>

          <div className="space-y-8 md:space-y-10 print:space-y-6">
            {/* Summary */}
            <div className="print:break-inside-avoid">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-4 print:text-black border-l-4 border-blue-500 pl-3">1. Resumen Ejecutivo</h3>
                <p className="text-gray-300 text-base md:text-lg leading-relaxed print:text-black text-justify">{result.summary}</p>
            </div>

            {/* ISO Report */}
            <div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-2 print:text-black border-l-4 border-blue-500 pl-3">
                    2. Auditoría ISO 22301:2019
                </h3>
                <p className="text-xs md:text-sm text-gray-500 mb-4 print:text-black">Análisis de conformidad basado en las cláusulas 4 a 10 de la norma internacional.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:block print:space-y-4">
                     <div className="bg-gray-900/50 p-4 md:p-5 rounded border border-gray-700 print:border-gray-300 print:bg-white print:break-inside-avoid">
                        <h4 className="text-blue-400 font-bold uppercase text-xs md:text-sm mb-1 print:text-black">Cláusula 4: Contexto</h4>
                        <p className="text-gray-300 text-sm print:text-black">{result.iso_report.clause4_context}</p>
                     </div>
                     <div className="bg-gray-900/50 p-4 md:p-5 rounded border border-gray-700 print:border-gray-300 print:bg-white print:break-inside-avoid">
                        <h4 className="text-blue-400 font-bold uppercase text-xs md:text-sm mb-1 print:text-black">Cláusula 5: Liderazgo</h4>
                        <p className="text-gray-300 text-sm print:text-black">{result.iso_report.clause5_leadership}</p>
                     </div>
                     <div className="bg-gray-900/50 p-4 md:p-5 rounded border border-gray-700 print:border-gray-300 print:bg-white print:break-inside-avoid">
                        <h4 className="text-blue-400 font-bold uppercase text-xs md:text-sm mb-1 print:text-black">Cláusula 6: Planificación</h4>
                        <p className="text-gray-300 text-sm print:text-black">{result.iso_report.clause6_planning}</p>
                     </div>
                     <div className="bg-gray-900/50 p-4 md:p-5 rounded border border-gray-700 print:border-gray-300 print:bg-white print:break-inside-avoid">
                        <h4 className="text-blue-400 font-bold uppercase text-xs md:text-sm mb-1 print:text-black">Cláusula 7: Soporte</h4>
                        <p className="text-gray-300 text-sm print:text-black">{result.iso_report.clause7_support}</p>
                     </div>
                     <div className="bg-gray-900/50 p-4 md:p-5 rounded border border-gray-700 print:border-gray-300 print:bg-white print:break-inside-avoid">
                        <h4 className="text-blue-400 font-bold uppercase text-xs md:text-sm mb-1 print:text-black">Cláusula 8: Operación</h4>
                        <p className="text-gray-300 text-sm print:text-black">{result.iso_report.clause8_operation}</p>
                     </div>
                     <div className="bg-gray-900/50 p-4 md:p-5 rounded border border-gray-700 print:border-gray-300 print:bg-white print:break-inside-avoid">
                        <h4 className="text-blue-400 font-bold uppercase text-xs md:text-sm mb-1 print:text-black">Cláusula 9: Evaluación</h4>
                        <p className="text-gray-300 text-sm print:text-black">{result.iso_report.clause9_evaluation}</p>
                     </div>
                     <div className="bg-gray-900/50 p-4 md:p-5 rounded border border-gray-700 print:border-gray-300 print:bg-white print:break-inside-avoid md:col-span-2 lg:col-span-1">
                        <h4 className="text-blue-400 font-bold uppercase text-xs md:text-sm mb-1 print:text-black">Cláusula 10: Mejora</h4>
                        <p className="text-gray-300 text-sm print:text-black">{result.iso_report.clause10_improvement}</p>
                     </div>
                </div>
            </div>

            {/* Achievements */}
            {result.achievements && result.achievements.length > 0 && (
                <div className="print:break-inside-avoid">
                     <h3 className="text-xl md:text-2xl font-bold text-white mb-4 print:text-black border-l-4 border-yellow-500 pl-3">3. Logros Desbloqueados</h3>
                     <div className="flex flex-wrap gap-2">
                         {result.achievements.map((ach, i) => (
                             <span key={i} className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 rounded-full text-xs md:text-sm font-bold print:text-black print:border-black print:bg-gray-100">
                                 🏆 {ach}
                             </span>
                         ))}
                     </div>
                </div>
            )}
            
            {/* Recommendations */}
            <div className="bg-blue-900/20 border border-blue-500/30 p-4 md:p-6 rounded-lg print:border-black print:bg-transparent print:break-inside-avoid">
                 <h3 className="text-lg md:text-xl font-bold text-blue-300 mb-4 print:text-black">4. Plan de Acción y Recomendaciones</h3>
                 <ul className="list-disc list-inside space-y-2 text-gray-300 print:text-black text-sm md:text-base">
                     {result.recommendations.map((rec, i) => (
                         <li key={i}>{rec}</li>
                     ))}
                 </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-4 mt-8 print:hidden">
                <button 
                    onClick={() => window.print()} 
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 active:scale-95"
                >
                    <span className="text-xl">🖨️</span> Imprimir Informe ISO (PDF)
                </button>
                <button 
                    onClick={handleRestart} 
                    className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-red-900/30 active:scale-95"
                >
                    Reiniciar Simulación
                </button>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-8 text-gray-500 text-xs md:text-sm print:hidden">
            Crisis72 Simulator v3.0 | Powered by Google Gemini | ISO 22301 Compliant
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 pb-24 md:pb-20 font-sans print:bg-white print:pb-0" ref={topRef}>
      {!started ? (
        <Intro onStart={handleStart} loading={loading} />
      ) : (
        <>
            <ResourceBar 
                resources={gameState.resources} 
                hoursPassed={gameState.hoursPassed} 
                score={gameState.score}
                decisionTime={decisionTime}
            />
            <div className="container mx-auto mt-4 md:mt-10 print:mt-0 print:max-w-full">
                {gameState.gameOver ? renderResults() : renderScenario()}
            </div>
        </>
      )}
    </div>
  );
}