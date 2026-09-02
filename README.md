# HUPI.PET

## Functional Mobile Prototype

Este paquete es la especificación funcional, visual y de experiencia de la aplicación móvil Hupi.Pet. Define:

- experiencia visual y UX;
- navegación y pantallas;
- formularios, campos y opciones;
- flujos de cliente y proveedor;
- reglas visibles;
- estados y transiciones;
- comportamiento esperado.

No define obligatoriamente:

- la arquitectura técnica final;
- el backend final;
- el esquema final de base de datos;
- endpoints finales;
- infraestructura, despliegue o estrategia de persistencia final.

Edwin reconstruirá la solución técnicamente desde cero. Debe conservar los resultados observables documentados, no copiar obligatoriamente la arquitectura, repositorios locales, mocks o claves de persistencia actuales.

## Contenido del paquete

```text
handoff-package/
├── README.md
├── backend/                   # API en Rust (Axum + SQLx + PostgreSQL)
├── mobile/                    # prototipo Expo autocontenido
├── docs/
│   ├── functional/            # especificación funcional auditada
│   └── diagrams/              # mapa maestro editable + SVG
└── manifest/                  # contenido y versión de origen
```

## Instalar y levantar

Requisitos: una versión de Node.js compatible con Expo SDK 54, npm y Expo Go o un simulador/emulador.

Desde `handoff-package/mobile`:

```bash
npm ci
npm start -- -c
```

`npm ci` crea una instalación limpia desde `package-lock.json`. `npm start -- -c` inicia Metro limpiando su caché.

> Usa `npm start`, no `npx expo start`: `npx` intenta descargar una versión de Expo distinta a la del proyecto.

Con Expo activo:

- escanear el QR con Expo Go cuando el entorno sea compatible;
- pulsar `a` para Android;
- pulsar `i` para iOS;
- pulsar `w` para web.

No se necesita backend para navegar el prototipo: sin `EXPO_PUBLIC_API_URL` la app usa mocks y estado local.

## Backend (Rust)

API en Axum + SQLx sobre PostgreSQL, en `backend/`. Arquitectura simple en tres capas: `routes` → `domain` → SQLx.

Requisitos: Rust estable y un PostgreSQL accesible.

```bash
cd backend
cp .env.example .env      # ajustar DATABASE_URL y JWT_SECRET
cargo run
```

Al arrancar aplica las migraciones de `backend/migrations/` y escucha en `http://127.0.0.1:8787`.

### Datos demo

```bash
psql "$DATABASE_URL" -f backend/seeds/demo_data.sql
```

Replica los identificadores de los mocks (`QA-WALK-001`, `Andrés & Luna`, `Milo`, `HUPI-MK-2048`…), así que la app se ve igual con backend o sin él. Es idempotente: se puede relanzar sin duplicar.

Las fechas de las reservas se anclan al día de ejecución, de modo que siempre hay un paseo próximo con el que probar iniciar, finalizar y cancelar.

### Cuentas de prueba

En desarrollo estos números entran con el código `123456` sin necesidad de SMS:

| Teléfono | Rol |
|---|---|
| `+593 99 123 4567` | Valentina Paredes (cliente) |
| `+593 98 765 4321` | Andrés & Luna (proveedor) |
| `+593 98 222 3344` | Sofía M. (proveedor) |

### Cobertura

Todas las áreas del mapa de capacidades tienen endpoints implementados: cuenta, direcciones, mascotas, proveedores, reservas y operación del paseo, coordinación, ofertas, chat, marketplace, pedidos, verificación de proveedor, servicio Paseos, finanzas, soporte y notificaciones.

Validaciones:

```bash
cargo clippy --all-targets -- -D warnings
cargo test
```

### Conectar la app al backend

```bash
EXPO_PUBLIC_API_URL=http://localhost:8787 npm start -- -c
```

Sin esa variable, la app sigue usando el repositorio local. El selector está en `mobile/src/data/accountRepository.ts`.

## Validaciones locales

Desde `mobile/`:

```bash
npm run typecheck
npm test
node --experimental-strip-types --test tests/*.test.mjs
```

`npm test` ejecuta la suite declarada por el proyecto. El tercer comando ejecuta todos los archivos de pruebas disponibles, incluidos los que no están agregados al script compuesto.

## Herramientas QA

Ruta:

```text
Perfil
→ Ajustes / Configuraciones
→ Opciones de desarrollo
```

El bloque muestra el perfil QA activo y permite:

- Cambiar perfil de prueba.
- Probar verificación de proveedor.
- Controlar paseo de prueba.
- Reiniciar flujo de bienvenida.

Estas herramientas son **DEVELOPMENT ONLY** y dependen de `__DEV__`. No deben aparecer en producción. El toggle “Modo prueba” es una configuración distinta.

### Perfiles QA

1. **Cliente nuevo:** cuenta nueva, onboarding cliente pendiente y sin proveedor.
2. **Cliente activo:** cuenta completa y sin proveedor.
3. **Cliente + proveedor pendiente:** cliente completo, proveedor en progreso y herramientas restringidas.
4. **Cliente + proveedor verificado:** cliente y proveedor aprobados, Paseos aprobado y cambio de modo habilitado.
5. **Proveedor nuevo:** datos básicos terminados; continúa la verificación.
6. **Proveedor incompleto:** algunas secciones completas, progreso parcial y operación bloqueada.
7. **Proveedor verificado:** proveedor general y Paseos aprobados.
8. **Proveedor verificado + Paseos pendiente:** proveedor aprobado, pero Paseos en `pending_approval`.

Para cambiar: abrir **Cambiar perfil de prueba**, seleccionar una card y pulsar **Aplicar**. El escenario queda persistido localmente y la app navega al destino correspondiente.

## Prueba de proveedor

### A. Proveedor nuevo

1. Aplicar el perfil **Proveedor nuevo**.
2. Continuar el onboarding del proveedor.
3. Revisar la selección Natural/Jurídica.
4. Recorrer los pasos de cuenta, celular, correo, identidad/empresa, dirección, contacto, banco y revisión.
5. Usar **Continuar más tarde** para guardar el punto pendiente y volver después.
6. En Opciones de desarrollo → Probar verificación, usar **Continuar desde paso pendiente** o abrir los pasos 1–9.

“Omitir por ahora” pertenece al onboarding informativo inicial; la verificación documental no permite omitir secciones obligatorias. El equivalente para salir y continuar después es **Continuar más tarde**.

### B. Cliente existente que pasa a proveedor

1. Aplicar **Cliente activo**.
2. Perfil → **¿Quieres trabajar con Hupi?**
3. Elegir Natural o Jurídica.
4. Reutilizar los datos existentes de la Cuenta Hupi.
5. Completar los datos y documentos faltantes.
6. Continuar más tarde o enviar a revisión cuando el progreso llegue al 100%.

No se crea una segunda cuenta: el proveedor se agrega a la misma Cuenta Hupi.

### C. Proveedor verificado

1. Aplicar **Cliente + proveedor verificado** o **Proveedor verificado**.
2. Entrar en **Modo Proveedor**.
3. Abrir **Paseos**.
4. Revisar tarifa, ficha pública, planes, disponibilidad, solicitudes, agendamientos, resumen financiero y condiciones.

Para comprobar que proveedor y servicio son aprobaciones distintas, usar **Proveedor verificado + Paseos pendiente**.

## Prueba del paseo compartido

El booking QA estable es `QA-WALK-001`. Cliente y proveedor leen la misma entidad.

1. Activar **Cliente + proveedor verificado**.
2. Entrar en Modo Proveedor.
3. Abrir Paseos.
4. Abrir Mis agendamientos.
5. Abrir `QA-WALK-001`.
6. Pulsar **Iniciar paseo**.
7. Confirmar el temporizador y `startedAt`.
8. Volver al modo Cliente asociado.
9. Abrir Reservas.
10. Abrir el mismo `QA-WALK-001`.
11. Confirmar **Paseo en curso** y el mismo temporizador.
12. Volver al proveedor.
13. Pulsar **Finalizar paseo**.
14. Volver al cliente.
15. Confirmar **Paseo completado**.

Controles alternativos: Ajustes → Opciones de desarrollo → **Controlar paseo de prueba** permite restablecer a agendado, simular en curso, simular completado o simular cancelado por proveedor.

## Leer la documentación y el mapa

Abrir primero:

- `docs/diagrams/Hupi-Master-Flow.excalidraw`: mapa editable.
- `docs/diagrams/Hupi-Master-Flow.svg`: vista portable.
- `docs/functional/00-source-of-truth.md`: límites de la especificación.
- `docs/functional/02-master-flows.md`: recorridos completos.

El Excalidraw usa IDs como `WALK-XX`, `VERIFY-XX` y `MARKET-XX`.

Cruces principales:

- IDs, rutas y pantallas: `docs/functional/01-screen-inventory.md`.
- Formularios y campos: `docs/functional/03-forms-and-fields.md`.
- Acciones y navegación: `docs/functional/04-actions-and-navigation.md`.
- Estados y transiciones: `docs/functional/05-states-and-transitions.md`.
- Capacidades requeridas del futuro backend: `docs/functional/13-backend-capability-map.md`.

## Qué continúa siendo mock/local

Autenticación, OTP, cuenta, proveedor, verificación, perfiles QA, bookings, operación del paseo, chat, ofertas, pagos, reembolsos, direcciones, mascotas, Marketplace, stock, pedidos, notificaciones, soporte y finanzas usan mocks, memoria o AsyncStorage.

El tracking es una regla obligatoria del producto, pero el prototipo actual no implementa captura GPS en vivo.

## Regla final para la reconstrucción

Conservar la UX, formularios, alternativas, reglas, permisos, estados y transiciones documentados. Rediseñar desde cero arquitectura, seguridad, persistencia, sincronización, backend e infraestructura. Las herramientas QA no son endpoints productivos y los mocks no constituyen contratos automáticos de backend.

