import {
  RiArrowRightLine,
  RiCheckLine,
  RiMailLine,
  RiCursorLine,
} from "@remixicon/react";
import { motion } from "framer-motion";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { showConfetti, showErrorSnackbar } from "../../actions/app.actions";
import { clearLocalStorageValue } from "../../actions/local-storage.actions";
import {
  finishOnboarding,
  submitOnboarding,
} from "../../actions/onboarding.actions";
import { setSelectedToneId } from "../../actions/user.actions";
import discordIcon from "../../assets/discord.svg";
import { produceAppState, useAppStore } from "../../store";
import { trackButtonClick } from "../../utils/analytics.utils";
import {
  DICTATE_HOTKEY,
  getHotkeyCombosForAction,
} from "../../utils/keyboard.utils";
import { flashPillTooltip } from "../../utils/overlay.utils";
import { CHAT_TONE_ID, EMAIL_TONE_ID } from "../../utils/tone.utils";
import { getMyUser } from "../../utils/user.utils";
import { DictationInstruction } from "../common/DictationInstruction";
import { HotkeyBadge } from "../common/HotkeyBadge";
import { Button } from "@/components/ui/button";
import { BouncyTooltip } from "./BouncyTooltip";
import {
  BackButton,
  DualPaneLayout,
  OnboardingFormLayout,
} from "./OnboardingCommon";

const PAGE_COUNT = 2;

export const TutorialForm = () => {
  const intl = useIntl();
  const [stepIndex, setStepIndex] = useState(0);
  const [dictationValue, setDictationValue] = useState("");
  const [initializing, setInitializing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isFieldFocused, setIsFieldFocused] = useState(false);
  const [hasStartedDictating, setHasStartedDictating] = useState(false);
  const userExists = useAppStore((state) => Boolean(getMyUser(state)));
  const submittedRef = useRef(false);
  const submissionCompleteRef = useRef(false);

  const hotkeyCombos = useAppStore((state) =>
    getHotkeyCombosForAction(state, DICTATE_HOTKEY),
  );
  const primaryHotkey = hotkeyCombos[0] ?? [];
  const keysHeld = useAppStore((state) => state.keysHeld);
  const userName = useAppStore((state) => state.onboarding.name) || "Alex";

  useEffect(() => {
    if (primaryHotkey.length === 0) return;
    const hotkeySet = new Set(primaryHotkey);
    const allHotkeyKeysHeld = primaryHotkey.every((key) =>
      keysHeld.includes(key),
    );
    if (
      allHotkeyKeysHeld &&
      keysHeld.length >= hotkeySet.size &&
      isFieldFocused
    ) {
      setHasStartedDictating(true);
    }
  }, [keysHeld, primaryHotkey]);

  const setChatTone = async (toneId: string, force = false): Promise<void> => {
    if (!userExists && !force) {
      return;
    }

    await setSelectedToneId(toneId);
    flashPillTooltip();
  };

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        if (!submittedRef.current) {
          submittedRef.current = true;
          await submitOnboarding();
          submissionCompleteRef.current = true;
        }

        if (cancelled) {
          return;
        }

        produceAppState((draft) => {
          draft.onboarding.dictationOverrideEnabled = true;
        });
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    };

    init();
    return () => {
      cancelled = true;
      setChatTone(CHAT_TONE_ID, submissionCompleteRef.current).then(() => {
        clearLocalStorageValue("voquill:checklist-writing-style");
      });
      produceAppState((draft) => {
        draft.onboarding.dictationOverrideEnabled = false;
      });
    };
  }, []);

  const isLastStep = stepIndex === PAGE_COUNT - 1;
  const canContinue = dictationValue.trim().length > 0;

  const handleDictationChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setDictationValue(event.target.value);
  };

  const handleContinue = async () => {
    if (!isLastStep) {
      trackButtonClick("onboarding_tutorial_continue");
      setStepIndex(stepIndex + 1);
      setDictationValue("");
    } else {
      trackButtonClick("onboarding_tutorial_finish");
      await handleFinish();
    }
  };

  const handleSkip = async () => {
    trackButtonClick("onboarding_tutorial_skip");
    await handleFinish();
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      await finishOnboarding();
      showConfetti();
    } catch (err) {
      showErrorSnackbar(err);
      setSubmitting(false);
    }
  };

  const step1Placeholder = intl.formatMessage({
    defaultMessage: "Bagels are the breakfast of champions.",
  });

  const step2Placeholder = `Hey Bob,

Great meeting you yesterday! Looking forward to next steps.

Best,
${userName}`;

  useEffect(() => {
    if (!userExists) {
      return;
    }

    if (stepIndex === 0) {
      setChatTone(CHAT_TONE_ID);
    } else if (stepIndex === 1) {
      setChatTone(EMAIL_TONE_ID);
    }
  }, [stepIndex, userExists]);

  const form = (
    <OnboardingFormLayout
      back={<BackButton />}
      actions={
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => void handleSkip()}
            disabled={submitting}
          >
            <FormattedMessage defaultMessage="Skip" />
          </Button>
          <Button
            onClick={() => void handleContinue()}
            disabled={!canContinue || submitting}
          >
            {isLastStep ? (
              <FormattedMessage defaultMessage="Finish" />
            ) : (
              <FormattedMessage defaultMessage="Continue" />
            )}
            {isLastStep ? (
              <RiCheckLine className="size-4" />
            ) : (
              <RiArrowRightLine className="size-4" />
            )}
          </Button>
        </div>
      }
    >
      {stepIndex === 0 && (
        <div className="space-y-4 pb-8">
          <h2 className="text-2xl font-semibold">
            <FormattedMessage defaultMessage="Try out dictation" />
          </h2>
          <p className="text-base text-muted-foreground">
            <FormattedMessage defaultMessage="Press and hold your hotkey, then start talking. When you release the key, your speech will be converted to text." />
          </p>
          <DictationInstruction />
        </div>
      )}
      {stepIndex === 1 && (
        <div className="space-y-4 pb-8">
          <h2 className="text-2xl font-semibold">
            <FormattedMessage defaultMessage="Now try an email" />
          </h2>
          <p className="text-base text-muted-foreground">
            <FormattedMessage defaultMessage="Dictate a short email. Voquill works great for longer-form content like messages, notes, and documents." />
          </p>
          <DictationInstruction />
        </div>
      )}
    </OnboardingFormLayout>
  );

  const bouncyTooltips = (
    <>
      <BouncyTooltip
        visible={!isFieldFocused && !hasStartedDictating}
        delay={0.7}
      >
        <RiCursorLine className="size-4" />
        <span className="text-sm font-medium">
          <FormattedMessage defaultMessage="Click on the text field" />
        </span>
      </BouncyTooltip>
      <BouncyTooltip
        visible={isFieldFocused && !hasStartedDictating}
        delay={0.7}
      >
        <span className="text-sm font-medium">
          <FormattedMessage defaultMessage="Now press and hold" />
        </span>
        <HotkeyBadge
          keys={primaryHotkey}
          sx={{
            bgcolor: "rgba(255,255,255,0.2)",
            borderColor: "rgba(255,255,255,0.3)",
            color: "primary.contrastText",
          }}
        />
        <span className="text-sm font-medium">
          <FormattedMessage defaultMessage="to dictate" />
        </span>
      </BouncyTooltip>
    </>
  );

  const discordContent = (
    <div className="relative pb-6">
      <div className="overflow-hidden rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.3)]" style={{ backgroundColor: "#313338" }}>
        <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: "#1e1f22" }}>
          <img
            src={discordIcon}
            alt="Discord"
            width={20}
            height={20}
            style={{ filter: "brightness(0) invert(1)" }}
          />
          <span className="text-sm font-semibold" style={{ color: "#f2f3f5" }}>
            Discord
          </span>
        </div>
        <div className="p-4">
          <div className="mb-4 flex gap-3">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: "#5865F2" }}
            >
              <span className="font-semibold text-white">J</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold" style={{ color: "#f2f3f5" }}>
                  Jordan
                </span>
                <span className="text-xs" style={{ color: "#949ba4" }}>
                  Today at 10:32 AM
                </span>
              </div>
              <p className="mt-1 text-sm" style={{ color: "#dbdee1" }}>
                What&apos;s your favorite breakfast?
              </p>
            </div>
          </div>
          <textarea
            rows={2}
            placeholder={step1Placeholder}
            value={dictationValue}
            onChange={handleDictationChange}
            disabled={submitting}
            onFocus={() => setIsFieldFocused(true)}
            onBlur={() => setIsFieldFocused(false)}
            className="w-full resize-none rounded-md border-2 px-3 py-2 text-sm outline-none transition-colors placeholder:text-[#949ba4] placeholder:opacity-100"
            style={{
              backgroundColor: "#383a40",
              color: "#dbdee1",
              borderColor: isFieldFocused ? "#5865F2" : "rgba(88, 101, 242, 0.4)",
              animation: !isFieldFocused
                ? "pulse-discord 1.5s ease-in-out infinite"
                : undefined,
            }}
          />
        </div>
      </div>
      {bouncyTooltips}
    </div>
  );

  const emailContent = (
    <div className="relative pb-6">
      <div className="overflow-hidden rounded-lg bg-white shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
        <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-100 px-4 py-3">
          <RiMailLine className="size-5" style={{ color: "#d93025" }} />
          <span className="text-sm font-semibold" style={{ color: "#202124" }}>
            Email
          </span>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <div className="flex items-center gap-1 border-b border-gray-200 pb-2 mb-2">
              <span className="text-xs" style={{ color: "#5f6368" }}>To:</span>
              <span className="text-sm" style={{ color: "#202124" }}>
                sarah@company.com
              </span>
            </div>
            <div className="flex items-center gap-1 border-b border-gray-200 pb-2">
              <span className="text-xs" style={{ color: "#5f6368" }}>Subject:</span>
              <span className="text-sm" style={{ color: "#202124" }}>
                Great chatting yesterday! 🎉
              </span>
            </div>
          </div>
          <div className="relative">
            <textarea
              rows={8}
              autoFocus={true}
              value={dictationValue}
              onChange={handleDictationChange}
              disabled={submitting}
              onFocus={() => setIsFieldFocused(true)}
              onBlur={() => setIsFieldFocused(false)}
              className="w-full resize-none rounded-md border-2 bg-white px-3 py-2 text-sm outline-none transition-colors"
              style={{
                color: "#202124",
                borderColor: isFieldFocused ? "#1a73e8" : "rgba(26, 115, 232, 0.4)",
                animation: !isFieldFocused
                  ? "pulse-email 1.5s ease-in-out infinite"
                  : undefined,
              }}
            />
            {dictationValue.length === 0 && (
              <p
                className="pointer-events-none absolute left-3.5 right-3.5 top-[9px] whitespace-pre-wrap text-sm"
                style={{ color: "#5f6368" }}
              >
                {step2Placeholder}
              </p>
            )}
          </div>
        </div>
      </div>
      {bouncyTooltips}
    </div>
  );

  const stepper = (
    <div className="mt-3 flex justify-center gap-2">
      {[0, 1].map((index) => (
        <button
          key={index}
          onClick={() => {
            setStepIndex(index);
            setDictationValue("");
            setHasStartedDictating(false);
          }}
          className={`size-2 rounded-full transition-colors ${
            stepIndex === index
              ? "bg-primary"
              : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
          }`}
        />
      ))}
    </div>
  );

  const rightContent = (
    <div className="flex w-full max-w-[400px] flex-col items-stretch">
      {!initializing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {stepIndex === 0 ? discordContent : emailContent}
          {stepper}
        </motion.div>
      )}
    </div>
  );

  return (
    <DualPaneLayout
      flex={[2, 3]}
      left={form}
      right={rightContent}
      rightClassName="bg-transparent"
    />
  );
};
