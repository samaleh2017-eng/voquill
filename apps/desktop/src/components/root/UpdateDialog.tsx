import { RiArrowUpLine, RiLoader4Line } from "@remixicon/react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useCallback, useMemo } from "react";
import Markdown from "react-markdown";
import {
  dismissUpdateDialog,
  installAvailableUpdate,
} from "../../actions/updater.actions";
import { useAppStore } from "../../store";
import { formatSize } from "../../utils/format.utils";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formatReleaseDate = (isoDate: string | null) => {
  if (!isoDate) {
    return null;
  }

  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

export const UpdateDialog = () => {
  const intl = useIntl();
  const dialogOpen = useAppStore((state) => state.updater.dialogOpen);
  const status = useAppStore((state) => state.updater.status);
  const availableVersion = useAppStore(
    (state) => state.updater.availableVersion,
  );
  const currentVersion = useAppStore((state) => state.updater.currentVersion);
  const releaseDate = useAppStore((state) => state.updater.releaseDate);
  const releaseNotes = useAppStore((state) => state.updater.releaseNotes);
  const downloadProgress = useAppStore(
    (state) => state.updater.downloadProgress,
  );
  const downloadedBytes = useAppStore((state) => state.updater.downloadedBytes);
  const totalBytes = useAppStore((state) => state.updater.totalBytes);
  const errorMessage = useAppStore((state) => state.updater.errorMessage);

  const isUpdating = status === "downloading" || status === "installing";
  const showProgress = status === "downloading" || status === "installing";

  const versionLabel = availableVersion
    ? intl.formatMessage(
        {
          defaultMessage: "Voquill {version}",
        },
        { version: availableVersion },
      )
    : intl.formatMessage({
        defaultMessage: "A Voquill update",
      });

  const formattedDate = useMemo(
    () => formatReleaseDate(releaseDate),
    [releaseDate],
  );

  const percent = useMemo(() => {
    if (downloadProgress == null) {
      return null;
    }
    const clamped = Math.max(0, Math.min(1, downloadProgress));
    return Math.round(clamped * 100);
  }, [downloadProgress]);

  const progressLabel = useMemo(() => {
    if (downloadedBytes == null || totalBytes == null || totalBytes <= 0) {
      return null;
    }
    return `${formatSize(downloadedBytes)} of ${formatSize(totalBytes)}`;
  }, [downloadedBytes, totalBytes]);

  const currentVersionLabel =
    currentVersion ??
    intl.formatMessage({
      defaultMessage: "unknown",
    });

  const readyToInstallLabel = intl.formatMessage(
    {
      defaultMessage: "{label} is ready to install.",
    },
    { label: versionLabel },
  );

  const currentVersionDescription = intl.formatMessage(
    {
      defaultMessage:
        "You're currently on version {version}. The app will restart after the update finishes.",
    },
    { version: currentVersionLabel },
  );

  const handleClose = useCallback(() => {
    if (isUpdating) {
      return;
    }
    dismissUpdateDialog();
  }, [isUpdating]);

  const handleInstall = useCallback(async () => {
    if (isUpdating) {
      return;
    }
    await installAvailableUpdate();
  }, [isUpdating]);

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        if (!open && !isUpdating) {
          handleClose();
        }
      }}
    >
      <DialogContent
        className="sm:max-w-lg"
        onPointerDownOutside={(e) => {
          if (isUpdating) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isUpdating) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="Update available" />
          </DialogTitle>
          <DialogDescription>
            <FormattedMessage
              defaultMessage="Release notes are AI-generated and may contain errors. Visit the {discord} for a more accurate discussion on what's being developed."
              values={{
                discord: (
                  <button
                    className="text-primary underline hover:text-primary/80"
                    onClick={() => openUrl("https://discord.gg/5jXkDvdVdt")}
                  >
                    Discord
                  </button>
                ),
              }}
            />
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold">{readyToInstallLabel}</p>
            <p className="text-sm text-muted-foreground">
              {currentVersionDescription}
            </p>
            {formattedDate && (
              <p className="text-xs text-muted-foreground">
                <FormattedMessage
                  defaultMessage="Released on {date}"
                  values={{ date: formattedDate }}
                />
              </p>
            )}
          </div>

          {releaseNotes && (
            <div className="flex flex-col gap-2">
              <p className="text-base">
                <FormattedMessage defaultMessage="What's new" />
              </p>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <Markdown>{releaseNotes}</Markdown>
              </div>
            </div>
          )}

          {showProgress && (
            <div className="flex flex-col gap-2">
              <Progress value={percent ?? undefined} />
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">
                  {status === "installing" ? (
                    <FormattedMessage defaultMessage="Installing update..." />
                  ) : (
                    <FormattedMessage defaultMessage="Downloading update..." />
                  )}
                </span>
                {progressLabel && (
                  <span className="text-xs text-muted-foreground">
                    {progressLabel}
                    {percent != null ? ` (${percent}%)` : ""}
                  </span>
                )}
              </div>
            </div>
          )}

          {status === "installing" && (
            <Alert>
              <AlertDescription>
                <FormattedMessage defaultMessage="Installation in progress. Voquill may restart automatically when finished." />
              </AlertDescription>
            </Alert>
          )}

          {status === "error" && errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
            <FormattedMessage defaultMessage="Later" />
          </Button>
          <Button onClick={handleInstall} disabled={isUpdating}>
            {isUpdating ? (
              <RiLoader4Line className="size-4 animate-spin" />
            ) : (
              <RiArrowUpLine className="size-4" />
            )}
            <FormattedMessage defaultMessage="Update" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
