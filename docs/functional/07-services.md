# 07 · Servicios

## Mapa macro actual

```text
Modo Proveedor (PROVIDER-01)
├─ Verificación general (VERIFY-01)
├─ Indicadores generales
└─ Servicios
   ├─ Paseos (WALK-03)
   └─ Mi tienda Marketplace (MARKET-04)
```

La verificación documental responde “quién puede operar”. Cada servicio responde “qué oferta está configurada/aprobada”. Nunca deben fusionarse.

## Feature flags reales

| Servicio definido | Flag | Visible/navegable ahora | Tratamiento |
|---|---:|---:|---|
| Paseo (`walk`) | true | Sí | flujo completo cliente/proveedor |
| Marketplace | true | Sí | flujo completo cliente/proveedor |
| Niñera (`sitter`) | false | No como búsqueda/checkout | hay ramas/mocks residuales; fuera de especificación actual |
| Hospedaje (`boarding`) | false | No | igual |
| Guardería (`daycare`) | false | No | igual |
| Grooming | false | No | definición/card potencial, sin flujo |
| Adiestramiento | false | No | definición/card potencial, sin flujo |

Home renderiza directamente `ServiceForm serviceId="walk"`; no existe selector visible entre servicios en esta versión.

## Gates

| Gate | Paseos | Marketplace proveedor |
|---|---|---|
| proveedor general no aprobado | card lleva a VERIFY-01 | card lleva a VERIFY-01 |
| proveedor aprobado | entra a WALK-03 | entra a MARKET-04 |
| aprobación específica pending | status visible; oferta pública/operación debe seguir restringida | tienda conserva sus estados propios |
| aprobación específica approved | tarifa/perfil/planes/agendamientos | catálogo/pedidos/envíos/perfil/finanzas |

## Paseos: datos funcionales

- Tarifa horaria por proveedor.
- Perfil público con publicación condicionada a descripción, configuración, requisitos, zona, tarifa, plan aprobado y status general del perfil de Paseos.
- Planes individuales/recurrentes versionados.
- Condiciones estándar Hupi informativas y no seleccionables.
- Solicitudes, ofertas aprobadas, checkout, booking y ciclo operativo.
- Métricas derivadas de los bookings reales del mock compartido.

Estados de perfil/plan admitidos: `draft`, `pending_approval`, `changes_requested`, `approved`, `rejected`, `suspended`, `archived`, `superseded`.

## Marketplace proveedor: datos funcionales

- Perfil/identidad de tienda.
- Productos, atributos, variaciones, inventario y estados de aprobación.
- Métodos de envío.
- Subpedidos por tienda, pago, guía, evidencia, incidencias y actividad.
- Finanzas y liquidaciones visibles.

## Regla de publicación

“Proveedor aprobado” no basta para aparecer como Paseos. El servicio necesita configuración/publicación. De forma equivalente, el catálogo Marketplace se rige por store/product status. Edwin debe mantener gates separados aunque cambie la implementación.
