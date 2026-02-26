import { RiLoader4Line } from "@remixicon/react";
import { Nullable } from "@repo/types";
import { useCallback, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { setPreferredMicrophone } from "../../actions/user.actions";
import { useMyPreferredMicrophone } from "../../hooks/user.hooks";
import { produceAppState, useAppStore } from "../../store";
import { SettingSection } from "../common/SettingSection";
import { MicrophoneSelector } from "../microphone/MicrophoneSelector";
import { MicrophoneTester } from "../microphone/MicrophoneTester";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export const MicrophoneDialog = () => {
  const open = useAppStore((state) => state.settings.microphoneDialogOpen);
  const savedPreference = useMyPreferredMicrophone();

  const [selected, setSelected] = useState<Nullable<string>>(savedPreference);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(savedPreference);
    setHasChanges(false);
    setSaveError(null);
    setSaveSuccess(false);
  }, [open, savedPreference]);

  const handleSelectionChange = useCallback(
    (next: Nullable<string>) => {
      setSelected(next ?? null);
      setHasChanges((next ?? null) !== (savedPreference ?? null));
      setSaveError(null);
      setSaveSuccess(false);
    },
    [savedPreference],
  );

  const handleSave = useCallback(async () => {
    if (!hasChanges || saving) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await setPreferredMicrophone(selected ?? null);
      setHasChanges(false);
      setSaveSuccess(true);
    } catch {
      setSaveError("Failed to save microphone preference. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [hasChanges, saving, selected]);

  const handleClose = useCallback(() => {
    produceAppState((draft) => {
      draft.settings.microphoneDialogOpen = false;
    });
  }, []);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="Microphone settings" />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-3">
            <SettingSection
              title={<FormattedMessage defaultMessage="Preferred microphone" />}
              description={
                <FormattedMessage defaultMessage="Choose which microphone Voquill should use when recording. Automatic picks the best available device each time." />
              }
            />
            <MicrophoneSelector
              value={selected ?? null}
              onChange={handleSelectionChange}
              disabled={saving}
            />
            {saveError && (
              <Alert variant="destructive">
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}
            {saveSuccess && (
              <Alert>
                <AlertDescription>
                  <FormattedMessage defaultMessage="Preference saved." />
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <SettingSection
              title={<FormattedMessage defaultMessage="Test your microphone" />}
              description={
                <FormattedMessage defaultMessage="Start a short test to see live audio levels and play back what was recorded." />
              }
            />
            <MicrophoneTester
              preferredMicrophone={selected ?? null}
              disabled={saving}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <FormattedMessage defaultMessage="Close" />
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving && <RiLoader4Line className="mr-2 size-4 animate-spin" />}
            <FormattedMessage defaultMessage="Save changes" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
