import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { countUniqueStores } from "../utils/planFilters";

interface TopNavProps {
  storeBadge?: number;
}

export function TopNav({ storeBadge }: TopNavProps) {
  const { logout } = useAuth();
  const { rows, meta } = useData();
  const stores =
    storeBadge ?? (rows.length > 0 ? countUniqueStores(rows) : meta?.dimensions.Site_Code.length ?? 0);

  const tabClass = (active: boolean) =>
    `px-4 py-1.5 rounded-md text-[12.5px] font-medium border-none cursor-pointer transition-all ${
      active
        ? "bg-white text-primary font-semibold"
        : "bg-transparent text-white/55 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <header className="aw26-topbar flex items-center px-5 gap-3 h-[50px] shrink-0 z-50">
      <div className="text-[14px] font-bold text-white shrink-0">
        Retail<span className="text-inverse-primary not-italic font-bold">Plan</span>{" "}
        <span className="text-white/30 text-[11px] font-normal">AW26</span>
      </div>
      <div className="w-px h-[18px] bg-white/20 shrink-0" />

      <nav className="flex gap-1">
        <NavLink to="/" className={({ isActive }) => tabClass(isActive)} end>
          Dashboard
        </NavLink>
        <NavLink to="/pivot" className={({ isActive }) => tabClass(isActive)}>
          Pivot Explorer
        </NavLink>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/12 text-white/80 border border-white/20">
          AW26 Plan
        </span>
        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-success-emerald/20 text-emerald-300 border border-success-emerald/30">
          {stores} Stores
        </span>
        <button
          type="button"
          className="text-[11px] font-semibold text-white/70 hover:text-white px-2 py-1 rounded hover:bg-white/10 ml-1"
          onClick={logout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
