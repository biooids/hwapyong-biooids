import { ForkKnife, PlaneTakeoff } from "lucide-react";

function ExpenseCards() {
  return (
    <div className="p-5 bg-foreground/10 rounded-lg flex  gap-5">
      <span className="p-3 border-2 rounded-lg h-fit">
        <ForkKnife />
      </span>
      <div className="flex gap-3 flex-col">
        <div>
          <h5>Entertainment</h5>
          <span className="text-xs">1 min ago</span>
        </div>
        <div className="flex flex-col ">
          {" "}
          <span>3400 Rwf</span>
        </div>
      </div>
    </div>
  );
}
export default ExpenseCards;
