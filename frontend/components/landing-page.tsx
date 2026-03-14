"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { CallioLabsSplash } from "@/components/callio-labs-splash";
import { SignInWithGoogleButton } from "@/components/sign-in-with-google-button";

const Dither = dynamic(() => import("@/components/Dither"), { ssr: false });
const DNAViewer = dynamic(() => import("@/components/dna-viewer"), {
  ssr: false,
});

export function LandingPage() {
  const [modelLoaded, setModelLoaded] = useState(false);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
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
        <SignInWithGoogleButton />
      </div>
      <CallioLabsSplash readyToFade={modelLoaded} />
    </div>
  );
}
