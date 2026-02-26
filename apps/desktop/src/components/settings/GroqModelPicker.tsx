import { RiErrorWarningLine, RiLoader4Line } from "@remixicon/react";
import { fetch } from "@tauri-apps/plugin-http";
import { useCallback, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GROQ_MODELS_URL = "https://api.groq.com/openai/v1/models";

type GroqModelPickerProps = {
  apiKey: string | null;
  selectedModel: string | null;
  onModelSelect: (model: string | null) => void;
  disabled?: boolean;
};

export const GroqModelPicker = ({
  apiKey,
  selectedModel,
  onModelSelect,
  disabled = false,
}: GroqModelPickerProps) => {
  const [models, setModels] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchModels = useCallback(async () => {
    if (!apiKey) {
      setModels([]);
      setIsAvailable(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(GROQ_MODELS_URL, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!response.ok) {
        setIsAvailable(false);
        setModels([]);
        return;
      }

      setIsAvailable(true);
      const payload = (await response.json()) as {
        data?: Array<{ id?: string }>;
      };
      const fetched = (payload.data ?? [])
        .map((m) => (m.id ?? "").trim())
        .filter(Boolean)
        .sort();
      setModels(fetched);
    } catch (error) {
      console.error("Failed to fetch Groq models", error);
      setIsAvailable(false);
      setModels([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    void fetchModels();
  }, [fetchModels]);

  if (!apiKey) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        <FormattedMessage defaultMessage="Add an API key to see available models" />
      </p>
    );
  }

  if (isLoading && isAvailable === null) {
    return (
      <div className="flex items-center gap-2 py-2">
        <RiLoader4Line className="h-4 w-4 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          <FormattedMessage defaultMessage="Loading models..." />
        </p>
      </div>
    );
  }

  if (isAvailable === false) {
    return (
      <div className="flex items-center gap-2 py-2">
        <RiErrorWarningLine className="h-4 w-4 text-destructive" />
        <p className="text-sm text-destructive">
          <FormattedMessage defaultMessage="Unable to fetch models from Groq." />
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label><FormattedMessage defaultMessage="Model" /></Label>
      <Select
        value={selectedModel ?? ""}
        onValueChange={(val) => onModelSelect(val || null)}
        disabled={disabled || !isAvailable}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model} value={model}>
              {model}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
