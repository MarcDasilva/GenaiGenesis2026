"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

const Dither = dynamic(() => import("@/components/Dither"), { ssr: false });
const DNAViewer = dynamic(() => import("@/components/dna-viewer"), {
  ssr: false,
});

const SPLASH_MIN_MS = 2000;

export default function Page() {
  const [splashDone, setSplashDone] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [minTimeReached, setMinTimeReached] = useState(false);
  const [fadeStarted, setFadeStarted] = useState(false);

  // Enforce minimum 2s loading screen
  useEffect(() => {
    const t = setTimeout(() => setMinTimeReached(true), SPLASH_MIN_MS);
    return () => clearTimeout(t);
  }, []);

  // Start fade only when GLB is loaded and min time has passed
  const canFade = modelLoaded && minTimeReached;
  useEffect(() => {
    if (!canFade || fadeStarted) return;
    setFadeStarted(true);
  }, [canFade, fadeStarted]);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Content loads first underneath (GLB loads here so it’s ready when splash fades) */}
      <div className="absolute inset-0 z-0">
        <Dither
          waveSpeed={0.02}
          waveFrequency={3}
          waveAmplitude={0.3}
          backgroundColor={[1, 1, 1]}
          waveColor={[0, 0, 0]}
          colorNum={4}
          pixelSize={2}
          enableMouseInteraction
          mouseRadius={1.2}
        />
      </div>
      <div className="absolute inset-0 z-0">
        <DNAViewer onModelLoaded={() => setModelLoaded(true)} />
      </div>
      {/* Bottom-left branding: callio labs + tagline + sign in */}
      <div
        className="absolute bottom-0 left-0 z-10 pb-12 md:pb-16 lg:pb-20 pl-12 md:pl-16 lg:pl-20 flex flex-col gap-0 items-start"
      >
        <span
          className="font-semibold text-foreground leading-none text-6xl md:text-7xl lg:text-8xl"
          style={{ fontFamily: '"Callio", sans-serif' }}
        >
          callio labs
        </span>
        <span
          className="text-foreground text-xl md:text-2xl lg:text-3xl opacity-70 leading-none -mt-1 md:-mt-1.5 lg:-mt-2"
          style={{ fontFamily: '"Synonym", serif' }}
        >
          agentic genome research
        </span>
        <a
          href="/api/auth/signin/google"
          className="mt-5 md:mt-6 flex items-center gap-2.5 px-4 py-2.5 rounded-md border border-foreground/30 text-foreground/90 bg-foreground/5 hover:bg-foreground/10 hover:border-foreground/40 transition-colors text-sm tracking-wide"
          style={{ fontFamily: '"Synonym", serif' }}
        >
          <GoogleIcon className="w-5 h-5 shrink-0 opacity-90" />
          Sign in with Google
        </a>
      </div>
      {/* White overlay: stays until GLB is loaded and 2s elapsed, then fades out */}
      <div
        className={`fixed inset-0 z-[9999] bg-white ${fadeStarted ? "animate-splash-fade-out" : ""}`}
        style={{
          opacity: fadeStarted ? undefined : 1,
          pointerEvents: splashDone ? "none" : "auto",
        }}
        onAnimationEnd={() => fadeStarted && setSplashDone(true)}
        aria-hidden
      >
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-6"
          aria-label="Loading"
        >
          <span
            className="font-semibold text-foreground text-5xl md:text-6xl tracking-tight"
            style={{ fontFamily: '"Callio", sans-serif' }}
          >
            callio labs
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-foreground/80 animate-loading-dot-1" />
            <span className="w-2 h-2 rounded-full bg-foreground/80 animate-loading-dot-2" />
            <span className="w-2 h-2 rounded-full bg-foreground/80 animate-loading-dot-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
