-- Numeración de pedidos. El prototipo mostraba HUPI-MK-2060 fijo; ahora cada
-- pedido recibe un número propio. Se arranca por encima de los datos de demo
-- para no chocar con los números ya sembrados.

CREATE SEQUENCE order_number_seq START WITH 3000;
CREATE SEQUENCE provider_order_number_seq START WITH 3000;
