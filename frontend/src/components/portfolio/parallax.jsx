"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { createContext, useContext, useRef } from "react";

const ScrollProgress = createContext(null);

export function ParallaxGroup({ as: Tag = "div", ref, children, ...props }) {
  const localRef = useRef(null);
  const target = ref || localRef;
  const { scrollYProgress } = useScroll({
    target,
    offset: ["start end", "end start"],
  });

  return (
    <Tag ref={target} {...props}>
      <ScrollProgress.Provider value={scrollYProgress}>
        {children}
      </ScrollProgress.Provider>
    </Tag>
  );
}

export function ParallaxLayer({ distance = 20, className = "", ...props }) {
  const progress = useContext(ScrollProgress);
  const offset = useTransform(
    progress,
    [0, 1],
    [`${distance}px`, `${-distance}px`],
  );

  return (
    <motion.div
      className={`parallax-layer ${className}`}
      style={{ "--parallax-offset": offset }}
      {...props}
    />
  );
}
