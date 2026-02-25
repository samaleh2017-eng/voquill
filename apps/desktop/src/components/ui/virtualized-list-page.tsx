import { lerp } from "@repo/utilities";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Virtuoso, type VirtuosoProps } from "react-virtuoso";
import { cn } from "@/lib/utils";

const COLLAPSE_DISTANCE_PX = 96;
const TITLE_FONT_SIZE_EXPANDED = 34;
const TITLE_FONT_SIZE_COLLAPSED = 22;

const MAX_WIDTH_CLASSES: Record<string, string> = {
  xs: "max-w-xs",
  sm: "max-w-xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-7xl",
};

export type VirtualizedListPageProps<Item> = {
  title: ReactNode;
  action?: ReactNode;
  subtitle?: ReactNode;
  items: readonly Item[];
  renderItem: (item: Item, index: number) => ReactNode;
  computeItemKey?: (item: Item, index: number) => string | number;
  headerMaxWidth?: string;
  contentMaxWidth?: string;
  heightMult?: number;
  emptyState?: ReactNode;
  virtuosoProps?: Omit<
    VirtuosoProps<Item, unknown>,
    | "data"
    | "itemContent"
    | "components"
    | "scrollerRef"
    | "style"
    | "computeItemKey"
  >;
};

export function VirtualizedListPage<Item>({
  title,
  action,
  subtitle,
  items,
  renderItem,
  computeItemKey,
  headerMaxWidth = "sm",
  contentMaxWidth = "sm",
  heightMult = 3,
  emptyState,
  virtuosoProps,
}: VirtualizedListPageProps<Item>) {
  const [scrollerNode, setScrollerNode] = useState<HTMLElement | Window | null>(
    null,
  );
  const [collapseProgress, setCollapseProgress] = useState(0);

  useEffect(() => {
    if (!scrollerNode || scrollerNode instanceof Window) return;

    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        const progress = Math.min(
          scrollerNode.scrollTop / COLLAPSE_DISTANCE_PX,
          1,
        );
        setCollapseProgress(progress);
        rafId = null;
      });
    };

    handleScroll();
    scrollerNode.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollerNode.removeEventListener("scroll", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [scrollerNode]);

  const handleScrollerRef = useCallback((node: HTMLElement | Window | null) => {
    setScrollerNode(node);
  }, []);

  const headerPaddingTop = `${(1 - collapseProgress) * 4}px`;
  const headerPaddingBottom = `${(2 + (1 - collapseProgress) * heightMult) * 8}px`;
  const headerGap = `${(1 + (1 - collapseProgress)) * 8}px`;
  const titleFontSize = `${
    TITLE_FONT_SIZE_EXPANDED -
    (TITLE_FONT_SIZE_EXPANDED - TITLE_FONT_SIZE_COLLAPSED) * collapseProgress
  }px`;
  const titleLineHeight = `${
    (TITLE_FONT_SIZE_EXPANDED -
      (TITLE_FONT_SIZE_EXPANDED - TITLE_FONT_SIZE_COLLAPSED) *
        collapseProgress) *
    1.15
  }px`;
  const subtitleOpacity = Math.min(lerp(0, 1, 1 - collapseProgress * 2), 1);
  const headerShrinkAmount = COLLAPSE_DISTANCE_PX * (1 - collapseProgress);

  const headerMaxWidthClass =
    MAX_WIDTH_CLASSES[headerMaxWidth] ?? MAX_WIDTH_CLASSES.sm;
  const contentMaxWidthClass =
    MAX_WIDTH_CLASSES[contentMaxWidth] ?? MAX_WIDTH_CLASSES.sm;

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="sticky top-0 z-10 pr-2 backdrop-blur-md">
        <div
          className={cn("relative mx-auto w-full px-4", headerMaxWidthClass)}
          style={{
            paddingTop: headerPaddingTop,
            paddingBottom: headerPaddingBottom,
          }}
        >
          <div className="flex flex-col" style={{ gap: headerGap }}>
            <div className="flex items-start justify-between gap-4">
              <h1
                className="font-bold tracking-tight text-foreground"
                style={{ fontSize: titleFontSize, lineHeight: titleLineHeight }}
              >
                {title}
              </h1>
              {action}
            </div>
            {subtitle ? (
              <p
                className="absolute bottom-0 text-sm text-muted-foreground"
                style={{
                  opacity: subtitleOpacity,
                  transform: `translateY(${subtitleOpacity * 4}px)`,
                }}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center overflow-auto">
          <div className={cn("mx-auto px-4 pb-16", contentMaxWidthClass)}>
            {emptyState || (
              <div className="flex flex-col items-center gap-2">
                <p className="text-base font-semibold text-muted-foreground">
                  It's quiet in here
                </p>
                <p className="text-sm text-muted-foreground">
                  There are no items to display.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Virtuoso
          data={items as Item[]}
          style={{ flex: 1 }}
          scrollerRef={handleScrollerRef}
          computeItemKey={
            computeItemKey
              ? (index, item) => computeItemKey(item, index)
              : undefined
          }
          components={{
            Header: () => <div style={{ height: headerShrinkAmount / 2 }} />,
          }}
          itemContent={(index, item) => (
            <div className={cn("mx-auto w-full px-4", contentMaxWidthClass)}>
              {renderItem(item, index)}
            </div>
          )}
          {...(virtuosoProps ?? {})}
        />
      )}
    </div>
  );
}
