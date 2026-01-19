"use client";

export function LogisticsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-full h-screen bg-black overflow-hidden relative font-sans text-white">
            {/* Cinematic Vignette & Tint */}
            <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,10,20,0.8)_120%)]" />

            {/* Ambient Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%]" />

            {children}
        </div>
    );
}
