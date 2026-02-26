import { cn } from "@/lib/utils";
import { forwardRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type HoverButtonProps = {
  idle?: React.ReactNode;
  hover?: React.ReactNode;
  hovered?: boolean;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  left?: boolean;
};

const HoverButton = ({
  idle,
  hover,
  hovered,
  onClick,
  left,
}: HoverButtonProps) => {
  const hoverState = hovered && hover;

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    onClick?.(event);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center",
        left ? "mr-3" : "ml-3",
      )}
    >
      <span className="flex items-center text-sm font-bold">
        <span className={cn(hoverState ? "hidden" : "inline-flex")}>{idle}</span>
        <div
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          className={cn(
            "inline-flex cursor-pointer items-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            hoverState ? "inline-flex" : "hidden",
          )}
        >
          {hover}
        </div>
      </span>
    </div>
  );
};

export type ListTileProps = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  trailingHover?: React.ReactNode;
  trailingOnClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  leading?: React.ReactNode;
  leadingHover?: React.ReactNode;
  leadingOnClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  selected?: boolean;
  sx?: unknown;
  className?: string;
  href?: string;
  disabled?: boolean;
  disableRipple?: boolean;
};

export const ListTile = forwardRef<HTMLDivElement, ListTileProps>(
  (
    {
      title,
      subtitle,
      trailing,
      trailingHover,
      trailingOnClick,
      leading,
      leadingHover,
      leadingOnClick,
      onClick,
      selected = false,
      className,
      href,
      disabled,
    },
    ref,
  ) => {
    const [hovered, setHovered] = useState(false);
    const nav = useNavigate();

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;

      if (href) {
        if (event.metaKey || event.ctrlKey) {
          window.open(href, "_blank");
        } else {
          event.preventDefault();
          nav(href);
        }
      }

      onClick?.(event);
    };

    return (
      <div
        ref={ref}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn("list-none", className)}
      >
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={handleClick}
          className={cn(
            "flex w-full cursor-pointer items-center rounded-none px-5 py-4 text-left transition-colors",
            selected
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent/50",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <div className="flex w-full items-center">
            {Boolean(leading) && (
              <HoverButton
                idle={leading}
                hover={leadingHover}
                hovered={hovered}
                onClick={leadingOnClick}
                left={true}
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm">{title}</div>
              {subtitle && (
                <div className="truncate text-xs text-muted-foreground">
                  {subtitle}
                </div>
              )}
            </div>
            {Boolean(trailing) && (
              <HoverButton
                idle={trailing}
                hover={trailingHover}
                hovered={hovered}
                onClick={trailingOnClick}
                left={false}
              />
            )}
          </div>
        </div>
      </div>
    );
  },
);
