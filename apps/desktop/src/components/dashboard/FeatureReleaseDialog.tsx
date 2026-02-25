import { RiArrowRightLine, RiSparklingLine } from "@remixicon/react";
import { ChangeEvent, Fragment, useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { showConfetti } from "../../actions/app.actions";
import {
  markFeatureSeen,
  setPreferredAgentMode,
} from "../../actions/user.actions";
import { useAppStore } from "../../store";
import { CURRENT_FEATURE } from "../../utils/feature.utils";
import {
  AGENT_DICTATE_HOTKEY,
  getHotkeyCombosForAction,
} from "../../utils/keyboard.utils";
import { getEffectivePlan } from "../../utils/member.utils";
import { getMyUserPreferences } from "../../utils/user.utils";
import { HotkeyBadge } from "../common/HotkeyBadge";
import { AIAgentModeConfiguration } from "../settings/AIAgentModeConfiguration";
import { HotkeySetting } from "../settings/HotkeySetting";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";

const IntroPage = () => {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-4">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center shadow-[0_8px_32px_rgba(59,130,246,0.4)]">
        <RiSparklingLine className="h-10 w-10 text-white" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">
            <FormattedMessage defaultMessage="Introducing Agent Mode" />
          </h2>
          <Badge>Beta</Badge>
        </div>
        <p className="text-muted-foreground">
          <FormattedMessage defaultMessage="A powerful new way to interact with your text" />
        </p>
      </div>
      <div className="flex flex-col gap-4 text-left max-w-[480px]">
        <p className="text-sm text-muted-foreground">
          <FormattedMessage defaultMessage="Agent Mode lets you give voice commands to write, edit, or transform text. Instead of just dictating, you can now tell the AI what you want it to do." />
        </p>
        <p className="text-sm text-muted-foreground">
          <FormattedMessage defaultMessage="Try commands like 'Write an email to Bob about the meeting' or 'Make this paragraph more formal'. Agent Mode reads what's in your text field and rewrites it based on your instructions." />
        </p>
        <p className="text-sm text-muted-foreground">
          <FormattedMessage defaultMessage="Run it multiple times to refine your text until it's perfect." />
        </p>
      </div>
    </div>
  );
};

const HotkeyPage = () => {
  return (
    <div className="flex flex-col gap-6 py-8 px-4">
      <div className="flex flex-col gap-2 text-center">
        <h2 className="text-xl font-semibold">
          <FormattedMessage defaultMessage="Set Your Shortcut" />
        </h2>
        <p className="text-sm text-muted-foreground">
          <FormattedMessage defaultMessage="Choose the keyboard shortcut you'll use to activate Agent Mode" />
        </p>
      </div>
      <div className="pt-4">
        <HotkeySetting
          title={<FormattedMessage defaultMessage="Agent Mode shortcut" />}
          description={
            <FormattedMessage defaultMessage="Press this shortcut to start and stop Agent Mode anywhere on your computer." />
          }
          actionName={AGENT_DICTATE_HOTKEY}
          buttonSize="medium"
        />
      </div>
    </div>
  );
};

const TryItPage = () => {
  const intl = useIntl();
  const [value, setValue] = useState("");
  const combos = useAppStore((state) =>
    getHotkeyCombosForAction(state, AGENT_DICTATE_HOTKEY),
  );

  const handleChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setValue(event.target.value);
  };

  const hotkeys = (
    <>
      {combos.map((combo, index) => {
        const key = combo.join("|");
        const isLast = index === combos.length - 1;
        const separator = (() => {
          if (isLast) {
            return "";
          }
          if (combos.length === 2) {
            return " or ";
          }
          if (index === combos.length - 2) {
            return ", or ";
          }
          return ", ";
        })();

        return (
          <Fragment key={key}>
            <HotkeyBadge keys={combo} className="mx-0.5" />
            {separator}
          </Fragment>
        );
      })}
    </>
  );

  return (
    <div className="flex flex-col gap-6 py-8 px-4">
      <div className="flex flex-col gap-2 text-center">
        <h2 className="text-xl font-semibold">
          <FormattedMessage defaultMessage="Give It a Try!" />
        </h2>
        <p className="text-sm text-muted-foreground">
          <FormattedMessage defaultMessage="Test out Agent Mode right now" />
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        <FormattedMessage
          defaultMessage="Press {hotkeys} and say something like 'Write an email to Bob about his shoes'."
          values={{ hotkeys }}
        />
      </p>
      <Textarea
        autoFocus
        rows={4}
        placeholder={intl.formatMessage({
          defaultMessage:
            'Try saying "Write an email to Bob about his shoes" or "Make this more casual"',
        })}
        value={value}
        onChange={handleChange}
      />
      <p className="text-sm text-muted-foreground italic">
        <FormattedMessage defaultMessage="Tip: Run Agent Mode multiple times to keep refining! It remembers what's in the text box." />
      </p>
    </div>
  );
};

const ProcessorPage = () => {
  return (
    <div className="flex flex-col gap-6 py-8 px-4">
      <div className="flex flex-col gap-2 text-center">
        <h2 className="text-xl font-semibold">
          <FormattedMessage defaultMessage="Choose Your Processor" />
        </h2>
        <p className="text-sm text-muted-foreground">
          <FormattedMessage defaultMessage="Select which AI provider to use for Agent Mode" />
        </p>
      </div>
      <div className="pt-4">
        <AIAgentModeConfiguration hideCloudOption />
      </div>
      <p className="text-sm text-muted-foreground italic">
        <FormattedMessage defaultMessage="Tip: Choose a stronger model for better results. Smaller or weaker models may produce lower quality output." />
      </p>
    </div>
  );
};

export const FeatureReleaseDialog = () => {
  const lastSeenFeature = useAppStore(
    (state) => getMyUserPreferences(state)?.lastSeenFeature,
  );
  const myUserPrefs = useAppStore((state) => state.userPrefs);
  console.log("User prefs in FeatureReleaseDialog:", myUserPrefs);
  const isCommunity = useAppStore(
    (state) => getEffectivePlan(state) === "community",
  );
  const hasConfettiFired = useRef(false);
  const [pageIndex, setPageIndex] = useState(0);

  const pageCount = isCommunity ? 4 : 3;
  const open = lastSeenFeature !== CURRENT_FEATURE;

  useEffect(() => {
    if (open && !hasConfettiFired.current) {
      hasConfettiFired.current = true;
      showConfetti();
    }
  }, [open]);

  useEffect(() => {
    if (open && !isCommunity) {
      void setPreferredAgentMode("cloud");
    }
  }, [open, isCommunity]);

  const handleDismiss = async () => {
    await markFeatureSeen(CURRENT_FEATURE);
  };

  const handleNext = () => {
    setPageIndex((prev) => Math.min(pageCount - 1, prev + 1));
  };

  const handleBack = () => {
    setPageIndex((prev) => Math.max(0, prev - 1));
  };

  const canBack = pageIndex > 0;
  const isLastPage = pageIndex === pageCount - 1;

  const getPageContent = () => {
    if (pageIndex === 0) return <IntroPage />;
    if (isCommunity) {
      if (pageIndex === 1) return <ProcessorPage />;
      if (pageIndex === 2) return <HotkeyPage />;
      if (pageIndex === 3) return <TryItPage />;
    } else {
      if (pageIndex === 1) return <HotkeyPage />;
      if (pageIndex === 2) return <TryItPage />;
    }
    return null;
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md [&>button]:hidden" onInteractOutside={(e) => e.preventDefault()}>
        <div className="px-2 py-1">{getPageContent()}</div>
        <DialogFooter className="flex-row justify-between sm:justify-between">
          {canBack ? (
            <Button variant="ghost" onClick={handleBack}>
              <FormattedMessage defaultMessage="Back" />
            </Button>
          ) : (
            <div />
          )}
          {isLastPage ? (
            <Button onClick={handleDismiss}>
              <FormattedMessage defaultMessage="Got it!" />
            </Button>
          ) : (
            <Button onClick={handleNext}>
              <FormattedMessage defaultMessage="Next" />
              <RiArrowRightLine className="ml-2 h-4 w-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
