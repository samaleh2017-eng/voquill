import {
  RiArrowRightLine,
  RiArticleLine,
  RiGithubFill,
  RiMoreLine,
  RiPlayCircleLine,
  RiRedditLine,
  RiRocketLine,
  RiSearchLine,
  RiShareLine,
  RiSparklingLine,
  RiTeamLine,
} from "@remixicon/react";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { goToOnboardingPage } from "../../actions/onboarding.actions";
import { produceAppState } from "../../store";
import { trackButtonClick } from "../../utils/analytics.utils";
import { isMacOS } from "../../utils/env.utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BackButton,
  DualPaneLayout,
  OnboardingFormLayout,
} from "./OnboardingCommon";

const REFERRAL_OPTIONS = [
  { label: "AI Chat", value: "ai_chat", icon: RiSparklingLine },
  { label: "YouTube", value: "youtube", icon: RiPlayCircleLine },
  { label: "Friend", value: "friend", icon: RiTeamLine },
  { label: "Product Hunt", value: "product_hunt", icon: RiRocketLine },
  { label: "GitHub", value: "github", icon: RiGithubFill },
  { label: "Google Search", value: "google_search", icon: RiSearchLine },
  { label: "Reddit", value: "reddit", icon: RiRedditLine },
  { label: "Social Media", value: "social_media", icon: RiShareLine },
  { label: "Blog", value: "blog", icon: RiArticleLine },
  { label: "Other", value: "other", icon: RiMoreLine },
] as const;

export const ReferralSourceForm = () => {
  const intl = useIntl();
  const [selected, setSelected] = useState<string | null>(null);
  const [otherText, setOtherText] = useState("");

  const handleChipClick = (value: string) => {
    setSelected(value);

    if (value !== "other") {
      produceAppState((draft) => {
        draft.onboarding.referralSource = value;
      });
      navigateForward();
    }
  };

  const navigateForward = () => {
    trackButtonClick("onboarding_referral_source_continue");
    goToOnboardingPage(isMacOS() ? "micPerms" : "keybindings");
  };

  const handleOtherContinue = () => {
    const trimmed = otherText.trim();
    if (!trimmed) return;
    produceAppState((draft) => {
      draft.onboarding.referralSource = `other: ${trimmed}`;
    });
    navigateForward();
  };

  const form = (
    <OnboardingFormLayout
      back={<BackButton />}
      actions={
        selected === "other" ? (
          <Button onClick={handleOtherContinue} disabled={!otherText.trim()}>
            <FormattedMessage defaultMessage="Continue" />
            <RiArrowRightLine className="size-4" />
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6 pb-4">
        <div>
          <h2 className="pb-2 text-2xl font-semibold">
            <FormattedMessage defaultMessage="How did you hear about us?" />
          </h2>
          <p className="text-base text-muted-foreground">
            <FormattedMessage defaultMessage="This is a huge help to us as we work to improve Voquill for everyone." />
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {REFERRAL_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selected === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleChipClick(option.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-accent",
                )}
              >
                <Icon className="size-4" />
                {option.label}
              </button>
            );
          })}
        </div>

        {selected === "other" && (
          <div className="space-y-1.5">
            <Label htmlFor="referral-other">
              <FormattedMessage defaultMessage="Please specify" />
            </Label>
            <Input
              id="referral-other"
              placeholder={intl.formatMessage({
                defaultMessage: "e.g. Podcast, conference, etc.",
              })}
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              autoFocus
              data-voquill-ignore="true"
            />
          </div>
        )}
      </div>
    </OnboardingFormLayout>
  );

  const rightContent = (
    <img
      src="https://illustrations.popsy.co/amber/communication.svg"
      alt="Illustration"
      className="max-h-[400px] max-w-[400px]"
    />
  );

  return <DualPaneLayout left={form} right={rightContent} />;
};
