import {
  RiArrowRightLine,
  RiCheckLine,
  RiExternalLinkLine,
} from "@remixicon/react";
import { useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import { goToOnboardingPage } from "../../actions/onboarding.actions";
import enableMicVideo from "../../assets/enable-mic.mp4";
import { produceAppState, useAppStore } from "../../store";
import { trackButtonClick } from "../../utils/analytics.utils";
import {
  isPermissionAuthorized,
  requestMicrophonePermission,
} from "../../utils/permission.utils";
import { Button } from "@/components/ui/button";
import {
  BackButton,
  DualPaneLayout,
  OnboardingFormLayout,
} from "./OnboardingCommon";

export const MicPermsForm = () => {
  const [requesting, setRequesting] = useState(false);
  const micPermission = useAppStore((state) => state.permissions.microphone);
  const isAuthorized = isPermissionAuthorized(micPermission?.state);

  const handleAllow = useCallback(async () => {
    if (requesting || isAuthorized) {
      return;
    }

    trackButtonClick("onboarding_mic_allow_access");
    setRequesting(true);
    try {
      const result = await requestMicrophonePermission();
      produceAppState((draft) => {
        draft.permissions.microphone = result;
      });
    } catch (error) {
      console.error("Failed to request microphone permission", error);
    } finally {
      setRequesting(false);
    }
  }, [requesting, isAuthorized]);

  const handleContinue = () => {
    trackButtonClick("onboarding_mic_perms_continue");
    goToOnboardingPage("a11yPerms");
  };

  const form = (
    <OnboardingFormLayout
      back={<BackButton />}
      actions={
        <Button onClick={handleContinue} disabled={!isAuthorized}>
          <FormattedMessage defaultMessage="Continue" />
          <RiArrowRightLine className="size-4" />
        </Button>
      }
    >
      <div className="space-y-6">
        <div>
          <h2 className="pb-2 text-2xl font-semibold">
            <FormattedMessage defaultMessage="Set up your microphone" />
          </h2>
          <p className="text-base text-muted-foreground">
            <FormattedMessage defaultMessage="Voquill only activates your microphone when you choose to start recording." />
          </p>
        </div>

        {isAuthorized ? (
          <Button variant="outline" disabled className="self-start text-green-600">
            <RiCheckLine className="size-4" />
            <FormattedMessage defaultMessage="Access granted" />
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => void handleAllow()}
            disabled={requesting}
            className="self-start"
          >
            <FormattedMessage defaultMessage="Allow access" />
            <RiExternalLinkLine className="size-4" />
          </Button>
        )}
      </div>
    </OnboardingFormLayout>
  );

  const rightContent = (
    <div className="m-8 max-h-full overflow-hidden rounded-3xl border border-border">
      <video
        src={enableMicVideo}
        autoPlay
        loop
        muted
        playsInline
        className="-m-2.5 block h-auto max-h-[calc(100%+20px)] w-auto max-w-[calc(100%+20px)]"
      />
    </div>
  );

  return (
    <DualPaneLayout
      left={form}
      right={rightContent}
      rightClassName="bg-transparent"
    />
  );
};
