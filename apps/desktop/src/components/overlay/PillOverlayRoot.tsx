import { RiArrowLeftSLine, RiArrowRightSLine, RiCloseLine } from "@remixicon/react";
import { invoke } from "@tauri-apps/api/core";
import { emitTo } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useTauriListen } from "../../hooks/tauri.hooks";
import { produceAppState, useAppStore } from "../../store";
import type {
  OverlayPhase,
  OverlaySyncPayload,
} from "../../types/overlay.types";
import { getEffectiveStylingMode } from "../../utils/feature.utils";
import {
  DICTATE_HOTKEY,
  getHotkeyCombosForAction,
} from "../../utils/keyboard.utils";
import { getManuallySelectedToneId, getToneById } from "../../utils/tone.utils";
import {
  getEffectivePillVisibility,
  getIsDictationUnlocked,
} from "../../utils/user.utils";
import { AudioWaveform } from "../common/AudioWaveform";
import { HotkeyBadge } from "../common/HotkeyBadge";
import { Progress } from "../ui/progress";

export const PILL_OVERLAY_WIDTH = 256;
export const PILL_OVERLAY_HEIGHT = 96;
export const MIN_PILL_WIDTH = 48;
export const MIN_PILL_HEIGHT = 6;
export const MIN_PILL_HOVER_PADDING = 4;
export const EXPANDED_PILL_WIDTH = 120;
export const EXPANDED_PILL_HEIGHT = 32;

type PillExpandedPayload = {
  expanded: boolean;
  hovered: boolean;
};

type OverlayPhasePayload = {
  phase: OverlayPhase;
};

type RecordingLevelPayload = {
  levels?: number[];
};

type FlashPillPayload = {
  duration: number;
};

export const PillOverlayRoot = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFlashingTooltip, setIsFlashingTooltip] = useState(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phase = useAppStore((state) => state.overlayPhase);
  const levels = useAppStore((state) => state.audioLevels);
  const isManualMode = useAppStore(
    (state) => getEffectiveStylingMode(state) === "manual",
  );
  const combos = useAppStore((state) =>
    getHotkeyCombosForAction(state, DICTATE_HOTKEY),
  );
  const hotkeyKeys = combos.length > 0 ? combos[0] : ["?"];

  const activeToneName = useAppStore((state) => {
    const toneId = getManuallySelectedToneId(state);
    return getToneById(state, toneId)?.name ?? "-";
  });

  const isIdle = phase === "idle";
  const isListening = phase === "recording";
  const isProcessing = phase === "loading";
  const overlayShown =
    (isHovered && isIdle) || isFlashingTooltip || (isManualMode && isListening);
  const showStyleSwitchers = isHovered || (isManualMode && isListening);
  const flashingInfo = isFlashingTooltip && !showStyleSwitchers;

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";
    document.body.style.backgroundColor = "transparent";
  }, []);

  useTauriListen<PillExpandedPayload>("pill_expanded", (payload) => {
    setIsExpanded(payload.expanded);
    setIsHovered(payload.hovered);
  });

  useTauriListen<FlashPillPayload>("flash_pill_tooltip", (payload) => {
    setIsFlashingTooltip(true);
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
    }
    flashTimerRef.current = setTimeout(() => {
      setIsFlashingTooltip(false);
      flashTimerRef.current = null;
    }, payload.duration);
  });

  useTauriListen<OverlayPhasePayload>("overlay_phase", (payload) => {
    produceAppState((draft) => {
      draft.overlayPhase = payload.phase;
      if (payload.phase !== "recording") {
        draft.audioLevels = [];
      }
    });
  });

  useTauriListen<RecordingLevelPayload>("recording_level", (payload) => {
    const raw = Array.isArray(payload.levels) ? payload.levels : [];
    const sanitized = raw.map((value) =>
      typeof value === "number" && Number.isFinite(value) ? value : 0,
    );
    produceAppState((draft) => {
      draft.audioLevels = sanitized;
    });
  });

  useTauriListen<OverlaySyncPayload>("overlay_sync", (payload) => {
    produceAppState((draft) => {
      Object.assign(draft, payload);
    });
  });

  useEffect(() => {
    emitTo("main", "overlay_ready", { windowLabel: "pill-overlay" }).catch(
      console.error,
    );
  }, []);

  const dictationPillVisibility = useAppStore((state) =>
    getEffectivePillVisibility(state.userPrefs?.dictationPillVisibility),
  );
  const isDictationUnlocked = useAppStore(getIsDictationUnlocked);

  const isOverlayActive = !isIdle;
  const isVisible =
    isDictationUnlocked &&
    dictationPillVisibility !== "hidden" &&
    (isOverlayActive || dictationPillVisibility !== "while_active");

  const handleMouseDownDictate = (e: React.MouseEvent) => {
    e.preventDefault();
    invoke("restore_overlay_focus").catch(() => {});
    emitTo("main", "on-click-dictate", {}).catch(console.error);
  };

  const handleCancelDictation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    invoke("restore_overlay_focus").catch(() => {});
    emitTo("main", "cancel-dictation", {}).catch(console.error);
  };

  return (
    <div
      className="flex h-screen w-screen flex-col items-center justify-end"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(8px)",
        transition: isVisible
          ? "opacity 100ms ease-out, transform 100ms ease-out"
          : "opacity 100ms ease-out, transform 100ms ease-out, visibility 0ms 100ms",
        visibility: isVisible ? "visible" : "hidden",
      }}
    >
      {/* Tooltip */}
      <div
        style={{
          opacity: overlayShown ? 1 : 0,
          transform: overlayShown ? "translateY(0)" : "translateY(4px)",
          transition: "all 150ms ease-out",
          marginBottom: "8px",
          pointerEvents: isManualMode && overlayShown ? "auto" : "none",
        }}
      >
        <div
          className="rounded-xl px-3 py-1.5"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.92)",
            backdropFilter: "blur(14px)",
          }}
        >
          <span
            className="flex items-center whitespace-nowrap text-xs font-medium text-white"
            style={{ gap: isManualMode ? "8px" : "4px" }}
          >
            {isManualMode ? (
              <>
                <RiArrowLeftSLine
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    invoke("restore_overlay_focus").catch(() => {});
                    emitTo("main", "tone-switch-backward", {}).catch(
                      console.error,
                    );
                  }}
                  className="shrink-0 cursor-pointer"
                  style={{
                    fontSize: "16px",
                    padding: "8px",
                    margin: "-8px",
                    boxSizing: "content-box",
                    opacity: showStyleSwitchers ? 1 : 0,
                    width: showStyleSwitchers ? 16 : 0,
                    transition: "opacity 200ms ease-out, width 150ms ease-out",
                    overflow: "hidden",
                  }}
                />
                <span
                  className="truncate text-center"
                  style={{
                    width: flashingInfo ? 140 : 82,
                    transition: "width 150ms ease-out",
                  }}
                >
                  {activeToneName}
                </span>
                <RiArrowRightSLine
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    invoke("restore_overlay_focus").catch(() => {});
                    emitTo("main", "tone-switch-forward", {}).catch(
                      console.error,
                    );
                  }}
                  className="shrink-0 cursor-pointer"
                  style={{
                    fontSize: "16px",
                    padding: "8px",
                    margin: "-8px",
                    boxSizing: "content-box",
                    opacity: showStyleSwitchers ? 1 : 0,
                    width: showStyleSwitchers ? 16 : 0,
                    transition: "opacity 200ms ease-out, width 150ms ease-out",
                    overflow: "hidden",
                  }}
                />
              </>
            ) : (
              <FormattedMessage
                defaultMessage="You can also tap {hotkey}"
                values={{
                  hotkey: (
                    <HotkeyBadge
                      keys={hotkeyKeys}
                      className="border-white/30 bg-white/15 text-white text-[inherit] py-0 px-1.5"
                    />
                  ),
                }}
              />
            )}
          </span>
        </div>
      </div>

      {/* Pill with hover zone */}
      <div
        className="flex items-center justify-center"
        style={{ paddingBottom: `${MIN_PILL_HOVER_PADDING}px` }}
      >
        <div className="relative">
          <div
            onMouseDown={handleMouseDownDictate}
            className="relative flex cursor-pointer items-center justify-center overflow-hidden pointer-events-auto"
            style={{
              width: isExpanded ? EXPANDED_PILL_WIDTH : MIN_PILL_WIDTH,
              height: isExpanded ? EXPANDED_PILL_HEIGHT : MIN_PILL_HEIGHT,
              borderRadius: isExpanded ? "16px" : "6px",
              backgroundColor: `rgba(0, 0, 0, ${isExpanded ? 0.92 : 0.6})`,
              border: "1px solid rgba(255, 255, 255, 0.3)",
              backdropFilter: "blur(14px)",
              transition: "all 200ms ease-out",
            }}
          >
            {/* Inner content container */}
            <div
              className="relative flex h-full items-center justify-center"
              style={{
                width: EXPANDED_PILL_WIDTH - 8,
                opacity: isExpanded ? 1 : 0,
                transition: "opacity 150ms ease-out",
              }}
            >
              {isHovered && (
                <span
                  className="absolute whitespace-nowrap text-[11px] font-medium tracking-wide"
                  style={{
                    color: "rgba(255, 255, 255, 0.4)",
                    opacity: isIdle ? 1 : 0,
                    transition: "opacity 150ms ease-out",
                  }}
                >
                  <FormattedMessage defaultMessage="Click to dictate" />
                </span>
              )}

              {/* Processing indicator */}
              <div
                className="absolute flex h-full w-full items-center justify-center"
                style={{
                  opacity: isProcessing ? 1 : 0,
                  transition: "opacity 150ms ease-out",
                }}
              >
                <Progress className="h-0.5 w-full" />
              </div>

              {/* Audio waveform */}
              <div
                className="absolute inset-0"
                style={{
                  opacity: isListening ? 1 : 0,
                  transition: "opacity 150ms ease-out",
                }}
              >
                <AudioWaveform
                  levels={levels}
                  active={isListening}
                  processing={isProcessing}
                  strokeColor="#ffffff"
                  width={EXPANDED_PILL_WIDTH}
                  height={EXPANDED_PILL_HEIGHT}
                  baselineOffset={0}
                />
              </div>

              {/* Gradient overlay for waveform edges */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  opacity: isIdle ? 0 : 1,
                  transition: "opacity 150ms ease-out",
                  background:
                    "linear-gradient(90deg, rgba(0,0,0,0.9) 0%, transparent 18%, transparent 85%, rgba(0,0,0,0.9) 100%)",
                }}
              />
            </div>
          </div>

          {/* Cancel button */}
          <button
            onMouseDown={handleCancelDictation}
            className="absolute flex items-center justify-center rounded-full pointer-events-auto"
            style={{
              top: -4,
              right: -6,
              width: 18,
              height: 18,
              backgroundColor: "#757575",
              opacity: !isIdle && isHovered ? 1 : 0,
              transform: !isIdle && isHovered ? "scale(1)" : "scale(0)",
              pointerEvents: !isIdle && isHovered ? "auto" : "none",
              transition: "opacity 200ms ease-out, transform 200ms ease-out",
              color: "#ffffff",
              zIndex: 1,
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <RiCloseLine style={{ fontSize: 12, width: 12, height: 12 }} />
          </button>
        </div>
      </div>
    </div>
  );
};
