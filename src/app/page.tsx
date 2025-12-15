import Link from "next/link";
import dynamic from "next/dynamic";

const SpaceBackground = dynamic(() => import("@/components/SpaceBackground"), { ssr: false });

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 relative overflow-hidden">
            <SpaceBackground />
            <div className="z-10 text-center space-y-8 glass-panel p-12 rounded-2xl animate-fade-in">
                <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                    Stickfinity
                </h1>
                <p className="text-xl text-gray-300 max-w-2xl">
                    An infinite canvas for your thoughts, ideas, and collaborations.
                    Float in space with your sticky notes.
                </p>

                <div className="flex gap-4 justify-center">
                    <Link href="/auth" className="btn-primary text-lg px-8 py-3">
                        Get Started
                    </Link>
                    <Link href="/dashboard" className="btn-secondary text-lg px-8 py-3">
                        Dashboard
                    </Link>
                </div>
            </div>
        </main>
    );
}
