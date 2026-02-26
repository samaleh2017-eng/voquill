import { ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type BouncyTooltipProps = {
  visible: boolean;
  children: ReactNode;
  align?: "left" | "center" | "right";
  delay?: number;
};

export const BouncyTooltip = ({
  visible,
  children,
  align = "center",
  delay = 0,
}: BouncyTooltipProps) => {
  const hasBeenVisible = useRef(false);

  useEffect(() => {
    if (visible) {
      hasBeenVisible.current = true;
    }
  }, [visible]);

  const justifyClass =
    align === "left"
      ? "justify-start"
      : align === "right"
        ? "justify-end"
        : "justify-center";

  const isHidden = !visible && !hasBeenVisible.current;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 flex",
        justifyClass,
        visible && "pointer-events-auto",
        isHidden && "opacity-0",
      )}
      style={{
        animation: visible
          ? `bouncy-fade-in 0.2s ease-out ${delay}s both, bouncy-bounce 1s ease-in-out ${delay}s infinite`
          : hasBeenVisible.current
            ? "bouncy-fade-out 0.2s ease-in forwards"
            : "none",
      }}
    >
      <div className="flex flex-col items-center drop-shadow-lg">
        <div className="h-0 w-0 border-x-8 border-b-8 border-x-transparent border-b-primary" />
        <div className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-primary-foreground">
          {children}
        </div>
      </div>
    </div>
  );
};
