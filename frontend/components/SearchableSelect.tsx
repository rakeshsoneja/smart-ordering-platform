'use client'

import { useState, useRef, useEffect, useMemo, useId } from 'react'

export type SearchableSelectProps<T> = {
  options: readonly T[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  label?: string
  id?: string
  name?: string
  disabled?: boolean
  error?: boolean
  autoComplete?: string
  getOptionValue?: (option: T) => string
  getOptionLabel?: (option: T) => string
}

function toEntry<T>(
  option: T,
  getOptionValue?: (option: T) => string,
  getOptionLabel?: (option: T) => string
): { value: string; label: string } {
  if (typeof option === 'string') {
    return { value: option, label: option }
  }
  if (!getOptionValue || !getOptionLabel) {
    throw new Error('SearchableSelect: getOptionValue and getOptionLabel are required when options are objects')
  }
  return { value: getOptionValue(option), label: getOptionLabel(option) }
}

export function SearchableSelect<T>({
  options,
  value,
  onChange,
  placeholder,
  label,
  id,
  name,
  disabled = false,
  error = false,
  autoComplete,
  getOptionValue,
  getOptionLabel,
}: SearchableSelectProps<T>) {
  const reactId = useId()
  const triggerId = id ?? `searchable-select-${reactId}`
  const listboxId = `${triggerId}-listbox`
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  const entries = useMemo(
    () => options.map((opt) => toEntry(opt, getOptionValue, getOptionLabel)),
    [options, getOptionValue, getOptionLabel]
  )

  const selectedLabel = useMemo(() => {
    if (!value) return ''
    return entries.find((e) => e.value === value)?.label ?? ''
  }, [entries, value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) => e.label.toLowerCase().includes(q))
  }, [entries, query])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const el = rootRef.current
      if (!el) return
      const target = e.target as Node
      if (!el.contains(target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown, { passive: true })
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!open || !rootRef.current) return
    const id = requestAnimationFrame(() => {
      rootRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(id)
  }, [open])

  const toggle = () => {
    if (disabled) return
    setOpen((o) => {
      const next = !o
      if (next) setQuery('')
      return next
    })
  }

  const selectValue = (next: string) => {
    onChange(next)
    setOpen(false)
    setQuery('')
  }

  const borderClass = error ? 'border-red-500' : 'border-gray-300'

  return (
    <div ref={rootRef} className="relative w-full">
      {name ? (
        <input type="hidden" name={name} value={value} readOnly autoComplete={autoComplete} />
      ) : null}
      {label ? (
        <label htmlFor={triggerId} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      ) : null}
      <button
        type="button"
        id={triggerId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggle()
          }
        }}
        className={[
          'w-full min-h-[48px] max-h-[52px] px-4 rounded-lg border flex items-center justify-between gap-2 text-left touch-manipulation',
          'transition-[box-shadow,transform] duration-150 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
          open ? 'ring-2 ring-purple-500 border-transparent' : '',
          disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-900',
          borderClass,
        ].join(' ')}
      >
        <span className={`truncate flex-1 text-sm sm:text-base ${selectedLabel ? '' : 'text-gray-500'}`}>
          {selectedLabel || placeholder}
        </span>
        <svg
          className={`h-5 w-5 shrink-0 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
        </svg>
      </button>

      <div
        id={listboxId}
        role="listbox"
        className={[
          'absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg',
          'origin-top transition-all duration-150 ease-out',
          open ? 'pointer-events-auto visible opacity-100 scale-100' : 'pointer-events-none invisible opacity-0 scale-[0.98]',
        ].join(' ')}
      >
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            autoComplete="off"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter') {
                e.preventDefault()
              }
            }}
          />
        </div>
        <ul
          role="presentation"
          className="max-h-[200px] overflow-y-auto overscroll-contain py-1"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-center text-sm text-gray-500">No results found</li>
          ) : (
            filtered.map((entry) => {
              const selected = entry.value === value
              return (
                <li key={entry.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => selectValue(entry.value)}
                    className={[
                      'flex w-full min-h-[48px] items-center justify-between gap-3 px-4 py-3 text-left text-sm sm:text-base touch-manipulation',
                      'transition-colors duration-100',
                      selected
                        ? 'bg-green-50 text-green-800 font-medium'
                        : 'text-gray-900 hover:bg-gray-100',
                    ].join(' ')}
                  >
                    <span className="truncate">{entry.label}</span>
                    {selected ? (
                      <svg className="h-5 w-5 shrink-0 text-green-700" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : null}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </div>
  )
}
