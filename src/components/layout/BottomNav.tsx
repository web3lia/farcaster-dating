"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, MessageCircle, UserCircle } from "lucide-react";
const HeartIcon = Heart, ChatBubbleLeftRightIcon = MessageCircle, UserCircleIcon = UserCircle;
const HeartSolid = Heart, ChatSolid = MessageCircle, UserSolid = UserCircle;

const links = [
  { href: "/swipe", label: "Discover", Icon: HeartIcon, ActiveIcon: HeartSolid },
  { href: "/matches", label: "Matches", Icon: ChatBubbleLeftRightIcon, ActiveIcon: ChatSolid },
  { href: "/profile", label: "Profile", Icon: UserCircleIcon, ActiveIcon: UserSolid },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-md border-t border-gray-800 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16">
        {links.map(({ href, label, Icon, ActiveIcon }) => {
          const active = pathname.startsWith(href);
          const Ico = active ? ActiveIcon : Icon;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-6 py-2 transition-colors ${
                active ? "text-brand-500" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Ico className="w-6 h-6" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
