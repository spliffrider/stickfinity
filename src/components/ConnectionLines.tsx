import React from 'react';
import { Database } from '@/lib/database.types';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';

type Note = Database['public']['Tables']['notes']['Row'];
type Connection = Database['public']['Tables']['connections']['Row'];

interface ConnectionLinesProps {
    connections: Connection[];
    notes: Note[];
    activeConnection?: { startX: number; startY: number; currentX: number; currentY: number } | null;
}

export const ConnectionLines: React.FC<ConnectionLinesProps> = ({ connections, notes, activeConnection }) => {
    // Helper to get center of a note
    const getNoteCenter = (noteId: string) => {
        const note = notes.find(n => n.id === noteId);
        if (!note) return null;
        return { x: note.x + 100, y: note.y + 100 }; // 100 is half of 200px width
    };

    return (
        <svg className="absolute top-0 left-0 w-1 h-1 pointer-events-none overflow-visible z-0">
            <defs>
                {/* 1. Neon Glow Filter */}
                <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                {/* 2. Animated Energy Gradient */}
                <linearGradient id="energy-gradient" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100%" y2="0">
                    <stop offset="0%" stopColor="#0891b2" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#22d3ee" stopOpacity="1" />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity="0.3" />
                    {/* Animation handled via CSS or Framer if needed, but static gradient is better for perf on many lines. 
                        We will use strokeDasharray animation for flow. */}
                </linearGradient>

                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#22d3ee" />
                </marker>
            </defs>

            {/* Existing Connections */}
            {connections.map(conn => {
                const start = getNoteCenter(conn.from_note_id);
                const end = getNoteCenter(conn.to_note_id);
                if (!start || !end) return null;

                const createdAt = conn.created_at ? new Date(conn.created_at).getTime() : Date.now();
                const isNew = Date.now() - createdAt < 5000;

                return (
                    <g key={conn.id}>
                        {/* Outer Glow Line */}
                        <motion.line
                            x1={start.x}
                            y1={start.y}
                            x2={end.x}
                            y2={end.y}
                            stroke="#22d3ee"
                            strokeWidth="4"
                            strokeOpacity="0.2"
                            filter="url(#neon-glow)"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        />

                        {/* Inner Core Line (Animated Dash) */}
                        <line
                            x1={start.x}
                            y1={start.y}
                            x2={end.x}
                            y2={end.y}
                            stroke="#cyan" // Fallback
                            strokeWidth="2"
                            className="stroke-cyan-400 animate-pulse-fast" // Tailwind animate-pulse or custom class
                            style={{
                                strokeDasharray: "10,10",
                                animation: "dashFlow 1s linear infinite"
                            }}
                        />

                        {/* Add style tag for keyframes if not present global */}
                        <style>
                            {`
                                @keyframes dashFlow {
                                    from { stroke-dashoffset: 20; }
                                    to { stroke-dashoffset: 0; }
                                }
                            `}
                        </style>

                        {/* Spaceship Animation */}
                        <Spaceship start={start} end={end} isNew={isNew} />
                    </g>
                );
            })}

            {/* Active Connection (Dragging) */}
            {activeConnection && (
                <g>
                    <line
                        x1={activeConnection.startX}
                        y1={activeConnection.startY}
                        x2={activeConnection.currentX}
                        y2={activeConnection.currentY}
                        stroke="#22d3ee"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        filter="url(#neon-glow)"
                    />
                    <circle cx={activeConnection.currentX} cy={activeConnection.currentY} r="4" fill="#22d3ee" filter="url(#neon-glow)" />
                </g>
            )}
        </svg>
    );
};

const Spaceship = ({ start, end, isNew }: { start: { x: number; y: number }, end: { x: number; y: number }, isNew: boolean }) => {
    const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);

    return (
        <foreignObject width="1" height="1" x={0} y={0} style={{ overflow: 'visible' }}>
            {isNew && (
                <motion.div
                    initial={{ x: start.x, y: start.y, opacity: 1, scale: 0.5 }}
                    animate={{ x: end.x, y: end.y, opacity: [1, 1, 0], scale: 1.5 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '30px',
                        height: '30px',
                        transform: `rotate(${angle + 45}deg) translate(-50%, -50%)`,
                        transformOrigin: '0 0'
                    }}
                >
                    <Rocket size={24} className="text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] fill-cyan-500" />
                </motion.div>
            )}
        </foreignObject>
    )
}
