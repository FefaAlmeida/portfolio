"use client";

import { useEffect, useRef, useState } from "react";
import { ParallaxGroup, ParallaxLayer } from "@/components/portfolio/parallax";

const between = (min, max) => min + Math.random() * (max - min);
const zones = [
  {
    id: "left",
    distance: 24,
    count: 8,
    opacity: [0.25, 0.38],
    className:
      "inset-y-0 left-0 w-(--bubble-left) max-md:[&>span:nth-child(n+4)]:hidden",
  },
  {
    id: "right",
    distance: 38,
    count: 8,
    opacity: [0.25, 0.38],
    className:
      "inset-y-0 right-0 w-(--bubble-right) max-md:[&>span:nth-child(n+4)]:hidden",
  },
  {
    id: "top",
    distance: 12,
    count: 5,
    opacity: [0.18, 0.28],
    className:
      "top-0 right-(--bubble-right) left-(--bubble-left) h-(--bubble-top)",
  },
  {
    id: "bottom",
    distance: 18,
    count: 5,
    opacity: [0.18, 0.28],
    className:
      "right-(--bubble-right) bottom-0 left-(--bubble-left) h-(--bubble-bottom)",
  },
  {
    id: "content",
    distance: 10,
    count: 4,
    opacity: [0.07, 0.12],
    className:
      "top-(--bubble-top) right-(--bubble-right) bottom-(--bubble-bottom) left-(--bubble-left) max-md:[&>span:nth-child(n+3)]:hidden",
  },
];

export default function BubbleField() {
  const field = useRef(null);
  const [fields, setFields] = useState([]);
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    function updateMotion() {
      setFields(
        motion.matches
          ? []
          : zones.map((zone) => ({
              ...zone,
              bubbles: Array.from({ length: zone.count }, (_, id) => {
                const duration = between(32, 52);
                return {
                  id,
                  style: {
                    left: `${between(10, 85)}%`,
                    "--bubble-duration": `${duration}s`,
                    "--bubble-delay": `${-between(0, duration)}s`,
                    "--bubble-opacity": between(...zone.opacity),
                    "--bubble-sway": `${between(3, 8)}px`,
                    "--bubble-sway-duration": `${between(3.5, 8)}s`,
                  },
                };
              }),
            })),
      );
    }
    updateMotion();
    motion.addEventListener("change", updateMotion);
    const element = field.current;
    const section = element.parentElement;
    const container = section.querySelector(
      '[data-slot="portfolio-container"]',
    );
    function bounds() {
      const outer = section.getBoundingClientRect();
      const inner = (container || section).getBoundingClientRect();
      const style = getComputedStyle(section);
      element.style.setProperty(
        "--bubble-left",
        `${Math.max(0, inner.left - outer.left)}px`,
      );
      element.style.setProperty(
        "--bubble-right",
        `${Math.max(0, outer.right - inner.right)}px`,
      );
      element.style.setProperty(
        "--bubble-top",
        `${Math.min(56, parseFloat(style.paddingTop))}px`,
      );
      element.style.setProperty(
        "--bubble-bottom",
        `${Math.min(56, parseFloat(style.paddingBottom))}px`,
      );
    }
    const observer = new ResizeObserver(bounds);
    observer.observe(section);
    if (container) observer.observe(container);
    bounds();
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", updateMotion);
    };
  }, []);
  return (
    <ParallaxGroup
      ref={field}
      aria-hidden="true"
      className="bubble-field pointer-events-none absolute inset-0 -z-10 overflow-hidden motion-reduce:hidden"
    >
      {fields.map((zone) => (
        <ParallaxLayer
          key={zone.id}
          distance={zone.distance}
          className={`absolute overflow-hidden ${zone.className}`}
        >
          {zone.bubbles.map((bubble) => (
            <span
              key={bubble.id}
              style={bubble.style}
              className="absolute inset-y-0 animate-[bubble-rise_var(--bubble-duration)_linear_infinite_var(--bubble-delay)]"
            >
              <span className="absolute bottom-0 left-0 animate-[bubble-sway_var(--bubble-sway-duration)_ease-in-out_infinite_alternate_var(--bubble-delay)]">
                <span className="block size-[9px] rounded-full border border-bubble/70 bg-bubble shadow-[0_4px_14px_#c8526638] md:size-3" />
              </span>
            </span>
          ))}
        </ParallaxLayer>
      ))}
    </ParallaxGroup>
  );
}
