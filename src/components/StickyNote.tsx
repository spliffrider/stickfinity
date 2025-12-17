
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Database } from "@/lib/database.types";
import { X, Palette } from "lucide-react";
import clsx from "clsx";

type Note = Database["public"]["Tables"]["notes"]["Row"];

interface StickyNoteProps {
    note: Note;
    onUpdate: (id: string, updates: Partial<Note>) => void;
    onDelete: (id: string) => void;
    scale: number;
    isConnecting?: boolean;
}

// Glassmorphism Neon Palette
export const NOTE_COLORS = {
    yellow: "bg-yellow-400/80 border-yellow-300/50 shadow-yellow-500/20",
    pink: "bg-pink-500/80 border-pink-400/50 shadow-pink-500/20",
    orange: "bg-orange-500/80 border-orange-400/50 shadow-orange-500/20",
    green: "bg-lime-500/80 border-lime-400/50 shadow-lime-500/20",
    blue: "bg-cyan-400/80 border-cyan-300/50 shadow-cyan-500/20",
    purple: "bg-purple-500/80 border-purple-400/50 shadow-purple-500/20",
} as const;

export default function StickyNote({ note, onUpdate, onDelete, scale, isConnecting }: StickyNoteProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [content, setContent] = useState(note.content as { text?: string } || { text: "" });
    const noteRef = useRef<HTMLDivElement>(null);

    // Sync state with prop if note updates from outside (e.g. realtime)
    useEffect(() => {
        if (!isEditing) {
            setContent(note.content as { text?: string } || { text: "" });
        }
    }, [note.content, isEditing]);

    // Autosave on content change (debounced)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const currentText = content.text || "";
            const originalText = (note.content as { text?: string })?.text || "";

            if (currentText !== originalText) {
                onUpdate(note.id, {
                    content: {
                        ...((note.content as object) || {}),
                        text: currentText
                    }
                });
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [content, note.content, note.id, onUpdate]);

    const handleBlur = () => {
        setIsEditing(false);
    };

    const colorClass = NOTE_COLORS[note.color as keyof typeof NOTE_COLORS] || NOTE_COLORS.yellow;

    return (
        <div
            ref={noteRef}
            className={clsx(
                "absolute p-4 rounded-xl transition-all duration-200 ease-out",
                // Glassmorphism Core
                "backdrop-blur-md border border-t-white/30 border-l-white/20 border-r-black/10 border-b-black/20",
                // 3D & Interaction
                isConnecting ? "cursor-crosshair ring-2 ring-cyan-400/50" : "cursor-grab active:cursor-grabbing",
                colorClass,
                isEditing && "ring-2 ring-white/50 cursor-text scale-105 z-40",
                isDragging ? "scale-110 z-50 shadow-2xl rotate-2" : "hover:scale-105 hover:-translate-y-1 hover:shadow-xl hover:z-30",
                // Base Shadow
                "shadow-lg"
            )}
            style={{
                left: note.x,
                top: note.y,
                width: 200,
                minHeight: 200,
            }}
            onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
            }}
            data-note-id={note.id}
            onMouseLeave={() => setShowColorPicker(false)}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
        >
            {/* Inner Highlight for Depth */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

            <div className="flex justify-between items-start mb-2 opacity-0 hover:opacity-100 transition-opacity relative z-10">
                {/* Color Picker Toggle */}
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowColorPicker(!showColorPicker);
                        }}
                        className="p-1.5 bg-black/20 hover:bg-black/40 rounded-full text-white/70 hover:text-white transition-colors backdrop-blur-sm"
                        title="Change Color"
                    >
                        <Palette size={14} />
                    </button>

                    {showColorPicker && (
                        <div className="absolute top-full left-0 mt-2 p-2 bg-black/60 backdrop-blur-xl rounded-lg shadow-xl flex gap-1 z-[60] border border-white/10 w-max"
                            onMouseDown={e => e.stopPropagation()}
                        >
                            {Object.entries(NOTE_COLORS).map(([colorKey, classes]) => (
                                <button
                                    key={colorKey}
                                    className={clsx(
                                        "w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition-transform shadow-lg",
                                        classes.split(' ')[0] // Get bg class
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onUpdate(note.id, { color: colorKey });
                                        setShowColorPicker(false);
                                    }}
                                    title={colorKey}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this note?")) {
                            onDelete(note.id);
                        }
                    }}
                    className="p-1.5 bg-black/20 hover:bg-red-500/80 hover:text-white rounded-full text-white/70 transition-colors backdrop-blur-sm"
                    title="Delete Note"
                >
                    <X size={14} />
                </button>
            </div>

            {isEditing ? (
                <textarea
                    autoFocus
                    className="w-full h-full bg-transparent resize-none border-none focus:ring-0 outline-none text-white placeholder-white/50 text-3xl font-medium drop-shadow-md relative z-10 leading-tight"
                    placeholder="Type a note..."
                    value={content.text || ""}
                    onChange={(e) => setContent({ ...content, text: e.target.value })}
                    onBlur={handleBlur}
                    onMouseDown={(e) => e.stopPropagation()}
                />
            ) : (
                <div className="w-full h-full text-white select-none pointer-events-none font-medium text-3xl drop-shadow-md relative z-10 leading-tight">
                    {(content as any).type === 'image' && (content as any).url ? (
                        <img
                            src={(content as any).url}
                            alt="Note attachment"
                            className="w-full h-full object-cover rounded-md pointer-events-none"
                            draggable={false}
                        />
                    ) : (
                        <div className="whitespace-pre-wrap break-words">
                            {content.text || ""}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
