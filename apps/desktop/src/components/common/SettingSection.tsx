import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SettingSectionProps = {
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
};

export const SettingSection = ({
  title,
  description,
  action,
  className,
}: SettingSectionProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
