import { RiErrorWarningLine, RiLoader4Line } from "@remixicon/react";
import { useCallback, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import {
  OllamaRepo,
  OpenAICompatibleRepo,
} from "../../repos/ollama.repo";
import { OLLAMA_DEFAULT_URL } from "../../utils/ollama.utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OllamaModelPickerProps = {
  baseUrl: string | null;
  apiKey?: string | null;
  selectedModel: string | null;
  onModelSelect: (model: string | null) => void;
  disabled?: boolean;
  provider?: "ollama" | "openai-compatible";
};

export const OllamaModelPicker = ({
  baseUrl,
  apiKey,
  selectedModel,
  onModelSelect,
  disabled = false,
  provider = "ollama",
}: OllamaModelPickerProps) => {
  const [models, setModels] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const effectiveUrl = baseUrl || OLLAMA_DEFAULT_URL;

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    try {
      const repo =
        provider === "openai-compatible"
          ? new OpenAICompatibleRepo(effectiveUrl, apiKey || undefined)
          : new OllamaRepo(effectiveUrl, apiKey || undefined);
      const available = await repo.checkAvailability();
      setIsAvailable(available);

      if (available) {
        const fetchedModels = await repo.getAvailableModels();
        setModels(fetchedModels);
      } else {
        setModels([]);
      }
    } catch (error) {
      console.error("Failed to fetch Ollama models", error);
      setIsAvailable(false);
      setModels([]);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUrl, apiKey, provider]);

  useEffect(() => {
    void fetchModels();
  }, [fetchModels]);

  useEffect(() => {
    const interval = setInterval(() => {
      void fetchModels();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchModels]);

  if (isLoading && isAvailable === null) {
    return (
      <div className="flex items-center gap-2 py-2">
        <RiLoader4Line className="h-4 w-4 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          <FormattedMessage defaultMessage="Checking Ollama connection..." />
        </p>
      </div>
    );
  }

  if (isAvailable === false) {
    return (
      <div className="flex items-center gap-2 py-2">
        <RiErrorWarningLine className="h-4 w-4 text-destructive" />
        <p className="text-sm text-destructive">
          <FormattedMessage defaultMessage="Unable to connect to Ollama at the specified URL." />
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
