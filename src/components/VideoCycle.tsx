import { useRef, useState } from "react";
import type { VideoClip } from "../types";

interface VideoCycleProps {
  clips: VideoClip[];
}

/* Seconds before the playing clip ends at which the next one starts to
   download, and at which it starts to play so the two overlap for the fade. */
const PRELOAD_LEAD = 8;
const FADE_LEAD = 1;

/** Plays the clips one after another, forever, fading each into the next. */
export function VideoCycle({ clips }: VideoCycleProps) {
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const starting = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const next = (active + 1) % clips.length;

  function handleTimeUpdate(i: number) {
    const video = videos.current[i];
    const upNext = videos.current[next];
    if (i !== active || next === active || !video || !upNext) return;

    const left = video.duration - video.currentTime;
    // Set on the element and not through a prop, so only the first clip
    // downloads with the page and a visitor who leaves early pays for no more.
    if (left <= PRELOAD_LEAD && upNext.preload === "none") {
      upNext.preload = "auto";
    }
    if (left <= FADE_LEAD && starting.current === null) {
      starting.current = next;
      upNext.currentTime = 0;
      upNext.play().catch(() => {
        // The next clip would not start, so keep the current one going.
        starting.current = null;
        video.play().catch(() => {});
      });
    }
  }

  function handlePlaying(i: number) {
    if (starting.current !== i) return;
    starting.current = null;
    setActive(i);
  }

  return (
    <div className="absolute inset-0 isolate">
      {clips.map((clip, i) => (
        <video
          key={clip.mp4}
          ref={(el) => {
            videos.current[i] = el;
          }}
          // The incoming clip fades in on top while the outgoing one stays
          // solid underneath, then drops out once it is covered.
          className={`absolute inset-0 h-full w-full object-cover transition-opacity ${
            i === active
              ? "z-1 opacity-100 duration-1000"
              : "opacity-0 delay-1000 duration-0"
          }`}
          autoPlay={i === 0}
          loop={clips.length === 1}
          muted
          playsInline
          preload={i === 0 ? "auto" : "none"}
          onTimeUpdate={() => handleTimeUpdate(i)}
          onPlaying={() => handlePlaying(i)}
        >
          {clip.webm && <source src={clip.webm} type="video/webm" />}
          <source src={clip.mp4} type="video/mp4" />
        </video>
      ))}
    </div>
  );
}
