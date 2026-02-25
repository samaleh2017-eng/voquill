import { RiArrowRightLine, RiCloseLine } from "@remixicon/react";
import { delayed } from "@repo/utilities";
import { useEffect, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { openUpgradePlanDialog } from "../../actions/pricing.actions";
import { showToast } from "../../actions/toast.actions";
import { markUpgradeDialogSeen } from "../../actions/user.actions";
import { useAppStore } from "../../store";
import { trackButtonClick, trackPageView } from "../../utils/analytics.utils";
import { getMyMember } from "../../utils/member.utils";
import { getMyUser } from "../../utils/user.utils";
import { TrialEndedBackground } from "./TrialEndedBackground";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

const MIN_WORDS_THRESHOLD = 100;

export const TrialEndedDialog = () => {
  const intl = useIntl();
  const hasFocusedRef = useRef(false);

  const shouldShowUpgradeDialog = useAppStore(
    (state) => getMyUser(state)?.shouldShowUpgradeDialog ?? false,
  );

  const member = useAppStore(getMyMember);
  const wordsToday = member?.wordsToday || 0;
  const wordsTotal = member?.wordsTotal || 0;
  const memberPlan = member?.plan ?? "free";
  const avgTalkingSpeedWpm = 135;
  const avgTypingSpeedWpm = 40;
  const timeTalked = wordsTotal / avgTalkingSpeedWpm;
  const timeTyped = wordsTotal / avgTypingSpeedWpm;
  const totalTimeSaved = timeTyped - timeTalked;

  const freeWordsPerDay = useAppStore(
    (state) => state.config?.freeWordsPerDay ?? 1_000,
  );

  const wordsRemaining = Math.max(0, freeWordsPerDay - wordsToday);
  const usagePercent = Math.min(100, (wordsToday / freeWordsPerDay) * 100);

  const shouldShow =
    shouldShowUpgradeDialog &&
    wordsToday >= MIN_WORDS_THRESHOLD &&
    memberPlan !== "pro";

  useEffect(() => {
    if (shouldShow && !hasFocusedRef.current) {
      hasFocusedRef.current = true;
      delayed(1000 * 4).then(() =>
        showToast({
          title: intl.formatMessage({
            defaultMessage: "Your Pro trial has ended",
          }),
          message: intl.formatMessage({
            defaultMessage:
              "Upgrade now to continue voice typing without any limits.",
          }),
          toastType: "info",
          action: "surface_window",
          duration: 8_000,
        }),
      );
    }

    if (!shouldShow) {
      hasFocusedRef.current = false;
    } else {
      trackPageView("upgrade_dialog_after_trial_end");
    }
  }, [shouldShow, freeWordsPerDay, intl]);

  const handleDismiss = async () => {
    trackButtonClick("dismiss_upgrade_dialog_after_trial_end");
    await markUpgradeDialogSeen();
  };

  const handleUpgrade = async () => {
    trackButtonClick("upgrade_from_dialog_after_trial_end");
    await markUpgradeDialogSeen();
    openUpgradePlanDialog();
  };

  return (
    <Dialog open={shouldShow}>
      <DialogContent className="max-w-full h-full sm:max-w-full sm:h-full flex flex-col rounded-none border-none p-0 bg-background [&>button]:hidden">
        {shouldShow && <TrialEndedBackground />}

        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-accent transition-colors"
        >
          <RiCloseLine className="h-6 w-6" />
        </button>

        <div className="relative z-[1] flex flex-col items-center justify-center min-h-full px-8 py-8 overflow-auto">
          <div className="flex flex-col items-center gap-8 max-w-[480px]">
            <div className="flex flex-col items-center gap-4 text-center">
              <h1 className="text-3xl font-bold">
                <FormattedMessage defaultMessage="Thanks for trying Voquill" />
              </h1>
              <p className="text-muted-foreground">
                <FormattedMessage
                  defaultMessage="Your pro trial has ended. You're on the free plan now with {total} words per day. Upgrade whenever you're ready."
                  values={{ total: freeWordsPerDay.toLocaleString() }}
                />
              </p>
              {totalTimeSaved > 4 && (
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    <FormattedMessage
                      defaultMessage="{words} words dictated"
                      values={{ words: wordsTotal.toLocaleString() }}
                    />
                  </Badge>
                  <Badge variant="secondary">
                    <FormattedMessage
                      defaultMessage="{hours} hours saved"
                      values={{
                        hours: Math.round(totalTimeSaved / 60).toLocaleString(),
                      }}
                    />
                  </Badge>
                </div>
              )}
            </div>

            <div className="w-full p-5 rounded-xl bg-card border border-border">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-baseline">
                  <p className="text-sm text-muted-foreground">
                    <FormattedMessage defaultMessage="Free plan daily limit" />
                  </p>
                  <p className="font-semibold">
                    <FormattedMessage
                      defaultMessage="{remaining} / {total} words"
                      values={{
                        remaining: wordsRemaining.toLocaleString(),
                        total: freeWordsPerDay.toLocaleString(),
                      }}
                    />
                  </p>
                </div>
                <Progress
                  value={usagePercent}
                  className="h-2"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <Button
                variant="blue"
                size="lg"
                className="w-full"
                onClick={handleUpgrade}
              >
                <FormattedMessage defaultMessage="Reclaim my super powers" />
                <RiArrowRightLine className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={handleDismiss}
              >
                <FormattedMessage defaultMessage="Continue with free" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
