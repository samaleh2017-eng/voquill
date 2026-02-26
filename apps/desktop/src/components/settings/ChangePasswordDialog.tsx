import { FormattedMessage } from "react-intl";
import { produceAppState, useAppStore } from "../../store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const ChangePasswordDialog = () => {
  const open = useAppStore((state) => state.settings.changePasswordDialogOpen);
  const userEmail = useAppStore((state) => state.auth?.email);

  const handleClose = () => {
    produceAppState((state) => {
      state.settings.changePasswordDialogOpen = false;
    });
  };

  const handleSubmit = async () => {
    const { getAppState } = await import("../../store");
    const { getAuthRepo } = await import("../../repos");
    const { showErrorSnackbar } = await import("../../actions/app.actions");
    const state = getAppState();
    const email = state.auth?.email;
    if (!email) {
      showErrorSnackbar("No user email found");
      return;
    }

    try {
      await getAuthRepo().sendPasswordResetRequest(email);
      produceAppState((draft) => {
        draft.settings.changePasswordDialogOpen = false;
      });
    } catch (error) {
      showErrorSnackbar(`Error sending password reset email: ${error}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="Change password" />
          </DialogTitle>
          <DialogDescription>
            <FormattedMessage defaultMessage="We'll send a password reset link to your email address. Click the link in the email to create a new password." />
          </DialogDescription>
        </DialogHeader>
        {userEmail && (
          <p className="text-sm text-muted-foreground">
            <FormattedMessage
              defaultMessage="Reset link will be sent to: {email}"
              values={{ email: <strong>{userEmail}</strong> }}
            />
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <FormattedMessage defaultMessage="Cancel" />
          </Button>
          <Button onClick={handleSubmit}>
            <FormattedMessage defaultMessage="Send reset link" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
