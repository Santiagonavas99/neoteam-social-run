import type { Metadata } from 'next'
import Link from 'next/link'
import { NEOTEAM_LEADERS } from '@/features/legal/leaders'

export const metadata: Metadata = {
  title: 'Condiciones de participación | Social Run NeoTeam',
  description:
    'Condiciones de inscripción y participación del Social Run de NeoTeam del 18 de octubre de 2026.',
}

const heading = 'mt-9 mb-3 text-xl font-bold tracking-[-0.035em]'
const paragraph = 'my-3 text-[15px] leading-7 text-neo-text-secondary'

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-[760px]">
      <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-neo-accent-text">
        Social Run · 18 OCT 2026
      </p>
      <h1 className="mb-5 mt-3 text-[clamp(36px,6vw,64px)] font-bold uppercase leading-none tracking-[-0.06em]">
        Condiciones de participación
      </h1>
      <p className={paragraph}>
        Versión preliminar para revisión del equipo organizador. Antes de su publicación definitiva
        deben identificarse formalmente las personas o entidad responsables de la actividad y
        validarse las condiciones de participación de menores de edad.
      </p>
      <div className="mt-6 border-l-4 border-neo-accent bg-neo-surface p-5 text-sm leading-6">
        La inscripción es gratuita. Lee estas condiciones antes de confirmar tu registro. El
        consentimiento sobre el tratamiento de datos se solicita por separado y puede consultarse en
        la{' '}
        <Link href="/legal/privacidad" className="font-semibold underline underline-offset-4">
          política de tratamiento de datos
        </Link>
        .
      </div>

      <section
        aria-labelledby="neoteam-leadership"
        className="mt-7 rounded-xl border border-neo-border bg-neo-surface p-5 sm:p-6"
      >
        <h2 id="neoteam-leadership" className="m-0 text-lg font-bold">
          Líderes de NeoTeam
        </h2>
        <p className="my-3 text-sm leading-6 text-neo-text-secondary">
          El equipo de liderazgo de NeoTeam está integrado por:
        </p>
        <ul className="m-0 list-disc space-y-2 pl-5 text-sm leading-6">
          {NEOTEAM_LEADERS.map((leader) => (
            <li key={leader}>{leader}</li>
          ))}
        </ul>
        <p className="mb-0 mt-4 text-sm leading-6 text-neo-text-secondary">
          Su identificación como líderes no implica, por sí sola, la atribución individual o
          conjunta de responsabilidades jurídicas. Esa condición debe formalizarse en la versión
          definitiva de estos documentos.
        </p>
      </section>

      <h2 className={heading}>1. Actividad y lugar</h2>
      <p className={paragraph}>
        Social Run es un encuentro recreativo de la comunidad NeoTeam con motivo de su aniversario.
        Está previsto para el domingo 18 de octubre de 2026, con punto de encuentro en el Parque del
        Ingenio, Cali, a partir de las 7:30 a. m. La actividad incluye un recorrido grupal
        aproximado de 5 km y espacios de encuentro comunitario. No constituye una competencia
        oficial cronometrada ni ofrece certificación de tiempos.
      </p>

      <h2 className={heading}>2. Inscripción y asistencia</h2>
      <p className={paragraph}>
        Cada inscripción es personal. Se solicita información verídica de identificación, contacto y
        una persona para llamar en caso de emergencia. La confirmación y el pase de acceso están
        sujetos a las condiciones operativas comunicadas para el evento. No se exige pertenecer a un
        running crew.
      </p>

      <h2 className={heading}>3. Riesgos propios de la actividad física</h2>
      <p className={paragraph}>
        Participar en una carrera o caminata recreativa supone riesgos previsibles, entre ellos
        fatiga, caídas, lesiones y deshidratación. Al inscribirte declaras conocer la naturaleza
        física de la actividad y te comprometes a actuar de manera prudente, considerar tu condición
        de salud y detenerte si presentas dolor, mareo o malestar.
      </p>
      <p className={paragraph}>
        Debes seguir las indicaciones de seguridad del personal organizador, respetar a los demás
        participantes, peatones y normas de tránsito, así como utilizar calzado y vestuario
        apropiados. Si tienes dudas médicas sobre tu aptitud, consulta previamente con un
        profesional de salud.
      </p>
      <p className={paragraph}>
        La participación voluntaria y el reconocimiento de los riesgos habituales no constituyen una
        renuncia anticipada a derechos legales ni eximen a la organización de las responsabilidades
        que legalmente le correspondan.
      </p>

      <h2 className={heading}>4. Cambios y medidas de seguridad</h2>
      <p className={paragraph}>
        Por razones de seguridad, condiciones climáticas, fuerza mayor o instrucciones de
        autoridades competentes, la organización podrá modificar horarios, recorridos o actividades,
        e incluso suspender el encuentro. Los cambios relevantes se comunicarán, en la medida de lo
        posible, por los canales oficiales del evento.
      </p>

      <h2 className={heading}>5. Rifas y actividades con aliados</h2>
      <p className={paragraph}>
        Si se realizan rifas o actividades con marcas aliadas, las condiciones específicas de
        participación, elegibilidad, entrega de premios y demás requisitos se informarán antes de
        cada dinámica. El registro por sí solo no garantiza obtener un premio.
      </p>

      <h2 className={heading}>6. Niñas, niños y adolescentes</h2>
      <p className={paragraph}>
        La participación de menores requiere un procedimiento específico de autorización de su
        representante legal y medidas de acompañamiento acordes con la actividad. El formulario
        digital general no sustituye dicha autorización. Este procedimiento deberá quedar definido
        antes de admitir registros de menores.
      </p>

      <h2 className={heading}>7. Fotografías y videos</h2>
      <p className={paragraph}>
        Durante el encuentro puede haber registro fotográfico o audiovisual. La inscripción no
        supone una autorización general para utilizar tu imagen con fines comerciales o
        publicitarios. Cualquier uso que exija autorización específica deberá informarse y recabarse
        por separado, incluyendo las garantías reforzadas aplicables a menores.
      </p>

      <h2 className={heading}>8. Datos personales y contacto</h2>
      <p className={paragraph}>
        La información suministrada se tratará para gestionar la inscripción, asistencia, seguridad
        operativa y comunicaciones necesarias sobre el evento, en los términos de la{' '}
        <Link href="/legal/privacidad" className="font-semibold underline underline-offset-4">
          política de datos personales
        </Link>
        . La identificación definitiva del responsable del evento y su canal formal de atención
        deben validarse antes de aprobar esta versión.
      </p>

      <p className="mt-10 border-t border-neo-border pt-5 text-xs text-neo-text-secondary">
        Borrador de trabajo · 8 de octubre de 2026 · Pendiente de revisión jurídica y aprobación de
        la organización.
      </p>
    </article>
  )
}
