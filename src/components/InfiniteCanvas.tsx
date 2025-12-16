"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Database } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import StickyNote from "./StickyNote";
import { Plus } from "lucide-react";
import { Cursor } from "./Cursor";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Minimap } from "./Minimap";
import { ConnectionLines } from "./ConnectionLines";

type Note = Database["public"]["Tables"]["notes"]["Row"];

interface InfiniteCanvasProps {
    initialNotes: Note[];
    boardId: string;
    userId: string;
}

interface CursorData {
    x: number;
    y: number;
    color: string;
    userId: string;
}

export default function InfiniteCanvas({ initialNotes, boardId, userId }: InfiniteCanvasProps) {
    const [notes, setNotes] = useState<Note[]>(initialNotes);
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const [dragInfo, setDragInfo] = useState<{ noteId: string; startX: number; startY: number; initialNoteX: number; initialNoteY: number } | null>(null);
    const [cursors, setCursors] = useState<Record<string, CursorData>>({});
    const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1, width: 1000, height: 1000 });

    // State for Connections
    const [connections, setConnections] = useState<Database["public"]["Tables"]["connections"]["Row"][]>([]);
    const [activeConnection, setActiveConnection] = useState<{ startX: number; startY: number; currentX: number; currentY: number; startNoteId: string } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const lastCursorUpdate = useRef(0);
    const myColor = useRef('#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));

    useEffect(() => {
        const handleResize = () => {
            setViewport({
                x: transform.x,
                y: transform.y,
                scale: transform.scale,
                width: window.innerWidth,
                height: window.innerHeight
            });
        }
        window.addEventListener('resize', handleResize);
        handleResize(); // Init
        return () => window.removeEventListener('resize', handleResize);
    }, [transform]);

    // Fetch initial connections
    useEffect(() => {
        const fetchConnections = async () => {
            const { data } = await supabase.from('connections').select('*').eq('board_id', boardId);
            if (data) setConnections(data);
        };
        fetchConnections();
    }, [boardId]);

    // Subscribe to Realtime changes & Presence
    useEffect(() => {
        const channel = supabase.channel(`board-${boardId}`)
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
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'connections',
                    filter: `board_id=eq.${boardId}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setConnections((prev) => [...prev, payload.new as any]); // Type cast for simplicity
                    } else if (payload.eventType === 'DELETE') {
                        setConnections((prev) => prev.filter(c => c.id !== payload.old.id));
                    }
                }
            )
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const newCursors: Record<string, CursorData> = {};
                for (const key in newState) {
                    const userCursors = newState[key] as any[];
                    // Allow multiple devices per user, or just take last. 
                    // Supabase presence is array of objects.
                    userCursors.forEach(cursor => {
                        if (cursor.userId && cursor.userId !== userId) {
                            newCursors[cursor.userId] = cursor;
                        }
                    });
                }
                setCursors(newCursors);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        userId,
                        x: 0,
                        y: 0,
                        color: myColor.current,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [boardId, userId]);

    // Global Paste Listener for Images
    useEffect(() => {
        const handlePaste = async (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            // Convert to array to iterate safely
            const itemsArray = Array.from(items);

            for (const item of itemsArray) {
                if (item.type.indexOf("image") === 0) {
                    const blob = item.getAsFile();
                    if (!blob) continue;

                    // 1. Upload to Supabase Storage
                    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${blob.name.split('.').pop() || 'png'}`;
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('board-assets')
                        .upload(filename, blob);

                    if (uploadError) {
                        console.error('Error uploading image:', uploadError);
                        alert('Failed to upload image: ' + uploadError.message);
                        continue;
                    }

                    // 2. Get Public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('board-assets')
                        .getPublicUrl(filename);

                    // 3. Create Note with Image
                    // Center of screen relative to canvas
                    const centerX = (window.innerWidth / 2 - transform.x) / transform.scale;
                    const centerY = (window.innerHeight / 2 - transform.y) / transform.scale;

                    const { error: insertError } = await (supabase.from('notes') as any).insert({
                        board_id: boardId,
                        author_id: userId,
                        content: { type: 'image', url: publicUrl },
                        x: centerX - 100,
                        y: centerY - 100,
                        color: 'white' // Images often look better on white
                    });

                    if (insertError) console.error('Error creating image note:', insertError);
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [boardId, userId, transform]);

    // Canvas Interactions
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
            // Zoom
            const zoomSensitivity = 0.001;
            const newScale = Math.min(Math.max(0.1, transform.scale - e.deltaY * zoomSensitivity), 5);
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
        // Check modifiers for Zoom/Pan vs Drag
        if (e.ctrlKey || e.metaKey) {
            // Let handleWheel / others handle zoom, or panning
            setIsPanning(true);
            return;
        }

        // Check for Connection Mode (Shift Click)
        if (e.shiftKey) {
            const target = e.target as HTMLElement;
            const noteElement = target.closest('[data-note-id]');
            if (noteElement) {
                const noteId = noteElement.getAttribute('data-note-id');
                const note = notes.find(n => n.id === noteId);
                if (note && noteId) {
                    const canvasX = (e.clientX - transform.x) / transform.scale;
                    const canvasY = (e.clientY - transform.y) / transform.scale;

                    // Start line from center of the note
                    setActiveConnection({
                        startNoteId: noteId,
                        startX: note.x + 100,
                        startY: note.y + 100,
                        currentX: canvasX,
                        currentY: canvasY
                    });
                    e.preventDefault(); // Stop text selection
                    return;
                }
            }
        }

        // Standard Note Dragging
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
        // Broadcast Cursor
        const now = Date.now();
        if (now - lastCursorUpdate.current > 30) {
            lastCursorUpdate.current = now;
            const canvasX = (e.clientX - transform.x) / transform.scale;
            const canvasY = (e.clientY - transform.y) / transform.scale;

            if (channelRef.current) {
                // We optimize by not awaiting this
                channelRef.current.track({
                    userId,
                    x: canvasX,
                    y: canvasY,
                    color: myColor.current
                });
            }
        }

        if (activeConnection) {
            // Update temporary connection line
            const canvasX = (e.clientX - transform.x) / transform.scale;
            const canvasY = (e.clientY - transform.y) / transform.scale;
            setActiveConnection(prev => prev ? ({ ...prev, currentX: canvasX, currentY: canvasY }) : null);
            return;
        }

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

    const handleMouseUp = async (e: React.MouseEvent) => {
        setIsPanning(false);

        if (activeConnection) {
            // Finish Connection
            const target = e.target as HTMLElement;
            const noteElement = target.closest('[data-note-id]');

            if (noteElement) {
                const targetNoteId = noteElement.getAttribute('data-note-id');
                // Create connection if different notes
                if (targetNoteId && targetNoteId !== activeConnection.startNoteId) {
                    await (supabase.from('connections') as any).insert({
                        board_id: boardId,
                        from_note_id: activeConnection.startNoteId,
                        to_note_id: targetNoteId
                    });
                }
            }
            setActiveConnection(null);
        }

        if (dragInfo) {
            // Save final position to DB
            const note = notes.find(n => n.id === dragInfo.noteId);
            if (note) {
                const { error } = await (supabase.from('notes') as any).update({ x: note.x, y: note.y }).eq('id', note.id);
            }
            setDragInfo(null);
        }
    };

    const handleCreateNote = async (x: number, y: number) => {
        const tX = transform.x || 0;
        const tY = transform.y || 0;
        const tScale = transform.scale || 1;

        console.log('Creating note at:', { x, y, tX, tY, tScale });

        // Create at screen center or mouse position relative to canvas
        // Correct for transform
        let canvasX = (x - tX) / tScale;
        let canvasY = (y - tY) / tScale;

        // Nan Check (Should be impossible now, but good to keep)
        if (isNaN(canvasX)) {
            canvasX = 0;
        }
        if (isNaN(canvasY)) {
            canvasY = 0;
        }

        const { error } = await (supabase.from('notes') as any).insert({
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
        const { error } = await (supabase.from('notes') as any).update(updates).eq('id', id);
        if (error) console.error('Error updating note:', error);
    };

    const handleDeleteNote = async (id: string) => {
        const { error } = await (supabase.from('notes') as any).delete().eq('id', id);
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
                {/* Connections Layer */}
                <ConnectionLines
                    connections={connections}
                    notes={notes}
                    activeConnection={activeConnection}
                />

                {/* Remote Cursors */}
                {Object.values(cursors).map(cursor => (
                    <Cursor
                        key={cursor.userId}
                        x={cursor.x}
                        y={cursor.y}
                        color={cursor.color}
                        name={undefined} // We could pass email if we had it
                    />
                ))}

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

            {/* Minimap */}
            <Minimap
                notes={notes}
                viewport={viewport}
                onNavigate={(x, y) => setTransform(prev => ({ ...prev, x, y }))}
            />

            {/* HUD / Controls */}
            <div className="absolute bottom-8 right-8 flex gap-4 pointer-events-none" style={{ right: '200px' }}> {/* Adjusted right position to not overlap minimap */}
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
