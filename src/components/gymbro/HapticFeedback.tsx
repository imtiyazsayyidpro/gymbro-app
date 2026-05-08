"use client";

import { useEffect, useRef } from "react";

const interactiveSelector = ["button", "a[href]", "input", "textarea", "select", "summary", "label[for]", "[role='button']", "[role='tab']", "[data-haptic]"].join(",");

type HapticNavigator = Navigator & {
  vibrate?: (pattern: number | number[]) => boolean;
};

function canVibrate() {
  return typeof navigator !== "undefined" && typeof (navigator as HapticNavigator).vibrate === "function";
}

function isDisabled(element: Element) {
  return element.getAttribute("aria-disabled") === "true" || element.hasAttribute("disabled") || Boolean(element.closest("[aria-disabled='true'], [disabled]"));
}

function getHapticPattern(element: Element) {
  const explicitPattern = element.getAttribute("data-haptic");

  if (explicitPattern === "off") return null;
  if (explicitPattern === "strong") return 35;
  if (explicitPattern === "soft") return 16;

  if (element.matches("input, textarea, select, label[for]")) return 18;

  return 25;
}

export function HapticFeedback() {
  const lastVibrationAtRef = useRef(0);

  useEffect(() => {
    if (!canVibrate()) return;

    function vibrateForElement(element: Element) {
      if (isDisabled(element)) return;

      const now = window.performance.now();
      if (now - lastVibrationAtRef.current < 60) return;

      const pattern = getHapticPattern(element);
      if (!pattern) return;

      lastVibrationAtRef.current = now;
      (navigator as HapticNavigator).vibrate?.(pattern);
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.pointerType === "mouse") return;

      const target = event.target instanceof Element ? event.target : null;
      const interactiveElement = target?.closest(interactiveSelector);

      if (interactiveElement) {
        vibrateForElement(interactiveElement);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Enter" && event.key !== " ") return;

      const target = event.target instanceof Element ? event.target : null;
      const interactiveElement = target?.closest(interactiveSelector);

      if (interactiveElement) {
        vibrateForElement(interactiveElement);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  return null;
}
