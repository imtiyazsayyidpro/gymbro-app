"use client";

import { useCallback, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";

export function useTilt(maxTilt = 6) {
  const [tiltStyle, setTiltStyle] = useState<CSSProperties>({});
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const onMouseMove = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      const el = e.currentTarget as HTMLElement;
      const rect = el.getBoundingClientRect();
      const rx = (-(e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * maxTilt;
      const ry = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * maxTilt;

      setTiltStyle({
        transform: `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02, 1.02, 1.02)`,
        transition: "transform 60ms linear, border-color 150ms ease, background-color 150ms ease",
        willChange: "transform",
      });
      setGlare({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
        opacity: 1,
      });
    },
    [maxTilt],
  );

  const onMouseLeave = useCallback(() => {
    setTiltStyle({
      transform: "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      transition: "transform 500ms cubic-bezier(0.16, 1, 0.3, 1)",
      willChange: "auto",
    });
    setGlare((g) => ({ ...g, opacity: 0 }));
  }, []);

  const glareStyle: CSSProperties = {
    opacity: glare.opacity,
    background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.07) 0%, transparent 55%)`,
    transition: glare.opacity === 0 ? "opacity 350ms ease-out" : "none",
  };

  return { tiltStyle, glareStyle, onMouseMove, onMouseLeave };
}
