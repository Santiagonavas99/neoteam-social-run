# Plan aprobado — hotfix registro

Especificación: docs/superpowers/specs/2026-10-08-registro-hotfix-design.md

Rama: hotfix/registro-validaciones-crew-20261008

Aprobación solicitada por el usuario: crear directamente un hotfix con PR (2026-10-08).

1. Helpers puros para documentos, correo, fechas y teléfono: features/registration/validation.ts + validation.test.ts.
2. Endurecer validación definitiva en features/registration/schema.ts + schema.test.ts.
3. Validación y errores por paso, fecha mínima/máxima y dos caminos para la comunidad: features/registration/registration-form.tsx.
3a. Ajuste solicitado durante QA del mismo hotfix: errores en blur y corrección en vivo, teléfonos con solo números al escribir/pegar, validación del servidor contra letras; actualizar registration-form.tsx, validation.ts, schema.ts, tests y form-ui.tsx.
3b. Ajuste QA: comprobar extensión real con snapshot IANA en features/registration/iana-tlds.ts y validación de correo de validation.ts; añadir pruebas de .commmm y de extensiones largas existentes. Quitar placeholder «Solo números» de registration-form.tsx.
4. Notas de versión en CHANGELOG.md, incremento de parche package.json y PR a main.

Comprobación esperada: pnpm ci:check, flujo /registro en 390 px y desktop, CC letras, correo con dominio inválido, fecha anterior a 1900/futura/inexistente, crew independiente/listado/otro, error de servidor y conservación de datos. No desplegar antes de revisar y aprobar PR.
