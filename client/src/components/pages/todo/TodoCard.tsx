import { Check, CheckCheck, CheckSquare } from "lucide-react";

function TodoCard() {
  return (
    <div className="flex p-3 bg-foreground/10 rounded-lg gap-3 border-2">
      <div>
        <CheckSquare />
      </div>
      <div className="flex flex-col gap-5 ">
        <h3 className="font-bold text-xl">Title: Buy groceries for the week</h3>
        <p>
          Description: Pick up vegetables, fruits, bread, eggs, and milk from
          the supermarket. Don’t forget to check for discounts on cereals.
        </p>
        <div className="flex gap-3">
          <span className="border-2 p-1 rounded-lg bg-accent-foreground/10 text-sm flex items-center">
            school
          </span>
        </div>
        <div className="flex justify-between border-t-2 pt-5">
          <div className="flex flex-col text-sm">
            <span>Date created: 2025/09/11 17:30</span>
            <span>Date edited: 2025/09/11 17:30</span>
          </div>
          <span className="border-2 p-1 rounded-lg  bg-yellow-500 text-zinc-900 font-bold text-sm h-fit w-fit">
            high
          </span>
        </div>
      </div>
    </div>
  );
}
export default TodoCard;
