import type { Map as MapLibreMap } from 'maplibre-gl'

/**
 * Restyles OpenFreeMap's "positron" basemap from the site's design tokens, so
 * the campus map reads as part of the page in both themes: land on the page's
 * surface colour, roads a step away from it, water tinted with the brand,
 * labels in the muted text colour, and no POIs, shields or transit clutter.
 *
 * MapLibre can't parse `oklch()`, which the tokens use, so each token is
 * resolved to rgb through a 1x1 canvas. Re-run on theme change.
 */

type Rgb = [number, number, number]

function resolveToken(name: string): Rgb {
  const probe = document.createElement('span')
  probe.style.color = `var(${name})`
  probe.style.display = 'none'
  document.body.appendChild(probe)
  const computed = getComputedStyle(probe).color
  probe.remove()
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = computed
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return [r, g, b]
}

const mix = (a: Rgb, b: Rgb, amount: number): Rgb =>
  a.map((v, i) => Math.round(v + (b[i] - v) * amount)) as Rgb
const css = ([r, g, b]: Rgb) => `rgb(${r}, ${g}, ${b})`

export interface CampusMapPalette {
  isDark: boolean
  land: string
  park: string
  water: string
  building: string
  road: string
  roadMajor: string
  casing: string
  label: string
  labelStrong: string
  halo: string
  boundary: string
}

export function readPalette(): CampusMapPalette {
  const isDark = document.documentElement.classList.contains('dark')
  const bg = resolveToken('--background')
  const fg = resolveToken('--foreground')
  const brand = resolveToken('--brand')
  const green: Rgb = isDark ? [60, 110, 80] : [120, 180, 130]
  const land = mix(bg, fg, isDark ? 0.06 : 0.035)
  return {
    isDark,
    land: css(land),
    park: css(mix(land, green, isDark ? 0.18 : 0.16)),
    water: css(mix(land, brand, isDark ? 0.3 : 0.22)),
    building: css(mix(land, fg, isDark ? 0.05 : 0.05)),
    // Light: roads are the page's white over a slightly grey land. Dark: roads
    // lift off the land instead, as dark maps read best.
    road: css(isDark ? mix(land, fg, 0.07) : bg),
    roadMajor: css(isDark ? mix(land, fg, 0.14) : bg),
    casing: css(mix(land, fg, isDark ? 0.08 : 0.12)),
    label: css(mix(bg, fg, 0.45)),
    labelStrong: css(mix(bg, fg, 0.75)),
    halo: css(land),
    boundary: css(mix(land, fg, 0.25))
  }
}

const HIDDEN = [
  /shield/,
  /^airport$/,
  /^aeroway/,
  /^railway/,
  /^road_pier$/,
  /^road_area_pier$/,
  /^landcover_(ice_shelf|glacier)$/,
  /^highway-name-path$/,
  /_subtle$/,
  /^tunnel_/
]

/**
 * Applies the palette to every layer of the loaded positron style, with labels
 * in the page's language where OpenStreetMap has one ("Lisboa", not "Lisbon").
 */
export function applyPalette(
  map: MapLibreMap,
  p: CampusMapPalette,
  lang: 'pt' | 'en'
) {
  for (const layer of map.getStyle().layers) {
    const id = layer.id
    if (HIDDEN.some((re) => re.test(id))) {
      map.setLayoutProperty(id, 'visibility', 'none')
      continue
    }
    switch (layer.type) {
      case 'background':
        map.setPaintProperty(id, 'background-color', p.land)
        break
      case 'fill':
        if (id === 'water') map.setPaintProperty(id, 'fill-color', p.water)
        else if (id === 'park' || id.startsWith('landcover'))
          map.setPaintProperty(id, 'fill-color', p.park)
        else if (id === 'building') {
          map.setPaintProperty(id, 'fill-color', p.building)
          map.setPaintProperty(id, 'fill-outline-color', p.building)
        } else map.setPaintProperty(id, 'fill-color', p.land)
        break
      case 'line':
        if (id === 'waterway') map.setPaintProperty(id, 'line-color', p.water)
        else if (id.startsWith('boundary'))
          map.setPaintProperty(id, 'line-color', p.boundary)
        else if (id.includes('casing'))
          map.setPaintProperty(id, 'line-color', p.casing)
        else if (id.includes('motorway') || id.includes('major'))
          map.setPaintProperty(id, 'line-color', p.roadMajor)
        else map.setPaintProperty(id, 'line-color', p.road)
        break
      case 'symbol':
        map.setPaintProperty(
          id,
          'text-color',
          id.startsWith('label_city') || id.startsWith('label_town')
            ? p.labelStrong
            : p.label
        )
        map.setPaintProperty(id, 'text-halo-color', p.halo)
        map.setPaintProperty(id, 'text-halo-width', 1.4)
        if (id.startsWith('label_') || id.startsWith('water_name')) {
          map.setLayoutProperty(id, 'text-field', [
            'coalesce',
            ['get', `name:${lang}`],
            ['get', 'name']
          ])
        }
        break
    }
  }
}
