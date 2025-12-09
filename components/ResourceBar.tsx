import React from 'react';
import { Resources } from '../types';

interface Props {
  resources: Resources;
  hoursPassed: number;
  score: number;
  decisionTime: number; // New prop for timer
}

const ResourceItem = ({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) => (
  <div className="flex flex-col items-center w-full group relative">
    <div className="flex justify-between w-full mb-1 text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-400">
      <span className="flex items-center gap-1">
          {icon} 
          <span className="hidden sm:inline">{label}</span>
      </span>
      <span className={`${value < 30 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{value}%</span>
    </div>
    <div className="w-full bg-gray-800 h-1 md:h-2 rounded-full overflow-hidden border border-gray-700">
      <div
        className={`h-full transition-all duration-500 ease-out ${color}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      ></div>
    </div>
  </div>
);

const ResourceBar: React.FC<Props> = ({ resources, hoursPassed, score, decisionTime }) => {
  
  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isUrgent = decisionTime <= 10;

  return (
    <div className="bg-gray-900/90 backdrop-blur-md border-b border-gray-700 p-2 md:p-3 sticky top-0 z-40 shadow-xl print:hidden">
      <div className="max-w-6xl mx-auto flex flex-col gap-2 md:gap-3">
        
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 md:gap-4">
                <div className="bg-black/40 px-2 md:px-3 py-1 rounded border border-red-500/30 flex items-center">
                    <span className="text-red-500 text-[10px] md:text-xs uppercase mr-0 md:mr-2 hidden sm:inline">Tiempo</span>
                    <span className="text-red-400 font-mono text-sm md:text-lg font-bold">+{hoursPassed}H</span>
                </div>
                
                {/* DECISION TIMER */}
                <div className={`px-2 md:px-4 py-1 rounded border-2 flex items-center gap-1 md:gap-2 transition-colors duration-300 ${isUrgent ? 'bg-red-900/50 border-red-500 animate-pulse' : 'bg-gray-800 border-gray-600'}`}>
                    <span className={`text-[10px] md:text-xs uppercase font-bold hidden sm:inline ${isUrgent ? 'text-red-200' : 'text-gray-400'}`}>Decisión:</span>
                    <svg className={`w-3 h-3 md:hidden ${isUrgent ? 'text-red-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className={`font-mono text-lg md:text-xl font-black ${isUrgent ? 'text-red-500' : 'text-white'}`}>
                        {formatTime(decisionTime)}
                    </span>
                </div>
            </div>
            
            <div className="flex items-center gap-1 md:gap-2">
                 <span className="text-gray-500 text-[10px] md:text-xs uppercase tracking-widest hidden sm:inline">Puntaje</span>
                 <span className="text-green-400 font-mono text-lg font-bold">{score}</span>
            </div>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-6">
          <ResourceItem 
            label="Personal" 
            value={resources.personnel} 
            color="bg-rose-500" 
            icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          />
          <ResourceItem 
            label="Agua" 
            value={resources.water} 
            color="bg-blue-500"
             icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
          />
          <ResourceItem 
            label="Comida" 
            value={resources.food} 
            color="bg-orange-500" 
             icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          />
          <ResourceItem 
            label="Energía" 
            value={resources.energy} 
            color="bg-yellow-500"
             icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          />
          <ResourceItem 
            label="Coms" 
            value={resources.comms} 
            color="bg-indigo-500"
             icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>}
          />
          <ResourceItem 
            label="Reputación" 
            value={resources.reputation} 
            color="bg-purple-500"
             icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
          />
        </div>
      </div>
    </div>
  );
};

export default ResourceBar;