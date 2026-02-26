import { RiPencilLine, RiGlobalLine } from "@remixicon/react";
import { getRec } from "@repo/utilities";
import { FormattedMessage } from "react-intl";
import { openToneEditorDialog } from "../../actions/tone.actions";
import { produceAppState, useAppStore } from "../../store";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const closeStylingDialog = () => {
  produceAppState((draft) => {
    draft.tones.viewingToneOpen = false;
  });
};

export const StylingDialog = () => {
  const viewingToneId = useAppStore((state) => state.tones.viewingToneId);
  const tone = useAppStore((state) =>
    viewingToneId ? getRec(state.toneById, viewingToneId) : null,
  );
  const isOpen = useAppStore((state) => state.tones.viewingToneOpen);

  const isGlobal = tone?.isGlobal === true;
  const isSystem = tone?.isSystem === true;

  const handleEdit = () => {
    if (!viewingToneId) return;
    closeStylingDialog();
    openToneEditorDialog({ mode: "edit", toneId: viewingToneId });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeStylingDialog();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{tone?.name}</DialogTitle>
            <div className="flex items-center gap-1">
              {isGlobal && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <RiGlobalLine className="size-4 text-muted-foreground" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <FormattedMessage defaultMessage="This style is managed by your organization." />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {!isGlobal && !isSystem && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleEdit}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <RiPencilLine className="size-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <FormattedMessage defaultMessage="Edit style" />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </DialogHeader>

        <p className="whitespace-pre-wrap text-sm text-foreground">
          {tone?.promptTemplate}
        </p>

        <DialogFooter>
          <Button variant="ghost" onClick={closeStylingDialog}>
            <FormattedMessage defaultMessage="Close" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
