import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  setOpenclawGatewayUrl,
  setOpenclawToken,
  setPreferredAgentMode,
  setPreferredAgentModeApiKeyId,
} from "../../actions/user.actions";
import { useAppStore } from "../../store";
import { type AgentMode } from "../../types/ai.types";
import { getAllowsChangeAgentMode } from "../../utils/enterprise.utils";
import { ManagedByOrgNotice } from "../common/ManagedByOrgNotice";
import {
  SegmentedControl,
  SegmentedControlOption,
} from "../common/SegmentedControl";
import { maybeArrayElements } from "./AIPostProcessingConfiguration";
import { ApiKeyList } from "./ApiKeyList";
import { VoquillCloudSetting } from "./VoquillCloudSetting";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AIAgentModeConfigurationProps = {
  hideCloudOption?: boolean;
};

export const AIAgentModeConfiguration = ({
  hideCloudOption,
}: AIAgentModeConfigurationProps) => {
  const agentMode = useAppStore((state) => state.settings.agentMode);
  const allowChange = useAppStore(getAllowsChangeAgentMode);
  const isEnterprise = useAppStore((state) => state.isEnterprise);
  const intl = useIntl();

  const handleModeChange = useCallback((mode: AgentMode) => {
    void setPreferredAgentMode(mode);
  }, []);

  const handleApiKeyChange = useCallback((id: string | null) => {
    void setPreferredAgentModeApiKeyId(id);
  }, []);

  const handleGatewayUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      void setOpenclawGatewayUrl(e.target.value || null);
    },
    [],
  );

  const handleTokenChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      void setOpenclawToken(e.target.value || null);
    },
    [],
  );

  if (!allowChange) {
    return <ManagedByOrgNotice />;
  }

  return (
    <div className="flex w-full flex-col items-start gap-4">
      <SegmentedControl<AgentMode>
        value={agentMode.mode}
        onChange={handleModeChange}
        options={[
          ...maybeArrayElements<SegmentedControlOption<AgentMode>>(
            !hideCloudOption,
            [{ value: "cloud", label: "Voquill" }],
          ),
          { value: "api", label: "API" },
          ...maybeArrayElements<SegmentedControlOption<AgentMode>>(
            !isEnterprise,
            [{ value: "openclaw", label: "OpenClaw" }],
          ),
          { value: "none", label: "Off" },
        ]}
        ariaLabel="Agent mode"
      />

      {agentMode.mode === "none" && (
        <p className="text-sm text-muted-foreground">
          <FormattedMessage defaultMessage="Agent mode is disabled." />
        </p>
      )}

      {agentMode.mode === "api" && (
        <ApiKeyList
          selectedApiKeyId={agentMode.selectedApiKeyId}
          onChange={handleApiKeyChange}
          context="post-processing"
        />
      )}

      {agentMode.mode === "cloud" && <VoquillCloudSetting />}

      {agentMode.mode === "openclaw" && (
        <div className="flex w-full flex-col gap-3">
          <div className="text-sm text-muted-foreground">
            <FormattedMessage
              defaultMessage="To connect, you need your <b>gateway URL</b> and <b>token</b>. <ul><li>Gateway URL is <code>ws://localhost:18789</code> by default.</li><li>To find your token, run: <code>openclaw config get gateway.auth.token</code></li></ul>"
              values={{
                b: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
                ul: (chunks: React.ReactNode) => (
                  <ul className="my-2 list-disc pl-5">{chunks}</ul>
                ),
                li: (chunks: React.ReactNode) => (
                  <li className="mb-1">{chunks}</li>
                ),
                code: (chunks: React.ReactNode) => (
                  <code className="rounded bg-muted px-1 py-0.5 text-[0.85em]">
                    {chunks}
                  </code>
                ),
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              {intl.formatMessage({ defaultMessage: "Gateway URL" })}
            </Label>
            <Input
              placeholder="ws://localhost:18789"
              value={agentMode.openclawGatewayUrl ?? ""}
              onChange={handleGatewayUrlChange}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              {intl.formatMessage({ defaultMessage: "OpenClaw token" })}
            </Label>
            <Input
              type="password"
              value={agentMode.openclawToken ?? ""}
              onChange={handleTokenChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};
