/** Appended to `delivery_address` after a blank line; followed by JSON meta (not shown to users). */
export const ADDR_META_MARKER = '<<<ADDR_META>>>'

export type ParsedDeliveryAddress = {
  street: string
  city: string
  pincode: string
  state: string
}

export function buildStoredDeliveryAddress(
  street: string,
  city: string,
  pincode: string,
  state: string
): string {
  const meta = JSON.stringify({
    city: city.trim(),
    pincode: pincode.trim(),
    state: state.trim(),
  })
  return `${street.trim()}\n\n${ADDR_META_MARKER}${meta}`
}

function parseLegacyPincodeStateFormat(raw: string): ParsedDeliveryAddress {
  const lines = raw.split('\n')
  const kept: string[] = []
  let pincode = ''
  let state = ''
  for (const line of lines) {
    const pl = line.match(/^Pincode:\s*(.+)$/i)
    const sl = line.match(/^State:\s*(.+)$/i)
    if (pl) pincode = pl[1].trim()
    else if (sl) state = sl[1].trim()
    else kept.push(line)
  }
  return {
    street: kept.join('\n').trim(),
    city: '',
    pincode,
    state,
  }
}

export function parseStoredDeliveryAddress(raw: string): ParsedDeliveryAddress {
  if (!raw || typeof raw !== 'string') {
    return { street: '', city: '', pincode: '', state: '' }
  }
  const idx = raw.indexOf(ADDR_META_MARKER)
  if (idx !== -1) {
    const street = raw.slice(0, idx).trim()
    const jsonStr = raw.slice(idx + ADDR_META_MARKER.length).trim()
    try {
      const o = JSON.parse(jsonStr) as { city?: string; pincode?: string; state?: string }
      return {
        street,
        city: (o.city ?? '').trim(),
        pincode: (o.pincode ?? '').trim(),
        state: (o.state ?? '').trim(),
      }
    } catch {
      return { street: raw.trim(), city: '', pincode: '', state: '' }
    }
  }
  return parseLegacyPincodeStateFormat(raw)
}

/**
 * Display string with newlines (use `whitespace-pre-line` in UI):
 * line 1 — street (internal newlines become ", ")
 * line 2 — `City - Pincode` (or pincode / city alone when partial; legacy without city)
 * line 3 — State
 * No Pincode:/State: labels in output.
 */
export function formatDeliveryAddressForDisplay(parts: ParsedDeliveryAddress): string {
  const streetLine = parts.street.replace(/\s*\n\s*/g, ', ').trim()
  const city = parts.city.trim()
  const pincode = parts.pincode.trim()
  const state = parts.state.trim()

  let cityPinLine = ''
  if (city && pincode) cityPinLine = `${city} - ${pincode}`
  else if (pincode) cityPinLine = pincode
  else if (city) cityPinLine = city

  return [streetLine, cityPinLine, state].filter(Boolean).join('\n')
}

export function resolveDisplayState(
  stateName: string | null | undefined,
  rawDeliveryAddress: string | null | undefined,
  legacyState?: string | null
): string {
  const preferred = typeof stateName === 'string' ? stateName.trim() : ''
  if (preferred) return preferred
  const parsed = parseStoredDeliveryAddress(rawDeliveryAddress ?? '')
  if (parsed.state) return parsed.state
  const legacy = typeof legacyState === 'string' ? legacyState.trim() : ''
  return legacy || 'N/A'
}
