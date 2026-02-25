import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { showSnackbar } from "../../actions/app.actions";
import { getAuthRepo } from "../../repos";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RiAlertLine } from "@remixicon/react";

export const DeleteAccountDialog = () => {
  const open = useAppStore((state) => state.settings.deleteAccountDialog);
  const userEmail = useAppStore((state) => state.auth?.email);
  const [confirmationEmail, setConfirmationEmail] = useState("");

  const isDeleteEnabled = confirmationEmail === userEmail && userEmail;

  const handleClose = () => {
    produceAppState((state) => {
      state.settings.deleteAccountDialog = false;
    });
    setConfirmationEmail("");
  };

  const handleSubmit = async () => {
    if (!isDeleteEnabled) return;

    try {
      await getAuthRepo().deleteMyAccount();
      await invoke("clear_local_data");
      setConfirmationEmail("");
      showSnackbar("You account has been deleted", { duration: 15000 });
      produceAppState((state) => {
        state.settings.deleteAccountDialog = false;
      });
    } catch {
      showSnackbar(
        "An error occurred while attempting to delete your account. Please try again later.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">
            <FormattedMessage defaultMessage="Delete account" />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Alert variant="destructive">
            <RiAlertLine className="size-4" />
            <AlertDescription>
              <FormattedMessage defaultMessage="This action cannot be undone. All your data will be permanently deleted." />
            </AlertDescription>
          </Alert>
          <p className="text-sm">
            <FormattedMessage defaultMessage="Are you sure you want to delete your account? This will:" />
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>
              <FormattedMessage defaultMessage="Permanently delete all your data" />
            </li>
            <li>
              <FormattedMessage defaultMessage="Cancel any active subscriptions" />
            </li>
            <li>
              <FormattedMessage defaultMessage="Remove access to all premium features" />
            </li>
            <li>
              <FormattedMessage defaultMessage="Sign you out immediately" />
            </li>
          </ul>
          {userEmail && (
            <p className="text-sm text-muted-foreground">
              <FormattedMessage
                defaultMessage="Account to be deleted: {email}"
                values={{ email: <strong>{userEmail}</strong> }}
              />
            </p>
          )}
          <div className="space-y-1.5">
            <Label>
              <FormattedMessage defaultMessage="To confirm, type your email address below:" />
            </Label>
            <Input
              placeholder={userEmail || ""}
              value={confirmationEmail}
              onChange={(e) => setConfirmationEmail(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <FormattedMessage defaultMessage="Cancel" />
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!isDeleteEnabled}
          >
            <FormattedMessage defaultMessage="Delete account" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
