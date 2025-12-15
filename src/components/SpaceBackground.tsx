"use client";

import React from "react";

const SpaceBackground = () => {
    return (
        <div className="fixed top-0 left-0 w-full h-full -z-50 bg-space-black overflow-hidden pointer-events-none">
            {/* Safe Mode: CSS Gradients Only */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[100px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[120px]" />
            <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-indigo-900/10 blur-[80px]" />
        </div>
    );
};

export default SpaceBackground;
