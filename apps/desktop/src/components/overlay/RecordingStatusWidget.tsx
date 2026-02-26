import { FormattedMessage } from "react-intl";
import { useAppStore } from "../../store";
import { AudioWaveform } from "../common/AudioWaveform";
import { Progress } from "../ui/progress";

export const RecordingStatusWidget = () => {
  const phase = useAppStore((state) => state.overlayPhase);
  const levels = useAppStore((state) => state.audioLevels);
  const isIdle = phase === "idle";
  const isListening = phase === "recording";
  const isProcessing = phase === "loading";

  return (
    <div
      className="pointer-events-none relative flex items-center justify-center overflow-hidden"
      style={{
        padding: "6px 16px",
        borderRadius: "18px",
        backgroundColor: "rgba(0, 0, 0, 0.92)",
        backdropFilter: "blur(14px)",
        boxShadow: "0 10px 35px rgba(0, 0, 0, 0.36)",
        minWidth: "128px",
        height: "32px",
      }}
    >
      <div className="relative flex h-6 w-32 items-center justify-center">
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
        <div
          className="absolute flex h-full w-full items-center justify-center"
          style={{
            opacity: isProcessing ? 1 : 0,
            transition: "opacity 150ms ease-out",
          }}
        >
          <Progress className="h-0.5 w-full" />
        </div>
        <div
          className="absolute"
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
            width={120}
            height={36}
            baselineOffset={3}
          />
        </div>
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
  );
};
