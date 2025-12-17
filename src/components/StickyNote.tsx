
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

// Vibrant "Neon Standard" Palette
export const NOTE_COLORS = {
    yellow: "bg-yellow-300 border-yellow-400 selection:bg-yellow-500/30",
    pink: "bg-pink-400 border-pink-500 selection:bg-pink-600/30",
    orange: "bg-orange-400 border-orange-500 selection:bg-orange-600/30",
    green: "bg-lime-400 border-lime-500 selection:bg-lime-600/30",
    blue: "bg-cyan-300 border-cyan-400 selection:bg-cyan-500/30",
    purple: "bg-purple-400 border-purple-500 selection:bg-purple-600/30",
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
                "absolute p-4 rounded-lg shadow-lg backdrop-blur-sm border transition-shadow",
                isConnecting ? "cursor-crosshair hover:ring-2 hover:ring-cyan-400 hover:shadow-cyan-400/50" : "cursor-grab active:cursor-grabbing",
                colorClass,
                isEditing && "ring-2 ring-white cursor-text",
                isDragging && "opacity-80 scale-105 z-50 shadow-2xl"
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
        >
            <div className="flex justify-between items-start mb-2 opacity-0 hover:opacity-100 transition-opacity">
                {/* Color Picker Toggle */}
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowColorPicker(!showColorPicker);
                        }}
                        className="p-1.5 bg-black/10 hover:bg-black/20 rounded-full text-black/50 hover:text-black transition-colors"
                        title="Change Color"
                    >
                        <Palette size={14} />
                    </button>

                    {showColorPicker && (
                        <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-lg shadow-xl flex gap-1 z-[60] border border-gray-100 w-max"
                            onMouseDown={e => e.stopPropagation()}
                        >
                            {Object.entries(NOTE_COLORS).map(([colorKey, classes]) => (
                                <button
                                    key={colorKey}
                                    className={clsx(
                                        "w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform",
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
                    className="p-1.5 bg-black/10 hover:bg-red-500 hover:text-white rounded-full text-black/50 transition-colors"
                    title="Delete Note"
                >
                    <X size={14} />
                </button>
            </div>

            {isEditing ? (
                <textarea
                    autoFocus
                    className="w-full h-full bg-transparent resize-none border-none focus:ring-0 outline-none text-gray-900 placeholder-gray-500/50"
                    placeholder="Type a note..."
                    value={content.text || ""}
                    onChange={(e) => setContent({ ...content, text: e.target.value })}
                    onBlur={handleBlur}
                    onMouseDown={(e) => e.stopPropagation()}
                />
            ) : (
                <div className="w-full h-full text-gray-900 select-none pointer-events-none font-medium">
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
