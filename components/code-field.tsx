import { normalizeCode } from './code'

const SLOTS = [0, 1, 2, 3, 4, 5]

// One real input under six painted boxes: paste, SMS/email autofill and screen readers see a single field.
export function CodeField({
  label,
  name,
  value,
  onChange,
  autoFocus = false,
}: {
  label: string
  name?: string
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
}) {
  const active = Math.min(value.length, SLOTS.length - 1)
  return (
    <label>
      {label}
      <span className="group relative block">
        <input
          className="absolute inset-0 z-10 size-full! cursor-text opacity-0"
          type="text"
          name={name}
          value={value}
          onChange={(e) => onChange(normalizeCode(e.target.value))}
          inputMode="numeric"
          autoComplete="one-time-code"
          minLength={6}
          maxLength={6}
          pattern="[0-9]{6}"
          required
          // biome-ignore lint/a11y/noAutofocus: opt-in for the admin sign-in, where the code is the next and only field
          autoFocus={autoFocus}
        />
        <span aria-hidden className="grid grid-cols-6 gap-2">
          {SLOTS.map((slot) => (
            <span
              key={slot}
              className={`grid h-14 place-items-center rounded-control border bg-neo-surface text-2xl font-bold transition-colors ${
                slot === active
                  ? 'border-neo-border-strong group-focus-within:border-neo-accent-text group-focus-within:ring-2 group-focus-within:ring-neo-accent-text/30'
                  : slot < value.length
                    ? 'border-neo-text'
                    : 'border-neo-border-strong'
              }`}
            >
              {value[slot] ?? ''}
            </span>
          ))}
        </span>
      </span>
    </label>
  )
}
