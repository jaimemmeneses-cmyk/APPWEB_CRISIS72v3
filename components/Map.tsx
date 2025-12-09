import React from 'react';

interface Props {
    activeZone: string;
}

const Map: React.FC<Props> = ({ activeZone }) => {
    const getZoneColor = (zoneName: string) => {
        // Normalize zone string
        const current = (activeZone || "").toUpperCase();
        const zone = zoneName.toUpperCase();
        
        if (current.includes(zone)) return "fill-red-500 animate-pulse";
        return "fill-gray-700 hover:fill-gray-600 transition-colors";
    };

    return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 md:p-4 relative overflow-hidden h-48 md:h-64 flex items-center justify-center">
             <div className="absolute top-2 left-2 text-[10px] md:text-xs font-mono text-gray-500">
                UBICACIÓN: {activeZone || "DESCONOCIDA"}
             </div>
             
             {/* Simple Schematic SVG of an Office */}
             <svg viewBox="0 0 400 300" className="w-full h-full opacity-80">
                {/* Structure */}
                <rect x="10" y="10" width="380" height="280" rx="5" fill="none" stroke="#374151" strokeWidth="4" />
                
                {/* Rooms */}
                {/* Offices */}
                <rect x="20" y="20" width="100" height="150" className={getZoneColor("OFFICES")} stroke="#1f2937" strokeWidth="2" />
                <text x="70" y="95" textAnchor="middle" className="fill-white text-[10px] pointer-events-none">OFICINAS</text>

                {/* Lobby */}
                <rect x="140" y="200" width="120" height="80" className={getZoneColor("LOBBY")} stroke="#1f2937" strokeWidth="2" />
                <text x="200" y="240" textAnchor="middle" className="fill-white text-[10px] pointer-events-none">LOBBY</text>
                
                {/* Server Room (Critical) */}
                <rect x="20" y="190" width="100" height="90" className={getZoneColor("SERVER")} stroke="#1f2937" strokeWidth="2" />
                <text x="70" y="235" textAnchor="middle" className="fill-white text-[10px] pointer-events-none">SERVER ROOM</text>
                
                {/* Warehouse */}
                <rect x="280" y="20" width="100" height="150" className={getZoneColor("WAREHOUSE")} stroke="#1f2937" strokeWidth="2" />
                <text x="330" y="95" textAnchor="middle" className="fill-white text-[10px] pointer-events-none">ALMACÉN</text>

                {/* Outside / Exits */}
                <path d="M 190 280 L 210 280 L 210 300 L 190 300 Z" className={getZoneColor("OUTSIDE")} />
                
                {/* Roof */}
                <rect x="140" y="20" width="120" height="120" className={getZoneColor("ROOF")} stroke="#1f2937" strokeWidth="2" />
                <text x="200" y="80" textAnchor="middle" className="fill-white text-[10px] pointer-events-none">AZOTEA</text>

             </svg>
        </div>
    );
};

export default Map;