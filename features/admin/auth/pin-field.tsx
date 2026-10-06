import { normalizePin } from './pin'

const SLOTS = [0, 1, 2, 3, 4, 5]

// One real input under six painted boxes: paste, autofill and screen readers see a single field.
export function PinField({
  label,
  value,
  onChange,
  current = false,
  autoFocus = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  current?: boolean
  autoFocus?: boolean
}) {
  const active = Math.min(value.length, SLOTS.length - 1)
  return (
    <label>
      {label}
      <span className="group relative block">
        <input
          className="absolute inset-0 z-10 size-full! cursor-text opacity-0"
          type="password"
          value={value}
          onChange={(e) => onChange(normalizePin(e.target.value))}
          inputMode="numeric"
          autoComplete={current ? 'current-password' : 'new-password'}
          minLength={6}
          pattern="[0-9]{6}"
          required
          autoFocus={autoFocus}
        />
        <span aria-hidden className="grid grid-cols-6 gap-2">
          {SLOTS.map((slot) => (
            <span
              key={slot}
              className={`grid h-14 place-items-center rounded-control border bg-neo-surface transition-colors ${
                slot === active
                  ? 'border-neo-border-strong group-focus-within:border-neo-accent-text group-focus-within:ring-2 group-focus-within:ring-neo-accent-text/30'
                  : slot < value.length
                    ? 'border-neo-text'
                    : 'border-neo-border-strong'
              }`}
            >
              {slot < value.length && <span className="size-3 rounded-full bg-neo-text" />}
            </span>
          ))}
        </span>
      </span>
    </label>
  )
}
