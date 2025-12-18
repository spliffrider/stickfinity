
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Play, Pause, Music } from "lucide-react";
import clsx from "clsx";

export default function BackgroundMusic() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [hasInteracted, setHasInteracted] = useState(false);

    useEffect(() => {
        console.log("BackgroundMusic Component MOUNTED!");
        // Attempt auto-play if possible, but usually requires interaction
        if (audioRef.current) {
            audioRef.current.volume = 0.3; // Start subtle
        }
    }, []);

    const togglePlay = () => {
        console.log("Toggle Play Clicked");
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.error("Audio play failed:", e));
        }
        setIsPlaying(!isPlaying);
        setHasInteracted(true);
    };

    const toggleMute = () => {
        console.log("Toggle Mute Clicked");
        if (!audioRef.current) return;
        audioRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    return (
        <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end gap-2 outline outline-4 outline-red-500 bg-red-500/20 p-2 pointer-events-auto">
            {/* Credit Link */}
            <a
                href="https://john-b.bandcamp.com/track/up-all-night-epic-mix-2020-remaster"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-gray-400 hover:text-white transition-colors bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 hover:border-white/20 shadow-lg"
            >
                🎵 John B - Up All Night (Epic Mix)
            </a>

            {/* Player Control */}
            <div className={clsx(
                "glass-panel p-3 rounded-full flex items-center gap-3 transition-all duration-300 border border-white/10 shadow-2xl bg-black/40 backdrop-blur-xl",
                isPlaying ? "pr-4" : "pr-3"
            )}>
                {/* Visualizer (Fake) */}
                {isPlaying && (
                    <div className="flex items-end gap-[2px] h-4 w-8 mx-1">
                        <div className="w-1 bg-cyan-400/80 rounded-t-sm animate-music-bar-1 h-3"></div>
                        <div className="w-1 bg-purple-400/80 rounded-t-sm animate-music-bar-2 h-full"></div>
                        <div className="w-1 bg-pink-400/80 rounded-t-sm animate-music-bar-3 h-2"></div>
                        <div className="w-1 bg-indigo-400/80 rounded-t-sm animate-music-bar-4 h-3"></div>
                    </div>
                )}

                <audio
                    ref={audioRef}
                    src="/music/background.mp3"
                    loop
                    onEnded={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                />

                <button
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all ring-1 ring-white/20 hover:ring-white/50 shrink-0"
                    title={isPlaying ? "Pause Music" : "Play Music"}
                >
                    {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
                </button>

                {/* Volume Toggle (Only show if playing or interacted) */}
                {(isPlaying || hasInteracted) && (
                    <button
                        onClick={toggleMute}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors shrink-0"
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                )}
            </div>
        </div>
    );
}
