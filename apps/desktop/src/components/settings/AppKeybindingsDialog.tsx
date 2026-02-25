import { useMemo } from "react";
import { AppTarget } from "@repo/types";
import { FormattedMessage, useIntl } from "react-intl";
import { setAppTargetPasteKeybind } from "../../actions/app-target.actions";
import { produceAppState, useAppStore } from "../../store";
import { StorageImage } from "../common/StorageImage";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const AppKeybindingsDialog = () => {
  const open = useAppStore(
    (state) => state.settings.appKeybindingsDialogOpen,
  );
  const appTargets = useAppStore((state) => state.appTargetById);

  const sortedTargets = useMemo(
    () =>
      Object.values(appTargets).sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? ""),
      ),
    [appTargets],
  );

  const handleClose = () => {
    produceAppState((draft) => {
      draft.settings.appKeybindingsDialogOpen = false;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="App Paste Bindings" />
          </DialogTitle>
          <DialogDescription>
            <FormattedMessage defaultMessage="Different applications use different keyboard shortcuts for pasting. Select the keybind that works best for each app." />
          </DialogDescription>
        </DialogHeader>
        {sortedTargets.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">
            <FormattedMessage defaultMessage="No apps registered yet. Start dictating in an app and it will appear here." />
          </p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-muted-foreground">
                <FormattedMessage defaultMessage="App" />
              </span>
              <span className="text-xs text-muted-foreground">
                <FormattedMessage defaultMessage="Paste keybind" />
              </span>
            </div>
            {sortedTargets.map((target) => (
              <AppKeybindingRow key={target.id} target={target} />
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <FormattedMessage defaultMessage="Close" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

type AppKeybindingRowProps = {
  target: AppTarget;
};

const AppKeybindingRow = ({ target }: AppKeybindingRowProps) => {
  const intl = useIntl();
  const pasteKeybindValue = target.pasteKeybind ?? "ctrl+v";

  const handleChange = (value: string) => {
    void setAppTargetPasteKeybind(
      target.id,
      value === "ctrl+v" ? null : value,
    );
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
          {target.iconPath && (
            <StorageImage
              path={target.iconPath}
              alt={
                target.name ?? intl.formatMessage({ defaultMessage: "App icon" })
              }
              size={32}
            />
          )}
        </div>
        <span className="truncate text-sm">{target.name}</span>
      </div>
      <Select value={pasteKeybindValue} onValueChange={handleChange}>
        <SelectTrigger className="w-[170px] shrink-0" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ctrl+v">
            <FormattedMessage defaultMessage="Default (Ctrl+V)" />
          </SelectItem>
          <SelectItem value="ctrl+shift+v">
            <FormattedMessage defaultMessage="Terminal (Ctrl+Shift+V)" />
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
