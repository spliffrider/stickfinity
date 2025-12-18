"use client";

import React from "react";
// Image removed for performance (CSS gradient used instead)

const SpaceBackground = () => {
    return (
        <div className="fixed top-0 left-0 w-full h-full -z-50 bg-black overflow-hidden pointer-events-none">
            {/* Deep Field Image */}
            {/* Deep Space Gradient (Lightweight) */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black" />

            {/* Optional: Simple CSS Stars could be added here if needed, but keeping it minimal for speed */}
            <div className="absolute inset-0 bg-black/80" />
        </div>
    );
};

export default SpaceBackground;
