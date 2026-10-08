import type { Metadata } from 'next'
import Link from 'next/link'
import { NEOTEAM_LEADERS } from '@/features/legal/leaders'

export const metadata: Metadata = {
  title: 'Tratamiento de datos personales | Social Run NeoTeam',
  description:
    'Información para participantes sobre el tratamiento de datos personales en Social Run NeoTeam.',
}

const heading = 'mt-9 mb-3 text-xl font-bold tracking-[-0.035em]'
const paragraph = 'my-3 text-[15px] leading-7 text-neo-text-secondary'
const items = 'ml-5 list-disc space-y-2 text-[15px] leading-7 text-neo-text-secondary'

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-[760px]">
      <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-neo-accent-text">
        Social Run · Protección de datos
      </p>
      <h1 className="mb-5 mt-3 text-[clamp(36px,6vw,64px)] font-bold uppercase leading-none tracking-[-0.06em]">
        Tratamiento de datos personales
      </h1>
      <p className={paragraph}>
        Esta política explica cómo NeoTeam recopila, utiliza y protege los datos personales de
        quienes participan en Social Run, conforme a la Ley 1581 de 2012, el Decreto 1074 de 2015 y
        las demás disposiciones aplicables en Colombia.
      </p>
      <div className="mt-6 border-l-4 border-neo-accent bg-neo-surface p-5 text-sm leading-6">
        Tu registro utiliza tus datos para gestionar tu participación en el Social Run. Recibir
        noticias sobre futuros eventos es opcional; no es requisito para inscribirte.
      </div>

      <h2 className={heading}>1. Organización y gestión de los datos</h2>
      <p className={paragraph}>
        Social Run es una actividad de NeoTeam. Su equipo de liderazgo está integrado por:
      </p>
      <ul className={items}>
        {NEOTEAM_LEADERS.map((leader) => (
          <li key={leader}>{leader}</li>
        ))}
      </ul>
      <p className={paragraph}>
        El equipo organizador gestiona los datos de inscripción y participación en el marco de las
        finalidades descritas en esta política. La información facilitada para el evento no autoriza
        su uso para finalidades distintas de las comunicadas al titular.
      </p>

      <h2 className={heading}>2. Datos solicitados</h2>
      <p className={paragraph}>El formulario de inscripción puede recoger:</p>
      <ul className={items}>
        <li>
          Nombre, tipo y número de documento, fecha de nacimiento y categoría de género solicitada
          para el registro.
        </li>
        <li>Correo electrónico, teléfono y running crew, si corresponde.</li>
        <li>Nombre y teléfono de un contacto de emergencia.</li>
        <li>
          Registro de aceptación de condiciones, autorización de tratamiento y elección
          independiente sobre novedades.
        </li>
        <li>Código de inscripción, pase QR y datos operativos de asistencia o check-in.</li>
      </ul>

      <h2 className={heading}>3. Finalidades</h2>
      <ul className={items}>
        <li>
          Gestionar inscripciones, validar pases, controlar aforo y organizar la participación.
        </li>
        <li>Enviar confirmaciones, información logística y avisos relevantes del evento.</li>
        <li>
          Contactar a la persona indicada para emergencias, si se presenta una situación que lo
          requiera.
        </li>
        <li>
          Realizar las dinámicas y rifas anunciadas con las condiciones que se informen a
          participantes.
        </li>
        <li>
          Elaborar estadísticas internas, preferiblemente agregadas, para evaluar la actividad.
        </li>
        <li>
          Enviar comunicaciones sobre futuros eventos de NeoTeam solamente si autorizaste esa
          finalidad opcional.
        </li>
      </ul>
      <p className={paragraph}>
        La inscripción no habilita por sí sola la publicación comercial o promocional de imágenes
        identificables. Si se requiere ese uso, se solicitará autorización específica.
      </p>

      <h2 className={heading}>4. Fundamento y autorizaciones</h2>
      <p className={paragraph}>
        La organización debe informar al titular las finalidades y obtener una autorización previa,
        expresa e informada cuando sea exigible. La autorización para novedades comerciales es
        independiente y opcional. No otorgarla no impide participar. Los datos sensibles, si
        llegaran a solicitarse, requieren una justificación, información y autorizaciones
        específicas; el formulario no solicita historia clínica.
      </p>

      <h2 className={heading}>5. Contactos de emergencia y menores</h2>
      <p className={paragraph}>
        Los datos de un contacto de emergencia se usarán solo para esa finalidad y no para campañas
        de promoción. Quien lo suministra debe informar a esa persona. Cuando participen menores de
        edad, será necesaria la autorización de su representante legal y se respetarán el interés
        superior del menor y sus derechos. El formulario general no sustituye esa autorización.
      </p>

      <h2 className={heading}>6. Acceso, proveedores y seguridad</h2>
      <p className={paragraph}>
        Los datos solo deben estar disponibles para las personas autorizadas que gestionen la
        actividad y para los proveedores tecnológicos estrictamente necesarios, sujetos a controles
        y obligaciones de protección de datos aplicables. Las transferencias o transmisiones
        internacionales, cuando correspondan, deberán verificarse conforme a la legislación
        colombiana y los servicios utilizados. No se publicarán listados de inscritos con documentos
        ni datos de contacto.
      </p>

      <h2 className={heading}>7. Conservación</h2>
      <p className={paragraph}>
        Los datos se conservarán durante el tiempo necesario para cumplir las finalidades informadas
        y los plazos que impongan obligaciones legales o la atención de reclamaciones. Una vez cese
        la necesidad legítima, deberán suprimirse o anonimizarse de forma segura, cuando
        corresponda.
      </p>

      <h2 className={heading}>8. Derechos del titular</h2>
      <p className={paragraph}>
        Puedes solicitar conocer, actualizar, rectificar y acceder a tus datos, pedir prueba de la
        autorización, conocer su uso, presentar consultas o reclamos, solicitar su supresión y
        revocar la autorización cuando legalmente proceda. También puedes acudir a la
        Superintendencia de Industria y Comercio, conforme a los procedimientos aplicables.
      </p>

      <h2 className={heading}>9. Canal de atención</h2>
      <p className={paragraph}>
        Para solicitar información sobre el tratamiento de tus datos o ejercer tus derechos, puedes
        comunicarte con el equipo organizador mediante los canales oficiales de NeoTeam, incluido su
        perfil de{' '}
        <a
          href="https://www.instagram.com/neoteam_cali/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline underline-offset-4"
        >
          Instagram
        </a>
        . No compartas tu número de documento ni información sensible en comentarios públicos:
        solicita un canal privado para la atención de tu caso.
      </p>
      <p className={paragraph}>
        Consulta también las{' '}
        <Link href="/legal/terminos" className="font-semibold underline underline-offset-4">
          condiciones de participación
        </Link>
        .
      </p>
      <p className="mt-10 border-t border-neo-border pt-5 text-xs text-neo-text-secondary">
        Última actualización: 8 de octubre de 2026.
      </p>
    </article>
  )
}
