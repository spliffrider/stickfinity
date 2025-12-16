
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";
import { Database } from "@/lib/database.types";
import { Plus, Layout, LogOut, Search } from "lucide-react";
import { motion } from "framer-motion";

const SpaceBackground = dynamic(() => import("@/components/SpaceBackground"), { ssr: false });

type Board = Database["public"]["Tables"]["boards"]["Row"];

export default function Dashboard() {
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [newBoardName, setNewBoardName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/auth");
                return;
            }
            setUser(user);
            fetchBoards(user.id);
        };
        checkUser();
    }, [router]);

    const fetchBoards = async (userId: string) => {
        const { data, error } = await supabase
            .from("boards")
            .select("*")
            .eq("owner_id", userId)
            .order("created_at", { ascending: false });

        if (error) console.error(error);
        else setBoards(data || []);
        setLoading(false);
    };

    const handleCreateBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!newBoardName.trim() || !user) return;

        const slug = newBoardName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.random().toString(36).substring(7);

        const { data, error: insertError } = await supabase.from("boards").insert({
            name: newBoardName,
            slug: slug,
            owner_id: user.id || "",
            is_public: false
        } as any).select().single();

        if (insertError) {
            console.error(insertError);
            if (insertError.code === '23503') { // Foreign key violation
                setError("Your user profile is missing. Please run the SQL Trigger script in Supabase!");
            } else {
                setError(insertError.message || "Error creating board");
            }
        } else if (data) {
            setBoards([data as any, ...boards]);
            setNewBoardName("");
            setIsCreating(false);
            router.push(`/board/${(data as any).id}`);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    return (
        <div className="min-h-screen text-white relative">
            <SpaceBackground />

            <nav className="border-b border-white/5 bg-black/10 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 font-bold text-2xl bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                            <Layout size={24} className="text-purple-400" />
                        </div>
                        <span className="text-glow">Stickfinity</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <span className="text-sm font-medium text-gray-400 hidden sm:block tracking-wide uppercase">{user?.email}</span>
                        <button onClick={handleSignOut} className="p-2 hover:bg-white/10 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-white/10">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Your Universe</h1>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="glass-button flex items-center gap-2"
                    >
                        <Plus size={18} />
                        New Board
                    </button>
                </div>

                {isCreating && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-10"
                    >
                        <div className="glass-panel p-6 rounded-2xl">
                            <h3 className="text-lg font-medium mb-4 text-gray-300">Create New Board</h3>
                            {error && (
                                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                                    {error}
                                </div>
                            )}
                            <form onSubmit={handleCreateBoard} className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Board Name (e.g. Andromeda Project)"
                                    className="glass-input flex-1"
                                    value={newBoardName}
                                    onChange={(e) => setNewBoardName(e.target.value)}
                                    autoFocus
                                />
                                <button type="submit" className="glass-button">
                                    Create Board
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIsCreating(false); setError(null); }}
                                    className="glass-button-secondary"
                                >
                                    Cancel
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {boards.map((board, index) => (
                            <motion.div
                                key={board.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => router.push(`/board/${board.id}`)}
                                className="glass-panel p-6 rounded-2xl hover:border-purple-500/50 hover:shadow-purple-500/10 cursor-pointer overflow-hidden group relative transition-all duration-300 hover:scale-[1.02]"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="p-2 bg-white/10 rounded-full backdrop-blur-md">
                                        <div className={`w-2 h-2 rounded-full ${board.is_public ? 'bg-green-400 box-shadow-green' : 'bg-yellow-400 box-shadow-yellow'}`} />
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold mb-2 text-white group-hover:text-purple-300 transition-colors">{board.name}</h3>
                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                    Created {new Date(board.created_at).toLocaleDateString()}
                                </p>

                                <div className="mt-6 flex items-center justify-between">
                                    <span className="text-xs text-gray-600 bg-white/5 px-2 py-1 rounded border border-white/5 group-hover:bg-white/10 transition-colors">
                                        {board.is_public ? 'Public Galaxy' : 'Private Sector'}
                                    </span>
                                </div>
                            </motion.div>
                        ))}

                        {boards.length === 0 && !isCreating && (
                            <div className="col-span-full flex flex-col items-center justify-center py-32 rounded-3xl border-2 border-dashed border-white/10 bg-white/5">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                    <Layout size={32} className="text-gray-500" />
                                </div>
                                <h3 className="text-xl font-medium text-gray-300 mb-2">No boards found</h3>
                                <p className="text-gray-500 mb-6">Your universe is empty. Start by creating a new board.</p>
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="glass-button"
                                >
                                    Initialize First Board
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
