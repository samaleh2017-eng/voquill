import { RiArrowRightLine } from "@remixicon/react";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { showErrorSnackbar } from "../../actions/app.actions";
import { goToOnboardingPage } from "../../actions/onboarding.actions";
import { getHotkeyRepo } from "../../repos";
import { produceAppState, useAppStore } from "../../store";
import { trackButtonClick } from "../../utils/analytics.utils";
import { registerHotkeys } from "../../utils/app.utils";
import { createId } from "../../utils/id.utils";
import {
  DICTATE_HOTKEY,
  getDefaultHotkeyCombosForAction,
  syncHotkeyCombosToNative,
} from "../../utils/keyboard.utils";
import { HotkeyBadge } from "../common/HotkeyBadge";
import { KeyPressSimulator } from "../common/KeyPressSimulator";
import { Button } from "@/components/ui/button";
import {
  BackButton,
  DualPaneLayout,
  OnboardingFormLayout,
} from "./OnboardingCommon";

export const KeybindingsForm = () => {
  const [isListening, setIsListening] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const keysHeld = useAppStore((s) => s.keysHeld);
  const hotkeys = useAppStore((state) =>
    state.settings.hotkeyIds
      .map((id) => state.hotkeyById[id])
      .filter((hotkey) => hotkey?.actionName === DICTATE_HOTKEY),
  );

  const defaultCombos = getDefaultHotkeyCombosForAction(DICTATE_HOTKEY);
  const [primaryHotkey] = hotkeys;
  const currentKeys =
    primaryHotkey?.keys ?? (defaultCombos.length > 0 ? defaultCombos[0] : []);

  const lastEmittedRef = useRef<string[]>(currentKeys);
  const previousKeysHeldRef = useRef<string[]>([]);

  useEffect(() => {
    produceAppState((draft) => {
      draft.isRecordingHotkey = isListening;
    });
  }, [isListening]);

  useEffect(() => {
    if (!isListening) {
      previousKeysHeldRef.current = [];
      return;
    }

    const seen = new Set<string>();
    const held = keysHeld.filter((k: string) => {
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    const previousHeld = previousKeysHeldRef.current;
    if (previousHeld.length > 0 && held.length < previousHeld.length) {
      setIsListening(false);
      previousKeysHeldRef.current = [];
      return;
    }

    previousKeysHeldRef.current = held;

    if (held.length === 0) return;

    if (held.length === 1 && held[0] === "Escape") {
      setIsListening(false);
      return;
    }

    const last = lastEmittedRef.current ?? [];
    const lastSet = new Set(last);
    const anyNewKey = held.some((k) => !lastSet.has(k));
    if (held.length > last.length || anyNewKey) {
      lastEmittedRef.current = held;
      void saveKey(held);
    }
  }, [keysHeld, isListening]);

  const saveKey = async (keys: string[]) => {
    const newValue = {
      id: primaryHotkey?.id ?? createId(),
      actionName: DICTATE_HOTKEY,
      keys,
    };

    try {
      produceAppState((draft) => {
        registerHotkeys(draft, [newValue]);
        if (!draft.settings.hotkeyIds.includes(newValue.id)) {
          draft.settings.hotkeyIds.push(newValue.id);
        }
        draft.settings.hotkeysStatus = "success";
      });
      await getHotkeyRepo().saveHotkey(newValue);
      await syncHotkeyCombosToNative();
    } catch (error) {
      console.error("Failed to save hotkey", error);
      showErrorSnackbar("Failed to save hotkey. Please try again.");
    }
  };

  const handleChangeShortcut = () => {
    trackButtonClick("onboarding_change_hotkey");
    lastEmittedRef.current = [];
    setIsListening(true);
    setTimeout(() => {
      boxRef.current?.focus();
    }, 0);
  };

  const handleConfirm = () => {
    trackButtonClick("onboarding_hotkey_works");
    goToOnboardingPage("micCheck");
  };

  const form = (
    <OnboardingFormLayout back={<BackButton />} actions={<div />}>
      <div className="space-y-4 pb-8">
        <h2 className="text-2xl font-semibold">
          <FormattedMessage defaultMessage="Test your keyboard shortcut" />
        </h2>
        <p className="text-base text-muted-foreground">
          <FormattedMessage
            defaultMessage="The {recommendedKey} key works great for most users."
            values={{
              recommendedKey: (
                <HotkeyBadge keys={defaultCombos[0] ?? []} />
              ),
            }}
          />
        </p>
      </div>
    </OnboardingFormLayout>
  );

  const handleBlur = (e: React.FocusEvent) => {
    if (boxRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsListening(false);
  };

  const rightContent = (
    <div
      ref={boxRef}
      tabIndex={0}
      onBlur={handleBlur}
      className="flex max-w-[400px] flex-col gap-6 rounded-lg bg-muted p-8 outline-none"
    >
      <h3 className="text-base font-semibold">
        {isListening ? (
          <FormattedMessage defaultMessage="Press your hotkey combo, then release" />
        ) : (
          <FormattedMessage defaultMessage="Does the key light up green when pressed?" />
        )}
      </h3>

      <div
        className={`flex min-h-[80px] items-center justify-center rounded-lg border-2 bg-background p-6 ${
          isListening
            ? "animate-pulse border-primary"
            : "border-transparent"
        }`}
      >
        {isListening ? (
          keysHeld.length > 0 ? (
            <KeyPressSimulator keys={keysHeld} />
          ) : (
            <div className="flex h-12 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                <FormattedMessage defaultMessage="Press your new key combo..." />
              </p>
            </div>
          )
        ) : (
          <KeyPressSimulator keys={currentKeys} />
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={handleChangeShortcut}
          disabled={isListening}
        >
          <FormattedMessage defaultMessage="Change hotkey" />
        </Button>
        <Button onClick={handleConfirm} disabled={isListening}>
          <FormattedMessage defaultMessage="It works" />
          <RiArrowRightLine className="size-4" />
        </Button>
      </div>
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
