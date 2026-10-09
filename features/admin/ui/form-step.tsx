import styles from './form-step.module.css'

/**
 * Shared step heading for the logo and community editors.
 * The title is top-aligned with the number on small screens.
 */
export function FormStep({
  number,
  title,
  description,
}: {
  number: '01' | '02' | '03'
  title: string
  description: string
}) {
  return (
    <div className={styles.heading}>
      <span className={styles.number} aria-hidden="true">
        {number}
      </span>
      <div className={styles.copy}>
        <h4 className={styles.title}>{title}</h4>
        <p className={styles.description}>{description}</p>
      </div>
    </div>
  )
}
