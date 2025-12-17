"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import { Copy, Check, Globe, Lock, Twitter, Mail, Linkedin, Share2 } from "lucide-react";

type Board = Database["public"]["Tables"]["boards"]["Row"];

interface ShareBoardDialogProps {
    board: Board;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (updates: Partial<Board>) => void;
}

export default function ShareBoardDialog({ board, isOpen, onClose, onUpdate }: ShareBoardDialogProps) {
    const [isPublic, setIsPublic] = useState(board.is_public || false);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const url = typeof window !== 'undefined' ? window.location.href : '';

    const handleTogglePublic = async () => {
        setLoading(true);
        const newValue = !isPublic;

        const { error } = await (supabase
            .from('boards') as any)
            .update({ is_public: newValue })
            .eq('id', board.id);

        if (!error) {
            setIsPublic(newValue);
            onUpdate({ is_public: newValue });
        } else {
            console.error(error);
            alert("Failed to update visibility");
        }
        setLoading(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareText = `Join my Stickfinity workspace: ${board.name}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent("Join my Stickfinity Workspace")}&body=${encodeURIComponent(shareText + "\n\n" + url)}`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Share2 className="text-purple-400" size={24} />
                        Share Workspace
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        Close
                    </button>
                </div>

                {/* Visibility Toggle */}
                <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isPublic ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {isPublic ? <Globe size={20} /> : <Lock size={20} />}
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">
                                    {isPublic ? "Public Access" : "Private Workspace"}
                                </h3>
                                <p className="text-xs text-gray-400">
                                    {isPublic ? "Anyone with the link can view" : "Only invited members can view"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleTogglePublic}
                            disabled={loading}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${isPublic
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            {loading ? "..." : (isPublic ? "Enabled" : "Enable")}
                        </button>
                    </div>
                </div>

                {/* Link Copy */}
                <div className="mb-6">
                    <label className="block text-xs font-medium text-gray-400 mb-2">WORKSPACE LINK</label>
                    <div className="flex gap-2">
                        <input
                            readOnly
                            value={url}
                            className="bg-black/30 w-full rounded-lg px-3 py-2 text-sm text-gray-300 border border-white/10 focus:outline-none"
                        />
                        <button
                            onClick={handleCopy}
                            className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center min-w-[44px]"
                            title="Copy Link"
                        >
                            {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                        </button>
                    </div>
                </div>

                {/* Social Share */}
                {isPublic && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="w-full h-px bg-white/10"></div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-3 ml-1">SHARE VIA SOCIALS</label>
                            <div className="flex gap-4">
                                <a
                                    href={twitterUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] transition-colors border border-[#1DA1F2]/20"
                                >
                                    <Twitter size={20} />
                                    <span className="text-xs">Twitter</span>
                                </a>
                                <a
                                    href={linkedinUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl bg-[#0077b5]/10 hover:bg-[#0077b5]/20 text-[#0077b5] transition-colors border border-[#0077b5]/20"
                                >
                                    <Linkedin size={20} />
                                    <span className="text-xs">LinkedIn</span>
                                </a>
                                <a
                                    href={mailtoUrl}
                                    className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 text-gray-300 transition-colors border border-white/10"
                                >
                                    <Mail size={20} />
                                    <span className="text-xs">Email</span>
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
