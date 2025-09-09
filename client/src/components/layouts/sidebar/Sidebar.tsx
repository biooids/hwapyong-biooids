import Link from "next/link";
import { navLinks } from "./navLinks";

function Sidebar() {
  return (
    <div className=" w-60 p-5 sticky top-30">
      {" "}
      <nav className="flex flex-col">
        {navLinks
          ? navLinks.map((link) => {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:bg-[var(--foreground)]/10 p-3  rounded-lg flex gap-3  items-center"
                >
                  <link.icon size={20} />
                  {link.label}
                </Link>
              );
            })
          : ""}
      </nav>
    </div>
  );
}
export default Sidebar;
