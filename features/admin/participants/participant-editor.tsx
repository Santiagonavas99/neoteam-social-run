'use client'

import { Check, Pencil, TriangleAlert, X } from 'lucide-react'
import { useState } from 'react'
import { validateParticipantProfile, type ParticipantProfile } from '@/lib/participant-profile'
import type { Participant, ParticipantGroupOption } from '../types'

export function ParticipantEditor({
  participant,
  groups,
  saving,
  onSave,
  onCancel,
}: {
  participant: Participant
  groups: ParticipantGroupOption[]
  saving: boolean
  onSave: (profile: ParticipantProfile) => Promise<void>
  onCancel: () => void
}) {
  const [profile, setProfile] = useState<ParticipantProfile>({
    first_name: participant.first_name,
    last_name: participant.last_name,
    document_type: participant.document_type,
    document_number: participant.document_number,
    email: participant.email,
    phone: participant.phone,
    birth_date: participant.birth_date || null,
    gender: participant.gender || 'female',
    running_group_id: participant.running_group_id || null,
    other_running_group: participant.other_running_group || null,
    shirt_size: participant.shirt_size || null,
    emergency_name: participant.emergency_name || '',
    emergency_phone: participant.emergency_phone || '',
  })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [customCrew, setCustomCrew] = useState(!!participant.other_running_group)
  const value = (key: keyof ParticipantProfile) => profile[key] ?? ''
  const set = (key: keyof ParticipantProfile, next: string) =>
    setProfile((current) => ({ ...current, [key]: next || null }))

  const editingEmail = profile.email.trim().toLowerCase() !== participant.email.trim().toLowerCase()
  const crewValue = customCrew ? 'custom' : profile.running_group_id || ''

  const field = (
    label: string,
    key: keyof ParticipantProfile,
    options: {
      type?: string
      required?: boolean
      inputMode?: 'numeric' | 'email' | 'tel'
      autoComplete?: string
      min?: string
      max?: string
    } = {},
  ) => (
    <label className="flex min-w-0 flex-col gap-1.5 text-sm font-semibold">
      {label}
      <input
        name={key}
        type={options.type ?? 'text'}
        required={options.required ?? true}
        value={value(key)}
        onChange={(event) => set(key, event.currentTarget.value)}
        inputMode={options.inputMode}
        autoComplete={options.autoComplete}
        min={options.min}
        max={options.max}
        className="min-h-11 w-full"
        disabled={saving}
      />
    </label>
  )

  return (
    <form
      className="mt-4 rounded-card border border-neo-accent-border bg-neo-surface p-4 md:p-6"
      onSubmit={(event) => {
        event.preventDefault()
        setFeedback(null)
        const result = validateParticipantProfile(profile)
        if (!result.ok) {
          setFeedback(result.error)
          return
        }
        if (customCrew && !result.profile.other_running_group) {
          setFeedback('Escribe el nombre del running crew.')
          return
        }
        void onSave(result.profile)
      }}
    >
      <div className="mb-5 flex items-center gap-2">
        <Pencil aria-hidden className="size-5 text-neo-accent-text" />
        <h3 className="m-0 text-base font-bold">Editar información personal</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {field('Nombres', 'first_name', { autoComplete: 'given-name' })}
        {field('Apellidos', 'last_name', { autoComplete: 'family-name' })}
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Tipo de documento
          <select
            value={profile.document_type}
            onChange={(event) => set('document_type', event.currentTarget.value)}
            className="min-h-11"
            disabled={saving}
          >
            {['CC', 'CE', 'TI', 'PA', 'PPT', 'OTRO'].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        {field('Número de documento', 'document_number', {
          inputMode: ['CC', 'CE', 'TI', 'PPT'].includes(profile.document_type)
            ? 'numeric'
            : undefined,
        })}
        {field('Correo electrónico', 'email', {
          type: 'email',
          inputMode: 'email',
          autoComplete: 'email',
        })}
        {field('WhatsApp', 'phone', { type: 'tel', inputMode: 'tel', autoComplete: 'tel' })}
        {field('Fecha de nacimiento', 'birth_date', {
          type: 'date',
          required: false,
          min: '1900-01-01',
        })}
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Género
          <select
            value={profile.gender}
            onChange={(event) => set('gender', event.currentTarget.value)}
            disabled={saving}
            className="min-h-11"
          >
            <option value="female">Mujer</option>
            <option value="male">Hombre</option>
            <option value="non_binary">No binario</option>
            <option value="prefer_not_to_say">Prefiere no decir</option>
            <option value="other">Otro</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Running crew
          <select
            value={crewValue}
            onChange={(event) => {
              const next = event.currentTarget.value
              setCustomCrew(next === 'custom')
              setProfile((current) => ({
                ...current,
                running_group_id: next && next !== 'custom' ? next : null,
                other_running_group: next === 'custom' ? current.other_running_group : null,
              }))
            }}
            className="min-h-11"
            disabled={saving}
          >
            <option value="">Independiente / sin grupo</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
                {group.active ? '' : ' (inactivo)'}
              </option>
            ))}
            <option value="custom">Otro running crew</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Talla de camiseta
          <select
            className="min-h-11"
            value={profile.shirt_size || ''}
            onChange={(event) => set('shirt_size', event.currentTarget.value)}
            disabled={saving}
          >
            <option value="">Sin talla</option>
            {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
              <option key={size}>{size}</option>
            ))}
          </select>
        </label>
        {customCrew && field('Nombre del otro running crew', 'other_running_group')}
        {field('Contacto de emergencia', 'emergency_name')}
        {field('Celular de emergencia', 'emergency_phone', { type: 'tel', inputMode: 'tel' })}
      </div>
      {editingEmail && (
        <p className="mt-4 flex items-start gap-2 rounded-control border border-neo-border bg-neo-warning-bg px-3 py-3 text-sm text-neo-warning">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          El pase anterior pudo enviarse al correo equivocado. Al guardar, quedará pendiente en
          «Correos pendientes» para que lo envíes manualmente al nuevo correo.
        </p>
      )}
      {feedback && (
        <p className="mt-4 text-sm font-medium text-neo-danger" role="alert">
          {feedback}
        </p>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button className="button" type="submit" disabled={saving}>
          <Check aria-hidden className="size-4" />
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={onCancel}
          disabled={saving}
        >
          <X aria-hidden className="size-4" /> Cancelar
        </button>
      </div>
    </form>
  )
}
