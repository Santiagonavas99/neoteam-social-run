export const mapsUrl = (place: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`

// Keyless embed; if Google ever drops it, only the iframe breaks and mapsUrl still works.
export const mapsEmbedUrl = (place: string) =>
  `https://www.google.com/maps?q=${encodeURIComponent(place)}&hl=es&output=embed`
