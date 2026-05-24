# Snapshots HTTP Pre-migración

Este directorio contiene snapshots de las respuestas HTTP de los principales endpoints de la API (en formato JSON).

## Propósito

Servir de **red de seguridad** durante la migración de la base de datos de MongoDB a SQLite (Fase 3).
Antes de migrar un módulo, podemos ver exactamente qué devolvía la API. Tras la migración, la respuesta del nuevo endpoint basado en SQLite DEBE ser idénticamente igual (estructuralmente) al snapshot, garantizando que el cliente no se rompa por diferencias no intencionadas.

## Generación

Los snapshots fueron generados usando el script:
`packages/api/scripts/capture-snapshots.ts`

**Fecha de captura:** Mayo 2026
**Usuario de prueba:** `testuser`

## Notas
- Los datos son sintéticos/de prueba o provienen del entorno de desarrollo.
- Si un endpoint requiere un identificador (como detalle de ID), se ha evitado o se ha capturado con valores representativos si estaban disponibles.
- Para volver a generarlos, asegúrate de tener la API corriendo y ejecuta el script con `npx tsx scripts/capture-snapshots.ts`.
