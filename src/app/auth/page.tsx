
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const SpaceBackground = dynamic(() => import("@/components/SpaceBackground"), { ssr: false });
// BackgroundMusic moved to global layout

export default function AuthPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (isSignUp) {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) {
                setMessage({ text: error.message, type: 'error' });
            } else {
                setMessage({ text: "Check your email for the confirmation link!", type: 'success' });
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                setMessage({ text: error.message, type: 'error' });
            } else {
                router.push("/dashboard");
            }
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
                        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-400 bg-clip-text text-transparent text-glow animate-pulse-glow">
                            Stickfinity
                        </h1>
                        <p className="text-gray-300 text-lg font-light tracking-wide">
                            {isSignUp ? "Join the infinite cosmos" : "Return to your workspace"}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-semibold">Email Frequency</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="glass-input"
                                placeholder="astronaut@cosmos.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-semibold">Security Code</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="glass-input"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {/* Forgot Password Link */}
                        {!isSignUp && (
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const emailToReset = prompt("Enter your email address to reset password:");
                                        if (emailToReset) {
                                            setLoading(true);
                                            supabase.auth.resetPasswordForEmail(emailToReset, {
                                                redirectTo: `${window.location.origin}/update-password`,
                                            }).then(({ error }) => {
                                                setLoading(false);
                                                if (error) {
                                                    setMessage({ text: error.message, type: 'error' });
                                                } else {
                                                    setMessage({ text: "Password reset link sent!", type: 'success' });
                                                }
                                            });
                                        }
                                    }}
                                    className="text-xs text-gray-400 hover:text-white transition-colors"
                                >
                                    Lost your security code?
                                </button>
                            </div>
                        )}

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
                            {loading ? "Ignition..." : isSignUp ? "Launch Mission" : "Engage Thrusters"}
                        </button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-600/30"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="glass-panel px-2 text-gray-400">Or continue with</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={async () => {
                                setLoading(true);
                                const { error } = await supabase.auth.signInAnonymously();
                                if (error) {
                                    setMessage({ text: error.message, type: 'error' });
                                    setLoading(false);
                                } else {
                                    router.push("/dashboard");
                                }
                            }}
                            disabled={loading}
                            className="w-full glass-button bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border-indigo-500/30"
                        >
                            Visiting Alien (Guest Mode)
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-sm text-gray-400 hover:text-white transition-colors hover:underline decoration-indigo-500 decoration-2 underline-offset-4"
                        >
                            {isSignUp ? "Already have an ID? Sign In" : "Need a passport? Sign Up"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
