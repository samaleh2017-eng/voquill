import {
  RiAddLine,
  RiPencilLine,
  RiGlobalLine,
  RiCheckboxFill,
  RiCheckboxBlankLine,
} from "@remixicon/react";
import type { Tone } from "@repo/types";
import { useCallback, useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { openToneEditorDialog } from "../../actions/tone.actions";
import { setActiveToneIds } from "../../actions/user.actions";
import { useAppStore } from "../../store";
import {
  getActiveManualToneIds,
  getSortedToneIds,
} from "../../utils/tone.utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ManualAddStyle() {
  const toneById = useAppStore((state) => state.toneById);
  const sortedToneIds = useAppStore((state) => getSortedToneIds(state));
  const activeToneIds = useAppStore((state) => getActiveManualToneIds(state));

  const allTones = useMemo(
    () => sortedToneIds.map((id) => toneById[id]).filter(Boolean) as Tone[],
    [sortedToneIds, toneById],
  );

  const activeSet = useMemo(() => new Set(activeToneIds), [activeToneIds]);

  const handleToggle = useCallback(
    (toneId: string) => {
      const isActive = activeSet.has(toneId);
      if (isActive) {
        if (activeSet.size <= 1) return;
        const next = allTones
          .filter((t) => activeSet.has(t.id) && t.id !== toneId)
          .map((t) => t.id);
        setActiveToneIds(next);
      } else {
        const next = allTones
          .filter((t) => activeSet.has(t.id) || t.id === toneId)
          .map((t) => t.id);
        setActiveToneIds(next);
      }
    },
    [activeSet, allTones],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-1.5">
          <RiAddLine className="size-4" />
          <FormattedMessage defaultMessage="Add Style" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem
          onClick={() => openToneEditorDialog({ mode: "create" })}
        >
          <RiAddLine className="mr-2 size-4" />
          <FormattedMessage defaultMessage="New style" />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {allTones.map((tone) => {
          const isActive = activeSet.has(tone.id);
          const isGlobal = tone.isGlobal === true;
          const isSystem = tone.isSystem === true;
          const canEdit = !isGlobal && !isSystem;
          const canDeselect = isActive && activeSet.size > 1;
          const isLastActive = isActive && !canDeselect;

          return (
            <DropdownMenuItem
              key={tone.id}
              onClick={(e) => {
                e.preventDefault();
                if (!isActive || canDeselect) handleToggle(tone.id);
              }}
              className="flex items-center gap-2"
            >
              {isLastActive ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <RiCheckboxFill className="size-4 text-muted-foreground/50" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <FormattedMessage defaultMessage="At least one style must be selected." />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : isActive ? (
                <RiCheckboxFill className="size-4 text-primary" />
              ) : (
                <RiCheckboxBlankLine className="size-4" />
              )}
              <span className="min-w-0 flex-1 truncate text-sm">
                {tone.name}
              </span>
              <div className="flex items-center gap-0.5">
                {isGlobal && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <RiGlobalLine className="size-3.5 text-muted-foreground" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <FormattedMessage defaultMessage="This style is managed by your organization." />
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {canEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openToneEditorDialog({ mode: "edit", toneId: tone.id });
                    }}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <RiPencilLine className="size-3.5" />
                  </button>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
