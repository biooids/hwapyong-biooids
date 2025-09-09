import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import NotesCard from "./NotesCard";

function NotesMainPage() {
  return (
    <section className="p-3 md:p-5 flex flex-col gap-5">
      <div className="w-full h-60 relative rounded-lg overflow-hidden">
        <Image src="/image.png" alt="image" fill className="object-cover" />
      </div>

      <nav className="flex gap-3">
        <Button>All</Button>
        <Button>Create</Button>
      </nav>
      <section className="flex flex-col gap-5">
        {/* search and filtering  */}
        <div>
          <div className="flex flex-col gap-5">
            {" "}
            <form className="grid grid-cols-2 gap-3 ">
              <div>
                <Input type="search" />
              </div>
              <div>
                {" "}
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Newest" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="az">A-Z</SelectItem>
                    <SelectItem value="za">Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </form>
            <div className="p-3 bg-foreground/10 rounded-lg flex flex-col gap-5">
              <div>
                priority :{" "}
                <span className="border-2 p-1 rounded-lg  bg-yellow-500 text-zinc-900 font-bold text-xs">
                  high
                </span>
                <span className="border-2 p-1 rounded-lg  bg-yellow-500 text-zinc-900 font-bold text-xs">
                  high
                </span>
                <span className="border-2 p-1 rounded-lg  bg-yellow-500 text-zinc-900 font-bold text-xs">
                  high
                </span>
              </div>
              <div>
                Tags :{" "}
                <span className="border-2 p-1 rounded-lg  bg-yellow-500 text-zinc-900 font-bold text-xs">
                  Homework
                </span>
                <span className="border-2 p-1 rounded-lg  bg-yellow-500 text-zinc-900 font-bold text-xs">
                  studying
                </span>
              </div>
              <Button className="w-fit">clear filters</Button>
            </div>
          </div>{" "}
        </div>

        <div className="p-3 bg-foreground/10 rounded-lg">
          Looks like you have 4% percent finished today at least add 20%, you
          can make it
        </div>

        {/* notes  */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 ">
          <NotesCard />
          <NotesCard />
          <NotesCard />
          <NotesCard />
        </section>
      </section>
    </section>
  );
}
export default NotesMainPage;
