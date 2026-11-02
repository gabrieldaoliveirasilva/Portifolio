import type { Metadata } from "next";
import PeopleWorkspace from "@/components/people-workspace";

export const metadata: Metadata = {
  title: "People Track | ORÁCULO MG4"
};

export default function PeoplePage() {
  return (
    <main className="page people-page">
      <PeopleWorkspace />
    </main>
  );
}
