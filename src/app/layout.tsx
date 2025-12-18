import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Stickfinity",
    description: "Infinite collaborative sticky notes",
};

import dynamic from "next/dynamic";
const BackgroundMusic = dynamic(() => import("@/components/BackgroundMusic"), { ssr: false });

import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css"; // Ensure globals are imported

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
                                        'brand-teal': '#14b8a6',
                                        'brand-mint': '#2dd4bf',
                                    }
                                }
                            }
                        }
                    `
                }} />
            </head>
            <body>
                <ThemeProvider>
                    <BackgroundMusic />
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
