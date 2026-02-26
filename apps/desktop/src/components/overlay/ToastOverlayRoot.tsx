import { useEffect } from "react";
import { ToastOverlaySideEffects } from "./ToastOverlaySideEffects";
import { ToastSection } from "./ToastSection";

export const ToastOverlayRoot = () => {
  useEffect(() => {
    document.body.style.backgroundColor = "transparent";
    document.body.style.margin = "0";
    document.documentElement.style.backgroundColor = "transparent";
  }, []);

  return (
    <>
      <ToastOverlaySideEffects />
      <div className="pointer-events-none fixed inset-0">
        <ToastSection />
      </div>
    </>
  );
};
