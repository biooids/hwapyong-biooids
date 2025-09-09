import { Button } from "@/components/ui/button";
import { Check, CheckCheck, CheckSquare, Cross, Grab } from "lucide-react";
import Link from "next/link";

function NotesCard() {
  return (
    <div className=" p-3 bg-foreground/10 rounded-lg gap-3 border-2 flex flex-col relative">
      <div className="flex justify-between">
        {" "}
        <h3 className="font-bold text-xl">Title: Buy groceries for the week</h3>
        <span className="cursor-grab bg-foreground/10 p-1  text-xs">
          || drag drop ||
        </span>
      </div>
      <p>
        Description: Pick up vegetables, fruits, bread, eggs, and milk from the
        supermarket. Don’t forget to check for discounts on cereals.
      </p>
      <div className="flex gap-3">
        <span className="border-2 p-1 rounded-lg bg-accent-foreground/10 text-sm flex items-center">
          school
        </span>
      </div>
      <div className="flex flex-col text-sm border-t-2  pt-3">
        <span>Date created: 2025/09/11 17:30</span>
        <span>Date edited: 2025/09/11 17:30</span>
      </div>
      <div className="flex flex-col gap-3">
        <Link href="notes/1" className=" w-fit">
          <Button className="cursor-pointer ">read</Button>
        </Link>
      </div>
      <div className="p-1 bg-yellow-700 rounded-lg"></div>
    </div>
  );
}
export default NotesCard;
