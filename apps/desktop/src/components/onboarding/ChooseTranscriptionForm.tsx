import { RiArrowRightLine } from "@remixicon/react";
import { FormattedMessage } from "react-intl";
import { goToOnboardingPage } from "../../actions/onboarding.actions";
import { useAppStore } from "../../store";
import { trackButtonClick } from "../../utils/analytics.utils";
import { AITranscriptionConfiguration } from "../settings/AITranscriptionConfiguration";
import { Button } from "@/components/ui/button";
import {
  BackButton,
  DualPaneLayout,
  OnboardingFormLayout,
} from "./OnboardingCommon";

export const ChooseTranscriptionForm = () => {
  const { mode, selectedApiKeyId } = useAppStore(
    (state) => state.settings.aiTranscription,
  );

  const canContinue = mode === "api" ? Boolean(selectedApiKeyId) : true;

  const handleContinue = () => {
    trackButtonClick("onboarding_transcription_continue");
    goToOnboardingPage("chooseLlm");
  };

  const form = (
    <OnboardingFormLayout
      back={<BackButton />}
      actions={
        <Button onClick={handleContinue} disabled={!canContinue}>
          <FormattedMessage defaultMessage="Continue" />
          <RiArrowRightLine className="size-4" />
        </Button>
      }
    >
      <div className="space-y-6">
        <div>
          <h2 className="pb-2 text-2xl font-semibold">
            <FormattedMessage defaultMessage="Set up transcription" />
          </h2>
          <p className="text-base text-muted-foreground">
            <FormattedMessage defaultMessage="Decide how Voquill should process your recordings. Locally or through an API." />
          </p>
        </div>

        <AITranscriptionConfiguration hideCloudOption={true} />
      </div>
    </OnboardingFormLayout>
  );

  const rightContent = (
    <img
      src="https://illustrations.popsy.co/amber/remote-work.svg"
      alt="Illustration"
      className="max-h-[400px] max-w-[400px]"
    />
  );

  return <DualPaneLayout left={form} right={rightContent} />;
};
