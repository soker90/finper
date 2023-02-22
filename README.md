# Finper

Finper es una herramienta para la gestión de las finanzas personales. Lleva el control de tus cuentas bancarias, movimientos, gastos, ingresos, deudas, etc.

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)
[![codecov](https://codecov.io/gh/soker90/finper/branch/master/graph/badge.svg?token=gWKDyCALuU)](https://codecov.io/gh/soker90/finper)

## Características

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

## Capturas de pantalla

![imagen](https://user-images.githubusercontent.com/8345188/220207754-a890756d-243a-4e10-815a-df1a597512fc.png)

![imagen](https://user-images.githubusercontent.com/8345188/220208160-9d14644b-dd7c-4875-9edf-6ec7f4604b52.png)

![imagen](https://user-images.githubusercontent.com/8345188/220720830-ccc67462-d724-49a6-b33e-6c9602eb47cf.png)

![imagen](https://user-images.githubusercontent.com/8345188/220721312-7f5fa22d-f607-49bd-85d4-3c4abf288eae.png)

![imagen](https://user-images.githubusercontent.com/8345188/220721599-00ec2cdd-e832-4890-a2e8-e4d781c35a8c.png)

![imagen](https://user-images.githubusercontent.com/8345188/220208380-0d1ff108-1c1d-4bc0-9784-bb114b1add81.png)

![220721852-6ba9a65c-3b76-40ad-b3a0-5457cd28a6f7](https://user-images.githubusercontent.com/8345188/220723111-9a8f4dd8-07bc-4090-a738-fcc8317c1535.png)

![220721972-da101b9f-aa5a-4c74-9a7b-d34f096b3393](https://user-images.githubusercontent.com/8345188/220722791-bea8c0cc-24ff-4a5f-8bff-b2a382bc9bcc.png)



## Licencia

[GPLv3 o Superior](https://github.com/soker90/finper/blob/master/LICENSE)

