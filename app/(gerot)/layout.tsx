import type { ReactNode } from "react";
import GerotLayout from "@/components/gerot-layout";

export default function GerotDirectLayout({ children }: { children: ReactNode }) {
  return <GerotLayout>{children}</GerotLayout>;
}
