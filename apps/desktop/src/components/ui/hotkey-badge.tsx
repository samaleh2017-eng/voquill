import { getPrettyKeyName } from "../../utils/keyboard.utils";

type HotkeyBadgeInlineProps = {
  keys: string[];
  onClick?: () => void;
  className?: string;
};

export function HotkeyBadgeInline({
  keys,
  onClick,
  className,
}: HotkeyBadgeInlineProps) {
  const label = keys.map(getPrettyKeyName).join(" + ");

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-semibold ${onClick ? "cursor-pointer hover:bg-accent" : ""} ${className ?? ""}`}
    >
      {label}
    </span>
  );
}
