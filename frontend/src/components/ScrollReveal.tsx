// "use client" — needs browser APIs (Intersection Observer)
"use client";

import { useEffect, useRef, useState } from "react";

// ============================================================
// SCROLL REVEAL WRAPPER
// ============================================================
// Wraps any content and fades it in when it scrolls into view.
// Uses Intersection Observer API — the browser tells us when
// an element becomes visible instead of checking on every scroll.
//
// Usage: <ScrollReveal><YourContent /></ScrollReveal>
// ============================================================

interface ScrollRevealProps {
  children: React.ReactNode;
  // "direction" controls where the element slides FROM
  direction?: "up" | "down" | "left" | "right" | "none";
  // delay in milliseconds — stagger multiple elements
  delay?: number;
  className?: string;
}

export default function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  className = "",
}: ScrollRevealProps) {
  // Track whether the element has been revealed
  const [isVisible, setIsVisible] = useState(false);
  // useRef creates a reference to the actual DOM element
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Intersection Observer watches an element and fires callback
    // when it enters/leaves the viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        // entry.isIntersecting = true when element is visible
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Stop observing after first reveal (don't re-animate on scroll up)
          observer.unobserve(element);
        }
      },
      {
        // trigger when 15% of the element is visible
        threshold: 0.15,
      }
    );

    observer.observe(element);

    // Cleanup
    return () => observer.disconnect();
  }, []);

  // Starting position based on direction
  const directionStyles: Record<string, string> = {
    up: "translate-y-8",      // starts 32px below, slides up
    down: "-translate-y-8",   // starts 32px above, slides down
    left: "translate-x-8",    // starts 32px right, slides left
    right: "-translate-x-8",  // starts 32px left, slides right
    none: "",                 // no movement, just fade
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible
          ? "opacity-100 translate-x-0 translate-y-0"
          : `opacity-0 ${directionStyles[direction]}`
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
