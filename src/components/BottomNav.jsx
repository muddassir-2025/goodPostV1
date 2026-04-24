import { NavLink } from "react-router-dom";
import {
  HeartIcon,
  HomeIcon,
  ReelsIcon,
  SearchIcon,
  UserIcon,
  BellIcon,
} from "./ui/Icons";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import notificationService from "../appwrite/notification";

const items = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: "/search", label: "Search", icon: SearchIcon },
  { to: "/feed", label: "Following", icon: ReelsIcon },
  { to: "/notifications", label: "Alerts", icon: BellIcon },
  { to: "/profile", label: "Profile", icon: UserIcon },
];

export default function BottomNav() {
  const user = useSelector((state) => state.auth.userData);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    async function checkNotifications() {
      const count = await notificationService.countUnread(user.$id);
      setUnreadCount(count);
    }

    checkNotifications();
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-[540px] items-center justify-between rounded-full border border-white/10 bg-[#121212]/95 px-2 py-2 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        {items.map((item) => {
          const IconComponent = item.icon;

          return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex min-w-[62px] flex-col items-center gap-1 rounded-full px-3 py-2 text-[11px] font-medium transition ${
                isActive ? "bg-zinc-100 !text-zinc-950" : "text-zinc-400"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <IconComponent className="h-5 w-5" filled={isActive} />
                  {item.to === "/notifications" && unreadCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-black">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
