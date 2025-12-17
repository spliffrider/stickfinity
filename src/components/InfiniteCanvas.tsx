"use client";

import React, { useState, useRef, useEffect } from "react";
import { Database } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import StickyNote, { NOTE_COLORS } from "./StickyNote";
import { Plus, Minus, Link as LinkIcon, MousePointer2, Share2, X } from "lucide-react";
import { Cursor } from "./Cursor";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Minimap } from "./Minimap";
import { ConnectionLines } from "./ConnectionLines";
import clsx from "clsx";
import { v4 as uuidv4 } from 'uuid';

type Note = Database["public"]["Tables"]["notes"]["Row"];

interface InfiniteCanvasProps {
    initialNotes: Note[];
    boardId: string;
    userId: string;
    onShare?: () => void;
}

interface CursorData {
    x: number;
    y: number;
    color: string;
    userId: string;
}

export default function InfiniteCanvas({ initialNotes, boardId, userId, onShare }: InfiniteCanvasProps) {
    const [notes, setNotes] = useState<Note[]>(initialNotes);
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const [isConnectionMode, setIsConnectionMode] = useState(false);
    const [dragInfo, setDragInfo] = useState<{ noteId: string; startX: number; startY: number; initialNoteX: number; initialNoteY: number } | null>(null);
    const [cursors, setCursors] = useState<Record<string, CursorData>>({});
    const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1, width: 1000, height: 1000 });

    // Color State
    const [activeColor, setActiveColor] = useState<string>('yellow');
    const [creationMenuPosition, setCreationMenuPosition] = useState<{ x: number, y: number } | null>(null);

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
                        setConnections((prev) => {
                            if (prev.find(c => c.id === payload.new.id)) return prev;
                            return [...prev, payload.new as any];
                        });
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
        // e.preventDefault();
        // React synthetic event doesn't allow preventDefault on wheel in some browsers nicely if passive
        // But for Next.js it works usually. 
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

    const handleMouseDown = async (e: React.MouseEvent) => {
        // Clear menus on click
        if (e.target === containerRef.current) {
            setCreationMenuPosition(null);
        }

        // Check modifiers for Zoom/Pan vs Drag
        if (e.ctrlKey || e.metaKey) {
            setIsPanning(true);
            return;
        }

        // Connection Mode Logic
        if (e.shiftKey || isConnectionMode) {
            const target = e.target as HTMLElement;
            const noteElement = target.closest('[data-note-id]');

            // Case 1: We are already wiring and clicked something
            if (activeConnection) {
                if (noteElement) {
                    const targetNoteId = noteElement.getAttribute('data-note-id');
                    if (targetNoteId && targetNoteId !== activeConnection.startNoteId) {
                        const fromId = activeConnection.startNoteId;
                        const toId = targetNoteId;

                        // Clear active connection immediately
                        setActiveConnection(null);

                        // Optimistic Update
                        const newId = uuidv4();
                        const newConnection = {
                            id: newId,
                            board_id: boardId,
                            from_note_id: fromId,
                            to_note_id: toId,
                            created_at: new Date().toISOString()
                        };
                        setConnections(prev => [...prev, newConnection as any]);

                        // Finish Connection
                        const { error } = await (supabase.from('connections') as any).insert({
                            id: newId,
                            board_id: boardId,
                            from_note_id: fromId,
                            to_note_id: toId
                        });

                        if (error) {
                            console.error('Error creating connection:', error);
                            setConnections(prev => prev.filter(c => c.id !== newId));
                            alert('Failed to save connection: ' + error.message);
                        }

                        return;
                    }
                }
                setActiveConnection(null);
                return;
            }

            // Case 2: Start new wiring
            if (noteElement) {
                const noteId = noteElement.getAttribute('data-note-id');
                const note = notes.find(n => n.id === noteId);
                if (note && noteId) {
                    const canvasX = (e.clientX - transform.x) / transform.scale;
                    const canvasY = (e.clientY - transform.y) / transform.scale;

                    setActiveConnection({
                        startNoteId: noteId,
                        startX: note.x + 100,
                        startY: note.y + 100,
                        currentX: canvasX,
                        currentY: canvasY
                    });
                    e.preventDefault();
                    return;
                }
            }
        }

        // Standard Note Dragging
        const target = e.target as HTMLElement;
        const noteElement = target.closest('[data-note-id]');

        if (noteElement) {
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
            setIsPanning(true);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const now = Date.now();
        if (now - lastCursorUpdate.current > 30) {
            lastCursorUpdate.current = now;
            const canvasX = (e.clientX - transform.x) / transform.scale;
            const canvasY = (e.clientY - transform.y) / transform.scale;
            if (channelRef.current) {
                channelRef.current.track({
                    userId,
                    x: canvasX,
                    y: canvasY,
                    color: myColor.current
                });
            }
        }

        if (activeConnection) {
            const canvasX = (e.clientX - transform.x) / transform.scale;
            const canvasY = (e.clientY - transform.y) / transform.scale;
            setActiveConnection(prev => prev ? ({ ...prev, currentX: canvasX, currentY: canvasY }) : null);
        }

        if (isPanning) {
            setTransform(prev => ({
                ...prev,
                x: prev.x + e.movementX,
                y: prev.y + e.movementY
            }));
        } else if (dragInfo) {
            const dx = (e.clientX - dragInfo.startX) / transform.scale;
            const dy = (e.clientY - dragInfo.startY) / transform.scale;
            const newX = dragInfo.initialNoteX + dx;
            const newY = dragInfo.initialNoteY + dy;
            setNotes(prev => prev.map(n => n.id === dragInfo.noteId ? { ...n, x: newX, y: newY } : n));
        }
    };

    const handleMouseUp = async (e: React.MouseEvent) => {
        setIsPanning(false);

        if (activeConnection) {
            const target = e.target as HTMLElement;
            const noteElement = target.closest('[data-note-id]');

            // If released over a DIFFERENT note, we finish (Drag-Drop style)
            if (noteElement) {
                const targetNoteId = noteElement.getAttribute('data-note-id');

                if (targetNoteId && targetNoteId !== activeConnection.startNoteId) {
                    // Optimistic Update
                    const newId = uuidv4();
                    const newConnection = {
                        id: newId,
                        board_id: boardId,
                        from_note_id: activeConnection.startNoteId,
                        to_note_id: targetNoteId,
                        created_at: new Date().toISOString()
                    };
                    setConnections(prev => [...prev, newConnection as any]);

                    const { error } = await (supabase.from('connections') as any).insert({
                        id: newId,
                        board_id: boardId,
                        from_note_id: activeConnection.startNoteId,
                        to_note_id: targetNoteId
                    });

                    if (error) {
                        console.error('Error creating connection:', error);
                        setConnections(prev => prev.filter(c => c.id !== newId));
                        alert('DB Error: ' + error.message);
                    }

                    setActiveConnection(null);
                    return;
                }
            }

            // Drag dropped in empty space or same note?
            if (!isConnectionMode) {
                setActiveConnection(null);
            }
        }

        if (dragInfo) {
            const note = notes.find(n => n.id === dragInfo.noteId);
            if (note) {
                await (supabase.from('notes') as any).update({ x: note.x, y: note.y }).eq('id', note.id);
            }
            setDragInfo(null);
        }
    };

    const handleCreateNote = async (x: number, y: number, color?: string) => {
        setCreationMenuPosition(null);

        const tX = transform.x || 0;
        const tY = transform.y || 0;
        const tScale = transform.scale || 1;

        // Determine creation coordinates
        // If x,y passed are screen coordinates (from mouse event), transform them.
        let canvasX = (x - tX) / tScale;
        let canvasY = (y - tY) / tScale;

        // Nan Check
        if (isNaN(canvasX)) canvasX = 0;
        if (isNaN(canvasY)) canvasY = 0;

        const { data, error } = await (supabase.from('notes') as any).insert({
            board_id: boardId,
            author_id: userId,
            content: { text: "" },
            x: canvasX - 100, // Center note
            y: canvasY - 100,
            color: color || activeColor // Use passed color or active HUD color
        }).select().single();

        if (error) {
            console.error('Error creating note:', error);
            alert(`Failed to create note: ${error.message}`);
        } else if (data) {
            setNotes(prev => {
                if (prev.find(n => n.id === data.id)) return prev;
                return [...prev, data as Note];
            });
        }
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        // Only trigger if clicking background
        if (e.target === containerRef.current) {
            setCreationMenuPosition({ x: e.clientX, y: e.clientY });
        }
    };

    const handleUpdateNote = async (id: string, updates: Partial<Note>) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
        const { error } = await (supabase.from('notes') as any).update(updates).eq('id', id);
        if (error) {
            console.error('Error updating note:', error);
        }
    };

    const handleDeleteNote = async (id: string) => {
        const { error } = await (supabase.from('notes') as any).delete().eq('id', id);
        if (error) console.error('Error deleting note:', error);
    };

    return (
        <div
            className={`relative w-full h-full overflow-hidden bg-transparent ${isConnectionMode ? 'cursor-crosshair' : 'cursor-move'}`}
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
                        name={undefined}
                    />
                ))}

                {notes.map(note => (
                    <StickyNote
                        key={note.id}
                        note={note}
                        onUpdate={handleUpdateNote}
                        onDelete={handleDeleteNote}
                        scale={transform.scale}
                        isConnecting={isConnectionMode || !!activeConnection}
                    />
                ))}
            </div>

            {/* Creation Menu (Double Click) */}
            {creationMenuPosition && (
                <div
                    className="absolute z-50 animate-in fade-in zoom-in duration-200"
                    style={{ left: creationMenuPosition.x, top: creationMenuPosition.y, transform: 'translate(-50%, -50%)' }}
                >
                    <div className="bg-black/60 backdrop-blur-xl p-3 rounded-full flex gap-2 border border-white/10 shadow-2xl">
                        {Object.entries(NOTE_COLORS).map(([key, classes]) => (
                            <button
                                key={key}
                                className={clsx(
                                    "w-8 h-8 rounded-full border-2 border-transparent hover:scale-125 transition-transform hover:border-white shadow-lg",
                                    classes.split(' ')[0]
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCreateNote(creationMenuPosition.x, creationMenuPosition.y, key);
                                }}
                            />
                        ))}
                        <button
                            onClick={() => setCreationMenuPosition(null)}
                            className="bg-white/10 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-white/20 ml-2"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Minimap */}
            <Minimap
                notes={notes}
                viewport={viewport}
                onNavigate={(x, y) => setTransform(prev => ({ ...prev, x, y }))}
            />

            {/* HUD / Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 pointer-events-none z-50">

                {/* Tools */}
                <div className="glass-panel p-2 rounded-full flex gap-2 pointer-events-auto shadow-2xl bg-black/50 backdrop-blur-xl border border-white/10">
                    <button
                        className={`p-3 rounded-full transition-all ${!isConnectionMode ? 'bg-indigo-600 text-white shadow-glow' : 'hover:bg-white/10 text-gray-400'}`}
                        onClick={() => setIsConnectionMode(false)}
                        title="Move / Select"
                    >
                        <MousePointer2 size={20} />
                    </button>
                    <button
                        className={`p-3 rounded-full transition-all ${isConnectionMode ? 'bg-cyan-500 text-white shadow-glow' : 'hover:bg-white/10 text-gray-400'}`}
                        onClick={() => setIsConnectionMode(true)}
                        title="Connect Notes"
                    >
                        <LinkIcon size={20} />
                    </button>
                </div>

                {/* divider */}
                <div className="w-px h-8 bg-white/10"></div>

                {/* Zoom Controls */}
                <div className="glass-panel p-2 rounded-full flex items-center gap-2 pointer-events-auto bg-black/50 backdrop-blur-xl border border-white/10">
                    <button
                        className="p-3 hover:bg-white/10 rounded-full text-white transition-colors"
                        onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(0.1, prev.scale - 0.1) }))}
                    >
                        <Minus size={20} />
                    </button>
                    <span className="w-16 text-center font-mono text-sm text-gray-300 select-none cursor-pointer"
                        onClick={() => setTransform(prev => ({ ...prev, scale: 1 }))}
                        title="Reset Zoom"
                    >
                        {Math.round(transform.scale * 100)}%
                    </span>
                    <button
                        className="p-3 hover:bg-white/10 rounded-full text-white transition-colors"
                        onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(5, prev.scale + 0.1) }))}
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* divider */}
                <div className="w-px h-8 bg-white/10"></div>

                {/* Create Note Group */}
                <div className="glass-panel p-1.5 rounded-full flex gap-3 items-center pointer-events-auto bg-black/50 backdrop-blur-xl border border-white/10 pr-1.5">
                    {/* Color Picker (Compact) */}
                    <div className="flex gap-1 pl-2">
                        {Object.entries(NOTE_COLORS).map(([key, classes]) => (
                            <button
                                key={key}
                                className={clsx(
                                    "w-5 h-5 rounded-full transition-transform hover:scale-125 box-content border border-transparent",
                                    classes.split(' ')[0],
                                    activeColor === key ? "scale-125 border-white ring-2 ring-white/20 shadow-lg" : "opacity-70 hover:opacity-100"
                                )}
                                onClick={() => setActiveColor(key)}
                                title={key}
                            />
                        ))}
                    </div>

                    <div className="w-px h-6 bg-white/10 mx-1"></div>

                    <button
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full p-3 shadow-lg transition-transform hover:scale-110 active:scale-95 border border-white/20"
                        onClick={() => handleCreateNote(window.innerWidth / 2, window.innerHeight / 2)}
                        title="Add Sticky Note"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Share Button (New Position) */}
                {onShare && (
                    <button
                        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-4 shadow-lg pointer-events-auto transition-transform hover:scale-110 active:scale-95 border border-white/20"
                        onClick={onShare}
                        title="Share Board"
                    >
                        <Share2 size={24} />
                    </button>
                )}
            </div>
        </div>
    );
}
