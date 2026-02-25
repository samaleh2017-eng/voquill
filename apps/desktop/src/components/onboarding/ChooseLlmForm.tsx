import { RiArrowRightLine } from "@remixicon/react";
import { FormattedMessage } from "react-intl";
import { goToOnboardingPage } from "../../actions/onboarding.actions";
import { useAppStore } from "../../store";
import { trackButtonClick } from "../../utils/analytics.utils";
import { AIPostProcessingConfiguration } from "../settings/AIPostProcessingConfiguration";
import { Button } from "@/components/ui/button";
import {
  BackButton,
  DualPaneLayout,
  OnboardingFormLayout,
} from "./OnboardingCommon";

export const ChooseLlmForm = () => {
  const { mode, selectedApiKeyId } = useAppStore(
    (state) => state.settings.aiPostProcessing,
  );

  const canContinue = mode === "api" ? Boolean(selectedApiKeyId) : true;

  const handleContinue = () => {
    trackButtonClick("onboarding_llm_continue");
    goToOnboardingPage("userDetails");
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
            <FormattedMessage defaultMessage="Set up post-processing" />
          </h2>
          <p className="text-base text-muted-foreground">
            <FormattedMessage defaultMessage="Choose if Voquill should enhance transcripts automatically after they are transcribed." />
          </p>
        </div>

        <AIPostProcessingConfiguration hideCloudOption={true} />
      </div>
    </OnboardingFormLayout>
  );

  const rightContent = (
    <img
      src="https://illustrations.popsy.co/amber/designer.svg"
      alt="Illustration"
      className="max-h-[400px] max-w-[400px]"
    />
  );

  return <DualPaneLayout left={form} right={rightContent} />;
};
