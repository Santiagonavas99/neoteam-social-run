'use client'

import { Eye, EyeOff, Plus, UserCog } from 'lucide-react'
import { useCallback, useState } from 'react'
import { callAdmin } from '../api'
import { isEmail, normalizeEmail } from '../auth/code'
import { errorMessage } from '../errors'
import { staffRoles } from '../labels'
import { type FeedbackValue, isNew, type StaffUser } from '../types'
import { Feedback, StatusBadge } from '../ui/admin-ui'
import { EditorForm, useEditor } from '../ui/editor-form'
import { EmptyState } from '../ui/empty-state'
import { LabelOptions } from '../ui/label-options'
import { LoadingState } from '../ui/loading-state'
import { EditButton, RecordCard } from '../ui/record-card'
import { useAdminData } from '../ui/use-admin-data'

function validate(user: StaffUser) {
  if (user.name.trim().length < 2) return 'Escribe un nombre de 2 a 80 caracteres.'
  if (isNew(user) && !isEmail(user.email)) return 'Escribe un correo válido.'
  return null
}

function TeamForm({
  row,
  onSave,
  onCancel,
}: {
  row: StaffUser
  onSave: (user: StaffUser) => Promise<void>
  onCancel: () => void
}) {
  const { values, update, busy, feedback, submit } = useEditor(row, onSave, validate)
  const created = isNew(row)

  return (
    <EditorForm
      title={created ? 'Nuevo usuario' : `Editar ${row.name}`}
      hint={
        created
          ? 'Entrará con un código que le llegará a este correo.'
          : 'Cambiar el rol o quitarle el acceso cierra su sesión.'
      }
      legend="Datos del usuario"
      submitLabel={created ? 'Crear usuario' : 'Guardar cambios'}
      busy={busy}
      feedback={feedback}
      onSubmit={submit}
      onCancel={onCancel}
    >
      <label>
        Nombre
        <input
          autoFocus
          value={values.name}
          required
          maxLength={80}
          autoComplete="off"
          onChange={(e) => update('name', e.target.value)}
        />
      </label>
      {created ? (
        <label>
          Correo
          <input
            type="email"
            value={values.email}
            required
            maxLength={160}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            onChange={(e) => update('email', e.target.value)}
          />
        </label>
      ) : (
        <label>
          Correo
          <input value={row.email} readOnly />
        </label>
      )}
      <label>
        Rol
        <select
          value={values.role}
          onChange={(e) => update('role', e.target.value === 'admin' ? 'admin' : 'checkin')}
        >
          <LabelOptions labels={staffRoles} />
        </select>
        <small>
          {values.role === 'admin'
            ? 'Ve todo el panel y gestiona el equipo.'
            : 'Solo escanea el check-in.'}
        </small>
      </label>
      {!created && (
        <label className="check-label">
          <input
            type="checkbox"
            checked={values.active}
            onChange={(e) => update('active', e.target.checked)}
          />
          Puede entrar al panel
        </label>
      )}
    </EditorForm>
  )
}

export function TeamView() {
  const [feedback, setFeedback] = useState<FeedbackValue>(null)
  const [editor, setEditor] = useState<StaffUser | null>(null)
  const onError = useCallback(
    (error: unknown) => setFeedback({ kind: 'error', text: errorMessage(error) }),
    [],
  )
  const load = useCallback(
    async () => (await callAdmin<StaffUser>('users', { operation: 'list' })).rows ?? [],
    [],
  )
  const { data: rows, loading, reload } = useAdminData(load, [], onError)

  function edit(row: StaffUser | null) {
    setFeedback(null)
    setEditor(row)
  }

  async function save(user: StaffUser) {
    const { id: _id, email, ...rest } = user
    await callAdmin('users', {
      operation: 'save',
      values: isNew(user) ? { ...rest, email: normalizeEmail(email) } : user,
    })
    setEditor(null)
    setFeedback({ kind: 'success', text: 'Cambios guardados.' })
    await reload()
  }

  const addButton = (
    <button
      type="button"
      className="button"
      disabled={!!editor}
      onClick={() =>
        edit({ id: `new-${Date.now()}`, name: '', email: '', role: 'checkin', active: true })
      }
    >
      <Plus aria-hidden className="size-4 shrink-0" />
      Añadir usuario
    </button>
  )

  return (
    <section aria-busy={loading}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 [&>.button]:flex-1 md:[&>.button]:flex-none">
        <p className="m-0 text-sm text-neo-text-secondary">
          {rows.length} {rows.length === 1 ? 'usuario' : 'usuarios'}
        </p>
        {addButton}
      </div>
      <Feedback value={feedback} />
      {editor && isNew(editor) && (
        <TeamForm key={editor.id} row={editor} onSave={save} onCancel={() => edit(null)} />
      )}
      {loading ? (
        <LoadingState>Cargando equipo…</LoadingState>
      ) : !rows.length ? (
        <EmptyState
          icon={UserCog}
          title="Aún no hay usuarios"
          text="Añade a cada persona del staff con su correo."
          action={!editor && addButton}
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((row) => (
            <RecordCard
              key={row.id}
              title={row.name}
              subtitle={row.email}
              meta={
                <>
                  <StatusBadge
                    status={row.active ? 'open' : 'cancelled'}
                    label={row.active ? 'Activo' : 'Inactivo'}
                    icon={row.active ? Eye : EyeOff}
                  />
                  <small>{staffRoles[row.role]}</small>
                </>
              }
              actions={
                <EditButton
                  open={editor?.id === row.id}
                  onClick={() => edit(editor?.id === row.id ? null : row)}
                  disabled={!!editor && editor.id !== row.id}
                />
              }
            >
              {editor?.id === row.id && (
                <TeamForm row={editor} onSave={save} onCancel={() => edit(null)} />
              )}
            </RecordCard>
          ))}
        </div>
      )}
    </section>
  )
}
