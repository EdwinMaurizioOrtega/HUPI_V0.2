# 02 · Flujos maestros

Este documento describe lo que hace la app actual. Los pasos no visibles se marcan como ausencia, no como requerimiento inventado. Se catalogaron **28 flujos maestros**.

## FLOW-01 · Arranque y splash

`AUTH-01` → bootstrap de idioma, apariencia, cuenta, proveedor, QA y operaciones de paseo → guard central → destino permitido. El splash nativo y el visual mantienen fondo `#E45336`; el visual reproduce el sonido y dura 3 s. Un timeout de 8 s presenta `AUTH-02`; Reintentar reinicia el bootstrap.

## FLOW-02 · Primera instalación y entrada a Home

`ONBOARD-01` carrusel → Omitir o completar las tres informativas → `AUTH-03` → registro/login → `AUTH-05` celular → `ONBOARD-02` perfil → `ONBOARD-03` permisos → `HOME-01`. El onboarding y los hitos de cuenta se guardan localmente; el guard reanuda el primer hito pendiente después de reiniciar.

## FLOW-03 · Login y cierre de sesión

`AUTH-03`: ingresar teléfono + contraseña → sesión local → si falta verificación, `AUTH-05`; si falta perfil, `ONBOARD-02`; si está completa, `HOME-01`. `SETTINGS-02` → Cerrar sesión limpia el flag de sesión y reemplaza por `AUTH-03`. No hay autenticación remota.

## FLOW-04 · Registro cliente

`AUTH-03` → Crear cuenta → `AUTH-04`: teléfono, contraseña y consentimiento → iniciar verificación local → `AUTH-05` (OTP `123456`) → `ONBOARD-02`: foto opcional, nombre, apellido, correo obligatorio, teléfono reutilizado → `ONBOARD-03` → `HOME-01`.

El correo se valida por sintaxis; la app no envía un código de correo durante el alta.

## FLOW-05 · Recuperación de acceso

`AUTH-03` → `AUTH-06` → elegir Correo o SMS. Correo: normaliza a minúsculas y valida formato. SMS: país + número válido. En ambos casos la respuesta es neutral y no confirma si la cuenta existe. Continúa a `AUTH-05`; la simulación usa OTP `123456`, reenvío tras 30 s y vuelve al login.

## FLOW-06 · Cliente existente se convierte en proveedor

`PROFILE-01` → “¿Quieres trabajar con Hupi?” → `AUTH-08?existing=1` / `VERIFY-01` → Natural o Jurídica → el repositorio crea un `ProviderEnrollment` sobre el mismo `accountId` y reutiliza perfil/dirección → completar secciones → Continuar más tarde vuelve a `HOME-01` y conserva `lastPendingSection` → reingresar por Perfil/Modo proveedor → enviar → `under_review` → aprobación simulada mediante perfil QA/estado local.

La app no crea una segunda cuenta. Mientras el proveedor está `in_progress`, el Modo Proveedor es visible, pero Paseos y Mi tienda llevan a verificación. No existe una acción de aprobación de producción dentro de la UI; se demuestra con QA.

## FLOW-07 · Registro nuevo proveedor

`AUTH-07` → Crear cuenta como proveedor → `AUTH-08`: tipo Natural/Jurídica, datos básicos, teléfono, correo, contraseña, consentimiento → `AUTH-05?provider=1&create=1` → `VERIFY-01`.

La guía QA representa nueve pasos:

1. Datos básicos.
2. Tipo de proveedor.
3. Verificación celular.
4. Verificación correo.
5. Identidad / Empresa.
6. Dirección.
7. Persona de contacto.
8. Datos bancarios.
9. Revisión.

La pantalla real de producción no es un wizard de nueve rutas: agrupa el trabajo en **7 accordions** según tipo. `currentStep` es propiedad del perfil QA; el estado funcional persistido de producción es `lastPendingSection`. “Completar después” existe como `Continuar más tarde`; “Omitir por ahora” solo aparece en el onboarding informativo inicial, no en cada sección de verificación.

## FLOW-08 · Verificación proveedor natural

`VERIFY-01` Natural:

1. Cuenta: nombre, apellido, celular y correo reutilizados; celular debe estar verificado; correo se marca validado con una acción local.
2. Datos personales: nombres readonly, cédula, fecha de nacimiento, nacionalidad, web opcional.
3. Identidad: selfie tomada en el momento con cámara frontal; cédula frente y reverso con cámara posterior.
4. Dirección: dirección, ciudad, sector, número; Casa o Edificio. Edificio exige nombre y departamento/unidad.
5. Contacto: nombre, apellido, teléfono, correo; el rol no bloquea a persona natural.
6. Datos bancarios: banco, tipo, número, titular, identificación del titular.
7. Información general: descripción e web opcional.
8. Revisión visible: progreso, estados y lista de faltantes; Enviar solo se habilita al 100%.

No hay certificado bancario ni certificado adicional.

## FLOW-09 · Verificación proveedor jurídico

`VERIFY-01` Jurídica:

1. Cuenta reutilizada.
2. Empresa: razón social, nombre comercial, RUC, tipo compañía, fecha constitución, teléfono, correo empresa, web opcional.
3. Documentos: RUC, constitución y nombramiento del representante legal.
4. Representante: nombres, cédula, teléfono, correo, selfie actual, cédula frente/reverso.
5. Dirección fiscal: dirección, ciudad, sector, número; Casa o Edificio; Edificio exige nombre y oficina.
6. Persona de contacto: mismos cinco campos más rol; toggle “usar representante legal” copia/reutiliza y bloquea edición.
7. Datos bancarios.
8. Revisión y Enviar.

No hay certificado bancario. Aunque el modelo contiene nacimiento/nacionalidad del representante, **la UI actual no los muestra**; no forman parte de la especificación visible.

## FLOW-10 · Estados de proveedor y verificación

Estados generales reales: `not_started` → `in_progress` → `under_review`; el dominio admite además `submitted`, `changes_requested`, `approved`, `rejected`, `suspended`. La acción Enviar escribe directamente `under_review` y `submittedAt`; `submitted` existe en el modelo/presentación pero no es un estado intermedio producido por esa acción local.

Estados de sección: `pending`, `complete`, `under_review`, `approved`, `changes_requested`. Progreso = secciones completas / 7. En `submitted|under_review`, las secciones completas se muestran `under_review`; en `approved`, `approved`.

## FLOW-11 · Arquitectura de servicios proveedor

`PROVIDER-01` separa:

```text
Verificación general del proveedor
  -> progreso + indicadores generales
  -> aprobación general
Servicios
  -> Paseos (aprobación/configuración propia)
  -> Mi tienda Marketplace (operación propia)
```

Un proveedor aprobado no implica que Paseos esté aprobado. El perfil QA “Proveedor verificado + Paseos pendiente” demuestra esa diferencia. La documentación/identidad nunca se mezcla con tarifa, planes, disponibilidad o configuración del servicio.

## FLOW-12 · Paseos cliente: descubrimiento a perfil

`HOME-01`: fecha, hora futura, duración 1–4 h, ubicación/dirección, notas y mascota → Buscar paseadores → `WALK-01`: misma colección para lista y mapa; filtros Mejor valorados, Cercanos y Verificados → tap card → `WALK-02`: ficha pública, online/offline, tiempo de respuesta, escudo Hupi, nivel, tarifa, experiencia, configuración, requisitos, condiciones, reseñas y planes aprobados.

Alternativas visibles: abrir Chat para coordinación o seleccionar un plan/servicio para checkout. No hay filtros adicionales fuera de los tres chips actuales.

## FLOW-13 · Paseo cliente: chat, oferta, checkout y reserva

`WALK-02` → `CHAT-01`: aviso de seguridad, presencia, mensajes, fotos/cámara. El proveedor solo puede abrir `OfferComposerModal` con servicios individuales o planes **aprobados y públicos**. Envía oferta → cliente la ve como `sent/viewed`, expande detalle, acepta condiciones estándar, puede rechazar o continuar → `CHECKOUT-01`.

Checkout: proveedor/plan/oferta, mascota, fecha/hora/duración, dirección, preferencias de encuentro, donación opcional 0/1/2/5/otro, desglose 15%, tarjeta/transferencia/Deuna, guardar método visual, aceptar términos del servicio y privacidad → crea booking local → `BOOKING-02` → `BOOKING-03`/`BOOKING-01`.

## FLOW-14 · Reserva cliente: seguimiento, cancelar y reseñar

`BOOKING-03` muestra estado, resumen, cobro, timeline, chat mientras corresponde, soporte y recordatorios. Si cancelable, despliega política, selecciona Saldo Hupi o devolución al método y confirma. En curso muestra temporizador; completado muestra inicio/fin/duración y formulario de reseña con estrellas/tags; cancelado por proveedor muestra explícitamente “Cancelado por el proveedor”.

## FLOW-15 · Cancelación cliente

El cálculo usa horas exactas hasta `startsAt` y el **monto total original**:

| Ventana | Cargo | Devolución |
|---|---:|---:|
| `>=72h` | 0% | 100% |
| `24h–71h59` | 50% | 50% |
| `<24h` | 100% | 0% |

La confirmación siempre enseña monto original, porcentaje/cargo cuando aplica, devolución y método. Métodos: `wallet` (Saldo Hupi) o `refund` (método original). Confirmar cambia booking a Cancelada, sección Canceladas, deshabilita chat/cancelación y guarda quote/método.

## FLOW-16 · Paseos proveedor: configuración

`PROVIDER-01` → `WALK-03`. Resumen muestra tarifa, aprobación, próximos, solicitudes e ingreso. Ramas:

- `WALK-04`: editar tarifa decimal positiva.
- `WALK-07`: planes; crear, editar en modal, ver, duplicar, corregir, archivar y enviar. Un plan aprobado se edita mediante una nueva versión; el aprobado anterior permanece hasta aprobación futura.
- `WALK-08`: descripción, tamaños/edades, máximo 1–8 perros, modalidades, tipos, manejo especial, requisitos, certificaciones y ficha pública.
- `WALK-09`: solo texto informativo; no hay calendario editable.
- `WALK-11`: condiciones Hupi no seleccionables.

Condición visible obligatoria: el paseo puede extenderse hasta **40 minutos adicionales** por retrasos de otras mascotas, tráfico, lluvia u otras condiciones operativas.

## FLOW-17 · Paseos proveedor: solicitudes y agendamientos

`WALK-06`: solicitudes de coordinación abren `CHAT-01`; solicitudes operativas se aceptan/rechazan localmente. `WALK-05`: lista los bookings Paseo del proveedor con ID, mascota, estado, fecha, cliente y payout → `WALK-12` → iniciar/finalizar/cancelar/chat según estado.

`WALK-10` deriva número de agendamientos, completados, cancelaciones del proveedor, tasa de cancelación, puntualidad (gracia 10 min) e ingresos de esos mismos bookings.

## FLOW-18 · Ciclo operativo compartido del paseo

```text
scheduled (Programada/Confirmada/Próxima)
  -- proveedor toca Iniciar paseo -->
in_progress (En curso, startedAt = timestamp, timer)
  -- proveedor toca Finalizar paseo -->
completed (Completada, completedAt, actualDurationMinutes)
```

Cliente (`BOOKING-03`) y proveedor (`WALK-12`) consultan el mismo booking por `bookingId`. Ambos timers calculan `now - startedAt`. El detalle proveedor muestra hora programada, inicio real, retraso, fin y duración. La cancelación proveedor desde scheduled produce Cancelada, `cancelledBy=provider`, `providerPayout=0`, devolución cliente total, chat cerrado y evento `provider_cancelled_walk`; alimenta la tasa de cancelación y el cliente ve el mensaje específico.

## FLOW-19 · QA del paseo real

Aplicar QA “Cliente + proveedor verificado” → `PROFILE-01` → Modo Proveedor → `PROVIDER-01` → Paseos → `WALK-05` → abrir `QA-WALK-001` → Iniciar → timer. Volver a modo cliente → `BOOKING-01` → `QA-WALK-001` → mismo estado/timer. Volver a proveedor → Finalizar → cliente ve Completada. `QA-03` permite resetear/simular sin crear otro booking.

## FLOW-20 · Marketplace cliente: catálogo y carrito

`MARKET-01` → buscador o tiendas/categorías/productos → `MARKET-02|03`, `PRODUCT-01|02|03`. En producto: elegir variaciones, cantidad y comentario opcional; precio difiere tarjeta vs transferencia/Deuna; stock invalida combinaciones. Agregar → `CHECKOUT-02`; carrito permite ajustar/remover y conduce a `CHECKOUT-03`.

## FLOW-21 · Marketplace cliente: checkout y pedido

`CHECKOUT-03` revisa productos → facturación Natural/Jurídica → dirección (guardar o usar solo esta ocasión) y preferencias de entrega → envío compatible (Estándar/Express/Retiro) → pago (tarjeta, transferencia, Deuna), guardar tarjeta → Saldo Hupi → cupón/beneficio → términos/datos → Confirmar.

Tarjeta va a `ORDER-01`; transferencia a `PAYMENT-03`; Deuna a `PAYMENT-02`; todos terminan en `ORDER-01`. Luego `ORDER-04` → `ORDER-02`; tracking en `ORDER-03`. El detalle permite comprobante, recibo/factura, soporte y reseña solo cuando el estado lo habilita.

## FLOW-22 · Marketplace proveedor: tienda y productos

`PROVIDER-01` → `MARKET-04` → `PRODUCT-05` → `PRODUCT-04`. Producto: tipo, nombre, marca, descripción, impuesto 0/15%, activo, categoría, imágenes con principal, SKU, precios tarjeta/transferencia, stock/alerta, atributos (Color/Talla/Sabor/Tamaño de empaque/Personalizado), variaciones, peso/unidad/dimensiones, guardar/publicar. La tienda separa perfil público editable de datos legales validados y bloqueados.

## FLOW-23 · Marketplace proveedor: pedidos

`MARKET-04` → `ORDER-06`: pedidos empiezan contraídos; solo uno se expande; Gestionar → `ORDER-05`. Flujo de estados: Pendiente de pago/Pago en revisión → Confirmado → En preparación → Listo para envío → En camino → Entregado; Cancelado es terminal. Un comprobante rechazado bloquea. Para En camino, envío no-pickup exige transportista, guía y archivo; evidencia de entrega/envío aparece precisamente al preparar ese cambio. Puede responder incidencias y abrir chat de soporte.

## FLOW-24 · Marketplace proveedor: métodos, envíos y perfil

`MARKET-05`: habilitar/deshabilitar Estándar/Express/Retiro; editar horas solo dígitos, costo con punto/coma y hasta 2 decimales, instrucciones/punto. `MARKET-06`: tipos Local físico/Tienda online, datos públicos, categorías, horario diario, logo, información financiera; datos legales/ubicación/contacto interno quedan readonly. Cambios legales crean ticket con tipo, descripción y adjunto. `PAYMENT-05` muestra finanzas/liquidaciones.

## FLOW-25 · Perfil, mascotas y direcciones

`PROFILE-01` centraliza edición de cuenta, contraseña, proveedor, facturación, direcciones, mascotas y configuraciones. Mascota: `PET-01` → `PET-02` → `PET-03`; historia y estadísticas en `PET-04`, con filtros de fechas y enlaces al booking. Dirección: `ADDRESS-01` crea/edita, mapa/current location, predeterminada y preferencias; checkout puede persistir preferencias en la dirección o usarlas solo esa ocasión.

## FLOW-26 · Chat y ofertas

`CHAT-01` sirve soporte y coordinación. Muestra presencia/tiempo de respuesta, escudo azul para proveedor verificado, mensajes, adjuntos simulados y advertencia de mantener coordinación/pago en Hupi. Detecta datos de contacto externos y puede alertar o bloquear. Solo el viewer proveedor ve Enviar oferta y solo desde catálogo aprobado. Cliente ve sent → viewed → accepted/declined/expired y llega a checkout desde oferta.

## FLOW-27 · Notificaciones y soporte

Cliente `NOTIFY-01` y proveedor `NOTIFY-02`: tap de tarjeta o CTA coral `#E45336` abre target; swipe izquierda abre, swipe derecha elimina; leído/no leído alimenta contador. Soporte `SUPPORT-01` → crear `SUPPORT-02`, ver lista `SUPPORT-03`, detalle `SUPPORT-04`, agregar interacción/cerrar/abrir chat. Estados visibles: Abierto, En revisión, Esperando respuesta, Resuelto, Cerrado.

## FLOW-28 · QA/desarrollo

`SETTINGS-02` muestra en `__DEV__` el perfil activo, `QA-01`, `QA-02`, `QA-03` y reset de bienvenida. Escenarios: Cliente nuevo; Cliente activo; Cliente + proveedor pendiente; Cliente + proveedor verificado; Proveedor nuevo; Proveedor con verificación incompleta; Proveedor verificado; Proveedor verificado + Paseos pendiente. Aplicar sincroniza cuenta/proveedor/servicio y navega al destino. Fuera de `__DEV__`, el bloque no se renderiza y las tres rutas redirigen a `/home`.

## Ausencias visibles que no deben inventarse

- No hay verificación por código para el correo de alta.
- No hay certificado bancario ni certificado adicional.
- No hay calendario editable en Disponibilidad de Paseos.
- No hay backend, tracking GPS en vivo ni payout real; hay estados/condiciones visibles y mocks.
- Niñera, Hospedaje, Guardería, Grooming y Adiestramiento están deshabilitados por feature flags y no integran los flujos actuales.
