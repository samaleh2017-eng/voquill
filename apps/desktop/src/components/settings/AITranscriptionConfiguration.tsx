import { invoke } from "@tauri-apps/api/core";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";
import {
  setGpuEnumerationEnabled,
  setPreferredTranscriptionApiKeyId,
  setPreferredTranscriptionDevice,
  setPreferredTranscriptionMode,
  setPreferredTranscriptionModelSize,
} from "../../actions/user.actions";
import { useSupportedDiscreteGpus } from "../../hooks/gpu.hooks";
import { useAppStore } from "../../store";
import { getAllowsChangeTranscription } from "../../utils/enterprise.utils";
import { ManagedByOrgNotice } from "../common/ManagedByOrgNotice";
import { CPU_DEVICE_VALUE, type TranscriptionMode } from "../../types/ai.types";
import { buildDeviceLabel, type GpuInfo } from "../../types/gpu.types";
import { isGPUBuild } from "../../utils/env.utils";
import {
  SegmentedControl,
  SegmentedControlOption,
} from "../common/SegmentedControl";
import { maybeArrayElements } from "./AIPostProcessingConfiguration";
import { ApiKeyList } from "./ApiKeyList";
import { VoquillCloudSetting } from "./VoquillCloudSetting";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RiAlertLine, RiInformationLine } from "@remixicon/react";

type ModelOption = {
  value: string;
  label: string;
  helper: string;
};

const MODEL_OPTIONS: ModelOption[] = [
  { value: "tiny", label: "Tiny (77 MB)", helper: "Fastest, lowest accuracy" },
  { value: "base", label: "Base (148 MB)", helper: "Great balance of speed and accuracy" },
  { value: "small", label: "Small (488 MB)", helper: "Recommended with GPU acceleration" },
  { value: "medium", label: "Medium (1.53 GB)", helper: "High accuracy, slower on CPU" },
  { value: "large-turbo", label: "Large Turbo (1.6 GB)", helper: "Fast large model, great accuracy" },
  { value: "large", label: "Large (3.1 GB)", helper: "Highest accuracy, requires GPU" },
];

export type AITranscriptionConfigurationProps = {
  hideCloudOption?: boolean;
};

export const AITranscriptionConfiguration = ({
  hideCloudOption,
}: AITranscriptionConfigurationProps) => {
  const transcription = useAppStore((state) => state.settings.aiTranscription);
  const allowChange = useAppStore(getAllowsChangeTranscription);
  const [gpuEnumerationError, setGpuEnumerationError] = useState<string | null>(null);
  const [isEnablingGpu, setIsEnablingGpu] = useState(false);

  const { gpus, loading: gpusLoading } = useSupportedDiscreteGpus(
    transcription.gpuEnumerationEnabled,
  );

  const handleEnableHardwareAcceleration = useCallback(async () => {
    setGpuEnumerationError(null);
    setIsEnablingGpu(true);

    try {
      const gpuList = await invoke<GpuInfo[]>("list_gpus");
      const supported = gpuList.filter(
        (info) => info.backend === "Vulkan" && info.deviceType === "DiscreteGpu",
      );

      if (supported.length > 0) {
        await setGpuEnumerationEnabled(true);
      } else {
        setGpuEnumerationError(
          "No compatible GPUs found. Make sure you have a discrete GPU with Vulkan support.",
        );
      }
    } catch (error) {
      console.error("Failed to enumerate GPUs:", error);
      setGpuEnumerationError("Failed to detect GPUs. Please try again.");
    } finally {
      setIsEnablingGpu(false);
    }
  }, []);

  const deviceOptions = useMemo(
    () => [
      { value: CPU_DEVICE_VALUE, label: "CPU processing" },
      ...gpus.map((gpu, index) => ({
        value: `gpu-${index}`,
        label: buildDeviceLabel(gpu),
      })),
    ],
    [gpus],
  );

  const handleModeChange = useCallback((mode: TranscriptionMode) => {
    void setPreferredTranscriptionMode(mode);
  }, []);

  const handleDeviceChange = useCallback((device: string) => {
    void setPreferredTranscriptionDevice(device);
  }, []);

  const handleModelSizeChange = useCallback((modelSize: string) => {
    void setPreferredTranscriptionModelSize(modelSize);
  }, []);

  const handleApiKeyChange = useCallback((id: string | null) => {
    void setPreferredTranscriptionApiKeyId(id);
  }, []);

  if (!allowChange) {
    return <ManagedByOrgNotice />;
  }

  return (
    <div className="flex w-full flex-col items-start gap-4">
      <SegmentedControl<TranscriptionMode>
        value={transcription.mode}
        onChange={handleModeChange}
        options={[
          ...maybeArrayElements<SegmentedControlOption<TranscriptionMode>>(
            !hideCloudOption,
            [{ value: "cloud", label: "Voquill" }],
          ),
          { value: "api", label: "API" },
          { value: "local", label: "Local" },
        ]}
        ariaLabel="Processing mode"
      />

      {transcription.mode === "local" && (
        <div className="flex w-full flex-col gap-4">
          {!transcription.gpuEnumerationEnabled && isGPUBuild() && (
            <Alert>
              <RiInformationLine className="size-4" />
              <AlertDescription className="flex items-center justify-between gap-2">
                <span className="text-sm">
                  <FormattedMessage defaultMessage="Have an NVIDIA GPU?" />
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isEnablingGpu}
                  onClick={handleEnableHardwareAcceleration}
                >
                  {isEnablingGpu ? (
                    <FormattedMessage defaultMessage="Detecting..." />
                  ) : (
                    <FormattedMessage defaultMessage="Enable hardware acceleration" />
                  )}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {gpuEnumerationError && (
            <Alert variant="destructive">
              <RiAlertLine className="size-4" />
              <AlertDescription>{gpuEnumerationError}</AlertDescription>
            </Alert>
          )}

          {transcription.gpuEnumerationEnabled && (
            <div className="space-y-1.5">
              <Label>
                <FormattedMessage defaultMessage="Processing device" />
              </Label>
              <Select
                value={transcription.device}
                onValueChange={handleDeviceChange}
                disabled={gpusLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {deviceOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>
              <FormattedMessage defaultMessage="Model size" />
            </Label>
            <Select
              value={transcription.modelSize}
              onValueChange={handleModelSizeChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODEL_OPTIONS.map(({ value, label, helper }) => (
                  <SelectItem key={value} value={value}>
                    <div>
                      <span className="font-semibold">{label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {helper}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {transcription.mode === "api" && (
        <ApiKeyList
          selectedApiKeyId={transcription.selectedApiKeyId}
          onChange={handleApiKeyChange}
          context="transcription"
        />
      )}

      {transcription.mode === "cloud" && <VoquillCloudSetting />}
    </div>
  );
};
