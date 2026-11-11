"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./media.module.css";

interface Props {
  src: string;
  poster: string;
  width: number;
  height: number;
  /** Accessible name of the video. */
  label: string;
  playLabel: string;
  caption: string;
}

/**
 * The Society's introduction film, hosted with the site. Nothing downloads until the visitor asks:
 * preload="none" plus a poster, then the native controls take over after the first play. The film
 * pauses itself when scrolled out of view. Keyboard: the play button is a real button; native
 * controls handle the rest.
 */
export function IntroFilm({ src, poster, width, height, label, playLabel, caption }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video || !started) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry && !entry.isIntersecting && !video.paused) video.pause();
    }, { threshold: 0.2 });
    io.observe(video);
    return () => { io.disconnect(); };
  }, [started]);

  const play = () => {
    setStarted(true);
    const video = ref.current;
    if (!video) return;
    void video.play().then(() => { video.focus(); }).catch(() => { /* playback refused: native controls stay available */ });
  };

  return (
    <div className={styles.film} data-started={started ? "true" : "false"}>
      {/* Captions: the Arabic film has no audio track. The English film's soundtrack has not been
          transcribed yet, so no captions file exists; tracked in docs/ACCEPTANCE.md (A25). */}
      {/* eslint-disable-next-line jsx-a11y-x/media-has-caption -- see the comment above */}
      <video
        ref={ref}
        className={styles.video}
        src={src}
        poster={poster}
        width={width}
        height={height}
        preload="none"
        playsInline
        controls={started}
        aria-label={label}
      />
      {started ? null : (
        <button type="button" className={styles.play} onClick={play}>
          <span className={styles.playBall} aria-hidden="true" />
          <span className={styles.playText}>
            <span className={styles.playLabel}>{playLabel}</span>
            <span className={styles.playCaption}>{caption}</span>
          </span>
        </button>
      )}
    </div>
  );
}
