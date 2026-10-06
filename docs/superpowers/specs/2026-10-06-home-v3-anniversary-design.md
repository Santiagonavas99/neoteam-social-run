# Home V3 — Anniversary editorial landing design

Date: 2026-10-06  
Branch: `feat/home-v3-anniversary`  
Depends on: `feat/cyan-accent-refresh`

## Goal

Create a separate V3 of the NeoTeam Social Run landing page for the anniversary event on 18 October 2026. V3 must feel like a new art direction, not a cosmetic variant of V2.

The page should borrow the structural energy of the supplied endurance/triathlon reference — large editorial typography, split image/copy blocks, high-contrast color fields and an oversized typographic footer — while keeping NeoTeam's own identity, content and new cyan palette.

V2 remains untouched and available at `/`. V3 is exposed at `/v3` for comparison.

## Audience and job

Audience: runners, crews, invited brands and people considering joining the anniversary Social Run.

Single job: make the anniversary feel worth attending, then move the visitor toward registration or recovering their pass.

This is not a training-program page and must not use coaching/program language.

## Design direction

### Color

Use the approved cyan + cyan-tinted neutral system from the palette branch:
- brand cyan: `#03f8f6`;
- deep cyan for strong surfaces;
- cool neutral 50–950 ramp;
- black/near-black for dramatic editorial blocks.

The page alternates calm neutral surfaces with a small number of large black/cyan fields. Do not scatter the bright cyan everywhere.

### Type

Keep Host Grotesk. The visual shift comes from scale, cropping, alignment and rhythm rather than introducing another typeface.

Headlines are short, uppercase and intentionally oversized. Supporting copy stays restrained and readable.

### Layout concept

Desktop:

```
[ HERO / anniversary thesis, centered editorial statement         ]
[ date · 5K · location · register · pass                           ]

[ MANIFESTO: large copy + compact event facts                      ]

[ AGENDA: condensed sequence / rhythm of the morning               ]

[ MEDIA 01            ][ DARK COPY                                 ]
[ community moment    ][ CORREMOS JUNTOS.                          ]
[                     ][ CELEBRAMOS JUNTOS.                        ]

[ COMMUNITY / CREWS / BRANDS / PARTNERS                            ]

[ CYAN COPY           ][ MEDIA 02                                  ]
[ LA META ES SOLO     ][ post-run celebration / activations        ]
[ EL COMIENZO.        ][                                            ]

[ FINAL CTA / 18.10.26 / registration                              ]

[ FOOTER NAV + event details                                       ]
[ CELEBREMOS — oversized wordmark-like typographic ending          ]
```

Mobile at 390 px:
- all split blocks stack;
- media comes before copy in the first split and after copy in the second;
- the oversized footer word crops intentionally but never creates horizontal scrolling;
- primary CTAs remain at least 44 px tall.

## Signature

The signature element is the final `CELEBREMOS` footer word, set at oversized scale across the viewport. It turns the anniversary concept into the last visual memory of the page and echoes the reference without copying its brand treatment.

## Content architecture

### 1. Hero — anniversary thesis

Eyebrow:
`ANIVERSARIO NEOTEAM · 18 OCT 2026`

Primary statement:
`CORRER NOS TRAJO HASTA AQUÍ. CELEBREMOS TODO LO QUE SIGUE.`

Accent only the key word/phrase, not the entire headline.

Support:
`5K SOCIAL · PARQUE DEL INGENIO · 07:30 A. M.`

Actions:
- `Quiero participar` → `/registro`
- `Mi pase` → `/pase`
- `Ver agenda` → agenda anchor

Reuse the real event countdown.

### 2. Manifesto

Headline:
`NO VENIMOS A COMPETIR. VENIMOS A CELEBRAR LO QUE CONSTRUIMOS CORRIENDO JUNTOS.`

Support uses the existing event description and compact facts for date, meeting time and 5K distance.

### 3. Agenda

Reuse the real `agenda` data, but present it in a tighter editorial sequence instead of V2's card mosaic. The route and anniversary celebration remain visually emphasized.

### 4. Editorial split — together

Eyebrow:
`ANIVERSARIO NEOTEAM`

Headline:
`CORREMOS JUNTOS. CELEBRAMOS JUNTOS.`

Body:
`Una mañana para encontrarnos, compartir kilómetros y celebrar todo lo que ha crecido alrededor de NeoTeam. Más que una salida, este aniversario reúne comunidad, energía y el placer de correr acompañados.`

CTA:
`Ver la agenda`

Media treatment:
- original runner/community photography when final assets are available;
- for the first implementation mockup, use a deliberately designed media placeholder/atmospheric panel rather than hotlinking third-party photography;
- the media slot must be easy to replace with a local image later.

### 5. Community

Reuse live Supabase data for crews, organizers, sponsors and invited partners. Keep carousels/data behavior intact, but reframe the section as part of the anniversary story rather than a generic sponsor wall.

Heading:
`ESTO LO CORREMOS ENTRE TODOS.`

### 6. Editorial split — after the route

Eyebrow:
`DESPUÉS DE LA RUTA`

Headline:
`LA META ES SOLO EL COMIENZO.`

Body:
`Después del recorrido seguimos celebrando: marcas invitadas, crews, activaciones, dinámicas, premios y rifas que convierten el aniversario en una experiencia para compartir de principio a fin.`

CTA:
`Quiero estar ahí`

Supporting line:
`ACTIVACIONES · DINÁMICAS · PREMIOS · RIFAS`

The copy block uses the bright cyan as a large surface; text on it is near-black.

### 7. Final CTA

Headline:
`ESTE 18 DE OCTUBRE CORREMOS POR TODO LO QUE NOS UNE.`

Display date:
`18.10.26`

CTA:
`Quiero estar ahí`

### 8. Footer

Top area:
- El plan
- Agenda
- Crews
- Marcas
- Dinámicas
- Mi pase
- event/location line
- social/contact links already available in the project, if any

Bottom:
`CELEBREMOS`

Small closing line:
`NEOTEAM · SOCIAL RUN 2026`

## Photography / media constraint

No third-party image is copied from the provided reference. V3 may use neutral media placeholders in the initial mockup. Final photography can be supplied or generated later and should be local assets before V3 replaces the production home.

## Reuse

Reuse:
- `SiteHeader`
- `EventCountdown`
- `eventConfig`
- `agenda`
- `getHomeCommunity`
- `getHomeLogoCarouselItems`
- carousel behavior and live Supabase data

Do not duplicate backend/data logic.

## Accessibility

- semantic headings remain ordered;
- all interactive controls have visible focus;
- bright cyan is never used as small text on a light surface;
- media placeholders are decorative unless they communicate unique content;
- status/content meaning never relies only on color;
- reduced-motion rules continue to apply.

## Mobile

390 px is the primary design target. The page must be visually complete, readable and usable without horizontal scrolling. Split sections become stacked compositions, but the order alternates so the V3 still feels editorial rather than repetitive.

## Out of scope

- changing `/` from V2 to V3;
- database/schema/admin changes;
- registration, QR, Wallet, PIN or Dynamics behavior;
- adding a CMS editor for the new editorial copy;
- final photography selection;
- new dependencies.
