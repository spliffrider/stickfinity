import React, { useMemo } from 'react';
import { Database } from '@/lib/database.types';

type Note = Database['public']['Tables']['notes']['Row'];

interface MinimapProps {
    notes: Note[];
    viewport: { x: number; y: number; scale: number; width: number; height: number };
    onNavigate: (x: number, y: number) => void;
}

export const Minimap: React.FC<MinimapProps> = ({ notes, viewport, onNavigate }) => {
    // 1. Calculate Bounds
    const bounds = useMemo(() => {
        if (notes.length === 0) return { minX: -500, maxX: 500, minY: -500, maxY: 500 };

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        notes.forEach(note => {
            minX = Math.min(minX, note.x);
            maxX = Math.max(maxX, note.x + 200); // +200 for approx width
            minY = Math.min(minY, note.y);
            maxY = Math.max(maxY, note.y + 200);
        });

        // Add padding
        const padding = 2000;
        return {
            minX: minX - padding,
            maxX: maxX + padding,
            minY: minY - padding,
            maxY: maxY + padding,
            width: (maxX + padding) - (minX - padding),
            height: (maxY + padding) - (minY - padding)
        };
    }, [notes]);

    // 2. Constants
    const MAP_SIZE = 150;
    const scaleX = MAP_SIZE / bounds.width;
    const scaleY = MAP_SIZE / bounds.height;
    // Maintain aspect ratio fit
    const finalScale = Math.min(scaleX, scaleY);

    // 3. Helper to map canvas coords to minimap coords
    const toMap = (val: number, min: number) => (val - min) * finalScale;

    // Viewport calculation (inverse of transform)
    // Canvas Viewport X = -transform.x / transform.scale
    const vpX = -viewport.x / viewport.scale;
    const vpY = -viewport.y / viewport.scale;
    const vpW = viewport.width / viewport.scale;
    const vpH = viewport.height / viewport.scale;

    return (
        <div
            className="absolute bottom-8 right-8 w-[150px] h-[150px] bg-black/60 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden shadow-2xl z-50 transition-opacity hover:opacity-100 opacity-80"
            onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;

                // Reverse map to canvas coords
                const targetCanvasX = (clickX / finalScale) + bounds.minX;
                const targetCanvasY = (clickY / finalScale) + bounds.minY;

                // Center viewport on target
                // transform.x = -1 * (targetCanvasX * scale - screenWidth/2)
                // Simplified: We want screen center to be at targetCanvasX
                // So newTransX = (screenWidth / 2) - (targetCanvasX * currentScale)

                const newTransX = (viewport.width / 2) - (targetCanvasX * viewport.scale);
                const newTransY = (viewport.height / 2) - (targetCanvasY * viewport.scale);

                onNavigate(newTransX, newTransY);
            }}
        >
            {/* Notes */}
            {notes.map(note => (
                <div
                    key={note.id}
                    className="absolute bg-white/50 rounded-[1px]"
                    style={{
                        left: toMap(note.x, bounds.minX),
                        top: toMap(note.y, bounds.minY),
                        width: Math.max(2, 200 * finalScale),
                        height: Math.max(2, 200 * finalScale),
                        backgroundColor: note.color === 'white' ? '#fff' : note.color // Simple color map if needed
                    }}
                />
            ))}

            {/* Viewport Indicator */}
            <div
                className="absolute border-2 border-purple-500 rounded-sm pointer-events-none"
                style={{
                    left: toMap(vpX, bounds.minX),
                    top: toMap(vpY, bounds.minY),
                    width: vpW * finalScale,
                    height: vpH * finalScale,
                }}
            />
        </div>
    );
};
