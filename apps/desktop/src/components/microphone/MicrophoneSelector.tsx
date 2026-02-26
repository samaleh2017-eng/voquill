import { RiLoader4Line } from "@remixicon/react";
import { Nullable } from "@repo/types";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AUTO_OPTION_VALUE = "__microphone_auto__";

type InputDeviceDescriptor = {
  label: string;
  isDefault: boolean;
  caution: boolean;
};

export type MicrophoneOption = {
  value: string;
  label: string;
  isDefault?: boolean;
  caution?: boolean;
  unavailable?: boolean;
};

export type MicrophoneSelectorProps = {
  value: Nullable<string>;
  onChange: (value: Nullable<string>) => void;
  microphones?: MicrophoneOption[];
  disabled?: boolean;
};

export const MicrophoneSelector = ({
  value,
  onChange,
  microphones,
  disabled = false,
}: MicrophoneSelectorProps) => {
  const [devices, setDevices] = useState<MicrophoneOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (microphones) {
      setDevices(microphones);
    }
  }, [microphones]);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<InputDeviceDescriptor[]>("list_microphones");
      const mapped: MicrophoneOption[] = result.map((device) => ({
        value: device.label,
        label: device.label,
        isDefault: device.isDefault,
        caution: device.caution,
      }));
      setDevices(mapped);
    } catch (err) {
      console.error("Failed to load microphones", err);
      setError("Unable to fetch microphones. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!microphones) {
      void loadDevices();
    }
  }, [loadDevices, microphones]);

  const selectValue = value ?? AUTO_OPTION_VALUE;

  const options = useMemo(() => {
    const base = [...devices];
    if (value && !base.some((device) => device.value === value)) {
      base.push({
        value,
        label: `${value} (unavailable)`,
        caution: true,
        unavailable: true,
      });
    }
    return base;
  }, [devices, value]);

  const handleValueChange = useCallback(
    (nextValue: string) => {
      const normalized = nextValue === AUTO_OPTION_VALUE ? null : nextValue;
      onChange(normalized);
    },
    [onChange],
  );

  const handleRefresh = useCallback(() => {
    if (!loading) {
      void loadDevices();
    }
  }, [loadDevices, loading]);

  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-1.5">
        <Label><FormattedMessage defaultMessage="Microphone" /></Label>
        <Select
          value={selectValue}
          onValueChange={handleValueChange}
          disabled={disabled || loading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={AUTO_OPTION_VALUE}>
              <div className="flex items-center justify-between gap-2">
                <span><FormattedMessage defaultMessage="Automatic" /></span>
                <Badge variant="default" className="text-[10px]">
                  <FormattedMessage defaultMessage="Recommended" />
                </Badge>
              </div>
            </SelectItem>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center justify-between gap-4 w-full">
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    {option.unavailable ? (
                      <span className="text-xs text-amber-500">
                        <FormattedMessage defaultMessage="Currently unavailable" />
                      </span>
                    ) : option.caution ? (
                      <span className="text-xs text-muted-foreground">
                        <FormattedMessage defaultMessage="May provide lower audio quality" />
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {option.isDefault && (
                      <Badge variant="outline" className="text-[10px]">
                        <FormattedMessage defaultMessage="Default" />
                      </Badge>
                    )}
                    {option.caution && !option.unavailable && (
                      <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-500">
                        <FormattedMessage defaultMessage="Caution" />
                      </Badge>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={loading}>
          <FormattedMessage defaultMessage="Refresh devices" />
        </Button>
        {loading && <RiLoader4Line className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
