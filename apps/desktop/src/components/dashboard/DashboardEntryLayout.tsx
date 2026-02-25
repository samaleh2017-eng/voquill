import { cn } from "@/lib/utils";

const MAX_WIDTH_MAP: Record<string, string> = {
  xs: "max-w-xs",
  sm: "max-w-xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-7xl",
};

export type DashboardEntryLayoutProps = {
  children: React.ReactNode;
  maxWidth?: string;
};

export const DashboardEntryLayout = ({
  children,
  maxWidth = "sm",
}: DashboardEntryLayoutProps) => {
  const maxWidthClass = MAX_WIDTH_MAP[maxWidth] ?? MAX_WIDTH_MAP.sm;

  return (
    <div className="flex-grow overflow-y-auto pr-2">
      <div
        className={cn(
          "mx-auto flex w-full flex-col px-4 pt-1 pb-16",
          maxWidthClass,
        )}
      >
        {children}
      </div>
    </div>
  );
};
