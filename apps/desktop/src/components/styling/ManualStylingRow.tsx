import {
  RiMoreLine,
  RiPencilLine,
  RiInformationLine,
  RiCloseCircleLine,
  RiGlobalLine,
} from "@remixicon/react";
import { getRec } from "@repo/utilities";
import { useCallback, useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { openToneEditorDialog } from "../../actions/tone.actions";
import {
  deselectActiveTone,
  setSelectedToneId,
} from "../../actions/user.actions";
import { produceAppState, useAppStore } from "../../store";
import {
  getActiveManualToneIds,
  getManuallySelectedToneId,
} from "../../utils/tone.utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const formatPromptForPreview = (prompt: string) => {
  return prompt
    .split("\n")
    .join(". ")
    .replace(/[\n\r]+/g, " ")
    .replace(/[-–—]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[.\s]+/, "");
};

export type ManualStylingRowProps = {
  id: string;
};

export const ManualStylingRow = ({ id }: ManualStylingRowProps) => {
  const tone = useAppStore((state) => getRec(state.toneById, id));
  const isSelected = useAppStore(
    (state) => getManuallySelectedToneId(state) === id,
  );
  const activeToneCount = useAppStore(
    (state) => getActiveManualToneIds(state).length,
  );

  const handleEdit = useCallback(() => {
    openToneEditorDialog({ mode: "edit", toneId: id });
  }, [id]);

  const handleViewPrompt = useCallback(() => {
    produceAppState((draft) => {
      draft.tones.viewingToneId = id;
      draft.tones.viewingToneOpen = true;
    });
  }, [id]);

  const handleSelect = useCallback(() => {
    setSelectedToneId(id);
  }, [id]);

  const handleDeselect = useCallback(() => {
    deselectActiveTone(id);
  }, [id]);

  const isGlobal = tone?.isGlobal === true;
  const isSystem = tone?.isSystem === true;
  const canEdit = !isGlobal && !isSystem;
  const canDeselect = activeToneCount > 1;

  const menuItems = useMemo(() => {
    const items: {
      label: React.ReactNode;
      icon: React.ReactNode;
      onClick: () => void;
    }[] = [];
    if (canEdit) {
      items.push({
        label: <FormattedMessage defaultMessage="Edit" />,
        icon: <RiPencilLine className="mr-2 size-4" />,
        onClick: handleEdit,
      });
    }
    items.push({
      label: <FormattedMessage defaultMessage="View full prompt" />,
      icon: <RiInformationLine className="mr-2 size-4" />,
      onClick: handleViewPrompt,
    });
    if (canDeselect) {
      items.push({
        label: <FormattedMessage defaultMessage="Deselect style" />,
        icon: <RiCloseCircleLine className="mr-2 size-4" />,
        onClick: handleDeselect,
      });
    }
    return items;
  }, [canEdit, canDeselect, handleEdit, handleViewPrompt, handleDeselect]);

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      onClick={handleSelect}
      className="mb-2 flex cursor-pointer items-center gap-3 rounded-lg bg-muted/50 px-3 py-3 transition-colors hover:bg-accent/50"
    >
      <div className="shrink-0" onClick={stopPropagation}>
        <input
          type="radio"
          checked={isSelected}
          onChange={handleSelect}
          className="size-4 cursor-pointer accent-primary"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {tone?.name}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {formatPromptForPreview(tone?.promptTemplate ?? "-")}
        </p>
      </div>

      <div
        className="flex shrink-0 items-center gap-1"
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
      >
        {isGlobal && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <button
                    disabled
                    className="rounded-md p-1.5 text-muted-foreground opacity-50"
                  >
                    <RiGlobalLine className="size-4" />
                  </button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <FormattedMessage defaultMessage="This style is managed by your organization." />
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={stopPropagation}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <RiMoreLine className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {menuItems.map((item, i) => (
              <DropdownMenuItem key={i} onClick={item.onClick}>
                {item.icon}
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
