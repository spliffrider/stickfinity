import React from 'react';
import { motion } from 'framer-motion';

interface CursorProps {
    x: number;
    y: number;
    color: string;
    name?: string;
}

export const Cursor: React.FC<CursorProps> = ({ x, y, color, name }) => {
    return (
        <motion.div
            className="absolute pointer-events-none z-50 flex flex-col items-start"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ x, y, opacity: 1, scale: 1 }}
            transition={{
                type: "spring",
                damping: 30,
                stiffness: 200,
                mass: 0.8
            }}
            style={{ x, y }} // Use style for performant updates if not waiting for frame
        >
            <svg
                width="24"
                height="36"
                viewBox="0 0 24 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-md"
            >
                <path
                    d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                    fill={color}
                    stroke="white"
                />
            </svg>
            {name && (
                <div
                    className="ml-4 -mt-1 px-2 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap shadow-lg backdrop-blur-sm"
                    style={{ backgroundColor: color }}
                >
                    {name}
                </div>
            )}
        </motion.div>
    );
};
