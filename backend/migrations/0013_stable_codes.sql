-- Identificadores legibles y estables para proveedores y productos.
-- Las pantallas navegan con `provider-andres` o `product-1`; sin esto la API
-- solo podría devolver UUIDs y habría que reescribir la navegación.

ALTER TABLE providers ADD COLUMN code TEXT UNIQUE;
ALTER TABLE products  ADD COLUMN code TEXT UNIQUE;

CREATE INDEX providers_code_idx ON providers (code);
CREATE INDEX products_code_idx  ON products (code);
