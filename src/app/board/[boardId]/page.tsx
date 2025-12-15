
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SpaceBackground from "@/components/SpaceBackground";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import { Database } from "@/lib/database.types";

export default function BoardPage() {
    const params = useParams();
    const router = useRouter();
    const boardId = params.boardId as string;
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [notes, setNotes] = useState<Database['public']['Tables']['notes']['Row'][]>([]);

    useEffect(() => {
        const fetchBoardData = async () => {
            const { data } = await supabase.auth.getUser();
            if (!data.user) {
                router.push("/auth");
                return;
            }
            setUser(data.user);

            // Fetch Board details to verify access
            const { data: board, error: boardError } = await supabase
                .from("boards")
                .select("*")
                .eq("id", boardId)
                .single();

            if (boardError || !board) {
                console.error("Board not found or access denied");
                // router.push("/dashboard"); 
                // For debugging, we might want to stay here or show error
                return;
            }

            // Fetch Notes
            const { data: notesData, error: notesError } = await supabase
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

    return (
        <div className="w-full h-screen overflow-hidden">
            <SpaceBackground />
            <InfiniteCanvas initialNotes={notes} boardId={boardId} userId={user.id} />

            {/* Simple Back Button */}
            <div className="fixed top-4 left-4 z-50">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="text-white/50 hover:text-white transition-colors"
                >
                    ← Back to Dashboard
                </button>
            </div>
        </div>
    );
}
