import { RiFireFill } from "@remixicon/react";
import { Fragment, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../store";
import {
  getDictationSpeed,
  getEffectiveStreak,
  getMyUser,
  getMyUserName,
} from "../../utils/user.utils";
import {
  DICTATE_HOTKEY,
  getHotkeyCombosForAction,
} from "../../utils/keyboard.utils";
import { HotkeyBadgeInline } from "@/components/ui/hotkey-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { DashboardEntryLayout } from "../dashboard/DashboardEntryLayout";
import { TranscriptionRow } from "../transcriptions/TranscriptRow";
import { GettingStartedList } from "./GettingStartedList";
import { HomeSideEffects } from "./HomeSideEffects";

function DictationInstruction() {
  const combos = useAppStore((state) =>
    getHotkeyCombosForAction(state, DICTATE_HOTKEY),
  );

  if (combos.length === 0) return null;

  const hotkeys = (
    <>
      {combos.map((combo, index) => {
        const key = combo.join("|");
        const isLast = index === combos.length - 1;
        const separator = (() => {
          if (isLast) return "";
          if (combos.length === 2) return " or ";
          if (index === combos.length - 2) return ", or ";
          return ", ";
        })();

        return (
          <Fragment key={key}>
            <HotkeyBadgeInline keys={combo} className="mx-0.5" />
            {separator}
          </Fragment>
        );
      })}
    </>
  );

  return (
    <p className="text-sm text-muted-foreground">
      {combos.length === 1 ? (
        <FormattedMessage
          defaultMessage="Press {hotkeys} to dictate anywhere."
          values={{ hotkeys }}
        />
      ) : (
        <FormattedMessage
          defaultMessage="Press one of {hotkeys} to dictate anywhere."
          values={{ hotkeys }}
        />
      )}
    </p>
  );
}

function StatCard({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="flex-1">
      <CardContent className="px-4 py-3">
        <div className="mb-0.5 flex items-center gap-2">
          {icon}
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const user = useAppStore(getMyUser);
  const userName = useAppStore(getMyUserName);
  const streak = useAppStore(getEffectiveStreak);
  const intl = useIntl();

  const dictationSpeed = useAppStore(getDictationSpeed);
  const wordsThisMonth = user?.wordsThisMonth ?? 0;
  const wordsTotal = user?.wordsTotal ?? 0;
  const navigate = useNavigate();

  const recentIds = useAppStore(
    (state) => state.transcriptions.transcriptionIds,
  );
  const topIds = useMemo(() => recentIds.slice(0, 2), [recentIds]);

  return (
    <DashboardEntryLayout>
      <HomeSideEffects />
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground">
            <FormattedMessage
              defaultMessage="Welcome back, {name}"
              values={{ name: userName }}
            />
          </h1>
          <DictationInstruction />
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              value={streak.toString()}
              label={intl.formatMessage({ defaultMessage: "Day streak" })}
              icon={<RiFireFill className="size-5 text-orange-500" />}
            />
            <StatCard
              value={wordsThisMonth.toLocaleString()}
              label={intl.formatMessage({ defaultMessage: "Words this month" })}
            />
            <StatCard
              value={wordsTotal.toLocaleString()}
              label={intl.formatMessage({ defaultMessage: "Words total" })}
            />
          </div>

          {dictationSpeed != null && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="cursor-default">
                    <CardContent className="px-4 py-3">
                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-bold tracking-tight text-foreground">
                          <FormattedMessage
                            defaultMessage="{wpm} WPM"
                            values={{ wpm: dictationSpeed.wpm }}
                          />
                        </span>
                        <span className="text-xs text-muted-foreground">
                          <FormattedMessage
                            defaultMessage="{multiplier}x faster than typing"
                            values={{
                              multiplier: (dictationSpeed.wpm / 40).toFixed(1),
                            }}
                          />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <FormattedMessage
                    defaultMessage="Average words per minute across your last {count, plural, one {# dictation} other {# dictations}}. Compared against a median typing speed of 40 WPM."
                    values={{ count: dictationSpeed.sampleCount }}
                  />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <GettingStartedList />

        <div>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            <FormattedMessage defaultMessage="Recent transcriptions" />
          </h2>
          {topIds.length > 0 ? (
            <>
              {topIds.map((id) => (
                <TranscriptionRow key={id} id={id} />
              ))}
              <div className="mt-3 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/dashboard/transcriptions")}
                  className="text-muted-foreground"
                >
                  <FormattedMessage defaultMessage="View all" />
                </Button>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              <FormattedMessage defaultMessage="No transcriptions yet." />
            </p>
          )}
        </div>
      </div>
    </DashboardEntryLayout>
  );
}
