import { Button } from "../../ui/button";
import { FunctionalitiesCard } from "./FunctionalitiesCard";

function Home() {
  return (
    <section className="flex flex-col gap-10 p-5">
      <section className="w-[50%] m-auto text-center flex flex-col gap-3">
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold">
          Hwapyong, the all in one
        </h1>
        <p className=" lg:text-xl ">
          A unified platform designed for everyday productivity, it helps users
          stay organized, manage tasks, and access useful features in a single
          place.
        </p>
      </section>
      <section className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
        <FunctionalitiesCard />
        <FunctionalitiesCard />
        <FunctionalitiesCard />
        <FunctionalitiesCard />
        <FunctionalitiesCard />
      </section>
    </section>
  );
}
export default Home;
