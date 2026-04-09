CREATE TABLE IF NOT EXISTS veiculos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo                TEXT NOT NULL,
  marca                 TEXT NOT NULL,
  ano                   INTEGER NOT NULL,
  placa                 TEXT,
  quilometragem         INTEGER DEFAULT 0,
  tipo                  TEXT NOT NULL,
  carroceria            TEXT,
  valor_mercado         NUMERIC(15,2) DEFAULT 0,
  valor_fipe            NUMERIC(15,2) DEFAULT 0,
  codigo_fipe           TEXT,
  ficha_tecnica         JSONB DEFAULT '{}',
  fotos                 TEXT[] DEFAULT '{}',
  favorito              BOOLEAN DEFAULT FALSE,
  historico_valorizacao JSONB DEFAULT '[]',
  ultima_atualizacao    TIMESTAMPTZ DEFAULT NOW(),
  cor                   TEXT,
  combustivel           TEXT,
  cambio                TEXT,
  notas                 TEXT,
  gastos                JSONB DEFAULT '[]',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_veiculos_marca    ON veiculos(marca);
CREATE INDEX IF NOT EXISTS idx_veiculos_tipo     ON veiculos(tipo);
CREATE INDEX IF NOT EXISTS idx_veiculos_favorito ON veiculos(favorito);
CREATE INDEX IF NOT EXISTS idx_veiculos_ano      ON veiculos(ano);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_updated_at ON veiculos;
CREATE TRIGGER trigger_updated_at
  BEFORE UPDATE ON veiculos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso_publico_select" ON veiculos FOR SELECT USING (true);
CREATE POLICY "acesso_publico_insert" ON veiculos FOR INSERT WITH CHECK (true);
CREATE POLICY "acesso_publico_update" ON veiculos FOR UPDATE USING (true);
CREATE POLICY "acesso_publico_delete" ON veiculos FOR DELETE USING (true);
