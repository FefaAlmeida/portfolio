"use client";

import { useEffect, useId, useRef, useState } from "react";

// A smooth fade with flat endpoints keeps the solid joints crisp.
const fadeSamples = Array.from({ length: 17 }, (_, step) => step / 16);
function fadeStrength(progress) {
  const t = Math.max(0, Math.min(1, (progress - 0.15) / 0.85));
  const eased = t * t * t * (t * (t * 6 - 15) + 10);
  return 1 - eased * 0.88;
}

export default function ExperienceTimeline() {
  const ref = useRef(null);
  const id = useId();
  const [segments, setSegments] = useState([]);

  useEffect(() => {
    const stories = ref.current.parentElement;
    const section = stories.closest("section");
    let frame;
    function measure() {
      const origin = stories.getBoundingClientRect();
      const items = [...stories.querySelectorAll(":scope > article")];
      const desktop = matchMedia("(min-width: 768px)").matches;
      const axis = desktop ? origin.width / 2 : 4;
      const boxes = items.map((item) => {
        const date = item
          .querySelector(".experience-date")
          .getBoundingClientRect();
        const heading = item.querySelector("header").getBoundingClientRect();
        const body = item
          .querySelector(".experience-body")
          .getBoundingClientRect();
        const textOnLeft = desktop && date.left - origin.left < axis;
        return {
          axis,
          mobileDateX: desktop ? null : date.left - origin.left,
          x: textOnLeft
            ? date.right - origin.left + 24
            : date.left - origin.left - 24,
          y: date.top - origin.top + date.height / 2,
          fade: heading.top - origin.top - 16,
          returnAt: body.bottom - origin.top + 16,
        };
      });
      setSegments(
        boxes.map((box, index) => ({
          ...box,
          next: boxes[index + 1] || {
            y: section.getBoundingClientRect().bottom - origin.top,
          },
        })),
      );
    }
    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    }
    const observer = new ResizeObserver(schedule);
    observer.observe(stories);
    observer.observe(section);
    for (const item of stories.querySelectorAll(":scope > article"))
      observer.observe(item);
    schedule();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      className="experience-timeline pointer-events-none absolute inset-0 h-full w-full overflow-visible"
    >
      {segments.map((segment, index) => {
        const { x, y, axis, mobileDateX, fade, returnAt, next } = segment;
        const start = y;
        const end = next.y;
        const gradient = `${id}-${index}`;
        const offset = (position) =>
          Math.max(0, Math.min(1, (position - start) / (end - start)));
        const path = `M ${axis} ${start} V ${end}`;
        return (
          <g key={gradient}>
            <defs>
              <linearGradient
                id={gradient}
                gradientUnits="userSpaceOnUse"
                x1="0"
                x2="0"
                y1={start}
                y2={end}
              >
                {[
                  ...fadeSamples.map((t) => [
                    start + (fade - start) * t,
                    fadeStrength(t),
                  ]),
                  ...fadeSamples.map((t) => [
                    returnAt + (end - returnAt) * t,
                    fadeStrength(1 - t),
                  ]),
                ].map(([position, opacity]) => (
                  <stop
                    key={`${gradient}-stop-${position}`}
                    offset={offset(position)}
                    stopColor="var(--timeline)"
                    stopOpacity={opacity}
                  />
                ))}
              </linearGradient>
            </defs>
            <path
              d={path}
              fill="none"
              stroke={`url(#${gradient})`}
              strokeWidth="2"
            />
            <path
              d={`M ${axis} ${y} H ${mobileDateX ?? x}`}
              fill="none"
              stroke="var(--timeline)"
              strokeWidth="2"
            />
            <circle
              cx={x}
              cy={y}
              r="6"
              fill="var(--background)"
              stroke="var(--primary)"
            />
            <circle cx={x} cy={y} r="3" fill="var(--primary)" />
          </g>
        );
      })}
    </svg>
  );
}
