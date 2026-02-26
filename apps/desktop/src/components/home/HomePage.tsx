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

function StatBadge({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border rounded-full text-sm cursor-default hover:shadow-sm transition-shadow">
      {icon}
      <span className="text-foreground font-medium">{label}</span>
    </div>
  );
}

export default function HomePage() {
  const user = useAppStore(getMyUser);
  const userName = useAppStore(getMyUserName);
  const streak = useAppStore(getEffectiveStreak);
  const intl = useIntl();

  const dictationSpeed = useAppStore(getDictationSpeed);
  const wordsThisMonth = user?.wordsThisMonth ?? 0;
  const navigate = useNavigate();

  const recentIds = useAppStore(
    (state) => state.transcriptions.transcriptionIds,
  );
  const topIds = useMemo(() => recentIds.slice(0, 2), [recentIds]);

  return (
    <DashboardEntryLayout>
      <HomeSideEffects />
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-foreground">
            <FormattedMessage
              defaultMessage="Welcome back, {name}"
              values={{ name: userName }}
            />
          </h1>
          <div className="flex items-center gap-3">
            <StatBadge
              icon={<RiFireFill className="size-4 text-orange-500" />}
              label={`${streak} ${intl.formatMessage({ defaultMessage: "days" })}`}
            />
            <StatBadge
              icon={<span>✍️</span>}
              label={`${wordsThisMonth.toLocaleString()} ${intl.formatMessage({ defaultMessage: "words" })}`}
            />
            {dictationSpeed != null && (
              <StatBadge
                icon={<span>⚡</span>}
                label={`${dictationSpeed.wpm} WPM`}
              />
            )}
          </div>
        </div>

        <div className="bg-background rounded-xl border border-border shadow-[var(--shadow-card)] p-5 mb-8 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-foreground mb-1">
              <FormattedMessage defaultMessage="Voice dictation in any app" />
            </div>
            <DictationInstruction />
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/transcriptions")}>
            <FormattedMessage defaultMessage="View history" />
          </Button>
        </div>

        <GettingStartedList />

        <div>
          <div className="mb-4">
            <div className="text-xs font-semibold tracking-[1.5px] text-muted-foreground uppercase mb-3">
              <FormattedMessage defaultMessage="Recent Activity" />
            </div>
          </div>
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
