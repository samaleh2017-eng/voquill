# VoQuill Agent Mode — Prompt d'intégration complet

## Vue d'ensemble

Le mode Agent est un système conversationnel basé sur une boucle **Decision → Tool Execution → Response** orchestrée par 3 appels LLM distincts. L'agent lit le contexte écran, rédige des brouillons, et colle du texte dans n'importe quel champ de saisie.

### Flux global

```
Utilisateur parle → Transcription audio → rawTranscript
  → Strategy.handleTranscript(rawTranscript)
    → Agent.run(rawTranscript)
      → [Boucle max 16 itérations]
        → Decision LLM → choix: "get_context" | "draft" | "write_to_text_field" | "stop" | "respond"
        → Si outil choisi:
          → Tool Args LLM → génère les arguments
          → Tool.execute(args) → ToolResult
          → Retour à Decision LLM avec résultats
        → Si "respond":
          → Final Response LLM → réponse textuelle
    → Mise à jour UI via Zustand store
  → shouldContinue: true/false
```

### 2 stratégies

- **AgentStrategy** (mode `cloud` / `api`) — Agent local avec outils built-in + MCP
- **OpenClawAgentStrategy** (mode `openclaw`) — Délègue à un gateway WebSocket externe

---

## FICHIER 1 : Types partagés — `packages/types/src/common.types.ts` (extrait)

```typescript
export type TranscriptionMode = "local" | "api" | "cloud";
export type PostProcessingMode = "none" | "api" | "cloud";
export type AgentMode = PostProcessingMode | "openclaw";
```

---

## FICHIER 2 : Types AI locaux — `types/ai.types.ts`

```typescript
import type { AgentMode, PostProcessingMode, TranscriptionMode } from "@repo/types";

export type { AgentMode, PostProcessingMode, TranscriptionMode };

export const DEFAULT_TRANSCRIPTION_MODE: TranscriptionMode = "local";
export const DEFAULT_MODEL_SIZE = "base";
export const CPU_DEVICE_VALUE = "cpu";
export const DEFAULT_POST_PROCESSING_MODE: PostProcessingMode = "none";
export const DEFAULT_AGENT_MODE: AgentMode = "none";
```

---

## FICHIER 3 : Types agent — `types/agent.types.ts`

```typescript
import { z } from "zod";

export const DecisionResponseSchema = z.object({
  reasoning: z.string(),
  choice: z.string(),
});
export type DecisionResponse = z.infer<typeof DecisionResponseSchema>;

export const FinalResponseSchema = z.object({
  response: z.string(),
});
export type FinalResponse = z.infer<typeof FinalResponseSchema>;

export const ToolResultSchema = z.object({
  success: z.boolean(),
  output: z.record(z.unknown()),
});
export type ToolResult = z.infer<typeof ToolResultSchema>;

export type ToolExecution = {
  name: string;
  displayName: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  didSucceed: boolean;
};

export type UserMessage = {
  type: "user";
  content: string;
};

export type AssistantMessage = {
  type: "assistant";
  tools: ToolExecution[];
  response: string;
  isError: boolean;
};

export type AgentMessage = UserMessage | AssistantMessage;

export type AgentRunResult = {
  response: string;
  isError: boolean;
  history: AgentMessage[];
};

export type AgentRunOptions = {
  onToolExecuted?: (tool: ToolExecution) => void;
};
```

---

## FICHIER 4 : Types d'outils — `types/tool.types.ts`

```typescript
import { z } from "zod";

export const ShowToastParamsSchema = z.object({
  title: z.string().describe("The title of the toast notification"),
  message: z.string().describe("The message body of the toast notification"),
});
export type ShowToastParams = z.infer<typeof ShowToastParamsSchema>;

export const StopParamsSchema = z.object({
  reason: z.string().describe("Brief explanation for why the session is ending"),
});
export type StopParams = z.infer<typeof StopParamsSchema>;

export const GetContextParamsSchema = z.object({});
export type GetContextParams = z.infer<typeof GetContextParamsSchema>;

export const DraftParamsSchema = z.object({
  text: z.string().describe("The draft text to store"),
});
export type DraftParams = z.infer<typeof DraftParamsSchema>;

export const WriteToTextFieldParamsSchema = z.object({});
export type WriteToTextFieldParams = z.infer<typeof WriteToTextFieldParamsSchema>;

export const ToolParamsSchema = z.union([
  ShowToastParamsSchema,
  StopParamsSchema,
  GetContextParamsSchema,
  DraftParamsSchema,
  WriteToTextFieldParamsSchema,
]);
export type ToolParams = z.infer<typeof ToolParamsSchema>;

export const TypedToolCallSchema = z.discriminatedUnion("name", [
  z.object({ name: z.literal("show_toast"), arguments: ShowToastParamsSchema }),
  z.object({ name: z.literal("stop"), arguments: StopParamsSchema }),
  z.object({ name: z.literal("get_context"), arguments: GetContextParamsSchema }),
  z.object({ name: z.literal("draft"), arguments: DraftParamsSchema }),
  z.object({ name: z.literal("write_to_text_field"), arguments: WriteToTextFieldParamsSchema }),
]);
export type TypedToolCall = z.infer<typeof TypedToolCallSchema>;
```

---

## FICHIER 5 : Types fenêtre agent — `types/agent-window.types.ts`

```typescript
export type AgentWindowMessageSender = "me" | "agent";

export type AgentWindowMessage = {
  text: string;
  sender: AgentWindowMessageSender;
  isError?: boolean;
  tools?: string[];
  draft?: string;
};

export type AgentWindowState = {
  messages: AgentWindowMessage[];
};
```

---

## FICHIER 6 : Types overlay — `types/overlay.types.ts`

```typescript
export type OverlayPhase = "idle" | "recording" | "loading";
```

---

## FICHIER 7 : Types de stratégie — `types/strategy.types.ts`

```typescript
import type { AppTarget, Nullable } from "@repo/types";
import type { RefObject } from "react";
import type { PostProcessMetadata, TranscribeAudioMetadata } from "../actions/transcribe.actions";
import type { TextFieldInfo } from "./accessibility.types";
import type { ToastAction } from "./toast.types";
import type { StopRecordingResponse } from "./transcription-session.types";

export type StrategyValidationError = {
  title: string;
  body: string;
  action: Nullable<ToastAction>;
};

export type HandleTranscriptParams = {
  rawTranscript: string;
  processedTranscript?: string | null;
  sessionPostProcessMetadata?: PostProcessMetadata;
  toneId: string | null;
  a11yInfo: TextFieldInfo | null;
  currentApp: AppTarget | null;
  loadingToken: symbol | null;
  audio: StopRecordingResponse;
  transcriptionMetadata: TranscribeAudioMetadata;
  transcriptionWarnings: string[];
};

export type HandleTranscriptResult = {
  shouldContinue: boolean;
  transcript: string | null;
  sanitizedTranscript: string | null;
  postProcessMetadata: PostProcessMetadata;
  postProcessWarnings: string[];
};

export type StrategyContext = {
  overlayLoadingTokenRef: RefObject<symbol | null>;
};
```

---

## FICHIER 8 : Store Zustand — `store/index.ts`

```typescript
import { produce } from "immer";
import { isEqual } from "lodash-es";
import { createWithEqualityFn } from "zustand/traditional";
import { INITIAL_APP_STATE, type AppState } from "../state/app.state";

export const useAppStore = createWithEqualityFn<AppState>(
  () => INITIAL_APP_STATE,
  isEqual,
);

export const setAppState = useAppStore.setState;
export const getAppState = useAppStore.getState;

export const produceAppState = (fn: (draft: AppState) => void) => {
  setAppState((state) => produce(state, fn));
};
```

---

## FICHIER 9 : État agent (Zustand) — `state/agent.state.ts`

```typescript
import type { AgentWindowState } from "../types/agent-window.types";
import type { OverlayPhase } from "../types/overlay.types";

export type AgentState = {
  overlayPhase: OverlayPhase;
  windowState: AgentWindowState | null;
};

export const INITIAL_AGENT_STATE: AgentState = {
  overlayPhase: "idle",
  windowState: null,
};
```

---

## FICHIER 10 : Settings State (contient `SettingsAgentModeState`) — `state/settings.state.ts`

```typescript
import { ApiKey, ApiKeyProvider, OpenRouterModel, OpenRouterProvider } from "@repo/types";
import {
  type AgentMode, CPU_DEVICE_VALUE, DEFAULT_AGENT_MODE,
  DEFAULT_MODEL_SIZE, DEFAULT_POST_PROCESSING_MODE, DEFAULT_TRANSCRIPTION_MODE,
  type PostProcessingMode, type TranscriptionMode,
} from "../types/ai.types";
import { ActionStatus } from "../types/state.types";

export type SettingsApiKeyProvider = ApiKeyProvider;
export type SettingsApiKey = ApiKey;

export type SettingsTranscriptionState = {
  mode: TranscriptionMode;
  modelSize: string;
  device: string;
  selectedApiKeyId: string | null;
  gpuEnumerationEnabled: boolean;
};

export type SettingsGenerativeState = {
  mode: PostProcessingMode;
  selectedApiKeyId: string | null;
};

export type SettingsAgentModeState = Omit<SettingsGenerativeState, "mode"> & {
  mode: AgentMode;
  openclawGatewayUrl: string | null;
  openclawToken: string | null;
};

export type SettingsState = {
  changePasswordDialogOpen: boolean;
  deleteAccountDialog: boolean;
  microphoneDialogOpen: boolean;
  audioDialogOpen: boolean;
  shortcutsDialogOpen: boolean;
  clearLocalDataDialogOpen: boolean;
  profileDialogOpen: boolean;
  aiTranscriptionDialogOpen: boolean;
  aiPostProcessingDialogOpen: boolean;
  agentModeDialogOpen: boolean;
  moreSettingsDialogOpen: boolean;
  dictationLanguageDialogOpen: boolean;
  appKeybindingsDialogOpen: boolean;
  aiTranscription: SettingsTranscriptionState;
  aiPostProcessing: SettingsGenerativeState;
  agentMode: SettingsAgentModeState;
  apiKeys: SettingsApiKey[];
  apiKeysStatus: ActionStatus;
  hotkeyIds: string[];
  hotkeysStatus: ActionStatus;
  autoLaunchEnabled: boolean;
  autoLaunchStatus: ActionStatus;
  openRouterModels: OpenRouterModel[];
  openRouterModelsStatus: ActionStatus;
  openRouterSearchQuery: string;
  openRouterProviders: OpenRouterProvider[];
  openRouterProvidersStatus: ActionStatus;
  autoDownloadLogs: boolean;
};

export const INITIAL_SETTINGS_STATE: SettingsState = {
  changePasswordDialogOpen: false,
  deleteAccountDialog: false,
  microphoneDialogOpen: false,
  audioDialogOpen: false,
  shortcutsDialogOpen: false,
  clearLocalDataDialogOpen: false,
  profileDialogOpen: false,
  aiTranscriptionDialogOpen: false,
  aiPostProcessingDialogOpen: false,
  agentModeDialogOpen: false,
  moreSettingsDialogOpen: false,
  dictationLanguageDialogOpen: false,
  appKeybindingsDialogOpen: false,
  aiTranscription: {
    mode: DEFAULT_TRANSCRIPTION_MODE,
    modelSize: DEFAULT_MODEL_SIZE,
    device: CPU_DEVICE_VALUE,
    selectedApiKeyId: null,
    gpuEnumerationEnabled: false,
  },
  aiPostProcessing: {
    mode: DEFAULT_POST_PROCESSING_MODE,
    selectedApiKeyId: null,
  },
  agentMode: {
    mode: DEFAULT_AGENT_MODE,
    selectedApiKeyId: null,
    openclawGatewayUrl: null,
    openclawToken: null,
  },
  apiKeys: [],
  apiKeysStatus: "idle",
  hotkeyIds: [],
  hotkeysStatus: "idle",
  autoLaunchEnabled: false,
  autoLaunchStatus: "idle",
  openRouterModels: [],
  openRouterModelsStatus: "idle",
  openRouterSearchQuery: "",
  openRouterProviders: [],
  openRouterProvidersStatus: "idle",
  autoDownloadLogs: false,
};
```

---

## FICHIER 11 : AppState racine (contient `agent: AgentState`) — `state/app.state.ts`

```typescript
import { HandlerOutput } from "@repo/functions";
import {
  ApiKey, AppTarget, EnterpriseConfig, EnterpriseLicense, FullConfig,
  Hotkey, Member, Nullable, OidcProvider, Term, Tone, Transcription,
  User, UserPreferences,
} from "@repo/types";
import { AuthUser } from "../types/auth.types";
import { Vector2 } from "../types/math.types";
import { OverlayPhase } from "../types/overlay.types";
import { PermissionMap } from "../types/permission.types";
import { Toast } from "../types/toast.types";
import { AgentState, INITIAL_AGENT_STATE } from "./agent.state";
import { DictionaryState, INITIAL_DICTIONARY_STATE } from "./dictionary.state";
import { INITIAL_LOGIN_STATE, LoginState } from "./login.state";
import { INITIAL_ONBOARDING_STATE, type OnboardingState } from "./onboarding.state";
import { INITIAL_PAYMENT_STATE, PaymentState } from "./payment.state";
import { INITIAL_PRICING_STATE, PricingState } from "./pricing.state";
import { INITIAL_SETTINGS_STATE, SettingsState } from "./settings.state";
import { INITIAL_TONE_EDITOR_STATE, ToneEditorState } from "./tone-editor.state";
import { INITIAL_TONES_STATE, TonesState } from "./tones.state";
import { INITIAL_TRANSCRIPTIONS_STATE, TranscriptionsState } from "./transcriptions.state";
import { INITIAL_UPDATER_STATE, UpdaterState } from "./updater.state";

export type SnackbarMode = "info" | "success" | "error";
export type RecordingMode = "dictate" | "agent";
export type PriceValue = HandlerOutput<"stripe/getPrices">["prices"];

export type AppState = {
  initialized: boolean;
  auth: Nullable<AuthUser>;
  keysHeld: string[];
  isRecordingHotkey: boolean;
  activeRecordingMode: Nullable<RecordingMode>;
  dictationLanguageOverride: Nullable<string>;
  overlayPhase: OverlayPhase;
  audioLevels: number[];
  permissions: PermissionMap;
  confettiCounter: number;
  userPrefs: Nullable<UserPreferences>;
  localStorageCache: Record<string, unknown>;
  memberById: Record<string, Member>;
  userById: Record<string, User>;
  termById: Record<string, Term>;
  appTargetById: Record<string, AppTarget>;
  transcriptionById: Record<string, Transcription>;
  hotkeyById: Record<string, Hotkey>;
  apiKeyById: Record<string, ApiKey>;
  toneById: Record<string, Tone>;
  config: Nullable<FullConfig>;
  priceValueByKey: Record<string, PriceValue>;
  enterpriseConfig: Nullable<EnterpriseConfig>;
  enterpriseLicense: Nullable<EnterpriseLicense>;
  isEnterprise: boolean;
  oidcProviders: OidcProvider[];
  onboarding: OnboardingState;
  transcriptions: TranscriptionsState;
  dictionary: DictionaryState;
  tones: TonesState;
  toneEditor: ToneEditorState;
  settings: SettingsState;
  updater: UpdaterState;
  payment: PaymentState;
  pricing: PricingState;
  login: LoginState;
  agent: AgentState;
  snackbarMessage?: string;
  snackbarCounter: number;
  snackbarMode: SnackbarMode;
  snackbarDuration: number;
  snackbarTransitionDuration?: number;
  toastQueue: Toast[];
  currentToast: Toast | null;
  overlayCursor: Nullable<Vector2>;
};

export const INITIAL_APP_STATE: AppState = {
  userPrefs: null,
  isRecordingHotkey: false,
  activeRecordingMode: null,
  dictationLanguageOverride: null,
  enterpriseConfig: null,
  enterpriseLicense: null,
  isEnterprise: false,
  localStorageCache: {},
  oidcProviders: [],
  memberById: {},
  userById: {},
  termById: {},
  appTargetById: {},
  transcriptionById: {},
  priceValueByKey: {},
  apiKeyById: {},
  toneById: {},
  overlayPhase: "idle",
  audioLevels: [],
  permissions: { microphone: null, accessibility: null },
  hotkeyById: {},
  auth: null,
  confettiCounter: 0,
  config: null,
  keysHeld: [],
  initialized: false,
  snackbarCounter: 0,
  snackbarMode: "info",
  snackbarDuration: 3000,
  snackbarTransitionDuration: undefined,
  toastQueue: [],
  currentToast: null,
  overlayCursor: null,
  agent: INITIAL_AGENT_STATE,
  onboarding: INITIAL_ONBOARDING_STATE,
  transcriptions: INITIAL_TRANSCRIPTIONS_STATE,
  dictionary: INITIAL_DICTIONARY_STATE,
  tones: INITIAL_TONES_STATE,
  toneEditor: INITIAL_TONE_EDITOR_STATE,
  settings: INITIAL_SETTINGS_STATE,
  updater: INITIAL_UPDATER_STATE,
  payment: INITIAL_PAYMENT_STATE,
  pricing: INITIAL_PRICING_STATE,
  login: INITIAL_LOGIN_STATE,
};
```

---

## FICHIER 12 : DictationStrategy (l'autre stratégie de comparaison) — `strategies/dictation.strategy.ts`

```typescript
import type { Nullable } from "@repo/types";
import { invoke } from "@tauri-apps/api/core";
import { showErrorSnackbar } from "../actions/app.actions";
import { showToast } from "../actions/toast.actions";
import { postProcessTranscript, type PostProcessMetadata } from "../actions/transcribe.actions";
import { getIntl } from "../i18n";
import { getAppState } from "../store";
import type { OverlayPhase } from "../types/overlay.types";
import type { HandleTranscriptParams, HandleTranscriptResult, StrategyValidationError } from "../types/strategy.types";
import { getLogger } from "../utils/log.utils";
import { getMemberExceedsLimitByState } from "../utils/member.utils";
import { applyReplacements, applySymbolConversions } from "../utils/string.utils";
import { BaseStrategy } from "./base.strategy";

export class DictationStrategy extends BaseStrategy {
  shouldStoreTranscript(): boolean { return true; }

  validateAvailability(): Nullable<StrategyValidationError> {
    const state = getAppState();
    const transcriptionMode = state.settings.aiTranscription.mode;
    const generativeMode = state.settings.aiPostProcessing.mode;
    const isCloud = transcriptionMode === "cloud" || generativeMode === "cloud";
    if (isCloud && getMemberExceedsLimitByState(state)) {
      return {
        title: getIntl().formatMessage({ defaultMessage: "Word limit reached" }),
        body: getIntl().formatMessage({ defaultMessage: "You've used all your free words for today." }),
        action: "upgrade",
      };
    }
    return null;
  }

  async onBeforeStart(): Promise<void> {}

  async setPhase(phase: OverlayPhase): Promise<void> {
    await invoke<void>("set_phase", { phase });
  }

  async handleTranscript({
    rawTranscript, processedTranscript, sessionPostProcessMetadata,
    toneId, currentApp, loadingToken,
  }: HandleTranscriptParams): Promise<HandleTranscriptResult> {
    const resetPhase = async () => {
      if (loadingToken && this.context.overlayLoadingTokenRef.current === loadingToken) {
        this.context.overlayLoadingTokenRef.current = null;
        await invoke<void>("set_phase", { phase: "idle" });
      }
    };

    let transcript: string | null = null;
    let sanitizedTranscript: string | null = null;
    let postProcessMetadata: PostProcessMetadata = {};
    let postProcessWarnings: string[] = [];

    try {
      const state = getAppState();
      const replacementRules = Object.values(state.termById)
        .filter((term) => term.isReplacement)
        .map((term) => ({ sourceValue: term.sourceValue, destinationValue: term.destinationValue }));

      getLogger().verbose(`Applying ${replacementRules.length} replacement rules`);
      const afterReplacements = applyReplacements(rawTranscript, replacementRules);
      sanitizedTranscript = applySymbolConversions(afterReplacements);

      if (processedTranscript && sessionPostProcessMetadata) {
        const afterProcessedReplacements = applyReplacements(processedTranscript, replacementRules);
        transcript = applySymbolConversions(afterProcessedReplacements);
        postProcessMetadata = sessionPostProcessMetadata;
      } else {
        const result = await postProcessTranscript({ rawTranscript: sanitizedTranscript, toneId });
        transcript = result.transcript;
        postProcessMetadata = result.metadata;
        postProcessWarnings = result.warnings;
      }

      await resetPhase();

      if (transcript) {
        await new Promise<void>((resolve) => setTimeout(resolve, 20));
        try {
          const keybind = currentApp?.pasteKeybind ?? null;
          getLogger().verbose(`Pasting transcript (${transcript.length} chars, keybind=${keybind ?? "default"})`);
          const textToPaste = transcript.trim() + " ";
          await invoke<void>("paste", { text: textToPaste, keybind });
          getLogger().info("Transcript pasted successfully");
        } catch (error) {
          getLogger().error(`Failed to paste transcription: ${error}`);
          showErrorSnackbar("Unable to paste transcription.");
        }
      }
    } catch (error) {
      getLogger().error(`Failed to process transcription: ${error}`);
      const errorMessage = error instanceof Error ? error.message : "An error occurred.";
      postProcessWarnings.push(errorMessage);
      await showToast({ title: "Transcription failed", message: errorMessage, toastType: "error" });
      await resetPhase();
    }

    return { shouldContinue: false, transcript, sanitizedTranscript, postProcessMetadata, postProcessWarnings };
  }

  async cleanup(): Promise<void> {}
}
```

---

## FICHIER 13 : Base repo — `repos/base.repo.ts`

```typescript
export abstract class BaseRepo {}
```

---

## FICHIER 14 : Repo de génération de texte — `repos/generate-text.repo.ts`

```typescript
import { invokeHandler, type CloudModel } from "@repo/functions";
import { JsonResponse, Nullable, OpenRouterProviderRouting } from "@repo/types";
import {
  azureOpenAIGenerateText,
  claudeGenerateTextResponse, ClaudeModel,
  deepseekGenerateTextResponse, DeepseekModel,
  GeminiGenerateTextModel, geminiGenerateTextResponse,
  GenerateTextModel, groqGenerateTextResponse,
  OpenAIGenerateTextModel, openaiGenerateTextResponse,
  OPENROUTER_DEFAULT_MODEL, openrouterGenerateTextResponse,
} from "@repo/voice-ai";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { PostProcessingMode } from "../types/ai.types";
import { invokeEnterprise } from "../utils/enterprise.utils";
import { getNewServerAuthHeaders, NEW_SERVER_URL } from "../utils/new-server.utils";
import { BaseRepo } from "./base.repo";

export type GenerateTextInput = {
  system?: Nullable<string>;
  prompt: string;
  jsonResponse?: JsonResponse;
};

export type GenerateTextMetadata = {
  postProcessingMode?: Nullable<PostProcessingMode>;
  inferenceDevice?: Nullable<string>;
};

export type GenerateTextOutput = {
  text: string;
  metadata?: GenerateTextMetadata;
};

export abstract class BaseGenerateTextRepo extends BaseRepo {
  abstract generateText(input: GenerateTextInput): Promise<GenerateTextOutput>;
}

export class CloudGenerateTextRepo extends BaseGenerateTextRepo {
  private model: CloudModel;
  constructor(model: CloudModel = "medium") { super(); this.model = model; }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await invokeHandler("ai/generateText", {
      system: input.system, prompt: input.prompt,
      jsonResponse: input.jsonResponse, model: this.model,
    });
    return { text: response.text, metadata: { postProcessingMode: "cloud" } };
  }
}

export class GroqGenerateTextRepo extends BaseGenerateTextRepo {
  private groqApiKey: string;
  private model: GenerateTextModel;
  constructor(apiKey: string, model: string | null) {
    super(); this.groqApiKey = apiKey;
    this.model = (model as GenerateTextModel) ?? "meta-llama/llama-4-scout-17b-16e-instruct";
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await groqGenerateTextResponse({
      apiKey: this.groqApiKey, model: this.model,
      prompt: input.prompt, system: input.system ?? undefined,
      jsonResponse: input.jsonResponse,
    });
    return { text: response.text, metadata: { postProcessingMode: "api", inferenceDevice: "API • Groq" } };
  }
}

export class OpenAIGenerateTextRepo extends BaseGenerateTextRepo {
  private openaiApiKey: string;
  private model: OpenAIGenerateTextModel;
  constructor(apiKey: string, model: string | null) {
    super(); this.openaiApiKey = apiKey;
    this.model = (model as OpenAIGenerateTextModel) ?? "gpt-4o-mini";
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await openaiGenerateTextResponse({
      apiKey: this.openaiApiKey, model: this.model,
      prompt: input.prompt, system: input.system ?? undefined,
      jsonResponse: input.jsonResponse,
    });
    return { text: response.text, metadata: { postProcessingMode: "api", inferenceDevice: "API • OpenAI" } };
  }
}

export class OllamaGenerateTextRepo extends BaseGenerateTextRepo {
  private ollamaUrl: string;
  private model: string;
  private apiKey: string;
  constructor(url: string, model: string, apiKey?: string) {
    super(); this.ollamaUrl = url; this.model = model; this.apiKey = apiKey || "ollama";
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await openaiGenerateTextResponse({
      baseUrl: this.ollamaUrl, apiKey: this.apiKey, model: this.model,
      prompt: input.prompt, system: input.system ?? undefined,
      jsonResponse: input.jsonResponse, customFetch: tauriFetch,
    });
    return { text: response.text, metadata: { postProcessingMode: "api", inferenceDevice: "API • Ollama" } };
  }
}

export class OpenAICompatibleGenerateTextRepo extends BaseGenerateTextRepo {
  private baseUrl: string;
  private model: string;
  private apiKey: string;
  constructor(url: string, model: string, apiKey?: string) {
    super(); this.baseUrl = url; this.model = model; this.apiKey = apiKey || "";
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await openaiGenerateTextResponse({
      baseUrl: this.baseUrl, apiKey: this.apiKey, model: this.model,
      prompt: input.prompt, system: input.system ?? undefined,
      jsonResponse: input.jsonResponse, customFetch: tauriFetch,
    });
    return { text: response.text, metadata: { postProcessingMode: "api", inferenceDevice: "API • OpenAI Compatible" } };
  }
}

export class OpenRouterGenerateTextRepo extends BaseGenerateTextRepo {
  private apiKey: string;
  private model: string;
  private providerRouting?: OpenRouterProviderRouting;
  constructor(apiKey: string, model: string | null, providerRouting?: OpenRouterProviderRouting) {
    super(); this.apiKey = apiKey;
    this.model = model ?? OPENROUTER_DEFAULT_MODEL;
    this.providerRouting = providerRouting;
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await openrouterGenerateTextResponse({
      apiKey: this.apiKey, model: this.model,
      prompt: input.prompt, system: input.system ?? undefined,
      jsonResponse: input.jsonResponse, providerRouting: this.providerRouting,
    });
    return { text: response.text, metadata: { postProcessingMode: "api", inferenceDevice: "API • OpenRouter" } };
  }
}

export class AzureOpenAIGenerateTextRepo extends BaseGenerateTextRepo {
  private apiKey: string;
  private endpoint: string;
  private deploymentName: string;
  constructor(apiKey: string, endpoint: string, deploymentName: string | null) {
    super(); this.apiKey = apiKey; this.endpoint = endpoint;
    this.deploymentName = deploymentName ?? "gpt-4o-mini";
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await azureOpenAIGenerateText({
      apiKey: this.apiKey, endpoint: this.endpoint,
      deploymentName: this.deploymentName,
      system: input.system ?? undefined, prompt: input.prompt,
      jsonResponse: input.jsonResponse,
    });
    return { text: response.text, metadata: { postProcessingMode: "api", inferenceDevice: "API • Azure OpenAI" } };
  }
}

export class DeepseekGenerateTextRepo extends BaseGenerateTextRepo {
  private apiKey: string;
  private model: DeepseekModel;
  constructor(apiKey: string, model: string | null) {
    super(); this.apiKey = apiKey;
    this.model = (model as DeepseekModel) ?? "deepseek-chat";
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await deepseekGenerateTextResponse({
      apiKey: this.apiKey, model: this.model,
      prompt: input.prompt, system: input.system ?? undefined,
      jsonResponse: input.jsonResponse,
    });
    return { text: response.text, metadata: { postProcessingMode: "api", inferenceDevice: "API • DeepSeek" } };
  }
}

export class GeminiGenerateTextRepo extends BaseGenerateTextRepo {
  private apiKey: string;
  private model: GeminiGenerateTextModel;
  constructor(apiKey: string, model: string | null) {
    super(); this.apiKey = apiKey;
    this.model = (model as GeminiGenerateTextModel) ?? "gemini-2.5-flash";
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await geminiGenerateTextResponse({
      apiKey: this.apiKey, model: this.model,
      prompt: input.prompt, system: input.system ?? undefined,
      jsonResponse: input.jsonResponse,
    });
    return { text: response.text, metadata: { postProcessingMode: "api", inferenceDevice: "API • Gemini" } };
  }
}

export class ClaudeGenerateTextRepo extends BaseGenerateTextRepo {
  private apiKey: string;
  private model: ClaudeModel;
  constructor(apiKey: string, model: string | null) {
    super(); this.apiKey = apiKey;
    this.model = (model as ClaudeModel) ?? "claude-sonnet-4-20250514";
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await claudeGenerateTextResponse({
      apiKey: this.apiKey, model: this.model,
      prompt: input.prompt, system: input.system ?? undefined,
      jsonResponse: input.jsonResponse,
    });
    return { text: response.text, metadata: { postProcessingMode: "api", inferenceDevice: "API • Claude" } };
  }
}

export class EnterpriseGenerateTextRepo extends BaseGenerateTextRepo {
  private model: CloudModel;
  constructor(model: CloudModel = "medium") { super(); this.model = model; }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await invokeEnterprise("ai/generateText", {
      system: input.system, prompt: input.prompt,
      jsonResponse: input.jsonResponse, model: this.model,
    });
    return { text: response.text, metadata: { postProcessingMode: "cloud" } };
  }
}

export class NewServerGenerateTextRepo extends BaseGenerateTextRepo {
  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const headers = await getNewServerAuthHeaders();
    const messages: { role: "system" | "user"; content: string }[] = [];
    if (input.system) messages.push({ role: "system", content: input.system });
    messages.push({ role: "user", content: input.prompt });

    const res = await fetch(`${NEW_SERVER_URL}/v1/process`, {
      method: "POST", headers, body: JSON.stringify({ messages }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed with status ${res.status}`);
    }
    const body = await res.json();
    return {
      text: JSON.stringify({ processedTranscription: body.text }),
      metadata: { postProcessingMode: "cloud" },
    };
  }
}
```

---

## FICHIER 15 : Outil de base (classe abstraite) — `tools/base.tool.ts`

```typescript
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import type { ToolResult } from "../types/agent.types";

export abstract class BaseTool<
  TInput extends z.ZodType = z.ZodType,
  TOutput extends z.ZodType = z.ZodType,
> {
  abstract readonly name: string;
  abstract readonly displayName: string;
  abstract readonly description: string;
  abstract readonly inputSchema: TInput;
  abstract readonly outputSchema: TOutput;

  protected abstract execInternal(args: z.infer<TInput>): Promise<ToolResult>;

  async execute(args: unknown): Promise<ToolResult> {
    const parseResult = this.inputSchema.safeParse(args);
    if (!parseResult.success) {
      return {
        success: false,
        output: { error: `Invalid parameters for ${this.name}: ${parseResult.error.message}` },
      };
    }
    try {
      const result = await this.execInternal(parseResult.data);
      console.log("Invoking tool", this.name, "with args:", args, "result:", result);
      return result;
    } catch (error) {
      console.error("Error executing tool", this.name, "with args:", args, "got error:", error);
      return { success: false, output: { error: `Tool execution error: ${String(error)}` } };
    }
  }

  getInputJsonSchema(): Record<string, unknown> {
    const schema = zodToJsonSchema(this.inputSchema, "Input");
    return (schema.definitions?.Input as Record<string, unknown>) ?? schema;
  }

  getOutputJsonSchema(): Record<string, unknown> {
    const schema = zodToJsonSchema(this.outputSchema, "Output");
    return (schema.definitions?.Output as Record<string, unknown>) ?? schema;
  }

  parseOutput(result: unknown): z.infer<TOutput> {
    return this.outputSchema.parse(result);
  }

  toPromptString(): string {
    const inputJsonSchema = this.getInputJsonSchema();
    return `Tool: ${this.name}\nDescription: ${this.description}\nParameters: ${JSON.stringify(inputJsonSchema, null, 2)}`;
  }
}
```

---

## FICHIER 16 : Outil Get Context — `tools/get-context.tool.ts`

```typescript
import { invoke } from "@tauri-apps/api/core";
import { z } from "zod";
import type { ToolResult } from "../types/agent.types";
import { BaseTool } from "./base.tool";

export const GetContextInputSchema = z.object({});

export const GetContextOutputSchema = z.object({
  textContent: z.string().nullable().describe("The text content of the focused field"),
  cursorPosition: z.number().nullable().describe("The cursor position in the text field"),
  selectionLength: z.number().nullable().describe("The length of selected text, if any"),
  screenContext: z.string().nullable().describe("Text content gathered from the screen around the focused field for context"),
});

type TextFieldInfo = {
  cursorPosition: number | null;
  selectionLength: number | null;
  textContent: string | null;
};

type ScreenContextInfo = {
  screenContext: string | null;
};

export class GetContextTool extends BaseTool<typeof GetContextInputSchema, typeof GetContextOutputSchema> {
  readonly name = "get_context";
  readonly displayName = "Get Context";
  readonly description = "Get the text field content and surrounding screen context. ALWAYS call this first when the user asks you to write, reply, or respond to something - you need to see what they're looking at. Also use it when you need to understand the user's current context.";
  readonly inputSchema = GetContextInputSchema;
  readonly outputSchema = GetContextOutputSchema;

  protected async execInternal(_args: z.infer<typeof GetContextInputSchema>): Promise<ToolResult> {
    console.log("Invoking get_text_field_info and get_screen_context...");

    const [textFieldInfo, screenContextInfo] = await Promise.all([
      invoke<TextFieldInfo>("get_text_field_info"),
      invoke<ScreenContextInfo>("get_screen_context"),
    ]);

    console.log("Text Field Info:", textFieldInfo);
    console.log("Screen Context Info:", screenContextInfo);

    const hasTextFieldInfo =
      textFieldInfo.textContent !== null ||
      textFieldInfo.cursorPosition !== null ||
      textFieldInfo.selectionLength !== null;
    const hasScreenContext = screenContextInfo.screenContext !== null;

    if (!hasTextFieldInfo && !hasScreenContext) {
      return {
        success: false,
        output: { error: "Could not get context. No text field is focused and no screen context is available. Accessibility permissions may be required." },
      };
    }

    return {
      success: true,
      output: this.parseOutput({
        textContent: textFieldInfo.textContent,
        cursorPosition: textFieldInfo.cursorPosition,
        selectionLength: textFieldInfo.selectionLength,
        screenContext: screenContextInfo.screenContext,
      }),
    };
  }
}
```

---

## FICHIER 17 : Outil Draft — `tools/draft.tool.ts`

```typescript
import { z } from "zod";
import type { ToolResult } from "../types/agent.types";
import { BaseTool } from "./base.tool";

export const DraftInputSchema = z.object({
  text: z.string().describe("The draft text to store"),
});

export const DraftOutputSchema = z.object({
  stored: z.boolean().describe("Whether the draft was stored successfully"),
  text: z.string().describe("The draft text that was stored"),
});

export class DraftTool extends BaseTool<typeof DraftInputSchema, typeof DraftOutputSchema> {
  readonly name = "draft";
  readonly displayName = "Draft";
  readonly description = "Store a draft of the text you want to write. The draft will be shown to the user separately for review. After calling this tool, respond to ask for the user's approval (e.g., 'How does this sound?'). Do NOT repeat the draft text in your response - it is displayed automatically. You must call this before write_to_text_field can be used.";
  readonly inputSchema = DraftInputSchema;
  readonly outputSchema = DraftOutputSchema;

  private draft: string | null = null;
  private onDraftUpdated: ((draft: string) => void) | null = null;

  setOnDraftUpdated(callback: (draft: string) => void): void {
    this.onDraftUpdated = callback;
  }

  getDraft(): string | null {
    return this.draft;
  }

  clearDraft(): void {
    this.draft = null;
  }

  protected async execInternal(args: z.infer<typeof DraftInputSchema>): Promise<ToolResult> {
    const { text } = args;
    this.draft = text;
    if (this.onDraftUpdated) {
      this.onDraftUpdated(text);
    }
    return { success: true, output: this.parseOutput({ stored: true, text }) };
  }
}
```

---

## FICHIER 18 : Outil Write to Text Field — `tools/write-to-text-field.tool.ts`

```typescript
import { invoke } from "@tauri-apps/api/core";
import { z } from "zod";
import type { ToolResult } from "../types/agent.types";
import { BaseTool } from "./base.tool";
import type { DraftTool } from "./draft.tool";
import { StopTool } from "./stop.tool";

export const WriteToTextFieldInputSchema = z.object({});

export const WriteToTextFieldOutputSchema = z.object({
  written: z.boolean().describe("Whether the text was written successfully"),
  text: z.string().describe("The text that was written"),
});

export class WriteToTextFieldTool extends BaseTool<typeof WriteToTextFieldInputSchema, typeof WriteToTextFieldOutputSchema> {
  readonly name = "write_to_text_field";
  readonly displayName = "Write to Text Field";
  readonly description = "Pastes the current draft into the focused text field. Requires a draft to be stored first via the draft tool. Only call this after the user explicitly approves the draft (e.g., 'yes', 'looks good', 'send it', 'perfect', 'do it'). If the user requests changes, call the draft tool again with the revised text instead.";
  readonly inputSchema = WriteToTextFieldInputSchema;
  readonly outputSchema = WriteToTextFieldOutputSchema;

  private pasteKeybind: string | null = null;
  private stopTool: StopTool | null = null;
  private draftTool: DraftTool | null = null;

  setPasteKeybind(keybind: string | null): void { this.pasteKeybind = keybind; }
  setStopTool(stopTool: StopTool): void { this.stopTool = stopTool; }
  setDraftTool(draftTool: DraftTool): void { this.draftTool = draftTool; }

  protected async execInternal(_args: z.infer<typeof WriteToTextFieldInputSchema>): Promise<ToolResult> {
    if (!this.draftTool) {
      return { success: false, output: { error: "Internal error: Draft tool not configured." } };
    }
    const draft = this.draftTool.getDraft();
    if (draft === null) {
      return { success: false, output: { error: "Unable to write text, you must write a draft first using the draft tool." } };
    }
    await invoke("paste", { text: draft, keybind: this.pasteKeybind });
    this.draftTool.clearDraft();
    this.stopTool?.stop();
    return { success: true, output: this.parseOutput({ written: true, text: draft }) };
  }
}
```

---

## FICHIER 19 : Outil Stop — `tools/stop.tool.ts`

```typescript
import { z } from "zod";
import type { ToolResult } from "../types/agent.types";
import { BaseTool } from "./base.tool";

export const StopInputSchema = z.object({
  reason: z.string().describe("Brief explanation for why the session is ending"),
});

export const StopOutputSchema = z.object({
  stopped: z.boolean().describe("Whether the session was stopped"),
  reason: z.string().describe("The reason the session was stopped"),
});

export class StopTool extends BaseTool<typeof StopInputSchema, typeof StopOutputSchema> {
  private callback: () => void;
  readonly name = "stop";
  readonly displayName = "Stop";
  readonly description = "Signal that you are done with the conversation and the agent session should end. Use this when the user says goodbye, asks to stop, or when the task is complete and no further interaction is needed.";
  readonly inputSchema = StopInputSchema;
  readonly outputSchema = StopOutputSchema;

  constructor(callback: () => void) { super(); this.callback = callback; }

  public stop(): void { this.callback(); }

  protected async execInternal(args: z.infer<typeof StopInputSchema>): Promise<ToolResult> {
    const { reason } = args;
    this.stop();
    return { success: true, output: this.parseOutput({ stopped: true, reason }) };
  }
}
```

---

## FICHIER 20 : Outil MCP (outils dynamiques externes) — `tools/mcp.tool.ts`

```typescript
import { batchAsync } from "@repo/utilities";
import { fetch } from "@tauri-apps/plugin-http";
import { z } from "zod";
import type { ToolResult } from "../types/agent.types";
import { BaseTool } from "./base.tool";

type JsonRpcRequest = { jsonrpc: "2.0"; id: number; method: string; params?: Record<string, unknown> };
type JsonRpcResponse<T = unknown> = { jsonrpc: "2.0"; id: number; result?: T; error?: { code: number; message: string; data?: unknown } };
type McpToolDefinition = { name: string; description?: string; inputSchema: { type: "object"; properties?: Record<string, unknown>; required?: string[] } };
type McpToolsListResult = { tools: McpToolDefinition[] };
type McpCallToolResult = { content: Array<{ type: string; text?: string; data?: string; mimeType?: string }>; isError?: boolean };

function jsonSchemaToZod(schema: Record<string, unknown>): z.ZodType {
  const properties = (schema.properties ?? {}) as Record<string, Record<string, unknown>>;
  const required = (schema.required ?? []) as string[];
  const shape: Record<string, z.ZodType> = {};

  for (const [key, prop] of Object.entries(properties)) {
    let fieldSchema: z.ZodType;
    switch (prop.type) {
      case "string": fieldSchema = z.string(); break;
      case "number": fieldSchema = z.number(); break;
      case "integer": fieldSchema = z.number().int(); break;
      case "boolean": fieldSchema = z.boolean(); break;
      case "array": fieldSchema = z.array(z.unknown()); break;
      case "object": fieldSchema = z.record(z.unknown()); break;
      default: fieldSchema = z.unknown();
    }
    if (prop.description && typeof prop.description === "string") fieldSchema = fieldSchema.describe(prop.description);
    if (!required.includes(key)) fieldSchema = fieldSchema.optional();
    shape[key] = fieldSchema;
  }
  return z.object(shape);
}

class McpProxyTool extends BaseTool {
  readonly name: string;
  readonly displayName: string;
  readonly description: string;
  readonly inputSchema: z.ZodType;
  readonly outputSchema = z.object({
    content: z.array(z.object({ type: z.string(), text: z.string().optional() })),
  });

  constructor(private client: McpClient, private toolDef: McpToolDefinition) {
    super();
    this.name = toolDef.name;
    this.displayName = toolDef.name.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    this.description = toolDef.description ?? `MCP tool: ${toolDef.name}`;
    this.inputSchema = jsonSchemaToZod(toolDef.inputSchema);
  }

  protected async execInternal(args: Record<string, unknown>): Promise<ToolResult> {
    const result = await this.client.callTool(this.toolDef.name, args);
    if (result.isError) {
      const errorText = result.content.filter((c) => c.type === "text" && c.text).map((c) => c.text).join("\n");
      return { success: false, output: { error: errorText || "Tool execution failed" } };
    }
    const textContent = result.content.filter((c) => c.type === "text" && c.text).map((c) => c.text).join("\n");
    return { success: true, output: { result: textContent, content: result.content } };
  }
}

type McpServerConfig = { url: string; headers?: Record<string, string> };

class McpClient {
  private requestId = 0;
  private initialized = false;
  constructor(private config: McpServerConfig) {}

  private extractJsonFromSse(text: string): string {
    const lines = text.split("\n");
    for (const line of lines) { if (line.startsWith("data: ")) return line.slice(6); }
    return text;
  }

  private async request<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    const request: JsonRpcRequest = { jsonrpc: "2.0", id: ++this.requestId, method, params };
    const response = await fetch(this.config.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.config.headers },
      body: JSON.stringify(request),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`MCP request failed: ${response.status} ${response.statusText}\n${text}`);

    let json: JsonRpcResponse<T>;
    try {
      const jsonText = this.extractJsonFromSse(text);
      json = JSON.parse(jsonText) as JsonRpcResponse<T>;
    } catch { throw new Error(`MCP response is not JSON: ${text.slice(0, 500)}`); }
    if (json.error) throw new Error(`MCP error: ${json.error.message}`);
    return json.result as T;
  }

  private async notify(method: string, params?: Record<string, unknown>): Promise<void> {
    const request = { jsonrpc: "2.0", method, params };
    const response = await fetch(this.config.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.config.headers },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`MCP notification failed: ${response.status} ${response.statusText}\n${text}`);
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.request("initialize", {
      protocolVersion: "2024-11-05", capabilities: {},
      clientInfo: { name: "voquill", version: "0.1.0" },
    });
    await this.notify("notifications/initialized");
    this.initialized = true;
  }

  async listTools(): Promise<McpToolDefinition[]> {
    const result = await this.request<McpToolsListResult>("tools/list");
    return result.tools;
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<McpCallToolResult> {
    return this.request<McpCallToolResult>("tools/call", { name, arguments: args });
  }
}

const getToolsForServer = async (config: McpServerConfig): Promise<BaseTool[]> => {
  const client = new McpClient(config);
  await client.initialize();
  const toolDefs = await client.listTools();
  return toolDefs.map((def) => new McpProxyTool(client, def));
};

export type { McpServerConfig };

export const getToolsForServers = async (servers: McpServerConfig[]): Promise<BaseTool[]> => {
  return (
    await batchAsync(16, servers.map((config) => () =>
      getToolsForServer(config).catch((error) => {
        console.error(`Failed to get tools from MCP server ${config.url}:`, error);
        return [];
      }),
    ))
  ).flat();
};
```

---

## FICHIER 21 : Prompts de l'agent — `agent/agent.prompt.ts`

```typescript
import dayjs from "dayjs";
import zodToJsonSchema from "zod-to-json-schema";
import { getAppState } from "../store";
import { BaseTool } from "../tools/base.tool";
import type { AgentMessage } from "../types/agent.types";
import { DecisionResponseSchema, FinalResponseSchema } from "../types/agent.types";
import { getMyUserName } from "../utils/user.utils";

const extractSchema = (schema: ReturnType<typeof zodToJsonSchema>, name: string): Record<string, unknown> => {
  return (schema.definitions?.[name] as Record<string, unknown>) ?? schema;
};

const rawDecisionSchema = zodToJsonSchema(DecisionResponseSchema, { name: "DecisionResponse", $refStrategy: "none" });
export const DECISION_JSON_SCHEMA = extractSchema(rawDecisionSchema, "DecisionResponse");

const rawFinalResponseSchema = zodToJsonSchema(FinalResponseSchema, { name: "FinalResponse", $refStrategy: "none" });
export const FINAL_RESPONSE_JSON_SCHEMA = extractSchema(rawFinalResponseSchema, "FinalResponse");

const getCommonPromptContext = (): string => {
  const username = getMyUserName(getAppState());
  const now = new Date();
  const timezoneAbbr = now.toLocaleTimeString("en-US", { timeZoneName: "short" }).split(" ").pop();
  return `
CRITICAL CONTEXT (DO NOT FORGET!):
The user's name is "${username}". YOU MUST SIGN EMAILS WITH THIS NAME.
The current date is ${dayjs().format("MMMM D, YYYY (dddd)")} at ${dayjs().format("h:mm A")} ${timezoneAbbr}.
`;
};

export const buildDecisionSystemPrompt = (tools: BaseTool[]): string => {
  const toolNames = tools.map((t) => t.name);
  const toolDescriptions = tools.map((t) => `- ${t.name}: ${t.description}`).join("\n");

  return `You are a helpful assistant that decides how to respond to user requests.

## Available Tools
${toolDescriptions}

## Your Task
Analyze the user's request and conversation history, then decide what to do next.

## Response Format
Respond with JSON only:
{
  "reasoning": "Brief explanation of why you chose this action",
  "choice": "respond" | "${toolNames.join('" | "')}"
}

## Rules
- If you're not sure what the user is referring to, use get_context to gather more information.
- Use "respond" when you need to communicate with the user or have completed their request.
- Read the tool descriptions carefully - they explain when and how to use each tool.

${getCommonPromptContext()}
`;
};

export const buildFinalResponseSystemPrompt = (reasoning: string): string => {
  return `You are a helpful assistant that responds to the user.

You are responding to the user because of this reason: ${reasoning}

## Response Format
Respond with JSON only:
{
  "response": "What you want to say to the user"
}

## Rules
- Be concise and helpful
- If you just executed a tool, briefly confirm what you did or ask for next steps as appropriate
- If you're answering a question, provide the answer directly
- CRITICAL: You must NEVER include draft content in your responses. Drafts are displayed separately by the system. Your response should only contain a brief message like "How does this look?" - never the draft text itself.

## Draft Content
If you used the draft tool, your response must ONLY be a short question like "How does this look?" or "Does this work?".
DO NOT repeat, summarize, or include ANY of the draft text. The draft is shown separately by the system.

${getCommonPromptContext()}
`;
};

export const buildToolArgsSystemPrompt = (tool: BaseTool, reasoning: string): string => {
  const jsonSchema = tool.getInputJsonSchema();
  return `You are a helpful assistant. You need to provide arguments for the "${tool.name}" tool.

The reason for calling this tool is: ${reasoning}

## Tool Description
${tool.description}

## Parameters Schema
${JSON.stringify(jsonSchema, null, 2)}

## Response Format
Respond with JSON matching the parameters schema above.

## Rules
- Provide all required parameters
- Use appropriate values based on the conversation context

${getCommonPromptContext()}
`;
};

export const formatHistory = (messages: AgentMessage[]): string => {
  return messages.map((msg) => {
    if (msg.type === "user") return `User: ${msg.content}`;
    const toolsSummary = msg.tools.length > 0
      ? `[Tools used: ${msg.tools.map((t) => `${t.name}(${JSON.stringify(t.input)}) → ${JSON.stringify(t.output)}`).join(", ")}]\n`
      : "";
    return `Assistant: ${toolsSummary}${msg.response}`;
  }).join("\n\n");
};

export const buildUserPrompt = (history: AgentMessage[], currentInput: string): string => {
  const historyText = history.length > 0 ? `## Conversation History\n${formatHistory(history)}\n\n` : "";
  return `${historyText}## Current User Input\n${currentInput}`;
};
```

---

## FICHIER 22 : Agent principal (boucle d'exécution) — `agent/agent.ts`

```typescript
import { retry } from "@repo/utilities";
import type { ZodType, z } from "zod";
import type { BaseGenerateTextRepo, GenerateTextInput } from "../repos/generate-text.repo";
import { BaseTool } from "../tools/base.tool";
import type { AgentMessage, AgentRunOptions, AgentRunResult, DecisionResponse, ToolExecution, ToolResult } from "../types/agent.types";
import { DecisionResponseSchema, FinalResponseSchema } from "../types/agent.types";
import {
  DECISION_JSON_SCHEMA, FINAL_RESPONSE_JSON_SCHEMA,
  buildDecisionSystemPrompt, buildFinalResponseSystemPrompt,
  buildToolArgsSystemPrompt, buildUserPrompt,
} from "./agent.prompt";

const MAX_ITERATIONS = 16;
const LLM_RETRIES = 3;
const LLM_RETRY_DELAY_MS = 500;

export class Agent {
  private history: AgentMessage[] = [];

  constructor(private repo: BaseGenerateTextRepo, private tools: BaseTool[] = []) {}

  private generateTextWithRetries<T extends ZodType>(schema: T, input: GenerateTextInput): Promise<z.infer<T>> {
    return retry({
      fn: async () => {
        const output = await this.repo.generateText(input);
        const parsed = JSON.parse(output.text);
        return schema.parse(parsed);
      },
      retries: LLM_RETRIES,
      delay: LLM_RETRY_DELAY_MS,
    });
  }

  private toolRecord(): Record<string, BaseTool> {
    const record: Record<string, BaseTool> = {};
    for (const tool of this.tools) record[tool.name] = tool;
    return record;
  }

  getHistory(): AgentMessage[] { return [...this.history]; }
  clearHistory(): void { this.history = []; }

  async run(userInput: string, options?: AgentRunOptions): Promise<AgentRunResult> {
    this.history.push({ type: "user", content: userInput });

    const originalInput = userInput;
    const toolExecutions: ToolExecution[] = [];
    const decisionSystemPrompt = buildDecisionSystemPrompt(this.tools);

    const buildCurrentPrompt = (): string => {
      if (toolExecutions.length === 0) return originalInput;
      const toolsSummary = toolExecutions
        .map((t) => `- ${t.name} [${t.didSucceed ? "SUCCESS" : "FAILED"}]: ${JSON.stringify(t.output)}`)
        .join("\n");
      return `${originalInput}\n\n## Tools Already Called\n${toolsSummary}\n\nIMPORTANT: If a tool succeeded, the task for that tool is COMPLETE. Do NOT call the same tool again. Choose "respond" to finish.`;
    };

    try {
      for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        const userPrompt = buildUserPrompt(this.history, buildCurrentPrompt());
        const decision = await this.callDecisionLLM(decisionSystemPrompt, userPrompt);

        const lastTool = toolExecutions.at(-1);
        const isLooping = lastTool?.didSucceed && lastTool.name === decision.choice;

        if (decision.choice === "respond" || isLooping) {
          const reasoning = isLooping ? "Task complete - " + lastTool?.name + " succeeded" : decision.reasoning;
          const response = await this.callFinalResponseLLM(userPrompt, reasoning);
          this.history.push({ type: "assistant", tools: toolExecutions, response, isError: false });
          return { response, history: this.getHistory(), isError: false };
        }

        const tool = this.toolRecord()[decision.choice];
        if (!tool) throw new Error(`Tool not found: ${decision.choice}`);

        const toolArgs = await this.callToolArgsLLM(tool, userPrompt, decision.reasoning);
        const toolResult = await this.executeTool(tool, toolArgs);

        const execution: ToolExecution = {
          name: tool.name, displayName: tool.displayName,
          input: toolArgs, output: toolResult.output, didSucceed: toolResult.success,
        };
        toolExecutions.push(execution);
        options?.onToolExecuted?.(execution);
      }
      throw new Error("Maximum iterations reached without completing the task.");
    } catch (error) {
      let message: string;
      if (error instanceof Error) message = error.message;
      else message = "An unexpected error occurred.";
      this.history.push({ type: "assistant", tools: toolExecutions, response: message, isError: true });
      return { response: message, history: this.getHistory(), isError: true };
    }
  }

  private async callDecisionLLM(system: string, prompt: string): Promise<DecisionResponse> {
    return this.generateTextWithRetries(DecisionResponseSchema, {
      system, prompt,
      jsonResponse: { name: "decision_response", description: "Decision about what action to take", schema: DECISION_JSON_SCHEMA },
    });
  }

  private async callFinalResponseLLM(prompt: string, reasoning: string): Promise<string> {
    const system = buildFinalResponseSystemPrompt(reasoning);
    const result = await this.generateTextWithRetries(FinalResponseSchema, {
      system, prompt,
      jsonResponse: { name: "final_response", description: "Final response to the user", schema: FINAL_RESPONSE_JSON_SCHEMA },
    });
    return result.response;
  }

  private async callToolArgsLLM(tool: BaseTool, prompt: string, reasoning: string): Promise<Record<string, unknown>> {
    const system = buildToolArgsSystemPrompt(tool, reasoning);
    return this.generateTextWithRetries(tool.inputSchema, {
      system, prompt,
      jsonResponse: { name: "tool_args", description: `Arguments for the ${tool.name} tool`, schema: tool.getInputJsonSchema() },
    });
  }

  private async executeTool(tool: BaseTool, args: Record<string, unknown>): Promise<ToolResult> {
    try { return await tool.execute(args); }
    catch (error) { return { success: false, output: { error: `Tool execution error: ${String(error)}` } }; }
  }
}
```

---

## FICHIER 23 : Stratégie de base — `strategies/base.strategy.ts`

```typescript
import type { Nullable } from "@repo/types";
import type { OverlayPhase } from "../types/overlay.types";
import type { HandleTranscriptParams, HandleTranscriptResult, StrategyContext, StrategyValidationError } from "../types/strategy.types";

export abstract class BaseStrategy {
  constructor(protected context: StrategyContext) {}
  abstract validateAvailability(): Nullable<StrategyValidationError>;
  abstract onBeforeStart(): Promise<void>;
  abstract setPhase(phase: OverlayPhase): Promise<void>;
  abstract handleTranscript(params: HandleTranscriptParams): Promise<HandleTranscriptResult>;
  abstract shouldStoreTranscript(): boolean;
  abstract cleanup(): Promise<void>;
}
```

---

## FICHIER 24 : AgentStrategy (stratégie cloud/API) — `strategies/agent.strategy.ts`

```typescript
import type { Nullable } from "@repo/types";
import { showToast } from "../actions/toast.actions";
import { Agent } from "../agent/agent";
import { getIntl } from "../i18n";
import { getAgentRepo } from "../repos";
import { getAppState, produceAppState } from "../store";
import { DraftTool } from "../tools/draft.tool";
import { GetContextTool } from "../tools/get-context.tool";
import { getToolsForServers } from "../tools/mcp.tool";
import { StopTool } from "../tools/stop.tool";
import { WriteToTextFieldTool } from "../tools/write-to-text-field.tool";
import type { AgentWindowMessage } from "../types/agent-window.types";
import type { OverlayPhase } from "../types/overlay.types";
import type { HandleTranscriptParams, HandleTranscriptResult, StrategyValidationError } from "../types/strategy.types";
import { getLogger } from "../utils/log.utils";
import { getMemberExceedsLimitByState } from "../utils/member.utils";
import { BaseStrategy } from "./base.strategy";

export class AgentStrategy extends BaseStrategy {
  private uiMessages: AgentWindowMessage[] = [];
  private isFirstTurn = true;
  private agent: Agent | null = null;
  private shouldStop = false;
  private writeToTextFieldTool: WriteToTextFieldTool | null = null;
  private stopTool: StopTool | null = null;
  private draftTool: DraftTool | null = null;
  private currentDraft: string | null = null;

  shouldStoreTranscript(): boolean { return false; }

  validateAvailability(): Nullable<StrategyValidationError> {
    const state = getAppState();
    const agentMode = state.settings.agentMode.mode;
    if (agentMode === "none") {
      return {
        title: getIntl().formatMessage({ defaultMessage: "Agent mode disabled" }),
        body: getIntl().formatMessage({ defaultMessage: "Enable agent mode in settings to use this feature." }),
        action: "open_agent_settings",
      };
    }
    if (agentMode === "cloud" && getMemberExceedsLimitByState(state)) {
      return {
        title: getIntl().formatMessage({ defaultMessage: "Word limit reached" }),
        body: getIntl().formatMessage({ defaultMessage: "You've used all your free words for today." }),
        action: "upgrade",
      };
    }
    return null;
  }

  private updateWindowState(messages: AgentWindowMessage[] | null): void {
    produceAppState((draft) => {
      draft.agent.windowState = messages
        ? { messages: messages.map((m) => ({ ...m, tools: m.tools ? [...m.tools] : undefined })) }
        : null;
    });
  }

  private async initAgent(): Promise<Agent | null> {
    getLogger().info("Initializing agent");
    const { repo, warnings } = getAgentRepo();
    if (!repo) { getLogger().warning(`No agent repo configured: ${warnings.join(", ")}`); return null; }

    const mcpTools = await getToolsForServers([]);

    this.stopTool = new StopTool(() => { this.shouldStop = true; });

    this.draftTool = new DraftTool();
    this.draftTool.setOnDraftUpdated((draft) => {
      this.currentDraft = draft;
      this.updateWindowState(this.uiMessages);
    });

    this.writeToTextFieldTool = new WriteToTextFieldTool();
    this.writeToTextFieldTool.setStopTool(this.stopTool);
    this.writeToTextFieldTool.setDraftTool(this.draftTool);

    const tools = [new GetContextTool(), this.draftTool, this.writeToTextFieldTool, this.stopTool, ...mcpTools];
    return new Agent(repo, tools);
  }

  async onBeforeStart(): Promise<void> {
    if (this.isFirstTurn) {
      this.updateWindowState(null);
      this.isFirstTurn = false;
      this.agent = await this.initAgent();
    }
  }

  async setPhase(phase: OverlayPhase): Promise<void> {
    produceAppState((draft) => { draft.agent.overlayPhase = phase; });
  }

  async handleTranscript({ rawTranscript, loadingToken, currentApp }: HandleTranscriptParams): Promise<HandleTranscriptResult> {
    const clearLoadingToken = () => {
      if (loadingToken && this.context.overlayLoadingTokenRef.current === loadingToken)
        this.context.overlayLoadingTokenRef.current = null;
    };

    if (!this.agent) {
      this.agent = await this.initAgent();
      if (!this.agent) {
        clearLoadingToken();
        return { shouldContinue: false, transcript: null, sanitizedTranscript: null, postProcessMetadata: {}, postProcessWarnings: [] };
      }
    }

    try {
      this.writeToTextFieldTool?.setPasteKeybind(currentApp?.pasteKeybind ?? null);

      this.uiMessages.push({ text: rawTranscript, sender: "me" });
      this.updateWindowState(this.uiMessages);

      const liveTools: string[] = [];
      this.uiMessages.push({ text: "", sender: "agent", tools: liveTools });

      getLogger().info(`Running agent with transcript (${rawTranscript.length} chars)`);
      const result = await this.agent.run(rawTranscript, {
        onToolExecuted: (tool) => {
          getLogger().verbose(`Agent tool executed: ${tool.displayName}`);
          liveTools.push(tool.displayName);
          this.updateWindowState(this.uiMessages);
        },
      });
      getLogger().info(`Agent response: ${result.response?.length ?? 0} chars, history=${result.history.length} turns`);

      this.uiMessages.pop();

      if (result.response) {
        const lastHistoryMessage = result.history[result.history.length - 1];
        const toolDisplayNames = lastHistoryMessage?.type === "assistant"
          ? lastHistoryMessage.tools.map((t) => t.displayName) : [];

        this.uiMessages.push({
          text: result.response, sender: "agent", isError: result.isError,
          tools: toolDisplayNames, draft: this.currentDraft ?? undefined,
        });
        this.currentDraft = null;
        this.updateWindowState(this.uiMessages);
      }

      clearLoadingToken();

      if (this.shouldStop) {
        await this.cleanup();
        return { shouldContinue: false, transcript: null, sanitizedTranscript: null, postProcessMetadata: {}, postProcessWarnings: [] };
      }
      return { shouldContinue: true, transcript: null, sanitizedTranscript: null, postProcessMetadata: {}, postProcessWarnings: [] };
    } catch (error) {
      getLogger().error(`Agent failed to process request: ${error}`);
      const errorMessage = error instanceof Error ? error.message : "An error occurred.";
      await showToast({ title: "Agent request failed", message: errorMessage, toastType: "error" });
      clearLoadingToken();
      await this.cleanup();
      return { shouldContinue: false, sanitizedTranscript: null, transcript: null, postProcessMetadata: {}, postProcessWarnings: [errorMessage] };
    }
  }

  async cleanup(): Promise<void> {
    getLogger().verbose("Cleaning up agent strategy");
    this.agent?.clearHistory();
    this.uiMessages = [];
    this.isFirstTurn = true;
    this.agent = null;
    this.shouldStop = false;
    this.writeToTextFieldTool = null;
    this.draftTool = null;
    this.currentDraft = null;
    produceAppState((draft) => { draft.agent.overlayPhase = "idle"; draft.agent.windowState = null; });
  }
}
```

---

## FICHIER 25 : OpenClawAgentStrategy (stratégie WebSocket) — `strategies/openclaw-agent.strategy.ts`

```typescript
import type { Nullable } from "@repo/types";
import { showToast } from "../actions/toast.actions";
import { OpenClawClient } from "../openclaw/openclaw-client";
import { produceAppState } from "../store";
import type { AgentWindowMessage } from "../types/agent-window.types";
import type { OverlayPhase } from "../types/overlay.types";
import type { HandleTranscriptParams, HandleTranscriptResult, StrategyContext, StrategyValidationError } from "../types/strategy.types";
import { getLogger } from "../utils/log.utils";
import { BaseStrategy } from "./base.strategy";

export class OpenClawAgentStrategy extends BaseStrategy {
  private uiMessages: AgentWindowMessage[] = [];
  private isFirstTurn = true;
  private client: OpenClawClient | null = null;
  private gatewayUrl: string;
  private token: string;

  constructor(context: StrategyContext, gatewayUrl: string, token: string) {
    super(context);
    this.gatewayUrl = gatewayUrl;
    this.token = token;
  }

  shouldStoreTranscript(): boolean { return false; }
  validateAvailability(): Nullable<StrategyValidationError> { return null; }

  private updateWindowState(messages: AgentWindowMessage[] | null): void {
    produceAppState((draft) => {
      draft.agent.windowState = messages
        ? { messages: messages.map((m) => ({ ...m, tools: m.tools ? [...m.tools] : undefined })) }
        : null;
    });
  }

  async onBeforeStart(): Promise<void> {
    if (this.isFirstTurn) {
      this.updateWindowState(null);
      this.isFirstTurn = false;
      getLogger().info("Connecting to OpenClaw gateway...");
      this.client = new OpenClawClient(this.gatewayUrl, this.token);
      try { await this.client.connect(); getLogger().info("Connected to OpenClaw gateway"); }
      catch (error) { getLogger().error(`Failed to connect to OpenClaw: ${error}`); this.client = null; throw error; }
    }
  }

  async setPhase(phase: OverlayPhase): Promise<void> {
    produceAppState((draft) => { draft.agent.overlayPhase = phase; });
  }

  async handleTranscript({ rawTranscript, loadingToken }: HandleTranscriptParams): Promise<HandleTranscriptResult> {
    const clearLoadingToken = () => {
      if (loadingToken && this.context.overlayLoadingTokenRef.current === loadingToken)
        this.context.overlayLoadingTokenRef.current = null;
    };

    if (!this.client?.isConnected()) {
      getLogger().warning("OpenClaw not connected, attempting reconnect...");
      this.client = new OpenClawClient(this.gatewayUrl, this.token);
      try { await this.client.connect(); }
      catch (error) {
        clearLoadingToken();
        await showToast({ title: "OpenClaw connection failed", message: String(error), toastType: "error" });
        return { shouldContinue: false, transcript: null, sanitizedTranscript: null, postProcessMetadata: {}, postProcessWarnings: [] };
      }
    }

    try {
      this.uiMessages.push({ text: rawTranscript, sender: "me" });
      this.updateWindowState(this.uiMessages);

      const agentMessage: AgentWindowMessage = { text: "", sender: "agent", tools: ["OpenClaw"] };
      this.uiMessages.push(agentMessage);

      getLogger().info(`Sending to OpenClaw: ${rawTranscript.length} chars`);
      const response = await this.client.sendMessage(rawTranscript, (deltaText) => {
        agentMessage.text = deltaText;
        this.updateWindowState(this.uiMessages);
      });

      this.uiMessages.pop();
      this.uiMessages.push({ text: response, sender: "agent", tools: ["OpenClaw"] });
      this.updateWindowState(this.uiMessages);

      getLogger().info(`OpenClaw response: ${response.length} chars`);
      clearLoadingToken();
      return { shouldContinue: true, transcript: null, sanitizedTranscript: null, postProcessMetadata: {}, postProcessWarnings: [] };
    } catch (error) {
      getLogger().error(`OpenClaw request failed: ${error}`);
      const errorMessage = error instanceof Error ? error.message : "An error occurred.";
      this.uiMessages.pop();
      this.uiMessages.push({ text: errorMessage, sender: "agent", isError: true });
      this.updateWindowState(this.uiMessages);
      clearLoadingToken();
      return { shouldContinue: true, transcript: null, sanitizedTranscript: null, postProcessMetadata: {}, postProcessWarnings: [] };
    }
  }

  async cleanup(): Promise<void> {
    getLogger().verbose("Cleaning up OpenClaw agent strategy");
    this.client?.disconnect();
    this.client = null;
    this.uiMessages = [];
    this.isFirstTurn = true;
    produceAppState((draft) => { draft.agent.overlayPhase = "idle"; draft.agent.windowState = null; });
  }
}
```

---

## FICHIER 26 : OpenClaw Client (WebSocket) — `openclaw/openclaw-client.ts`

```typescript
import { getLogger } from "../utils/log.utils";

type OpenClawFrame = {
  type: "req" | "res" | "event"; id?: string; method?: string;
  params?: Record<string, unknown>; ok?: boolean;
  payload?: Record<string, unknown>; error?: { code: string; message: string };
  event?: string; seq?: number;
};
type ChatDeltaCallback = (text: string) => void;
type PendingRequest = { resolve: (payload: unknown) => void; reject: (error: Error) => void };
type PendingChat = { resolve: (text: string) => void; reject: (error: Error) => void; onDelta?: ChatDeltaCallback; accumulatedText: string };

export class OpenClawClient {
  private ws: WebSocket | null = null;
  private connected = false;
  private pendingRequests = new Map<string, PendingRequest>();
  private pendingChats = new Map<string, PendingChat>();
  private connectResolve: ((value: void) => void) | null = null;
  private connectReject: ((error: Error) => void) | null = null;

  constructor(private gatewayUrl: string, private token: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connectResolve = resolve;
      this.connectReject = reject;
      this.ws = new WebSocket(this.gatewayUrl);
      this.ws.onopen = () => { getLogger().info("OpenClaw WebSocket opened, waiting for challenge..."); };
      this.ws.onerror = () => { reject(new Error("WebSocket connection error")); };
      this.ws.onclose = () => { this.connected = false; getLogger().info("OpenClaw WebSocket closed"); };
      this.ws.onmessage = (event) => {
        try { const frame = JSON.parse(event.data as string) as OpenClawFrame; this.handleFrame(frame); }
        catch (err) { getLogger().error(`Failed to parse OpenClaw frame: ${err}`); }
      };
    });
  }

  private handleFrame(frame: OpenClawFrame) {
    if (frame.type === "event") {
      if (frame.event === "connect.challenge") { this.handleChallenge(); return; }
      if (frame.event === "chat") { this.handleChatEvent(frame); return; }
      return;
    }
    if (frame.type === "res" && frame.id) {
      const pending = this.pendingRequests.get(frame.id);
      if (pending) {
        this.pendingRequests.delete(frame.id);
        if (frame.ok) pending.resolve(frame.payload);
        else pending.reject(new Error(frame.error?.message ?? "Request failed"));
      }
    }
  }

  private handleChallenge() {
    const connectId = crypto.randomUUID();
    this.pendingRequests.set(connectId, {
      resolve: () => {
        this.connected = true; getLogger().info("OpenClaw authenticated successfully");
        this.connectResolve?.(); this.connectResolve = null; this.connectReject = null;
      },
      reject: (err) => { this.connectReject?.(err); this.connectResolve = null; this.connectReject = null; },
    });
    this.ws!.send(JSON.stringify({
      type: "req", id: connectId, method: "connect",
      params: {
        minProtocol: 3, maxProtocol: 3,
        client: { id: "webchat", mode: "webchat", version: "1.0.0", platform: "macos", displayName: "Voquill" },
        auth: { token: this.token }, role: "operator", caps: [], commands: [],
      },
    }));
  }

  private handleChatEvent(frame: OpenClawFrame) {
    const payload = frame.payload as Record<string, unknown>;
    const runId = payload?.runId as string | undefined;
    if (!runId) return;
    const pending = this.pendingChats.get(runId);
    if (!pending) return;
    const state = payload?.state as string;

    if (state === "delta") {
      const text = this.extractText(payload?.message);
      if (text) { pending.accumulatedText = text; pending.onDelta?.(text); }
    } else if (state === "final") {
      this.pendingChats.delete(runId);
      const text = this.extractText(payload?.message);
      pending.resolve(text || pending.accumulatedText || "");
    } else if (state === "error") {
      this.pendingChats.delete(runId);
      pending.reject(new Error((payload?.errorMessage as string) ?? "Chat error"));
    } else if (state === "aborted") {
      this.pendingChats.delete(runId);
      pending.resolve(pending.accumulatedText || "[Aborted]");
    }
  }

  private extractText(message: unknown): string {
    const msg = message as { content?: { type: string; text: string }[] };
    if (!msg?.content) return "";
    return msg.content.filter((c) => c.type === "text").map((c) => c.text).join("");
  }

  sendMessage(text: string, onDelta?: ChatDeltaCallback): Promise<string> {
    if (!this.connected || !this.ws) return Promise.reject(new Error("Not connected to OpenClaw"));
    const idempotencyKey = crypto.randomUUID();
    const requestId = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      this.pendingChats.set(idempotencyKey, { resolve, reject, onDelta, accumulatedText: "" });
      this.pendingRequests.set(requestId, {
        resolve: () => {},
        reject: (err) => { this.pendingChats.delete(idempotencyKey); reject(err); },
      });
      this.ws!.send(JSON.stringify({
        type: "req", id: requestId, method: "chat.send",
        params: { sessionKey: "main", message: text, idempotencyKey },
      }));
    });
  }

  disconnect() {
    if (this.ws) { this.ws.close(); this.ws = null; }
    this.connected = false; this.pendingRequests.clear(); this.pendingChats.clear();
  }

  isConnected(): boolean { return this.connected; }
}
```

---

## FICHIER 27 : Sélection de stratégie (extrait `RootSideEffects.ts`)

```typescript
const currentMode = getAppState().activeRecordingMode;
let strategy = strategyRef.current;
if (!strategy) {
  const mode: RecordingMode = currentMode ?? "dictate";
  if (mode === "agent") {
    const prefs = getAgentModePrefs(getAppState());
    if (prefs.mode === "openclaw") {
      strategy = new OpenClawAgentStrategy(strategyContext, prefs.gatewayUrl, prefs.token);
    } else {
      strategy = new AgentStrategy(strategyContext);
    }
  } else {
    strategy = new DictationStrategy(strategyContext);
  }
  strategyRef.current = strategy;
}
```

---

## FICHIER 28 : Résolution du repo agent (extrait `repos/index.ts`)

```typescript
export const getAgentRepo = (): GenerateTextRepoOutput => {
  const state = getAppState();
  const prefs = getAgentModePrefs(state);
  if (prefs.mode === "openclaw") throw new Error("OpenClaw provides its own LLM processor");
  return getGenTextRepoInternal({ prefs, cloudModel: "large", useNewBackend: false });
};
```

---

## FICHIER 29 : Préférences agent mode (extrait `utils/user.utils.ts`)

```typescript
export type OpenClawGenerativePrefs = {
  mode: "openclaw";
  gatewayUrl: string;
  token: string;
  warnings: string[];
};

export type AgentModePrefs = GenerativePrefs | OpenClawGenerativePrefs;

export const getAgentModePrefs = (state: AppState): AgentModePrefs => {
  const agentMode = state.settings.agentMode;
  if (agentMode.mode === "openclaw" && !getIsEnterpriseEnabled()) {
    const warnings: string[] = [];
    if (!agentMode.openclawGatewayUrl) warnings.push("OpenClaw gateway URL is not configured.");
    if (!agentMode.openclawToken) warnings.push("OpenClaw token is not configured.");
    return { mode: "openclaw", gatewayUrl: agentMode.openclawGatewayUrl ?? "", token: agentMode.openclawToken ?? "", warnings };
  }
  return getGenPrefsInternal({ state, config: agentMode as GenerativeConfigInput, context: "agent mode", allowChange: getAllowsChangeAgentMode(state) });
};
```

---

## FICHIER 30 : Hotkey agent-dictate (extrait `utils/keyboard.utils.ts`)

```typescript
export const DICTATE_HOTKEY = "dictate";
export const AGENT_DICTATE_HOTKEY = "agent-dictate";
export const SWITCH_WRITING_STYLE_HOTKEY = "switch-writing-style";
export const CANCEL_TRANSCRIPTION_HOTKEY = "cancel-transcription";
export const ADDITIONAL_LANGUAGE_HOTKEY_PREFIX = "additional-language:";

export const isHoldActionHotkey = (actionName: string): boolean => {
  return (
    actionName === DICTATE_HOTKEY ||
    actionName === AGENT_DICTATE_HOTKEY ||
    actionName.startsWith(ADDITIONAL_LANGUAGE_HOTKEY_PREFIX)
  );
};
```

---

## Dépendances externes requises

```json
{
  "zod": "^3.x",
  "zod-to-json-schema": "^3.x",
  "dayjs": "^1.x",
  "immer": "^10.x",
  "zustand": "^4.x",
  "lodash-es": "^4.x",
  "@tauri-apps/api": "^2.x",
  "@tauri-apps/plugin-http": "^2.x"
}
```

---

## Commandes Tauri (Rust) requises côté natif

| Commande | Input | Output | Description |
|---|---|---|---|
| `get_text_field_info` | aucun | `{ textContent: string\|null, cursorPosition: number\|null, selectionLength: number\|null }` | Lit le champ texte focalisé via APIs d'accessibilité OS |
| `get_screen_context` | aucun | `{ screenContext: string\|null }` | Lit le texte visible à l'écran autour du focus |
| `paste` | `{ text: string, keybind: string\|null }` | void | Colle du texte dans le champ focalisé |

---

## Diagramme de séquence

```
┌────────┐   ┌──────────────┐   ┌───────┐   ┌──────────┐   ┌─────┐
│  User  │   │AgentStrategy │   │ Agent │   │  Tools   │   │ LLM │
└───┬────┘   └──────┬───────┘   └───┬───┘   └────┬─────┘   └──┬──┘
    │ voice          │              │             │            │
    │───────────────>│              │             │            │
    │                │ run(text)    │             │            │
    │                │─────────────>│             │            │
    │                │              │ Decision?   │            │
    │                │              │────────────────────────->│
    │                │              │ "get_context"            │
    │                │              │<─────────────────────────│
    │                │              │ execute()   │            │
    │                │              │────────────>│            │
    │                │              │ Tauri cmds  │            │
    │                │              │<────────────│            │
    │                │              │ Decision?   │            │
    │                │              │────────────────────────->│
    │                │              │ "draft"                  │
    │                │              │<─────────────────────────│
    │                │              │ Tool Args?  │            │
    │                │              │────────────────────────->│
    │                │              │ {text:".."}              │
    │                │              │<─────────────────────────│
    │                │              │ execute()   │            │
    │                │              │────────────>│            │
    │                │              │<────────────│            │
    │                │              │ Decision?   │            │
    │                │              │────────────────────────->│
    │                │              │ "respond"                │
    │                │              │<─────────────────────────│
    │                │              │ Final resp? │            │
    │                │              │────────────────────────->│
    │                │              │ "How does this look?"    │
    │                │              │<─────────────────────────│
    │                │<─────────────│             │            │
    │ UI: draft+msg  │              │             │            │
    │<───────────────│              │             │            │
    │ "looks good"   │              │             │            │
    │───────────────>│              │             │            │
    │                │ run(...)     │             │            │
    │                │─────────────>│             │            │
    │                │              │ "write_to_text_field"    │
    │                │              │────────────>│            │
    │                │              │ paste+stop  │            │
    │                │              │<────────────│            │
    │                │<─────────────│             │            │
    │ cleanup        │              │             │            │
    │<───────────────│              │             │            │
```
