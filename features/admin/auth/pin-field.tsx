import { normalizePin } from './pin'

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
  return (
    <label>
      {label}
      <input
        className="pin-input"
        type="password"
        value={value}
        onChange={(e) => onChange(normalizePin(e.target.value))}
        inputMode="numeric"
        autoComplete={current ? 'current-password' : 'new-password'}
        placeholder="••••••"
        minLength={6}
        maxLength={6}
        pattern="[0-9]{6}"
        required
        autoFocus={autoFocus}
      />
    </label>
  )
}
