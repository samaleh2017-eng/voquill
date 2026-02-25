import { FormattedMessage } from "react-intl";
import { setInteractionChimeEnabled } from "../../actions/user.actions";
import { produceAppState, useAppStore } from "../../store";
import { getMyUser } from "../../utils/user.utils";
import { SettingSection } from "../common/SettingSection";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export const AudioDialog = () => {
  const [open, playInteractionChime] = useAppStore((state) => {
    const user = getMyUser(state);
    return [
      state.settings.audioDialogOpen,
      user?.playInteractionChime ?? true,
    ] as const;
  });

  const handleClose = () => {
    produceAppState((draft) => {
      draft.settings.audioDialogOpen = false;
    });
  };

  const handleToggle = (checked: boolean) => {
    void setInteractionChimeEnabled(checked);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="Audio" />
          </DialogTitle>
        </DialogHeader>
        <SettingSection
          title={<FormattedMessage defaultMessage="Interaction chime" />}
          description={
            <FormattedMessage defaultMessage="Play a sound when you start or stop recording." />
          }
          action={
            <Switch
              checked={playInteractionChime}
              onCheckedChange={handleToggle}
            />
          }
        />
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <FormattedMessage defaultMessage="Close" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
