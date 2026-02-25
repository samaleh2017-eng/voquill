import {
  RiAlertLine,
  RiAppsLine,
  RiDeleteBinLine,
  RiEditLine,
  RiEqualizerLine,
  RiExternalLinkLine,
  RiFileTextLine,
  RiGlobalLine,
  RiKeyboardLine,
  RiLockLine,
  RiLogoutBoxLine,
  RiMagicLine,
  RiMicLine,
  RiMoneyDollarCircleLine,
  RiMoreLine,
  RiRocketLine,
  RiShieldLine,
  RiSparklingLine,
  RiUserUnfollowLine,
  RiVolumeUpLine,
} from "@remixicon/react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { showErrorSnackbar } from "../../actions/app.actions";
import { setAutoLaunchEnabled } from "../../actions/settings.actions";
import { loadTones } from "../../actions/tone.actions";
import { setPreferredLanguage } from "../../actions/user.actions";
import { getAuthRepo, getStripeRepo } from "../../repos";
import { produceAppState, useAppStore } from "../../store";
import {
  getAllowsChangeAgentMode,
  getAllowsChangePostProcessing,
  getAllowsChangeTranscription,
} from "../../utils/enterprise.utils";
import { isMacOS } from "../../utils/env.utils";
import { getAdditionalLanguageEntries } from "../../utils/keyboard.utils";
import {
  DICTATION_LANGUAGE_OPTIONS,
  KEYBOARD_LAYOUT_LANGUAGE,
  WHISPER_LANGUAGES,
} from "../../utils/language.utils";
import { getIsPaidSubscriber } from "../../utils/member.utils";
import {
  getDetectedSystemLocale,
  getGenerativePrefs,
  getHasEmailProvider,
  getIsSignedIn,
  getMyUser,
} from "../../utils/user.utils";
import { ListTile } from "../common/ListTile";
import { Section } from "../common/Section";
import { DashboardEntryLayout } from "../dashboard/DashboardEntryLayout";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const hasEmailProvider = useAppStore(getHasEmailProvider);
  const isSubscribed = useAppStore(getIsPaidSubscriber);
  const isEnterprise = useAppStore((state) => state.isEnterprise);
  const allowChangeTranscription = useAppStore(getAllowsChangeTranscription);
  const allowChangePostProcessing = useAppStore(getAllowsChangePostProcessing);
  const allowChangeAgentMode = useAppStore(getAllowsChangeAgentMode);
  const [manageSubscriptionLoading, setManageSubscriptionLoading] =
    useState(false);
  const isSignedIn = useAppStore(getIsSignedIn);
  const [autoLaunchEnabled, autoLaunchStatus] = useAppStore((state) => [
    state.settings.autoLaunchEnabled,
    state.settings.autoLaunchStatus,
  ]);
  const autoLaunchLoading = autoLaunchStatus === "loading";
  const intl = useIntl();

  const dictationLanguage = useAppStore((state) => {
    const user = getMyUser(state);
    return user?.preferredLanguage ?? getDetectedSystemLocale();
  });

  const dictationLanguageWarning = useAppStore((state) => {
    const hasPostProcessingEnabled = getGenerativePrefs(state).mode !== "none";
    if (hasPostProcessingEnabled) {
      return null;
    }

    if (dictationLanguage === KEYBOARD_LAYOUT_LANGUAGE) {
      return null;
    }

    const isWhisperLang = dictationLanguage in WHISPER_LANGUAGES;
    if (!isWhisperLang) {
      return intl.formatMessage({
        defaultMessage:
          "Be sure to enable AI post processing when using this language for the best results.",
      });
    }

    return null;
  });

  const hasAdditionalLanguages = useAppStore(
    (state) => getAdditionalLanguageEntries(state).length > 0,
  );

  const openDictationLanguageDialog = () => {
    produceAppState((draft) => {
      draft.settings.dictationLanguageDialogOpen = true;
    });
  };

  const handleDictationLanguageChange = (nextValue: string) => {
    void setPreferredLanguage(nextValue).then(() => {
      loadTones();
    });
  };

  const openChangePasswordDialog = () => {
    produceAppState((state) => {
      state.settings.changePasswordDialogOpen = true;
    });
  };

  const openTranscriptionDialog = () => {
    produceAppState((draft) => {
      draft.settings.aiTranscriptionDialogOpen = true;
    });
  };

  const openPostProcessingDialog = () => {
    produceAppState((draft) => {
      draft.settings.aiPostProcessingDialogOpen = true;
    });
  };

  const openAppKeybindingsDialog = () => {
    produceAppState((draft) => {
      draft.settings.appKeybindingsDialogOpen = true;
    });
  };

  const openAgentModeDialog = () => {
    produceAppState((draft) => {
      draft.settings.agentModeDialogOpen = true;
    });
  };

  const openMicrophoneDialog = () => {
    produceAppState((draft) => {
      draft.settings.microphoneDialogOpen = true;
    });
  };

  const openAudioDialog = () => {
    produceAppState((draft) => {
      draft.settings.audioDialogOpen = true;
    });
  };

  const openShortcutsDialog = () => {
    produceAppState((draft) => {
      draft.settings.shortcutsDialogOpen = true;
    });
  };

  const openMoreSettingsDialog = () => {
    produceAppState((draft) => {
      draft.settings.moreSettingsDialogOpen = true;
    });
  };

  const openClearLocalDataDialog = () => {
    produceAppState((draft) => {
      draft.settings.clearLocalDataDialogOpen = true;
    });
  };

  const openDeleteAccountDialog = () => {
    produceAppState((state) => {
      state.settings.deleteAccountDialog = true;
    });
  };

  const handleToggleAutoLaunch = (checked: boolean) => {
    void setAutoLaunchEnabled(checked);
  };

  const handleManageSubscription = async () => {
    setManageSubscriptionLoading(true);
    try {
      const url = await getStripeRepo()?.createCustomerPortalSession();
      if (url) {
        openUrl(url);
      } else {
        showErrorSnackbar("Unable to open manage subscription page.");
      }
    } catch (error) {
      showErrorSnackbar(error);
    } finally {
      setManageSubscriptionLoading(false);
    }
  };

  const handleSignOut = async () => {
    await getAuthRepo().signOut();
  };

  const general = (
    <Section title={<FormattedMessage defaultMessage="General" />}>
      <ListTile
        title={<FormattedMessage defaultMessage="Start on system startup" />}
        leading={<RiRocketLine className="size-5 text-muted-foreground" />}
        trailing={
          <Switch
            checked={autoLaunchEnabled}
            disabled={autoLaunchLoading}
            onCheckedChange={handleToggleAutoLaunch}
          />
        }
      />
      <ListTile
        title={<FormattedMessage defaultMessage="Microphone" />}
        leading={<RiMicLine className="size-5 text-muted-foreground" />}
        onClick={openMicrophoneDialog}
      />
      <ListTile
        title={<FormattedMessage defaultMessage="Audio" />}
        leading={<RiVolumeUpLine className="size-5 text-muted-foreground" />}
        onClick={openAudioDialog}
      />
      <ListTile
        title={<FormattedMessage defaultMessage="Hotkey shortcuts" />}
        leading={<RiKeyboardLine className="size-5 text-muted-foreground" />}
        onClick={openShortcutsDialog}
      />
      {!isMacOS() && (
        <ListTile
          title={<FormattedMessage defaultMessage="App paste bindings" />}
          leading={<RiAppsLine className="size-5 text-muted-foreground" />}
          onClick={openAppKeybindingsDialog}
        />
      )}
      <ListTile
        title={<FormattedMessage defaultMessage="More settings" />}
        leading={<RiMoreLine className="size-5 text-muted-foreground" />}
        onClick={openMoreSettingsDialog}
      />
    </Section>
  );

  const dictationLanguageComp = (
    <>
      {hasAdditionalLanguages ? (
        <ListTile
          title={<FormattedMessage defaultMessage="Dictation language" />}
          leading={<RiGlobalLine className="size-5 text-muted-foreground" />}
          onClick={openDictationLanguageDialog}
          trailing={
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                openDictationLanguageDialog();
              }}
            >
              <FormattedMessage defaultMessage="Multiple languages" />
              <RiEditLine className="ml-1.5 size-3.5" />
            </Button>
          }
        />
      ) : (
        <ListTile
          title={<FormattedMessage defaultMessage="Dictation language" />}
          leading={<RiGlobalLine className="size-5 text-muted-foreground" />}
          trailing={
            <div
              onClick={(event) => event.stopPropagation()}
              className="flex min-w-[200px] items-center gap-2"
            >
              {dictationLanguageWarning && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={openPostProcessingDialog}>
                        <RiAlertLine className="size-4 text-yellow-500" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {dictationLanguageWarning}{" "}
                        <button
                          className="underline"
                          onClick={openPostProcessingDialog}
                        >
                          <FormattedMessage defaultMessage="Fix issue" />
                        </button>
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={openDictationLanguageDialog}
                    >
                      <RiMoreLine className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <FormattedMessage defaultMessage="Set up multiple languages with different hotkeys" />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Select
                value={dictationLanguage}
                onValueChange={handleDictationLanguageChange}
              >
                <SelectTrigger className="w-full" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {DICTATION_LANGUAGE_OPTIONS.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />
      )}
    </>
  );

  const processing = (
    <Section
      title={<FormattedMessage defaultMessage="Processing" />}
      description={
        <FormattedMessage defaultMessage="How Voquill should manage your transcriptions." />
      }
    >
      {dictationLanguageComp}
      {allowChangeTranscription && (
        <ListTile
          title={<FormattedMessage defaultMessage="AI transcription" />}
          leading={<RiEqualizerLine className="size-5 text-muted-foreground" />}
          onClick={openTranscriptionDialog}
        />
      )}
      {allowChangePostProcessing && (
        <ListTile
          title={<FormattedMessage defaultMessage="AI post processing" />}
          leading={<RiMagicLine className="size-5 text-muted-foreground" />}
          onClick={openPostProcessingDialog}
        />
      )}
      {allowChangeAgentMode && (
        <ListTile
          title={
            <span className="flex items-center gap-2">
              <FormattedMessage defaultMessage="Agent mode" />
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Beta
              </Badge>
            </span>
          }
          leading={<RiSparklingLine className="size-5 text-muted-foreground" />}
          onClick={openAgentModeDialog}
        />
      )}
    </Section>
  );

  const advanced = (
    <Section
      title={<FormattedMessage defaultMessage="Advanced" />}
      description={
        <FormattedMessage defaultMessage="Manage your account preferences and settings." />
      }
    >
      {hasEmailProvider && (
        <ListTile
          title={<FormattedMessage defaultMessage="Change password" />}
          leading={<RiLockLine className="size-5 text-muted-foreground" />}
          onClick={openChangePasswordDialog}
        />
      )}
      {isSubscribed && !isEnterprise && (
        <ListTile
          title={<FormattedMessage defaultMessage="Manage subscription" />}
          leading={
            <RiMoneyDollarCircleLine className="size-5 text-muted-foreground" />
          }
          onClick={handleManageSubscription}
          disabled={manageSubscriptionLoading}
          trailing={<RiExternalLinkLine className="size-4 text-muted-foreground" />}
        />
      )}
      <ListTile
        title={<FormattedMessage defaultMessage="Terms & conditions" />}
        onClick={() => openUrl("https://voquill.com/terms")}
        trailing={<RiExternalLinkLine className="size-4 text-muted-foreground" />}
        leading={<RiFileTextLine className="size-5 text-muted-foreground" />}
      />
      <ListTile
        title={<FormattedMessage defaultMessage="Privacy policy" />}
        onClick={() => openUrl("https://voquill.com/privacy")}
        trailing={<RiExternalLinkLine className="size-4 text-muted-foreground" />}
        leading={<RiShieldLine className="size-5 text-muted-foreground" />}
      />
      {isSignedIn && (
        <ListTile
          title={<FormattedMessage defaultMessage="Sign out" />}
          leading={<RiLogoutBoxLine className="size-5 text-muted-foreground" />}
          onClick={handleSignOut}
        />
      )}
    </Section>
  );

  const dangerZone = (
    <Section
      title={<FormattedMessage defaultMessage="Danger zone" />}
      description={
        <FormattedMessage defaultMessage="Be careful with these actions. They can have significant consequences for your account." />
      }
    >
      {!isSignedIn && (
        <ListTile
          title={<FormattedMessage defaultMessage="Clear local data" />}
          leading={<RiDeleteBinLine className="size-5 text-muted-foreground" />}
          onClick={openClearLocalDataDialog}
        />
      )}
      {isSignedIn && (
        <ListTile
          title={<FormattedMessage defaultMessage="Delete account" />}
          leading={
            <RiUserUnfollowLine className="size-5 text-muted-foreground" />
          }
          onClick={openDeleteAccountDialog}
        />
      )}
    </Section>
  );

  return (
    <DashboardEntryLayout>
      <div className="flex flex-col">
        <h1 className="mb-6 text-3xl font-bold tracking-tight">
          <FormattedMessage defaultMessage="Settings" />
        </h1>
        {general}
        {processing}
        {advanced}
        {!isEnterprise && dangerZone}
      </div>
    </DashboardEntryLayout>
  );
}
