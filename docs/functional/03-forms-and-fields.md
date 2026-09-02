# 03 · Formularios y campos

## Alcance

Se catalogan **38 formularios editables** (`FORM-01`–`FORM-38`). “Obligatorio” refleja la validación que realmente bloquea la acción actual; un asterisco visual sin bloqueo se anota en Validación. “Destino” indica el estado local o navegación al guardar.

## Cuenta y perfil

| Flujo | Pantalla ID | Sección | Campo | Tipo | Obligatorio | Opcional | Condicional | Opciones | Validación | Placeholder | Dato reutilizado | Editable | Destino al guardar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FORM-01 Login | AUTH-03 | Credenciales | Celular | teléfono país+número | Sí | No | No | países del selector | número local válido; Ecuador 10 con 0 o 9 sin 0 | número celular | `session.pendingPhone` | Sí | inicio de sesión local |
| FORM-01 | AUTH-03 | Credenciales | Contraseña | password | Sí | No | No | — | no vacía | contraseña | cuenta local | Sí | sesión local |
| FORM-02 Registro cliente | AUTH-04 | Cuenta | Celular | teléfono | Sí | No | No | país+número | mínimo válido por país | número | — | Sí | verificación pendiente |
| FORM-02 | AUTH-04 | Cuenta | Contraseña | password | Sí | No | No | — | >=6 caracteres | contraseña | — | Sí | cuenta local |
| FORM-02 | AUTH-04 | Legal | Aceptar términos/privacidad | checkbox | Sí | No | No | sí/no | debe estar activo | — | — | Sí | cuenta local |
| FORM-03 Recuperación | AUTH-06 | Método | Canal | radio | Sí | No | No | Correo; SMS | una opción | — | — | Sí | recovery pending |
| FORM-03 | AUTH-06 | Identificador | Correo | email | Sí | No | canal correo | — | trim, lowercase, sintaxis email | correo@ejemplo.com | perfil si existe | Sí | OTP recovery |
| FORM-03 | AUTH-06 | Identificador | País + celular | teléfono | Sí | No | canal SMS | países | formato teléfono | número | perfil si existe | Sí | OTP recovery |
| FORM-04 OTP | AUTH-05 | Código | Código | OTP 6 celdas | Sí | No | No | dígitos | exactamente `123456` en mock | — | canal pendiente | Sí | phoneVerified/recovery |
| FORM-05 Alta proveedor | AUTH-08 | Tipo | Tipo de proveedor | radio/cards | Sí | No | No | Persona Natural; Persona Jurídica | una opción | — | enrollment existente | Sí | ProviderEnrollment |
| FORM-05 | AUTH-08 | Datos básicos | Nombre | texto | Sí | No | No | — | no vacío | — | User.firstName | Sí | User |
| FORM-05 | AUTH-08 | Datos básicos | Apellido | texto | Sí | No | No | — | no vacío | — | User.lastName | Sí | User |
| FORM-05 | AUTH-08 | Datos básicos | Celular | teléfono | Sí | No | No | país+número | válido; luego SMS | — | User.phone | Sí | User/session |
| FORM-05 | AUTH-08 | Datos básicos | Correo | email | Sí | No | No | — | sintaxis; sin código | — | User.email | Sí | User |
| FORM-05 | AUTH-08 | Datos básicos | Contraseña | password | Sí | No | No | — | >=6 | — | cuenta | Sí | cuenta |
| FORM-05 | AUTH-08 | Legal | Consentimiento | checkbox | Sí | No | No | sí/no | bloquea continuar | — | — | Sí | cuenta |
| FORM-06 Onboarding cliente | ONBOARD-02 | Perfil | Foto | cámara/galería | No | Sí | No | tomar/elegir/eliminar | URI local | — | User.photo | Sí | User |
| FORM-06 | ONBOARD-02 | Perfil | Nombre | texto | Sí | No | No | — | no vacío | — | User.firstName | Sí | User |
| FORM-06 | ONBOARD-02 | Perfil | Apellido | texto | Sí | No | No | — | no vacío | — | User.lastName | Sí | User |
| FORM-06 | ONBOARD-02 | Perfil | Correo de recuperación | email | Sí | No | No | — | email válido | correo@ejemplo.com | User.email | Sí | User |
| FORM-06 | ONBOARD-02 | Perfil | Celular verificado | readonly | Sí | No | No | — | debe existir/verificado | — | User.phone | No | — |
| FORM-07 Editar perfil | PROFILE-02 | Perfil | Foto/nombre/apellido/correo | imagen + textos | Sí salvo foto | foto | No | — | perfil completo/email válido | según campo | User | Sí | User único |
| FORM-07 | PROFILE-02 | Perfil | Celular | readonly | Sí | No | No | — | badge verificado | — | User.phone | No | — |
| FORM-08 Contraseña | PROFILE-02 | Modal | Actual; Nueva; Confirmar | password ×3 | Sí | No | No | — | actual requerida; nueva según policy; confirmación igual | — | sesión | Sí | contraseña local |

## Home, dirección, mascota y facturación

| Flujo | Pantalla ID | Sección | Campo | Tipo | Obligatorio | Opcional | Condicional | Opciones | Validación | Placeholder | Dato reutilizado | Editable | Destino al guardar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FORM-09 Buscar paseo | HOME-01 | Paseo | Fecha | date picker | Sí | No | No | >=hoy | no pasada | Seleccionar fecha | búsqueda | Sí | query de proveedores |
| FORM-09 | HOME-01 | Paseo | Hora | time picker | Sí | No | No | hora | si hoy, futura | Seleccionar hora | — | Sí | query |
| FORM-09 | HOME-01 | Paseo | Duración | stepper/número | Sí | No | No | 1–4 horas | entero, clamp 1–4 | 1 | — | Sí | query |
| FORM-09 | HOME-01 | Paseo | Ubicación | selector | Sí | No | No | direcciones; actual; nueva | dirección válida | Selecciona una ubicación | Address | Sí | query/Address |
| FORM-09 | HOME-01 | Paseo | Mascota | cards | Sí | No | No | mascotas existentes; agregar | una seleccionada | — | Pet | Sí | selectedServicePet |
| FORM-09 | HOME-01 | Paseo | Notas | multiline | No | Sí | No | — | sin bloqueo | rutina/cuidado | Pet.careInstructions como referencia visual | Sí | request local |
| FORM-10 Dirección | ADDRESS-01 | Identidad | Etiqueta | chips | Sí | No | No | Casa; Trabajo; Otro | Otro exige etiqueta personalizada | — | Address.labelType | Sí | Address |
| FORM-10 | ADDRESS-01 | Identidad | Etiqueta personalizada | texto | Sí | No | etiqueta Otro | — | no vacía | Ej. Casa de mamá | Address.customLabel | Sí | Address |
| FORM-10 | ADDRESS-01 | Identidad | Ícono | chips | Sí | No | No | home; briefcase; heart; people; school; fitness; medical; location | uno | — | Address.iconKey | Sí | Address |
| FORM-10 | ADDRESS-01 | Mapa | Coordenada | mapa/current location | Sí | No | No | pin/ubicación actual | permiso; lat/lng; reverse geocode | — | Address.coordinate | Sí | Address |
| FORM-10 | ADDRESS-01 | Dirección | Calle | texto | Sí | No | No | — | >=4 para geocode; no vacía | Calle y avenida | Address.streetAddress | Sí | Address |
| FORM-10 | ADDRESS-01 | Dirección | Número | texto | No | Sí | No | — | trim | Número de casa | Address.houseNumber | Sí | Address |
| FORM-10 | ADDRESS-01 | Dirección | Referencia | texto | No | Sí | No | — | trim | Referencia | Address.reference | Sí | Address |
| FORM-10 | ADDRESS-01 | Dirección | Provincia | selector | Sí | No | No | 24 provincias Ecuador | una opción | Selecciona provincia | Address.province | Sí | Address |
| FORM-10 | ADDRESS-01 | Dirección | Ciudad | selector | Sí | No | No | ciudades de provincia | una opción | Selecciona ciudad | Address.city | Sí | Address |
| FORM-10 | ADDRESS-01 | Dirección | País | readonly | Sí | No | No | Ecuador | fijo | — | Address.country | No | — |
| FORM-10 | ADDRESS-01 | Dirección | Código postal | texto | No | Sí | No | — | trim | — | Address.postalCode | Sí | Address |
| FORM-10 | ADDRESS-01 | Preferencias | Predeterminada | checkbox | No | Sí | No | sí/no | solo una global al persistir | — | Address.isDefault | Sí | Address |
| FORM-11 Preferencias dirección | ADDRESS-01/CHECKOUT-01/03 | Lugar | Tipo de lugar | radio | Sí | No | No | Casa; Edificio/departamento; Conjunto residencial; Oficina/local | cambia puntos disponibles y limpia detalle | — | Address.deliveryPreferences | Sí | Address o checkout-only |
| FORM-11 | mismas | Encuentro/entrega | Punto | radio | Sí | No | por lugar | Casa: puerta exterior, garaje/patio, afuera, otro; Edificio: entrada, lobby, seguridad, puerta depto, afuera, otro; Conjunto: garita, entrada casa, puerta depto, punto específico, otro; Oficina: recepción, entrada edificio, puerta local, afuera, otro | debe pertenecer al lugar | — | preferencias | Sí | preferencias |
| FORM-11 | mismas | Puerta depto | Edificio; torre/bloque; piso; depto/oficina; nombre timbre; código acceso; ascensor | textos + radio | No | Sí | punto `apartment_door` | Ascensor Sí/No | sin bloqueo individual | según campo | preferencias | Sí | preferencias |
| FORM-11 | mismas | Recepción | Edificio; recibe; horario/restricciones | textos | No | Sí | lobby/seguridad/recepción | — | sin bloqueo | — | preferencias | Sí | preferencias |
| FORM-11 | mismas | Entrada edificio | Tipo entrada | radio | Sí | No | `building_entrance` | Principal; Lateral; Parqueadero; Otro | una | — | preferencias | Sí | preferencias |
| FORM-11 | mismas | Entrega | Modalidad | radio | Sí | No | No | Entregar al cliente; Dejar en ubicación (copy cambia para servicio) | una | — | preferencias | Sí | preferencias |
| FORM-11 | mismas | Llegada | Contacto | radio | Sí | No | No | Chat; Llamada; Chat y llamada; Solo instrucciones | una | — | preferencias | Sí | preferencias |
| FORM-11 | mismas | Llegada | Instrucciones | multiline | No | Sí | No | — | trim | instrucciones | preferencias | Sí | preferencias |
| FORM-12 Mascota | PET-02 | Identidad | Foto; Nombre | imagen+texto | nombre Sí | foto | No | cámara/galería | nombre no vacío | Ej. Milo | Pet | Sí | Pet |
| FORM-12 | PET-02 | Identidad | Especie | selector | Sí | No | No | Perro; Gato | una | Selecciona especie | Pet.species | Sí | Pet |
| FORM-12 | PET-02 | Identidad | Raza | buscador/selector | Sí | No | especie | cat/dog breed catalog | una | Buscar raza | Pet.breed | Sí | Pet |
| FORM-12 | PET-02 | Datos | Nacimiento; Edad; Peso kg | fecha/texto/número decimal | peso Sí | nacimiento/edad | No | — | fecha DD/MM/YYYY; edad dígitos; peso decimal | DD/MM/AAAA; Ej. 3; Ej. 12,5 | Pet | Sí | Pet |
| FORM-12 | PET-02 | Datos | Sexo | selector | No | Sí | No | Macho; Hembra | — | Selecciona sexo | Pet.sex | Sí | Pet |
| FORM-12 | PET-02 | Datos | Tamaño | selector | Sí | No | No | Pequeño; Mediano; Grande; Muy grande | una | Selecciona tamaño | Pet.size | Sí | Pet |
| FORM-12 | PET-02 | Conducta | Actividad | selector | No | Sí | No | Muy baja; Baja; Media; Alta | — | Selecciona actividad | Pet | Sí | Pet |
| FORM-12 | PET-02 | Conducta | Comportamiento | selector | Sí | No | No | Agresivo; Social; Nervioso; Tímido | una | Selecciona comportamiento | Pet | Sí | Pet |
| FORM-12 | PET-02 | Conducta | Descripción; ¿Muerde? | multiline + selector | muerde Sí | descripción | No | ¿Muerde?: Sí; No | bites no null | texto de observaciones | Pet | Sí | Pet |
| FORM-12 | PET-02 | Salud | Alergias; Medicamentos; Veterinario; Clínica | textos | No | Sí | No | — | sin bloqueo | Ej. ninguno | Pet | Sí | Pet |
| FORM-12 | PET-02 | Emergencia | Nombre; país; teléfono | texto+teléfono | No | Sí | si se escribe teléfono | países | teléfono válido | contacto/número | Pet.emergencyContact | Sí | Pet |
| FORM-12 | PET-02 | Cuidado | Instrucciones | multiline | No | Sí | No | — | — | algo importante | Pet | Sí | Pet |
| FORM-12 | PET-02 | Salud | Vacunas al día; Esterilizado | toggles | No | Sí | No | Sí/No | boolean | — | Pet | Sí | Pet |
| FORM-13 Facturación | BILLING-01 | Tipo | Contribuyente | chips | Sí | No | No | Persona Natural; Persona Jurídica | una | — | BillingProfile | Sí | BillingProfile |
| FORM-13 | BILLING-01 | Identidad | Tipo identificación | chips | Sí | No | natural | Cédula; RUC | Jurídica fuerza RUC | — | BillingProfile | Sí | BillingProfile |
| FORM-13 | BILLING-01 | Identidad | Número; nombres/razón social | texto | Sí visualmente | No | No | — | pantalla standalone no bloquea vacíos; checkout sí exige | — | BillingProfile | Sí | BillingProfile |
| FORM-13 | BILLING-01 | Contacto | Correo; teléfono; dirección fiscal | email/teléfono/multiline | correo/teléfono visual | dirección fiscal para jurídica | tipo jurídica | — | checkout exige email y fiscal para jurídica | — | BillingProfile | Sí | BillingProfile |
| FORM-13 | BILLING-01 | Preferencia | Predeterminado | checkbox | No | Sí | No | Sí/No | primera queda default | — | BillingProfile | Sí | BillingProfile |
| FORM-14 Tarjeta perfil | PAYMENT-01 | Tarjeta | Marca | chips | Sí | No | No | Visa; Mastercard | una | — | PaymentMethod | Sí | PaymentMethod |
| FORM-14 | PAYMENT-01 | Tarjeta | Últimos 4; titular; vencimiento | número/texto | Sí visualmente | No | No | — | últimos 4 se recortan; no bloqueo adicional | 4242; nombre; MM/AA | PaymentMethod | Sí | PaymentMethod |

## Verificación de proveedor

| Flujo | Pantalla ID | Sección | Campo | Tipo | Obligatorio | Opcional | Condicional | Opciones | Validación | Placeholder | Dato reutilizado | Editable | Destino al guardar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FORM-15 Cuenta | VERIFY-01 | Cuenta | Nombre; apellido; celular; correo | readonly | Sí | No | No | — | nombres/teléfono/email; phoneVerified; emailValidated | — | User único | No | — |
| FORM-15 | VERIFY-01 | Cuenta | Validar correo | acción | Sí | No | si no validado | — | marca local; sin OTP | — | User.email | Sí acción | enrollment.emailValidated |
| FORM-16 Natural personal | VERIFY-01 | Personal | Nombres | readonly | Sí | No | natural | — | User completo | — | User | No | — |
| FORM-16 | VERIFY-01 | Personal | Cédula; nacimiento; nacionalidad | número/texto | Sí | No | natural | — | todos no vacíos; fecha sin parser estricto | DD/MM/AAAA | ProviderIdentity | Sí | ProviderDraft.identity |
| FORM-16 | VERIFY-01 | Personal | Página web | URL keyboard | No | Sí | natural | — | no se valida URL para completar | — | ProviderDraft.website | Sí | draft |
| FORM-17 Identidad natural | VERIFY-01 | Identidad | Selfie; cédula frente; cédula reverso | cámara | Sí | No | natural | frontal; posterior; posterior | las 3 URI confirmadas | — | — | Sí | draft.identity |
| FORM-18 Dirección proveedor | VERIFY-01 | Dirección | Dirección; ciudad; sector; número | textos | Sí | No | No | — | todos no vacíos | — | Address default al iniciar natural | Sí | draft.address/company |
| FORM-18 | VERIFY-01 | Dirección | Tipo | chips | Sí | No | No | Casa; Edificio | una | — | inferida de Address | Sí | draft |
| FORM-18 | VERIFY-01 | Dirección | Edificio; departamento/oficina | textos | Sí | No | tipo Edificio | — | ambos no vacíos | — | Address parcialmente | Sí | draft |
| FORM-19 Contacto | VERIFY-01 | Contacto | Usar representante | toggle | No | Sí | jurídica | Sí/No | copia/bloquea campos | — | LegalRepresentative | Sí | contactIsLegalRepresentative |
| FORM-19 | VERIFY-01 | Contacto | Nombre; apellido; rol; teléfono; correo | textos | Sí | rol solo bloquea jurídica | No | — | email válido; rol requerido jurídica | — | representante si toggle | según toggle | draft.contact |
| FORM-20 Banco | VERIFY-01 | Bancario | Banco; tipo cuenta; número; titular; ID titular | textos | Sí | No | No | libres, no catálogo | todos no vacíos; número solo dígitos | — | ProviderBankDetails | Sí | draft.bank |
| FORM-21 General natural | VERIFY-01 | General | Información general | multiline | Sí | No | natural | — | no vacía | — | — | Sí | draft.generalInformation |
| FORM-21 | VERIFY-01 | General | Web | URL keyboard | No | Sí | natural | — | no bloquea | — | draft.website | Sí | draft |
| FORM-22 Empresa | VERIFY-01 | Empresa | Razón social; nombre comercial; RUC; tipo compañía; constitución | textos/número | Sí | No | jurídica | — | todos no vacíos; RUC keyboard numérico | DD/MM/AAAA | Company | Sí | draft.company |
| FORM-22 | VERIFY-01 | Empresa | Teléfono; correo empresa; web | teléfono/email/url | teléfono+email Sí | web | jurídica | — | email válido; web no bloquea | — | Company | Sí | draft.company |
| FORM-23 Documentos empresa | VERIFY-01 | Documentos | RUC; constitución; nombramiento representante | adjunto mock | Sí | No | jurídica | Adjuntar/Reemplazar | URI para los 3 | — | — | Sí | companyDocuments |
| FORM-24 Representante | VERIFY-01 | Representante | Nombre; apellido; cédula; teléfono; correo | textos | Sí | No | jurídica | — | email válido; todos no vacíos | — | User se precarga al crear jurídica | Sí | legalRepresentative |
| FORM-24 | VERIFY-01 | Representante | Selfie; cédula frente/reverso | cámara | Sí | No | jurídica | frontal/posterior | 3 URI | — | — | Sí | legalRepresentative |
| FORM-25 Envío verificación | VERIFY-01 | Revisión | Enviar | submit | Sí | No | progreso 100%; estado in_progress/changes_requested | — | 0 secciones faltantes | — | todas las secciones | acción | under_review + submittedAt |

## Servicio Paseos y reserva

| Flujo | Pantalla ID | Sección | Campo | Tipo | Obligatorio | Opcional | Condicional | Opciones | Validación | Placeholder | Dato reutilizado | Editable | Destino al guardar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FORM-26 Checkout paseo | CHECKOUT-01 | Selección | Dirección y preferencias | selector + FORM-11 | Sí | preferencias editables | No | direcciones | dirección existente | — | Address | Sí | booking; opcional Address |
| FORM-26 | CHECKOUT-01 | Donación | Aporte | chips/decimal | No | Sí | Otro abre input | $0;$1;$2;$5;Otro | >=0, redondeo 2 decimales | 0.00 | — | Sí | booking total |
| FORM-26 | CHECKOUT-01 | Pago | Método | radio | Sí | No | No | Tarjeta 4242; Transferencia; Deuna | una | — | PaymentMethod visual | Sí | booking |
| FORM-26 | CHECKOUT-01 | Pago | Guardar método | checkbox | No | Sí | No | Sí/No | solo visual | — | — | Sí | no persistencia real |
| FORM-26 | CHECKOUT-01 | Legal | Términos estándar; privacidad | checkbox ×2 | Sí | No | No | aceptar | ambos true | — | terms version | Sí | TermsAcceptance/booking |
| FORM-27 Cancelación | BOOKING-03 | Reembolso | Método | radio | Sí | No | booking cancelable | Saldo Hupi; Método original | una | — | booking/payment | Sí | booking.cancellation |
| FORM-27 | BOOKING-03 | Confirmación | Confirmar | modal | Sí | No | después de quote | Volver; Aceptar | muestra cargo/reembolso | — | cancellation quote | Sí | booking Cancelada |
| FORM-28 Reseña paseo | BOOKING-03 | Reseña | Estrellas; tags | rating + multi chips | rating Sí | tags | booking completado | 1–5; tags visibles | rating clamp 1–5 | — | booking | Sí | review map local |
| FORM-29 Tarifa | WALK-04 | Precio | Tarifa/hora | decimal | Sí | No | No | — | >0; coma/punto, 2 decimales | 0,00 | provider.servicePrices.walk | Sí | provider mock |
| FORM-30 Ficha Paseos | WALK-08 | Acerca | Descripción | multiline | Sí | No | No | — | trim, máximo 150 | descripción | walk profile | Sí | profile draft |
| FORM-30 | WALK-08 | Configuración | Tamaños | multi chips | Sí | No | No | pequeño; mediano; grande; gigante | >=1 | — | walk profile | Sí | draft |
| FORM-30 | WALK-08 | Configuración | Edades | multi chips | Sí | No | No | cachorro; adulto | >=1 | — | walk profile | Sí | draft |
| FORM-30 | WALK-08 | Configuración | Máximo perros | número | Sí | No | No | 1–8 | entero 1–8 | — | walk profile | Sí | draft |
| FORM-30 | WALK-08 | Configuración | Modalidades; tipos | multi chips | modalidad Sí | tipos opcionales | No | Individual/Grupo; Tranquilo/Activo/Urbano/Parque | modalidad >=1 | — | walk profile | Sí | draft |
| FORM-30 | WALK-08 | Manejo | Especial | multi chips | No | Sí | No | nerviosos; reactivos; movilidad reducida; medicación; evaluación previa; no agresivos | — | — | walk profile | Sí | draft |
| FORM-30 | WALK-08 | Requisitos | Requisitos | multi chips | Sí | No | No | vacunas; arnés/collar; placa; informar salud; informar conducta; evaluación; carnet; no hembras en celo | >=1 | — | walk profile | Sí | draft |
| FORM-30 | WALK-08 | Certificación | Nombre; institución; año | repetible | No | Sí | si agrega | — | los 3 válidos; año 1900–actual | — | walk profile | Sí | draft |
| FORM-31 Plan | WALK-07 | Básico | Nombre; descripción; tipo | texto/radio | Sí | No | No | Individual; Recurrente | no vacíos | — | plan/version | Sí | plan draft |
| FORM-31 | WALK-07 | Operación | Duración; paseos; mascotas; modalidad; precio | números/radio | Sí | No | No | modalidad Individual/Grupo | enteros >0; precio >0 | — | plan | Sí | draft |
| FORM-31 | WALK-07 | Recurrencia | Frecuencia/semana; vigencia; tipo frecuencia | números/radio | Sí | No | tipo recurrente | Requerida; Recomendada; Configurable cliente | enteros >0 | — | plan | Sí | draft |
| FORM-31 | WALK-07 | Contenido | Incluye; condiciones | listas por coma | incluye Sí | condiciones | No | texto separado por coma | incluye >=1 | — | plan | Sí | draft |
| FORM-31 | WALK-07 | Publicación | Disponible | checkbox | No | Sí | No | Sí/No | plan válido para enviar | — | plan | Sí | draft/review |
| FORM-32 Chat | CHAT-01 | Mensaje | Texto | multiline | Sí | No | No | — | trim; detección contacto externo | Escribe un mensaje | conversation | Sí | mensajes local |
| FORM-32 | CHAT-01 | Adjunto | Cámara/foto/documento/comprobante | acción | No | Sí | según contexto | tipos visibles | simulado | — | — | Sí | mensaje local |
| FORM-33 Oferta | CHAT-01 | Oferta | Servicio/plan aprobado | radio en modal | Sí | No | viewer proveedor + coordinación | individuales; recurrentes aprobados | ID aprobado/público | — | WalkPlan | Sí | ServiceOffer |

## Marketplace y soporte

| Flujo | Pantalla ID | Sección | Campo | Tipo | Obligatorio | Opcional | Condicional | Opciones | Validación | Placeholder | Dato reutilizado | Editable | Destino al guardar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FORM-34 Checkout Marketplace | CHECKOUT-03 | Facturación | Tipo, identificación, nombre/razón, email, teléfono, fiscal | FORM-13 embebido | Sí según tipo | fiscal solo jurídica | crear/editar | Natural/Jurídica; Cédula/RUC | `isBillingProfileComplete` | etiquetas de campo | BillingProfile | Sí | checkout/local list |
| FORM-34 | CHECKOUT-03 | Dirección | Dirección completa | FORM-10 embebido | Sí | campos opcionales según FORM-10 | nueva/editar | — | dirección válida | — | Address | Sí | persistir o una ocasión |
| FORM-34 | CHECKOUT-03 | Envío | Método | radio cards | Sí | No | compatibilidad carrito | Estándar; Express; Retiro/coordinación | enabled/compatible | — | Store shipping | Sí | order |
| FORM-34 | CHECKOUT-03 | Tarjeta | Nombre; número; vencimiento; CVV; guardar | textos+checkbox | Sí visualmente | guardar | agregar tarjeta | — | pantalla comprueba presencia | — | PaymentMethod | Sí | checkout/local list |
| FORM-34 | CHECKOUT-03 | Pago | Método | radio | Sí | No | No | Tarjeta 4242; Transferencia; Deuna | uno disponible | — | PaymentMethod | Sí | ruta pago |
| FORM-34 | CHECKOUT-03 | Wallet | Aplicar Saldo Hupi | toggle | No | Sí | saldo >0 | Sí/No | hasta total | — | Wallet | Sí | order total |
| FORM-34 | CHECKOUT-03 | Cupón | Código | texto/acción | No | Sí | expandido | cupones disponibles | trim uppercase, disponible | HUPI10 | Coupon | Sí | descuento checkout |
| FORM-34 | CHECKOUT-03 | Legal | Términos; datos | checkbox ×2 | Sí | No | No | aceptar | ambos true | — | documents | Sí | order |
| FORM-35 Producto | PRODUCT-04 | General | Tipo; nombre; marca; descripción; impuesto; activo; categoría | dropdown/text/toggle | nombre/categoría/precios/stock según validador | descripción | No | tipos del editor; impuesto 0/15%; 14 categorías | campos obligatorios del editor | — | product existente | Sí | Product draft |
| FORM-35 | PRODUCT-04 | Imágenes | Imágenes + principal | adjuntos mock/reorder | principal Sí | adicionales | No | subir/mover/eliminar/principal | al menos principal para producto completo | — | product.images | Sí | Product |
| FORM-35 | PRODUCT-04 | Precio/stock | SKU; precios antes/actual tarjeta y transferencia; stock; alerta | texto/decimales/números | SKU/precios/stock | “antes”, alerta | producto sin variaciones | — | números no negativos; actuales >0 | — | product | Sí | Product |
| FORM-35 | PRODUCT-04 | Atributos | Tipo/nombre/opciones | repetible | si usa variaciones | No | variaciones | Color; Talla; Sabor; Tamaño empaque; Personalizado; valores sugeridos documentados en `09` | opciones no vacías | — | product.attributes | Sí | Product |
| FORM-35 | PRODUCT-04 | Dimensiones | Peso; unidad; largo; ancho; alto | decimales/dropdown | No | Sí | No | g; kg; lb | input decimal | — | product | Sí | Product |
| FORM-36 Variación | PRODUCT-04 | Variación modal | opciones seleccionadas; activo; SKU; 4 precios; stock; alerta | selectors/toggle/text/números | opciones/SKU/precios/stock | precios antes/alerta | atributos existentes | combinaciones | combinación única y campos completos | — | Product/attribute | Sí | Variation |
| FORM-37 Envío proveedor | MARKET-05 | Método | Habilitado; costo; horas; instrucciones | toggle/decimal/número/texto | costo/horas si habilitado | instrucciones | Retiro cambia label a punto/horario | Estándar; Express; Retiro | horas `^\d*$`; costo `^\d*([.,]\d{0,2})?$` | — | ShippingSetting | Sí | store state |
| FORM-38 Tienda/ticket/orden | MARKET-06/ORDER-05/SUPPORT-02 | Operación | Perfil público, horario, logo; ticket legal; guía/evidencia; soporte | formularios contextuales | según acción | adjuntos/notas | ver detalle en `09` y `10` | tipos tienda/categorías/horas; tipos ticket; image/pdf; motivos soporte | descripción soporte; guía completa para En camino; evidencia no-pickup | según campo | Provider/Store/Order/Support | Sí salvo legales readonly | stores/orders/tickets local |

## Observaciones de validación

- Varios formularios de prototipo guardan aunque campos “visualmente obligatorios” estén vacíos (por ejemplo, facturación standalone y tarjetas). La validación más estricta ocurre en checkout. Edwin debe tomar esta diferencia como comportamiento actual, no asumir que toda etiqueta bloquea.
- PET-03 muestra un nombre/URI de carnet de vacunación proveniente del seed, pero PET-02 no ofrece cargar o reemplazar carnet; no inventar ese input al describir el prototipo.
- Las opciones de provincias/ciudades, razas, categorías, atributos, horas y códigos de país provienen de catálogos locales; se detallan además en `07-services.md`, `09-marketplace.md` y `15-assets-and-dependencies.md`.
- Ningún formulario envía datos a API.
