
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Database } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import { X, Check } from "lucide-react";
import clsx from "clsx";

type Note = Database["public"]["Tables"]["notes"]["Row"];

interface StickyNoteProps {
    note: Note;
    onUpdate: (id: string, updates: Partial<Note>) => void;
    onDelete: (id: string) => void;
    scale: number;
}

const COLORS = {
    yellow: "bg-yellow-200/80 border-yellow-300",
    pink: "bg-pink-200/80 border-pink-300",
    blue: "bg-blue-200/80 border-blue-300",
    green: "bg-green-200/80 border-green-300",
    orange: "bg-orange-200/80 border-orange-300",
    purple: "bg-purple-200/80 border-purple-300",
} as const;

export default function StickyNote({ note, onUpdate, onDelete, scale }: StickyNoteProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(note.content as { text?: string } || { text: "" });
    const noteRef = useRef<HTMLDivElement>(null);

    // Sync state with prop if note updates from outside (e.g. realtime)
    useEffect(() => {
        // Only sync if NOT editing to avoid overwriting user input
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
                onUpdate(note.id, { content: { text: currentText } });
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [content, note.content, note.id, onUpdate]);

    const handleBlur = () => {
        setIsEditing(false);
    };

    const colorClass = COLORS[note.color as keyof typeof COLORS] || COLORS.yellow;

    return (
        <div
            ref={noteRef}
            className={clsx(
                "absolute p-4 rounded-lg shadow-lg backdrop-blur-sm border transition-shadow cursor-grab active:cursor-grabbing",
                colorClass,
                isEditing && "ring-2 ring-white cursor-text",
                isDragging && "opacity-80 scale-105 z-50 shadow-2xl"
            )}
            style={{
                left: note.x,
                top: note.y,
                width: 200,
                minHeight: 200,
                // Scale is handled by parent container transform, but we might want to scale text if needed
                // For now, let CSS transform on parent handle it
            }}
            onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
            }}
            // Start drag handled by parent to coordinate mouse movement to canvas scale
            data-note-id={note.id}
        >
            <div className="flex justify-end mb-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this note?")) {
                            onDelete(note.id);
                        }
                    }}
                    className="p-1.5 bg-black/20 hover:bg-red-500/80 rounded-full text-white transition-colors"
                    title="Delete Note"
                >
                    <X size={14} className="text-white" />
                </button>
            </div>

            {isEditing ? (
                <textarea
                    autoFocus
                    className="w-full h-full bg-transparent resize-none border-none focus:ring-0 outline-none text-gray-800"
                    value={content.text || ""}
                    onChange={(e) => setContent({ ...content, text: e.target.value })}
                    onBlur={handleBlur}
                    onMouseDown={(e) => e.stopPropagation()} // Prevent drag when interacting with text
                />
            ) : (
                <div className="w-full h-full text-gray-800 select-none pointer-events-none">
                    {(content as any).type === 'image' && (content as any).url ? (
                        <img
                            src={(content as any).url}
                            alt="Note attachment"
                            className="w-full h-full object-cover rounded-md pointer-events-none"
                            draggable={false}
                        />
                    ) : (
                        <div className="whitespace-pre-wrap">
                            {content.text || "Double click to edit..."}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
