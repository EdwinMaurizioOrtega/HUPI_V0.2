-- Código estable de plan. La app crea planes con su propio id (`plan-walk-basic`)
-- y necesita poder editarlos después sin conocer el UUID del backend.
-- El código identifica la familia de versiones, no cada versión.

ALTER TABLE provider_walk_plans ADD COLUMN code TEXT;

CREATE UNIQUE INDEX provider_walk_plans_provider_code_idx
    ON provider_walk_plans (provider_id, code)
    WHERE code IS NOT NULL AND status <> 'superseded';
