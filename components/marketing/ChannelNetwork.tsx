"use client";

import { useRef } from "react";
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, MotionPathPlugin);

const HUB = { x: 600, y: 350 };

// Simple drawn glyphs (not official logos), centred on 0,0
const ICONS: Record<string, React.ReactNode> = {
  mail: (
    <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round">
      <rect x="-13" y="-9" width="26" height="18" rx="3" />
      <path d="M-13 -7 L0 3 L13 -7" />
    </g>
  ),
  megaphone: (
    <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
      <path d="M-12 -4 L-4 -4 L8 -11 L8 11 L-4 4 L-12 4 Z" />
      <path d="M-7 4 L-5 11" />
      <path d="M12 -4 Q15 0 12 4" />
    </g>
  ),
  search: (
    <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
      <circle cx="-3" cy="-3" r="8" />
      <path d="M3 3 L11 11" />
    </g>
  ),
  briefcase: (
    <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round">
      <rect x="-13" y="-6" width="26" height="17" rx="3" />
      <path d="M-5 -6 L-5 -11 L5 -11 L5 -6" />
      <path d="M-13 1 L13 1" />
    </g>
  ),
  chat: (
    <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round">
      <path d="M-12 -10 L12 -10 Q14 -10 14 -8 L14 5 Q14 7 12 7 L-2 7 L-9 12 L-8 7 L-12 7 Q-14 7 -14 5 L-14 -8 Q-14 -10 -12 -10 Z" />
    </g>
  ),
  camera: (
    <g fill="none" stroke="currentColor" strokeWidth="2.4">
      <rect x="-12" y="-12" width="24" height="24" rx="7" />
      <circle cx="0" cy="0" r="5.5" />
      <circle cx="7" cy="-7" r="1.2" fill="currentColor" />
    </g>
  ),
};

// Kept to the left/right edges so the hero text in the middle stays readable
const NODES = [
  { id: "gmail", label: "Gmail", icon: "mail", color: "#ea4335", x: 150, y: 168 },
  { id: "facebook", label: "Facebook Ads", icon: "megaphone", color: "#1877f2", x: 85, y: 365 },
  { id: "whatsapp", label: "WhatsApp", icon: "chat", color: "#25d366", x: 190, y: 500 },
  { id: "google", label: "Google Ads", icon: "search", color: "#fbbc04", x: 1050, y: 168 },
  { id: "linkedin", label: "LinkedIn", icon: "briefcase", color: "#0a66c2", x: 1115, y: 365 },
  { id: "instagram", label: "Instagram", icon: "camera", color: "#e1306c", x: 1010, y: 500 },
];

/** Gentle S-curve from the hub out to a node */
const pathTo = (x: number, y: number) => {
  const dx = x - HUB.x;
  const c1 = { x: HUB.x + dx * 0.45, y: HUB.y };
  const c2 = { x: HUB.x + dx * 0.55, y };
  return `M${HUB.x},${HUB.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${x},${y}`;
};

/**
 * Decorative hero background: marketing channels wired to a central MarketOS hub,
 * with data pulses travelling along each connection.
 */
export default function ChannelNetwork() {
  const root = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const lines = gsap.utils.toArray<SVGPathElement>(".cn-line");
      const nodes = gsap.utils.toArray<SVGGElement>(".cn-node");
      const dots = gsap.utils.toArray<SVGCircleElement>(".cn-dot");

      if (reduce) {
        gsap.set(dots, { autoAlpha: 0 });
        return;
      }

      // Intro: hub pops, wires draw out, channels appear
      lines.forEach((l) => {
        const len = l.getTotalLength();
        gsap.set(l, { strokeDasharray: len, strokeDashoffset: len });
      });
      const intro = gsap.timeline({ delay: 0.3 });
      intro
        .from(".cn-hub", { scale: 0, transformOrigin: "50% 50%", duration: 0.8, ease: "back.out(1.8)" })
        .to(lines, { strokeDashoffset: 0, duration: 1.2, stagger: 0.08, ease: "power2.inOut" }, "-=0.3")
        .from(nodes, { scale: 0, autoAlpha: 0, transformOrigin: "50% 50%", duration: 0.6, stagger: 0.08, ease: "back.out(2)" }, "-=1")
        .add(() => {
          // After drawing, switch wires to a dashed "flowing" look
          lines.forEach((l) => gsap.set(l, { strokeDasharray: "4 10", strokeDashoffset: 0 }));
          gsap.to(lines, { strokeDashoffset: -140, duration: 6, ease: "none", repeat: -1 });
        });

      // Data pulses: alternate inbound (channel → hub) and outbound (hub → channel)
      dots.forEach((dot, i) => {
        const line = lines[Math.floor(i / 2)];
        const inbound = i % 2 === 0;
        gsap.set(dot, { autoAlpha: 0 });
        gsap.to(dot, {
          motionPath: { path: line, align: line, alignOrigin: [0.5, 0.5], start: inbound ? 1 : 0, end: inbound ? 0 : 1 },
          autoAlpha: 1,
          duration: gsap.utils.random(2.4, 3.6),
          ease: "power1.inOut",
          repeat: -1,
          repeatDelay: gsap.utils.random(0.4, 2.2),
          delay: 1.6 + gsap.utils.random(0, 2.5),
        });
      });

      // Channels drift slightly so the scene feels alive
      nodes.forEach((n) => {
        gsap.to(n.querySelector(".cn-float"), {
          y: gsap.utils.random(-10, 10),
          x: gsap.utils.random(-6, 6),
          duration: gsap.utils.random(2.5, 4),
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      });

      // Hub heartbeat rings
      gsap.fromTo(
        ".cn-ring",
        { scale: 0.6, autoAlpha: 0.6, transformOrigin: "50% 50%" },
        { scale: 2.2, autoAlpha: 0, duration: 2.6, ease: "power1.out", stagger: { each: 1.3, repeat: -1 } }
      );
    },
    { scope: root }
  );

  return (
    <svg
      ref={root}
      className="cn"
      viewBox="0 0 1200 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="cn-wire" x1="0" x2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id="cn-dot-glow">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="45%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cn-hub-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(262, 80%, 65%)" />
          <stop offset="100%" stopColor="hsl(220, 90%, 62%)" />
        </linearGradient>
      </defs>

      {/* Wires */}
      {NODES.map((n) => (
        <path key={n.id} className="cn-line" d={pathTo(n.x, n.y)} fill="none" stroke="url(#cn-wire)" strokeWidth="1.6" />
      ))}

      {/* Pulses — two per wire */}
      {NODES.flatMap((n) => [0, 1].map((k) => <circle key={`${n.id}-${k}`} className="cn-dot" r="5" fill="url(#cn-dot-glow)" />))}

      {/* Hub */}
      <g className="cn-hub">
        <circle className="cn-ring" cx={HUB.x} cy={HUB.y} r="46" fill="none" stroke="#8b5cf6" strokeWidth="1.5" />
        <circle className="cn-ring" cx={HUB.x} cy={HUB.y} r="46" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
        <rect x={HUB.x - 40} y={HUB.y - 40} width="80" height="80" rx="22" fill="url(#cn-hub-fill)" />
        <text x={HUB.x} y={HUB.y + 11} textAnchor="middle" fontSize="32">
          🧠
        </text>
      </g>

      {/* Channels */}
      {NODES.map((n) => (
        <g key={n.id} className="cn-node" transform={`translate(${n.x} ${n.y})`}>
          <g className="cn-float">
            <circle r="34" fill="#0f1218" stroke={n.color} strokeOpacity="0.55" strokeWidth="1.5" />
            <circle r="34" fill={n.color} fillOpacity="0.1" />
            <g style={{ color: n.color }}>{ICONS[n.icon]}</g>
            <text y="56" textAnchor="middle" fontSize="14" fontWeight="600" fill="rgba(255,255,255,0.6)" fontFamily="Inter, sans-serif">
              {n.label}
            </text>
          </g>
        </g>
      ))}
    </svg>
  );
}
