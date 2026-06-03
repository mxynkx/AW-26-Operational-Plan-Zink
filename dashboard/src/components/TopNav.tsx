import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function TopNav() {
  const { logout } = useAuth();

  const tabClass = (active: boolean) =>
    `px-4 py-1.5 rounded-md text-[12.5px] font-medium border-none cursor-pointer transition-all ${
      active
        ? "bg-white text-primary font-semibold"
        : "bg-transparent text-white/55 hover:bg-white/10 hover:text-white"
    }`;

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

      <div className="ml-auto flex items-center gap-3">
        <div className="text-[14px] font-bold text-white shrink-0">
          Retail<span className="text-[#7aa8ff] not-italic font-bold">Plan</span>{" "}
          <span className="text-white/40 text-[11px] font-normal">AW26</span>
        </div>
        <button
          type="button"
          className="text-[11px] font-semibold text-white/70 hover:text-white px-2 py-1 rounded hover:bg-white/10"
          onClick={logout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
