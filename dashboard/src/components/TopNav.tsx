import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Icon } from "./Icon";

interface TopNavProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  excelFilename?: string;
  onDownload?: () => void;
  downloading?: boolean;
  showSearch?: boolean;
}

export function TopNav({
  search = "",
  onSearchChange,
  excelFilename = "",
  onDownload,
  downloading = false,
  showSearch = false,
}: TopNavProps) {
  const { logout } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center h-full border-b-2 pb-1 text-body-md transition-colors ${
      isActive
        ? "text-primary border-primary"
        : "text-secondary border-transparent hover:text-primary"
    }`;

  return (
    <header className="bg-surface-container-lowest border-b border-surface-border flex justify-between items-center w-full px-margin-edge h-16 z-50 shrink-0">
      <div className="flex items-center gap-6 min-w-0">
        <NavLink to="/" className="flex items-center gap-2 shrink-0">
          <img
            src="/datahat-logo.png"
            alt="Data-Hat"
            className="h-8 w-auto object-contain"
          />
          <span className="text-title-sm font-bold text-primary hidden sm:inline">Retail Planner</span>
        </NavLink>
        <nav className="hidden md:flex gap-4 h-16 items-stretch">
          <NavLink to="/" end className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/data" className={linkClass}>
            Plan Data
          </NavLink>
        </nav>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {showSearch && onSearchChange ? (
          <div className="hidden md:flex items-center bg-surface-container-low rounded px-3 py-1">
            <Icon name="search" className="text-secondary text-sm mr-2" />
            <input
              className="bg-transparent border-none focus:ring-0 text-body-md text-on-surface w-40 lg:w-48 p-0 outline-none"
              placeholder="Search..."
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        ) : null}

        {onDownload ? (
          <button
            type="button"
            title={`Download ${excelFilename}`}
            disabled={downloading}
            className="p-1.5 text-secondary hover:bg-surface-container-low rounded transition-colors disabled:opacity-50"
            onClick={onDownload}
          >
            <Icon name="download" />
          </button>
        ) : null}

        <button
          type="button"
          className="text-label-caps text-secondary hover:text-primary px-2 py-1 rounded hover:bg-surface-container-low"
          onClick={logout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
