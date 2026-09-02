# 04 · Acciones y navegación

La tabla cubre interacciones que cambian vista, ruta o estado. Los inputs sin efecto lateral están en `03-forms-and-fields.md`.

| Pantalla | Elemento | Tipo de interacción | Condición | Resultado | Cambio de estado | Pantalla destino |
|---|---|---|---|---|---|---|
| AUTH-02 | Reintentar | botón/tap | bootstrap fallido | reinicia carga | startup retry | destino guard |
| AUTH-03 | Entrar | botón/confirm | credenciales presentes | inicia sesión | `loggedIn=true` | AUTH-05/ONBOARD-02/HOME-01 |
| AUTH-03 | Recuperar acceso | link/tap | siempre | abre recuperación | — | AUTH-06 |
| AUTH-03 | Crear cuenta | link/tap | siempre | abre alta cliente | — | AUTH-04 |
| AUTH-03 | Soy proveedor | card/tap | siempre | abre hub proveedor | — | AUTH-07 |
| AUTH-03 | Idioma/Apariencia | icon button/modal | siempre | selecciona preferencia | AsyncStorage | misma |
| AUTH-04 | Continuar | botón/confirm | teléfono, password, consent | inicia alta | cuenta/pendingPhone | AUTH-05 |
| AUTH-05 | Celdas OTP | tap/type | siempre | mueve foco y arma código | draft OTP | misma |
| AUTH-05 | Confirmar | botón/confirm | 6 dígitos y `123456` | completa hito | phoneVerified/recovery | según contexto |
| AUTH-05 | Reenviar | botón | contador 0 | reinicia 30 s | resend timer | misma |
| AUTH-06 | Correo/SMS | radio/tap | siempre | cambia formulario | recovery method | misma |
| AUTH-06 | Enviar | botón/confirm | identificador válido | respuesta neutral/OTP | recovery pending | AUTH-05 |
| AUTH-07 | Iniciar como proveedor | card/tap | siempre | login con contexto | query provider | AUTH-03 |
| AUTH-07 | Crear como proveedor | card/tap | siempre | alta base | — | AUTH-08 |
| AUTH-08 | Natural/Jurídica | card/radio | siempre | selecciona entity type | draft | misma |
| AUTH-08 | Crear/Continuar | botón/confirm | formulario válido | guarda base/inicia SMS | Account+Enrollment | AUTH-05 |
| ONBOARD-01 | Swipe horizontal | swipe | siempre | cambia slide | índice local | misma |
| ONBOARD-01 | Omitir/Empezar | botón | según slide | completa informativas | onboardingCompleted | AUTH-03 |
| ONBOARD-02 | Foto | tap/modal | siempre | cámara/galería/eliminar | profile draft | misma |
| ONBOARD-02 | Guardar | confirm | perfil completo | completa perfil | User/profileCompleted | ONBOARD-03 |
| ONBOARD-03 | Permisos | toggle | siempre | simula preferencia | estado local pantalla | misma |
| ONBOARD-03 | Continuar | botón | siempre | entra app | — | HOME-01 |
| HOME-01 | Avatar | tap | siempre | abre perfil | — | PROFILE-01 |
| HOME-01 | Campana | tap | siempre | abre notificaciones | — | NOTIFY-01 |
| HOME-01 | Modo Proveedor | icon button | enrollment existente | cambia modo | — | PROVIDER-01 |
| HOME-01 | Ubicación | pill/tap | siempre | abre direcciones | — | ADDRESS-01 |
| HOME-01 | Fecha/hora | field/modal | paseo | picker nativo | draft búsqueda | misma |
| HOME-01 | Duración +/- | buttons | 1–4 | incrementa/decrementa | draft | misma |
| HOME-01 | Dirección | field/modal | paseo | seleccionar/crear/editar | address selection | misma/ADDRESS editor |
| HOME-01 | Buscar paseadores | botón | datos válidos | deriva búsqueda | selected pet/request | WALK-01 |
| HOME-01 | Ir a Marketplace | botón | feature activo | abre tienda | — | MARKET-01 |
| BOOKING-01 | Tabs estado | tab/tap | siempre | filtra colección | filtro local | misma |
| BOOKING-01 | Card reserva | card/tap | booking visible | abre detalle por ID | — | BOOKING-03 |
| PROFILE-01 | Menú | row/tap | siempre | abre módulo asociado | — | PROFILE/PET/ADDRESS/PAYMENT/SETTINGS/SUPPORT |
| PROFILE-01 | Modo proveedor | card/tap | provider sí/no | dashboard o alta | — | PROVIDER-01/AUTH-08 |
| PROFILE-01 | Mascota | card/tap | existe | abre detalle | — | PET-03 |
| PROFILE-01 | Cerrar sesión | botón/confirm | siempre | termina sesión | loggedIn=false | AUTH-03 |
| PROFILE-02 | Cambiar contraseña | botón/modal | siempre | abre modal | — | misma |
| PROFILE-02 | Guardar | confirm | perfil válido | persiste único User | User | PROFILE-01 |
| PROFILE-03 | Crear/renombrar lista | botón/modal/confirm | nombre | actualiza listas | favorites state | misma |
| PROFILE-03 | Proveedor favorito | card/tap | existe | perfil público | — | WALK-02 |
| PET-01 | Agregar | botón | siempre | formulario create | — | PET-02 |
| PET-01 | Mascota | card/tap | existe | detalle | — | PET-03 |
| PET-02 | Selectores | field/modal | siempre | elige opción/breed | Pet draft | misma |
| PET-02 | Guardar | confirm | requeridos/teléfono | persiste mascota | Pet | PET-01/03 tras éxito |
| PET-03 | Editar | botón | siempre | formulario edit | — | PET-02 |
| PET-03 | Historial/estadísticas | card/tap | datos | análisis | filtro | PET-04 |
| PET-04 | Rango fecha | chips/fields | siempre | filtra historia | date filter | misma |
| PET-04 | Actividad | card/tap | booking asociado | detalle reserva | — | BOOKING-03 |
| ADDRESS-01 | Agregar/Editar | button/card | siempre | editor completo | draft | misma |
| ADDRESS-01 | Pin mapa | tap/drag | mapa nativo | reverse geocode | coordinate/source | misma |
| ADDRESS-01 | Ubicación actual | botón | permiso concedido | carga coordinate/dirección | draft | misma |
| ADDRESS-01 | Predeterminada | toggle | dirección | cambia default única | Address repository | misma |
| ADDRESS-01 | Eliminar | botón/modal confirm | dirección existente | elimina | addresses | misma |
| ADDRESS-01 | Guardar/Cancelar | confirm/cancel/back | válido / dirty | persiste o descarta; back dirty confirma | Address | lista anterior |
| BILLING-01 | Crear/Editar | botón | siempre | despliega formulario | draft | misma |
| BILLING-01 | Default/Eliminar | button/confirm | no default/default | cambia o elimina | billing profiles | misma |
| PAYMENT-01 | Agregar | confirm | formulario | agrega tarjeta | payment methods | misma |
| PAYMENT-01 | Default/Eliminar | button | permitido | cambia/elimina | payment methods | misma |
| SETTINGS-02 | Filas idioma/apariencia | row/modal | siempre | selecciona/persiste | preference | misma |
| SETTINGS-02 | Toggles | toggle | siempre | Sí/No | pantalla local | misma |
| SETTINGS-02 | QA tools | buttons | `__DEV__` | abre herramienta | — | QA-01/02/03 |
| SETTINGS-02 | Reset bienvenida | button/modal confirm | `__DEV__` | limpia hitos startup | account startup | ONBOARD-01 |
| WALK-01 | Filtro chip | tap | siempre | ordena/filtra misma colección | filter | misma |
| WALK-01 | Lista/Mapa | toggle/tab | siempre | cambia presentación | view mode | misma |
| WALK-01 | Marcador/card | tap | resultado | perfil o chat | — | WALK-02/CHAT-01 |
| WALK-02 | Favorito | icon/tap | siempre | agrega/quita/lista modal | favorites | misma |
| WALK-02 | Ver reseñas | button/modal | reseñas | modal distribución/lista | — | misma |
| WALK-02 | Chat | botón | servicio activo | crea/abre coordination | request/chat | CHAT-01 |
| WALK-02 | Elegir plan | card/button | plan público | abre checkout | selected plan | CHECKOUT-01 |
| CHAT-01 | Mensaje | send/confirm | texto no vacío/no bloqueado | agrega y auto-responde mock | conversation messages | misma |
| CHAT-01 | Cámara/adjunto | button/menu | composer visible | agrega mensaje adjunto | message | misma |
| CHAT-01 | Enviar oferta | button/modal | viewer provider + request | catálogo aprobado | offer sent | misma |
| CHAT-01 | Oferta detalle | accordion/button | oferta | expande/contrae | UI | misma |
| CHAT-01 | Rechazar | button/confirm | sent/viewed | marca declined | offer | misma |
| CHAT-01 | Continuar checkout | button | términos aceptados | acepta oferta | offer/request | CHECKOUT-01 |
| CHECKOUT-01 | Editar preferencias | accordion/tap | dirección | muestra FORM-11 | draft | misma |
| CHECKOUT-01 | Guardar en dirección | checkbox | preferencias editadas | define persistencia | flag | misma |
| CHECKOUT-01 | Confirmar y pagar | confirm | 2 aceptaciones | crea booking/acceptance | booking scheduled | BOOKING-02 |
| BOOKING-02 | Ver reserva | botón | booking creado | detalle | — | BOOKING-03 |
| BOOKING-03 | Chat | botón | chatAvailable/status | conversación | — | CHAT-01 |
| BOOKING-03 | Cancelación | accordion | canCancel | opciones/quote | — | misma |
| BOOKING-03 | Confirmar cancelación | modal confirm | quote | cancela/reembolsa mock | booking cancelled | misma |
| BOOKING-03 | Soporte | card/tap | siempre | precarga contexto | query | SUPPORT-02 |
| BOOKING-03 | Reseñar | stars/chips/confirm | completado | guarda reseña | review map | misma |
| MARKET-01 | Buscar | input | texto | alterna resultados productos/tiendas | search query | misma |
| MARKET-01 | Cards/listados | tap | item | destino correspondiente | — | MARKET/PRODUCT |
| PRODUCT-03 | Variación | chips/radio | atributos | recalcula disponibilidad/precio | selected variation | misma |
| PRODUCT-03 | Cantidad +/- | buttons | stock | cambia cantidad | draft | misma |
| PRODUCT-03 | Agregar/Comprar | confirm | stock válido | carrito o checkout directo | cart/params | CHECKOUT-02/03 |
| CHECKOUT-02 | Cantidad/eliminar | buttons | stock/item | actualiza carrito | cart | misma |
| CHECKOUT-02 | Checkout | botón | carrito válido | pago | — | CHECKOUT-03 |
| CHECKOUT-03 | Crear/editar billing/address/card | accordions/buttons | siempre | editores embebidos | local checkout lists | misma |
| CHECKOUT-03 | Envío/pago/cupón/wallet | radios/toggle/confirm | disponibles | recalcula total/destino | checkout draft | misma |
| CHECKOUT-03 | Aceptaciones | checkboxes | siempre | habilita confirmar | booleans | misma |
| CHECKOUT-03 | Confirmar compra | button/confirm | carrito válido + legal | orden/pago | order local | PAYMENT-02/03/ORDER-01 |
| ORDER-02 | Comprobante/recibo/factura | buttons/modal | estado | simula adjuntar/descargar/solicitar | order | misma |
| ORDER-02 | Soporte | button | siempre | precarga pedido | query | SUPPORT-02 |
| ORDER-02 | Reseña | modal/confirm | entregado | guarda ratings/comentario | order review | misma |
| NOTIFY-01/02 | Tarjeta/CTA | tap | target válido | marca leído y abre | notification.read | target |
| NOTIFY-01/02 | Swipe izquierda | swipe | umbral horizontal | abre | read | target |
| NOTIFY-01/02 | Swipe derecha | swipe | umbral horizontal | elimina | collection | misma |
| SUPPORT-01 | FAQ | accordion | siempre | expande/contrae | UI | misma |
| SUPPORT-01 | Red social | tap | URL soportada | abre sistema | — | externo |
| SUPPORT-02 | Motivo | field/modal | siempre | selecciona opción | draft | misma |
| SUPPORT-02 | Enviar | confirm | motivo/descripcion válidos | crea caso | support ticket | SUPPORT-04/CHAT-01 |
| SUPPORT-04 | Actualizar | send | caso abierto+texto | agrega interacción/auto reply | ticket.messages | misma |
| SUPPORT-04 | Cerrar | button/modal confirm | caso no cerrado | cierra | status Cerrado | misma |
| PROVIDER-01 | Paseos/Tienda | card/tap | provider approved | abre servicio; si no, verificación | — | WALK-03/MARKET-04/VERIFY-01 |
| PROVIDER-01 | Cliente | button/back | siempre | cambia modo | — | HOME-01 |
| VERIFY-01 | Tipo | buttons | not_started | crea enrollment | in_progress | misma |
| VERIFY-01 | Header sección | accordion/tap | enrollment | abre editor | last visible | misma |
| VERIFY-01 | Validar correo | button | no validado | marca validado | emailValidated | misma |
| VERIFY-01 | Enviar | confirm | completo | somete | under_review | misma |
| VERIFY-01 | Continuar más tarde | button/back | siempre | conserva progreso | lastPendingSection | HOME-01 |
| WALK-03 | Menu card | card/tap | servicio visible | cambia sección interna | activeSection | WALK-04–11 |
| WALK-05 | Booking | card/tap | existe | detalle compartido | — | WALK-12 |
| WALK-06 | Aceptar/Rechazar | buttons | solicitud creada | actualiza | request status | misma |
| WALK-06 | Abrir chat | button | coordination | conversación | — | CHAT-01 |
| WALK-07 | Crear/Editar | button/modal | `canManagePlans` | editor scroll | draft/version | misma |
| WALK-07 | Guardar/Cancelar/Enviar | confirm/cancel | modal/plan válido | guarda/descarta/somete | plan status | misma |
| WALK-08 | Accordions | tap | siempre | abre sección | UI | misma |
| WALK-08 | Guardar/Enviar | buttons | descripción/checklist | draft/pending | profile status | misma |
| WALK-11 | Condiciones | accordion | siempre | muestra reglas | — | misma |
| WALK-12 | Iniciar | button/modal confirm | scheduled | startedAt/timer | in_progress | misma |
| WALK-12 | Finalizar | button/modal confirm | in_progress+startedAt | completedAt/duración | completed | misma |
| WALK-12 | Cancelar | button/modal confirm | scheduled | payout 0/refund total | cancelled provider | misma |
| ORDER-06 | Pedido | accordion | siempre | expande uno/contrae | expandedOrderId | misma |
| ORDER-06 | Gestionar | button | expandido | detalle | — | ORDER-05 |
| ORDER-05 | Siguiente estado | button/confirm | pago/guía/evidencia válidos | avanza | order status/activity | misma |
| ORDER-05 | Adjuntar/cambiar/eliminar | modal | guía/evidencia | archivo image/pdf mock | attachment | misma |
| MARKET-05 | Método | toggle | siempre | habilita/deshabilita | ShippingSetting | misma |
| MARKET-05 | Inputs | onChange | patrón válido | guarda inmediatamente | ShippingSetting | misma |
| MARKET-06 | Save profile | confirm | siempre | persiste mock | StoreProfile | misma |
| MARKET-06 | Ticket legal | accordion/confirm | siempre | crea ticket | support ticket | misma |
| PRODUCT-04 | Guardar/publicar | buttons/confirm | válido según acción | draft o producto | product status | PRODUCT-05/misma |
| QA-01 | Aplicar perfil | button/confirm | `__DEV__` | sincroniza cuenta/proveedor/QA | snapshots+AsyncStorage | destino perfil |
| QA-02 | Ir a paso/continuar | button | `__DEV__` | guarda currentStep y abre preview | QA/provider lastPending | VERIFY-01 |
| QA-02 | Reiniciar | button | `__DEV__` | aplica new_provider | QA/provider reset | VERIFY-01 paso 1 |
| QA-03 | Simular/reset | button | `__DEV__` | transición booking único | booking/eventos | misma |

## Comportamiento de back/cancel común

- Back de una ruta usa `router.back()` salvo `Continuar más tarde` (reemplaza por Home) y cambios de modo (rutas explícitas).
- Los editores con cambios sucios de dirección y los cambios operativos de paseo usan confirmación antes de perder/cambiar estado.
- Cancelar en modales de plan, oferta, confirmación o selector cierra el modal sin persistir la acción final.
