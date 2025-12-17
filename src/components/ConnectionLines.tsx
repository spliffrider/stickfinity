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
        // Use 1x1 pixel with overflow visible to avoid "w-full" resolving to 0 in a collapsed container
        <svg className="absolute top-0 left-0 w-1 h-1 pointer-events-none overflow-visible z-0">
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

                // Check if connection is "new" (created < 5 seconds ago) for animation
                // Safely handle potential missing dates if optimistic
                const createdAt = conn.created_at ? new Date(conn.created_at).getTime() : Date.now();
                const isNew = Date.now() - createdAt < 5000;

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
                        <Spaceship start={start} end={end} isNew={isNew} />
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
                    style={{ pointerEvents: 'none' }}
                />
            )}
        </svg>
    );
};

const Spaceship = ({ start, end, isNew }: { start: { x: number; y: number }, end: { x: number; y: number }, isNew: boolean }) => {
    // Calculate rotation angle
    // SVG rotation is usually 0 = right. 
    // Lucide Rocket is pointing Top-Right (45deg). 
    // We need to adjust.
    const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);

    return (
        <foreignObject
            width="1"
            height="1"
            x={0}
            y={0}
            style={{ overflow: 'visible' }}
        >
            {/* One-Shot Launch Animation */}
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
                        // Rocket icon is 45deg by default. 
                        // So if we rotate by 'angle', we need to subtract 45? Or add 45?
                        // Let's assume we want to point the Tip.
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
