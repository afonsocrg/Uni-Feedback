import {
  setGiveawayDisplayMode,
  useGiveawayDisplayMode,
  type GiveawayDisplayMode
} from '~/hooks'

const MODES: { value: GiveawayDisplayMode; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'date', label: 'Date' },
  { value: 'countdown', label: 'Countdown' }
]

/**
 * Dev-only floating toggle to preview how the giveaway deadline renders
 * (auto / forced date / forced countdown) before deploying. Stripped from
 * production builds via `import.meta.env.DEV`.
 */
export function GiveawayDevPanel() {
  if (!import.meta.env.DEV) return null
  return <GiveawayDevPanelInner />
}

function GiveawayDevPanelInner() {
  const mode = useGiveawayDisplayMode()

  return (
    <div className="fixed bottom-4 left-4 z-[9999] rounded-lg border border-white/10 bg-zinc-900/95 p-2 text-xs text-white shadow-xl backdrop-blur">
      <p className="mb-1 px-1 font-mono text-[10px] uppercase tracking-wide text-white/50">
        Giveaway deadline
      </p>
      <div className="flex gap-1">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setGiveawayDisplayMode(m.value)}
            className={`rounded px-2 py-1 font-medium transition-colors ${
              mode === m.value
                ? 'bg-white text-black'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  )
}
