"use client";

import { useEffect, useRef, useState } from "react";

const randomBetween = (min, max) => min + Math.random() * (max - min);

function createBubbles(count) {
  return Array.from({ length: count }, (_, id) => {
    const size = 12;
    const duration = randomBetween(18, 36);

    return {
      id,
      delay: `${-randomBetween(0, duration).toFixed(1)}s`,
      duration: `${duration.toFixed(1)}s`,
      left: `${randomBetween(1, 97).toFixed(1)}%`,
      opacity: randomBetween(0.25, 0.38).toFixed(2),
      size,
      sway: `${randomBetween(10, 42).toFixed(0)}px`,
      swayDuration: `${randomBetween(3.5, 8).toFixed(1)}s`,
    };
  });
}

export default function BubbleField({ count = 26 }) {
  const [bubbles, setBubbles] = useState([]);
  const fieldRef = useRef(null);

  useEffect(() => {
    setBubbles(createBubbles(count));
  }, [count]);

  useEffect(() => {
    const field = fieldRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!field || reducedMotion.matches) return undefined;

    let lastY = window.scrollY;
    let push = 0;
    let frameId = 0;

    const drift = () => {
      const currentY = window.scrollY;
      const velocity = currentY - lastY;

      lastY = currentY;
      push += (-velocity * 1.1 - push) * 0.16;
      push *= 0.93;
      push = Math.max(-54, Math.min(54, push));
      field.style.transform = `translate3d(0, ${push.toFixed(2)}px, 0)`;

      if (Math.abs(push) > 0.06 || Math.abs(velocity) > 0.06) {
        frameId = requestAnimationFrame(drift);
        return;
      }

      frameId = 0;
      push = 0;
      field.style.transform = "";
    };

    const handleScroll = () => {
      if (!frameId) frameId = requestAnimationFrame(drift);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div
      ref={fieldRef}
      className="bubble-field pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {bubbles.map((bubble) => (
        <span
          key={bubble.id}
          className="bubble-rise absolute inset-y-0"
          style={{
            left: bubble.left,
            "--bubble-delay": bubble.delay,
            "--bubble-duration": bubble.duration,
            "--bubble-opacity": bubble.opacity,
          }}
        >
          <span
            className="bubble-sway absolute bottom-0 left-0"
            style={{
              "--bubble-delay": bubble.delay,
              "--bubble-sway": bubble.sway,
              "--bubble-sway-duration": bubble.swayDuration,
            }}
          >
            <span
              className="bubble block rounded-full border border-[#C85266]/70 dark:border-[#ef8799]/70 bg-[#C85266] dark:bg-[#d96b80] shadow-[0_4px_14px_rgba(200,82,102,.22)]"
              style={{
                height: bubble.size,
                width: bubble.size,
              }}
            />
          </span>
        </span>
      ))}
    </div>
  );
}
