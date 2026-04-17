import { Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  to?: string;
  variant?: "default" | "light";
}

export const Logo = ({ to = "/", variant = "default" }: Props) => (
  <Link to={to} className="flex items-center gap-2 group">
    <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform">
      <Stethoscope className="w-5 h-5 text-white" />
    </div>
    <span
      className={
        variant === "light"
          ? "text-xl font-bold bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-transparent"
          : "text-xl font-bold gradient-text"
      }
    >
      Decodex
    </span>
  </Link>
);
