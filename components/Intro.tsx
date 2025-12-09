import React, { useState } from 'react';
import { EventType, GameMode } from '../types';
import { playSound } from '../utils/sound';

interface Props {
  onStart: (type: EventType, mode: GameMode) => void;
  loading: boolean;
}

const Intro: React.FC<Props> = ({ onStart, loading }) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('CLASSIC');

  const modes: {id: GameMode, label: string, desc: string}[] = [
      { id: 'CLASSIC', label: 'Clásico', desc: 'Experiencia estándar de 72 horas.' },
      { id: 'TIME_ATTACK', label: 'Time Attack', desc: 'Decisiones rápidas, alta presión.' },
      { id: 'EXECUTIVE', label: 'Directivo', desc: 'Foco en estrategia y reputación.' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 bg-gray-900 relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 z-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-700 via-gray-900 to-black"></div>
        </div>
      
      <div className="relative z-10 max-w-6xl w-full flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-stretch">
        
        {/* Left Col: Title & Mode */}
        <div className="flex-1 w-full text-center lg:text-left flex flex-col justify-center">
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
                CRISIS<span className="text-white">72</span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl font-light mb-8 lg:border-l-4 border-red-500 lg:pl-4">
                Simulador de Continuidad de Negocio &<br className="hidden md:block"/> Resiliencia Corporativa ISO 22301
            </p>

            <div className="space-y-4 mb-8 text-left max-w-md mx-auto lg:mx-0 w-full">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest text-center lg:text-left">Selecciona Modo</p>
                <div className="grid gap-2">
                    {modes.map(mode => (
                        <button 
                            key={mode.id}
                            onClick={() => { playSound('click'); setSelectedMode(mode.id); }}
                            className={`p-3 rounded-lg border text-left transition-all active:scale-95 ${
                                selectedMode === mode.id 
                                ? 'bg-red-900/40 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                                : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-800'
                            }`}
                        >
                            <div className="font-bold">{mode.label}</div>
                            <div className="text-xs opacity-70">{mode.desc}</div>
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Col: Events */}
        <div className="flex-1 w-full max-w-md lg:max-w-full bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-6 md:p-8 shadow-2xl relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-6 bg-gray-900 px-2 text-red-500 text-[10px] md:text-xs font-bold uppercase border border-red-500/50 rounded whitespace-nowrap">
            Inicialización de Evento
          </div>

          <h2 className="text-xl md:text-2xl text-white font-bold mb-6 text-center lg:text-left">Selecciona Incidente</h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 md:h-64 gap-6">
              <div className="relative w-16 h-16 md:w-24 md:h-24">
                  <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-center">
                  <p className="text-red-400 animate-pulse font-mono font-bold text-base md:text-lg">GENERANDO ESCENARIO</p>
                  <p className="text-gray-500 text-xs mt-2">Cargando parámetros de IA...</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {Object.values(EventType).map((type) => (
                <button
                  key={type}
                  onClick={() => { playSound('rumble'); onStart(type, selectedMode); }}
                  className="group flex items-center justify-between w-full p-3 md:p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-red-500 rounded-lg transition-all duration-200 active:scale-[0.98]"
                >
                  <span className="text-left font-semibold text-gray-200 group-hover:text-white text-sm md:text-base">{type}</span>
                  <span className="text-gray-500 group-hover:text-red-400">
                    <svg className="w-4 h-4 md:w-5 md:h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="absolute bottom-2 md:bottom-4 text-[8px] md:text-[10px] text-gray-600 uppercase tracking-widest text-center px-4">
        Powered by Google Gemini | Audio Enabled
      </div>
    </div>
  );
};

export default Intro;