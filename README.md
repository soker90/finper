# Finper

Finper es una herramienta para la gestión de las finanzas personales. Lleva el control de tus cuentas bancarias, movimientos, gastos, ingresos, deudas, etc.

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)
[![codecov](https://codecov.io/gh/soker90/finper/branch/master/graph/badge.svg?token=gWKDyCALuU)](https://codecov.io/gh/soker90/finper)

## Categorías

- Movimientos categorizados
- Presupuestos mensuales
- Vista anual de las finanzas
- Control de deudas contraidas y pendientes de cobrar
- Balance de todas las cuentas bancarias o en metálico
- Control de préstamos (En progreso)

## Demo

TODO

## Variables de entorno

Para arrancar el proyecto, necesitaras añadir las siguientes variables a tu archivo /packages/api/.env

`SALT_ROUNDS`

`JWT_SECRET`

`MONGODB_USER` - Optional

`MONGODB_PASS` - Optional

`MONGODB` - Optional

## Arrancar en local

Es necesario tener previamente instalado node 16 y mongodb arrancado.

Clona el repositorio

```bash
  git clone https://github.com/soker90/finper.git
```

Ve al directorio del proyecto

```bash
  cd finper
```

Instala las dependecias

```bash
  make install
```

### Arrancar API
```bash
  # make build-models - Necesario para utilizar los modelos locales
  make start-api
```

### Arrancar Cliente
```bash
  make start-client
```

Puedes ver el resto de comandos en el menú de ayuda: 
```bash
make
```

## Licencia

[GPLv3 o Superior](https://github.com/soker90/finper/blob/master/LICENSE)

