import { cn } from '@uni-feedback/ui'
import { ExternalLink, MapPin } from 'lucide-react'
import type { Map as MapLibreMap, Marker } from 'maplibre-gl'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { applyPalette, readPalette } from './campusMapStyle'

/**
 * Campuses as a list beside a map (under it on phones), wherever a page shows
 * where something is taught: the university page (every faculty's campuses),
 * the faculty hub and the degree page.
 *
 * With several pins, nothing is selected at first and the map shows them all;
 * picking a campus in the list, or its pin, zooms in and shows its links, and
 * "Ver todos" zooms back out. With one spot on the map, it is selected from
 * the start.
 *
 * The map is MapLibre over OpenFreeMap's vector tiles (free, no key, no usage
 * limits), restyled from the design tokens in `campusMapStyle.ts` so it follows
 * the theme. Tried before (2026-10-24): Leaflet + OpenStreetMap raster tiles
 * (busy, ugly in dark mode) and Google's keyless embed (one place at a time).
 * MapLibre is imported only once the map nears the viewport; the list and
 * addresses are server-rendered either way.
 *
 * Items at the same spot (ISCTE's three schools) share one pin. An item
 * without coordinates is listed with its address and no pin.
 *
 * `renderList` swaps the campus list for the page's own (the university page
 * lists its faculties there, each with buttons for its campuses), so the
 * schools and the map are one block instead of two lists in a row.
 */

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'

export interface CampusMapItem {
  key: string
  /** The list's heading for it: "IST · Alameda" on a university page */
  title: string
  /** The short label on its pin: "IST", or the campus name */
  pinLabel: string
  address: string | null
  latitude: number | null
  longitude: number | null
  /**
   * Extra lines under the address in the list (contacts, degree count). Plain
   * text: the list item is a button, so no links in here; use `link` and
   * `website`, shown under the map while the item is selected.
   */
  details?: ReactNode
  /** An in-site link (its faculty page) */
  link?: { to: string; label: string }
  /** Its official site */
  website?: { href: string; label: string }
}

const hasPin = (item: CampusMapItem) =>
  item.latitude !== null && item.longitude !== null

const positionKey = (item: CampusMapItem) =>
  `${item.latitude!.toFixed(4)},${item.longitude!.toFixed(4)}`

const directionsUrl = (item: CampusMapItem) =>
  `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`

/** What a custom list gets to drive the map */
export interface CampusMapListApi {
  activeKey: string | null
  select: (item: CampusMapItem) => void
}

export function CampusMap({
  items,
  renderList,
  onSelect,
  onDirections,
  onWebsite
}: {
  items: CampusMapItem[]
  /** Replaces the campus list; picks made through it report as 'list' */
  renderList?: (api: CampusMapListApi) => ReactNode
  /** A campus picked in the list or on the map, for analytics */
  onSelect?: (item: CampusMapItem, surface: 'list' | 'pin') => void
  /** "Como chegar" clicked, for analytics */
  onDirections?: (item: CampusMapItem) => void
  /** Its official site clicked, for analytics */
  onWebsite?: (item: CampusMapItem) => void
}) {
  const { t } = useTranslation()
  const pinned = items.filter(hasPin)
  // One spot on the map (one campus, or ISCTE's schools in one building):
  // nothing to choose between, so it starts selected and "Ver todos" is moot
  const single = new Set(pinned.map(positionKey)).size === 1
  const [activeKey, setActiveKey] = useState<string | null>(
    single ? pinned[0].key : null
  )
  const active = items.find((i) => i.key === activeKey) ?? null

  const select = (item: CampusMapItem, surface: 'list' | 'pin') => {
    setActiveKey(item.key)
    onSelect?.(item, surface)
  }

  if (items.length === 0 && !renderList) return null

  return (
    <div
      className={cn(
        'grid gap-4',
        pinned.length > 0 &&
          (renderList
            ? 'md:grid-cols-[20rem_minmax(0,1fr)]'
            : 'md:grid-cols-[16rem_minmax(0,1fr)]')
      )}
    >
      {renderList ? (
        <div className="min-w-0 md:max-h-[28rem] md:overflow-y-auto">
          {renderList({ activeKey, select: (item) => select(item, 'list') })}
        </div>
      ) : (
        <ul className="space-y-1 md:max-h-[26rem] md:overflow-y-auto">
          {items.map((item) => {
            const hasItemPin = hasPin(item)
            const selected = activeKey === item.key
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => select(item, 'list')}
                  disabled={!hasItemPin}
                  aria-pressed={selected}
                  className={cn(
                    'flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors',
                    hasItemPin && 'hover:bg-muted',
                    selected && 'bg-muted'
                  )}
                >
                  <MapPin
                    aria-hidden="true"
                    className={cn(
                      'mt-0.5 size-4 shrink-0',
                      hasItemPin ? 'text-primaryBlue' : 'text-muted-foreground'
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block font-semibold text-foreground">
                      {item.title}
                    </span>
                    {item.address && (
                      <span className="block text-sm text-muted-foreground">
                        {item.address}
                      </span>
                    )}
                    {item.details && (
                      <span className="block text-sm text-muted-foreground">
                        {item.details}
                      </span>
                    )}
                    {!hasItemPin && (
                      <span className="block text-xs text-muted-foreground">
                        {t('campus_map.no_pin')}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {pinned.length > 0 && (
        <div className="min-w-0">
          <CampusMapCanvas
            items={items}
            active={active}
            onPinClick={(item) => select(item, 'pin')}
          />
          <p className="mt-2 flex min-h-5 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {active ? (
              <>
                {active.link && (
                  <Link
                    to={active.link.to}
                    className="font-semibold text-foreground hover:underline"
                  >
                    {active.link.label}
                  </Link>
                )}
                <a
                  href={directionsUrl(active)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onDirections?.(active)}
                  className="inline-flex items-center gap-1 font-semibold text-primaryBlue hover:underline"
                >
                  {t('campus_map.directions')}
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                </a>
                {active.website && (
                  <a
                    href={active.website.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onWebsite?.(active)}
                    className="inline-flex items-center gap-1 text-primaryBlue hover:underline"
                  >
                    {active.website.label}
                    <ExternalLink aria-hidden="true" className="size-3.5" />
                  </a>
                )}
                {!single && (
                  <button
                    type="button"
                    onClick={() => setActiveKey(null)}
                    className="font-semibold text-primaryBlue hover:underline"
                  >
                    {t('campus_map.show_all')}
                  </button>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">
                {t('campus_map.hint')}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}

function CampusMapCanvas({
  items,
  active,
  onPinClick
}: {
  items: CampusMapItem[]
  active: CampusMapItem | null
  onPinClick: (item: CampusMapItem) => void
}) {
  const { t } = useTranslation()
  const lang = useLang()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const pinsRef = useRef<Map<string, { marker: Marker; el: HTMLElement }>>(
    new Map()
  )
  const fitAllRef = useRef<(() => void) | null>(null)
  const onPinClickRef = useRef(onPinClick)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    onPinClickRef.current = onPinClick
  }, [onPinClick])

  // The pins only change when the data does, not on every parent render
  const pinSignature = items
    .filter(hasPin)
    .map((i) => `${i.key}@${positionKey(i)}:${i.pinLabel}`)
    .join('|')

  // Build the map once it is close to the viewport
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false
    let map: MapLibreMap | null = null
    let themeObserver: MutationObserver | null = null
    const pins = pinsRef.current
    const pinned = items.filter(hasPin)

    const start = async () => {
      try {
        const maplibre = (await import('maplibre-gl')).default
        await import('maplibre-gl/dist/maplibre-gl.css')
        if (cancelled) return

        const bounds = new maplibre.LngLatBounds()
        for (const i of pinned) bounds.extend([i.longitude!, i.latitude!])
        const fitOptions = { padding: 56, maxZoom: 15 }

        map = new maplibre.Map({
          container,
          style: STYLE_URL,
          bounds,
          fitBoundsOptions: fitOptions,
          cooperativeGestures: true,
          attributionControl: { compact: true },
          dragRotate: false,
          pitchWithRotate: false
        })
        map.touchZoomRotate.disableRotation()
        map.addControl(
          new maplibre.NavigationControl({ showCompass: false }),
          'top-right'
        )
        mapRef.current = map
        fitAllRef.current = () =>
          map?.fitBounds(bounds, { ...fitOptions, duration: 600 })

        map.on('style.load', () => {
          if (!map) return
          applyPalette(map, readPalette(), lang)
          setReady(true)
        })
        themeObserver = new MutationObserver(() => {
          if (map?.isStyleLoaded()) applyPalette(map, readPalette(), lang)
        })
        themeObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class']
        })

        // One pin per spot: the first item there opens on click
        const bySpot = new Map<string, { marker: Marker; el: HTMLElement }>()
        const labelsAt = new Map<string, string[]>()
        for (const item of pinned) {
          const labels = labelsAt.get(positionKey(item)) ?? []
          if (!labels.includes(item.pinLabel)) labels.push(item.pinLabel)
          labelsAt.set(positionKey(item), labels)
        }
        for (const item of pinned) {
          const spot = positionKey(item)
          const existing = bySpot.get(spot)
          if (existing) {
            pins.set(item.key, existing)
            continue
          }
          const el = document.createElement('button')
          el.type = 'button'
          el.className = 'campus-pin'
          el.setAttribute('aria-label', item.title)
          el.innerHTML = `<span class="campus-pin-dot"></span><span class="campus-pin-label"></span>`
          // A shared pin names everyone there: "ESPP · ISTA · IBS"
          el.querySelector('.campus-pin-label')!.textContent = labelsAt
            .get(spot)!
            .join(' · ')
          el.addEventListener('click', (event) => {
            event.stopPropagation()
            onPinClickRef.current(item)
          })
          const marker = new maplibre.Marker({ element: el, anchor: 'center' })
            .setLngLat([item.longitude!, item.latitude!])
            .addTo(map)
          const pin = { marker, el }
          bySpot.set(spot, pin)
          pins.set(item.key, pin)
        }
      } catch (error) {
        console.error('Campus map failed to load', error)
        if (!cancelled) setFailed(true)
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect()
          void start()
        }
      },
      { rootMargin: '300px' }
    )
    observer.observe(container)

    return () => {
      cancelled = true
      observer.disconnect()
      themeObserver?.disconnect()
      pins.clear()
      map?.remove()
      mapRef.current = null
      setReady(false)
    }
    // `items` is read through `pinSignature`, which changes when the pins do
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinSignature, lang])

  // Follow the selection: highlight its pin and zoom to it, or back out
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const activePin = active ? pinsRef.current.get(active.key) : null
    for (const { el } of pinsRef.current.values()) {
      el.classList.toggle('is-active', el === activePin?.el)
    }
    if (active && hasPin(active)) {
      map.flyTo({
        center: [active.longitude!, active.latitude!],
        zoom: 16,
        duration: 700
      })
    } else {
      fitAllRef.current?.()
    }
  }, [active, ready])

  return (
    <div className="relative h-80 w-full overflow-hidden rounded-xl border border-border bg-muted md:h-[26rem]">
      <div
        ref={containerRef}
        role="region"
        aria-label={t('campus_map.map_label')}
        // A size, not `absolute inset-0`: MapLibre's .maplibregl-map sets
        // position: relative and would collapse it
        className="campus-map h-full w-full"
      />
      {failed && (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          {t('campus_map.map_failed')}
        </p>
      )}
    </div>
  )
}
