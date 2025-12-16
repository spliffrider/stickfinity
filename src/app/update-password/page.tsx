"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const SpaceBackground = dynamic(() => import("@/components/SpaceBackground"), { ssr: false });

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Verify we have a session (handled by Supabase magically via the link)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                setMessage({ text: "Invalid or expired reset link.", type: 'error' });
            }
        });
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const { error } = await supabase.auth.updateUser({ password: password });

        if (error) {
            setMessage({ text: error.message, type: 'error' });
        } else {
            setMessage({ text: "Password updated successfully!", type: 'success' });
            setTimeout(() => {
                router.push("/dashboard");
            }, 2000);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden text-white">
            <SpaceBackground />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="z-10 w-full max-w-md p-8"
            >
                <div className="glass-panel p-8 rounded-2xl">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold mb-4">Reset Security Code</h1>
                        <p className="text-gray-300 text-sm font-light">
                            Enter your new access credential below.
                        </p>
                    </div>

                    <form onSubmit={handleUpdate} className="space-y-6">
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-semibold">New Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="glass-input"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>

                        {message && (
                            <div className={`p-3 rounded-lg text-sm text-center ${message.type === 'error' ? 'bg-red-500/20 text-red-200 border border-red-500/30' : 'bg-green-500/20 text-green-200 border border-green-500/30'}`}>
                                {message.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full glass-button mt-4"
                        >
                            {loading ? "Updating..." : "Update Password"}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
