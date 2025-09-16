import { Button } from "@/components/ui/button";
import ExpenseNav from "./ExpenseNav";
import ExpenseCards from "./ExpenseCards";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function Expense() {
  return (
    <section className="flex gap-3 ">
      <ExpenseNav />
      <section className="section-gaps w-full  ">
        <section className="flex gap-3">
          <div className="bg-foreground/10 p-3 rounded-lg">
            <div className="flex flex-col   ">
              <h4>total expenses</h4>
              <p>This month</p>
            </div>
            <span>2,345 Rwf</span>
          </div>
          <div className="bg-foreground/10 p-3 rounded-lg">
            <div className="flex flex-col  ">
              <h4>total income</h4>
              <p>This month</p>
            </div>
            <span>20,3000</span>
          </div>
        </section>

        <section className="bg-foreground/5 p-5 rounded-lg flex flex-col gap-5">
          <h3 className="font-bold">Recent Spending</h3>
          <div className="flex flex-colg gap-3">
            <div>Total this month : 24</div>
            <div></div>
            <div>
              <span></span>
            </div>
          </div>
          <div className="flex  gap-3">
            <Input />
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Fruits</SelectLabel>
                  <SelectItem value="apple">Apple</SelectItem>
                  <SelectItem value="banana">Banana</SelectItem>
                  <SelectItem value="blueberry">Blueberry</SelectItem>
                  <SelectItem value="grapes">Grapes</SelectItem>
                  <SelectItem value="pineapple">Pineapple</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Fruits</SelectLabel>
                  <SelectItem value="apple">Apple</SelectItem>
                  <SelectItem value="banana">Banana</SelectItem>
                  <SelectItem value="blueberry">Blueberry</SelectItem>
                  <SelectItem value="grapes">Grapes</SelectItem>
                  <SelectItem value="pineapple">Pineapple</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <section className="flex flex-col gap-3">
            <ExpenseCards />
            <ExpenseCards />
            <ExpenseCards />
          </section>
        </section>
      </section>
    </section>
  );
}
export default Expense;
