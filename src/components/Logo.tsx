import { Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";

export const Logo = ({ to = "/" }: { to?: string }) => (
  <Link to={to} className="flex items-center gap-2 group">
    <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform">
      <Stethoscope className="w-5 h-5 text-primary-foreground" />
    </div>
    <span className="text-xl font-bold gradient-text">Decodex</span>
  </Link>
);
