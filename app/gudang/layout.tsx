import { ReactNode } from "react";
import GudangAccessGate from "./GudangAccessGate";

export default function GudangLayout({ children }: { children: ReactNode }) {
  return <GudangAccessGate>{children}</GudangAccessGate>;
}
