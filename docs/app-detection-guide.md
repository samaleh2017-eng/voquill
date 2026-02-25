# Détection stable de l'application active (Foreground App Detection)

## Prompt d'intégration

> Intègre un système de détection de l'application active (foreground window) dans mon projet Tauri. Le système doit :
>
> 1. Détecter l'application au premier plan (nom + icône) via un appel one-shot (pas de polling continu)
> 2. Normaliser le nom de l'app en un ID déterministe (ex: "Google Chrome" → `google_chrome`)
> 3. Persister l'app dans SQLite avec un upsert idempotent (`INSERT...ON CONFLICT`)
> 4. Éviter tout travail redondant : si l'app est déjà enregistrée avec une icône, ne rien refaire
> 5. Encoder l'icône en base64 PNG côté Rust, la stocker côté frontend
> 6. Supporter macOS (NSRunningApplication), Windows (GetForegroundWindow), et un fallback pour Linux
>
> Le pattern est : **détecter → normaliser → vérifier le cache → persister si nouveau**.

---

## Pourquoi c'est stable

Le système repose sur **3 garanties de stabilité** :

### 1. Détection one-shot (pas de listener continu)

Chaque appel crée un `FocusTracker`, capture **une seule fenêtre**, puis s'arrête immédiatement via un `AtomicBool`. Il n'y a pas de boucle, pas de polling, pas de thread qui tourne en arrière-plan.

```rust
// Rust — one-shot detection
pub fn get_current_app_info() -> Result<CurrentAppInfo, AppInfoError> {
    let config = FocusTrackerConfig::new().with_icon_size(128);
    let icon_size = config.icon.get_size_or_default();
    let tracker = FocusTracker::with_config(config.clone());
    let stop_signal = AtomicBool::new(false);
    let mut captured: Option<FocusedWindow> = None;

    tracker
        .track_focus_with_stop(
            |window| {
                captured = Some(window);
                stop_signal.store(true, Ordering::Relaxed); // ← arrêt immédiat
                Ok(())
            },
            &stop_signal,
        )
        .map_err(map_focus_error)?;

    let window = captured.ok_or(AppInfoError::NotAvailable)?;
    build_app_info(window, icon_size)
}
```

**Résultat** : chaque appel est isolé, sans effet de bord. Tu peux l'appeler 100 fois, il ne crée jamais de listener persistant.

### 2. ID déterministe (même app = même ID, toujours)

Le nom de l'app est normalisé en un identifiant stable. Que Chrome soit ouvert, fermé, ou réouvert, son ID sera toujours `google_chrome`.

```typescript
// TypeScript — normalisation de l'ID
export const normalizeAppTargetId = (name: string): string => {
  const trimmed = name.trim().toLowerCase();
  const sanitized = trimmed
    .replace(/[^a-z0-9]+/g, "_")  // caractères spéciaux → underscore
    .replace(/^_+|_+$/g, "")       // pas d'underscore en début/fin
    .replace(/_+/g, "_");          // pas de double underscore

  if (sanitized.length === 0) {
    return `app_target_${crypto.randomUUID().replace(/-/g, "")}`;
  }

  return sanitized;
};
```

| Nom détecté        | ID normalisé     |
|--------------------|------------------|
| Google Chrome      | `google_chrome`  |
| Visual Studio Code | `visual_studio_code` |
| Firefox            | `firefox`        |
| Slack              | `slack`          |

**Résultat** : fermer et rouvrir Chrome ne crée pas un doublon. L'ID est identique à chaque fois.

### 3. Skip si déjà enregistré (idempotence frontend)

Avant tout travail lourd (upload icône, écriture DB), le frontend vérifie si l'app existe déjà avec une icône. Si oui, il ne fait **rien**.

```typescript
// TypeScript — registration conditionnelle
export const tryRegisterCurrentAppTarget = async (): Promise<Nullable<AppTarget>> => {
  // 1. Détection one-shot
  const appInfo = await invoke<CurrentAppInfoResponse>("get_current_app_info");
  const appName = appInfo.appName?.trim() ?? "";
  const appTargetId = normalizeAppTargetId(appName);

  // 2. Vérifier le cache mémoire
  const existingApp = getRec(getAppState().appTargetById, appTargetId);

  // 3. Skip si déjà connu avec icône
  const shouldRegister = !existingApp || !existingApp.iconPath;
  if (!shouldRegister) {
    return existingApp; // ← aucun appel réseau, aucune écriture DB
  }

  // 4. Sinon, enregistrer (upload icône + upsert DB)
  let iconPath: string | undefined;
  if (appInfo.iconBase64) {
    const targetPath = buildAppIconPath(getAppState(), appTargetId);
    await getStorageRepo().uploadData({
      path: targetPath,
      data: decodeBase64Icon(appInfo.iconBase64),
    });
    iconPath = targetPath;
  }

  await upsertAppTarget({
    id: appTargetId,
    name: appName,
    toneId: existingApp?.toneId ?? null,
    iconPath: iconPath ?? existingApp?.iconPath ?? null,
    pasteKeybind: existingApp?.pasteKeybind ?? null,
  });

  return getRec(getAppState().appTargetById, appTargetId) ?? null;
};
```

**Résultat** : la première fois qu'on utilise Chrome, il y a un upload d'icône + écriture DB. Toutes les fois suivantes, c'est un simple lookup en mémoire (~0ms).

---

## Architecture complète

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (TypeScript)                  │
│                                                             │
│  stopRecording()                                            │
│       │                                                     │
│       ▼                                                     │
│  tryRegisterCurrentAppTarget()                              │
│       │                                                     │
│       ├── invoke("get_current_app_info")  ──► Rust Backend  │
│       │                                                     │
│       ├── normalizeAppTargetId(appName)                     │
│       │       "Google Chrome" → "google_chrome"             │
│       │                                                     │
│       ├── existingApp = appTargetById["google_chrome"]      │
│       │                                                     │
│       ├─► SI existingApp ET existingApp.iconPath :          │
│       │       return existingApp  (SKIP — 0 travail)        │
│       │                                                     │
│       └─► SINON :                                           │
│               uploadData(iconBase64)                        │
│               upsertAppTarget(id, name, iconPath)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (Rust)                         │
│                                                             │
│  get_current_app_info()                                     │
│       │                                                     │
│       ├── FocusTracker::track_focus_with_stop()             │
│       │       capture 1 fenêtre → stop immédiat             │
│       │                                                     │
│       ├── resolve_app_name(window)                          │
│       │       macOS: NSRunningApplication.localizedName     │
│       │       Windows: titre de fenêtre (rsplit " - ")      │
│       │       Fallback: process_name                        │
│       │                                                     │
│       └── encode_icon_as_png(icon) → base64                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      DATABASE (SQLite)                      │
│                                                             │
│  INSERT INTO app_targets (id, name, icon_path, ...)         │
│  ON CONFLICT(id) DO UPDATE SET                              │
│    name = excluded.name,                                    │
│    icon_path = excluded.icon_path;                          │
│                                                             │
│  → Jamais de doublon, même en cas d'appel concurrent        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Code à intégrer

### Étape 1 — Cargo.toml (dépendances Rust)

```toml
[dependencies]
ferrous-focus = { git = "https://github.com/MichaelWGibson/ferrous-focus" }
image = { version = "0.25", default-features = false, features = ["jpeg"] }
base64 = "0.21"
serde = { version = "1", features = ["derive"] }
thiserror = "1"

# macOS seulement
[target.'cfg(target_os = "macos")'.dependencies]
cocoa = "0.24"
objc = "0.2"
```

### Étape 2 — Rust : détection one-shot + icône

```rust
use std::sync::atomic::{AtomicBool, Ordering};
use base64::{engine::general_purpose, Engine as _};
use ferrous_focus::{FocusTracker, FocusTrackerConfig, FocusedWindow};
use image::{codecs::png::PngEncoder, imageops::FilterType, ExtendedColorType, ImageEncoder, RgbaImage};
use thiserror::Error;

const DEFAULT_ICON_SIZE: u32 = 128;

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CurrentAppInfo {
    pub app_name: String,
    pub icon_base64: String,
}

#[derive(Debug, Error)]
pub enum AppInfoError {
    #[error("Failed to observe focused window: {0}")]
    Focus(String),
    #[error("Focused window info unavailable")]
    NotAvailable,
    #[error("Unsupported platform")]
    Unsupported,
    #[error("Permission denied")]
    PermissionDenied,
    #[error("Icon encode error: {0}")]
    Encode(String),
}

/// Capture l'app au premier plan. One-shot : aucun listener persistant.
pub fn get_current_app_info() -> Result<CurrentAppInfo, AppInfoError> {
    let config = FocusTrackerConfig::new().with_icon_size(DEFAULT_ICON_SIZE);
    let icon_size = config.icon.get_size_or_default();
    let tracker = FocusTracker::with_config(config.clone());
    let stop_signal = AtomicBool::new(false);
    let mut captured: Option<FocusedWindow> = None;

    tracker
        .track_focus_with_stop(
            |window| {
                captured = Some(window);
                stop_signal.store(true, Ordering::Relaxed);
                Ok(())
            },
            &stop_signal,
        )
        .map_err(|e| AppInfoError::Focus(e.to_string()))?;

    let mut window = captured.ok_or(AppInfoError::NotAvailable)?;
    let app_name = resolve_app_name(&window);
    let icon = window.icon.take().unwrap_or_else(|| {
        image::ImageBuffer::from_pixel(icon_size, icon_size, image::Rgba([80, 80, 80, 255]))
    });

    let resized = if icon.width() != DEFAULT_ICON_SIZE || icon.height() != DEFAULT_ICON_SIZE {
        image::imageops::resize(&icon, DEFAULT_ICON_SIZE, DEFAULT_ICON_SIZE, FilterType::Lanczos3)
    } else {
        icon
    };

    let mut buf = Vec::new();
    PngEncoder::new(&mut buf)
        .write_image(resized.as_raw(), resized.width(), resized.height(), ExtendedColorType::Rgba8)
        .map_err(|e| AppInfoError::Encode(e.to_string()))?;

    Ok(CurrentAppInfo {
        app_name,
        icon_base64: general_purpose::STANDARD.encode(buf),
    })
}

fn resolve_app_name(window: &FocusedWindow) -> String {
    // macOS : NSRunningApplication.localizedName (voir code complet ci-dessous)
    // Fallback : extraire depuis le titre de la fenêtre ("Page - Google Chrome" → "Google Chrome")
    // Dernier recours : process_name
    extract_app_name_from_title(window)
        .or_else(|| window.process_name.clone())
        .map(|n| n.trim().to_string())
        .filter(|n| !n.is_empty())
        .unwrap_or_else(|| "Unknown application".to_string())
}

fn extract_app_name_from_title(window: &FocusedWindow) -> Option<String> {
    let title = window.window_title.as_deref()?.trim();
    if title.is_empty() { return None; }
    for sep in [" — ", " – ", " - "] {
        if let Some((_, name)) = title.rsplit_once(sep) {
            let name = name.trim();
            if !name.is_empty() { return Some(name.to_string()); }
        }
    }
    None
}
```

### Étape 3 — Tauri command

```rust
#[tauri::command]
pub fn get_current_app_info_cmd() -> Result<CurrentAppInfo, String> {
    get_current_app_info().map_err(|e| e.to_string())
}

// Dans main.rs :
// .invoke_handler(tauri::generate_handler![get_current_app_info_cmd])
```

### Étape 4 — TypeScript : normalisation + cache + registration

```typescript
// --- types.ts ---
export type AppTarget = {
  id: string;
  name: string;
  iconPath: string | null;
  createdAt: string;
};

// --- normalize.ts ---
export const normalizeAppTargetId = (name: string): string => {
  const sanitized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  return sanitized.length === 0
    ? `app_target_${crypto.randomUUID().replace(/-/g, "")}`
    : sanitized;
};

// --- app-target.actions.ts ---
import { invoke } from "@tauri-apps/api/core";

type CurrentAppInfoResponse = {
  appName: string;
  iconBase64: string;
};

// Cache en mémoire (Zustand, Map, ou simple objet)
const appTargetCache: Record<string, AppTarget> = {};

export const tryRegisterCurrentAppTarget = async (): Promise<AppTarget | null> => {
  // 1. Détection one-shot côté Rust
  const appInfo = await invoke<CurrentAppInfoResponse>("get_current_app_info_cmd");
  const appName = appInfo.appName?.trim() ?? "";
  const appTargetId = normalizeAppTargetId(appName);

  // 2. Vérifier le cache — si déjà connu avec icône, SKIP
  const existing = appTargetCache[appTargetId];
  if (existing && existing.iconPath) {
    return existing; // ← 0 travail, 0 appel réseau
  }

  // 3. Stocker l'icône (adapter selon ton storage : fs local, S3, etc.)
  let iconPath: string | null = null;
  if (appInfo.iconBase64) {
    const bytes = base64ToUint8Array(appInfo.iconBase64);
    iconPath = `app-icons/${appTargetId}.png`;
    await saveIcon(iconPath, bytes); // ← ta fonction de stockage
  }

  // 4. Upsert dans la DB (SQLite via Tauri)
  const target = await invoke<AppTarget>("app_target_upsert", {
    args: {
      id: appTargetId,
      name: appName,
      iconPath: iconPath ?? existing?.iconPath ?? null,
    },
  });

  // 5. Mettre à jour le cache mémoire
  appTargetCache[appTargetId] = target;
  return target;
};

function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
```

### Étape 5 — SQLite : upsert idempotent

```sql
CREATE TABLE IF NOT EXISTS app_targets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  icon_path TEXT
);

-- Upsert : insert si nouveau, update si existant. Jamais de doublon.
INSERT INTO app_targets (id, name, created_at, icon_path)
VALUES (?1, ?2, ?3, ?4)
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  icon_path = excluded.icon_path;
```

---

## Scénario de stabilité

| Action | Ce qui se passe | Travail effectué |
|--------|----------------|-----------------|
| 1ère dictée dans Chrome | Détection → `google_chrome` non trouvé → upload icône → insert DB | **Complet** |
| 2ème dictée dans Chrome | Détection → `google_chrome` trouvé avec icône → `return existing` | **Aucun** (cache hit) |
| Fermer Chrome, rouvrir, 3ème dictée | Détection → même nom → même ID → trouvé en cache → skip | **Aucun** |
| 1ère dictée dans Slack | Détection → `slack` non trouvé → upload icône → insert DB | **Complet** |
| Redémarrage de l'app | `loadAppTargets()` recharge depuis SQLite → cache rempli | **1 query SELECT** |
| Dictée dans Chrome après redémarrage | Détection → `google_chrome` trouvé en cache (chargé depuis DB) → skip | **Aucun** |

---

## Points clés à retenir

1. **One-shot, pas de polling** — `FocusTracker` + `stop_signal` = 1 capture puis stop
2. **ID déterministe** — `normalizeAppTargetId()` garantit le même ID pour la même app
3. **Cache mémoire** — `appTargetById` évite tout appel DB après la 1ère registration
4. **Upsert SQL** — `ON CONFLICT(id) DO UPDATE` empêche les doublons même en cas de race condition
5. **Appel différé** — Appeler au **stop** de l'enregistrement, pas au start (la capture d'icône est lente ~50-200ms)
6. **Permissions** — macOS nécessite Accessibility permission, Windows fonctionne sans permission supplémentaire
