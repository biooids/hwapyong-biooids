import Image from "next/image";
import { ThemeToggler } from "./ThemeToggler";

function Header() {
  return (
    <div className="flex justify-between items-center bg-[var(--foreground)]/5 pt-3 pb-3 pl-5 pr-5 border-b-2 h-30">
      {" "}
      <div>hwapyong</div>
      <div>Welcome back hwapyong</div>
      <div className="flex items-center gap-3">
        <ThemeToggler />
        <div className="h-16 w-16 relative rounded-full overflow-hidden">
          <Image src="/image.png" alt="image" fill />
        </div>
      </div>
    </div>
  );
}
export default Header;
