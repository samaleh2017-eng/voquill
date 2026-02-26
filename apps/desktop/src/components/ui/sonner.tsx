import {
  RiCheckLine,
  RiInformation2Line,
  RiAlertLine,
  RiCloseCircleLine,
  RiLoader4Line,
} from "@remixicon/react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      icons={{
        success: <RiCheckLine className="size-4" />,
        info: <RiInformation2Line className="size-4" />,
        warning: <RiAlertLine className="size-4" />,
        error: <RiCloseCircleLine className="size-4" />,
        loading: <RiLoader4Line className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--color-popover)",
          "--normal-text": "var(--color-popover-foreground)",
          "--normal-border": "var(--color-border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
