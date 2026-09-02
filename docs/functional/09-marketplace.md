# 09 · Marketplace

## Cliente

### Descubrimiento

MARKET-01 incluye buscador, promociones/ruleta, categorías, tiendas oficiales, recomendaciones, productos, acceso a carrito, pedidos, saldo, cupones y notificaciones. La búsqueda separa resultados de tiendas/productos.

Rutas: MARKET-02 todas las tiendas; MARKET-03 tienda oficial; PRODUCT-01 todos; PRODUCT-02 categoría; PRODUCT-03 detalle.

### Producto

- Galería/emoji mock, marca, tienda, descripción.
- Precio tarjeta y precio transferencia/Deuna; posible “antes”.
- Atributos/variaciones; solo combinaciones existentes.
- Cantidad limitada por stock.
- Comentario opcional.
- Agregar al carrito o Comprar ahora.
- Estados de error por stock insuficiente/no disponible.

### Carrito

Lista, variación, precio, cantidad, eliminar. Revalida disponibilidad y puede ajustar o quitar productos inválidos antes de checkout.

### Checkout, en orden visible

1. Productos.
2. Facturación: Natural/Jurídica; Cédula/RUC; identificación; nombre/razón; email; teléfono; fiscal si jurídica.
3. Dirección: seleccionar/crear/editar, preferencias de entrega, guardar o usar solo esta ocasión.
4. Entrega: Estándar, Express, Retiro/coordinación; solo compatibles y habilitados.
5. Pago: tarjeta, transferencia, Deuna; agregar/guardar tarjeta.
6. Saldo Hupi: aplicar hasta cubrir total.
7. Cupón/beneficio: ingresar, ver disponibles, aplicar/quitar/omitir.
8. Aceptar términos y tratamiento de datos.

El total suma subtotal + envío - descuentos/cupón - saldo + donación. La compra se bloquea por carrito inválido, falta dirección, facturación, pago o consentimientos.

### Pago y pedido

- Tarjeta: confirmación directa mock.
- Transferencia: datos bancarios + comprobante simulado; estado pendiente/revisión.
- Deuna: confirmación visual mock.
- ORDER-01 resume status y enlaces.
- ORDER-04 lista pedidos; ORDER-02 muestra subpedidos/items/entrega/pago/timeline/documentos/soporte/reseña; ORDER-03 tracking.

Los aliases `order-history*` y `payment-proof` no son alcanzados por UI y no son parte del flujo.

## Proveedor

### Dashboard tienda

MARKET-04 muestra estado, indicadores y exactamente: Pedidos Marketplace, Mis productos, Métodos de envío, Perfil de tienda y Finanzas. Notificaciones no se duplica dentro de estas herramientas; está en el header/dashboard proveedor.

### Productos

Estados de aprobación/operación incluyen draft, pending approval, changes requested, approved, rejected, suspended/archived según modelo. El editor contiene:

- tipo de producto;
- nombre, marca, descripción;
- impuesto 0%/15%; activo;
- categorías: Snacks, Alimentos, Juguetes, Accesorios, Higiene y limpieza, Salud y bienestar, Medicina/veterinaria, Camas y descanso, Collares y correas, Ropa y estilo, Arena/baño, Suplementos, Transportadoras, Otros;
- imágenes ordenables y una principal;
- SKU, precios antes/actual para tarjeta y transferencia;
- stock y alerta mínima;
- atributos: Color, Talla, Sabor, Tamaño de empaque, Personalizado;
- sugerencias: tallas XS/S/M/L/XL/Personalizada; colores Rojo/Azul/Verde/Negro/Blanco/Amarillo/Morado/Coral/Personalizado; sabores Pollo/Pavo/Res/Salmón/Vegetales/Otro; empaque 100g/250g/500g/1kg/2kg/Personalizado; personalizado Cachorro/Adulto/Senior;
- variaciones con activo, combinación, SKU, precios y stock propios;
- peso en g/kg/lb y largo/ancho/alto cm.

### Pedidos proveedor

ORDER-06 inicia todo contraído; tap expande uno; Gestionar abre ORDER-05. Un order cliente puede tener subpedidos separados por tienda (`providerOrderId`). Estados:

`Pendiente de pago`, `Pago en revisión`, `Confirmado`, `En preparación`, `Listo para envío`, `En camino`, `Entregado`, `Cancelado`.

Pago: Pendiente de comprobante, Comprobante enviado, Pago validado, Comprobante rechazado, Pagado con tarjeta. Comprobante rechazado bloquea avance.

Para pasar a En camino:

- standard/express exige nombre transportista, tracking y archivo guía;
- evidencia image/pdf aparece solo cuando `nextStatus === 'En camino'`;
- evidencia es requerida salvo pickup;
- guardar genera actividad; se puede cambiar/eliminar adjunto.

El detalle permite responder información solicitada/incidencia y abrir chat soporte.

### Envíos

Métodos `standard`, `express`, `pickup`. Toggle, costo y tiempo en horas, instrucciones; pickup cambia a punto/horario. Horas solo dígitos. Costo admite `10`, `10,5`, `10,50`, `10.50`; rechaza unidades y más de dos decimales.

### Perfil tienda

- Readonly interno: tipo persona, documento, número, nombre legal; provincia, ciudad, dirección/punto, referencia; teléfono/email interno.
- Editable financiero: contacto, email, teléfono de facturación.
- Público: Local físico/Tienda online, nombre comercial, descripción, categorías.
- Horario por día con activo y apertura/cierre; local físico hace el horario requerido visualmente.
- Logo mock/archivo y emojis 🦴 🐾 🧴 🦮 🥣 🎾.
- Cambio legal: RUC, Razón Social, tipo persona, documento, correo facturación u Otro; descripción + adjunto; genera ticket.

### Finanzas

PAYMENT-05 muestra ventas, comisión, saldo y liquidaciones mock. La comisión del marketplace se modela 30% y vendedor 70%. Es interna; no debe mostrarse al cliente.
