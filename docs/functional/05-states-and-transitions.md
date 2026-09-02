# 05 · Estados y transiciones

Formato: `origen -- evento [actor] --> destino`.

## Cuenta

```text
sin_onboarding -- Omitir/terminar bienvenida [cliente] --> onboarding_completo
onboarding_completo/sin_sesion -- registrar o login [cliente] --> sesion_con_celular_pendiente
sesion_con_celular_pendiente -- OTP 123456 [cliente] --> celular_verificado/perfil_pendiente
perfil_pendiente -- Guardar perfil válido [cliente] --> cuenta_completa
cuenta_completa -- Cerrar sesión [cliente] --> sin_sesion
cualquiera -- Reset bienvenida DEV [QA] --> sin_onboarding+sin_sesion
```

## Proveedor (rol general)

```text
none/not_started -- elegir Natural/Jurídica [usuario] --> in_progress
in_progress -- completar secciones [proveedor] --> in_progress (progreso aumenta)
in_progress|changes_requested -- Enviar completo [proveedor] --> under_review
under_review -- decisión futura [Hupi/Admin; no visible en app] --> approved|changes_requested|rejected
approved -- medida futura [Hupi/Admin] --> suspended
```

El dominio también admite `submitted`; el mock Enviar salta directamente a `under_review`.

## Sección de verificación

```text
pending -- completar campos [proveedor] --> complete
complete -- enviar verificación [proveedor] --> under_review
under_review -- aprobar [Hupi futuro] --> approved
under_review -- pedir cambios [Hupi futuro] --> changes_requested
changes_requested -- corregir [proveedor] --> complete
```

## Servicio

```text
not_configured -- completar ficha/tarifa/plan [proveedor] --> draft
draft -- enviar [proveedor] --> pending_approval
pending_approval -- aprobar [Hupi futuro/QA] --> approved
pending_approval -- pedir cambios/rechazar [Hupi futuro] --> changes_requested|rejected
approved -- suspensión [Hupi futuro] --> suspended
```

La aprobación general del proveedor no modifica automáticamente este estado.

## Plan Paseos

```text
draft -- guardar [proveedor] --> draft
draft|changes_requested -- enviar [proveedor] --> pending_approval
pending_approval -- aprobar [Hupi futuro] --> approved
pending_approval -- decisión [Hupi futuro] --> changes_requested|rejected
approved -- editar [proveedor] --> draft(nueva versión; approved anterior sigue)
draft|changes_requested|rejected -- archivar [proveedor] --> archived
approved anterior -- aprobar versión nueva [Hupi futuro] --> superseded
approved -- suspender [Hupi futuro] --> suspended
```

## Solicitud/coordinación y oferta

```text
Solicitud creada -- abrir chat [cliente/proveedor] --> Solicitud de coordinación
Solicitud creada -- Aceptar/Rechazar [proveedor] --> Aceptada|Rechazada
coordinación -- enviar oferta aprobada [proveedor] --> sent
sent -- cliente abre [sistema] --> viewed
sent|viewed -- rechazar [cliente] --> declined
sent|viewed -- vence expiresAt [sistema local] --> expired
sent|viewed -- aceptar/checkout [cliente] --> accepted / Pendiente de pago
Pendiente de pago -- pagar [cliente] --> Confirmada + booking
```

## Agendamiento/reserva

```text
Solicitud creada -> Solicitud de coordinación -> Oferta enviada -> Pendiente de pago
Pendiente de pago -- pago [cliente] --> Confirmada/Programada
Programada|Confirmada|Próxima -- fecha próxima [sistema futuro] --> Próxima
Programada|Confirmada|Próxima -- iniciar [proveedor] --> En curso
En curso -- finalizar [proveedor] --> Completada
Programada|Confirmada|Próxima -- cancelar [cliente/proveedor] --> Cancelada
Completada -- reseñar [cliente] --> Completada + review
```

## Paseo operativo

```text
scheduled -- start_walk [proveedor] --> in_progress
  efectos: startedAt=timestamp; section=current; canCancel=false; timelineStep=3; event=walk_started
in_progress -- complete_walk [proveedor] --> completed
  efectos: completedAt=timestamp; actualDurationMinutes; section=history; chat=false; event=walk_completed
scheduled -- provider_cancel [proveedor] --> cancelled
  efectos: cancelledBy=provider; payout=0; refund=total; chat=false; event=provider_cancelled_walk
scheduled|in_progress|completed|cancelled -- QA reset [QA] --> scheduled
```

## Producto Marketplace

```text
nuevo -- Guardar borrador [proveedor] --> draft
draft -- Guardar/Publicar [proveedor] --> draft|pending_approval (según acción del editor)
pending_approval -- aprobar/rechazar [Hupi futuro/mock seed] --> approved|rejected
approved -- desactivar [proveedor] --> approved+inactive
approved -- editar [proveedor] --> draft/pending_approval de referencia
```

Variación: `active <-> inactive` por toggle; stock se valida por combinación.

## Pedido Marketplace

```text
Pendiente de pago -- comprobante [cliente] --> Pago en revisión
Pago en revisión -- validar/rechazar [Hupi mock/futuro] --> Confirmado|Pendiente de pago
Confirmado -- preparar [proveedor] --> En preparación
En preparación -- listo [proveedor] --> Listo para envío
Listo para envío -- guía+evidencia [proveedor] --> En camino
En camino -- entregar [proveedor] --> Entregado
cualquier no terminal -- cancelar [actor autorizado/futuro] --> Cancelado
```

Cada transición proveedor agrega actividad. `Entregado` y `Cancelado` son terminales en la UI actual.

## Notificación

```text
unread -- tap/CTA/swipe izquierda [usuario] --> read + navegación target
read -- tap/CTA/swipe izquierda [usuario] --> read + navegación target
read|unread -- swipe derecha [usuario] --> deleted localmente
```

## Soporte

```text
borrador -- Enviar [cliente/proveedor] --> Abierto
Abierto -- recepción/revisión [Soporte mock] --> En revisión
En revisión -- solicitar respuesta [Soporte] --> Esperando respuesta
Esperando respuesta -- actualizar [cliente/proveedor] --> En revisión
Abierto|En revisión|Esperando respuesta -- resolver [Soporte] --> Resuelto
Abierto|En revisión|Esperando respuesta|Resuelto -- cerrar [cliente/Soporte] --> Cerrado
```

## Pago

```text
checkout -- tarjeta mock [cliente] --> confirmed
checkout -- transferencia [cliente] --> proof_pending
proof_pending -- adjuntar [cliente] --> payment_review
payment_review -- validar/rechazar [Hupi futuro/mock] --> confirmed|proof_rejected
checkout -- Deuna mock [cliente] --> confirmed
confirmed -- completar orden/reserva [sistema] --> asociado a booking/order
```

No hay cobro real.

## Cancelación

```text
booking cancelable -- calcular >=72h [sistema] --> quote free(0% cargo)
booking cancelable -- calcular 24–71h59 [sistema] --> quote half(50%)
booking cancelable -- calcular <24h [sistema] --> quote full(100%)
quote -- elegir wallet/refund + aceptar [cliente] --> booking Cancelada
booking scheduled -- cancelar proveedor [proveedor] --> Cancelada + payout 0 + refund total
```

## Payout y métricas de paseo

```text
completed -- agregar a métricas [sistema] --> income += providerPayout
startedAt <= scheduled+10min -- calcular [sistema] --> puntual
startedAt > scheduled+10min -- calcular [sistema] --> retrasado
cancelledBy=provider -- calcular [sistema] --> providerCancellationRate aumenta; payout=0
```
