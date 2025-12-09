export interface Resources {
  water: number;
  food: number;
  energy: number;
  comms: number;
  personnel: number; // Health/Safety
  reputation: number; // Corporate Reputation & Legal
}

export type GameMode = 'CLASSIC' | 'TIME_ATTACK' | 'EXECUTIVE';

export interface GameState {
  hoursPassed: number;
  resources: Resources;
  score: number;
  mode: GameMode;
  history: Array<{
    step: number;
    description: string;
    choiceId: string;
    choiceText: string;
    outcome: string;
  }>;
  gameOver: boolean;
  achievements: string[];
}

export interface Effect {
  water: number;
  food: number;
  energy: number;
  comms: number;
  personnel: number;
  reputation: number;
  time: number; // How many hours this action takes
  points: number;
}

export interface Option {
  id: string;
  text: string;
}

export interface SimulationStep {
  step: number;
  title: string;
  description: string; // The narrative situation
  location_zone: string; // e.g., "SERVER_ROOM", "LOBBY", "OUTSIDE"
  visual_cue: 'normal' | 'fire' | 'flood' | 'dark' | 'panic';
  audio_cue: 'none' | 'alarm' | 'rumble' | 'siren';
  options: Option[];
  effects: Record<string, Effect>; // Keyed by Option ID
}

export interface IsoEvaluation {
  clause4_context: string;
  clause5_leadership: string;
  clause6_planning: string;
  clause7_support: string;
  clause8_operation: string;
  clause9_evaluation: string;
  clause10_improvement: string;
}

export interface SimulationResult {
  final_score: number;
  summary: string;
  iso_report: IsoEvaluation;
  achievements: string[];
  recommendations: string[];
  grade: string;
}

export enum EventType {
  EARTHQUAKE = "Terremoto Mayor",
  FLOOD = "Inundación Masiva",
  CYBERATTACK = "Ciberataque Ransomware",
  FIRE = "Incendio Estructural",
  BLACKOUT = "Falla Energética Nacional"
}