import { RiCloseLine } from "@remixicon/react";
import { emitTo } from "@tauri-apps/api/event";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useAppStore } from "../../store";
import type { AgentWindowMessage } from "../../types/agent-window.types";
import {
  AGENT_DICTATE_HOTKEY,
  getHotkeyCombosForAction,
} from "../../utils/keyboard.utils";
import { AudioWaveform } from "../common/AudioWaveform";
import { HotkeyBadge } from "../common/HotkeyBadge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";

const AGENT_OVERLAY_WIDTH = 300;
const LEFT_MARGIN = 16;
const TOP_MARGIN = 16;
const MAX_PAPER_HEIGHT = 600;
const HEADER_HEIGHT = 40;

type MessageBubbleProps = {
  message: AgentWindowMessage;
};

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isMe = message.sender === "me";

  if (isMe) {
    return (
      <div className="mb-2 flex justify-end">
        <div
          className="max-w-[85%] rounded bg-muted/50 px-3 py-2"
          style={{ borderBottomRightRadius: 2 }}
        >
          <p className="whitespace-pre-wrap break-words text-[0.8125rem] leading-[1.4] text-foreground">
            {message.text}
          </p>
        </div>
      </div>
    );
  }

  const draft = message.draft;

  if (message.isError) {
    return (
      <div className="mb-2 rounded bg-destructive/10 px-3 py-2">
        <p className="whitespace-pre-wrap break-words text-[0.8125rem] leading-[1.5] text-destructive">
          {message.text}
        </p>
      </div>
    );
  }

  const tools = message.tools ?? [];
  const hasTools = tools.length > 0;
  const hasDraft = !!draft;

  return (
    <div className="mb-2">
      {hasTools && (
        <div className="mb-1">
          <p className="text-[0.75rem] leading-[1.4] text-muted-foreground">
            Tools used ({tools.length})
          </p>
          {tools.map((tool, index) => (
            <p
              key={index}
              className="pl-2 text-[0.75rem] leading-[1.4] text-muted-foreground"
            >
              • {tool}
            </p>
          ))}
        </div>
      )}
      {hasDraft && (
        <div className="mb-2 rounded border-l-[3px] border-primary bg-primary/[0.08] p-3">
          <span className="mb-1 block text-[0.7rem] font-medium uppercase tracking-wider text-primary">
            Draft
          </span>
          <p className="whitespace-pre-wrap break-words text-[0.8125rem] leading-[1.5] text-foreground">
            {draft}
          </p>
        </div>
      )}
      <p className="whitespace-pre-wrap break-words text-[0.8125rem] leading-[1.5] text-foreground">
        {message.text}
      </p>
    </div>
  );
};

type UserRecordingBubbleProps = {
  levels: number[];
  isProcessing: boolean;
};

const UserRecordingBubble = ({
  levels,
  isProcessing,
}: UserRecordingBubbleProps) => {
  return (
    <div
      className="mb-2 flex items-center justify-center self-end rounded bg-muted/50"
      style={{
        width: 100,
        height: 40,
        padding: "8px 12px",
        borderBottomRightRadius: 2,
        animation: "agent-bubble-fade-in 0.15s ease-out",
      }}
    >
      {isProcessing ? (
        <Progress className="h-[3px] w-[60px]" />
      ) : (
        <div
          style={{
            width: 60,
            height: 20,
            maskImage:
              "linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)",
          }}
        >
          <AudioWaveform
            levels={levels}
            active={true}
            processing={false}
            strokeColor="var(--color-primary)"
            strokeWidth={2}
            width={60}
            height={20}
          />
        </div>
      )}
    </div>
  );
};

const AgentThinkingBubble = () => {
  return (
    <div
      className="mb-2 flex items-center"
      style={{ animation: "agent-bubble-fade-in 0.15s ease-out" }}
    >
      <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
    </div>
  );
};

export const AgentSection = () => {
  const phase = useAppStore((state) => state.agent.overlayPhase);
  const levels = useAppStore((state) => state.audioLevels);
  const windowState = useAppStore((state) => state.agent.windowState);
  const messages = windowState?.messages ?? [];
  const hotkeyCombos = useAppStore((state) =>
    getHotkeyCombosForAction(state, AGENT_DICTATE_HOTKEY),
  );

  const isVisible = phase !== "idle";
  const isRecording = phase === "recording";
  const isLoading = phase === "loading";

  const [animationKey, setAnimationKey] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [wasRecording, setWasRecording] = useState(false);
  const prevMessagesLengthRef = useRef(0);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const handleClose = useCallback(() => {
    emitTo("main", "agent-overlay-close", {}).catch(console.error);
  }, []);

  useEffect(() => {
    if (isVisible) {
      setAnimationKey((prev) => prev + 1);
    }
  }, [isVisible]);

  useEffect(() => {
    if (isRecording) {
      setWasRecording(true);
    }
  }, [isRecording]);

  useEffect(() => {
    if (phase === "idle") {
      setWasRecording(false);
      prevMessagesLengthRef.current = 0;
      return;
    }

    const newUserMessage =
      messages.length > prevMessagesLengthRef.current &&
      messages[messages.length - 1]?.sender === "me";

    if (newUserMessage) {
      setWasRecording(false);
    }

    prevMessagesLengthRef.current = messages.length;
  }, [phase, messages]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isRecording, isLoading, wasRecording]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const checkScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;
      setCanScrollDown(!isAtBottom && scrollHeight > clientHeight);
    };

    checkScroll();
    container.addEventListener("scroll", checkScroll);
    return () => container.removeEventListener("scroll", checkScroll);
  }, [messages, isVisible]);

  if (!isVisible) {
    return null;
  }

  const lastMessage = messages[messages.length - 1];
  const showUserRecordingBubble = isRecording;
  const showUserProcessingBubble = isLoading && wasRecording;
  const showAgentThinkingBubble =
    isLoading && !wasRecording && lastMessage?.sender === "me";
  const showFinishButton =
    !isRecording && !showUserProcessingBubble && !showAgentThinkingBubble;

  return (
    <div
      className="pointer-events-none absolute flex items-start justify-start"
      style={{
        top: `${TOP_MARGIN}px`,
        left: `${LEFT_MARGIN}px`,
        bottom: `${TOP_MARGIN}px`,
      }}
    >
      <div
        data-overlay-interactive
        key={animationKey}
        className="pointer-events-auto relative flex flex-col overflow-hidden rounded-lg border border-border bg-background"
        style={{
          width: `${AGENT_OVERLAY_WIDTH}px`,
          maxHeight: `${MAX_PAPER_HEIGHT}px`,
          animation: "agent-fade-in-scale 0.2s ease-out",
          transformOrigin: "top left",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <div
          className="pointer-events-auto absolute top-0 right-0 left-0 z-10 flex items-start p-1 select-none"
          style={{
            height: HEADER_HEIGHT,
            background:
              "linear-gradient(to bottom, var(--color-background) 0%, var(--color-background) 50%, transparent 100%)",
          }}
        >
          <button
            onClick={handleClose}
            className="flex size-6 items-center justify-center rounded-md bg-muted/50 hover:bg-muted"
            style={{ pointerEvents: "auto" }}
          >
            <RiCloseLine className="size-3.5" />
          </button>
        </div>
        <div
          ref={scrollContainerRef}
          className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto p-3 pt-10"
        >
          <MessageBubble
            message={{ sender: "agent", text: "What can I help you with?" }}
          />
          {messages.length === 0 && showFinishButton && hotkeyCombos[0] && (
            <span className="-mt-1 mb-2 flex items-center gap-1 text-[0.7rem] text-muted-foreground">
              <FormattedMessage defaultMessage="Press" />{" "}
              <HotkeyBadge
                keys={hotkeyCombos[0]}
                className="text-[0.65rem] py-0 px-1"
              />{" "}
              <FormattedMessage defaultMessage="to respond" />
            </span>
          )}

          {messages.map((message, index) => {
            const isLastMessage = index === messages.length - 1;
            const isAgentMessage = message.sender === "agent";
            const showHotkeyHint =
              isLastMessage && isAgentMessage && showFinishButton;

            return (
              <div key={index}>
                <MessageBubble message={message} />
                {showHotkeyHint && hotkeyCombos[0] && (
                  <span className="-mt-1 mb-2 flex items-center gap-1 text-[0.7rem] text-muted-foreground">
                    <FormattedMessage defaultMessage="Press" />{" "}
                    <HotkeyBadge
                      keys={hotkeyCombos[0]}
                      className="text-[0.65rem] py-0 px-1"
                    />{" "}
                    <FormattedMessage defaultMessage="to respond" />
                  </span>
                )}
              </div>
            );
          })}

          {showUserRecordingBubble && (
            <UserRecordingBubble levels={levels} isProcessing={false} />
          )}

          {showUserProcessingBubble && (
            <UserRecordingBubble levels={levels} isProcessing={true} />
          )}

          {showAgentThinkingBubble && <AgentThinkingBubble />}

          {showFinishButton && (
            <div className="mt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={handleClose}>
                Finish
              </Button>
            </div>
          )}
        </div>
        {canScrollDown && (
          <div
            className="pointer-events-none absolute right-0 bottom-0 left-0 z-10"
            style={{
              height: 40,
              background:
                "linear-gradient(to top, var(--color-background) 0%, var(--color-background) 50%, transparent 100%)",
              borderBottomLeftRadius: "inherit",
              borderBottomRightRadius: "inherit",
            }}
          />
        )}
      </div>
    </div>
  );
};
