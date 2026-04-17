import { useMemo } from "react";

/**
 * Dark navy animated background with floating orbs, grid, and particles.
 * Used on Landing + Auth pages.
 */
export const AnimatedDarkBackground = () => {
  const particles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: 2 + Math.random() * 2,
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 5,
      })),
    []
  );

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base */}
      <div className="absolute inset-0 bg-[#020B18]" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Orbs */}
      <div
        className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full blur-3xl opacity-50"
        style={{ background: "#1D4ED8", animation: "float-orb-1 26s ease-in-out infinite" }}
      />
      <div
        className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full blur-3xl opacity-40"
        style={{ background: "#06B6D4", animation: "float-orb-2 30s ease-in-out infinite" }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full blur-3xl opacity-30"
        style={{ background: "#7C3AED", animation: "float-orb-1 34s ease-in-out infinite reverse" }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-[420px] h-[420px] rounded-full blur-3xl opacity-25"
        style={{ background: "#0EA5E9", animation: "float-orb-2 22s ease-in-out infinite" }}
      />
      <div
        className="absolute -bottom-32 -right-20 w-[480px] h-[480px] rounded-full blur-3xl opacity-35"
        style={{ background: "#2563EB", animation: "float-orb-1 28s ease-in-out infinite" }}
      />

      {/* Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{
            top: `${p.top}%`,
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animation: `particle-pulse ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#020B18]/60" />
    </div>
  );
};
