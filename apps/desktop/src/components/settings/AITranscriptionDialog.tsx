import { FormattedMessage } from "react-intl";
import { produceAppState, useAppStore } from "../../store";
import { AITranscriptionConfiguration } from "./AITranscriptionConfiguration";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const AITranscriptionDialog = () => {
  const open = useAppStore((state) => state.settings.aiTranscriptionDialogOpen);

  const closeDialog = () => {
    produceAppState((draft) => {
      draft.settings.aiTranscriptionDialogOpen = false;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="AI transcription" />
          </DialogTitle>
          <DialogDescription>
            <FormattedMessage defaultMessage="Decide how Voquill should transcribe your recordings—locally on your machine or through a connected provider." />
          </DialogDescription>
        </DialogHeader>
        <AITranscriptionConfiguration />
        <DialogFooter>
          <Button variant="outline" onClick={closeDialog}>
            <FormattedMessage defaultMessage="Done" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
