import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { produceAppState, useAppStore } from "../../store";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RiAlertLine } from "@remixicon/react";

const CONFIRMATION_PHRASE = "clear";

export const ClearLocalDataDialog = () => {
  const open = useAppStore((state) => state.settings.clearLocalDataDialogOpen);
  const [confirmationValue, setConfirmationValue] = useState("");
  const [isClearing, setIsClearing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    produceAppState((draft) => {
      draft.settings.clearLocalDataDialogOpen = false;
    });
    setConfirmationValue("");
    setIsClearing(false);
    setErrorMessage(null);
  };

  const confirmationMatches =
    confirmationValue.trim().toLowerCase() === CONFIRMATION_PHRASE;

  const handleClear = async () => {
    if (!confirmationMatches || isClearing) return;

    setIsClearing(true);
    setErrorMessage(null);

    try {
      await invoke("clear_local_data");
      handleClose();
      window.location.reload();
    } catch (error) {
      console.error("Failed to clear local data", error);
      const message =
        error instanceof Error ? error.message : "Failed to clear local data.";
      setErrorMessage(message);
      setIsClearing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="Clear local data" />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Alert variant="destructive">
            <RiAlertLine className="size-4" />
            <AlertTitle>
              <FormattedMessage defaultMessage="This action permanently removes local data" />
            </AlertTitle>
            <AlertDescription>
              <FormattedMessage defaultMessage="This will delete all preferences, dictionary entries, and saved transcriptions from this device. The action cannot be undone." />
            </AlertDescription>
          </Alert>
          <p className="text-sm">
            <FormattedMessage
              defaultMessage="To confirm, type {phrase} below and click Clear local data."
              values={{
                phrase: (
                  <span className="font-bold">{CONFIRMATION_PHRASE}</span>
                ),
              }}
            />
          </p>
          <div className="space-y-1.5">
            <Label>
              <FormattedMessage defaultMessage="Confirmation phrase" />
            </Label>
            <Input
              autoFocus
              value={confirmationValue}
              onChange={(event) => setConfirmationValue(event.target.value)}
              disabled={isClearing}
              placeholder={CONFIRMATION_PHRASE}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isClearing}>
            <FormattedMessage defaultMessage="Cancel" />
          </Button>
          <Button
            variant="destructive"
            onClick={handleClear}
            disabled={!confirmationMatches || isClearing}
          >
            {isClearing ? (
              <FormattedMessage defaultMessage="Clearing..." />
            ) : (
              <FormattedMessage defaultMessage="Clear local data" />
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
