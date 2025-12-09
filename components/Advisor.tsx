import React, { useState } from 'react';
import { SimulationStep, GameState } from '../types';
import { getAdvisorAdvice } from '../services/geminiService';
import { playSound } from '../utils/sound';

interface Props {
    currentStep: SimulationStep;
    gameState: GameState;
}

const Advisor: React.FC<Props> = ({ currentStep, gameState }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [advice, setAdvice] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleConsult = async () => {
        playSound('click');
        if (advice && !loading) {
            // If we already have advice for this step, just show it. 
            // NOTE: In a real app we'd clear advice on step change, but for now we re-fetch if they ask again.
        }
        setLoading(true);
        try {
            const result = await getAdvisorAdvice(currentStep, gameState);
            setAdvice(result);
        } catch (e) {
            setAdvice("Sistemas de comunicación caídos. No se puede contactar al asesor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 print:hidden">
            {isOpen && (
                <div className="mb-4 w-72 md:w-80 bg-gray-800 border border-blue-500 rounded-lg shadow-2xl p-4 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-700">
                        <h3 className="font-bold text-blue-400 flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                             Jefe de Crisis AI
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">&times;</button>
                    </div>
                    
                    <div className="bg-gray-900 rounded p-3 text-sm text-gray-300 min-h-[80px]">
                        {loading ? (
                            <div className="flex items-center gap-2 text-blue-400">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                                Analizando datos...
                            </div>
                        ) : advice ? (
                            <p className="typing-effect">{advice}</p>
                        ) : (
                            <p className="text-gray-500 italic">Esperando consulta...</p>
                        )}
                    </div>

                    <button 
                        onClick={handleConsult}
                        disabled={loading}
                        className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-bold text-white uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                        {advice ? "Consultar de Nuevo" : "Solicitar Recomendación"}
                    </button>
                </div>
            )}

            <button 
                onClick={() => { playSound('click'); setIsOpen(!isOpen); }}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 border-2 border-blue-400"
            >
                <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            </button>
        </div>
    );
};

export default Advisor;