# 08 · Paseos

## Cliente

### Solicitud inicial (HOME-01)

- Fecha no pasada; hora futura si es hoy.
- Duración editable entre 1 y 4 horas.
- Dirección guardada, nueva o ubicación actual.
- Notas libres.
- Mascota seleccionada (o alta de mascota).

### Resultados (WALK-01)

La lista y el mapa consumen el mismo resultado derivado mediante distancia Haversine. Filtros actuales: Mejor valorados, Más cercanos, Verificados por Hupi. El mapa nativo usa marcadores y encuadra coordenadas; web presenta mapa ilustrativo con las mismas opciones.

### Perfil público (WALK-02)

Muestra foto, presencia, promedio de respuesta, badge Hupi azul, nivel, rating/distribución/reseñas, servicios, experiencia, zona, tarifa, ficha de Paseos, planes públicos y condiciones. Acciones: favorito/listas, Chat y selección de plan. Solo se publican perfil y planes aprobados/vigentes/disponibles.

### Chat/oferta/checkout

Ver FLOW-13. Las ofertas provienen exclusivamente de catálogo aprobado. El cliente acepta términos en checkout, no en el perfil público. Desglose actual: valor proveedor + recargo cliente 15%; internamente también se modela comisión proveedor 30% (no se muestra como desglose al cliente).

### Reserva y estados

Tabs cliente: Próximas, En curso, Finalizadas, Canceladas; filtro Todos/Paseos. Detalle muestra ID, servicio, proveedor, mascota, fecha, hora, duración, ubicación, valor servicio, recargo, total, timeline y acciones condicionales.

## Proveedor

### WALK-03 y configuración

- Tarifa visible y editable (WALK-04).
- Mis agendamientos (WALK-05).
- Solicitudes/coordinación (WALK-06).
- Mis planes y modal create/edit (WALK-07).
- Ficha pública (WALK-08).
- Disponibilidad informativa, sin calendario (WALK-09).
- Métricas/finanzas (WALK-10).
- Condiciones especiales Hupi (WALK-11).

### Ficha y planes

Checklist de publicación: descripción, configuración (tamaños, edades, máximo, modalidad), requisitos, tarifa, zona y plan activo. El perfil se envía a revisión. Crear planes solo está habilitado cuando proveedor/servicio/checklist cumplen los gates.

Plan: nombre, descripción, individual/recurrente, duración, número de paseos, frecuencia/vigencia/tipo si recurrente, mascotas, modalidad, precio, incluye, condiciones y disponibilidad. Editar uno aprobado crea versión draft; al aprobarla, el anterior sería `superseded`.

### Condiciones estándar visibles

- cancelación del proveedor;
- proveedor no se presenta;
- proveedor llega tarde;
- cliente no disponible;
- inicio del paseo;
- clima difícil;
- extensión operativa: hasta **40 minutos adicionales** por otras mascotas, tráfico, lluvia u otras condiciones operativas.

Son informativas (`isSelectable=false`).

## Booking único y operación

`MockBooking` contiene: `id`, servicio, estado/sección, proveedor, mascota, cliente, fecha/hora/duración/ubicación, totales, chat/cancelación, timeline, `startsAt`, `scheduledStartAt`, `startedAt`, `completedAt`, duración real, actor cancelación, refund y preferencias.

```text
Programada/Confirmada/Próxima
  Iniciar -> En curso
    startedAt = now
    section = current
    temporizador = now - startedAt
  Finalizar -> Completada
    completedAt = now
    actualDurationMinutes = round(completedAt-startedAt)
    section = history
```

Cliente y proveedor leen `getMockBookingById(bookingId)`. No existen copias por vista.

### Tiempo y métricas

- Hora programada: `scheduledStartAt`.
- Inicio real: `startedAt`.
- Retraso: max(0, round(inicio-programado en minutos)).
- Puntual: retraso <=10 min.
- Timer: hh:mm:ss desde `startedAt`.
- Ingreso: suma `providerPayout` de completados/finalizados.
- Tasa puntualidad: puntuales / bookings iniciados.
- Tasa cancelación proveedor: cancelados por proveedor / agendamientos del proveedor.

### Cancelación proveedor

Solo desde Programada/Confirmada/Próxima. Resultado: Cancelada, sección cancelled, `cancelledBy=provider`, `providerPayout=0`, `clientRefundAmount=totalPaid`, chat/cancelación deshabilitados y evento. Cliente ve “Cancelado por el proveedor” y sin cargo de cancelación.

## Cancelación cliente

| Horas antes | Tier | Cargo | Refund |
|---:|---|---:|---:|
| >=72 | free | 0% | 100% |
| >=24 y <72 | half | 50% | 50% |
| <24 | full | 100% | 0% |

El cliente elige Saldo Hupi o método original y confirma con resumen exacto. La cancelación cierra chat y mueve el booking a Canceladas.

## Reseña

Solo al completar: rating 1–5 y tags; se guarda por booking en memoria. No modifica automáticamente rating proveedor en esta versión.

## QA-WALK-001

ID estable, una sola definición, cliente Valentina Paredes, mascota Milo, proveedor Andrés & Luna, 25 agosto 2026 17:30, 60 min, La Carolina. Persistencia operativa: `hupi.walkOperations.v1`. QA-03 puede scheduled/in_progress/completed/cancelled; reset limpia timestamps/cancelación y repone payout 8.75.

## Tracking

La regla de producto exige tracking, y los mocks/condiciones mencionan “Tracking obligatorio”; sin embargo la app actual no presenta un mapa GPS en vivo ni captura coordenadas del recorrido. Esto es un gap visible que el backend/rebuild deberá resolver sin fingir que ya existe.
