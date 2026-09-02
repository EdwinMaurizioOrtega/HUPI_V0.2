# 11 · Reutilización de datos

## Regla central

La reconstrucción debe modelar una sola identidad por dato canónico. Las pantallas pueden mantener drafts, pero no crear entidades permanentes duplicadas.

## User / cuenta

| Dato canónico | Se muestra/reutiliza en | Regla |
|---|---|---|
| `id` | CustomerProfile, ProviderEnrollment.accountId, términos aceptados | misma persona cliente/proveedor |
| nombre/apellido | onboarding, perfil, cuenta verificación, representante precargado, titular/contacto sugerible | editar User actualiza futuras lecturas; provider account es readonly |
| celular | auth, SMS, perfil, cuenta proveedor, contacto/representante precargado | obligatorio; `phoneVerified` pertenece al hito de cuenta, no se duplica |
| correo | perfil, recovery, cuenta proveedor, representante precargado | obligatorio; `emailValidated` de enrollment es estado separado en mock, pero el valor viene de User |
| foto | perfil, chats, headers | una URI de perfil; avatar default solo fallback |
| idioma/apariencia | login/settings/root | preferencia única persistida |

## ProviderVerification

- Reutiliza nombre/apellido/teléfono/correo de User en `account`; no los copia a campos editables.
- `accountId` referencia al User.
- `phoneVerified` se consulta desde sesión/cuenta.
- Al crear provider natural, copia la dirección default a un draft proveedor. Esto es un **snapshot editable** necesario para verificación, no otra dirección de cliente sincronizada automáticamente.
- Web natural aparece en `personal` y `general`, pero es el mismo `draft.website`.

## Persona jurídica

- `Company` es entidad separada de User: razón social, comercial, RUC, tipo, fecha, teléfono/email/web empresariales.
- El User que inicia el alta precarga al `LegalRepresentative`; luego es editable porque representante y operador de cuenta podrían divergir.
- `contactIsLegalRepresentative=true` deriva nombre/apellido/rol/teléfono/email desde LegalRepresentative. No persistir dos copias divergentes; almacenar relación/flag.
- Dirección fiscal pertenece a Company/Verification, no reemplaza automáticamente direcciones personales.

## Persona de contacto

- Natural: contacto operativo propio; puede coincidir con User, pero la UI no tiene toggle de reutilización.
- Jurídica: puede apuntar a representante legal; cuando apunta, se deriva y queda readonly.
- El rol “Representante legal” se deriva al reutilizar.

## Direcciones

`Address` es la fuente única para etiqueta, icono, dirección, mapa, provincia/ciudad, default y `deliveryPreferences`.

- Home y checkouts seleccionan por `address.id`.
- Checkout de Paseos puede editar preferencias temporalmente y ofrece guardarlas en la dirección; sin ese checkbox son `meetingPreferences` del booking únicamente.
- Checkout Marketplace puede guardar la dirección o usarla solo en esa compra.
- Booking/order debe guardar snapshot legible para preservar historial aunque Address cambie.
- ProviderVerification inicializa desde default, pero su address/fiscalAddress queda como snapshot de revisión.

## Facturación

`BillingProfile`: tipo contribuyente, tipo/número identificación, nombre/razón, email, teléfono, fiscal y default. Perfil cliente y checkout deberían usar el mismo repositorio. El checkout actual inicia con mocks propios, por lo que la reconstrucción debe unificarlo sin cambiar las opciones visibles.

## Datos bancarios

Una entidad bancaria por provider (o versiones auditadas): banco, tipo, número, titular e identificación. Se muestra solo en verificación actual. No existe certificado. Titular/ID podrían ofrecer “usar datos del proveedor/empresa”, aunque la UI actual no implementa ese atajo.

## Mascotas

`Pet` único por `petId`: perfil, formulario, Home, checkout, booking e historial. Booking conserva nombre/snapshot además del ID futuro. Veterinario, clínica, salud, emergencia e instrucciones pertenecen al Pet; no duplicarlos en cada solicitud salvo snapshot operativo necesario.

## Proveedor, servicio y planes

- `Provider` general: identidad/aprobación.
- `ProviderWalkProfile`: configuración/publicación de Paseos.
- `ProviderWalkPlan`: oferta versionada. Oferta de chat referencia `approvedOfferId`; no copia un plan editable como fuente permanente.
- Booking guarda snapshot de título/precio/condiciones aceptadas y referencia a plan/offer para auditoría.
- `ProviderTermsAcceptance` referencia versión exacta de términos y actor; no un boolean global.

## Booking compartido

Una entidad por `bookingId`; cliente y proveedor usan vistas sobre la misma. `QA-WALK-001` prueba esta regla. `startedAt`, `completedAt`, cancelación, payout y refund nunca deben existir en stores separados por actor.

## Marketplace

- Product y Variation son fuentes de catálogo/stock; cart/checkout mantienen líneas referenciadas y snapshots de precio.
- Order cliente agrupa subpedidos por tienda; `providerOrderId` identifica la vista del vendedor sin duplicar el pedido global.
- StoreProfile reutiliza identidad legal validada del proveedor/empresa como readonly; los cambios crean ticket, no edición paralela.
- ShippingSetting de tienda alimenta checkout y pantalla proveedor.
- Wallet es fuente de saldo/movimientos; checkout solo calcula cuánto aplicar.

## Reglas de actualización

1. Editar dato canónico afecta usos futuros.
2. Historial financiero/legal conserva snapshot/version.
3. Reutilización explícita usa referencia/flag, no copiar-pegar silencioso.
4. Los drafts pueden copiar valores para edición, pero al guardar deben reconciliar con la entidad propietaria.
5. Cuenta, verificación general, servicio y order/booking son agregados separados aunque compartan identidad.
