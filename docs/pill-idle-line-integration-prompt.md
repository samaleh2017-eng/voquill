# Prompt : Intégrer un état "idle thin line" sur la pill overlay

## Contexte

J'ai une pill overlay flottante pour un enregistrement vocal. Actuellement, quand l'utilisateur choisit "toujours visible" dans les paramètres, c'est le **grand pill complet** qui s'affiche en permanence. Je veux changer ce comportement :

- **Mode "toujours visible" (persistent)** : afficher une **fine ligne discrète** (6px de haut, 48px de large) quand l'enregistrement est inactif (idle)
- **Quand l'enregistrement démarre** (hotkey, clic, etc.) : la fine ligne s'**expand fluidement** en un **vrai pill complet** (32px de haut, 120px de large) avec waveform audio
- **Quand l'enregistrement s'arrête** : le pill se **rétracte fluidement** vers la fine ligne
- **La transition doit être sans lag**, pilotée par CSS transitions (200ms ease-out)
- **Quand le curseur survole la fine ligne** : elle s'expand aussi en pill complet (pour permettre le clic)

## Architecture de référence (VoQuill)

L'architecture repose sur 3 couches :

```
Rust (AtomicU8 lock-free)  →  Event bridge  →  React (CSS transitions)
      phase store              emit/listen        state + animations
```

### Flux de données :

```
1. Hotkey pressé → setPhase("recording") → Rust AtomicU8.store
2. Cursor tracker (60ms poll) voit is_idle() == false → expanded = true
3. Rust emit("pill_expanded", { expanded: true, hovered: false })
4. React reçoit event → setIsExpanded(true)
5. CSS transition: width 48→120px, height 6→32px en 200ms ease-out
```

---

## Code complet de référence

### 1. Types et constantes

```typescript
// types/overlay.types.ts
export type OverlayPhase = "idle" | "recording" | "loading";
export type PillVisibility = "hidden" | "while_active" | "persistent";
```

### 2. State management (Zustand + Immer)

```typescript
// state/overlay.state.ts
export type OverlayState = {
  overlayPhase: OverlayPhase;
  audioLevels: number[];
  pillVisibility: PillVisibility; // préférence utilisateur depuis les settings
};

export const INITIAL_OVERLAY_STATE: OverlayState = {
  overlayPhase: "idle",
  audioLevels: [],
  pillVisibility: "while_active",
};
```

### 3. Rust — State lock-free (AtomicU8)

```rust
// src-tauri/src/state/overlay.rs
use std::sync::atomic::{AtomicBool, AtomicU8, Ordering};

const PHASE_IDLE: u8 = 0;
const PHASE_RECORDING: u8 = 1;
const PHASE_LOADING: u8 = 2;

pub struct OverlayState {
    phase: AtomicU8,
    pill_hover_enabled: AtomicBool,
}

impl Default for OverlayState {
    fn default() -> Self {
        Self::new()
    }
}

impl OverlayState {
    pub fn new() -> Self {
        Self {
            phase: AtomicU8::new(PHASE_IDLE),
            pill_hover_enabled: AtomicBool::new(false),
        }
    }

    pub fn set_phase(&self, phase: &OverlayPhase) {
        let value = match phase {
            OverlayPhase::Idle => PHASE_IDLE,
            OverlayPhase::Recording => PHASE_RECORDING,
            OverlayPhase::Loading => PHASE_LOADING,
        };
        self.phase.store(value, Ordering::Relaxed);
    }

    pub fn is_idle(&self) -> bool {
        self.phase.load(Ordering::Relaxed) == PHASE_IDLE
    }

    pub fn set_pill_hover_enabled(&self, enabled: bool) {
        self.pill_hover_enabled.store(enabled, Ordering::Relaxed);
    }

    pub fn is_pill_hover_enabled(&self) -> bool {
        self.pill_hover_enabled.load(Ordering::Relaxed)
    }
}
```

### 4. Rust — Domain types et events

```rust
// src-tauri/src/domain/overlay.rs
use serde::{Deserialize, Serialize};

pub const EVT_OVERLAY_PHASE: &str = "overlay_phase";
pub const EVT_PILL_EXPANDED: &str = "pill_expanded";

#[derive(Clone, Debug, Serialize)]
pub struct PillExpandedPayload {
    pub expanded: bool,
    pub hovered: bool,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum OverlayPhase {
    Idle,
    Recording,
    Loading,
}

#[derive(Clone, Debug, Serialize)]
pub struct OverlayPhasePayload {
    pub phase: OverlayPhase,
}

impl OverlayPhase {
    pub fn from_str(value: &str) -> Option<Self> {
        match value {
            "idle" => Some(Self::Idle),
            "recording" => Some(Self::Recording),
            "loading" => Some(Self::Loading),
            _ => None,
        }
    }
}
```

### 5. Rust — Tauri command pour changer de phase

```rust
// src-tauri/src/commands.rs
#[tauri::command]
pub fn set_phase(
    app: AppHandle,
    phase: String,
    overlay_state: State<'_, crate::state::OverlayState>,
) -> Result<(), String> {
    let resolved =
        OverlayPhase::from_str(phase.as_str()).ok_or_else(|| format!("invalid phase: {phase}"))?;

    overlay_state.set_phase(&resolved);

    let payload = OverlayPhasePayload {
        phase: resolved.clone(),
    };

    app.emit_to(EventTarget::any(), EVT_OVERLAY_PHASE, payload)
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub fn set_pill_hover_enabled(
    enabled: bool,
    overlay_state: State<'_, crate::state::OverlayState>,
) -> Result<(), String> {
    overlay_state.set_pill_hover_enabled(enabled);
    Ok(())
}
```

### 6. Rust — Cursor tracker et logique d'expansion

Le cursor tracker tourne en boucle toutes les 60ms. Il décide si le pill doit être **expanded** ou non en combinant deux conditions : `is_hovered || is_active`.

```rust
// src-tauri/src/overlay.rs

// -- Constantes clés --
pub const MIN_PILL_WIDTH: f64 = 48.0;    // largeur de la fine ligne
pub const MIN_PILL_HEIGHT: f64 = 6.0;    // hauteur de la fine ligne
pub const MIN_PILL_HOVER_PADDING: f64 = 4.0;
pub const EXPANDED_PILL_WIDTH: f64 = 120.0;   // largeur du vrai pill
pub const EXPANDED_PILL_HEIGHT: f64 = 32.0;   // hauteur du vrai pill
pub const EXPANDED_PILL_HOVERABLE_WIDTH: f64 = EXPANDED_PILL_WIDTH + 24.0;
pub const EXPANDED_PILL_HOVERABLE_HEIGHT: f64 = EXPANDED_PILL_HEIGHT + 56.0;

const CURSOR_POLL_INTERVAL_MS: u64 = 60;

struct CursorFollowerState {
    pill_hovered: AtomicBool,
    pill_expanded: AtomicBool,
}

fn update_cursor_follower(app: &tauri::AppHandle, state: &CursorFollowerState) {
    // ... position pill on screen (monitor detection, overlay positioning) ...

    if let Some(pill_window) = app.get_webview_window(PILL_OVERLAY_LABEL) {
        let overlay_state = app.state::<crate::state::OverlayState>();
        let hover_enabled = overlay_state.is_pill_hover_enabled();
        let was_expanded = state.pill_expanded.load(Ordering::Relaxed);

        // Zone de hover dynamique : plus grande quand expanded
        let (hover_width, hover_height) = if was_expanded {
            (EXPANDED_PILL_HOVERABLE_WIDTH, EXPANDED_PILL_HOVERABLE_HEIGHT)
        } else {
            (
                MIN_PILL_WIDTH + MIN_PILL_HOVER_PADDING * 2.0,
                MIN_PILL_HEIGHT + MIN_PILL_HOVER_PADDING * 2.0,
            )
        };

        // Hover detection uniquement en mode persistent
        let new_hovered = if hover_enabled {
            is_cursor_in_bounds(&monitor, hover_width, hover_height)
        } else {
            false
        };

        let was_hovered = state.pill_hovered.load(Ordering::Relaxed);
        let hovered_changed = new_hovered != was_hovered;
        if hovered_changed {
            state.pill_hovered.store(new_hovered, Ordering::Relaxed);
        }

        // *** LOGIQUE CLÉ : expanded = hovered OU enregistrement actif ***
        let is_active = !overlay_state.is_idle();
        let new_expanded = new_hovered || is_active;

        let was_expanded = state.pill_expanded.load(Ordering::Relaxed);
        let expanded_changed = new_expanded != was_expanded;
        if expanded_changed {
            // Quand collapsed → click-through (la fine ligne ne capture pas les clics)
            // Quand expanded → interactif (le pill capte les clics)
            set_overlay_click_through(&pill_window, !new_expanded);
            state.pill_expanded.store(new_expanded, Ordering::Relaxed);
        }

        // Émettre l'event vers le frontend uniquement si changement
        if hovered_changed || expanded_changed {
            let payload = PillExpandedPayload {
                expanded: new_expanded,
                hovered: new_hovered,
            };
            let _ = app.emit(EVT_PILL_EXPANDED, payload);
        }
    }
}

// macOS/Windows : thread dédié
#[cfg(not(target_os = "linux"))]
pub fn start_cursor_follower(app: tauri::AppHandle) {
    std::thread::spawn(move || {
        let state = CursorFollowerState {
            pill_hovered: AtomicBool::new(false),
            pill_expanded: AtomicBool::new(false),
        };
        loop {
            std::thread::sleep(Duration::from_millis(CURSOR_POLL_INTERVAL_MS));
            update_cursor_follower(&app, &state);
        }
    });
}
```

### 7. TypeScript — Activer le hover uniquement en mode persistent

```typescript
// src/components/root/RootSideEffects.ts
const pillHoverEnabled = useAppStore((state) => {
  const visibility = getEffectivePillVisibility(
    state.userPrefs?.pillVisibility,
  );
  return visibility === "persistent";
});

useEffect(() => {
  invoke("set_pill_hover_enabled", { enabled: pillHoverEnabled }).catch(
    console.error,
  );
}, [pillHoverEnabled]);
```

### 8. React — Composant PillOverlayRoot (le plus important)

```tsx
// src/components/overlay/PillOverlayRoot.tsx

// ===== CONSTANTES DE DIMENSIONS =====
const PILL_OVERLAY_WIDTH = 256;   // taille de la fenêtre overlay
const PILL_OVERLAY_HEIGHT = 96;
const MIN_PILL_WIDTH = 48;        // fine ligne idle
const MIN_PILL_HEIGHT = 6;        // fine ligne idle
const EXPANDED_PILL_WIDTH = 120;  // vrai pill complet
const EXPANDED_PILL_HEIGHT = 32;  // vrai pill complet

// ===== TYPES D'EVENTS =====
type PillExpandedPayload = {
  expanded: boolean;
  hovered: boolean;
};

type OverlayPhasePayload = {
  phase: OverlayPhase;
};

type RecordingLevelPayload = {
  levels?: number[];
};

// ===== COMPOSANT =====
export const PillOverlayRoot = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const phase = useAppStore((state) => state.overlayPhase);
  const levels = useAppStore((state) => state.audioLevels);

  const isIdle = phase === "idle";
  const isListening = phase === "recording";
  const isProcessing = phase === "loading";

  // ===== ÉCOUTER LES EVENTS RUST =====

  // Rust envoie cet event quand expanded/hovered change
  useTauriListen<PillExpandedPayload>("pill_expanded", (payload) => {
    setIsExpanded(payload.expanded);
    setIsHovered(payload.hovered);
  });

  // Rust envoie cet event quand la phase change (idle→recording→loading→idle)
  useTauriListen<OverlayPhasePayload>("overlay_phase", (payload) => {
    produceAppState((draft) => {
      draft.overlayPhase = payload.phase;
      if (payload.phase !== "recording") {
        draft.audioLevels = [];
      }
    });
  });

  // Rust envoie les niveaux audio pendant l'enregistrement
  useTauriListen<RecordingLevelPayload>("recording_level", (payload) => {
    const raw = Array.isArray(payload.levels) ? payload.levels : [];
    const sanitized = raw.map((v) =>
      typeof v === "number" && Number.isFinite(v) ? v : 0,
    );
    produceAppState((draft) => {
      draft.audioLevels = sanitized;
    });
  });

  // ===== LOGIQUE DE VISIBILITÉ =====
  const pillVisibility = useAppStore((state) =>
    getEffectivePillVisibility(state.userPrefs?.pillVisibility),
  );

  const isOverlayActive = !isIdle;

  // Visible si :
  // - pas "hidden"
  // - ET (enregistrement actif OU mode "persistent")
  const isVisible =
    pillVisibility !== "hidden" &&
    (isOverlayActive || pillVisibility !== "while_active");

  // ===== RENDU =====
  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        // Fade in/out quand visible/hidden
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(8px)",
        transition: isVisible
          ? "opacity 100ms ease-out, transform 100ms ease-out"
          : "opacity 100ms ease-out, transform 100ms ease-out, visibility 0ms 100ms",
        visibility: isVisible ? "visible" : "hidden",
      }}
    >
      {/* ===== TOOLTIP (apparaît au hover quand idle) ===== */}
      <Box
        sx={{
          opacity: isHovered && isIdle ? 1 : 0,
          transform: isHovered && isIdle ? "translateY(0)" : "translateY(4px)",
          transition: "all 150ms ease-out",
          marginBottom: "8px",
          pointerEvents: "none",
        }}
      >
        <Box
          sx={{
            backgroundColor: "rgba(0, 0, 0, 0.92)",
            backdropFilter: "blur(14px)",
            borderRadius: "12px",
            padding: "6px 12px",
          }}
        >
          <span style={{ color: "white", fontSize: "12px", fontWeight: 500 }}>
            Cliquer pour dicter
          </span>
        </Box>
      </Box>

      {/* ===== LE PILL ===== */}
      <Box sx={{ paddingBottom: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box sx={{ position: "relative" }}>
          <Box
            onClick={handleStartRecording}
            sx={{
              position: "relative",

              // *** TRANSITION CLÉ : fine ligne ↔ pill complet ***
              width: isExpanded ? EXPANDED_PILL_WIDTH : MIN_PILL_WIDTH,
              height: isExpanded ? EXPANDED_PILL_HEIGHT : MIN_PILL_HEIGHT,
              borderRadius: isExpanded ? "16px" : "6px",
              backgroundColor: isExpanded
                ? "rgba(0, 0, 0, 0.92)"
                : "rgba(0, 0, 0, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              backdropFilter: "blur(14px)",

              // *** 200ms ease-out pour TOUTES les propriétés ***
              transition: "all 200ms ease-out",

              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              pointerEvents: "auto",
            }}
          >
            {/* Contenu interne : visible seulement quand expanded */}
            <Box
              sx={{
                position: "relative",
                width: EXPANDED_PILL_WIDTH - 8,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: isExpanded ? 1 : 0,
                transition: "opacity 150ms ease-out",
              }}
            >
              {/* Texte "Click to dictate" quand idle + hovered */}
              {isHovered && (
                <span
                  style={{
                    position: "absolute",
                    color: "rgba(255, 255, 255, 0.4)",
                    fontSize: "11px",
                    fontWeight: 500,
                    letterSpacing: "0.02em",
                    whiteSpace: "nowrap",
                    opacity: isIdle ? 1 : 0,
                    transition: "opacity 150ms ease-out",
                  }}
                >
                  Click to dictate
                </span>
              )}

              {/* Barre de progression pendant le loading */}
              <Box
                sx={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: isProcessing ? 1 : 0,
                  transition: "opacity 150ms ease-out",
                }}
              >
                <LinearProgress sx={{ width: "100%", height: "2px" }} />
              </Box>

              {/* Waveform audio pendant l'enregistrement */}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  opacity: isListening ? 1 : 0,
                  transition: "opacity 150ms ease-out",
                }}
              >
                <AudioWaveform
                  levels={levels}
                  active={isListening}
                  processing={isProcessing}
                  strokeColor="white"
                  width={EXPANDED_PILL_WIDTH}
                  height={EXPANDED_PILL_HEIGHT}
                  baselineOffset={0}
                />
              </Box>

              {/* Dégradé sur les bords du waveform */}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  opacity: isIdle ? 0 : 1,
                  transition: "opacity 150ms ease-out",
                  background:
                    "linear-gradient(90deg, rgba(0,0,0,0.9) 0%, transparent 18%, transparent 85%, rgba(0,0,0,0.9) 100%)",
                }}
              />
            </Box>
          </Box>

          {/* Bouton annuler (visible pendant enregistrement + hover) */}
          <IconButton
            onClick={handleCancelRecording}
            size="small"
            sx={{
              position: "absolute",
              top: -4,
              right: -6,
              width: 18,
              height: 18,
              backgroundColor: "grey",
              opacity: !isIdle && isHovered ? 1 : 0,
              transform: !isIdle && isHovered ? "scale(1)" : "scale(0)",
              pointerEvents: !isIdle && isHovered ? "auto" : "none",
              transition: "opacity 200ms ease-out, transform 200ms ease-out",
              color: "white",
              zIndex: 1,
            }}
          >
            <CloseIcon sx={{ fontSize: 12 }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};
```

### 9. React — AudioWaveform (animation fluide avec 3 couches de sinus)

```tsx
// src/components/common/AudioWaveform.tsx

const TAU = Math.PI * 2;
const LEVEL_SMOOTHING = 0.18;
const TARGET_DECAY_PER_FRAME = 0.985;
const WAVE_BASE_PHASE_STEP = 0.11;
const WAVE_PHASE_GAIN = 0.32;
const MIN_AMPLITUDE = 0.03;
const MAX_AMPLITUDE = 1.3;
const PROCESSING_BASE_LEVEL = 0.16;

type WaveConfig = {
  frequency: number;
  multiplier: number;
  phaseOffset: number;
  opacity: number;
};

const WAVE_CONFIG: WaveConfig[] = [
  { frequency: 0.8, multiplier: 1.6, phaseOffset: 0, opacity: 1 },
  { frequency: 1.0, multiplier: 1.35, phaseOffset: 0.85, opacity: 0.78 },
  { frequency: 1.25, multiplier: 1.05, phaseOffset: 1.7, opacity: 0.56 },
];

type AnimationState = {
  phase: number;
  currentLevel: number;
  targetLevel: number;
};

const createWavePath = (
  width: number,
  baseline: number,
  amplitude: number,
  frequency: number,
  phase: number,
): string => {
  const segments = Math.max(72, Math.floor(width / 2));
  let path = `M 0 ${baseline + amplitude * Math.sin(phase)}`;
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const x = width * t;
    const theta = frequency * t * TAU + phase;
    const y = baseline + amplitude * Math.sin(theta);
    path += ` L ${x} ${y}`;
  }
  return path;
};

export type AudioWaveformProps = {
  levels: number[];
  active: boolean;
  processing?: boolean;
  width?: number;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  baselineOffset?: number;
};

export const AudioWaveform = ({
  levels,
  active,
  processing = false,
  width = 120,
  height = 36,
  strokeColor = "white",
  strokeWidth = 1.6,
  baselineOffset = 0,
}: AudioWaveformProps) => {
  const waveRefs = useRef<(SVGPathElement | null)[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const animationStateRef = useRef<AnimationState>({
    phase: 0,
    currentLevel: 0,
    targetLevel: 0,
  });
  const phaseStateRef = useRef({ active, processing });

  phaseStateRef.current.active = active;
  phaseStateRef.current.processing = processing;
  waveRefs.current.length = WAVE_CONFIG.length;

  // Reset paths quand dimensions changent
  useEffect(() => {
    const baseline = height / 2 + baselineOffset;
    const defaultPath = `M 0 ${baseline} L ${width} ${baseline}`;
    waveRefs.current.forEach((path, i) => {
      if (!path) return;
      path.setAttribute("d", defaultPath);
      path.setAttribute("opacity", (WAVE_CONFIG[i]?.opacity ?? 1).toString());
    });
  }, [width, height]);

  // Smooth decay quand enregistrement s'arrête
  useEffect(() => {
    const state = animationStateRef.current;
    if (!active) {
      state.targetLevel = processing
        ? Math.max(state.targetLevel, PROCESSING_BASE_LEVEL)
        : 0;
      if (!processing) {
        state.currentLevel *= 0.4;
        if (state.currentLevel < 0.0002) state.currentLevel = 0;
      }
    }
  }, [active, processing]);

  // Convertir niveaux audio en target level
  useEffect(() => {
    if (!active || levels.length === 0) return;
    const sum = levels.reduce((a, v) => a + v, 0);
    const average = sum / levels.length;
    const peak = Math.max(...levels);
    const combined = Math.min(1, average * 0.9 + peak * 0.85);
    const boosted = Math.min(1, Math.sqrt(combined) * 1.35);
    const state = animationStateRef.current;
    state.targetLevel = Math.min(1, state.targetLevel * 0.25 + boosted * 0.75);
  }, [levels, active]);

  // Boucle d'animation requestAnimationFrame
  useEffect(() => {
    if (!(active || processing)) {
      const state = animationStateRef.current;
      state.targetLevel = 0;
      state.currentLevel = 0;
      state.phase = 0;
      const baseline = height / 2 + baselineOffset;
      const defaultPath = `M 0 ${baseline} L ${width} ${baseline}`;
      waveRefs.current.forEach((path, i) => {
        if (!path) return;
        path.setAttribute("d", defaultPath);
        path.setAttribute("opacity", (WAVE_CONFIG[i]?.opacity ?? 1).toString());
      });
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const step = () => {
      const state = animationStateRef.current;
      state.currentLevel += (state.targetLevel - state.currentLevel) * LEVEL_SMOOTHING;
      if (state.currentLevel < 0.0002) state.currentLevel = 0;
      state.targetLevel *= TARGET_DECAY_PER_FRAME;
      if (state.targetLevel < 0.0005) state.targetLevel = 0;

      const ps = phaseStateRef.current;
      const baseLevel = ps.processing && !ps.active ? PROCESSING_BASE_LEVEL : 0;
      const level = Math.max(baseLevel, state.currentLevel);
      const advance = WAVE_BASE_PHASE_STEP + WAVE_PHASE_GAIN * level;
      state.phase = (state.phase + advance) % TAU;

      const baseline = height / 2 + baselineOffset;

      waveRefs.current.forEach((path, i) => {
        if (!path) return;
        const config = WAVE_CONFIG[i] ?? WAVE_CONFIG[WAVE_CONFIG.length - 1];
        const amplitudeFactor = Math.min(
          MAX_AMPLITUDE,
          Math.max(MIN_AMPLITUDE, level * config.multiplier),
        );
        const amplitude = Math.max(1, height * 0.75 * amplitudeFactor);
        const phase = state.phase + config.phaseOffset;
        path.setAttribute(
          "d",
          createWavePath(width, baseline, amplitude, config.frequency, phase),
        );
        path.setAttribute("opacity", config.opacity.toString());
      });

      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [active, processing, width, height]);

  // Cleanup
  useEffect(
    () => () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    },
    [],
  );

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {WAVE_CONFIG.map((config, i) => (
          <path
            key={config.frequency}
            ref={(node) => { waveRefs.current[i] = node; }}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={config.opacity}
          />
        ))}
      </svg>
    </div>
  );
};
```

---

## Résumé des points clés à implémenter

### Ce qu'il faut ajouter à ton projet :

1. **Setting utilisateur** : ajouter `"persistent"` comme option de visibilité pill (en plus de `"while_active"` et `"hidden"`)

2. **Rust state** : ajouter `pill_hover_enabled: AtomicBool` dans ton overlay state + commande Tauri `set_pill_hover_enabled`

3. **Cursor tracker** : modifier la logique d'expansion pour combiner `hovered || is_active` au lieu de juste `is_active`

4. **Frontend** :
   - Écouter l'event `pill_expanded` de Rust
   - Utiliser `isExpanded` pour basculer entre les 2 tailles
   - CSS `transition: all 200ms ease-out` sur le pill container
   - Le contenu interne (waveform, texte, progress) a `opacity: isExpanded ? 1 : 0`

5. **Side effects** : quand `visibility === "persistent"`, appeler `invoke("set_pill_hover_enabled", { enabled: true })` pour activer le hover tracking côté Rust

### Pourquoi c'est fluide :

- `AtomicU8.store` = ~1 nanoseconde (lock-free, pas de mutex)
- Event emit de Rust → JS = ~1-2ms via IPC Tauri
- CSS transition = GPU-accéléré, 200ms ease-out
- Total perçu : instantané, l'animation CSS est le seul temps visible

### Résumé visuel des transitions :

```
ÉTAT "persistent" + idle :     [====]        (48×6px, fine ligne, opacity 0.6)
                                  ↓ hotkey pressed (200ms ease-out)
ÉTAT recording :               [============]  (120×32px, pill complet, waveform)
                                  ↓ hotkey released → loading (200ms ease-out)  
ÉTAT loading :                 [============]  (120×32px, pill complet, progress bar)
                                  ↓ processing terminé (200ms ease-out)
RETOUR idle :                  [====]        (48×6px, fine ligne)
```
