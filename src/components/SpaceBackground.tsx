"use client";

import React from "react";
import Image from "next/image";

const SpaceBackground = () => {
    return (
        <div className="fixed top-0 left-0 w-full h-full -z-50 bg-black overflow-hidden pointer-events-none">
            {/* Deep Field Image */}
            <div className="absolute inset-0 opacity-80">
                <Image
                    src="/deep-space.jpg"
                    alt="Hubble Deep Field Background"
                    fill
                    className="object-cover"
                    quality={100}
                    priority
                />
            </div>

            {/* Dark Overlay for Readability */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

            {/* Optional Gradient Vignette */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/20 to-black/80" />
        </div>
    );
};

export default SpaceBackground;
