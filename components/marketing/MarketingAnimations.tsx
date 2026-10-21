"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Wires up GSAP for the marketing pages via data attributes, so the pages
 * themselves can stay server components:
 *
 *   data-hero          hero elements, animated in on load (in DOM order)
 *   data-reveal        fade up when scrolled into view (siblings stagger)
 *   data-count="54"    count up to the number when visible (keeps data-suffix)
 *   data-fill="34"     bar grows to this width (%) when visible
 *   data-preview-row   product-preview rows that tick in one by one
 *   data-orb           background glow that drifts slowly
 *
 * Elements start hidden via CSS (`visibility: hidden`) and are revealed here,
 * so there's no flash of content before the animation runs.
 */
export default function MarketingAnimations() {
  useGSAP(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const all = (sel: string) => gsap.utils.toArray<HTMLElement>(sel);

    if (reduce) {
      gsap.set("[data-hero], [data-reveal], [data-preview-row]", { autoAlpha: 1 });
      all("[data-count]").forEach((el) => (el.textContent = `${el.dataset.count}${el.dataset.suffix ?? ""}`));
      all("[data-fill]").forEach((el) => gsap.set(el, { width: `${el.dataset.fill}%` }));
      return;
    }

    // ── Hero entrance ──
    const hero = gsap.timeline({ defaults: { ease: "power3.out" } });
    hero.fromTo("[data-hero]", { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.12 });

    // ── Product preview plays like a live batch ──
    const rows = all("[data-preview-row]");
    if (rows.length) {
      hero.fromTo(rows, { autoAlpha: 0, x: -16 }, { autoAlpha: 1, x: 0, duration: 0.45, stagger: 0.18 }, "-=0.2");
      hero.fromTo(
        "[data-preview-row] .mk-status",
        { scale: 0.6, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.35, stagger: 0.18, ease: "back.out(2.5)" },
        "<0.15"
      );
      gsap.to("[data-pulse]", { autoAlpha: 0.35, duration: 0.8, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 2.5 });
    }

    // ── Scroll reveals, staggered within each parent ──
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 88%",
      once: true,
      onEnter: (batch) =>
        gsap.fromTo(batch, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }),
    });

    // ── Count-ups ──
    all("[data-count]").forEach((el) => {
      const target = Number(el.dataset.count) || 0;
      const suffix = el.dataset.suffix ?? "";
      const state = { v: 0 };
      el.textContent = `0${suffix}`;
      gsap.to(state, {
        v: target,
        duration: 1.6,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top bottom", once: true },
        onUpdate: () => {
          el.textContent = `${Math.round(state.v)}${suffix}`;
        },
      });
    });

    // ── Bars fill ──
    all("[data-fill]").forEach((el) => {
      gsap.fromTo(
        el,
        { width: "0%" },
        { width: `${el.dataset.fill}%`, duration: 1.4, ease: "power2.out", scrollTrigger: { trigger: el, start: "top bottom", once: true } }
      );
    });

    // ── Ambient background glows ──
    all("[data-orb]").forEach((orb) => {
      gsap.to(orb, {
        x: () => gsap.utils.random(-140, 140),
        y: () => gsap.utils.random(-90, 90),
        scale: () => gsap.utils.random(0.85, 1.2),
        duration: () => gsap.utils.random(9, 14),
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        repeatRefresh: true,
      });
    });

    // ── Subtle parallax on the hero network ──
    gsap.to(".cn", {
      yPercent: 18,
      autoAlpha: 0.25,
      ease: "none",
      scrollTrigger: { trigger: ".mk-hero", start: "top top", end: "bottom top", scrub: true },
    });
  });

  return null;
}
