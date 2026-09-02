# 00 · Fuente de verdad

## Identidad

- Proyecto: **Hupi.Pet Mobile Functional Prototype**
- Branch auditada: `handoff-edwin-v1`
- Commit origen de referencia: `a7b823a` (`pre-api-ui`)
- Área auditada: `apps/mobile`
- Entry point: `expo-router/entry` (declarado en `apps/mobile/package.json`)
- Fecha de auditoría: 2026-08-23

## Propósito

Esta aplicación es una especificación funcional, visual y de experiencia de Hupi.Pet. Edwin reconstruirá la solución desde cero técnicamente.

Por tanto:

- la UX navegable es fuente de verdad;
- los flujos son fuente de verdad;
- formularios y opciones son fuente de verdad;
- reglas visibles son fuente de verdad;
- estados y transiciones son fuente de verdad;
- el código es una referencia funcional;
- la arquitectura técnica actual **no** tiene que ser replicada.

Código no alcanzable desde los flujos documentados no forma parte de la especificación.

## Cómo se determinó la aplicación real

La traza comenzó en `expo-router/entry` y continuó por `src/app/_layout.tsx`, `StartupProvider`, `StartupRouteGuard`, los layouts de auth/onboarding/tabs/proveedor, los destinos de `router.push`, `router.replace`, enlaces y acciones de UI. Desde cada superficie se siguieron imports hacia componentes, hooks, dominio, repositorios locales, mocks, i18n y assets.

La app usa Expo Router con rutas por archivo. La mera posibilidad de escribir manualmente una URL no convierte una ruta en parte de la UX: para esta auditoría una pantalla es real cuando el flujo de UI o el guard de inicio la alcanza. También se cuentan como pantallas las vistas internas que reemplazan el cuerpo completo de una ruta y tienen navegación propia (por ejemplo, las secciones de Paseos proveedor y las vistas de Soporte). Los modales breves se documentan dentro de su pantalla padre.

No se pudo abrir un navegador integrado en el entorno de auditoría porque no había una instancia disponible. La cobertura se compensó con traza estática de rutas/imports, lectura completa de las implementaciones visibles y ejecución de typecheck/tests. Esta limitación no cambia la clasificación, pero Edwin debe hacer una pasada visual final en iOS y Android.

## Arranque real

```text
expo-router/entry
  -> src/app/_layout.tsx
     -> fuentes Fredoka + i18n + apariencia
     -> repositorios locales de cuenta/proveedor/QA/paseos
     -> StartupProvider
     -> StartupRouteGuard
        onboarding incompleto -> /welcome
        sin sesión            -> /login
        celular pendiente     -> /verify-sms
        perfil pendiente      -> /onboarding-profile
        cuenta completa       -> /home
```

`src/app/index.tsx` es un puente pasivo mientras el guard resuelve el destino; no es una pantalla funcional independiente.

## Límites funcionales observados

- Es una sola app con modo Cliente y modo Proveedor.
- Los cinco tabs reales son Home, Reservas, Marketplace, Perfil y Chat/Soporte.
- En esta versión solo `walk` y `marketplace` están habilitados. Niñera, Hospedaje, Guardería, Grooming y Adiestramiento existen en definiciones o ramas de componentes, pero no son flujos navegables del MVP actual.
- No hay backend: cuenta, proveedor, bookings, pedidos, chat y QA usan estado local/mocks; AsyncStorage persiste las áreas indicadas en esta documentación.
- Teléfono: obligatorio y validado con OTP mock `123456`.
- Correo: obligatorio y validado por formato/acción local; no hay código de verificación de correo para registro. La recuperación por correo sí reutiliza la pantalla OTP como simulación.
- La verificación general del proveedor y la aprobación de cada servicio son estados distintos.
- Las herramientas QA solo existen cuando `__DEV__` es verdadero.

## Convenciones del handoff

- `REQUIRED`: necesario para una función o superficie visible alcanzable.
- `DEV_QA`: herramienta, perfil o escenario protegido por `__DEV__` que debe conservarse como demostración.
- `UNUSED`: sin entrada desde la UI y sin dependencia de un flujo alcanzable.
- `UNCERTAIN`: no puede decidirse de forma segura sin revisión humana.
- `mock/local`: comportamiento funcional de referencia, no contrato de persistencia futuro.
- Los IDs de pantalla de `01-screen-inventory.md` son estables y se reutilizan en todos los documentos.

## Qué no debe copiarse como decisión arquitectónica

- módulos grandes de mocks;
- stores mutables en memoria;
- rutas que contienen varias vistas internas;
- duplicación de modelos de presentación;
- strings/fechas de demostración;
- claves actuales de AsyncStorage;
- composición actual de repositorios locales.

Sí deben conservarse los resultados observables: contenido, opciones, condiciones, secuencia, permisos, estados y transiciones.
