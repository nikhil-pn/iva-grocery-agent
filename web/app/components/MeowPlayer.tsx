"use client";

// The sad meow song on loop. Browsers block autoplay with sound, so it starts on the first tap anywhere.
import { useEffect, useRef, useState } from "react";

export default function MeowPlayer() {
  const ref = useRef<HTMLAudioElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    a.volume = 0.7;
    a.play().then(() => setOn(true)).catch(() => {});
    const first = () => {
      if (a.paused) a.play().then(() => setOn(true)).catch(() => {});
      window.removeEventListener("pointerdown", first);
    };
    window.addEventListener("pointerdown", first);
    return () => window.removeEventListener("pointerdown", first);
  }, []);

  function toggle() {
    const a = ref.current;
    if (!a) return;
    if (a.paused) a.play().then(() => setOn(true)).catch(() => {});
    else {
      a.pause();
      setOn(false);
    }
  }

  return (
    <>
      <audio ref={ref} src="/team/meow.mp3" loop preload="auto" />
      <button
        type="button"
        onClick={toggle}
        className="tap fixed bottom-5 right-5 z-40 rounded-full bg-lime px-5 py-3 font-semibold text-ink shadow-2xl"
      >
        {on ? "🔊 sad meow song: on" : "▶ play the sad song"}
      </button>
    </>
  );
}
