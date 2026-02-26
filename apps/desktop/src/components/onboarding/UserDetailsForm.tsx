import { RiArrowRightLine } from "@remixicon/react";
import { FormattedMessage, useIntl } from "react-intl";
import { goToOnboardingPage } from "../../actions/onboarding.actions";
import { produceAppState, useAppStore } from "../../store";
import { trackButtonClick } from "../../utils/analytics.utils";
import { isMacOS } from "../../utils/env.utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BackButton,
  DualPaneLayout,
  OnboardingFormLayout,
} from "./OnboardingCommon";

export const UserDetailsForm = () => {
  const intl = useIntl();
  const name = useAppStore((state) => state.onboarding.name);
  const title = useAppStore((state) => state.onboarding.title);
  const company = useAppStore((state) => state.onboarding.company);
  const submitting = useAppStore((state) => state.onboarding.submitting);
  const isEnterprise = useAppStore((state) => state.isEnterprise);

  const canContinue = name && !submitting;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    produceAppState((draft) => {
      draft.onboarding.name = e.target.value;
    });
  };

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    produceAppState((draft) => {
      draft.onboarding.name = e.target.value.trim();
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    produceAppState((draft) => {
      draft.onboarding.title = e.target.value;
    });
  };

  const handleTitleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    produceAppState((draft) => {
      draft.onboarding.title = e.target.value.trim();
    });
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    produceAppState((draft) => {
      draft.onboarding.company = e.target.value;
    });
  };

  const handleCompanyBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    produceAppState((draft) => {
      draft.onboarding.company = e.target.value.trim();
    });
  };

  const handleContinue = () => {
    trackButtonClick("onboarding_user_details_continue");
    if (isEnterprise) {
      goToOnboardingPage(isMacOS() ? "micPerms" : "keybindings");
    } else {
      goToOnboardingPage("referralSource");
    }
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
            <FormattedMessage defaultMessage="Tell us about yourself" />
          </h2>
          <p className="text-base text-muted-foreground">
            <FormattedMessage defaultMessage="This information helps personalize your experience." />
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="onboarding-name">
              <FormattedMessage defaultMessage="Full name" />
            </Label>
            <Input
              id="onboarding-name"
              placeholder={intl.formatMessage({ defaultMessage: "John Doe" })}
              value={name}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              autoFocus
              autoComplete="name"
              data-voquill-ignore="true"
            />
          </div>

          {!isEnterprise && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="onboarding-title">
                  <FormattedMessage defaultMessage="Title" />
                </Label>
                <Input
                  id="onboarding-title"
                  placeholder={intl.formatMessage({
                    defaultMessage: "Vice President",
                  })}
                  value={title}
                  onChange={handleTitleChange}
                  onBlur={handleTitleBlur}
                  autoComplete="organization-title"
                  data-voquill-ignore="true"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="onboarding-company">
                  <FormattedMessage defaultMessage="Company" />
                </Label>
                <Input
                  id="onboarding-company"
                  placeholder={intl.formatMessage({
                    defaultMessage: "Acme Inc.",
                  })}
                  value={company}
                  onChange={handleCompanyChange}
                  onBlur={handleCompanyBlur}
                  autoComplete="organization"
                  data-voquill-ignore="true"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </OnboardingFormLayout>
  );

  const rightContent = (
    <img
      src="https://illustrations.popsy.co/amber/man-riding-a-rocket.svg"
      alt="Illustration"
      className="max-h-[400px] max-w-[400px]"
    />
  );

  return <DualPaneLayout left={form} right={rightContent} />;
};
