import { Book, Home, LucideIcon, Pen } from "lucide-react";

type navLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navLinks: navLink[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "todo", label: "To-do", icon: Pen },
  { href: "notes", label: "Notes", icon: Book },
];
