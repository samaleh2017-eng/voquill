import { RiLoader4Line } from "@remixicon/react";
import { Nullable } from "@repo/types";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { produceAppState, useAppStore } from "../../store";
import { buildWaveFile, ensureFloat32Array } from "../../utils/audio.utils";
import { AudioWaveform } from "../common/AudioWaveform";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

type StopRecordingResponse = {
  samples: number[] | Float32Array;
  sampleRate?: number;
};

const createPreviewUrl = (
  rawSamples: number[] | Float32Array,
  sampleRate: number,
): string | null => {
  if (!sampleRate || !Number.isFinite(sampleRate) || sampleRate <= 0) {
    return null;
  }

  const samples = ensureFloat32Array(rawSamples ?? []);

  if (!samples || samples.length === 0) {
    return null;
  }

  const wavBuffer = buildWaveFile(samples, sampleRate);
  const blob = new Blob([wavBuffer], { type: "audio/wav" });
  return URL.createObjectURL(blob);
};

export type MicrophoneTesterProps = {
  preferredMicrophone: Nullable<string>;
  waveformHeight?: number;
  disabled?: boolean;
  buttonLayout?: "row" | "column";
  fadeColor?: string;
  justifyButtons?: "flex-start" | "center" | "flex-end" | "space-between";
};

export const MicrophoneTester = ({
  preferredMicrophone,
  waveformHeight = 96,
  disabled = false,
  buttonLayout = "row",
  fadeColor: _fadeColor,
  justifyButtons = "flex-start",
}: MicrophoneTesterProps) => {
  const overlayPhase = useAppStore((state) => state.overlayPhase);
  const audioLevels = useAppStore((state) => state.audioLevels);

  const [testState, setTestState] = useState<
    "idle" | "starting" | "recording" | "stopping"
  >("idle");
  const [testError, setTestError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewUrlRef = useRef<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const isGlobalRecording =
    overlayPhase === "recording" || overlayPhase === "loading";
  const isTestRunning = testState === "recording";
  const isTestLoading = testState === "starting";
  const isTestStopping = testState === "stopping";

  const releasePreviewAudio = useCallback(() => {
    const audio = previewAudioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
      previewAudioRef.current = null;
    }
    setIsPreviewPlaying(false);
  }, []);

  const clearPreviewUrl = useCallback(() => {
    releasePreviewAudio();
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
  }, [releasePreviewAudio]);

  const updatePreviewUrl = useCallback(
    (url: string | null) => {
      releasePreviewAudio();
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      previewUrlRef.current = url;
      setPreviewUrl(url);
    },
    [releasePreviewAudio],
  );

  useEffect(() => () => clearPreviewUrl(), [clearPreviewUrl]);

  useEffect(() => {
    if (!previewUrl) {
      setIsPreviewPlaying(false);
      return;
    }

    const audio = new Audio(previewUrl);
    audio.preload = "auto";

    const handlePlay = () => setIsPreviewPlaying(true);
    const handlePause = () => setIsPreviewPlaying(false);
    const handleEnded = () => setIsPreviewPlaying(false);

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    previewAudioRef.current = audio;

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      if (previewAudioRef.current === audio) {
        previewAudioRef.current = null;
      }
    };
  }, [previewUrl]);

  const handleStartTest = useCallback(async () => {
    if (isTestRunning || isTestLoading || isGlobalRecording || disabled) {
      return;
    }

    setTestError(null);
    clearPreviewUrl();
    setTestState("starting");

    try {
      await invoke<void>("start_recording", {
        args: { preferredMicrophone: preferredMicrophone ?? null },
      });
      setTestState("recording");
    } catch (error) {
      console.error("Failed to start microphone test", error);
      setTestError("Unable to start microphone test. Please try again.");
      setTestState("idle");
    }
  }, [
    clearPreviewUrl,
    disabled,
    isGlobalRecording,
    isTestLoading,
    isTestRunning,
    preferredMicrophone,
  ]);

  const handleStopTest = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (testState !== "recording" && testState !== "starting") {
        return;
      }

      setTestState("stopping");

      try {
        const response = await invoke<StopRecordingResponse>("stop_recording");
        const rate = response.sampleRate ?? 0;
        const samplesArray =
          response.samples instanceof Float32Array
            ? Array.from(response.samples)
            : response.samples;

        if (!opts?.silent) {
          const url = createPreviewUrl(samplesArray ?? [], rate);
          if (url) {
            updatePreviewUrl(url);
          } else {
            updatePreviewUrl(null);
            setTestError(
              "We didn't detect any audio. Try speaking while the test is running.",
            );
          }
        } else {
          updatePreviewUrl(null);
        }
      } catch (error) {
        console.error("Failed to stop microphone test", error);
        if (!opts?.silent) {
          setTestError("Unable to stop microphone test. Please try again.");
        }
      } finally {
        setTestState("idle");
        produceAppState((draft) => {
          draft.audioLevels = [];
        });
      }
    },
    [testState, updatePreviewUrl],
  );

  const handleTogglePreview = useCallback(() => {
    const audio = previewAudioRef.current;
    if (!audio) {
      return;
    }

    if (!audio.paused && !audio.ended) {
      audio.pause();
      return;
    }

    audio
      .play()
      .then(() => {
        setTestError(null);
        setIsPreviewPlaying(true);
      })
      .catch((error) => {
        console.error("Failed to play recorded preview", error);
        setTestError("Unable to play the recorded preview.");
        setIsPreviewPlaying(false);
      });
  }, []);

  useEffect(() => {
    if (
      (testState === "recording" || testState === "starting") &&
      isGlobalRecording
    ) {
      void handleStopTest({ silent: true });
    }
  }, [handleStopTest, isGlobalRecording, testState]);

  const handleStopTestRef = useRef(handleStopTest);
  useEffect(() => {
    handleStopTestRef.current = handleStopTest;
  }, [handleStopTest]);

  useEffect(() => {
    return () => {
      void handleStopTestRef.current({ silent: true });
      clearPreviewUrl();
    };
  }, [clearPreviewUrl]);

  const disableStartButton =
    disabled || isGlobalRecording || isTestLoading || isTestRunning;
  const disableStopButton = disabled || isTestStopping;

  const justifyClass =
    justifyButtons === "center"
      ? "justify-center"
      : justifyButtons === "flex-end"
        ? "justify-end"
        : justifyButtons === "space-between"
          ? "justify-between"
          : "justify-start";

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative w-full overflow-hidden flex items-center"
        style={{ height: waveformHeight }}
      >
        <AudioWaveform
          levels={audioLevels}
          active={isTestRunning}
          processing={isTestLoading || isTestStopping}
          style={{ width: "100%", height: "100%" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, var(--color-background) 0%, transparent 18%, transparent 82%, var(--color-background) 100%)`,
          }}
        />
      </div>

      <div
        className={`flex gap-3 w-full ${
          buttonLayout === "column" ? "flex-col items-stretch" : `flex-row items-center ${justifyClass}`
        }`}
      >
        <Button
          variant={isTestRunning ? "outline" : "default"}
          className={isTestRunning ? "border-destructive text-destructive hover:bg-destructive/10" : ""}
          onClick={
            isTestRunning ? () => void handleStopTest() : handleStartTest
          }
          disabled={
            (isTestLoading || isTestStopping)
              ? true
              : isTestRunning
                ? disableStopButton
                : disableStartButton
          }
        >
          {(isTestLoading || isTestStopping) && (
            <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isTestRunning ? (
            <FormattedMessage defaultMessage="Finish" />
          ) : (
            <FormattedMessage defaultMessage="Record" />
          )}
        </Button>
        <Button
          variant="outline"
          disabled={previewUrl == null || disabled}
          onClick={handleTogglePreview}
        >
          {isPreviewPlaying ? (
            <FormattedMessage defaultMessage="Pause" />
          ) : (
            <FormattedMessage defaultMessage="Play" />
          )}
        </Button>
      </div>

      {isGlobalRecording && (
        <Alert>
          <AlertDescription>
            <FormattedMessage defaultMessage="You cannot start a microphone test while a transcription is in progress." />
          </AlertDescription>
        </Alert>
      )}

      {testError && (
        <Alert variant="destructive">
          <AlertDescription>
            {testError}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
