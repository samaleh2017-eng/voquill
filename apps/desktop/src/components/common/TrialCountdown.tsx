import { RiHourglassLine } from "@remixicon/react";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { openUpgradePlanDialog } from "../../actions/pricing.actions";
import { useInterval } from "../../hooks/helper.hooks";
import { useAppStore } from "../../store";
import { trackButtonClick } from "../../utils/analytics.utils";
import {
  getTrialDaysRemaining,
  getTrialProgress,
} from "../../utils/member.utils";
import { minutesToMilliseconds } from "../../utils/time.utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const TrialCountdown = () => {
  const daysRemaining = useAppStore(getTrialDaysRemaining);
  const progress = useAppStore(getTrialProgress);
  const [, setTick] = useState(0);

  useInterval(
    minutesToMilliseconds(5),
    () => {
      setTick((tick) => tick + 1);
    },
    [],
  );

  const handleClick = () => {
    openUpgradePlanDialog();
    trackButtonClick("trial_countdown_subscribe_click", {
      daysLeft: daysRemaining,
    });
  };

  if (daysRemaining == null || progress == null) {
    return null;
  }

  const urgent = daysRemaining <= 0;
  const warning = daysRemaining <= 3;

  return (
    <div
      onClick={handleClick}
      className={`flex cursor-pointer items-center gap-3 rounded-lg border py-1.5 pl-3 pr-2 transition-colors ${
        urgent
          ? "border-destructive hover:border-destructive/80"
          : warning
            ? "border-yellow-500 hover:border-yellow-600"
            : "border-border hover:border-primary"
      }`}
    >
      <RiHourglassLine
        className={`size-4 ${
          urgent
            ? "text-destructive"
            : warning
              ? "text-yellow-500"
              : "text-muted-foreground"
        }`}
      />
      <div className="min-w-[80px]">
        <span
          className={`block text-xs font-semibold leading-tight ${
            urgent
              ? "text-destructive"
              : warning
                ? "text-yellow-500"
                : "text-foreground"
          }`}
        >
          {daysRemaining === 0 ? (
            <FormattedMessage defaultMessage="Last day" />
          ) : daysRemaining === 1 ? (
            <FormattedMessage defaultMessage="1 day left" />
          ) : (
            <FormattedMessage
              defaultMessage="{days} days left"
              values={{ days: daysRemaining }}
            />
          )}
        </span>
        <div className="mt-1">
          <Progress
            value={progress * 100}
            className={`h-1 ${
              urgent
                ? "[&>[data-slot=progress-indicator]]:bg-destructive"
                : warning
                  ? "[&>[data-slot=progress-indicator]]:bg-yellow-500"
                  : ""
            }`}
          />
        </div>
      </div>
      <Button variant="blue" size="xs" className="ml-1">
        <FormattedMessage defaultMessage="Upgrade" />
      </Button>
    </div>
  );
};
