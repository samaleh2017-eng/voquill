import { useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type MenuPopoverCallbackArgs = {
  close: () => void;
  event: React.MouseEvent<HTMLElement>;
};

export type MenuPopoverListItem = {
  kind: "listItem";
  title?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: (args: MenuPopoverCallbackArgs) => void;
};

export type MenuPopoverDivider = {
  kind: "divider";
};

export type MenuPopoverGenericItem = {
  kind: "genericItem";
  builder: (args: { close: () => void }) => React.ReactNode;
};

export type MenuPopoverSubMenu = {
  kind: "subMenu";
  title?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  children: MenuPopoverItem[];
};

export type MenuPopoverItem =
  | MenuPopoverListItem
  | MenuPopoverDivider
  | MenuPopoverGenericItem
  | MenuPopoverSubMenu;

type MenuPopoverItemRendProps = {
  item: MenuPopoverItem;
  close: () => void;
};

const MenuPopoverItemRend = ({
  item,
  close,
}: MenuPopoverItemRendProps): React.ReactNode => {
  if (item.kind === "listItem") {
    return (
      <DropdownMenuItem
        onClick={(e) => item.onClick?.({ close, event: e as unknown as React.MouseEvent<HTMLElement> })}
        className="gap-2"
      >
        {item.leading && (
          <span className="flex shrink-0 items-center [&_svg]:size-4">
            {item.leading}
          </span>
        )}
        <span className="flex-1">{item.title}</span>
        {item.trailing && (
          <span className="flex shrink-0 items-center text-muted-foreground [&_svg]:size-4">
            {item.trailing}
          </span>
        )}
      </DropdownMenuItem>
    );
  }

  if (item.kind === "divider") {
    return <DropdownMenuSeparator />;
  }

  if (item.kind === "genericItem") {
    return <>{item.builder({ close })}</>;
  }

  if (item.kind === "subMenu") {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="gap-2">
          {item.leading && (
            <span className="flex shrink-0 items-center [&_svg]:size-4">
              {item.leading}
            </span>
          )}
          <span className="flex-1">{item.title}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {item.children.map((child, index) => (
            <MenuPopoverItemRend key={index} item={child} close={close} />
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  return null;
};

type MenuPopoverProps = {
  open: boolean;
  anchorEl?: HTMLElement | null;
  onClose: () => void;
  items: MenuPopoverItem[];
  sx?: unknown;
  anchorOrigin?: unknown;
  transformOrigin?: unknown;
  anchorReference?: unknown;
  anchorPosition?: unknown;
};

type SharedProps = Omit<MenuPopoverProps, "open" | "anchorEl" | "onClose">;

export const MenuPopover = ({
  open,
  onClose,
  items,
}: MenuPopoverProps) => {
  return (
    <DropdownMenu open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DropdownMenuTrigger className="hidden" />
      <DropdownMenuContent>
        {items.map((item, index) => (
          <MenuPopoverItemRend key={index} item={item} close={onClose} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export type MenuPopoverBuilderArgs = {
  ref: React.RefCallback<HTMLElement | null>;
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export type MenuPopoverBuilderProps = SharedProps & {
  children?: (args: MenuPopoverBuilderArgs) => React.ReactNode;
};

export const MenuPopoverBuilder = ({
  children,
  items,
}: MenuPopoverBuilderProps) => {
  const [_ref, setRef] = useState<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleOpen = (): void => {
    setIsOpen(true);
  };

  const handleClose = (): void => {
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DropdownMenuTrigger asChild ref={triggerRef}>
        <span className="inline-flex">
          {children?.({
            ref: setRef,
            open: handleOpen,
            isOpen,
            close: handleClose,
          })}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" sideOffset={4}>
        {items.map((item, index) => (
          <MenuPopoverItemRend key={index} item={item} close={handleClose} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
