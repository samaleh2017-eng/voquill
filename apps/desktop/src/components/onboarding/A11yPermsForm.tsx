import {
  RiArrowRightLine,
  RiCheckLine,
  RiExternalLinkLine,
} from "@remixicon/react";
import { useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import { goToOnboardingPage } from "../../actions/onboarding.actions";
import enableA11yVideo from "../../assets/enable-a11y.mp4";
import { produceAppState, useAppStore } from "../../store";
import { trackButtonClick } from "../../utils/analytics.utils";
import {
  isPermissionAuthorized,
  requestAccessibilityPermission,
} from "../../utils/permission.utils";
import { Button } from "@/components/ui/button";
import {
  BackButton,
  DualPaneLayout,
  OnboardingFormLayout,
} from "./OnboardingCommon";

export const A11yPermsForm = () => {
  const [requesting, setRequesting] = useState(false);
  const a11yPermission = useAppStore((state) => state.permissions.accessibility);
  const isAuthorized = isPermissionAuthorized(a11yPermission?.state);

  const handleAllow = useCallback(async () => {
    if (requesting || isAuthorized) {
      return;
    }

    trackButtonClick("onboarding_a11y_allow_access");
    setRequesting(true);
    try {
      const result = await requestAccessibilityPermission();
      produceAppState((draft) => {
        draft.permissions.accessibility = result;
      });
    } catch (error) {
      console.error("Failed to request accessibility permission", error);
    } finally {
      setRequesting(false);
    }
  }, [requesting, isAuthorized]);

  const handleContinue = () => {
    trackButtonClick("onboarding_a11y_perms_continue");
    goToOnboardingPage("keybindings");
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
            <FormattedMessage defaultMessage="Enable accessibility" />
          </h2>
          <p className="text-base text-muted-foreground">
            <FormattedMessage defaultMessage="Voquill needs accessibility permissions to paste transcriptions into focused text fields." />
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
    <div className="max-h-full overflow-hidden rounded-xl border border-border">
      <video
        src={enableA11yVideo}
        autoPlay
        loop
        muted
        playsInline
        className="-m-0.5 block h-auto max-h-[calc(100%+4px)] w-auto max-w-[calc(100%+4px)]"
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
