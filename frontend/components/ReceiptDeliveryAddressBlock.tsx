import { parseStoredDeliveryAddress } from '@/lib/deliveryAddressFormat'

export type ReceiptDeliveryAddressBlockProps = {
  customerName: string
  customerPhone: string
  rawDeliveryAddress: string
  /** Prefer full state name (e.g. Tamil Nadu); fallback from parent. */
  stateDisplay: string
  className?: string
}

function formatPhoneForReceipt(phone: string): string {
  const raw = (phone ?? '').trim().replace(/\s/g, '')
  if (!raw) return '—'
  if (raw.startsWith('+')) return raw
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  if (digits.length === 10) return `+91${digits}`
  return raw
}

function cityPincodeLine(parts: ReturnType<typeof parseStoredDeliveryAddress>): string {
  const city = parts.city.trim()
  const pincode = parts.pincode.trim()
  if (city && pincode) return `${city} - ${pincode}`
  if (pincode) return pincode
  if (city) return city
  return ''
}

/**
 * Receipt-style delivery block: bold heading + name, then street, city–pincode, state, phone.
 */
export default function ReceiptDeliveryAddressBlock({
  customerName,
  customerPhone,
  rawDeliveryAddress,
  stateDisplay,
  className = '',
}: ReceiptDeliveryAddressBlockProps) {
  const parts = parseStoredDeliveryAddress(rawDeliveryAddress)
  const streetLine = parts.street.replace(/\s*\n\s*/g, ', ').trim()
  const cityPinLine = cityPincodeLine(parts)
  const stateLine = (stateDisplay ?? '').trim()
  const phoneLine = formatPhoneForReceipt(customerPhone)

  const rootClass = ['text-sm sm:text-base text-gray-900', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass}>
      <p className="font-bold">Delivery Address:</p>
      <p className="font-bold mt-1 break-words">{customerName.trim() || '—'}</p>
      {streetLine ? (
        <p className="font-normal mt-1 break-words whitespace-pre-line">{streetLine}</p>
      ) : null}
      {cityPinLine ? <p className="font-normal mt-1 break-words">{cityPinLine}</p> : null}
      {stateLine ? <p className="font-normal mt-1 break-words">{stateLine}</p> : null}
      <p className="font-normal mt-1 break-all">
        Phone: {phoneLine}
      </p>
    </div>
  )
}
