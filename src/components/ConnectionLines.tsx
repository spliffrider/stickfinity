import React from 'react';
import { Database } from '@/lib/database.types';
import { motion } from 'framer-motion';

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
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible z-0">
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#22d3ee" />
                </marker>
            </defs>

            {/* Existing Connections */}
            {connections.map(conn => {
                const start = getNoteCenter(conn.from_note_id);
                const end = getNoteCenter(conn.to_note_id);
                if (!start || !end) return null;

                return (
                    <g key={conn.id}>
                        {/* The Line */}
                        <line
                            x1={start.x}
                            y1={start.y}
                            x2={end.x}
                            y2={end.y}
                            stroke="#0891b2" // Cyan-600
                            strokeWidth="2"
                            strokeDasharray="5,5"
                            className="opacity-60"
                        />

                        {/* The Spaceship Animation */}
                        <Spaceship start={start} end={end} />
                    </g>
                );
            })}

            {/* Active Connection (Dragging) */}
            {activeConnection && (
                <line
                    x1={activeConnection.startX}
                    y1={activeConnection.startY}
                    x2={activeConnection.currentX}
                    y2={activeConnection.currentY}
                    stroke="#22d3ee" // Cyan-400
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    markerEnd="url(#arrowhead)"
                />
            )}
        </svg>
    );
};

const Spaceship = ({ start, end }: { start: { x: number; y: number }, end: { x: number; y: number } }) => {
    return (
        <motion.circle
            r="4"
            fill="#ffffff"
            filter="url(#glow)" // Assume we add a glow filter later or css
            initial={{ x: start.x, y: start.y }}
            animate={{ x: end.x, y: end.y }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
                repeatDelay: 0.5
            }}
            className="shadow-glow"
        />
    )
}
