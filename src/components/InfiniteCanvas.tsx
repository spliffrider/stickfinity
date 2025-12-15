
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Database } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import StickyNote from "./StickyNote";
import { Plus } from "lucide-react";

type Note = Database["public"]["Tables"]["notes"]["Row"];

interface InfiniteCanvasProps {
    initialNotes: Note[];
    boardId: string;
    userId: string;
}

export default function InfiniteCanvas({ initialNotes, boardId, userId }: InfiniteCanvasProps) {
    const [notes, setNotes] = useState<Note[]>(initialNotes);
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const [dragInfo, setDragInfo] = useState<{ noteId: string; startX: number; startY: number; initialNoteX: number; initialNoteY: number } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    // Subscribe to Realtime changes
    useEffect(() => {
        const channel = supabase
            .channel('realtime-notes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notes',
                    filter: `board_id=eq.${boardId}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setNotes((prev) => [...prev, payload.new as Note]);
                    } else if (payload.eventType === 'UPDATE') {
                        setNotes((prev) => prev.map(n => n.id === payload.new.id ? payload.new as Note : n));
                    } else if (payload.eventType === 'DELETE') {
                        setNotes((prev) => prev.filter(n => n.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [boardId]);

    // Canvas Interactions
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
            // Zoom
            const zoomSensitivity = 0.001;
            const newScale = Math.min(Math.max(0.1, transform.scale - e.deltaY * zoomSensitivity), 5);

            // Zoom towards mouse pointer logic would go here (simplified for center zoom now)
            setTransform(prev => ({ ...prev, scale: newScale }));
        } else {
            // Pan
            setTransform(prev => ({
                ...prev,
                x: prev.x - e.deltaX,
                y: prev.y - e.deltaY
            }));
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        // Check if clicking on a note (handled via data attributes to avoid prop drilling dragging logic too deep if simplified)
        const target = e.target as HTMLElement;
        const noteElement = target.closest('[data-note-id]');

        if (noteElement) {
            // Start dragging note
            const noteId = noteElement.getAttribute('data-note-id');
            const note = notes.find(n => n.id === noteId);
            if (note && noteId) {
                setDragInfo({
                    noteId,
                    startX: e.clientX,
                    startY: e.clientY,
                    initialNoteX: note.x,
                    initialNoteY: note.y
                });
            }
        } else {
            // Start panning canvas
            setIsPanning(true);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            setTransform(prev => ({
                ...prev,
                x: prev.x + e.movementX,
                y: prev.y + e.movementY
            }));
        } else if (dragInfo) {
            // Move Note
            const dx = (e.clientX - dragInfo.startX) / transform.scale;
            const dy = (e.clientY - dragInfo.startY) / transform.scale;

            const newX = dragInfo.initialNoteX + dx;
            const newY = dragInfo.initialNoteY + dy;

            // Optimistic update
            setNotes(prev => prev.map(n => n.id === dragInfo.noteId ? { ...n, x: newX, y: newY } : n));
        }
    };

    const handleMouseUp = async () => {
        setIsPanning(false);
        if (dragInfo) {
            // Save final position to DB
            const note = notes.find(n => n.id === dragInfo.noteId);
            if (note) {
                await supabase.from('notes').update({ x: note.x, y: note.y }).eq('id', note.id);
            }
            setDragInfo(null);
        }
    };

    const handleCreateNote = async (x: number, y: number) => {
        // Create at screen center or mouse position relative to canvas
        // Correct for transform
        const canvasX = (x - transform.x) / transform.scale;
        const canvasY = (y - transform.y) / transform.scale;

        const { error } = await supabase.from('notes').insert({
            board_id: boardId,
            author_id: userId,
            content: { text: "" },
            x: canvasX - 100, // Center note
            y: canvasY - 100,
            color: 'yellow' // Default
        });

        if (error) console.error('Error creating note:', error);
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        // Only create if clicking background
        if (e.target === containerRef.current) {
            handleCreateNote(e.clientX, e.clientY);
        }
    };

    const handleUpdateNote = async (id: string, updates: Partial<Note>) => {
        const { error } = await supabase.from('notes').update(updates).eq('id', id);
        if (error) console.error('Error updating note:', error);
    };

    const handleDeleteNote = async (id: string) => {
        const { error } = await supabase.from('notes').delete().eq('id', id);
        if (error) console.error('Error deleting note:', error);
    };

    return (
        <div
            className="relative w-full h-full overflow-hidden cursor-move bg-transparent"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            ref={containerRef}
        >
            <div
                className="absolute origin-top-left transition-transform duration-75 ease-out"
                style={{
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`
                }}
            >
                {notes.map(note => (
                    <StickyNote
                        key={note.id}
                        note={note}
                        onUpdate={handleUpdateNote}
                        onDelete={handleDeleteNote}
                        scale={transform.scale}
                    />
                ))}
            </div>

            {/* HUD / Controls */}
            <div className="absolute bottom-8 right-8 flex gap-4 pointer-events-none">
                <div className="bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-full pointer-events-auto">
                    Zoom: {Math.round(transform.scale * 100)}%
                </div>
                <button
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg pointer-events-auto transition-transform hover:scale-110 active:scale-95"
                    onClick={() => handleCreateNote(window.innerWidth / 2, window.innerHeight / 2)}
                >
                    <Plus size={24} />
                </button>
            </div>
        </div>
    );
}
