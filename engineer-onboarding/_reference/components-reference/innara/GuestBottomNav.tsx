import { Sparkles, Compass, ClipboardList, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { icon: Sparkles, label: 'Concierge', path: '/guest' },
  { icon: Compass, label: 'Explore', path: '/guest/explore' },
  { icon: ClipboardList, label: 'Requests', path: '/guest/requests' },
  { icon: User, label: 'Profile', path: '/guest/profile' },
];

export function GuestBottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav w-full">
      <div className="flex items-center justify-around py-3 px-4 max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-1.5 py-2 px-4 transition-all duration-300 relative ${
                isActive 
                  ? 'text-[#1a1d3a]' 
                  : 'text-[#1a1d3a]/60 hover:text-[#1a1d3a]/90'
              }`}
            >
              <Icon 
                className={`w-5 h-5 transition-all duration-300 ${isActive ? 'scale-110' : ''}`} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
              <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#1a1d3a] rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
