"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartIcon, ChatBubbleLeftRightIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid, ChatBubbleLeftRightIcon as ChatSolid, UserCircleIcon as UserSolid } from "@heroicons/react/24/solid";

const links = [
  { href: "/swipe", label: "Discover", Icon: HeartIcon, ActiveIcon: HeartSolid },
  { href: "/matches", label: "Matches", Icon: ChatBubbleLeftRightIcon, ActiveIcon: ChatSolid },
  { href: "/profile", label: "Profile", Icon: UserCircleIcon, ActiveIcon: UserSolid },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 safe-bottom bg-gray-900/90 backdrop-blur-md border-t border-gray-800 z-40">
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
