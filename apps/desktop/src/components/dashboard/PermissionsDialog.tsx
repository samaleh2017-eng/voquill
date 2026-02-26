import {
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiExternalLinkLine,
  RiLoader4Line,
  RiRestartLine,
} from "@remixicon/react";
import { relaunch } from "@tauri-apps/plugin-process";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { produceAppState, useAppStore } from "../../store";
import type { PermissionKind } from "../../types/permission.types";
import {
  REQUIRED_PERMISSIONS,
  describePermissionState,
  getPermissionInstructions,
  getPermissionLabel,
  isPermissionAuthorized,
  requestAccessibilityPermission,
  requestMicrophonePermission,
} from "../../utils/permission.utils";
import { useLocation } from "react-router-dom";
import { setGotStartedAtNow } from "../../actions/user.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const getPurposeDescription = (
  kind: PermissionKind,
  intl: ReturnType<typeof useIntl>,
): string => {
  const descriptions: Record<PermissionKind, string> = {
    microphone: intl.formatMessage({
      defaultMessage:
        "Allows Voquill to capture audio from your microphone for transcription.",
    }),
    accessibility: intl.formatMessage({
      defaultMessage:
        "Lets you trigger dictation hotkeys while using other applications.",
    }),
  };
  return descriptions[kind];
};

const PermissionRow = ({ kind }: { kind: PermissionKind }) => {
  const intl = useIntl();
  const status = useAppStore((state) => state.permissions[kind]);
  const [requesting, setRequesting] = useState(false);

  const { icon, chipVariant, chipLabel } = useMemo(() => {
    if (!status) {
      return {
        icon: <RiLoader4Line className="h-7 w-7 animate-spin text-muted-foreground" />,
        chipVariant: "secondary" as const,
        chipLabel: intl.formatMessage({ defaultMessage: "Checking" }),
      };
    }

    if (isPermissionAuthorized(status.state)) {
      return {
        icon: <RiCheckboxCircleLine className="h-7 w-7 text-green-500" />,
        chipVariant: "default" as const,
        chipLabel: intl.formatMessage({ defaultMessage: "Authorized" }),
      };
    }

    return {
      icon: <RiCloseCircleLine className="h-7 w-7 text-destructive" />,
      chipVariant: "destructive" as const,
      chipLabel: describePermissionState(status.state),
    };
  }, [status, intl]);

  const instructions = getPermissionInstructions(kind);
  const title = getPermissionLabel(kind);
  const requestingDisabled = status
    ? isPermissionAuthorized(status.state)
    : false;

  const handleRequest = useCallback(async () => {
    if (requesting || requestingDisabled) {
      return;
    }

    setRequesting(true);
    try {
      const requestFn =
        kind === "microphone"
          ? requestMicrophonePermission
          : requestAccessibilityPermission;
      const result = await requestFn();
      produceAppState((draft) => {
        draft.permissions[kind] = result;
      });
    } catch (error) {
      console.error(`Failed to request ${kind} permission`, error);
    } finally {
      setRequesting(false);
    }
  }, [kind, requesting, requestingDisabled]);

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="leading-none">{icon}</div>
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">{title}</h3>
          <Badge variant={chipVariant}>{chipLabel}</Badge>
        </div>
        <p className="text-sm font-medium">{instructions}</p>
        <p className="text-sm text-muted-foreground">
          {getPurposeDescription(kind, intl)}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => void handleRequest()}
        disabled={requesting || requestingDisabled}
      >
        <FormattedMessage defaultMessage="Enable" />
        <RiExternalLinkLine className="ml-1.5 h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

export const PermissionsDialog = () => {
  const permissions = useAppStore((state) => state.permissions);
  const [permissionWasGranted, setPermissionWasGranted] = useState(false);
  const previousPermissionsRef = useRef(permissions);
  const location = useLocation();
  const isWelcomePage = location.pathname === "/welcome";

  useEffect(() => {
    const prev = previousPermissionsRef.current;
    for (const kind of REQUIRED_PERMISSIONS) {
      const prevStatus = prev[kind];
      const currentStatus = permissions[kind];
      if (
        prevStatus &&
        currentStatus &&
        !isPermissionAuthorized(prevStatus.state) &&
        isPermissionAuthorized(currentStatus.state)
      ) {
        setPermissionWasGranted(true);
        break;
      }
    }
    previousPermissionsRef.current = permissions;
  }, [permissions]);

  const { ready, blocked, allAuthorized } = useMemo(() => {
    let known = true;
    let missing = false;
    let allAuth = true;

    for (const kind of REQUIRED_PERMISSIONS) {
      const status = permissions[kind];
      if (!status) {
        known = false;
        allAuth = false;
        continue;
      }

      if (!isPermissionAuthorized(status.state)) {
        missing = true;
        allAuth = false;
      }
    }

    return { ready: known, blocked: missing, allAuthorized: allAuth };
  }, [permissions]);

  const open = ready && blocked && !isWelcomePage;
  const showRestartMessage = allAuthorized && permissionWasGranted;

  useEffect(() => {
    if (open) {
      setGotStartedAtNow();
    }
  }, [open]);

  const handleRestart = useCallback(async () => {
    try {
      await relaunch();
    } catch (error) {
      console.error("Failed to restart application", error);
    }
  }, []);

  return (
    <Dialog open={open || showRestartMessage}>
      <DialogContent
        className="sm:max-w-md bg-card pb-6 [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="Permissions needed" />
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6">
          <p className="text-sm">
            <FormattedMessage defaultMessage="Voquill is an AI dictation tool. It needs microphone and accessibility access in order to function properly." />
          </p>
          <div className="flex flex-col divide-y divide-border">
            {REQUIRED_PERMISSIONS.map((kind) => (
              <PermissionRow key={kind} kind={kind} />
            ))}
          </div>
          {showRestartMessage && (
            <Alert>
              <AlertDescription className="flex items-center justify-between">
                <span>
                  <FormattedMessage defaultMessage="Please restart the application for the new permissions to take effect." />
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleRestart()}
                >
                  <RiRestartLine className="mr-1.5 h-4 w-4" />
                  <FormattedMessage defaultMessage="Restart" />
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
