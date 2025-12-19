
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SpaceBackground from "@/components/SpaceBackground";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import { Database } from "@/lib/database.types";

import { Share2, ArrowLeft } from "lucide-react";
import ShareBoardDialog from "@/components/ShareBoardDialog";

type Board = Database["public"]["Tables"]["boards"]["Row"];



export default function BoardPage() {
    const params = useParams();
    const router = useRouter();
    const boardId = params.boardId as string;
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [board, setBoard] = useState<Board | null>(null);
    const [notes, setNotes] = useState<Database['public']['Tables']['notes']['Row'][]>([]);

    // UI State
    const [isShareOpen, setIsShareOpen] = useState(false);

    const [accessDenied, setAccessDenied] = useState(false);

    useEffect(() => {
        const fetchBoardData = async () => {
            const { data } = await supabase.auth.getUser();
            const currentUser = data.user;
            setUser(currentUser); // Set user even if null

            // Fetch Board details to verify access (successful if public or owner/member)
            const { data: boardData, error: boardError } = await supabase
                .from("boards")
                .select("*")
                .eq("id", boardId)
                .single();

            // If board not found or access denied
            if (boardError || !boardData) {
                console.error("Board access denied or not found:", boardError);
                setAccessDenied(true);
                setLoading(false);
                return;
            }

            // Access granted
            setBoard(boardData);

            // Fetch Notes
            const { data: notesData } = await supabase
                .from("notes")
                .select("*")
                .eq("board_id", boardId);

            if (notesData) {
                setNotes(notesData);
            }

            setLoading(false);
        };

        if (boardId) {
            fetchBoardData();
        }
    }, [boardId, router]);

    if (loading) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-black text-white">
                <SpaceBackground />
                <div className="animate-pulse text-2xl font-light">Entering hyperspace...</div>
            </div>
        );
    }

    if (accessDenied) {
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center bg-black text-white">
                <SpaceBackground />
                <div className="text-center z-10">
                    <h1 className="text-4xl font-bold mb-4">🔒 Access Denied</h1>
                    <p className="text-gray-400 mb-8">This board is private or doesn't exist.</p>
                    <button
                        onClick={() => router.push('/auth')}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-full text-white font-semibold transition-colors"
                    >
                        Sign In to Continue
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen overflow-hidden">
            <InfiniteCanvas initialNotes={notes} boardId={boardId} userId={user?.id || null} />

            {/* Header Bar */}
            <div className="fixed top-0 left-0 w-full p-4 z-50 pointer-events-none flex justify-between items-start">

                {/* Back Button */}
                <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-white/10 backdrop-blur-md rounded-full text-white/70 hover:text-white transition-all pointer-events-auto border border-white/5"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Dashboard</span>
                </button>

                {/* Right Actions */}
                <div className="flex gap-3 pointer-events-auto">
                    {board && (
                        <button
                            onClick={() => setIsShareOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/90 hover:bg-indigo-600 backdrop-blur-md rounded-full text-white transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
                        >
                            <Share2 size={16} />
                            <span className="text-sm font-semibold">Share</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Dialogs */}
            {board && (
                <ShareBoardDialog
                    board={board}
                    isOpen={isShareOpen}
                    onClose={() => setIsShareOpen(false)}
                    onUpdate={(updates) => setBoard(prev => prev ? ({ ...prev, ...updates }) : null)}
                />
            )}
        </div>
    );
}
