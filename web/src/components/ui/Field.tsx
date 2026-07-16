import { forwardRef, useId, type InputHTMLAttributes } from 'react'

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  id?: string
  label: string
  hint?: string
  error?: string
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { id, label, hint, error, className = '', ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const messageId = `${inputId}-message`

  return (
    <div className="ui-field">
      <label className="ui-field__label" htmlFor={inputId}>{label}</label>
      <input
        {...props}
        ref={ref}
        id={inputId}
        className={`ui-field__control ${className}`.trim()}
        aria-invalid={Boolean(error)}
        aria-describedby={hint || error ? messageId : undefined}
      />
      {error ? (
        <p className="ui-field__error" id={messageId} role="alert">{error}</p>
      ) : hint ? (
        <p className="ui-field__hint" id={messageId}>{hint}</p>
      ) : null}
    </div>
  )
})
