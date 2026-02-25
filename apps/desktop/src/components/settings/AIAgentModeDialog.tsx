import { FormattedMessage } from "react-intl";
import { produceAppState, useAppStore } from "../../store";
import { AIAgentModeConfiguration } from "./AIAgentModeConfiguration";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const AIAgentModeDialog = () => {
  const open = useAppStore((state) => state.settings.agentModeDialogOpen);

  const handleClose = () => {
    produceAppState((draft) => {
      draft.settings.agentModeDialogOpen = false;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FormattedMessage defaultMessage="Agent mode" />
            <Badge variant="secondary">Beta</Badge>
          </DialogTitle>
          <DialogDescription>
            <FormattedMessage defaultMessage="Agent mode follows commands you dictate instead of just cleaning up text." />
          </DialogDescription>
        </DialogHeader>
        <AIAgentModeConfiguration />
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <FormattedMessage defaultMessage="Done" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
