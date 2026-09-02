# 10 · Notificaciones, chat y soporte

## Notificaciones

Dos colecciones/pantallas: NOTIFY-01 cliente y NOTIFY-02 proveedor.

| Gesto | Resultado |
|---|---|
| Tap tarjeta | marca leída y abre target |
| Tap CTA | mismo resultado; botón coral `#E45336`, texto blanco |
| Swipe izquierda | revela/completa acción Abrir |
| Swipe derecha | revela/completa Eliminar |

El gesto solo se toma como horizontal si `abs(dx) > abs(dy)*1.5` y supera umbral. Leído/no leído afecta estilo y contador. Cliente redirige a cupón, tracking, pedidos o Marketplace. Proveedor puede ir a tienda, perfil, productos, pedidos, finanzas, soporte o detalle order. Targets desconocidos se protegen con fallback.

## Chat

CHAT-01 es una sola pantalla parametrizada por `chatId`, `viewer=client|provider|admin`, ticket/order/context. Modos reales:

- coordinación servicio cliente/proveedor;
- soporte cliente;
- soporte proveedor;
- viewer admin solo como representación interna (al abrir destino Admin muestra Alert, no navega a Admin mobile).

### Header y confianza

- título/rol según peer;
- online/offline;
- tiempo promedio de respuesta;
- foto/initials;
- escudo “Verificado por Hupi” azul `#0096FF` cuando aplica;
- caso/order relacionado y CTA.

### Mensajería

Mensajes customer/provider/support/system, timestamps, estado y attachmentType image/document/receipt. Composer de texto, cámara/foto/adjunto mock. Se simula respuesta. El aviso de seguridad aparece animado una vez por conversación de servicios. Texto con riesgo de contacto/pago externo puede producir alerta o bloqueo.

### Ofertas

Solo viewer proveedor + coordinación ve Enviar oferta. El modal consulta planes/servicios públicos aprobados del provider/request y separa individuales/recurrentes. No acepta precio libre. Cliente recibe card con estado, mascota, duración, fecha/hora, condiciones, valor base, fee 15%, total y vigencia. Puede expandir, rechazar o aceptar; debe aceptar términos estándar para Checkout.

Estados: sent → viewed → accepted/declined/expired. Al aceptar, request pasa a Pendiente de pago; checkout conserva request/offer IDs y, tras pagar, lo confirma y asocia booking.

## Soporte cliente

SUPPORT-01 contiene FAQ accordions, opciones de ayuda, redes oficiales y acceso a crear/ver casos. Motivos generales:

- Problema con reserva;
- Problema con pago;
- Problema con proveedor;
- Problema con cliente;
- Problema con Marketplace;
- Problema con entrega;
- Seguridad;
- Cuenta o perfil;
- Sugerencia;
- Otro.

Desde pedido se ofrecen: No recibí mi pedido, Producto incorrecto, Producto dañado, Pedido incompleto, Comprobante de pago, Reembolso/Saldo Hupi, Cancelación de pedido y otros contextuales.

“Otro” exige al menos 5 caracteres y máximo 120 en la especificación breve; descripción principal es multiline. Puede llevar order/booking/context precargado. Enviar crea ticket local y conversación/confirmación.

SUPPORT-03 lista casos. SUPPORT-04 muestra número, categoría, pedido/reserva, fecha, estado e interacciones; permite actualización y cierre cuando procede, abrir chat y regresar al elemento relacionado.

Estados visibles: Abierto (verde), En revisión (azul), Esperando respuesta, Resuelto, Cerrado (gris).

## Soporte proveedor

ORDER-05 integra incidencias, respuestas y chat Hupi. MARKET-06 genera tickets para cambios legales bloqueados. Existe el archivo `provider/support-request.tsx` con una respuesta de texto a una solicitud Hupi, pero ninguna UI actual navega a él; por eso es UNUSED y no forma parte del flujo visible. Todos los flujos alcanzables son mocks locales; no existe SLA real aunque el copy promete respuesta máxima de 24 h.

## Redes oficiales

La app valida `Linking.canOpenURL` antes de abrir y muestra error seguro si falla. Marketplace no ofrece chat directo cliente-vendedor: los incidentes se canalizan por Soporte Hupi. El chat de servicios sí conecta cliente/proveedor para coordinar una reserva.
