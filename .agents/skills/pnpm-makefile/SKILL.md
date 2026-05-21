---
name: Use PNPM and Makefile
description: Rule to enforce using PNPM and the Makefile for all build, start, and lint processes, rather than npm. Use this skill whenever working within the workspace, running scripts or managing dependencies.
---

# Use PNPM and Makefile

Este proyecto es un monorepo que utiliza **`pnpm`** como gestor de paquetes. **NUNCA** debes utilizar `npm` o `yarn` para instalar dependencias o ejecutar scripts, ya que esto podría causar problemas con el `pnpm-lock.yaml` o los contextos del espacio de trabajo (workspace).

## Reglas Principales:

1. **Usa `pnpm` en lugar de `npm`:**
   - Para instalar: `pnpm install`
   - Para añadir al workspace: `pnpm add <pkg> --filter @soker90/finper-<paquete>`
   
2. **Usa el `Makefile` de la raíz:**
   El proyecto dispone de un `Makefile` en la raíz con comandos predefinidos para interactuar con los diferentes paquetes. **Utiliza comandos de `make` siempre que sea posible.**
   
   Comandos principales disponibles:
   - `make install` -> Instala todas las dependencias
   - `make build-models` -> Construye el paquete de modelos
   - `make build-api` -> Construye el paquete del api
   - `make test-models` -> Ejecuta los tests de los modelos
   - `make test-api` -> Ejecuta los tests del api
   - `make start-api` -> Arranca el servidor local
   
   *Nota: Revisa el Makefile de la raíz si necesitas un comando específico, como el de linting o despliegue en local.*

3. **Restricción de Versión de Node:**
   Si a pesar de todo `pnpm` falla por la versión del motor de Node.js, confía en el fichero `.npmrc` (donde `engine-strict=false`) para bypass del chequeo temporalmente mientras ejecutas tus comandos en el shell.
