import { RiAddLine, RiDeleteBinLine, RiLoader4Line } from "@remixicon/react";
import {
  aldeaTestIntegration,
  assemblyaiTestIntegration,
  AZURE_OPENAI_MODELS,
  azureOpenAITestIntegration,
  azureTestIntegration,
  CLAUDE_MODELS,
  claudeTestIntegration,
  deepgramTestIntegration,
  DEEPSEEK_MODELS,
  deepseekTestIntegration,
  elevenlabsTestIntegration,
  GEMINI_GENERATE_TEXT_MODELS,
  geminiTestIntegration,
  GEMINI_TRANSCRIPTION_MODELS,
  GENERATE_TEXT_MODELS,
  groqTestIntegration,
  OPENAI_GENERATE_TEXT_MODELS,
  OPENAI_TRANSCRIPTION_MODELS,
  openaiCompatibleTestIntegration,
  openaiTestIntegration,
  OPENROUTER_FAVORITE_MODELS,
  openrouterTestIntegration,
  TRANSCRIPTION_MODELS,
} from "@repo/voice-ai";
import { speachesTestIntegration } from "../../utils/speaches.utils";
import { useCallback, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import {
  createApiKey,
  deleteApiKey,
  loadApiKeys,
  updateApiKey,
} from "../../actions/api-key.actions";
import { showErrorSnackbar, showSnackbar } from "../../actions/app.actions";
import {
  SettingsApiKey,
  SettingsApiKeyProvider,
} from "../../state/settings.state";
import { useAppStore } from "../../store";
import {
  OLLAMA_DEFAULT_URL,
  ollamaTestIntegration,
} from "../../utils/ollama.utils";
import { GroqModelPicker } from "./GroqModelPicker";
import { OllamaModelPicker } from "./OllamaModelPicker";
import { OpenRouterModelPicker } from "./OpenRouterModelPicker";
import { OpenRouterProviderRouting } from "./OpenRouterProviderRouting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ApiKeyListContext = "transcription" | "post-processing";

type ApiKeyListProps = {
  selectedApiKeyId: string | null;
  onChange: (id: string | null) => void;
  context: ApiKeyListContext;
};

type AddApiKeyCardProps = {
  onSave: (
    name: string,
    provider: SettingsApiKeyProvider,
    key: string,
    baseUrl?: string,
    azureRegion?: string,
    transcriptionModel?: string,
  ) => Promise<void>;
  onCancel: () => void;
  context: ApiKeyListContext;
};

const AddApiKeyCard = ({ onSave, onCancel, context }: AddApiKeyCardProps) => {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState<SettingsApiKeyProvider>("groq");
  const [key, setKey] = useState("");
  const [ollamaUrl, setOllamaUrl] = useState("");
  const [azureRegion, setAzureRegion] = useState("");
  const [azureOpenAIEndpoint, setAzureOpenAIEndpoint] = useState("");
  const [speachesUrl, setSpeachesUrl] = useState("");
  const [speachesModel, setSpeachesModel] = useState("");
  const [saving, setSaving] = useState(false);

  const isOllama = provider === "ollama";
  const isOpenAICompatible = provider === "openai-compatible";
  const isOllamaLike = isOllama || isOpenAICompatible;
  const isAzure = provider === "azure";
  const isAzureOpenAI = isAzure && context === "post-processing";
  const isAzureSTT = isAzure && context === "transcription";
  const isSpeaches = provider === "speaches";

  const canSave = isOllamaLike
    ? !!name
    : isSpeaches
      ? !!name
      : isAzureSTT
        ? !!name && !!key && !!azureRegion
        : isAzureOpenAI
          ? !!name && !!key && !!azureOpenAIEndpoint
          : !!name && !!key;

  const handleSave = useCallback(async () => {
    if (!canSave || saving) {
      return;
    }

    setSaving(true);
    try {
      const keyToSave = key || "";
      const baseUrl = isOllamaLike
        ? ollamaUrl || OLLAMA_DEFAULT_URL
        : isSpeaches
          ? speachesUrl || "http://localhost:8000"
          : isAzureOpenAI
            ? azureOpenAIEndpoint
            : undefined;
      const azureRegionValue = isAzureSTT ? azureRegion : undefined;
      const transcriptionModelValue =
        isSpeaches || (isOpenAICompatible && context === "transcription")
          ? speachesModel || undefined
          : undefined;
      await onSave(name, provider, keyToSave, baseUrl, azureRegionValue, transcriptionModelValue);
      setName("");
      setKey("");
      setOllamaUrl("");
      setAzureRegion("");
      setAzureOpenAIEndpoint("");
      setSpeachesUrl("");
      setSpeachesModel("");
    } catch (error) {
      console.error("Failed to save API key", error);
    } finally {
      setSaving(false);
    }
  }, [
    canSave,
    isOllamaLike,
    isSpeaches,
    isAzureOpenAI,
    isAzureSTT,
    name,
    key,
    ollamaUrl,
    speachesUrl,
    speachesModel,
    azureRegion,
    azureOpenAIEndpoint,
    provider,
    onSave,
    saving,
  ]);

  return (
    <div className="rounded-lg border border-border p-4 flex flex-col gap-3">
      <div className="space-y-1.5">
        <Label><FormattedMessage defaultMessage="Key name" /></Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., My API Key"
          disabled={saving}
        />
      </div>

      <div className="space-y-1.5">
        <Label><FormattedMessage defaultMessage="Provider" /></Label>
        <Select
          value={provider}
          onValueChange={(val) => setProvider(val as SettingsApiKeyProvider)}
          disabled={saving}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="groq">Groq</SelectItem>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="gemini">Gemini</SelectItem>
            {context === "post-processing" && <SelectItem value="openrouter">OpenRouter</SelectItem>}
            {context === "post-processing" && <SelectItem value="ollama">Ollama</SelectItem>}
            <SelectItem value="openai-compatible">OpenAI Compatible</SelectItem>
            {context === "post-processing" && <SelectItem value="deepseek">DeepSeek</SelectItem>}
            {context === "post-processing" && <SelectItem value="claude">Claude</SelectItem>}
            {context === "post-processing" && <SelectItem value="azure">Azure OpenAI</SelectItem>}
            {context === "transcription" && <SelectItem value="aldea">Aldea</SelectItem>}
            {context === "transcription" && <SelectItem value="assemblyai">AssemblyAI</SelectItem>}
            {context === "transcription" && <SelectItem value="deepgram">Deepgram</SelectItem>}
            {context === "transcription" && <SelectItem value="elevenlabs">ElevenLabs</SelectItem>}
            {context === "transcription" && <SelectItem value="azure">Azure</SelectItem>}
            {context === "transcription" && <SelectItem value="speaches">Speaches</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      {isAzure ? (
        context === "transcription" ? (
          <>
            <div className="space-y-1.5">
              <Label><FormattedMessage defaultMessage="Azure Region" /></Label>
              <Input
                value={azureRegion}
                onChange={(e) => setAzureRegion(e.target.value)}
                placeholder="e.g., eastus, westus, northeurope"
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                <FormattedMessage defaultMessage="Azure service region for Speech-to-Text" />
              </p>
            </div>
            <div className="space-y-1.5">
              <Label><FormattedMessage defaultMessage="Subscription Key" /></Label>
              <Input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Paste your Azure subscription key"
                type="password"
                disabled={saving}
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label><FormattedMessage defaultMessage="Azure OpenAI Endpoint" /></Label>
              <Input
                value={azureOpenAIEndpoint}
                onChange={(e) => setAzureOpenAIEndpoint(e.target.value)}
                placeholder="https://my-resource.openai.azure.com"
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                <FormattedMessage defaultMessage="Your Azure OpenAI resource endpoint URL" />
              </p>
            </div>
            <div className="space-y-1.5">
              <Label><FormattedMessage defaultMessage="API Key" /></Label>
              <Input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Paste your Azure OpenAI API key"
                type="password"
                disabled={saving}
              />
            </div>
          </>
        )
      ) : isOllamaLike ? (
        <>
          <div className="space-y-1.5">
            <Label><FormattedMessage defaultMessage="Base URL" /></Label>
            <Input
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              placeholder={OLLAMA_DEFAULT_URL}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              <FormattedMessage defaultMessage="Leave empty to use the default URL" />
            </p>
          </div>
          <div className="space-y-1.5">
            <Label><FormattedMessage defaultMessage="API key (optional)" /></Label>
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Leave empty if not required"
              type="password"
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              <FormattedMessage defaultMessage="Only needed if your instance requires authentication" />
            </p>
          </div>
          {isOpenAICompatible && context === "transcription" && (
            <div className="space-y-1.5">
              <Label><FormattedMessage defaultMessage="Model" /></Label>
              <Input
                value={speachesModel}
                onChange={(e) => setSpeachesModel(e.target.value)}
                placeholder="whisper-1"
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                <FormattedMessage defaultMessage="Transcription model name (e.g. whisper-1)" />
              </p>
            </div>
          )}
        </>
      ) : isSpeaches ? (
        <>
          <div className="space-y-1.5">
            <Label><FormattedMessage defaultMessage="Speaches URL" /></Label>
            <Input
              value={speachesUrl}
              onChange={(e) => setSpeachesUrl(e.target.value)}
              placeholder="http://localhost:8000"
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              <FormattedMessage defaultMessage="URL of your local Speaches Docker instance" />
            </p>
          </div>
          <div className="space-y-1.5">
            <Label><FormattedMessage defaultMessage="Model" /></Label>
            <Input
              value={speachesModel}
              onChange={(e) => setSpeachesModel(e.target.value)}
              placeholder="Systran/faster-whisper-large-v3"
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              <FormattedMessage defaultMessage="Whisper model ID available in your Speaches instance" />
            </p>
          </div>
        </>
      ) : (
        <div className="space-y-1.5">
          <Label><FormattedMessage defaultMessage="API key" /></Label>
          <Input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Paste your API key"
            type="password"
            disabled={saving}
          />
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          <FormattedMessage defaultMessage="Cancel" />
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!canSave || saving}>
          {saving ? (
            <FormattedMessage defaultMessage="Saving..." />
          ) : (
            <FormattedMessage defaultMessage="Save" />
          )}
        </Button>
      </div>
    </div>
  );
};

const testApiKey = async (
  apiKey: SettingsApiKey,
  context: ApiKeyListContext,
): Promise<boolean> => {
  if (apiKey.provider === "ollama") {
    return ollamaTestIntegration({
      baseUrl: apiKey.baseUrl || OLLAMA_DEFAULT_URL,
      apiKey: apiKey.keyFull || undefined,
    });
  }

  if (apiKey.provider === "openai-compatible") {
    return openaiCompatibleTestIntegration({
      baseUrl: apiKey.baseUrl || "http://127.0.0.1:8080",
      apiKey: apiKey.keyFull || undefined,
    });
  }

  if (apiKey.provider === "speaches") {
    return speachesTestIntegration({
      baseUrl: apiKey.baseUrl || "http://localhost:8000",
    });
  }

  if (!apiKey.keyFull) {
    throw new Error("The stored API key value is unavailable.");
  }

  switch (apiKey.provider) {
    case "groq":
      return groqTestIntegration({ apiKey: apiKey.keyFull });
    case "openai":
      return openaiTestIntegration({ apiKey: apiKey.keyFull });
    case "openrouter":
      return openrouterTestIntegration({ apiKey: apiKey.keyFull });
    case "aldea":
      return aldeaTestIntegration({ apiKey: apiKey.keyFull });
    case "assemblyai":
      return assemblyaiTestIntegration({ apiKey: apiKey.keyFull });
    case "deepgram":
      return deepgramTestIntegration({ apiKey: apiKey.keyFull });
    case "elevenlabs":
      return elevenlabsTestIntegration({ apiKey: apiKey.keyFull });
    case "deepseek":
      return deepseekTestIntegration({ apiKey: apiKey.keyFull });
    case "gemini":
      return geminiTestIntegration({ apiKey: apiKey.keyFull });
    case "claude":
      return claudeTestIntegration({ apiKey: apiKey.keyFull });
    case "azure":
      if (context === "post-processing") {
        if (!apiKey.baseUrl) {
          throw new Error("Azure OpenAI endpoint is required.");
        }
        return azureOpenAITestIntegration({
          apiKey: apiKey.keyFull,
          endpoint: apiKey.baseUrl,
        });
      } else {
        if (!apiKey.azureRegion) {
          throw new Error("Azure region is required.");
        }
        return azureTestIntegration({
          subscriptionKey: apiKey.keyFull,
          region: apiKey.azureRegion,
        });
      }
    default:
      throw new Error("Testing is not available for this provider.");
  }
};

const getModelsForProvider = (
  provider: SettingsApiKeyProvider,
  context: ApiKeyListContext,
): readonly string[] => {
  switch (provider) {
    case "groq":
      return context === "transcription"
        ? TRANSCRIPTION_MODELS
        : GENERATE_TEXT_MODELS;
    case "openai":
      return context === "transcription"
        ? OPENAI_TRANSCRIPTION_MODELS
        : OPENAI_GENERATE_TEXT_MODELS;
    case "gemini":
      return context === "transcription"
        ? GEMINI_TRANSCRIPTION_MODELS
        : GEMINI_GENERATE_TEXT_MODELS;
    case "openrouter":
      return context === "transcription" ? [] : OPENROUTER_FAVORITE_MODELS;
    case "ollama":
      return [];
    case "openai-compatible":
      return [];
    case "deepseek":
      return context === "transcription" ? [] : DEEPSEEK_MODELS;
    case "claude":
      return context === "transcription" ? [] : CLAUDE_MODELS;
    case "azure":
      return context === "transcription" ? [] : AZURE_OPENAI_MODELS;
    case "aldea":
      return [];
    case "assemblyai":
      return [];
    case "deepgram":
      return [];
    case "elevenlabs":
      return [];
    case "speaches":
      return [];
    default:
      return [];
  }
};

const getModelForContext = (
  apiKey: SettingsApiKey,
  context: ApiKeyListContext,
): string | null => {
  return context === "transcription"
    ? (apiKey.transcriptionModel ?? null)
    : (apiKey.postProcessingModel ?? null);
};

const ApiKeyCard = ({
  apiKey,
  selected,
  onSelect,
  onTest,
  onDelete,
  testing,
  deleting,
  onModelChange,
  context,
}: {
  apiKey: SettingsApiKey;
  selected: boolean;
  onSelect: () => void;
  onTest: () => void;
  testing: boolean;
  onDelete: () => void;
  deleting: boolean;
  onModelChange: (model: string | null) => void;
  context: ApiKeyListContext;
}) => {
  const models = getModelsForProvider(apiKey.provider, context);
  const currentModel = getModelForContext(apiKey, context) ?? models[0] ?? null;

  return (
    <div
      onClick={onSelect}
      className={`rounded-lg border p-4 cursor-pointer transition-all flex flex-col gap-4 w-full ${
        selected
          ? "border-primary ring-1 ring-primary"
          : "border-border hover:border-muted-foreground/40"
      }`}
    >
      <div className="flex items-center justify-between gap-4 w-full">
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-sm font-semibold">{apiKey.name}</p>
          <p className="text-xs text-muted-foreground">
            {apiKey.provider.toUpperCase()}
          </p>
          {apiKey.keySuffix ? (
            <p className="text-xs text-muted-foreground">
              <FormattedMessage
                defaultMessage="Ends with {suffix}"
                values={{ suffix: apiKey.keySuffix }}
              />
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onTest();
            }}
            disabled={testing || deleting}
          >
            {testing ? (
              <FormattedMessage defaultMessage="Testing..." />
            ) : (
              <FormattedMessage defaultMessage="Test" />
            )}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                disabled={deleting || testing}
              >
                <RiDeleteBinLine className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <FormattedMessage defaultMessage="Delete key" />
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {apiKey.provider === "openrouter" && context === "post-processing" ? (
        <div onClick={(e) => e.stopPropagation()}>
          <OpenRouterModelPicker
            apiKeyId={apiKey.id}
            selectedModel={currentModel}
            onModelSelect={onModelChange}
            disabled={testing || deleting}
          />
          <OpenRouterProviderRouting
            apiKeyId={apiKey.id}
            disabled={testing || deleting}
          />
        </div>
      ) : (apiKey.provider === "ollama" ||
          apiKey.provider === "openai-compatible") &&
        context === "post-processing" ? (
        <div onClick={(e) => e.stopPropagation()}>
          <OllamaModelPicker
            baseUrl={apiKey.baseUrl ?? null}
            apiKey={apiKey.keyFull}
            selectedModel={currentModel}
            onModelSelect={onModelChange}
            disabled={testing || deleting}
            provider={apiKey.provider}
          />
        </div>
      ) : apiKey.provider === "openai-compatible" &&
        context === "transcription" ? (
        <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
          <Label><FormattedMessage defaultMessage="Model" /></Label>
          <Input
            value={currentModel ?? ""}
            onChange={(e) => onModelChange(e.target.value || null)}
            placeholder="whisper-1"
            disabled={testing || deleting}
          />
          <p className="text-xs text-muted-foreground">
            <FormattedMessage defaultMessage="Transcription model name (e.g. whisper-1)" />
          </p>
        </div>
      ) : apiKey.provider === "speaches" ? (
        <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
          <Label><FormattedMessage defaultMessage="Model" /></Label>
          <Input
            value={currentModel ?? ""}
            onChange={(e) => onModelChange(e.target.value || null)}
            placeholder="Systran/faster-whisper-large-v3"
            disabled={testing || deleting}
          />
          <p className="text-xs text-muted-foreground">
            <FormattedMessage defaultMessage="Whisper model ID available in your Speaches instance" />
          </p>
        </div>
      ) : apiKey.provider === "groq" ? (
        <div onClick={(e) => e.stopPropagation()}>
          <GroqModelPicker
            apiKey={apiKey.keyFull ?? null}
            selectedModel={currentModel}
            onModelSelect={onModelChange}
            disabled={testing || deleting}
          />
        </div>
      ) : models.length > 0 ? (
        <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
          <Label><FormattedMessage defaultMessage="Model" /></Label>
          <Select
            value={currentModel ?? ""}
            onValueChange={(val) => onModelChange(val || null)}
            disabled={testing || deleting}
          >
            <SelectTrigger>
              <SelectValue />
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
      ) : null}
    </div>
  );
};

const generateApiKeyId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const ApiKeyList = ({
  selectedApiKeyId,
  onChange,
  context,
}: ApiKeyListProps) => {
  const allApiKeys = useAppStore((state) => state.settings.apiKeys);

  const apiKeys = allApiKeys.filter((key) => {
    if (
      context === "transcription" &&
      (key.provider === "openrouter" ||
        key.provider === "ollama" ||
        key.provider === "deepseek" ||
        key.provider === "claude")
    ) {
      return false;
    }
    if (
      context === "post-processing" &&
      (key.provider === "aldea" ||
        key.provider === "assemblyai" ||
        key.provider === "deepgram" ||
        key.provider === "elevenlabs" ||
        key.provider === "speaches")
    ) {
      return false;
    }
    if (key.provider === "azure") {
      if (context === "transcription") {
        return !!key.azureRegion;
      } else {
        return !!key.baseUrl;
      }
    }
    return true;
  });
  const status = useAppStore((state) => state.settings.apiKeysStatus);
  const [showAddCard, setShowAddCard] = useState(false);
  const [testingApiKeyId, setTestingApiKeyId] = useState<string | null>(null);
  const [apiKeyToDelete, setApiKeyToDelete] = useState<SettingsApiKey | null>(
    null,
  );
  const [deletingApiKeyId, setDeletingApiKeyId] = useState<string | null>(null);

  useEffect(() => {
    if (apiKeys.length === 0) {
      return;
    }

    if (selectedApiKeyId === null) {
      onChange(apiKeys[0]?.id ?? null);
      return;
    }

    const exists = apiKeys.some((key) => key.id === selectedApiKeyId);
    if (!exists) {
      onChange(apiKeys[0]?.id ?? null);
    }
  }, [apiKeys, selectedApiKeyId, onChange]);

  const handleAddApiKey = useCallback(
    async (
      name: string,
      provider: SettingsApiKeyProvider,
      key: string,
      baseUrl?: string,
      azureRegion?: string,
      transcriptionModel?: string,
    ) => {
      const created = await createApiKey({
        id: generateApiKeyId(),
        name,
        provider,
        key,
        baseUrl,
        azureRegion,
      });

      if (transcriptionModel) {
        await updateApiKey({ id: created.id, transcriptionModel });
      }

      onChange(created.id);
      setShowAddCard(false);
    },
    [onChange],
  );

  const handleTestApiKey = useCallback(
    async (apiKey: SettingsApiKey) => {
      setTestingApiKeyId(apiKey.id);
      try {
        const success = await testApiKey(apiKey, context);
        if (success) {
          showSnackbar("Integration successful", { mode: "success" });
        } else {
          showErrorSnackbar("Integration failed. Provide a valid API key.");
        }
      } catch (error) {
        showErrorSnackbar(
          error instanceof Error ? error.message : "API key test failed.",
        );
      } finally {
        setTestingApiKeyId(null);
      }
    },
    [context],
  );

  const handleRequestDelete = useCallback((apiKey: SettingsApiKey) => {
    setApiKeyToDelete(apiKey);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    if (deletingApiKeyId !== null) {
      return;
    }
    setApiKeyToDelete(null);
  }, [deletingApiKeyId]);

  const handleConfirmDelete = useCallback(async () => {
    if (!apiKeyToDelete) {
      return;
    }

    setDeletingApiKeyId(apiKeyToDelete.id);
    try {
      await deleteApiKey(apiKeyToDelete.id);
      showSnackbar("API key deleted", { mode: "success" });
      setApiKeyToDelete(null);
    } catch {
      // Errors are surfaced via deleteApiKey.
    } finally {
      setDeletingApiKeyId(null);
    }
  }, [apiKeyToDelete, showSnackbar, deleteApiKey]);

  const handleRetryLoad = useCallback(() => {
    void loadApiKeys();
  }, []);

  const handleModelChange = useCallback(
    async (apiKeyId: string, model: string | null) => {
      try {
        if (context === "transcription") {
          await updateApiKey({ id: apiKeyId, transcriptionModel: model });
        } else {
          await updateApiKey({ id: apiKeyId, postProcessingModel: model });
        }
      } catch {
        // Errors are surfaced via updateApiKey.
      }
    },
    [context],
  );

  const loadingState = (
    <div className="flex flex-col items-center gap-2">
      <RiLoader4Line className="h-5 w-5 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        <FormattedMessage defaultMessage="Loading API keys…" />
      </p>
    </div>
  );

  const errorState = (
    <div className="flex flex-col items-start gap-3">
      <p className="text-sm font-semibold">
        <FormattedMessage defaultMessage="Failed to load API keys" />
      </p>
      <p className="text-sm text-muted-foreground">
        <FormattedMessage defaultMessage="We couldn't load your saved API keys. Please try again." />
      </p>
      <Button variant="outline" onClick={handleRetryLoad}>
        <FormattedMessage defaultMessage="Retry" />
      </Button>
    </div>
  );

  const emptyState = (
    <div className="flex flex-col items-start gap-3">
      <p className="text-sm font-semibold">
        <FormattedMessage defaultMessage="No API keys yet" />
      </p>
      <p className="text-sm text-muted-foreground">
        <FormattedMessage defaultMessage="Connect a transcription provider like Groq with your API key." />
      </p>
      <Button onClick={() => setShowAddCard(true)}>
        <RiAddLine className="mr-2 h-4 w-4" />
        <FormattedMessage defaultMessage="Add API key" />
      </Button>
    </div>
  );

  const shouldShowLoading = status === "loading" && apiKeys.length === 0;
  const shouldShowError = status === "error" && apiKeys.length === 0;
  const shouldShowEmpty =
    apiKeys.length === 0 &&
    !showAddCard &&
    !shouldShowLoading &&
    !shouldShowError;

  return (
    <div className="flex flex-col gap-2 w-full">
      {shouldShowLoading ? (
        loadingState
      ) : shouldShowError ? (
        errorState
      ) : shouldShowEmpty ? (
        emptyState
      ) : (
        <div className="flex flex-col gap-3 items-stretch w-full">
          {apiKeys.map((apiKey) => (
            <ApiKeyCard
              key={apiKey.id}
              apiKey={apiKey}
              selected={selectedApiKeyId === apiKey.id}
              onSelect={() => onChange(apiKey.id)}
              onTest={() => handleTestApiKey(apiKey)}
              testing={testingApiKeyId === apiKey.id}
              onDelete={() => handleRequestDelete(apiKey)}
              deleting={deletingApiKeyId === apiKey.id}
              onModelChange={(model) => handleModelChange(apiKey.id, model)}
              context={context}
            />
          ))}
        </div>
      )}
      {showAddCard ? (
        <AddApiKeyCard
          onSave={handleAddApiKey}
          onCancel={() => setShowAddCard(false)}
          context={context}
        />
      ) : apiKeys.length > 0 || shouldShowError ? (
        <Button
          variant="outline"
          onClick={() => setShowAddCard(true)}
          className="self-start"
        >
          <RiAddLine className="mr-2 h-4 w-4" />
          <FormattedMessage defaultMessage="Add another key" />
        </Button>
      ) : null}

      <Dialog open={apiKeyToDelete !== null} onOpenChange={(open) => !open && handleCloseDeleteDialog()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              <FormattedMessage defaultMessage="Delete API key" />
            </DialogTitle>
            <DialogDescription>
              <FormattedMessage
                defaultMessage="Are you sure you want to delete the API key {keyName}?"
                values={{
                  keyName: (
                    <span className="font-semibold">
                      {apiKeyToDelete?.name ?? "this API key"}
                    </span>
                  ),
                }}
              />
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <FormattedMessage defaultMessage="Removing the key signs you out of that provider on this device." />
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDeleteDialog}
              disabled={deletingApiKeyId !== null}
            >
              <FormattedMessage defaultMessage="Cancel" />
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deletingApiKeyId !== null}
            >
              {deletingApiKeyId !== null ? (
                <FormattedMessage defaultMessage="Deleting..." />
              ) : (
                <FormattedMessage defaultMessage="Delete" />
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
