import { cn } from "@/lib/utils";
import { getPrettyKeyName } from "../../utils/keyboard.utils";

type HotkeyBadgeProps = {
  keys: string[];
  onClick?: () => void;
  className?: string;
  sx?: Record<string, unknown>;
};

export const HotkeyBadge = ({ keys, onClick, className }: HotkeyBadgeProps) => {
  const label = keys.map(getPrettyKeyName).join(" + ");

  return (
    <span
      onClick={onClick}
      className={cn(
        "inline-flex items-center border border-border rounded px-2 py-0.5 font-semibold text-sm bg-muted",
        onClick && "cursor-pointer hover:bg-accent",
        className,
      )}
    >
      {label}
    </span>
  );
};
