import { RiDownloadLine, RiMoreLine } from "@remixicon/react";
import type { DictationPillVisibility, StylingMode } from "@repo/types";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  setDictationPillVisibility,
  setIgnoreUpdateDialog,
  setIncognitoModeEnabled,
  setIncognitoModeIncludeInStats,
  setStylingMode,
  setUseNewBackend,
} from "../../actions/user.actions";
import { produceAppState, useAppStore } from "../../store";
import type { LogLevel } from "../../types/log.types";
import { getAllowChangeStylingMode } from "../../utils/enterprise.utils";
import { getEffectiveStylingMode } from "../../utils/feature.utils";
import {
  downloadLogs,
  getLogLevel,
  setLogLevel,
  setOnBufferWrap,
} from "../../utils/log.utils";
import {
  getEffectivePillVisibility,
  getMyUserPreferences,
} from "../../utils/user.utils";
import {
  MenuPopoverBuilder,
  type MenuPopoverItem,
} from "../common/MenuPopover";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const MoreSettingsDialog = () => {
  const intl = useIntl();
  const [
    open,
    ignoreUpdateDialog,
    incognitoModeEnabled,
    incognitoIncludeInStats,
    dictationPillVisibility,
    stylingMode,
    canChangeStylingMode,
    useNewBackend,
    autoDownloadLogs,
    isEnterprise,
  ] = useAppStore((state) => {
    const prefs = getMyUserPreferences(state);
    return [
      state.settings.moreSettingsDialogOpen,
      prefs?.ignoreUpdateDialog ?? false,
      prefs?.incognitoModeEnabled ?? false,
      prefs?.incognitoModeIncludeInStats ?? false,
      getEffectivePillVisibility(prefs?.dictationPillVisibility),
      getEffectiveStylingMode(state),
      getAllowChangeStylingMode(state),
      prefs?.useNewBackend ?? false,
      state.settings.autoDownloadLogs,
      state.isEnterprise,
    ] as const;
  });

  const handleClose = () => {
    produceAppState((draft) => {
      draft.settings.moreSettingsDialogOpen = false;
    });
  };

  const handleToggleShowUpdates = (checked: boolean) => {
    void setIgnoreUpdateDialog(!checked);
  };

  const handleToggleIncognitoMode = (checked: boolean) => {
    void setIncognitoModeEnabled(checked);
  };

  const handleToggleIncognitoIncludeInStats = (checked: boolean) => {
    void setIncognitoModeIncludeInStats(checked);
  };

  const handleDictationPillVisibilityChange = (
    value: string,
  ) => {
    void setDictationPillVisibility(value as DictationPillVisibility);
  };

  const handleStylingModeChange = (value: string) => {
    void setStylingMode(value === "" ? null : (value as StylingMode));
  };

  const handleToggleUseNewBackend = (checked: boolean) => {
    void setUseNewBackend(checked);
  };

  const [logLevel, setLogLevelState] = useState<LogLevel>(getLogLevel);

  const handleLogLevelChange = (value: string) => {
    const level = value as LogLevel;
    setLogLevel(level);
    setLogLevelState(level);
  };

  const handleDownloadLogs = useCallback(() => {
    downloadLogs();
  }, []);

  const handleStartAutoDownload = useCallback(() => {
    setOnBufferWrap(downloadLogs);
    produceAppState((draft) => {
      draft.settings.autoDownloadLogs = true;
    });
  }, []);

  const handleStopAutoDownload = useCallback(() => {
    setOnBufferWrap(null);
    produceAppState((draft) => {
      draft.settings.autoDownloadLogs = false;
    });
  }, []);

  const autoDownloadMenuItems: MenuPopoverItem[] = useMemo(
    () => [
      {
        kind: "genericItem" as const,
        builder: ({ close }: { close: () => void }) => (
          <button
            className="w-full px-3 py-2 text-left hover:bg-accent"
            onClick={() => {
              close();
              handleStartAutoDownload();
            }}
          >
            <div className="text-sm">
              {intl.formatMessage({ defaultMessage: "Auto download" })}
            </div>
            <div className="text-xs text-muted-foreground">
              {intl.formatMessage({
                defaultMessage: "Only active for the duration of this session.",
              })}
            </div>
          </button>
        ),
      },
    ],
    [intl, handleStartAutoDownload],
  );

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="More settings" />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <SettingSection
            title={<FormattedMessage defaultMessage="Incognito mode" />}
            description={
              <FormattedMessage defaultMessage="When enabled, Voquill will not save transcription history or audio snapshots." />
            }
            action={
              <Switch
                checked={incognitoModeEnabled}
                onCheckedChange={handleToggleIncognitoMode}
              />
            }
          />

          {incognitoModeEnabled && (
            <SettingSection
              title={
                <FormattedMessage defaultMessage="Include incognito in stats" />
              }
              description={
                <FormattedMessage defaultMessage="If enabled, words dictated in incognito mode will still count toward your usage statistics." />
              }
              action={
                <Switch
                  checked={incognitoIncludeInStats}
                  onCheckedChange={handleToggleIncognitoIncludeInStats}
                />
              }
            />
          )}

          <SettingSection
            title={
              <FormattedMessage defaultMessage="Automatically show updates" />
            }
            description={
              <FormattedMessage defaultMessage="Automatically open the update window when a new version is available." />
            }
            action={
              <Switch
                checked={!ignoreUpdateDialog}
                onCheckedChange={handleToggleShowUpdates}
              />
            }
          />

          <SettingSection
            title={
              <FormattedMessage defaultMessage="Dictation pill visibility" />
            }
            description={
              <FormattedMessage defaultMessage="Control when the dictation pill is shown on screen." />
            }
            action={
              <Select
                value={dictationPillVisibility}
                onValueChange={handleDictationPillVisibilityChange}
              >
                <SelectTrigger className="w-[152px]" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="persistent">
                    {intl.formatMessage({ defaultMessage: "Persistent" })}
                  </SelectItem>
                  <SelectItem value="while_active">
                    {intl.formatMessage({ defaultMessage: "While active" })}
                  </SelectItem>
                  <SelectItem value="hidden">
                    {intl.formatMessage({ defaultMessage: "Hidden" })}
                  </SelectItem>
                </SelectContent>
              </Select>
            }
          />

          {canChangeStylingMode && (
            <SettingSection
              title={<FormattedMessage defaultMessage="Styling mode" />}
              description={
                <FormattedMessage defaultMessage="Choose how to switch between writing styles." />
              }
              action={
                <Select
                  value={stylingMode}
                  onValueChange={handleStylingModeChange}
                >
                  <SelectTrigger className="w-[152px]" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="app">
                      {intl.formatMessage({ defaultMessage: "Based on app" })}
                    </SelectItem>
                    <SelectItem value="manual">
                      {intl.formatMessage({ defaultMessage: "Manual" })}
                    </SelectItem>
                  </SelectContent>
                </Select>
              }
            />
          )}

          {!isEnterprise && (
            <SettingSection
              title={<FormattedMessage defaultMessage="Use new backend" />}
              description={
                <FormattedMessage defaultMessage="Use the new cloud backend for transcription and text generation. Requires cloud mode to be enabled." />
              }
              action={
                <Switch
                  checked={useNewBackend}
                  onCheckedChange={handleToggleUseNewBackend}
                />
              }
            />
          )}

          <SettingSection
            title={<FormattedMessage defaultMessage="Log level" />}
            description={
              <FormattedMessage defaultMessage="Controls how much detail is captured in diagnostic logs." />
            }
            action={
              <Select value={logLevel} onValueChange={handleLogLevelChange}>
                <SelectTrigger className="w-[152px]" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">
                    {intl.formatMessage({ defaultMessage: "Info" })}
                  </SelectItem>
                  <SelectItem value="verbose">
                    {intl.formatMessage({ defaultMessage: "Verbose" })}
                  </SelectItem>
                </SelectContent>
              </Select>
            }
          />

          <SettingSection
            title={<FormattedMessage defaultMessage="Download logs" />}
            description={
              <FormattedMessage defaultMessage="Export diagnostic logs as a text file for troubleshooting." />
            }
            action={
              autoDownloadLogs ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleStopAutoDownload}
                >
                  <span className="relative mr-1.5 flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-red-500" />
                  </span>
                  <FormattedMessage defaultMessage="Stop" />
                </Button>
              ) : (
                <div className="flex items-center gap-1">
                  <MenuPopoverBuilder items={autoDownloadMenuItems}>
                    {({ ref, open }) => (
                      <Button
                        ref={ref as React.Ref<HTMLButtonElement>}
                        variant="ghost"
                        size="icon-xs"
                        onClick={open}
                      >
                        <RiMoreLine className="size-4" />
                      </Button>
                    )}
                  </MenuPopoverBuilder>
                  <Button size="sm" onClick={handleDownloadLogs}>
                    <RiDownloadLine className="mr-1 size-3.5" />
                    <FormattedMessage defaultMessage="Download" />
                  </Button>
                </div>
              )
            }
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <FormattedMessage defaultMessage="Close" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
