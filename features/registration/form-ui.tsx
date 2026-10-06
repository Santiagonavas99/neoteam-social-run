import { ArrowRight, CircleAlert, LoaderCircle } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

// Global base rules style label, input and select (unlayered, so they win over utilities);
// these blocks add layout and wire label, error and aria attributes together.

export const cardClass =
  'min-w-0 rounded-card border border-neo-border bg-neo-white px-5 py-6 sm:p-8 lg:p-10'

export const linkClass =
  'inline-flex min-h-11 items-center gap-2 text-[13px] font-bold hover:underline hover:underline-offset-4'

const errorId = (name: string) => `${name}-error`

export function FieldError({ name, errors }: { name: string; errors?: string[] }) {
  if (!errors?.length) return null
  return (
    <small
      id={errorId(name)}
      className="inline-flex items-start gap-1 text-xs font-medium leading-snug text-neo-danger"
    >
      <CircleAlert aria-hidden className="mt-px size-3.5 shrink-0" />
      {errors[0]}
    </small>
  )
}

const fieldAria = (name: string, errors?: string[]) =>
  errors?.length ? { 'aria-invalid': true, 'aria-describedby': errorId(name) } : {}

type FieldProps = { name: string; label: string; errors?: string[] }

export function TextField({
  name,
  label,
  errors,
  ...input
}: FieldProps & Omit<ComponentProps<'input'>, 'name' | 'id'>) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} {...fieldAria(name, errors)} {...input} />
      <FieldError name={name} errors={errors} />
    </div>
  )
}

export function SelectField({
  name,
  label,
  errors,
  children,
  ...select
}: FieldProps & Omit<ComponentProps<'select'>, 'name' | 'id'>) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name} {...fieldAria(name, errors)} {...select}>
        {children}
      </select>
      <FieldError name={name} errors={errors} />
    </div>
  )
}

export function CheckboxField({
  name,
  children,
  errors,
  muted = false,
  ...input
}: { name: string; children: ReactNode; errors?: string[]; muted?: boolean } & Omit<
  ComponentProps<'input'>,
  'name' | 'id' | 'type' | 'children'
>) {
  return (
    <div className="flex flex-col gap-1 py-2">
      <div className="flex min-h-11 items-start gap-3">
        <input
          id={name}
          name={name}
          type="checkbox"
          className="mt-0.5"
          {...fieldAria(name, errors)}
          {...input}
        />
        <label htmlFor={name} className="cursor-pointer">
          <span
            className={`text-sm font-normal leading-normal ${muted ? 'text-neo-text-secondary' : 'text-neo-black'}`}
          >
            {children}
          </span>
        </label>
      </div>
      <FieldError name={name} errors={errors} />
    </div>
  )
}

export function FormSection({ step, title, hint }: { step: string; title: string; hint: string }) {
  return (
    <div className="mt-8 mb-6 flex items-center gap-4 border-b border-neo-border pb-5 first-of-type:mt-0">
      <span aria-hidden className="text-2xl font-medium tracking-[-0.06em] text-neo-accent">
        {step}
      </span>
      <h2 className="m-0 flex flex-col gap-1">
        <span className="text-base font-semibold tracking-[-0.02em]">{title}</span>
        <span className="text-xs font-normal leading-snug text-neo-text-secondary">{hint}</span>
      </h2>
    </div>
  )
}

export function FormMessage({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="my-4 flex items-start gap-2 border-l-3 border-neo-danger bg-neo-danger-bg px-4 py-3 text-sm text-neo-danger"
    >
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  )
}

export function SubmitButton({
  pending,
  idle,
  busy,
}: {
  pending: boolean
  idle: string
  busy: string
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-4 rounded-control border border-neo-black bg-neo-black px-5 py-3 text-neo-white transition-colors hover:border-neo-accent-dark hover:bg-neo-accent-dark"
    >
      {/* Global `button { font: inherit }` beats utilities on the button itself. */}
      <span className="text-[13px] font-bold">{pending ? busy : idle}</span>
      {pending ? (
        <LoaderCircle aria-hidden className="size-4 shrink-0 motion-safe:animate-spin" />
      ) : (
        <ArrowRight aria-hidden className="size-4 shrink-0" />
      )}
    </button>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 text-xs font-bold uppercase leading-normal tracking-[0.14em] text-neo-accent-dark">
      {children}
    </p>
  )
}
