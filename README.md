# ForgeBox

**ForgeBox** es un laboratorio local para experimentar con la resiliencia de servicios HTTP. Permite simular latencia y errores HTTP, ejecutar varias iteraciones y observar métricas desde un dashboard web.

> **Estado:** en desarrollo. El proyecto está pensado para ejecutarse localmente, sin Docker ni servicios externos obligatorios.

## Características actuales

- Dashboard web construido con React, Vite y TypeScript.
- API construida con Node.js, TypeScript y Fastify.
- Indicador de salud de la API con comprobación automática periódica.
- Experimentos de latencia configurable.
- Simulación de errores HTTP, por ejemplo respuestas `503`.
- Configuración del número de iteraciones por experimento.
- Resumen de resultados y tabla de iteraciones.
- Generación y descarga de reportes JSON.
- Historial de resultados en la sesión actual del frontend.

## Tecnologías

- **Frontend:** React, Vite, TypeScript y Tailwind CSS.
- **Backend:** Node.js, Fastify y TypeScript.
- **Validación:** Zod.
- **Gestión del monorepo:** pnpm.
- **Persistencia:** pendiente de implementar. La siguiente etapa propuesta es SQLite local.

## Estructura del repositorio

```text
forgebox/
├── apps/
│   └── web/                 # Dashboard web
├── packages/
│   └── api/                 # API y motor de experimentos
├── docs/
│   └── examples/            # Ejemplos y documentación (por completar)
├── tests/
│   ├── e2e/                 # Pruebas end-to-end (por implementar)
│   └── integration/         # Pruebas de integración (por implementar)
├── package.json
├── pnpm-lock.yaml
└── pnpm-workspace.yaml
```

## Requisitos

- Node.js compatible con las dependencias del proyecto.
- pnpm.
- Git, si vas a clonar el repositorio.

Comprueba las versiones instaladas:

```powershell
node --version
pnpm --version
```

## Instalación

Desde la raíz del repositorio:

```powershell
pnpm install
```

## Ejecución en desarrollo

Abre dos terminales desde la raíz del repositorio.

**Terminal 1 — API**

```powershell
pnpm --filter @forgebox/api dev
```

La API está configurada para escuchar en `http://127.0.0.1:4310`.

**Terminal 2 — frontend**

```powershell
pnpm --filter web dev
```

Vite normalmente muestra en la terminal la dirección local del frontend, por defecto `http://localhost:5173`.

> Si alguno de los comandos `dev` no está definido en el `package.json` del paquete correspondiente, revisa sus scripts y añade el script de desarrollo que falte.

## API disponible

| Método | Ruta | Propósito |
|---|---|---|
| `GET` | `/health` | Comprueba el estado de la API. |
| `POST` | `/experiments/run` | Ejecuta un experimento y devuelve sus resultados. |
| `POST` | `/experiments/report` | Ejecuta una prueba y devuelve un reporte JSON descargable. |

### Modos de experimento

- **`latency`**: añade una demora configurable a las respuestas.
- **`http_error`**: simula respuestas HTTP de error, por ejemplo `503`.

La configuración actual permite ajustar la demora entre `0` y `5000` ms, el código HTTP entre `400` y `599` para el modo de error, y entre `1` y `20` iteraciones.

## Verificación

Para comprobar que el frontend compila:

```powershell
pnpm --filter web build
```

Para verificar la API, ejecuta el script de comprobación de tipos definido en el `package.json` de `@forgebox/api`, si está disponible.

## Próximos pasos

Estas tareas son la hoja de ruta propuesta; **no se consideran implementadas todavía**.

- [ ] **Persistencia local con SQLite:** guardar experimentos, configuración, iteraciones, métricas y fechas para que los datos sobrevivan al reinicio de la API.
- [ ] **Historial persistente:** consultar ejecuciones anteriores desde el dashboard.
- [ ] **Reportes fieles a la ejecución original:** descargar el resultado ya guardado sin volver a ejecutar el experimento.
- [ ] **Pruebas de integración:** verificar las rutas de la API, validaciones y resultados.
- [ ] **Pruebas end-to-end:** validar los flujos principales desde la interfaz.
- [ ] **Ejemplos en `docs/examples/`:** incluir solicitudes HTTP y reportes ficticios.
- [ ] **Documentación de arquitectura:** explicar los componentes y el flujo de una ejecución.
- [ ] **Preparación para contribuciones:** documentar convenciones, comandos y proceso de contribución.

## Datos locales y seguridad

- No subas archivos `.env` con secretos ni bases de datos locales con información privada.
- Mantén los archivos de datos locales fuera del control de versiones mediante `.gitignore`.
- Usa únicamente servicios y destinos de prueba autorizados; ForgeBox está pensado para pruebas locales controladas.
- Si se añade SQLite, el archivo de base de datos local no debe versionarse. El código de inicialización y cualquier migración sí pueden incluirse en el repositorio.

## Contribuir

Las contribuciones y sugerencias son bienvenidas. Antes de abrir un cambio, describe qué problema resuelve y cómo se puede verificar. Las pruebas automatizadas se incorporarán como parte de la hoja de ruta.

## Licencia

Pendiente de definir. Añade un archivo `LICENSE` cuando decidas bajo qué licencia publicar el proyecto.
