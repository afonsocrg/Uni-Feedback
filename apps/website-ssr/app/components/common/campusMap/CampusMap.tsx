import { cn } from '@uni-feedback/ui'
import { Check, Copy, ExternalLink, MapPin, X } from 'lucide-react'
import type { Map as MapLibreMap, Marker, Popup } from 'maplibre-gl'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useLang } from '~/hooks'
import { applyPalette, readPalette } from './campusMapStyle'

/**
 * Campuses as a list beside a map (under it on phones), wherever a page shows
 * where something is taught: the university page (every faculty's campuses),
 * the faculty hub and the degree page.
 *
 * With several pins, nothing is selected at first and the map shows them all;
 * picking a campus in the list, or its pin, zooms in and opens a popup on its
 * pin (address with a copy button, "Abrir no Google Maps", its official site).
 * Closing the popup (its X, a click on the map, Escape) or picking the same
 * row again lets go of the campus but leaves the map where it is; "Ver todos"
 * zooms back out. With one spot on the map, it is selected, popup open, from
 * the start. If the map fails to load, the same card shows under it.
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
   * text: the list item is a button, so no links in here; `website` is
   * shown in its popup on the map.
   */
  details?: ReactNode
  /** Its official site */
  website?: string | null
}

const hasPin = (item: CampusMapItem) =>
  item.latitude !== null && item.longitude !== null

const positionKey = (item: CampusMapItem) =>
  `${item.latitude!.toFixed(4)},${item.longitude!.toFixed(4)}`

const directionsUrl = (item: CampusMapItem) =>
  `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`

interface CampusCallbacks {
  /** "Abrir no Google Maps" clicked, for analytics */
  onDirections?: (item: CampusMapItem) => void
  /** Its official site clicked, for analytics */
  onWebsite?: (item: CampusMapItem) => void
  /** Its address copied to the clipboard, for analytics */
  onCopyAddress?: (item: CampusMapItem) => void
}

export function CampusMap({
  items,
  onSelect,
  ...callbacks
}: {
  items: CampusMapItem[]
  /** A campus picked in the list or on the map, for analytics */
  onSelect?: (item: CampusMapItem, surface: 'list' | 'pin') => void
} & CampusCallbacks) {
  const { t } = useTranslation()
  const pinned = items.filter(hasPin)
  // One spot on the map (one campus, or ISCTE's schools in one building):
  // nothing to choose between, so it starts selected and "Ver todos" is moot
  const single = new Set(pinned.map(positionKey)).size === 1
  const [activeKey, setActiveKey] = useState<string | null>(
    single ? pinned[0].key : null
  )
  const active = items.find((i) => i.key === activeKey) ?? null
  // Whether the map shows every pin; false once it zoomed in on one, even
  // after letting go of it, until "Ver todos"
  const [overview, setOverview] = useState(!single)
  const [mapFailed, setMapFailed] = useState(false)

  const select = (item: CampusMapItem, surface: 'list' | 'pin') => {
    setActiveKey(item.key)
    setOverview(false)
    onSelect?.(item, surface)
  }
  const deselect = () => setActiveKey(null)
  const showAll = () => {
    setActiveKey(null)
    setOverview(true)
  }

  useEffect(() => {
    if (!activeKey) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveKey(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [activeKey])

  if (items.length === 0) return null

  return (
    <div
      className={cn(
        'grid gap-4',
        pinned.length > 0 && 'md:grid-cols-[16rem_minmax(0,1fr)]'
      )}
    >
      <ul className="space-y-1 md:max-h-[26rem] md:overflow-y-auto">
        {items.map((item) => {
          const hasItemPin = hasPin(item)
          const selected = activeKey === item.key
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => (selected ? deselect() : select(item, 'list'))}
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

      {pinned.length > 0 && (
        <div className="min-w-0">
          <CampusMapCanvas
            items={items}
            active={active}
            overview={overview}
            onPinClick={(item) => select(item, 'pin')}
            onPopupClose={deselect}
            popup={
              active && (
                <CampusCard item={active} onClose={deselect} {...callbacks} />
              )
            }
            onFailed={() => setMapFailed(true)}
          />
          {mapFailed && active && (
            <div className="mt-2 rounded-xl border border-border bg-card p-3">
              <CampusCard item={active} {...callbacks} />
            </div>
          )}
          <p className="mt-2 flex min-h-5 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {!single && !overview ? (
              <button
                type="button"
                onClick={showAll}
                className="font-semibold text-primaryBlue hover:underline"
              >
                {t('campus_map.show_all')}
              </button>
            ) : (
              !active && (
                <span className="text-muted-foreground">
                  {t('campus_map.hint')}
                </span>
              )
            )}
          </p>
        </div>
      )}
    </div>
  )
}

/** What the popup on a selected pin shows: where it is and how to get there */
function CampusCard({
  item,
  onClose,
  onDirections,
  onWebsite,
  onCopyAddress
}: {
  item: CampusMapItem
  /** Shows a close button (in the popup) */
  onClose?: () => void
} & CampusCallbacks) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const copyAddress = async () => {
    if (!item.address) return
    try {
      await navigator.clipboard.writeText(item.address)
      setCopied(true)
      toast.success(t('campus_map.address_copied'))
      onCopyAddress?.(item)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t('campus_map.copy_failed'))
    }
  }

  return (
    <div className="font-sans text-sm leading-normal text-foreground">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold">{item.title}</p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t('campus_map.close')}
            className="-mr-1 -mt-0.5 rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>
      {item.address && (
        <div className="mt-1 flex items-start gap-1.5">
          <p className="min-w-0 text-muted-foreground">{item.address}</p>
          <button
            type="button"
            onClick={copyAddress}
            aria-label={t(
              copied ? 'campus_map.address_copied' : 'campus_map.copy_address'
            )}
            title={t('campus_map.copy_address')}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {copied ? (
              <Check aria-hidden="true" className="size-4 text-success" />
            ) : (
              <Copy aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>
      )}
      {(hasPin(item) || item.website) && (
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {hasPin(item) && (
            <a
              href={directionsUrl(item)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onDirections?.(item)}
              className="inline-flex items-center gap-1 font-semibold text-primaryBlue hover:underline"
            >
              {t('campus_map.open_in_maps')}
              <ExternalLink aria-hidden="true" className="size-3.5" />
            </a>
          )}
          {item.website && (
            <a
              href={item.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onWebsite?.(item)}
              className="inline-flex items-center gap-1 text-primaryBlue hover:underline"
            >
              {t('campus_map.website')}
              <ExternalLink aria-hidden="true" className="size-3.5" />
            </a>
          )}
        </p>
      )}
    </div>
  )
}

function CampusMapCanvas({
  items,
  active,
  overview,
  onPinClick,
  onPopupClose,
  popup,
  onFailed
}: {
  items: CampusMapItem[]
  active: CampusMapItem | null
  /** Zoom out to every pin when nothing is selected */
  overview: boolean
  onPinClick: (item: CampusMapItem) => void
  /** The popup closed by clicking the map elsewhere */
  onPopupClose: () => void
  /** Rendered into the popup on the active pin */
  popup: ReactNode
  onFailed: () => void
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
  const onPopupCloseRef = useRef(onPopupClose)
  const popupRef = useRef<Popup | null>(null)
  // The popup's DOM node, which React portals the card into
  const [popupNode, setPopupNode] = useState<HTMLElement | null>(null)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    onPinClickRef.current = onPinClick
    onPopupCloseRef.current = onPopupClose
  }, [onPinClick, onPopupClose])

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
          map?.fitBounds(bounds, { ...fitOptions, duration: 1200 })

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

        const node = document.createElement('div')
        const popup = new maplibre.Popup({
          anchor: 'bottom',
          offset: 18,
          maxWidth: '18rem',
          closeButton: false,
          focusAfterOpen: false,
          className: 'campus-popup'
        }).setDOMContent(node)
        // Also fires on our own remove(); harmless, the state already agrees
        popup.on('close', () => {
          if (!cancelled) onPopupCloseRef.current()
        })
        popupRef.current = popup
        setPopupNode(node)
      } catch (error) {
        console.error('Campus map failed to load', error)
        if (!cancelled) {
          setFailed(true)
          onFailed()
        }
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
      popupRef.current?.remove()
      popupRef.current = null
      setPopupNode(null)
      map?.remove()
      mapRef.current = null
      setReady(false)
    }
    // `items` is read through `pinSignature`, which changes when the pins do
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinSignature, lang])

  // Follow the selection: highlight its pin and zoom to it, or back out on
  // "Ver todos" (letting go of a campus leaves the map where it is)
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
        // The pin sits below the middle, so its popup fits above it
        offset: [0, 70],
        duration: 1600
      })
    } else if (overview) {
      fitAllRef.current?.()
    }
  }, [active, overview, ready])

  // The popup follows the selection
  useEffect(() => {
    const map = mapRef.current
    const popup = popupRef.current
    if (!map || !popup || !ready) return
    if (active && hasPin(active)) {
      popup.setLngLat([active.longitude!, active.latitude!])
      if (!popup.isOpen()) popup.addTo(map)
    } else if (popup.isOpen()) {
      popup.remove()
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
      {popupNode && createPortal(popup, popupNode)}
    </div>
  )
}
