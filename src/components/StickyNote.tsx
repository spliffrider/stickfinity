"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Palette } from "lucide-react";
import { Database } from "@/lib/database.types";
import clsx from "clsx";

type Note = Database["public"]["Tables"]["notes"]["Row"];

interface StickyNoteProps {
    note: Note;
    onUpdate: (id: string, updates: Partial<Note>) => void;
    onDelete: (id: string) => void;
    scale: number;
    isConnecting?: boolean;
    isSelected?: boolean;
}

// RESTORED SPACE PALETTE
export const NOTE_COLORS = {
    yellow: "bg-yellow-400/80 border-yellow-300/50 shadow-yellow-500/20 text-white",
    pink: "bg-pink-500/80 border-pink-400/50 shadow-pink-500/20 text-white",
    orange: "bg-orange-500/80 border-orange-400/50 shadow-orange-500/20 text-white",
    green: "bg-lime-500/80 border-lime-400/50 shadow-lime-500/20 text-white",
    blue: "bg-cyan-400/80 border-cyan-300/50 shadow-cyan-500/20 text-white",
    purple: "bg-purple-500/80 border-purple-400/50 shadow-purple-500/20 text-white",
    white: "bg-white/10 border-white/20 shadow-white/10 text-white backdrop-blur-xl",
} as const;

export default function StickyNote({ note, onUpdate, onDelete, scale, isConnecting, isSelected }: StickyNoteProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

    // Robust parsing of content prop
    const safeParseContent = (rawContent: any) => {
        if (!rawContent) return { text: "" };
        if (typeof rawContent === 'string') {
            try {
                const parsed = JSON.parse(rawContent);
                return typeof parsed === 'object' ? parsed : { text: parsed };
            } catch {
                return { text: rawContent };
            }
        }
        return rawContent; // Already an object
    };

    const [content, setContent] = useState(safeParseContent(note.content));
    const noteRef = useRef<HTMLDivElement>(null);

    // Sync state with prop
    useEffect(() => {
        if (!isEditing) {
            setContent(safeParseContent(note.content));
        }
    }, [note.content, isEditing]);

    const saveNote = (text: string) => {
        const currentText = text || "";
        const originalContent = safeParseContent(note.content);
        const originalText = originalContent?.text || "";

        if (currentText !== originalText) {
            onUpdate(note.id, {
                content: {
                    ...(originalContent || {}),
                    text: currentText
                }
            });
        }
    };

    // Autosave
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            saveNote(content.text || "");
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [content, note.content, note.id, onUpdate]);

    const handleBlur = () => {
        saveNote(content.text || "");
        setIsEditing(false);
    };

    const colorClass = (NOTE_COLORS as any)[note.color] || NOTE_COLORS.white;

    return (
        <div
            ref={noteRef}
            className={clsx(
                "absolute transition-all duration-200 ease-out backdrop-blur-md border border-t-white/30 border-l-white/20 border-r-black/10 border-b-black/20 p-4 rounded-xl shadow-lg",
                isConnecting ? "cursor-crosshair ring-2 ring-emerald-400" : "cursor-grab active:cursor-grabbing",
                colorClass,
                isEditing && "ring-2 ring-emerald-400 cursor-text z-40 shadow-lg scale-105",
                isSelected && !isEditing && "ring-2 ring-red-400 shadow-[0_0_20px_rgba(248,113,113,0.5)]",
                isDragging ? "scale-105 z-50 shadow-xl rotate-1" : "hover:scale-[1.02] hover:z-30",
            )}
            style={{
                left: note.x,
                top: note.y,
                width: 220, // Slightly wider
                minHeight: 220,
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
            {/* Top Bar for Controls (Always visible) */}
            <div className="flex justify-between items-center mb-3 absolute top-2 right-2 left-2 z-20">
                {/* Color Picker Toggle */}
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowColorPicker(!showColorPicker);
                        }}
                        className="p-1.5 rounded-full transition-colors shadow-sm ring-1 bg-black/20 text-white/70 hover:bg-black/40 hover:text-white"
                        title="Change Color"
                    >
                        <Palette size={14} />
                    </button>

                    {showColorPicker && (
                        <div className="absolute top-full left-0 mt-2 p-2 rounded-xl shadow-xl flex gap-1 z-[60] w-max bg-black/60 backdrop-blur-xl border border-white/10"
                            onMouseDown={e => e.stopPropagation()}
                        >
                            {Object.entries(NOTE_COLORS).map(([colorKey, classes]) => (
                                <button
                                    key={colorKey}
                                    className={clsx(
                                        "w-6 h-6 rounded-full transition-transform hover:scale-110",
                                        (classes as string).split(' ')[0] // Get bg class
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
                    className="p-1.5 rounded-full transition-colors shadow-sm ring-1 bg-black/20 text-white/70 hover:bg-red-500/80 hover:text-white"
                    title="Delete Note"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Content Area */}
            {isEditing ? (
                <textarea
                    autoFocus
                    className="w-full h-full bg-transparent resize-none border-none focus:ring-0 outline-none placeholder-opacity-50 font-medium relative z-10 leading-tight text-white placeholder-white/50 text-3xl drop-shadow-md"
                    placeholder="Type a note..."
                    value={content.text || ""}
                    onChange={(e) => setContent({ ...content, text: e.target.value })}
                    onBlur={handleBlur}
                    onMouseDown={(e) => e.stopPropagation()}
                />
            ) : (
                <div className="w-full h-full select-none pointer-events-none font-medium relative z-10 leading-tight text-white text-3xl drop-shadow-md">
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
