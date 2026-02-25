import {
  RiCloseLine,
  RiArrowDownSLine,
  RiSearchLine,
  RiStarLine,
  RiStarFill,
  RiLoader4Line,
} from "@remixicon/react";
import { OpenRouterModel } from "@repo/types";
import { OPENROUTER_FAVORITE_MODELS } from "@repo/voice-ai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Virtuoso } from "react-virtuoso";
import {
  getOpenRouterConfigForKey,
  loadOpenRouterModels,
  setOpenRouterSearchQuery,
  toggleOpenRouterFavoriteModel,
} from "../../actions/openrouter.actions";
import { useAppStore } from "../../store";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type OpenRouterModelPickerProps = {
  apiKeyId: string;
  selectedModel: string | null;
  onModelSelect: (modelId: string) => void;
  disabled?: boolean;
};

type ModelRowProps = {
  model: OpenRouterModel;
  selected: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
};

type ListItem =
  | { type: "header"; label: string; count: number }
  | { type: "model"; model: OpenRouterModel; isFavorite: boolean }
  | { type: "divider" };

const ModelRow = ({
  model,
  selected,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: ModelRowProps) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`px-3 py-2 cursor-pointer flex items-center gap-2 rounded-md transition-colors ${
        selected
          ? "bg-accent"
          : hovered
            ? "bg-accent/50"
            : "bg-transparent"
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate leading-tight ${selected ? "font-semibold" : ""}`}>
          {model.name}
        </p>
        <p className="text-xs text-muted-foreground truncate leading-tight">
          {model.id}
        </p>
      </div>
      {(hovered || isFavorite) && (
        <button
          className={`p-1 rounded hover:bg-accent ${isFavorite ? "text-amber-500" : "text-muted-foreground"}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
        >
          {isFavorite ? (
            <RiStarFill className="h-4 w-4" />
          ) : (
            <RiStarLine className="h-4 w-4" />
          )}
        </button>
      )}
      {selected && !hovered && !isFavorite && (
        <span className="text-xs text-primary font-semibold">
          <FormattedMessage defaultMessage="Selected" />
        </span>
      )}
    </div>
  );
};

export const OpenRouterModelPicker = ({
  apiKeyId,
  selectedModel,
  onModelSelect,
  disabled = false,
}: OpenRouterModelPickerProps) => {
  const [expanded, setExpanded] = useState(false);
  const models = useAppStore((state) => state.settings.openRouterModels);
  const modelsStatus = useAppStore(
    (state) => state.settings.openRouterModelsStatus,
  );
  const searchQuery = useAppStore(
    (state) => state.settings.openRouterSearchQuery,
  );

  const config = getOpenRouterConfigForKey(apiKeyId);
  const userFavorites = config?.favoriteModels;

  const allFavoriteIds = useMemo(() => {
    if (userFavorites !== undefined) {
      return new Set(userFavorites);
    }
    return new Set<string>(OPENROUTER_FAVORITE_MODELS);
  }, [userFavorites]);

  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) {
      return models;
    }
    const query = searchQuery.toLowerCase();
    return models.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.id.toLowerCase().includes(query),
    );
  }, [models, searchQuery]);

  const favoriteModels = useMemo(() => {
    return filteredModels.filter((m) => allFavoriteIds.has(m.id));
  }, [filteredModels, allFavoriteIds]);

  const otherModels = useMemo(() => {
    return filteredModels.filter((m) => !allFavoriteIds.has(m.id));
  }, [filteredModels, allFavoriteIds]);

  const listItems = useMemo((): ListItem[] => {
    const items: ListItem[] = [];

    if (favoriteModels.length > 0) {
      items.push({
        type: "header",
        label: "Favorites",
        count: favoriteModels.length,
      });
      favoriteModels.forEach((model) => {
        items.push({ type: "model", model, isFavorite: true });
      });
      items.push({ type: "divider" });
    }

    items.push({
      type: "header",
      label: "All Models",
      count: otherModels.length,
    });
    otherModels.forEach((model) => {
      items.push({ type: "model", model, isFavorite: false });
    });

    return items;
  }, [favoriteModels, otherModels]);

  const selectedModelData = useMemo(() => {
    return models.find((m) => m.id === selectedModel);
  }, [models, selectedModel]);

  useEffect(() => {
    if (expanded && modelsStatus === "idle") {
      void loadOpenRouterModels();
    }
  }, [expanded, modelsStatus]);

  const handleExpand = useCallback(() => {
    if (!disabled) {
      setExpanded(true);
    }
  }, [disabled]);

  const handleCollapse = useCallback(() => {
    setExpanded(false);
    setOpenRouterSearchQuery("");
  }, []);

  const handleModelSelect = useCallback(
    (modelId: string) => {
      onModelSelect(modelId);
      handleCollapse();
    },
    [onModelSelect, handleCollapse],
  );

  const handleToggleFavorite = useCallback(
    (modelId: string) => {
      void toggleOpenRouterFavoriteModel(apiKeyId, modelId);
    },
    [apiKeyId],
  );

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setOpenRouterSearchQuery(event.target.value);
    },
    [],
  );

  if (!expanded) {
    return (
      <div
        onClick={handleExpand}
        className={`rounded-lg border border-border px-3 py-2 cursor-pointer flex items-center justify-between transition-colors hover:border-muted-foreground/40 ${
          disabled ? "opacity-50 cursor-default hover:border-border" : ""
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            <FormattedMessage defaultMessage="Model" />
          </p>
          <p className="text-sm truncate">
            {selectedModelData?.name ?? selectedModel ?? (
              <FormattedMessage defaultMessage="Select a model" />
            )}
          </p>
        </div>
        <RiArrowDownSLine className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8 pr-8"
            placeholder="Search models..."
            value={searchQuery}
            onChange={handleSearchChange}
            autoFocus
          />
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-accent"
            onClick={handleCollapse}
          >
            <RiCloseLine className="h-4 w-4" />
          </button>
        </div>
      </div>

      {modelsStatus === "loading" && (
        <div className="flex flex-col items-center gap-2 py-8">
          <RiLoader4Line className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            <FormattedMessage defaultMessage="Loading models..." />
          </p>
        </div>
      )}

      {modelsStatus === "error" && (
        <div className="flex flex-col items-center gap-2 py-8">
          <p className="text-sm text-destructive">
            <FormattedMessage defaultMessage="Failed to load models" />
          </p>
        </div>
      )}

      {modelsStatus === "success" && (
        <div className="h-80">
          {listItems.length > 1 ? (
            <Virtuoso
              style={{ height: "100%" }}
              data={listItems}
              itemContent={(_index, item) => {
                if (item.type === "header") {
                  return (
                    <div className="px-3 pt-3 pb-1">
                      <span className="text-xs text-muted-foreground font-semibold">
                        {item.label}
                        <span className="ml-1">({item.count})</span>
                      </span>
                    </div>
                  );
                }
                if (item.type === "divider") {
                  return <Separator className="my-2" />;
                }
                return (
                  <ModelRow
                    model={item.model}
                    selected={selectedModel === item.model.id}
                    isFavorite={item.isFavorite}
                    onSelect={() => handleModelSelect(item.model.id)}
                    onToggleFavorite={() => handleToggleFavorite(item.model.id)}
                  />
                );
              }}
            />
          ) : (
            <div className="px-3 py-4">
              <p className="text-sm text-muted-foreground">
                <FormattedMessage defaultMessage="No models found" />
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
