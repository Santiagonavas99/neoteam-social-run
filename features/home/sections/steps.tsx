import { ArrowRight, MapPin, QrCode } from 'lucide-react'
import Link from 'next/link'
import { eventConfig } from '@/features/event/event'
import styles from './steps.module.css'
import { StepsMotion } from './steps-motion'

const steps = [
  {
    title: 'Inscríbete gratis',
    description: 'Completa el formulario y recibe un pase personal con tu código QR.',
    tag: 'ANTES DEL EVENTO',
  },
  {
    title: 'Guarda tu pase',
    description: 'Ten el QR a mano en tu celular. Si lo pierdes, puedes recuperarlo en «Mi pase».',
    tag: 'PREPÁRATE',
  },
  {
    title: 'Muestra tu QR al llegar',
    description:
      'El equipo de NeoTeam lo escaneará para confirmar tu inscripción y registrar tu asistencia. Tú solo tienes que mostrarlo.',
    tag: 'CHECK-IN',
  },
  {
    title: 'Corre y celebra',
    description: 'Disfruta la ruta social 5K, conoce a otros runners y comparte el aniversario.',
    tag: '18 OCTUBRE',
  },
] as const

export function Steps() {
  return (
    <StepsMotion>
      <div className="shell">
        <div className={styles.top}>
          <div className={styles.intro} data-reveal>
            <p className={styles.eyebrow}>ANTES Y DURANTE EL SOCIAL RUN</p>
            <h2 id="steps-heading">
              CUATRO PASOS.
              <br />
              <em>CERO DUDAS.</em>
            </h2>
            <p className={styles.lead}>
              ¿No sabes para qué sirve el QR que recibes al registrarte? Es tu pase personal: lo
              presentas al llegar y nuestro equipo registra tu asistencia.
            </p>
          </div>
          <div className={styles.passVisual} data-reveal>
            <div className={styles.passVisualTop}>
              <span>NEO TEAM / SOCIAL RUN</span>
              <span>18.10.26</span>
            </div>
            <div className={styles.iconFrame} aria-hidden="true">
              <QrCode size={104} strokeWidth={1.1} aria-hidden="true" />
            </div>
            <strong>UN QR. TU CHECK-IN.</strong>
          </div>
        </div>

        <ol className={styles.timeline}>
          {steps.map((step, i) => (
            <li className={i === 2 ? styles.featured : styles.step} key={step.title} data-reveal>
              <div className={styles.stepTop}>
                <strong className={styles.number}>{String(i + 1).padStart(2, '0')}</strong>
                <span className={styles.tag}>{step.tag}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              {i === 2 ? (
                <span className={styles.arrival}>
                  <MapPin size={15} aria-hidden="true" /> {eventConfig.location}
                </span>
              ) : null}
            </li>
          ))}
        </ol>

        <div className={styles.bottom} data-reveal>
          <div className={styles.actions}>
            <Link href="/pase" className={styles.mainLink}>
              Ver o recuperar mi pase <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link href="/registro" className={styles.secondaryLink}>
              Aún no me he inscrito
            </Link>
          </div>
        </div>
      </div>
    </StepsMotion>
  )
}
