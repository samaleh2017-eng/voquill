import { FormattedMessage } from "react-intl";
import { produceAppState, useAppStore } from "../../store";
import { AIPostProcessingConfiguration } from "./AIPostProcessingConfiguration";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const AIPostProcessingDialog = () => {
  const open = useAppStore(
    (state) => state.settings.aiPostProcessingDialogOpen,
  );

  const handleClose = () => {
    produceAppState((draft) => {
      draft.settings.aiPostProcessingDialogOpen = false;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="AI post processing" />
          </DialogTitle>
          <DialogDescription>
            <FormattedMessage defaultMessage="Tell Voquill how to enhance your transcripts after they are created." />
          </DialogDescription>
        </DialogHeader>
        <AIPostProcessingConfiguration />
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <FormattedMessage defaultMessage="Done" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
