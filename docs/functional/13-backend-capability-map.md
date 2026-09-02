# 13 · Mapa de capacidades para backend

No son endpoints. Son capacidades observadas que una arquitectura futura debe soportar.

| Acción | Frontend/actor | Datos mínimos | Resultado visible | Capacidad backend futura |
|---|---|---|---|---|
| Registrar cuenta | cliente | teléfono, password, consentimientos | OTP pendiente | identidad, credenciales, consentimiento versionado |
| Verificar celular | cliente | accountId, OTP, timestamp | phoneVerified | emitir/validar SMS, intentos, auditoría |
| Recuperar acceso | cliente | canal, email/teléfono | respuesta neutral/OTP | búsqueda segura, tokens, rate limit, no enumeración |
| Guardar perfil | cliente | nombres, email, foto | cuenta completa | perfil único, media, validación |
| Login/logout | usuario | credenciales/session | entra/sale | sesiones/tokens/revocación |
| Guardar preferencias | usuario | idioma/apariencia/notificaciones | UI consistente | preferencias usuario/dispositivo |
| Crear provider enrollment | usuario | accountId, entityType | in_progress | rol sobre misma cuenta, workflow |
| Guardar sección verificación | proveedor | enrollmentId, sección, draft | progreso/continuidad | drafts versionados, validación por sección |
| Capturar documento/foto | proveedor | tipo, media, metadata | adjunto/preview | upload seguro, firma, antivirus, retención |
| Validar correo proveedor | proveedor/sistema | enrollmentId, email | emailValidated | validación definida (la UI actual es local, sin OTP) |
| Enviar verificación | proveedor | enrollmentId, versión | under_review/submittedAt | workflow, snapshot, evento submitted |
| Pedir correcciones | Hupi | secciones/notas | changes_requested | decisión, reason, notificación, audit trail |
| Aprobar/rechazar/suspender provider | Hupi | providerId, decision | gates de modo/servicios | permisos, estados, auditoría |
| Crear/editar dirección | cliente | address + coordinate + prefs | lista/default | CRUD, geocoding, default único |
| Usar dirección una ocasión | cliente | snapshot address/prefs | checkout sin persistir | snapshot en booking/order |
| Crear/editar mascota | cliente | pet fields/media | mascota seleccionable | CRUD, media, ownership |
| Consultar historial mascota | cliente | petId, rango | actividades | query bookings por pet/fechas |
| Guardar facturación | cliente | taxpayer/profile fields | perfil/default | perfiles fiscales, validación país |
| Guardar método pago | cliente | token/brand/last4 | tarjeta disponible | tokenización PCI; nunca PAN/CVV local |
| Buscar paseadores | cliente | service, fecha/hora, duración, ubicación, filtros | lista/mapa iguales | disponibilidad, geo-query, ranking |
| Ver perfil público | cliente | providerId/service | ficha/planes/reseñas | proyección solo aprobada/publicable |
| Favorito/lista | cliente | userId, providerId, listId | favorito | colecciones usuario |
| Crear coordinación | cliente | provider, pet, servicio, schedule | chat/request | request + conversación autorizada |
| Enviar mensaje/adjunto | cliente/proveedor/soporte | chatId, actor, content/media | mensaje/estado | realtime, media, moderación, receipts |
| Consultar presencia | usuario | peerId | online/response time | presence y métrica histórica |
| Enviar oferta aprobada | proveedor | requestId, approvedPlanId | offer sent | verificar ownership/status/precio, expiry |
| Ver/rechazar/aceptar oferta | cliente | offerId, action | viewed/declined/accepted | transición atómica y autorización |
| Aceptar términos | cliente | termsId/version, provider, service/plan, time | checkout habilitado | evidencia legal inmutable |
| Calcular checkout paseo | sistema | price/plan, fee, donation | desglose | pricing/version/currency |
| Crear/pagar reserva | cliente | offer/plan, pet, address snapshot, prefs, payment | booking scheduled | booking/payment idempotente |
| Listar bookings por actor | cliente/proveedor | actor, filtros | tabs/agendamientos | proyecciones consistentes mismo booking |
| Iniciar paseo | proveedor | bookingId, timestamp | `in_progress`, startedAt, timer ambos | persistir `walk_started`, autorización, sincronización realtime |
| Finalizar paseo | proveedor | bookingId, timestamp | completedAt/duración | `walk_completed`, métricas, tracking closure |
| Registrar tracking | app/proveedor | bookingId, coordinates/times | futuro mapa/reporte | ingestión GPS obligatoria, privacidad, integridad |
| Cancelar paseo proveedor | proveedor | bookingId, timestamp/reason | cancelled, payout 0, refund total | evento, refund, penalidad/métricas, notificación |
| Calcular puntualidad | sistema | scheduledStartAt, startedAt | retraso/tasa | métricas con regla de gracia versionada |
| Cancelar booking cliente | cliente | bookingId, choice, now | quote/Cancelada | política versionada, cargo/refund/wallet atómico |
| Completar reseña paseo | cliente | bookingId, rating,tags | review guardada | elegibilidad única, reputación |
| Guardar tarifa Paseos | proveedor | providerId, amount | nueva tarifa | versionado/precio aprobado según reglas |
| Guardar ficha Paseos | proveedor | profile fields | draft/checklist | workflow de servicio separado |
| Crear/editar plan | proveedor | plan/version fields | draft | versionado, validación, ownership |
| Enviar/aprobar plan | proveedor/Hupi | planVersionId | pending/approved/superseded | workflow y publicación atómica |
| Consultar condiciones | ambos | terms version | accordion/copy | documentos versionados/localizados |
| Métricas Paseos | proveedor | providerId/range | ingresos/puntualidad/cancelación | agregados reproducibles desde eventos |
| Buscar catálogo | cliente | query/category/store | resultados | índice catálogo solo aprobado/activo |
| Consultar producto/stock | cliente | product/variation | precio/disponibilidad | inventario y precios por método |
| Actualizar carrito | cliente | lines/qty | validación | carrito persistente, reserva/validación stock |
| Aplicar cupón | cliente | code/cart/user | descuento | elegibilidad, reserva/consumo idempotente |
| Aplicar Saldo Hupi | cliente | walletId, amount | reduce total | ledger, bloqueo y reverso atómico |
| Calcular checkout Marketplace | sistema | cart, shipping, coupon, wallet, donation | total | pricing/tax/shipping engine |
| Pagar Marketplace | cliente | order draft, method | confirmed/review | payment intent, webhooks, proof review |
| Crear order/suborders | sistema | cart por stores | order cliente + providerOrderIds | split transaccional, snapshots |
| Listar pedidos | cliente/proveedor | actor, filtros | cards/tabs | proyecciones por autorización |
| Cambiar estado pedido | proveedor | providerOrderId, nextStatus | timeline/activity | state machine y eventos |
| Guardar guía | proveedor | carrier, tracking, file | guía visible | media y tracking carrier |
| Adjuntar evidencia | proveedor | orderId, file,time | habilita En camino | storage, metadata, policy por delivery type |
| Reportar incidencia/responder | cliente/proveedor/Hupi | orderId, message/media | actividad/chat | case management vinculado |
| Reseñar pedido/producto/proveedor | cliente | orderId, ratings/comment | feedback | elegibilidad y agregados |
| Gestionar producto | proveedor | fields/images/variations | draft/publicación | catálogo, media, workflow, stock |
| Ajustar stock | proveedor/sistema | variationId, delta/reason | disponibilidad | ledger inventario/concurrencia |
| Configurar envío | proveedor | method, enabled,cost,hours,instructions | checkout compatible | configuración por store/zone |
| Guardar perfil tienda | proveedor | públicos/horario/logo/finance contact | tienda actualizada | store profile y media |
| Solicitar cambio legal | proveedor | type, description,file | ticket | datos validados bloqueados + workflow |
| Consultar finanzas/liquidación | proveedor | provider/store/range | saldo/ventas/payout | ledger, comisión 30%, payout 48h futuro |
| Crear ticket soporte | usuario | category, description, relation | Abierto | case ID, SLA, routing, attachments |
| Actualizar/cerrar ticket | usuario/Soporte | ticketId,message/action | interacción/status | state machine, permisos, audit |
| Crear notificación | sistema/Hupi | audience,type,target | unread card | delivery inbox/push/localization |
| Leer/eliminar notificación | usuario | notificationId | counter/list | per-user read/delete state |

## Requisitos transversales inferidos de la UX

- Todas las mutaciones importantes necesitan idempotencia, actor, timestamp y auditoría.
- Bookings y orders necesitan proyecciones sincronizadas por actor, no registros duplicados.
- Los estados y documentos legales deben ser versionados.
- Media sensible de verificación requiere política distinta de fotos públicas/chat.
- Importes deben usar decimal/moneda, no floats binarios.
- QA local no debe convertirse en endpoint productivo ni bypass de permisos.
