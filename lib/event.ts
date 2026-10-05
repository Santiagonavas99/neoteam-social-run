export const eventConfig = {
  name: "Social Run",
  organizer: "NeoTeam",
  reason: "Aniversario NeoTeam",
  dateLabel: "18 de octubre de 2026",
  dateShort: "18 OCT · 2026",
  location: "Punto de encuentro por confirmar",
  route: "Ruta 5K · Parque del Ingenio y sus alrededores",
  eyebrow: "ANIVERSARIO NEOTEAM",
  headline: "CORREMOS PARA CELEBRAR LO QUE HEMOS CONSTRUIDO JUNTOS.",
  description:
    "Un encuentro para correr, conectar con otros crews, descubrir marcas aliadas y celebrar un nuevo año de NeoTeam como comunidad.",
  registrationOpen: true,
} as const;

export const agenda = [
  {
    time: "7:30",
    meridiem: "a. m.",
    title: "Llegada y bienvenida",
    details: [
      "Recibimiento de los participantes.",
      "Espacio para compartir, fotos y encuentro entre la comunidad.",
    ],
  },
  {
    time: "7:40",
    meridiem: "a. m.",
    title: "Inicio de actividades",
    details: [
      "Bienvenida oficial.",
      "Palabras de agradecimiento por la asistencia.",
      "Explicación de la ruta y recomendaciones.",
      "Foto grupal.",
    ],
  },
  {
    time: "7:50",
    meridiem: "a. m.",
    title: "Ruta 5K",
    details: [
      "Salida conjunta de los participantes por el Parque del Ingenio y sus alrededores.",
    ],
  },
  {
    time: "8:30",
    meridiem: "a. m. aprox.",
    title: "Regreso",
    details: [
      "Llegada de los participantes al punto de encuentro.",
    ],
  },
  {
    time: "8:35",
    meridiem: "a. m.",
    title: "Estiramiento grupal",
    details: [
      "Espacio de recuperación y movilidad después de la ruta.",
    ],
  },
  {
    time: "8:45",
    meridiem: "a. m.",
    title: "Celebración y rifas",
    details: [
      "Palabras de agradecimiento a nuestra comunidad.",
      "Presentación y reconocimiento de las marcas aliadas.",
      "Rifas y entrega de premios aportados por nuestros aliados.",
      "Fotografías y contenido con las marcas participantes.",
    ],
  },
  {
    time: "10:30",
    meridiem: "a. m.",
    title: "Cierre y fotografías",
    details: [
      "Foto oficial del aniversario.",
      "Fotografías con las marcas aliadas.",
      "Espacio para compartir y cerrar la celebración.",
    ],
  },
] as const;
