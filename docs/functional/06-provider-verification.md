# 06 · Verificación de proveedor

## Principio

La misma cuenta cliente adquiere un `ProviderEnrollment`; no se duplica `User`. `accountId` apunta a `CustomerProfile.id`. La documentación general habilita el modo proveedor; la configuración/aprobación de Paseos y Marketplace vive aparte.

## Entry points

- Cliente existente: PROFILE-01 → “¿Quieres trabajar con Hupi?” → AUTH-08/VERIFY-01.
- Nuevo proveedor: AUTH-07 → AUTH-08 → AUTH-05 → VERIFY-01.
- Proveedor existente: PROVIDER-01 → Verificación.
- DEV: QA-02 → VERIFY-01 con `qaStep`.

## Modelo de estado visible

| Nivel | Estados |
|---|---|
| Verificación general | `not_started`, `in_progress`, `submitted`, `under_review`, `changes_requested`, `approved`, `rejected`, `suspended` |
| Sección | `pending`, `complete`, `under_review`, `approved`, `changes_requested` |

`updatedAt`, `submittedAt`, `lastPendingSection`, `emailValidated` y overrides por sección se conservan en el repositorio local. Progreso = redondeo de completas/7.

## Vista real vs guía QA de nueve pasos

| Guía QA | Sección real que abre | Nota |
|---|---|---|
| 1 Datos básicos | `personal` | En natural abre datos personales; los datos básicos de cuenta se capturaron antes. |
| 2 Tipo de proveedor | `account` | El tipo se elige realmente al crear enrollment/not_started. |
| 3 Verificación celular | `account` | Celular es User readonly + `phoneVerified`. |
| 4 Verificación correo | `account` | Acción local “Validar correo”; sin OTP. |
| 5 Identidad / Empresa | `identity` | Para un QA natural. Jurídica usa `company`, `company_documents`, `legal_representative`. |
| 6 Dirección | `address` | Accordion real. |
| 7 Persona de contacto | `contact` | Accordion real. |
| 8 Datos bancarios | `bank` | Accordion real. |
| 9 Revisión | ninguna | Muestra banner QA y la pantalla completa; no existe accordion exclusivo. |

`currentStep` solo pertenece a DEV_QA. En producción, la continuidad usa `lastPendingSection`. La única salida explícita es “Continuar más tarde”; no hay botón de “Omitir por ahora” por sección.

## Persona natural: siete secciones

| Orden | Key | Completa cuando | Reutilización |
|---:|---|---|---|
| 1 | `account` | User tiene nombre/apellido/celular/email válido, phoneVerified y emailValidated | User |
| 2 | `personal` | cédula, nacimiento, nacionalidad | nombres readonly User |
| 3 | `identity` | selfie actual + cédula frente/reverso | cédula de personal |
| 4 | `address` | dirección, ciudad, sector, número; si edificio, nombre+unidad | dirección default al iniciar |
| 5 | `contact` | nombre, apellido, teléfono, email válido; rol no bloquea natural | dato separado; puede coincidir manualmente |
| 6 | `bank` | banco, tipo, número, titular, ID titular | puede usar nombre/cédula, pero la UI no autocopia |
| 7 | `general` | descripción no vacía | web opcional compartida con personal |

Selfie debe tomarse en el momento: la UI abre cámara frontal; documentos de identidad usan posterior. Hay previsualización, Repetir y Confirmar foto.

## Persona jurídica: siete secciones

| Orden | Key | Campos/condición |
|---:|---|---|
| 1 | `account` | User base reutilizado y verificaciones |
| 2 | `company` | razón social, comercial, RUC, tipo compañía, fecha constitución, teléfono, correo válido; web opcional |
| 3 | `company_documents` | documento RUC, constitución, nombramiento representante |
| 4 | `legal_representative` | nombres, cédula, teléfono, correo, selfie, cédula frente/reverso |
| 5 | `address` | dirección fiscal, ciudad, sector, número; edificio exige nombre+oficina |
| 6 | `contact` | nombre, apellido, rol, teléfono, correo; puede reutilizar representante |
| 7 | `bank` | cinco campos bancarios |

Al iniciar jurídica, nombres/teléfono/correo del User precargan el representante. El toggle `contactIsLegalRepresentative` hace que Contacto se derive del representante y quede readonly. El modelo técnico contiene nacimiento/nacionalidad del representante, pero la UI no los expone: quedan fuera de la especificación visual actual.

## Revisión, envío y correcciones

- Cada header muestra label de sección, status, “Completar” si falta y chevron.
- Una card lista faltantes mientras existan.
- Enviar está deshabilitado hasta que no falte ninguna sección y el estado sea `in_progress` o `changes_requested`.
- Tap deshabilitado muestra “completa lo pendiente”.
- Enviar escribe `under_review`, `submittedAt` y muestra aviso.
- `submitted` es admitido/representado pero no producido por el submit local.
- En `submitted/under_review` aparece la card “En revisión”; no se puede reenviar.
- `changes_requested` permite corregir y reenviar; los overrides soportan marcar secciones concretas.
- Aprobación/rechazo/suspensión no tienen acción productiva visible; QA carga ejemplos.

## Exclusiones confirmadas

- Sin certificado bancario.
- Sin certificado adicional.
- Sin código por correo para alta.
- Sin endpoints ni subida real de archivos.
- Sin decisión Admin dentro de mobile.

## Persistencia de referencia

AsyncStorage `hupi.localProvider.v1`. El handoff debe conservar continuidad y asociación a User, no necesariamente esta clave ni el shape actual.
