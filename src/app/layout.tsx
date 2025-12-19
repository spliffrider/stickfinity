import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Stickfinity",
    description: "Infinite collaborative sticky notes",
};

import "./globals.css";

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
                            background: black;
                            min-height: 100vh;
                        }
                        
                        /* Layout System - Restored Space Glass */
                        .glass-panel {
                            background-color: rgba(255, 255, 255, 0.05);
                            backdrop-filter: blur(24px);
                            border: 1px solid rgba(255, 255, 255, 0.1);
                            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                            border-radius: 0.75rem; 
                        }

                        .glass-button {
                            background: rgba(255, 255, 255, 0.05);
                            color: white;
                            border: 1px solid rgba(255, 255, 255, 0.1);
                            padding: 0.75rem 1.5rem;
                            border-radius: 0.75rem;
                            transition: all 0.3s;
                        }
                        .glass-button:hover {
                            background: rgba(255, 255, 255, 0.1);
                        }
                    `
                }} />
            </head>
            <body>
                {children}
            </body>
        </html>
    );
}
