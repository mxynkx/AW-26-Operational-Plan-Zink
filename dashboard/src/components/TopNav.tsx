import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export function TopNav() {
  const { logout } = useAuth();
  const { season, setSeason, rows } = useData();

  const tabClass = (active: boolean) =>
    `px-4 py-1.5 rounded-md text-[12.5px] font-medium border-none cursor-pointer transition-all ${
      active
        ? "bg-white text-primary font-semibold"
        : "bg-transparent text-white/55 hover:bg-white/10 hover:text-white"
    }`;

  const storeCount = new Set(rows.map((r) => r.Site_Code)).size;

  return (
    <header className="aw26-topbar flex items-center px-5 gap-3 h-[50px] shrink-0 z-50">
      <NavLink to="/" className="flex items-center shrink-0">
        <img
          src="/datahat-logo.png"
          alt="Data-Hat"
          className="h-8 w-auto object-contain brightness-0 invert"
        />
      </NavLink>

      <div className="w-px h-[18px] bg-white/20 shrink-0" />

      <nav className="flex gap-1">
        <NavLink to="/" className={({ isActive }) => tabClass(isActive)} end>
          Dashboard
        </NavLink>
        <NavLink to="/pivot" className={({ isActive }) => tabClass(isActive)}>
          Pivot Explorer
        </NavLink>
      </nav>

      <div className="w-px h-[18px] bg-white/20 shrink-0" />

      <div className="season-bar">
        <button
          type="button"
          className={`sn-btn ${season === "AW26" ? "on-aw" : ""}`}
          onClick={() => setSeason("AW26")}
        >
          AW26
        </button>
        <button
          type="button"
          className={`sn-btn ${season === "SS26" ? "on-ss" : ""}`}
          onClick={() => setSeason("SS26")}
        >
          SS26
        </button>
        <button
          type="button"
          className={`sn-btn ${season === "Both" ? "on-both" : ""}`}
          onClick={() => setSeason("Both")}
        >
          Both
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className={`badge ${season === "AW26" ? "aw" : season === "SS26" ? "ss" : "both"}`}>
          {season === "AW26" ? "AW26 Season" : season === "SS26" ? "SS26 Season" : "Both Seasons"}
        </div>
        <div className="badge">
          {storeCount} Stores
        </div>
        <button
          type="button"
          className="text-[11px] font-semibold text-white/70 hover:text-white px-2 py-1 rounded hover:bg-white/10 ml-2"
          onClick={logout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

