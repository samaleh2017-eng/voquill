import { cn } from "@/lib/utils";
import AppLogo from "../../assets/app-logo.svg?react";

export function Logo({ className }: { className?: string }) {
  return <AppLogo className={cn("h-8 w-8 text-foreground", className)} />;
}

export function LogoWithText({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 select-none", className)}>
      <Logo />
      <span className="text-lg font-bold tracking-tight text-foreground">
        Voquill
      </span>
    </div>
  );
}
