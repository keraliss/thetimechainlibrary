import { Hero } from "~/components/hero/Hero";
import { StacksEntrance } from "~/components/hero/StacksEntrance";
import { Library } from "~/components/stacks/Library";
import { SiteNav } from "~/components/ui/SiteNav";
import { useInStacks } from "~/lib/stacksMode";

export function meta() {
  return [
    { title: "The Timechain Library" },
    { name: "description", content: "Every book ever written about Bitcoin, gathered in one hall." },
  ];
}

export default function Home() {
  const inStacks = useInStacks();
  return (
    <main>
      {inStacks ? <SiteNav /> : <Hero />}
      <StacksEntrance locked={inStacks}>
        <Library />
      </StacksEntrance>
    </main>
  );
}
