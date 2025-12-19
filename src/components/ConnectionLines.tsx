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
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                {/* 2. Star Glow Filter */}
                <filter id="star-glow" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feFlood floodColor="white" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="shadow" />
                    <feMerge>
                        <feMergeNode in="shadow" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#22d3ee" />
                </marker>
            </defs>

            <style>
                {`
                    @keyframes flowSlow {
                        0% { stroke-dashoffset: 100; }
                        100% { stroke-dashoffset: 0; }
                    }
                     @keyframes flowFast {
                        0% { stroke-dashoffset: 100; }
                        100% { stroke-dashoffset: 0; }
                    }
                    .star-stream-slow {
                        animation: flowSlow 10s linear infinite;
                    }
                    .star-stream-fast {
                        animation: flowFast 3s linear infinite;
                    }
                `}
            </style>

            {/* Existing Connections */}
            {connections.map(conn => {
                const start = getNoteCenter(conn.from_note_id);
                const end = getNoteCenter(conn.to_note_id);
                if (!start || !end) return null;

                const createdAt = conn.created_at ? new Date(conn.created_at).getTime() : Date.now();
                const isNew = Date.now() - createdAt < 5000;

                return (
                    <g key={conn.id}>
                        {/* Base Line (Subtle) */}
                        <line
                            x1={start.x}
                            y1={start.y}
                            x2={end.x}
                            y2={end.y}
                            stroke="#0e7490"
                            strokeWidth="1"
                            strokeOpacity="0.3"
                        />

                        {/* Layer 1: Slow Moving Tiny Stars (Background dust) */}
                        <line
                            x1={start.x}
                            y1={start.y}
                            x2={end.x}
                            y2={end.y}
                            stroke="#a5f3fc" // Cyan-200
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeDasharray="0.1 15" // Tiny dots
                            className="star-stream-slow"
                            style={{ opacity: 0.6 }}
                        />

                        {/* Layer 2: Faster Bright Stars (Main trail) */}
                        <line
                            x1={start.x}
                            y1={start.y}
                            x2={end.x}
                            y2={end.y}
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeDasharray="0.1 40" // Sparse bright stars
                            filter="url(#neon-glow)"
                            className="star-stream-fast"
                        />

                        {/* Layer 3: Occasional Streaks (Comets) - Optional, using longer dash */}
                        <line
                            x1={start.x}
                            y1={start.y}
                            x2={end.x}
                            y2={end.y}
                            stroke="#22d3ee" // Cyan
                            strokeWidth="2"
                            strokeDasharray="10 120"
                            strokeLinecap="round"
                            filter="url(#neon-glow)"
                            className="star-stream-fast"
                            style={{ animationDuration: '4s', opacity: 0.8 }}
                        />

                        {/* Spaceship Animation (Only for new connections) */}
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
                        stroke="#fff"
                        strokeWidth="2"
                        strokeDasharray="0 10"
                        strokeLinecap="round"
                        className="star-stream-fast"
                        filter="url(#neon-glow)"
                    />
                    <line
                        x1={activeConnection.startX}
                        y1={activeConnection.startY}
                        x2={activeConnection.currentX}
                        y2={activeConnection.currentY}
                        stroke="#22d3ee"
                        strokeWidth="1"
                        strokeOpacity="0.3"
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
