import {
  RiFileCopyLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiInformationLine,
  RiPauseFill,
  RiPlayFill,
  RiLoopLeftLine,
} from "@remixicon/react";
import { getRec } from "@repo/utilities";
import { invoke } from "@tauri-apps/api/core";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { showErrorSnackbar, showSnackbar } from "../../actions/app.actions";
import {
  openRetranscribeDialog,
  openTranscriptionDetailsDialog,
} from "../../actions/transcriptions.actions";
import { getTranscriptionRepo } from "../../repos";
import { produceAppState, useAppStore } from "../../store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

export type TranscriptionRowProps = {
  id: string;
};

const formatDuration = (durationMs?: number | null): string => {
  if (!durationMs || !Number.isFinite(durationMs)) return "0:00";
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const createSeededRandom = (seed: number) => {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

const DEFAULT_WAVEFORM_BAR_COUNT = 58;
const MIN_WAVEFORM_BAR_VALUE = 0.05;
const MIN_COMPUTED_BAR_COUNT = 24;
const MAX_COMPUTED_BAR_COUNT = 120;
const WAVEFORM_BAR_MIN_WIDTH = 2;
const WAVEFORM_BAR_MAX_WIDTH = 4;
const WAVEFORM_BAR_GAP = 2;

type PlaybackStopReason = "ended" | "stopped" | "replaced";

type ActiveWebAudioPlayback = {
  transcriptionId: string;
  context: AudioContext;
  source: AudioBufferSourceNode;
  rafId: number | null;
  startTime: number;
  durationSeconds: number;
  onStop: (reason: PlaybackStopReason) => void;
};

let activePlayback: ActiveWebAudioPlayback | null = null;

const stopActivePlayback = (reason: PlaybackStopReason): void => {
  const current = activePlayback;
  if (!current) return;

  activePlayback = null;
  if (current.rafId !== null) window.cancelAnimationFrame(current.rafId);

  try {
    current.source.onended = null;
  } catch {
    /* no-op */
  }
  try {
    current.source.stop();
  } catch {
    /* no-op */
  }

  current.context.close().catch(() => undefined);
  current.onStop(reason);
};

const playWebAudio = async (
  transcriptionId: string,
  data: { samples: number[]; sampleRate: number },
  onProgress: (progress: number) => void,
  onStop: (reason: PlaybackStopReason) => void,
): Promise<void> => {
  stopActivePlayback("replaced");

  const context = new AudioContext({ sampleRate: data.sampleRate });
  if (context.state === "suspended") await context.resume();

  const floatSamples = Float32Array.from(data.samples ?? []);
  const buffer = context.createBuffer(1, floatSamples.length, data.sampleRate);
  buffer.getChannelData(0).set(floatSamples);

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);

  const playback: ActiveWebAudioPlayback = {
    transcriptionId,
    context,
    source,
    rafId: null,
    startTime: context.currentTime,
    durationSeconds: buffer.duration,
    onStop,
  };
  activePlayback = playback;

  const tick = () => {
    if (activePlayback !== playback) return;
    const elapsed = playback.context.currentTime - playback.startTime;
    const ratio =
      playback.durationSeconds > 0
        ? Math.min(Math.max(elapsed / playback.durationSeconds, 0), 1)
        : 0;
    onProgress(ratio);
    if (ratio >= 1) return;
    playback.rafId = window.requestAnimationFrame(tick);
  };

  source.onended = () => stopActivePlayback("ended");
  onProgress(0);
  playback.startTime = context.currentTime;
  source.start();
  playback.rafId = window.requestAnimationFrame(tick);
};

const buildWaveformOutline = (
  seedKey: string,
  durationMs?: number | null,
  points = 28,
): number[] => {
  if (points <= 0) return [];
  const durationSeed = Math.round((durationMs ?? 0) / 37);
  const stringSeed = seedKey
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const combinedSeed = stringSeed * 31 + durationSeed * 17 || 1;
  const random = createSeededRandom(combinedSeed);

  return Array.from({ length: points }, (_, index) => {
    const t = points <= 1 ? 0 : index / (points - 1);
    const eased = Math.pow(t, 0.85);
    const envelope = Math.sin(Math.PI * eased);
    const modulation = 0.45 + random() * 0.55;
    const baseline = 0.12 + random() * 0.2;
    return Math.max(0.12, Math.min(1, envelope * modulation + baseline));
  });
};

function TextWithMore({
  children,
  maxLines = 3,
}: {
  children: React.ReactNode;
  maxLines?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const hiddenRef = useRef<HTMLParagraphElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const measureOverflow = useCallback(() => {
    if (!hiddenRef.current) return;
    const node = hiddenRef.current;
    const computed = window.getComputedStyle(node);
    const lineHeight = parseFloat(computed.lineHeight || "0");
    if (!Number.isFinite(lineHeight) || lineHeight <= 0) return;
    const collapsedHeight = lineHeight * maxLines;
    setIsOverflowing(node.scrollHeight - collapsedHeight > 1);
  }, [maxLines]);

  useEffect(() => {
    measureOverflow();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => measureOverflow());
    if (hiddenRef.current) observer.observe(hiddenRef.current);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [measureOverflow, children]);

  const shouldClamp = isOverflowing && !expanded;

  return (
    <div ref={containerRef}>
      <div className="relative">
        <p
          className="text-sm text-foreground"
          style={
            shouldClamp
              ? {
                  display: "-webkit-box",
                  WebkitLineClamp: maxLines,
                  WebkitBoxOrient: "vertical" as const,
                  overflow: "hidden",
                  paddingRight: "3rem",
                }
              : undefined
          }
        >
          {children}
        </p>
        {isOverflowing && shouldClamp && (
          <button
            onClick={() => setExpanded(true)}
            className="absolute right-0 bottom-0 bg-background text-sm text-foreground shadow-[-12px_0_12px] shadow-background"
          >
            <FormattedMessage defaultMessage="Show more" />
          </button>
        )}
        <p
          ref={hiddenRef}
          aria-hidden
          className="pointer-events-none invisible absolute left-0 right-0 -z-10 block w-full text-sm"
        >
          {children}
        </p>
      </div>
      {isOverflowing && !shouldClamp && (
        <button
          onClick={() => setExpanded(false)}
          className="ml-auto mt-1 block text-sm text-foreground"
        >
          <FormattedMessage defaultMessage="Show less" />
        </button>
      )}
    </div>
  );
}

export const TranscriptionRow = ({ id }: TranscriptionRowProps) => {
  const intl = useIntl();
  const transcription = useAppStore((state) =>
    getRec(state.transcriptionById, id),
  );

  const hasMetadata = useMemo(() => {
    const model = transcription?.modelSize?.trim();
    const device = transcription?.inferenceDevice?.trim();
    return Boolean(model || device);
  }, [transcription?.inferenceDevice, transcription?.modelSize]);

  const isRetranscribing = useAppStore((state) =>
    state.transcriptions.retranscribingIds.includes(id),
  );

  const audioSnapshot = transcription?.audio;
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationLabel, setDurationLabel] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [waveformWidth, setWaveformWidth] = useState(0);
  const waveformContainerRef = useRef<HTMLDivElement | null>(null);
  const playbackNonceRef = useRef(0);
  const isPlayingRef = useRef(false);
  const transcriptionIdRef = useRef(id);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    transcriptionIdRef.current = id;
  }, [id]);

  const handleDetailsOpen = useCallback(() => {
    openTranscriptionDetailsDialog(id);
  }, [id]);

  const desiredWaveformBarCount = useMemo(() => {
    if (waveformWidth <= 0) return DEFAULT_WAVEFORM_BAR_COUNT;
    const approximateCount = Math.floor(
      (waveformWidth + WAVEFORM_BAR_GAP) /
        (WAVEFORM_BAR_MIN_WIDTH + WAVEFORM_BAR_GAP),
    );
    return Math.max(
      MIN_COMPUTED_BAR_COUNT,
      Math.min(MAX_COMPUTED_BAR_COUNT, approximateCount),
    );
  }, [waveformWidth]);

  const waveformValues = useMemo(
    () =>
      audioSnapshot
        ? buildWaveformOutline(
            id,
            audioSnapshot.durationMs,
            desiredWaveformBarCount,
          )
        : [],
    [audioSnapshot?.durationMs, desiredWaveformBarCount, id],
  );

  const waveformBars = useMemo(() => {
    if (!waveformValues.length) {
      return Array.from(
        { length: desiredWaveformBarCount },
        () => MIN_WAVEFORM_BAR_VALUE,
      );
    }
    return waveformValues;
  }, [desiredWaveformBarCount, waveformValues]);

  const computedBarWidth = useMemo(() => {
    if (waveformWidth <= 0 || waveformBars.length === 0)
      return WAVEFORM_BAR_MIN_WIDTH;
    const totalGaps = WAVEFORM_BAR_GAP * Math.max(waveformBars.length - 1, 0);
    const availableForBars = Math.max(waveformWidth - totalGaps, 0);
    const widthPerBar = availableForBars / waveformBars.length;
    return Math.max(
      WAVEFORM_BAR_MIN_WIDTH,
      Math.min(WAVEFORM_BAR_MAX_WIDTH, widthPerBar),
    );
  }, [waveformBars.length, waveformWidth]);

  const progressPercent = Math.min(Math.max(playbackProgress, 0), 1) * 100;

  useEffect(() => {
    if (audioSnapshot)
      setDurationLabel(formatDuration(audioSnapshot.durationMs));
    else setDurationLabel(null);
  }, [audioSnapshot?.durationMs, audioSnapshot?.filePath]);

  useEffect(() => {
    return () => {
      if (activePlayback?.transcriptionId === transcriptionIdRef.current)
        stopActivePlayback("stopped");
      setPlaybackProgress(0);
    };
  }, []);

  useEffect(() => {
    const element = waveformContainerRef.current;
    if (!element) return;

    const updateWidth = () =>
      setWaveformWidth(element.getBoundingClientRect().width);
    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWaveformWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [audioSnapshot?.filePath]);

  const handleCopyTranscript = useCallback(
    async (content: string) => {
      try {
        await navigator.clipboard.writeText(content);
        showSnackbar(
          intl.formatMessage({ defaultMessage: "Copied successfully" }),
          { mode: "success" },
        );
      } catch (error) {
        showErrorSnackbar(error);
      }
    },
    [intl],
  );

  const handleDeleteTranscript = useCallback(
    async (id: string) => {
      try {
        produceAppState((draft) => {
          delete draft.transcriptionById[id];
          draft.transcriptions.transcriptionIds =
            draft.transcriptions.transcriptionIds.filter((tid) => tid !== id);
        });
        await getTranscriptionRepo().deleteTranscription(id);
        showSnackbar(
          intl.formatMessage({ defaultMessage: "Delete successful" }),
          { mode: "success" },
        );
      } catch (error) {
        showErrorSnackbar(error);
      }
    },
    [intl],
  );

  const handlePlaybackToggle = useCallback(async () => {
    if (!audioSnapshot) return;
    const currentNonce = playbackNonceRef.current + 1;
    playbackNonceRef.current = currentNonce;

    try {
      if (isPlayingRef.current) {
        stopActivePlayback("stopped");
        return;
      }

      const audioData = await getTranscriptionRepo().loadTranscriptionAudio(id);
      if (playbackNonceRef.current !== currentNonce) return;

      setIsPlaying(true);
      await playWebAudio(
        id,
        audioData,
        (progress) => {
          if (transcriptionIdRef.current === id) setPlaybackProgress(progress);
        },
        (reason) => {
          if (transcriptionIdRef.current !== id) return;
          setIsPlaying(false);
          if (reason === "ended") setPlaybackProgress(0);
        },
      );
    } catch (error) {
      console.error("Failed to toggle audio playback", error);
      setIsPlaying(false);
      setPlaybackProgress(0);
      showErrorSnackbar(
        intl.formatMessage({ defaultMessage: "Unable to play audio snippet." }),
      );
    }
  }, [audioSnapshot, id, intl]);

  const handleExport = useCallback(async () => {
    try {
      const saved = await invoke<boolean>("export_transcription", { id });
      if (saved) {
        showSnackbar(
          intl.formatMessage({ defaultMessage: "Export saved successfully" }),
          { mode: "success" },
        );
      }
    } catch (error) {
      showErrorSnackbar(error);
    }
  }, [id, intl]);

  return (
    <>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {dayjs(transcription?.createdAt).format("MMM D, YYYY h:mm A")}
        </span>
        <div className="flex items-center gap-0.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label={intl.formatMessage({
                    defaultMessage: "View transcription details",
                  })}
                  onClick={handleDetailsOpen}
                  className={`rounded-md p-1.5 transition-colors hover:bg-accent ${hasMetadata ? "text-primary" : "text-muted-foreground"}`}
                >
                  <RiInformationLine className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {intl.formatMessage({
                  defaultMessage: "View transcription details",
                })}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label={intl.formatMessage({
                    defaultMessage: "Copy transcript",
                  })}
                  onClick={() =>
                    handleCopyTranscript(transcription?.transcript || "")
                  }
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <RiFileCopyLine className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {intl.formatMessage({ defaultMessage: "Copy transcript" })}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label={intl.formatMessage({
                    defaultMessage: "Delete transcript",
                  })}
                  onClick={() => handleDeleteTranscript(id)}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <RiDeleteBinLine className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {intl.formatMessage({ defaultMessage: "Delete transcript" })}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="mt-2">
        <TextWithMore maxLines={3}>{transcription?.transcript}</TextWithMore>
      </div>

      {audioSnapshot && (
        <div className="mt-3 flex w-full max-w-[350px] items-center gap-2 self-start rounded-full border border-border bg-muted/50 px-2 py-0.5">
          <button
            aria-label={
              isPlaying
                ? intl.formatMessage({ defaultMessage: "Pause audio" })
                : intl.formatMessage({ defaultMessage: "Play audio" })
            }
            onClick={handlePlaybackToggle}
            disabled={isRetranscribing}
            className="rounded-full p-1 text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            {isPlaying ? (
              <RiPauseFill className="size-4" />
            ) : (
              <RiPlayFill className="size-4" />
            )}
          </button>

          <span className="min-w-[42px] text-xs tabular-nums text-muted-foreground">
            {durationLabel ?? formatDuration(audioSnapshot.durationMs)}
          </span>

          <div
            ref={waveformContainerRef}
            className="relative mx-1 flex flex-1 items-center overflow-hidden"
            style={{ height: 22, gap: `${WAVEFORM_BAR_GAP}px` }}
          >
            <div className="pointer-events-none absolute inset-0">
              <div
                className="absolute top-0 bottom-0 bg-muted/50 transition-[left] duration-150"
                style={{ left: `${progressPercent}%`, right: 0 }}
              />
            </div>
            {waveformBars.map((value, index) => (
              <div
                key={`wave-bar-${index}`}
                className="flex-none rounded-sm bg-primary transition-opacity duration-150"
                style={{
                  width: `${computedBarWidth}px`,
                  height: `${Math.round(35 + value * 55)}%`,
                }}
              />
            ))}
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label={intl.formatMessage({
                    defaultMessage: "Retranscribe audio",
                  })}
                  onClick={() => openRetranscribeDialog(id)}
                  disabled={isRetranscribing}
                  className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                >
                  <RiLoopLeftLine className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {intl.formatMessage({
                  defaultMessage: "Retranscribe audio clip",
                })}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label={intl.formatMessage({
                    defaultMessage: "Export transcription",
                  })}
                  onClick={handleExport}
                  className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <RiDownloadLine className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {intl.formatMessage({ defaultMessage: "Export transcription" })}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <Separator className="mt-4" />
    </>
  );
};
