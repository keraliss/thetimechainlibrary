import { Hero } from "~/components/hero/Hero";
import { StacksEntrance } from "~/components/hero/StacksEntrance";
import { Library } from "~/components/stacks/Library";

export function meta() {
  return [
    { title: "The Timechain Library" },
    { name: "description", content: "Every book ever written about Bitcoin, gathered in one hall." },
  ];
}

export default function Home() {
  return (
    <main>
      <Hero />
      <StacksEntrance>
        <Library />
      </StacksEntrance>
    </main>
  );
}
