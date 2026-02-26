import { RiArrowRightLine, RiCheckLine } from "@remixicon/react";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import {
  goToOnboardingPage,
  setOnboardingPreferredMicrophone,
} from "../../actions/onboarding.actions";
import { setAllModesToCloud } from "../../actions/user.actions";
import { produceAppState, useAppStore } from "../../store";
import { trackButtonClick } from "../../utils/analytics.utils";
import { AudioWaveform } from "../common/AudioWaveform";
import { MicrophoneSelector } from "../microphone/MicrophoneSelector";
import { Button } from "@/components/ui/button";
import {
  BackButton,
  DualPaneLayout,
  OnboardingFormLayout,
} from "./OnboardingCommon";

export const MicCheckForm = () => {
  const isEnterprise = useAppStore((state) => state.isEnterprise);

  const [recordingState, setRecordingState] = useState<
    "idle" | "starting" | "recording" | "stopping"
  >("idle");
  const [showMicSelector, setShowMicSelector] = useState(false);
  const preferredMicrophone = useAppStore(
    (state) => state.onboarding.preferredMicrophone,
  );

  const audioLevels = useAppStore((state) => state.audioLevels);
  const overlayPhase = useAppStore((state) => state.overlayPhase);
  const didSignUpWithAccount = useAppStore(
    (state) => state.onboarding.didSignUpWithAccount,
  );

  const isGlobalRecording =
    overlayPhase === "recording" || overlayPhase === "loading";
  const isRecording = recordingState === "recording";
  const isStarting = recordingState === "starting";

  const startRecording = useCallback(async () => {
    if (isGlobalRecording || recordingState !== "idle") {
      return;
    }

    setRecordingState("starting");

    try {
      await invoke<void>("start_recording", {
        args: { preferredMicrophone },
      });
      setRecordingState("recording");
    } catch (error) {
      console.error("Failed to start recording", error);
      setRecordingState("idle");
    }
  }, [isGlobalRecording, recordingState, preferredMicrophone]);

  const stopRecording = useCallback(async () => {
    if (recordingState !== "recording" && recordingState !== "starting") {
      return;
    }

    setRecordingState("stopping");

    try {
      await invoke("stop_recording");
    } catch (error) {
      console.error("Failed to stop recording", error);
    } finally {
      setRecordingState("idle");
      produceAppState((draft) => {
        draft.audioLevels = [];
      });
    }
  }, [recordingState]);

  const stopRecordingRef = useRef(stopRecording);
  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  useEffect(() => {
    if (!showMicSelector) {
      void startRecording();
    }

    return () => {
      void stopRecordingRef.current();
    };
  }, [showMicSelector, preferredMicrophone]);

  useEffect(() => {
    if (isGlobalRecording && (isRecording || isStarting)) {
      void stopRecording();
    }
  }, [isGlobalRecording, isRecording, isStarting, stopRecording]);

  const handleChangeMicrophone = async () => {
    trackButtonClick("onboarding_try_another_mic");
    await stopRecording();
    setShowMicSelector(true);
  };

  const handleMicSelected = () => {
    trackButtonClick("onboarding_use_this_mic");
    setShowMicSelector(false);
  };

  const handleConfirm = async () => {
    trackButtonClick("onboarding_mic_looks_good");
    await stopRecording();
    if (didSignUpWithAccount) {
      if (isEnterprise) {
        await setAllModesToCloud();
        goToOnboardingPage("tutorial");
      } else {
        goToOnboardingPage("unlockedPro");
      }
    } else {
      goToOnboardingPage("tutorial");
    }
  };

  const form = (
    <OnboardingFormLayout back={<BackButton />} actions={<div />}>
      <div className="space-y-4 pb-8">
        <h2 className="text-2xl font-semibold">
          <FormattedMessage defaultMessage="Test your microphone" />
        </h2>
        <p className="text-base text-muted-foreground">
          <FormattedMessage defaultMessage="Say something and watch the waves respond to your voice." />
        </p>
      </div>
    </OnboardingFormLayout>
  );

  const rightContent = (
    <div className="flex w-full max-w-[400px] flex-col gap-6 rounded-lg bg-muted p-8">
      {showMicSelector ? (
        <>
          <h3 className="text-base font-semibold">
            <FormattedMessage defaultMessage="Choose a different microphone" />
          </h3>
          <MicrophoneSelector
            value={preferredMicrophone}
            onChange={(value) => {
              setOnboardingPreferredMicrophone(value);
            }}
          />
          <div className="flex justify-end">
            <Button onClick={handleMicSelected}>
              <FormattedMessage defaultMessage="Use this mic" />
              <RiCheckLine className="size-4" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <h3 className="text-base font-semibold">
            <FormattedMessage defaultMessage="Do the waves respond to your voice?" />
          </h3>

          <div className="relative overflow-hidden rounded-lg bg-background p-4">
            <div className="relative flex h-20 w-full items-center">
              <AudioWaveform
                levels={audioLevels}
                active={isRecording}
                processing={isStarting}
                style={{ width: "100%", height: "100%" }}
              />
              <div className="pointer-events-none absolute inset-x-[-1px] inset-y-0 bg-gradient-to-r from-background via-transparent to-background [background-size:18%_100%,64%_100%,18%_100%] [background-position:left,center,right] bg-no-repeat" />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => void handleChangeMicrophone()}
            >
              <FormattedMessage defaultMessage="Try another mic" />
            </Button>
            <Button onClick={() => void handleConfirm()}>
              <FormattedMessage defaultMessage="Looks good" />
              <RiArrowRightLine className="size-4" />
            </Button>
          </div>
        </>
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
