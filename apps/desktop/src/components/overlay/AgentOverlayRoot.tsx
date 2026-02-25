import { useEffect } from "react";
import { AgentOverlaySideEffects } from "./AgentOverlaySideEffects";
import { AgentSection } from "./AgentSection";

export const AgentOverlayRoot = () => {
  useEffect(() => {
    document.body.style.backgroundColor = "transparent";
    document.body.style.margin = "0";
    document.documentElement.style.backgroundColor = "transparent";
  }, []);

  return (
    <>
      <AgentOverlaySideEffects />
      <div className="pointer-events-none fixed inset-0 bg-transparent">
        <AgentSection />
      </div>
    </>
  );
};
