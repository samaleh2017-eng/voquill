import {
  RiAddLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiCloseLine,
  RiArrowDownSLine,
} from "@remixicon/react";
import { OpenRouterProviderRouting as ProviderRoutingType } from "@repo/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";
import {
  getOpenRouterConfigForKey,
  loadOpenRouterProviders,
  updateOpenRouterProviderRouting,
} from "../../actions/openrouter.actions";
import { useAppStore } from "../../store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OpenRouterProviderRoutingProps = {
  apiKeyId: string;
  disabled?: boolean;
};

export const OpenRouterProviderRouting = ({
  apiKeyId,
  disabled = false,
}: OpenRouterProviderRoutingProps) => {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const providers = useAppStore((state) => state.settings.openRouterProviders);
  const providersStatus = useAppStore(
    (state) => state.settings.openRouterProvidersStatus,
  );

  useEffect(() => {
    if (expanded && providersStatus === "idle") {
      void loadOpenRouterProviders();
    }
  }, [expanded, providersStatus]);

  const config = getOpenRouterConfigForKey(apiKeyId);
  const routing = config?.providerRouting ?? {};

  const providerOrder = routing.order ?? [];
  const allowFallbacks = routing.allow_fallbacks ?? true;
  const dataCollection = routing.data_collection ?? "allow";

  const availableToAdd = useMemo(() => {
    return providers.filter((p) => !providerOrder.includes(p.slug));
  }, [providers, providerOrder]);

  const getProviderName = useCallback(
    (slug: string) => {
      const provider = providers.find((p) => p.slug === slug);
      return provider?.name ?? slug;
    },
    [providers],
  );

  const summary = useMemo(() => {
    if (providerOrder.length === 0) {
      return null;
    }
    const names = providerOrder.map(getProviderName);
    if (names.length <= 2) {
      return names.join(", ");
    }
    return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
  }, [providerOrder, getProviderName]);

  const handleToggleExpand = useCallback(() => {
    if (!disabled) {
      setExpanded((prev) => !prev);
    }
  }, [disabled]);

  const saveRouting = useCallback(
    async (newRouting: ProviderRoutingType) => {
      setSaving(true);
      try {
        await updateOpenRouterProviderRouting(apiKeyId, newRouting);
      } finally {
        setSaving(false);
      }
    },
    [apiKeyId],
  );

  const handleAddProvider = useCallback(
    (provider: string) => {
      const newOrder = [...providerOrder, provider];
      void saveRouting({
        ...routing,
        order: newOrder,
      });
    },
    [providerOrder, routing, saveRouting],
  );

  const handleRemoveProvider = useCallback(
    (index: number) => {
      const newOrder = providerOrder.filter((_: string, i: number) => i !== index);
      void saveRouting({
        ...routing,
        order: newOrder.length > 0 ? newOrder : undefined,
      });
    },
    [providerOrder, routing, saveRouting],
  );

  const handleMoveProvider = useCallback(
    (index: number, direction: "up" | "down") => {
      const newOrder = [...providerOrder];
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= newOrder.length) {
        return;
      }
      [newOrder[index], newOrder[newIndex]] = [
        newOrder[newIndex],
        newOrder[index],
      ];
      void saveRouting({
        ...routing,
        order: newOrder,
      });
    },
    [providerOrder, routing, saveRouting],
  );

  const handleFallbacksChange = useCallback(
    (checked: boolean) => {
      void saveRouting({
        ...routing,
        allow_fallbacks: checked,
      });
    },
    [routing, saveRouting],
  );

  const handleDataCollectionChange = useCallback(
    (value: string) => {
      void saveRouting({
        ...routing,
        data_collection: value as "allow" | "deny",
      });
    },
    [routing, saveRouting],
  );

  return (
    <div className="mt-3">
      <div
        onClick={handleToggleExpand}
        className={`flex items-center gap-2 cursor-pointer py-1 group ${
          disabled ? "opacity-50 cursor-default" : ""
        }`}
      >
        <RiArrowDownSLine
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
        <span className="text-sm text-muted-foreground font-medium">
          <FormattedMessage defaultMessage="Advanced Routing" />
        </span>
        {summary && !expanded && (
          <span className="text-xs text-muted-foreground ml-2">
            ({summary})
          </span>
        )}
      </div>

      {expanded && (
        <div
          className={`mt-2 rounded-lg border border-border p-4 ${
            saving ? "opacity-70 pointer-events-none" : ""
          }`}
        >
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-sm font-semibold mb-1">
                <FormattedMessage defaultMessage="Provider Priority" />
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                <FormattedMessage defaultMessage="Set preferred providers in order of priority" />
              </p>

              {providerOrder.length > 0 && (
                <div className="flex flex-col gap-1 mb-3">
                  {providerOrder.map((provider: string, index: number) => (
                    <div
                      key={provider}
                      className="rounded-md border border-border px-3 py-1.5 flex items-center gap-2"
                    >
                      <div className="flex gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={index === 0}
                          onClick={() => handleMoveProvider(index, "up")}
                        >
                          <RiArrowUpLine className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={index === providerOrder.length - 1}
                          onClick={() => handleMoveProvider(index, "down")}
                        >
                          <RiArrowDownLine className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <span className="text-sm flex-1">
                        {getProviderName(provider)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveProvider(index)}
                      >
                        <RiCloseLine className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {availableToAdd.length > 0 && (
                <Select
                  value=""
                  onValueChange={handleAddProvider}
                >
                  <SelectTrigger className="w-48">
                    <div className="flex items-center gap-1">
                      <RiAddLine className="h-3.5 w-3.5" />
                      <SelectValue placeholder="Add provider" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {availableToAdd.map((provider) => (
                      <SelectItem key={provider.slug} value={provider.slug}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex items-start gap-3">
              <Switch
                checked={allowFallbacks}
                onCheckedChange={handleFallbacksChange}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm">
                  <FormattedMessage defaultMessage="Allow fallbacks" />
                </p>
                <p className="text-xs text-muted-foreground">
                  <FormattedMessage defaultMessage="Use other providers if preferred ones are unavailable" />
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">
                <FormattedMessage defaultMessage="Data Collection" />
              </p>
              <RadioGroup
                value={dataCollection}
                onValueChange={handleDataCollectionChange}
                className="gap-3"
              >
                <div className="flex items-start gap-2">
                  <RadioGroupItem value="allow" id="dc-allow" className="mt-0.5" />
                  <Label htmlFor="dc-allow" className="font-normal cursor-pointer">
                    <p className="text-sm">
                      <FormattedMessage defaultMessage="Allow" />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <FormattedMessage defaultMessage="Help improve OpenRouter" />
                    </p>
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <RadioGroupItem value="deny" id="dc-deny" className="mt-0.5" />
                  <Label htmlFor="dc-deny" className="font-normal cursor-pointer">
                    <p className="text-sm">
                      <FormattedMessage defaultMessage="Deny" />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <FormattedMessage defaultMessage="More private, no data collection" />
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
