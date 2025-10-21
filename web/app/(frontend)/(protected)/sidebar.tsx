// app/(frontend)/(protected)/sidebar.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Users, Inbox, Calendar, MapPin, User, MessageSquare, Shield } from "lucide-react";

interface SidebarProps {
  unreadCount: number;
  isAdmin?: boolean;
}

export default function Sidebar({ unreadCount, isAdmin = false }: SidebarProps) {
  const pathname = usePathname();

  // User links
  const userLinks = [
    { href: "/homepage", icon: Home, label: "Home" },
    { href: "/groups", icon: Users, label: "Study groups" },
    { href: "/chats", icon: MessageSquare, label: "Chats" },
    { href: "/inbox", icon: Inbox, label: "Inbox", showBadge: true, badgeCount: unreadCount },
    { href: "/schedule", icon: Calendar, label: "Schedule" },
    { href: "/Maps", icon: MapPin, label: "Location Map" },
    { href: "/myprofile", icon: User, label: "Profile" },
  ];

  // Admin links
  const adminLinks = [
    { href: "/admin", icon: Shield, label: "Admin Dashboard" },
    { href: "/reports", icon: Users, label: "Report Management" },
  ];

  // Use admin links if user is admin, otherwise user links
  const links = isAdmin ? adminLinks : userLinks;

  return (
    <aside className="w-64 border-r border-gray-300 min-h-screen bg-white p-4">
      <nav className="space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-6 py-2 font-medium rounded-xl transition-all duration-200 relative group ${
                isActive 
                  ? "bg-gradient-to-r from-blue-900 via-blue-800 to-black text-white shadow-lg" 
                  : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <Icon 
                size={18} 
                className={isActive ? "text-white" : "text-gray-600 group-hover:text-blue-600"}
              />
              <span className={isActive ? "text-white font-semibold" : "group-hover:text-blue-600"}>
                {link.label}
              </span>
              
              {/* Only show badge if count is 1 or more */}
              {link.showBadge && link.badgeCount !== undefined && link.badgeCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 text-xs font-bold rounded-full px-1 bg-red-500 text-white">
                  {link.badgeCount > 99 ? '99+' : link.badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}