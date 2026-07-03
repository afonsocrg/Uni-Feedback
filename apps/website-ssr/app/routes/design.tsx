import {
  Badge,
  Button,
  Chip,
  StarRating,
  WorkloadRatingDisplay
} from '@uni-feedback/ui'

export function meta() {
  return [
    { title: 'Design System · Uni Feedback' },
    { name: 'robots', content: 'noindex' }
  ]
}

/* ── Small presentational helpers (local to this reference page) ── */

function Section({
  title,
  description,
  children
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-border py-10">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {description}
        </p>
      )}
      <div className="mt-6">{children}</div>
    </section>
  )
}

function Swatch({
  swatchClass,
  name,
  util
}: {
  swatchClass: string
  name: string
  util: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`h-16 rounded-lg border border-border ${swatchClass}`} />
      <div className="text-xs font-medium text-foreground">{name}</div>
      <code className="text-[11px] leading-tight text-muted-foreground">
        {util}
      </code>
    </div>
  )
}

const SwatchGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
    {children}
  </div>
)

/* ── Token catalogue ── */

const SURFACES = [
  { name: 'background', swatchClass: 'bg-background', util: 'bg-background' },
  { name: 'card', swatchClass: 'bg-card', util: 'bg-card' },
  { name: 'popover', swatchClass: 'bg-popover', util: 'bg-popover' },
  { name: 'secondary', swatchClass: 'bg-secondary', util: 'bg-secondary' },
  { name: 'muted', swatchClass: 'bg-muted', util: 'bg-muted' },
  { name: 'accent', swatchClass: 'bg-accent', util: 'bg-accent' },
  { name: 'border', swatchClass: 'bg-border', util: 'border-border' },
  { name: 'input', swatchClass: 'bg-input', util: 'border-input' }
]

const BRAND = [
  { name: 'primary', swatchClass: 'bg-primary', util: 'bg-primary' },
  {
    name: 'brand (primaryBlue)',
    swatchClass: 'bg-primaryBlue',
    util: 'bg-primaryBlue'
  },
  { name: 'destructive', swatchClass: 'bg-destructive', util: 'bg-destructive' }
]

// hue → the semantic roles it currently backs (workload / status / chips)
const TINTS = [
  { hue: 'red', bg: 'bg-tint-red', fg: 'text-tint-red-fg', bd: 'border-tint-red-border', role: 'workload 1 · danger' }, // prettier-ignore
  { hue: 'orange', bg: 'bg-tint-orange', fg: 'text-tint-orange-fg', bd: 'border-tint-orange-border', role: 'workload 2' }, // prettier-ignore
  { hue: 'amber', bg: 'bg-tint-amber', fg: 'text-tint-amber-fg', bd: 'border-tint-amber-border', role: 'warning · chip amber' }, // prettier-ignore
  { hue: 'yellow', bg: 'bg-tint-yellow', fg: 'text-tint-yellow-fg', bd: 'border-tint-yellow-border', role: 'workload 3' }, // prettier-ignore
  { hue: 'lime', bg: 'bg-tint-lime', fg: 'text-tint-lime-fg', bd: 'border-tint-lime-border', role: 'workload 4' }, // prettier-ignore
  { hue: 'green', bg: 'bg-tint-green', fg: 'text-tint-green-fg', bd: 'border-tint-green-border', role: 'workload 5 · success' }, // prettier-ignore
  { hue: 'cyan', bg: 'bg-tint-cyan', fg: 'text-tint-cyan-fg', bd: 'border-tint-cyan-border', role: 'chip cyan' }, // prettier-ignore
  { hue: 'blue', bg: 'bg-tint-blue', fg: 'text-tint-blue-fg', bd: 'border-tint-blue-border', role: 'info · chip blue' }, // prettier-ignore
  { hue: 'indigo', bg: 'bg-tint-indigo', fg: 'text-tint-indigo-fg', bd: 'border-tint-indigo-border', role: 'chip indigo' }, // prettier-ignore
  { hue: 'violet', bg: 'bg-tint-violet', fg: 'text-tint-violet-fg', bd: 'border-tint-violet-border', role: 'chip deep-purple' }, // prettier-ignore
  { hue: 'purple', bg: 'bg-tint-purple', fg: 'text-tint-purple-fg', bd: 'border-tint-purple-border', role: 'chip purple' }, // prettier-ignore
  { hue: 'gray', bg: 'bg-tint-gray', fg: 'text-tint-gray-fg', bd: 'border-tint-gray-border', role: 'chip gray · muted' } // prettier-ignore
]

export default function DesignSystemPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <header className="pb-4">
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          Design System
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          The living reference for Uni Feedback's tokens. Everything here is
          drawn from the semantic tokens in{' '}
          <code className="text-foreground">packages/ui/src/style.css</code> —
          toggle the theme (top-right) and every swatch below re-themes itself.
          Components should only ever use these tokens, never raw hex or{' '}
          <code className="text-foreground">gray-*</code> scales.
        </p>
      </header>

      <Section
        title="Surfaces & lines"
        description="Neutral backgrounds and borders. These carry the light/dark split."
      >
        <SwatchGrid>
          {SURFACES.map((s) => (
            <Swatch key={s.name} {...s} />
          ))}
        </SwatchGrid>
      </Section>

      <Section
        title="Brand & actions"
        description="The brand blue is now themeable — bg-primaryBlue keeps working everywhere it's already used and flips in dark mode automatically."
      >
        <SwatchGrid>
          {BRAND.map((s) => (
            <Swatch key={s.name} {...s} />
          ))}
        </SwatchGrid>
      </Section>

      <Section
        title="Text"
        description="Foreground roles. On any surface, pair a *-foreground token with its surface."
      >
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6">
          <p className="text-foreground">text-foreground — primary body text</p>
          <p className="text-muted-foreground">
            text-muted-foreground — secondary / hints
          </p>
          <p className="text-primaryBlue">
            text-primaryBlue — brand accent text
          </p>
          <p className="text-destructive">text-destructive — errors</p>
        </div>
      </Section>

      <Section
        title="Status"
        description="Solid status fills, each with a readable *-foreground."
      >
        <div className="flex flex-wrap gap-3">
          <span className="rounded-md bg-success px-3 py-1.5 text-sm font-medium text-success-foreground">
            success
          </span>
          <span className="rounded-md bg-warning px-3 py-1.5 text-sm font-medium text-warning-foreground">
            warning
          </span>
          <span className="rounded-md bg-info px-3 py-1.5 text-sm font-medium text-info-foreground">
            info
          </span>
          <span className="rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-white">
            destructive
          </span>
        </div>
      </Section>

      <Section
        title="Rating"
        description="Gold fill for filled stars, a dim track for empty ones — both themed."
      >
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex items-center gap-3">
            <span className="inline-block size-10 rounded-lg bg-rating" />
            <code className="text-xs text-muted-foreground">bg-rating</code>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-block size-10 rounded-lg bg-rating-track" />
            <code className="text-xs text-muted-foreground">
              bg-rating-track
            </code>
          </div>
          <div className="flex items-center gap-3">
            <StarRating value={3.5} showHalfStars />
            <code className="text-xs text-muted-foreground">
              &lt;StarRating /&gt;
            </code>
          </div>
        </div>
      </Section>

      <Section
        title="Tint scale"
        description="One reusable soft-badge system. Workload ratings, status badges and category chips all map onto these 12 hues — the dedup that makes theming consistent."
      >
        <div className="flex flex-wrap gap-2.5">
          {TINTS.map((t) => (
            <div key={t.hue} className="flex flex-col items-center gap-1">
              <span
                className={`rounded-full border px-3 py-1 text-sm font-medium ${t.bg} ${t.fg} ${t.bd}`}
              >
                {t.hue}
              </span>
              <code className="text-[10px] text-muted-foreground">
                {t.role}
              </code>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Radius"
        description="Driven by --radius; scales together."
      >
        <div className="flex flex-wrap items-end gap-4">
          {[
            { c: 'rounded-sm', l: 'sm' },
            { c: 'rounded-md', l: 'md' },
            { c: 'rounded-lg', l: 'lg' },
            { c: 'rounded-xl', l: 'xl' }
          ].map((r) => (
            <div key={r.l} className="flex flex-col items-center gap-1.5">
              <div className={`size-16 bg-primary ${r.c}`} />
              <code className="text-xs text-muted-foreground">{r.c}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Components"
        description="A live sampling — buttons, workload badges, chips and star ratings, all themed through the tokens above."
      >
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[1, 2, 3, 4, 5].map((r) => (
              <WorkloadRatingDisplay key={r} rating={r} showRating />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Chip label="Teórica" color="blue" />
            <Chip label="Prática" color="green" />
            <Chip label="Projeto" color="purple" />
            <Chip label="Exame" color="red" />
            <Chip label="Contínua" color="amber" />
            <Badge>Badge</Badge>
          </div>
        </div>
      </Section>
    </div>
  )
}
