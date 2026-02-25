import { useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";
import { setUserName } from "../../actions/user.actions";
import { useMyUser } from "../../hooks/user.hooks";
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

export const ProfileDialog = () => {
  const open = useAppStore((state) => state.settings.profileDialogOpen);
  const user = useMyUser();
  const initialName = user?.name ?? "";

  const [value, setValue] = useState(initialName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValue(initialName);
    setSaving(false);
  }, [open, initialName]);

  const closeDialog = useCallback(() => {
    produceAppState((draft) => {
      draft.settings.profileDialogOpen = false;
    });
  }, []);

  const trimmed = useMemo(() => value.trim(), [value]);
  const initialTrimmed = useMemo(() => initialName.trim(), [initialName]);

  const canSave = useMemo(() => {
    if (!user || saving) return false;
    if (trimmed.length === 0) return false;
    return trimmed !== initialTrimmed;
  }, [user, saving, trimmed, initialTrimmed]);

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await setUserName(trimmed);
      closeDialog();
    } catch (error) {
      console.error("Failed to save username", error);
      setSaving(false);
    }
  }, [canSave, trimmed, closeDialog]);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="My profile" />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>
            <FormattedMessage defaultMessage="Username" />
          </Label>
          <Input
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={!user || saving}
          />
          <p className="text-xs text-muted-foreground">
            <FormattedMessage defaultMessage="Used to sign things like emails and stuff" />
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeDialog} disabled={saving}>
            <FormattedMessage defaultMessage="Cancel" />
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            <FormattedMessage defaultMessage="Save" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
