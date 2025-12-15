import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Stickfinity",
    description: "Infinite collaborative sticky notes",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <script src="https://cdn.tailwindcss.com"></script>
                <script dangerouslySetInnerHTML={{
                    __html: `
                        tailwind.config = {
                            theme: {
                                extend: {
                                    colors: {
                                        'space-black': '#050510',
                                        'space-blue': '#101030',
                                        'star-white': '#ffffff',
                                    }
                                }
                            }
                        }
                    `
                }} />
                <style dangerouslySetInnerHTML={{
                    __html: `
                        body {
                            color: white;
                            background: linear-gradient(to bottom, #000000, #101030);
                            min-height: 100vh;
                        }
                        
                        /* Glassmorphism System */
                        .glass-panel {
                            background-color: rgba(255, 255, 255, 0.05);
                            backdrop-filter: blur(24px);
                            border: 1px solid rgba(255, 255, 255, 0.1);
                            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                        }

                        .glass-input {
                            width: 100%;
                            padding: 0.75rem 1rem;
                            background-color: rgba(255, 255, 255, 0.05);
                            border: 1px solid rgba(255, 255, 255, 0.1);
                            border-radius: 0.75rem;
                            color: white;
                            transition: all 0.3s;
                        }
                        .glass-input:focus {
                            outline: none;
                            background-color: rgba(255, 255, 255, 0.1);
                            border-color: rgba(168, 85, 247, 0.5);
                        }

                        .glass-button {
                            position: relative;
                            overflow: hidden;
                            background: linear-gradient(to right, rgba(147, 51, 234, 0.8), rgba(79, 70, 229, 0.8));
                            color: white;
                            font-weight: 500;
                            padding: 0.75rem 1.5rem;
                            border-radius: 0.75rem;
                            transition: all 0.3s;
                            border: 1px solid rgba(255, 255, 255, 0.1);
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                            font-size: 0.875rem;
                        }
                        .glass-button:hover {
                            background: linear-gradient(to right, rgba(168, 85, 247, 1), rgba(99, 102, 241, 1));
                            transform: scale(1.02);
                        }

                        .glass-button-secondary {
                            background-color: rgba(255, 255, 255, 0.05);
                            color: #d1d5db;
                            border: 1px solid rgba(255, 255, 255, 0.05);
                            transition: all 0.3s;
                            border-radius: 0.75rem;
                            padding: 0.75rem 1.5rem;
                            backdrop-filter: blur(12px);
                        }
                        .glass-button-secondary:hover {
                            background-color: rgba(255, 255, 255, 0.1);
                            color: white;
                            border-color: rgba(255, 255, 255, 0.2);
                        }

                        .text-glow {
                            text-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
                        }

                        /* Animations */
                        @keyframes float {
                            0%, 100% { transform: translateY(0px); }
                            50% { transform: translateY(-20px); }
                        }
                        .animate-float { animation: float 6s ease-in-out infinite; }
                        
                        @keyframes pulse-glow {
                            0%, 100% { opacity: 0.5; transform: scale(1); }
                            50% { opacity: 1; transform: scale(1.05); }
                        }
                        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }

                        @keyframes fly-comet {
                            0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); opacity: 0; }
                            10% { opacity: 1; }
                            80% { opacity: 1; }
                            100% { transform: translateX(200vw) translateY(200vh) rotate(45deg); opacity: 0; }
                        }
                        .animate-comet { animation: fly-comet 4s linear forwards; }
                    `
                }} />
            </head>
            <body>{children}</body>
        </html>
    );
}
