"use client";

import { useEffect, useRef, useState } from "react";

// Flowers, tendrils, title and closing line are traced as ONE connected path.
// Measure the actual layout so the same drawing follows the mobile reading order.
function flower(x, y, size = 1) {
  const p = (dx, dy) => `${x + dx * size} ${y + dy * size}`;
  return `C${p(-12, -22)} ${p(15, -47)} ${p(4, -74)}
    C${p(-8, -73)} ${p(-27, -95)} ${p(-17, -103)}
    C${p(-9, -110)} ${p(1, -97)} ${p(4, -91)}
    C${p(10, -117)} ${p(33, -113)} ${p(30, -98)}
    C${p(27, -83)} ${p(11, -76)} ${p(4, -74)}
    C${p(5, -91)} ${p(-9, -91)} ${p(-10, -81)}
    C${p(-9, -67)} ${p(12, -63)} ${p(16, -74)}
    C${p(21, -86)} ${p(7, -82)} ${p(4, -74)}
    C${p(11, -59)} ${p(7, -44)} ${p(2, -36)}
    C${p(18, -42)} ${p(28, -54)} ${p(31, -64)}
    C${p(14, -67)} ${p(15, -84)} ${p(24, -79)}
    C${p(28, -77)} ${p(30, -73)} ${p(31, -70)}
    C${p(40, -89)} ${p(57, -78)} ${p(46, -69)}
    C${p(43, -66)} ${p(36, -64)} ${p(31, -64)}
    C${p(28, -53)} ${p(18, -42)} ${p(2, -36)}
    C${p(-8, -39)} ${p(-20, -53)} ${p(-16, -65)}
    C${p(-6, -59)} ${p(-6, -45)} ${p(2, -36)}
    C${p(-3, -19)} ${p(21, -18)} ${p(23, -7)}
    C${p(24, 5)} ${p(8, 4)} ${p(13, -4)}
    C${p(17, -10)} ${p(21, -7)} ${p(20, -5)}
    C${p(17, -12)} ${p(4, -14)} ${p(0, 0)}`;
}

export default function AboutDrawing({ className }) {
  const ref = useRef(null);
  const [drawing, setDrawing] = useState("");
  useEffect(() => {
    const svg = ref.current;
    const layout = svg.parentElement;
    const figure = layout.querySelector("figure");
    const heading = layout.querySelector("header");
    const prose = layout.querySelector("[data-about-prose]");
    const update = () => {
      const root = layout.getBoundingClientRect();
      const bounds = (node) => {
        const r = node.getBoundingClientRect();
        return {
          x: r.left - root.left,
          y: r.top - root.top,
          w: r.width,
          h: r.height,
        };
      };
      const f = bounds(figure);
      const h = bounds(heading);
      const t = bounds(prose);
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      const scale = f.w / 450;
      const a = { x: f.x + f.w * 0.79, y: f.y + f.h * 0.28 };
      const b = { x: f.x + f.w * 0.18, y: f.y + f.h * 0.86 };
      const hy = h.y + h.h - 14;
      const endY = Math.max(f.y + f.h, t.y + t.h) - 12;
      const endX = t.x + t.w - 24;
      let d = `M${h.x + 184} ${hy} C${h.x + 154} ${hy + 7} ${h.x + 148} ${hy + 2} ${h.x + 137} ${hy}
        C${h.x + 124} ${hy - 10} ${h.x + 127} ${hy - 15} ${h.x + 135} ${hy - 7}
        C${h.x + 144} ${hy - 18} ${h.x + 151} ${hy - 7} ${h.x + 137} ${hy}
        C${h.x + 110} ${hy + 13} ${h.x + 54} ${hy - 12} ${h.x + 4} ${hy}
        C${h.x - 20} ${hy + 10} ${a.x - 42 * scale} ${a.y + 15 * scale} ${a.x} ${a.y}`;
      d += flower(a.x, a.y, scale);
      d += `C${a.x - 30 * scale} ${a.y + 70 * scale} ${b.x - 35 * scale} ${b.y - 90 * scale} ${b.x} ${b.y}`;
      d += flower(b.x, b.y, scale);
      if (mobile) {
        d += `C${b.x - 55 * scale} ${b.y + 36 * scale} -10 ${f.y + f.h - 8} -10 ${f.y + f.h + 18}
          L-10 ${endY - 42} Q-10 ${endY} 26 ${endY}`;
      } else {
        d += `C${b.x + 40} ${endY + 14} ${t.x - 90} ${endY + 14} ${t.x} ${endY}`;
      }
      d += `C${t.x + t.w * 0.35} ${endY - 20} ${endX - 80} ${endY + 18} ${endX} ${endY}`;
      d += flower(endX, endY, 0.45);
      setDrawing(d);
    };
    const observer = new ResizeObserver(update);
    for (const node of [layout, figure, heading, prose]) observer.observe(node);
    update();
    return () => observer.disconnect();
  }, []);
  return (
    <svg
      ref={ref}
      aria-hidden="true"
      focusable="false"
      fill="none"
      className={className}
    >
      <path
        d={drawing}
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
