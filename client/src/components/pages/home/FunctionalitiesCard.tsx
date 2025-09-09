import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

export function FunctionalitiesCard() {
  return (
    <Card className="w-full ">
      <CardHeader>
        <div className="relative h-50 mb-3">
          <Image src="/image.png" alt="image" fill className="object-cover" />
        </div>
        <CardTitle>To-do list</CardTitle>
        <CardDescription>
          Organise your daily tastks efficiently{" "}
        </CardDescription>
      </CardHeader>
      <CardContent>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Provident
        minus, dolor assumenda illum rem aliquam similique ad. Cumque veritatis
        nam voluptatum repellendus cum sit expedita eum ad sint? Labore,
        repudiandae.
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button type="submit" className="w-full">
          Login
        </Button>
      </CardFooter>
    </Card>
  );
}
