import { cn } from "@/lib/utils";
import { useAppStore } from "../../store";
import { getPrettyKeyName } from "../../utils/keyboard.utils";

export type KeyPressSimulatorProps = {
  keys: string[];
};

export const KeyPressSimulator = ({ keys }: KeyPressSimulatorProps) => {
  const pressBools = useAppStore((state) => {
    const result: Record<string, boolean> = {};
    for (const key of keys) {
      result[key] = state.keysHeld.includes(key);
    }
    return result;
  });

  const allPressed = keys.length > 0 && keys.every((key) => pressBools[key]);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {keys.map((key) => {
        const displayKey = getPrettyKeyName(key);
        const isPressed = pressBools[key] || false;

        return (
          <div
            key={key}
            className={cn(
              "flex min-w-12 items-center justify-center rounded-md border px-2 select-none transition-all duration-100 ease-out",
              allPressed
                ? "border-green-600 bg-green-500 dark:bg-green-600"
                : isPressed
                  ? "border-border bg-muted"
                  : "border-border bg-secondary",
            )}
            style={{
              height: 48,
              boxShadow: isPressed ? "none" : "0px 3px 0px var(--color-border)",
              transform: isPressed ? "translateY(3px)" : "translateY(0px)",
            }}
          >
            <span
              className={cn(
                "text-sm font-bold capitalize",
                allPressed ? "text-white" : "text-foreground",
              )}
            >
              {displayKey}
            </span>
          </div>
        );
      })}
    </div>
  );
};
