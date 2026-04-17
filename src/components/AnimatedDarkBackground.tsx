import { useMemo } from "react";

/**
 * Premium dark medical-AI background.
 * - Navy base (#020B18) + grid
 * - Floating orbs (cyan/blue glow)
 * - Subtle medical SVG icons (brain, lungs, heart, plus) drifting
 * - Animated ECG line sweeping horizontally
 * - Glowing particles
 */
export const AnimatedDarkBackground = () => {
  const particles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        top: (i * 17 + 7) % 95,
        left: (i * 23 + 11) % 95,
        size: 2 + ((i * 7) % 3),
        delay: (i * 0.4) % 5,
        duration: 3 + (i % 5),
      })),
    []
  );

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base */}
      <div className="absolute inset-0 bg-[#020B18]" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Glow orbs */}
      <div
        className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full blur-3xl opacity-40"
        style={{ background: "#1D4ED8", animation: "float-orb-1 26s ease-in-out infinite" }}
      />
      <div
        className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full blur-3xl opacity-30"
        style={{ background: "#06B6D4", animation: "float-orb-2 30s ease-in-out infinite" }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full blur-3xl opacity-25"
        style={{ background: "#7C3AED", animation: "float-orb-1 34s ease-in-out infinite reverse" }}
      />
      <div
        className="absolute -bottom-32 -right-20 w-[480px] h-[480px] rounded-full blur-3xl opacity-30"
        style={{ background: "#2563EB", animation: "float-orb-1 28s ease-in-out infinite" }}
      />

      {/* Medical SVG icons — subtle, slowly floating */}
      {/* Brain */}
      <svg
        className="absolute"
        style={{
          top: "10%", left: "4%", width: 140, height: 140,
          color: "#22d3ee", opacity: 0.07,
          animation: "med-float 14s ease-in-out infinite",
        }}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
      >
        <path d="M9.5 2A2.5 2.5 0 0 0 7 4.5v.5a2.5 2.5 0 0 0-2 2.45A3 3 0 0 0 4 13a3 3 0 0 0 1 5.83A2.5 2.5 0 0 0 7.5 21a2.5 2.5 0 0 0 2.5-2.5V2.5A.5.5 0 0 0 9.5 2z" />
        <path d="M14.5 2A2.5 2.5 0 0 1 17 4.5v.5a2.5 2.5 0 0 1 2 2.45A3 3 0 0 1 20 13a3 3 0 0 1-1 5.83A2.5 2.5 0 0 1 16.5 21a2.5 2.5 0 0 1-2.5-2.5V2.5a.5.5 0 0 1 .5-.5z" />
      </svg>

      {/* Lungs */}
      <svg
        className="absolute"
        style={{
          top: "55%", left: "2%", width: 130, height: 130,
          color: "#60a5fa", opacity: 0.07,
          animation: "med-float 17s ease-in-out infinite",
          animationDelay: "2s",
        }}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
      >
        <path d="M12 3v15" />
        <path d="M9 6c-2 1-4 4-4 8 0 3 1 5 3 6 1.5.7 3-.5 3-2V8" />
        <path d="M15 6c2 1 4 4 4 8 0 3-1 5-3 6-1.5.7-3-.5-3-2V8" />
      </svg>

      {/* Heart */}
      <svg
        className="absolute"
        style={{
          top: "18%", right: "5%", width: 110, height: 110,
          color: "#f472b6", opacity: 0.07,
          animation: "med-float 13s ease-in-out infinite",
          animationDelay: "1s",
        }}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>

      {/* DNA */}
      <svg
        className="absolute"
        style={{
          top: "70%", right: "6%", width: 100, height: 100,
          color: "#22d3ee", opacity: 0.06,
          animation: "med-float 15s ease-in-out infinite",
          animationDelay: "3s",
        }}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
      >
        <path d="M4 3c4 4 12 4 16 0M4 21c4-4 12-4 16 0M5 8h14M5 16h14M7 5v14M17 5v14" />
      </svg>

      {/* Medical plus icons */}
      {[
        { top: "8%", left: "55%", size: 28, delay: "0s" },
        { top: "40%", left: "85%", size: 22, delay: "1.5s" },
        { top: "78%", left: "45%", size: 26, delay: "2.2s" },
        { top: "30%", left: "30%", size: 20, delay: "0.8s" },
        { top: "88%", left: "75%", size: 24, delay: "3s" },
      ].map((p, i) => (
        <svg
          key={`plus-${i}`}
          className="absolute"
          style={{
            top: p.top, left: p.left, width: p.size, height: p.size,
            color: "#06B6D4", opacity: 0.18,
            animation: "med-float 10s ease-in-out infinite",
            animationDelay: p.delay,
            filter: "drop-shadow(0 0 6px rgba(6,182,212,0.5))",
          }}
          viewBox="0 0 24 24" fill="currentColor"
        >
          <path d="M11 2h2v9h9v2h-9v9h-2v-9H2v-2h9z" />
        </svg>
      ))}

      {/* ECG line sweeping horizontally */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: "62%",
          height: 80,
          opacity: 0.35,
          maskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
        }}
      >
        <svg
          viewBox="0 0 1200 80"
          preserveAspectRatio="none"
          className="w-[200%] h-full"
          style={{ animation: "ecg-scroll 8s linear infinite" }}
        >
          <path
            d="M0 40 L150 40 L170 40 L180 20 L190 60 L200 10 L210 70 L220 40 L380 40 L400 40 L410 25 L420 55 L430 15 L440 65 L450 40 L600 40 L620 40 L630 20 L640 60 L650 10 L660 70 L670 40 L820 40 L840 40 L850 25 L860 55 L870 15 L880 65 L890 40 L1050 40 L1070 40 L1080 20 L1090 60 L1100 10 L1110 70 L1120 40 L1200 40"
            fill="none"
            stroke="#06B6D4"
            strokeWidth="1.5"
            style={{ filter: "drop-shadow(0 0 6px #06B6D4)" }}
          />
        </svg>
      </div>

      {/* Scanning line */}
      <div
        className="absolute left-0 right-0 h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(6,182,212,0.6), transparent)",
          animation: "scan-line-move 9s linear infinite",
          boxShadow: "0 0 14px rgba(6,182,212,0.6)",
        }}
      />

      {/* Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-cyan-200"
          style={{
            top: `${p.top}%`,
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animation: `particle-pulse ${p.duration}s ease-in-out ${p.delay}s infinite`,
            boxShadow: "0 0 6px rgba(34,211,238,0.7)",
          }}
        />
      ))}

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#020B18]/70" />
    </div>
  );
};
