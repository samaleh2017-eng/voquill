import { RiLoader4Line } from "@remixicon/react";
import { FormattedMessage } from "react-intl";
import { produceAppState, useAppStore } from "../../store";
import { getEffectiveStylingMode } from "../../utils/feature.utils";
import {
  AGENT_DICTATE_HOTKEY,
  CANCEL_TRANSCRIPTION_HOTKEY,
  DICTATE_HOTKEY,
  SWITCH_WRITING_STYLE_HOTKEY,
} from "../../utils/keyboard.utils";
import { HotkeySetting } from "./HotkeySetting";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const ShortcutsDialog = () => {
  const { open, hotkeysStatus, isManualStyling } = useAppStore((state) => ({
    open: state.settings.shortcutsDialogOpen,
    hotkeysStatus: state.settings.hotkeysStatus,
    isManualStyling: getEffectiveStylingMode(state) === "manual",
  }));

  const handleClose = () => {
    produceAppState((draft) => {
      draft.settings.shortcutsDialogOpen = false;
    });
  };

  const renderContent = () => {
    if (hotkeysStatus === "loading") {
      return (
        <div className="flex items-center justify-center py-6">
          <RiLoader4Line className="size-5 animate-spin text-muted-foreground" />
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <HotkeySetting
          title={<FormattedMessage defaultMessage="Start/stop dictating" />}
          description={
            <FormattedMessage defaultMessage="Start recording audio and transcribe your speech into text with AI." />
          }
          actionName={DICTATE_HOTKEY}
        />
        <HotkeySetting
          title={<FormattedMessage defaultMessage="Agent mode" />}
          description={
            <FormattedMessage defaultMessage="Dictate commands for the AI to follow instead of just cleaning up text." />
          }
          actionName={AGENT_DICTATE_HOTKEY}
        />
        <HotkeySetting
          title={<FormattedMessage defaultMessage="Cancel transcription" />}
          description={
            <FormattedMessage defaultMessage="Cancel the current dictation or agent session." />
          }
          actionName={CANCEL_TRANSCRIPTION_HOTKEY}
        />
        {isManualStyling && (
          <HotkeySetting
            title={<FormattedMessage defaultMessage="Switch writing style" />}
            description={
              <FormattedMessage defaultMessage="Cycle through your active writing styles." />
            }
            actionName={SWITCH_WRITING_STYLE_HOTKEY}
          />
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="Keyboard shortcuts" />
          </DialogTitle>
          <DialogDescription>
            <FormattedMessage defaultMessage="Customize your keyboard shortcuts. Keyboard shortcuts can be triggered from within any app." />
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <FormattedMessage defaultMessage="Close" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
