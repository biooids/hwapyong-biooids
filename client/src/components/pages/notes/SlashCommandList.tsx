import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Heading1, List, Quote, Code, Sparkles } from "lucide-react";

// Define the type for each command item
export interface CommandItemProps {
  title: string;
  icon: React.ReactNode;
  action: () => void;
}

// Define the props for the command list component
interface SlashCommandListProps {
  items: CommandItemProps[];
  command: (item: CommandItemProps) => void;
}

export const SlashCommandList = forwardRef(
  (props: SlashCommandListProps, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = props.items[index];
      if (item) {
        props.command(item);
      }
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: React.KeyboardEvent }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex(
            (selectedIndex + props.items.length - 1) % props.items.length
          );
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((selectedIndex + 1) % props.items.length);
          return true;
        }
        if (event.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    if (props.items.length === 0) {
      return null;
    }

    return (
      <div className="z-50 w-64 rounded-lg border bg-background p-2 shadow-xl">
        {props.items.map((item, index) => (
          <button
            key={index}
            className={`flex w-full items-center gap-2 rounded-md p-2 text-left text-sm ${
              index === selectedIndex ? "bg-secondary" : "bg-transparent"
            }`}
            onClick={() => selectItem(index)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-secondary">
              {item.icon}
            </div>
            <div>
              <p className="font-medium">{item.title}</p>
            </div>
          </button>
        ))}
      </div>
    );
  }
);

SlashCommandList.displayName = "SlashCommandList";
