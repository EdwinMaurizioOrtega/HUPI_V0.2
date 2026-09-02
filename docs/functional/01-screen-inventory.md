# 01 · Inventario de pantallas

## Criterio y conteo

Se identificaron **78 pantallas/superficies navegables**: **75 de producto** y **3 DEV_QA**. El conteo incluye vistas internas que sustituyen el contenido completo y poseen back/entrada propia; no cuenta layouts, el puente `/`, ni modales breves como pantallas separadas.

En “UI” se registran botones, cards, tabs, modales, toggles, accordions o swipes relevantes. `C` = cliente, `P` = proveedor, `A` = cualquier usuario, `DEV` = desarrollo.

## Cuenta, arranque y onboarding

| ID | Nombre | Archivo / ruta | Entrada y audiencia | Información y UI | Estados/condiciones | Salidas | Tipo |
|---|---|---|---|---|---|---|---|
| AUTH-01 | Splash visual Hupi | `startup/StartupVisualSplash.tsx` / arranque | Automática; A | Logo, fondo coral, sonido Hupi, fade | 3 s; se oculta al estar listo el destino | Destino del guard | Producción |
| AUTH-02 | Recuperación de arranque | `startup/StartupRecoveryScreen.tsx` / overlay raíz | Error/timeout de bootstrap; A | Mensaje, diagnóstico no sensible, botón Reintentar | Solo cuando falla arranque/fuentes o vence timeout | Reintenta bootstrap | Producción |
| AUTH-03 | Iniciar sesión | `app/(auth)/login.tsx` / `/login` | Guard sin sesión o back de auth; A | Teléfono, contraseña, idioma, apariencia; botones Entrar, Recuperar acceso, Crear cuenta, Soy proveedor | errores de teléfono/contraseña; carga | AUTH-05, AUTH-04, AUTH-06, AUTH-05/OTP según acción | Producción |
| AUTH-04 | Crear cuenta cliente | `app/(auth)/register.tsx` / `/register` | Login → Crear cuenta; A | Teléfono, contraseña, aceptación legal; modal país | teléfono válido, contraseña >=6, consentimiento | AUTH-05 (`/verify-sms`) | Producción |
| AUTH-05 | Verificar código | `app/(auth)/verify-sms.tsx` / `/verify-sms` | Registro, login/recovery o alta proveedor; A | OTP de 6 dígitos, cuenta regresiva, Reenviar, Confirmar | código mock `123456`; canal SMS o email de recuperación; flags provider/create/recovery | ONBOARD-02, PROVIDER-01, VERIFY-01 o AUTH-03 | Producción |
| AUTH-06 | Recuperar acceso | `app/(auth)/access-recovery.tsx` / `/access-recovery` | Login; A | Radios correo/SMS, email o teléfono con país, aviso neutral/spam, Enviar | valida email o teléfono; respuesta no revela existencia | AUTH-05 | Producción |
| AUTH-07 | Hub de acceso proveedor | `app/(auth)/provider-access.tsx` / `/provider-access` | Login → Soy proveedor; P potencial | Cards Iniciar sesión como proveedor / Crear cuenta como proveedor | sin estado propio | AUTH-03 con `provider=1`, AUTH-08 | Producción |
| AUTH-08 | Datos básicos proveedor | `app/(auth)/provider-onboarding.tsx` / `/provider-onboarding` | AUTH-07 o Perfil → trabajar con Hupi | Natural/Jurídica; nombres, teléfono, correo, contraseña, consentimiento | correo se valida por formato, celular por SMS; cuenta única | AUTH-05 y luego VERIFY-01 | Producción |
| ONBOARD-01 | Bienvenida informativa | `app/(onboarding)/welcome.tsx` / `/welcome` | Primera instalación/reset; A | Carrusel horizontal 3 slides, indicadores, Omitir/Continuar/Empezar | persiste onboarding al terminar u omitir | AUTH-03 | Producción |
| ONBOARD-02 | Completar perfil cliente | `app/(onboarding)/onboarding-profile.tsx` / `/onboarding-profile` | Teléfono validado con perfil incompleto; C | Foto, nombres, correo de recuperación, teléfono reutilizado; Guardar | nombre/apellido/email válidos; borrador no completa hasta guardar | ONBOARD-03 | Producción |
| ONBOARD-03 | Permisos | `app/(onboarding)/permissions.tsx` / `/permissions` | ONBOARD-02; C | Cards ubicación/notificaciones, toggles simulados, Continuar | no bloquea por denegación en mock | HOME-01 | Producción |

## Navegación cliente, perfil y datos

| ID | Nombre | Archivo / ruta | Entrada y audiencia | Información y UI | Estados/condiciones | Salidas | Tipo |
|---|---|---|---|---|---|---|---|
| HOME-01 | Home cliente | `app/(tabs)/home.tsx` / `/home` | Guard/tabs; C | Header, perfil, campana, modo proveedor, ubicación, formulario Paseo, promo Marketplace | Modo proveedor solo si existe enrollment; solo Paseo habilitado | PROFILE-01, NOTIFY-01, PROVIDER-01, ADDRESS-01, WALK-01, MARKET-01 | Producción |
| BOOKING-01 | Reservas | `app/(tabs)/bookings.tsx` / `/bookings` | Tab Reservas; C | Tabs Próximas/En curso/Finalizadas/Canceladas; filtro Todos/Paseos; cards | deriva sección por estado; refresca al enfocar | BOOKING-03 | Producción |
| MARKET-01 | Home Marketplace | `app/(tabs)/marketplace.tsx` / `/marketplace` | Tab/Home/Profile; C | buscador, ruleta/promo, banners, tiendas, categorías, productos, carrito, pedidos, wallet, campana | búsqueda alterna resultados; stock y cupón local | MARKET-02, PRODUCT-01/02/03, MARKET-03, CHECKOUT-02/03/04, ORDER-04, PAYMENT-04, NOTIFY-01 | Producción |
| PROFILE-01 | Perfil cliente | `app/(tabs)/profile.tsx` / `/profile` | Tab/Header; C | avatar, cuenta, mascotas, accesos, Modo Proveedor, Ajustes, Cerrar sesión | CTA proveedor cambia según enrollment; mascotas vacías/llenas | PROFILE-02/03, PET-01/02/03/04, ADDRESS-01, BILLING-01, PAYMENT-01/04, ORDER-04, SUPPORT-01, SETTINGS-01/02/03, PROVIDER-01/VERIFY-01 | Producción |
| PROFILE-02 | Editar perfil | `app/client/edit-profile.tsx` / `/client/edit-profile` | PROFILE-01; C | foto, nombres, teléfono verificado readonly, correo; modal cambiar contraseña | validación perfil y política de contraseña | back a PROFILE-01 | Producción |
| PROFILE-03 | Favoritos | `app/client/favorites.tsx` / `/client/favorites` | PROFILE-01; C | listas de favoritos, crear/renombrar, cards proveedor | lista vacía/seleccionada; modal de listas | WALK-02 | Producción |
| ADDRESS-01 | Direcciones | `app/client/addresses.tsx` / `/client/addresses` | Perfil/Home/checkout; C | lista, predeterminada, crear/editar, mapa, preferencias, eliminar/confirmar | dirección válida; una predeterminada; ubicación puede fallar | back; edición embebida | Producción |
| BILLING-01 | Datos de facturación | `app/client/billing.tsx` / `/client/billing` | PROFILE-01; C | perfiles Natural/Jurídica, crear/editar, predeterminado, eliminar | campos obligatorios según tipo | back | Producción |
| PAYMENT-01 | Métodos de pago | `app/client/payment-methods.tsx` / `/client/payment-methods` | PROFILE-01; C | tarjetas, agregar, predeterminada, eliminar; modal formulario | validación visual local | back | Producción |
| SETTINGS-01 | Privacidad y seguridad | `app/client/privacy.tsx` / `/client/privacy` | PROFILE-01; C | cards privacidad, sesión y datos | informativa | back | Producción |
| SETTINGS-02 | Configuraciones | `app/client/settings.tsx` / `/client/settings` | PROFILE-01; C | idioma, apariencia, toggles notificaciones/sonido/Modo prueba, Guardar, Cerrar sesión; modales | herramientas QA solo `__DEV__`; Modo prueba es independiente | AUTH-03, QA-01/02/03, ONBOARD-01 por reset | Producción + bloque DEV_QA |
| SETTINGS-03 | Políticas y términos | `app/client/terms.tsx` / `/client/terms` | Perfil o checkout; C | secciones cancelación, términos, datos, reembolsos/saldo, servicios/marketplace | informativa | back | Producción |

## Mascotas

| ID | Nombre | Archivo / ruta | Entrada y audiencia | Información y UI | Estados/condiciones | Salidas | Tipo |
|---|---|---|---|---|---|---|---|
| PET-01 | Mis mascotas | `app/client/pets.tsx` / `/client/pets` | PROFILE-01; C | listado, Agregar mascota, cards | vacío/varias mascotas | PET-02, PET-03 | Producción |
| PET-02 | Crear/editar mascota | `app/client/pet-form.tsx` / `/client/pet-form` | Perfil/PET-01/PET-03; C | foto; formulario completo; selectores y toggles; modales error/éxito | modo create/edit; obligatorios y teléfono emergencia | PET-01/PET-03 | Producción |
| PET-03 | Detalle mascota | `app/client/pet-detail.tsx` / `/client/pet-detail` | Profile/PET-01; C | identidad, salud, veterinario/clínica, vacuna/carnet mock, emergencia, historial, Editar | historial filtrable por fecha; el carnet seed se consulta, no se carga desde PET-02 | PET-02, PET-04, BOOKING-03 | Producción |
| PET-04 | Estadísticas e historial | `app/client/pet-stats.tsx` vía `/client/pet-stats` y `/client/pet-analytics` | Perfil/PET-03; C | métricas, barras, rango de fechas, detalle de actividad | dos rutas apuntan a la misma UI | BOOKING-03, back | Producción |

## Paseos cliente, reserva y checkout

| ID | Nombre | Archivo / ruta | Entrada y audiencia | Información y UI | Estados/condiciones | Salidas | Tipo |
|---|---|---|---|---|---|---|---|
| WALK-01 | Buscar paseadores | `app/client/providers.tsx` / `/client/providers` | HOME-01 → Buscar; C | lista/mapa, ubicación, filtros Mejor valorados/Cercanos/Verificados, cards | radio de distancia; resultado vacío; mapa nativo/web | WALK-02, CHAT-01 | Producción |
| WALK-02 | Perfil público proveedor | `app/client/provider-detail.tsx` / `/client/provider-detail` | WALK-01/favoritos; C | foto, online, escudo, nivel, respuesta, reseñas modal, ficha, tarifa, planes, condiciones, favoritos | solo perfiles/planes publicados/aprobados; servicio no habilitado muestra aviso | CHAT-01, CHECKOUT-01 | Producción |
| CHECKOUT-01 | Checkout de servicio | `app/client/service-checkout.tsx` / `/client/service-checkout` | Perfil proveedor/plan/oferta; C | resumen, mascota, dirección/preferencias, donación, desglose, pago, términos y privacidad | requiere ambas aceptaciones; oferta o plan aprobado; Paseo habilitado | SETTINGS-03, BOOKING-02 | Producción |
| BOOKING-02 | Confirmación de reserva | `app/client/booking-confirmation.tsx` / `/client/booking-confirmation` | CHECKOUT-01; C | éxito, resumen, recordatorios, abrir reserva/inicio | booking recién creado | BOOKING-03, HOME-01 | Producción |
| BOOKING-03 | Detalle de reserva | `app/client/booking-detail.tsx` / `/client/booking-detail` | BOOKING-01, soporte, mascota; C | estado, datos, pagos, timeline, chat, cancelar, temporizador, soporte, reseña; modales confirmación/éxito | scheduled/in_progress/completed/cancelled; cancelación por cliente/proveedor | CHAT-01, SUPPORT-01, BOOKING-01 | Producción |

## Chat y soporte

| ID | Nombre | Archivo / ruta | Entrada y audiencia | Información y UI | Estados/condiciones | Salidas | Tipo |
|---|---|---|---|---|---|---|---|
| SUPPORT-01 | Hub Chat/Soporte | `app/(tabs)/support.tsx` / `/support` (inicio) | Tab/Perfil; C | FAQ accordions, opciones, redes oficiales, crear/ver casos, conversaciones | maneja enlaces externos de forma segura | SUPPORT-02/03, CHAT-01 | Producción |
| SUPPORT-02 | Crear ticket | mismo archivo/ruta, `view=create` | SUPPORT-01, pedido o reserva; C | selector modal motivo, “Otro”, pedido/reserva relacionada, descripción, Enviar | “Otro” >=5; descripción requerida; contexto precargado | SUPPORT-04/CHAT-01 | Producción |
| SUPPORT-03 | Mis tickets | mismo archivo/ruta, `view=tickets` | SUPPORT-01; C | cards por estado y relación | Abierto/En revisión/Esperando respuesta/Resuelto/Cerrado | SUPPORT-04 | Producción |
| SUPPORT-04 | Detalle ticket | mismo archivo/ruta, `view=ticket-detail` | SUPPORT-03; C | metadatos, interacciones, agregar actualización, cerrar caso, abrir chat | solo casos abiertos aceptan actualización/cierre | CHAT-01, ORDER-02, BOOKING-03 | Producción |
| CHAT-01 | Conversación compartida | `app/chat.tsx` / `/chat` | soporte, reserva, oferta, provider; C/P | presencia online/offline, escudo, respuesta, seguridad, mensajes, cámara/foto/documento, oferta, teclado; cards y modal oferta | viewer client/provider/admin; chat servicio requiere request; riesgo contacto externo puede alertar/bloquear | CHECKOUT-01, ORDER-02/05 | Producción |

## Marketplace cliente

| ID | Nombre | Archivo / ruta | Entrada y audiencia | Información y UI | Estados/condiciones | Salidas | Tipo |
|---|---|---|---|---|---|---|---|
| MARKET-02 | Todas las tiendas | `app/marketplace/all-stores.tsx` / `/marketplace/all-stores` | MARKET-01; C | listado tiendas | tiendas mock | MARKET-03 | Producción |
| MARKET-03 | Tienda oficial | `app/marketplace/official-store.tsx` / `/marketplace/official-store` | MARKET-01/MARKET-02; C | tienda, insignias, productos | tienda existente | PRODUCT-03 | Producción |
| PRODUCT-01 | Todos los productos | `app/marketplace/all-products.tsx` / `/marketplace/all-products` | MARKET-01; C | grid/listado | catálogo disponible | PRODUCT-03 | Producción |
| PRODUCT-02 | Categoría | `app/marketplace/category.tsx` / `/marketplace/category` | MARKET-01; C | nombre categoría, productos | category param | PRODUCT-03 | Producción |
| PRODUCT-03 | Detalle producto | `app/marketplace/product-detail.tsx` / `/marketplace/product-detail` | listados/tienda/orden; C | galería, precio por método, variaciones, cantidad, stock, comentario, carrito/Comprar | combinación válida y stock; modal insuficiente | CHECKOUT-02/03 | Producción |
| CHECKOUT-02 | Carrito | `app/marketplace/cart.tsx` / `/marketplace/cart` | MARKET-01/PRODUCT-03; C | items, variaciones, cantidad, eliminar, stock, resumen | ajusta/remueve no disponibles | PRODUCT-03, CHECKOUT-03 | Producción |
| CHECKOUT-03 | Checkout Marketplace | `app/marketplace/checkout.tsx` / `/marketplace/checkout` | carrito/Comprar; C | 8 bloques: productos, facturación, dirección, envío, pago, saldo, cupón, aceptaciones; editores y modales | stock válido, dirección/facturación/pago, 2 consentimientos | ADDRESS-01, CHECKOUT-04, PAYMENT-02/03, ORDER-01 | Producción |
| CHECKOUT-04 | Cupones | `app/marketplace/coupons.tsx` / `/marketplace/coupons` | MARKET-01/CHECKOUT-03; C | disponibles/usados, reservar/aplicar | `activeCheckout` devuelve cupón al checkout | CHECKOUT-03 | Producción |
| PAYMENT-02 | Pago Deuna | `app/marketplace/payment-deuna.tsx` / `/marketplace/payment-deuna` | CHECKOUT-03; C | QR/simulación, confirmar | pago mock | ORDER-01 | Producción |
| PAYMENT-03 | Transferencia bancaria | `app/marketplace/payment-transfer.tsx` / `/marketplace/payment-transfer` | CHECKOUT-03; C | banco, cuenta, referencia, adjuntar comprobante mock | comprobante pendiente/enviado | ORDER-01 | Producción |
| PAYMENT-04 | Saldo Hupi | `app/marketplace/wallet.tsx` / `/marketplace/wallet` | Perfil/Marketplace; C | saldo disponible, movimientos, filtros | reembolso/crédito/débito mock | back | Producción |
| ORDER-01 | Confirmación de pedido | `app/marketplace/order-confirmation.tsx` / `/marketplace/order-confirmation` | Checkout/pago; C | resultado confirmado o pendiente, resumen, tracking/pedidos | varía por método/status | ORDER-03/04, MARKET-01 | Producción |
| ORDER-02 | Detalle pedido cliente | `app/marketplace/order-detail.tsx` / `/marketplace/order-detail` | Pedidos/notificación/soporte; C | estado, items, entrega, timeline, comprobante, recibo/factura, soporte, reseña modal | acciones dependen de estado/pago/entrega | SUPPORT-02, PRODUCT-03 | Producción |
| ORDER-03 | Tracking pedido | `app/marketplace/order-tracking.tsx` / `/marketplace/order-tracking` | confirmación/notificación; C | timeline, guía, entrega | estado pedido | ORDER-02 | Producción |
| ORDER-04 | Mis pedidos | `app/marketplace/orders.tsx` / `/marketplace/orders` | Perfil/Marketplace/confirmación; C | tabs/filtros y cards | estados y pedidos vacíos | ORDER-02 | Producción |
| NOTIFY-01 | Notificaciones cliente | `app/marketplace/notifications.tsx` / `/marketplace/notifications` | campanas; C | leído/no leído, CTA coral; swipe izquierda abrir/derecha eliminar | contador cambia; acciones por target | cupones, tracking, pedidos, marketplace | Producción |

## Modo proveedor y Marketplace proveedor

| ID | Nombre | Archivo / ruta | Entrada y audiencia | Información y UI | Estados/condiciones | Salidas | Tipo |
|---|---|---|---|---|---|---|---|
| PROVIDER-01 | Dashboard proveedor | `app/provider/index.tsx` / `/provider` | Home/Profile/login proveedor; P | header, progreso verificación, indicadores, macroservicios Paseos/Tienda, mensajes, notificaciones, volver a cliente | servicios bloqueados hasta aprobación general | VERIFY-01, WALK-03, MARKET-04, CHAT-02, NOTIFY-02, HOME-01 | Producción |
| VERIFY-01 | Verificación proveedor | `app/provider/verification.tsx` / `/provider/verification` | Dashboard/onboarding/QA; P | progreso, tipo Natural/Jurídica, accordions, estados sección, enviar, continuar más tarde | 7 secciones por tipo; submit solo completo; QA puede preabrir sección | PROVIDER-01/HOME-01 | Producción (preview DEV) |
| MARKET-04 | Mi tienda Marketplace | `app/provider/marketplace-store.tsx` / `/provider/marketplace-store` | Dashboard aprobado; P | resumen, indicadores y accesos Pedidos/Productos/Envíos/Perfil/Finanzas | bloqueado si proveedor no aprobado | ORDER-06, PRODUCT-05, MARKET-05/06, PAYMENT-05 | Producción |
| ORDER-06 | Pedidos Marketplace proveedor | `app/provider/marketplace-orders.tsx` / `/provider/marketplace-orders` | MARKET-04; P | cards contraídas, una expandida, estados/pago, Gestionar | accordion; subpedidos por tienda | ORDER-05 | Producción |
| ORDER-05 | Gestionar pedido proveedor | `app/provider/marketplace-order-detail.tsx` / `/provider/marketplace-order-detail` | ORDER-06/notificación/chat; P | cliente/items/pago/entrega, guía, evidencia, incidencias, actividad, siguiente estado; modales adjunto | pago puede bloquear; evidencia al pasar a En camino; guía requerida salvo pickup | CHAT-01 | Producción |
| PRODUCT-05 | Mis productos | `app/provider/products.tsx` / `/provider/products` | MARKET-04/notificación; P | listado, estado, stock, crear/editar | draft/pending/approved/rejected etc. | PRODUCT-04 | Producción |
| PRODUCT-04 | Crear/editar producto | `app/provider/product-editor.tsx` / `/provider/product-editor` | PRODUCT-05; P | formulario largo, imagen principal, atributos/variaciones, stock, dimensiones, guardar/publicar; modales | validación producto y variación; estado activo | PRODUCT-05 | Producción |
| MARKET-05 | Métodos de envío | `app/provider/shipping-settings.tsx` / `/provider/shipping-settings` | MARKET-04; P | cards Estándar/Express/Retiro, toggle, horas, costo, instrucciones | horas enteras; costo acepta coma y 2 decimales | back | Producción |
| MARKET-06 | Perfil de tienda | `app/provider/store-profile.tsx` / `/provider/store-profile` | MARKET-04/notificación; P | datos legales readonly, datos públicos, tipos/categorías, horario, logo, ticket legal accordion | local físico condiciona horario; datos validados bloqueados | crea ticket local; permanece en pantalla | Producción |
| PAYMENT-05 | Finanzas Marketplace | `app/provider/marketplace-finance.tsx` / `/provider/marketplace-finance` | MARKET-04/notificación; P | ventas, comisión, saldo/liquidaciones | datos mock | back | Producción |
| CHAT-02 | Mensajes proveedor | `app/provider/messages.tsx` / `/provider/messages` | Dashboard; P | lista de conversaciones y estado | soporte/servicios | CHAT-01 | Producción |
| NOTIFY-02 | Notificaciones proveedor | `app/provider/notifications.tsx` / `/provider/notifications` | Dashboard; P | leído/no leído, CTA coral, swipe abrir/eliminar | targets validados a rutas proveedor/soporte | MARKET-04/06, PRODUCT-05, ORDER-05/06, PAYMENT-05, SUPPORT-01 | Producción |

## Paseos proveedor (vistas internas de `/provider/walks`)

| ID | Nombre | Archivo / ruta | Entrada y audiencia | Información y UI | Estados/condiciones | Salidas | Tipo |
|---|---|---|---|---|---|---|---|
| WALK-03 | Paseos · resumen | `app/provider/walks.tsx` / `/provider/walks` | Dashboard aprobado; P | tarifa/estado, métricas y siete menu cards | approval Paseos `approved` o `pending_approval` visible | WALK-04–11 | Producción |
| WALK-04 | Tarifa | mismo archivo / sección `rate` | WALK-03; P | tarifa por hora decimal, Guardar | >0; coma/punto hasta 2 decimales | WALK-03 | Producción |
| WALK-05 | Mis agendamientos | mismo archivo / sección `appointments` | WALK-03; P | bookings Paseo, estado, cliente, mascota, payout | mismo repositorio que cliente | WALK-12 | Producción |
| WALK-06 | Solicitudes | mismo archivo / sección `requests` | WALK-03; P | coordinación → chat; solicitudes aceptar/rechazar | creada/aceptada/rechazada | CHAT-01 | Producción |
| WALK-07 | Mis planes | mismo archivo / sección `plans` | WALK-03; P | lista, detalle, crear/editar modal, duplicar, archivar, enviar | gestión solo con perfil/servicio/checklist aptos | modal plan; WALK-03 | Producción |
| WALK-08 | Ficha pública | mismo archivo / sección `publicProfile` | WALK-03; P | descripción, tamaños/edades, modalidad, tipo, manejo, requisitos, certificaciones, condiciones; accordions | checklist y estados draft/review/approved | WALK-03 | Producción |
| WALK-09 | Disponibilidad | mismo archivo / sección `availability` | WALK-03; P | aviso informativo | no existe calendario editable actual | WALK-03 | Producción |
| WALK-10 | Resumen financiero/operativo | mismo archivo / sección `finance` | WALK-03; P | agendamientos, completados, cancelaciones/tasa, puntualidad, ingresos | métricas derivadas de bookings | WALK-03 | Producción |
| WALK-11 | Configuración/condiciones | mismo archivo / sección `configuration` | WALK-03; P | accordion condiciones estándar y estado aprobación | informativo; incluye extensión hasta 40 min | WALK-03 | Producción |
| WALK-12 | Detalle agendamiento proveedor | `app/provider/walk-booking-detail.tsx` / `/provider/walk-booking-detail` | WALK-05; P | booking, payout, tiempos, retraso, temporizador, Iniciar/Finalizar/Cancelar/Chat; confirm modal | acciones por estado; cancelación proveedor deja payout 0 | CHAT-01, WALK-05 | Producción |

## Herramientas de desarrollo

| ID | Nombre | Archivo / ruta | Entrada y audiencia | Información y UI | Estados/condiciones | Salidas | Tipo |
|---|---|---|---|---|---|---|---|
| QA-01 | Perfiles de prueba | `app/client/qa-profiles.tsx` / `/client/qa-profiles` | SETTINGS-02; DEV | 8 cards con nombre, descripción, proveedor, Paseos, Aplicar | redirect `/home` si no `__DEV__`; perfil activo marcado/persistido | welcome/profile/provider/verification según escenario | DEV_QA |
| QA-02 | Herramientas verificación | `app/client/qa-provider-verification.tsx` / `/client/qa-provider-verification` | SETTINGS-02; DEV | paso pendiente, Reiniciar, Ir a pasos 1–9 | redirect producción; paso 9 abre revisión sin accordion específico | VERIFY-01 con `qaStep` | DEV_QA |
| QA-03 | Control paseo QA | `app/client/qa-walk.tsx` / `/client/qa-walk` | SETTINGS-02; DEV | booking `QA-WALK-001`, partes, timestamps; reset/in progress/completed/cancelled | redirect producción; único booking compartido | estado local, luego BOOKING-03/WALK-12 manualmente | DEV_QA |

## Rutas presentes pero no inventariadas como pantallas reales

- `/` (`app/index.tsx`): puente del guard, sin función propia.
- `/client/chat-detail`: alias a `/chat`, no hay enlace UI actual.
- `/marketplace/order-history` y `/marketplace/order-history-detail`: aliases sin enlace UI; la app usa `/marketplace/orders` y `/marketplace/order-detail`.
- `/marketplace/payment-proof`: alias sin enlace UI; el comprobante se gestiona en transferencia/detalle.
- `/provider/support-request`: implementación aislada para responder una solicitud Hupi, sin entrada desde la UI actual.
- Layouts `_layout.tsx`: contenedores de navegación, no pantallas.
