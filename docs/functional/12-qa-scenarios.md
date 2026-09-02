# 12 · Escenarios QA

**DEVELOPMENT ONLY.** `isDevelopmentBundle()` depende de `typeof __DEV__ !== 'undefined' && __DEV__`. SETTINGS-02 no renderiza el bloque en producción; QA-01/02/03 redirigen a `/home` si alguien intenta abrirlas.

## Perfiles

| ID técnico | Nombre | Descripción visible | Proveedor | Paseos | Paso | Destino |
|---|---|---|---|---|---:|---|
| `new_client` | Cliente nuevo | Cuenta nueva; onboarding cliente pendiente; no proveedor | none | not_applicable | 1 | `/welcome` |
| `active_client` | Cliente activo | Cliente normal; cuenta completa; no proveedor | none | not_applicable | 1 | `/profile` |
| `client_provider_pending` | Cliente + proveedor pendiente | Cliente completo; modo proveedor visible; verificación incompleta y restringida | in_progress | blocked | 6 | `/profile` |
| `client_provider_verified` | Cliente + proveedor verificado | Cliente/proveedor aprobados; Paseos aprobado; cambio de modo | approved | approved | 9 | `/profile` |
| `new_provider` | Proveedor nuevo | Datos básicos listos; continúa pasos restantes | in_progress | not_configured | 5 | `/provider/verification` |
| `provider_incomplete` | Proveedor con verificación incompleta | Algunas secciones completas; herramientas bloqueadas | in_progress | blocked | 6 | `/provider` |
| `provider_verified` | Proveedor verificado | General y Paseos aprobados; acceso completo | approved | approved | 9 | `/provider` |
| `provider_verified_walk_pending` | Proveedor verificado + Paseos pendiente | General aprobado; Paseos pendiente | approved | pending_approval | 9 | `/provider` |

Aplicar perfil actualiza snapshots de cuenta y provider, persiste `hupi.qaProfile.v1`, conserva `currentStep/walkStatus` y reemplaza por el destino. SETTINGS-02 muestra nombre activo.

## Verificación QA

QA-02 ofrece Reiniciar, Continuar desde paso pendiente e Ir al 1–9. Cambiar paso persiste `currentStep`, actualiza `lastPendingSection` y abre `VERIFY-01?qaStep=n`. Reiniciar aplica `new_provider` y abre paso 1. La card “Vista QA” identifica paso/nombre.

Mapeo: 1 personal; 2–4 account; 5 identity; 6 address; 7 contact; 8 bank; 9 revisión sin sección. Es una lente de demostración sobre la pantalla real, no nueve pantallas productivas.

## Paseo compartido

Una sola definición en `constants/mockBookings.ts`:

```text
id: QA-WALK-001
cliente: Valentina Paredes
mascota: Milo
proveedor: Andrés & Luna
fecha/hora: 25-08-2026 17:30 (-05:00)
duración: 60 minutos
status inicial: Programada
startedAt/completedAt: ausentes
```

`getQaWalkForClient` y `getQaWalkForProvider` llaman al mismo `getMockBookingById(QA_WALK_ID)`.

| Acción QA | Resultado |
|---|---|
| Restablecer a agendado | Programada, upcoming; limpia startedAt/completedAt/duración/cancelación/refund; payout 8.75; chat/cancelación true |
| Simular en curso | En curso, current, `startedAt=now`, event walk_started |
| Simular completado | asegura startedAt (30 min antes si faltaba), Completada, completedAt=now, duración/eventos |
| Simular cancelado por proveedor | Cancelada, cancelledBy provider, payout 0, refund total, event |

## Recorrido manual recomendado

1. Ajustes → Cambiar perfil → Cliente + proveedor verificado.
2. Perfil → Modo Proveedor → Paseos → Mis agendamientos → QA-WALK-001.
3. Iniciar y observar timer/startedAt.
4. Volver a Cliente → Reservas → En curso → QA-WALK-001; comprobar mismo timer.
5. Volver a proveedor y Finalizar.
6. Cliente → Reservas → Finalizadas; comprobar Paseo completado.
7. Ajustes → Controlar paseo → Restablecer a agendado.

## Reset bienvenida

Es una herramienta distinta de Modo prueba. Confirma y reinicia onboarding/profile/session/phone para mostrar ONBOARD-01. No confundir el toggle visual “Modo prueba: Sí” con el bloque QA.

## Persistencia

- Perfil QA: `hupi.qaProfile.v1`.
- Provider: `hupi.localProvider.v1`.
- Cuenta/onboarding: repositorio local y sus claves.
- Operación paseo: `hupi.walkOperations.v1`.

Las claves son implementación de referencia; los escenarios y resultados son la especificación.
