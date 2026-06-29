-- BuildQuote Pro - Fase 1 MVP
-- Migration 0002: orçamentos, zonas, itens, regras e materiais

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  professional_id TEXT NOT NULL,
  quote_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_nif TEXT,
  client_address TEXT,
  profession TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  subtotal REAL NOT NULL DEFAULT 0,
  vat_total REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  margin_rate REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  notes TEXT,
  public_token TEXT UNIQUE,
  valid_until TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quotes_professional ON quotes(professional_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_public_token ON quotes(public_token);

CREATE TABLE IF NOT EXISTS quote_zones (
  id TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL,
  name TEXT NOT NULL,
  zone_type TEXT,
  area_m2 REAL,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quote_items (
  id TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL,
  zone_id TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('material','labor','equipment','consumable')),
  code TEXT,
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'un',
  unit_cost REAL NOT NULL DEFAULT 0,
  unit_price REAL NOT NULL DEFAULT 0,
  margin_rate REAL NOT NULL DEFAULT 0,
  vat_rate REAL NOT NULL DEFAULT 23,
  subtotal REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  supplier_id TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (zone_id) REFERENCES quote_zones(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS quote_status_history (
  id TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS profession_rules (
  id TEXT PRIMARY KEY,
  profession TEXT NOT NULL,
  rule_key TEXT NOT NULL,
  rule_value TEXT NOT NULL,
  unit TEXT,
  description TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (profession, rule_key)
);

CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT,
  profession TEXT,
  unit TEXT NOT NULL DEFAULT 'un',
  unit_cost REAL NOT NULL DEFAULT 0,
  unit_price REAL NOT NULL DEFAULT 0,
  vat_rate REAL NOT NULL DEFAULT 23,
  supplier_id TEXT,
  supplier_name TEXT,
  brand TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_materials_profession ON materials(profession);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_description ON materials(description);

INSERT OR IGNORE INTO profession_rules (id, profession, rule_key, rule_value, unit, description, created_at) VALUES
('rule_elec_cabo_15', 'electrician', 'cabo_1_5_formula', 'pontos_iluminacao * 3 + area_m2 * 0.4', 'm', 'Cabo 1.5mm² para iluminação', datetime('now')),
('rule_elec_cabo_25', 'electrician', 'cabo_2_5_formula', 'pontos_tomada * 4 + area_m2 * 0.3', 'm', 'Cabo 2.5mm² para tomadas', datetime('now')),
('rule_elec_tubo_vd', 'electrician', 'tubo_vd_formula', 'total_metros_cabo * 1.1', 'm', 'Tubo VD com 10% de desperdício', datetime('now')),
('rule_elec_disjuntores', 'electrician', 'disjuntores_formula', 'ceil((pontos_tomada + pontos_iluminacao) / 8)', 'un', 'Disjuntores por pontos elétricos', datetime('now')),
('rule_elec_tomadas', 'electrician', 'tomadas_schuko_formula', 'pontos_tomada', 'un', 'Tomadas Schuko', datetime('now')),
('rule_elec_interruptores', 'electrician', 'interruptores_formula', 'pontos_iluminacao', 'un', 'Interruptores', datetime('now')),
('rule_elec_caixas', 'electrician', 'caixas_formula', 'pontos_tomada + pontos_iluminacao', 'un', 'Caixas de aparelhagem', datetime('now')),
('rule_elec_labor', 'electrician', 'mao_obra_horas_formula', '(pontos_tomada + pontos_iluminacao) * 1.5', 'h', 'Horas de mão de obra elétrica', datetime('now')),
('rule_painter_tinta', 'painter', 'tinta_l_formula', 'area_m2 * num_coats / 10', 'L', 'Tinta com rendimento 10m²/L', datetime('now')),
('rule_painter_primario', 'painter', 'primario_l_formula', 'area_m2 / 12', 'L', 'Primário com rendimento 12m²/L', datetime('now')),
('rule_painter_lixa', 'painter', 'lixa_formula', 'ceil(area_m2 / 5)', 'un', 'Folhas de lixa', datetime('now')),
('rule_painter_plastico', 'painter', 'plastico_formula', 'area_m2 * 1.2', 'm2', 'Plástico de proteção', datetime('now')),
('rule_painter_fita', 'painter', 'fita_formula', 'sqrt(area_m2) * 4 * num_coats', 'm', 'Fita adesiva por perímetro estimado', datetime('now')),
('rule_painter_labor', 'painter', 'mao_obra_horas_formula', 'area_m2 * 0.25', 'h', 'Horas de mão de obra pintura', datetime('now')),
('rule_plumber_tubo', 'plumber', 'tubo_multicamada_formula', 'metros_tubagem * 1.15', 'm', 'Tubo multicamada com desperdício', datetime('now')),
('rule_plumber_cotovelos', 'plumber', 'cotovelos_formula', 'pontos_agua * 3', 'un', 'Acessórios cotovelos', datetime('now')),
('rule_plumber_valvulas', 'plumber', 'valvulas_formula', 'pontos_agua + 2', 'un', 'Válvulas', datetime('now')),
('rule_plumber_labor', 'plumber', 'mao_obra_horas_formula', 'pontos_agua * 2', 'h', 'Horas de mão de obra canalização', datetime('now'));

INSERT OR IGNORE INTO materials (id, code, description, category, profession, unit, unit_cost, unit_price, vat_rate, supplier_name, brand, notes, is_active, created_at, updated_at) VALUES
('mat_e_001', 'CAB-H07VU-1.5', 'Cabo H07V-U 1.5mm²', 'cabos', 'electrician', 'm', 0.18, 0.35, 23, 'Fornecedor base', 'Genérico', 'Cabo para iluminação', 1, datetime('now'), datetime('now')),
('mat_e_002', 'CAB-H07VU-2.5', 'Cabo H07V-U 2.5mm²', 'cabos', 'electrician', 'm', 0.28, 0.55, 23, 'Fornecedor base', 'Genérico', 'Cabo para tomadas', 1, datetime('now'), datetime('now')),
('mat_e_003', 'CAB-XV-3G2.5', 'Cabo XV 3G2.5', 'cabos', 'electrician', 'm', 0.95, 1.65, 23, 'Fornecedor base', 'Genérico', '', 1, datetime('now'), datetime('now')),
('mat_e_004', 'TUB-VD-20', 'Tubo VD 20mm', 'tubos', 'electrician', 'm', 0.22, 0.45, 23, 'Fornecedor base', 'Genérico', '', 1, datetime('now'), datetime('now')),
('mat_e_005', 'CALHA-TEC-40', 'Calha técnica 40x25', 'calhas', 'electrician', 'm', 1.35, 2.45, 23, 'Fornecedor base', 'Genérico', '', 1, datetime('now'), datetime('now')),
('mat_e_006', 'DISJ-16A', 'Disjuntor 16A', 'proteção', 'electrician', 'un', 3.50, 6.90, 23, 'Fornecedor base', 'Genérico', '', 1, datetime('now'), datetime('now')),
('mat_e_007', 'DISJ-20A', 'Disjuntor 20A', 'proteção', 'electrician', 'un', 3.75, 7.20, 23, 'Fornecedor base', 'Genérico', '', 1, datetime('now'), datetime('now')),
('mat_e_008', 'DIF-30MA', 'Diferencial 30mA', 'proteção', 'electrician', 'un', 18.00, 32.00, 23, 'Fornecedor base', 'Genérico', '', 1, datetime('now'), datetime('now')),
('mat_e_009', 'TOM-SCHUKO', 'Tomada Schuko', 'mecanismos', 'electrician', 'un', 2.10, 4.50, 23, 'Fornecedor base', 'Efapel', '', 1, datetime('now'), datetime('now')),
('mat_e_010', 'INT-SIMPLES', 'Interruptor simples', 'mecanismos', 'electrician', 'un', 2.00, 4.25, 23, 'Fornecedor base', 'Efapel', '', 1, datetime('now'), datetime('now')),
('mat_e_011', 'QUADRO-12M', 'Quadro elétrico 12 módulos', 'quadros', 'electrician', 'un', 14.00, 27.50, 23, 'Fornecedor base', 'Genérico', '', 1, datetime('now'), datetime('now')),
('mat_e_012', 'LIG-WAGO', 'Ligadores rápidos', 'acessórios', 'electrician', 'un', 0.18, 0.35, 23, 'Fornecedor base', 'Genérico', '', 1, datetime('now'), datetime('now')),
('mat_e_013', 'ABR-6MM', 'Abraçadeiras', 'acessórios', 'electrician', 'un', 0.03, 0.08, 23, 'Fornecedor base', 'Genérico', '', 1, datetime('now'), datetime('now')),
('mat_e_014', 'BUCHA-6', 'Buchas 6mm', 'fixação', 'electrician', 'un', 0.02, 0.06, 23, 'Fornecedor base', 'Genérico', '', 1, datetime('now'), datetime('now')),
('mat_e_015', 'PARAF-4X40', 'Parafusos 4x40', 'fixação', 'electrician', 'un', 0.02, 0.05, 23, 'Fornecedor base', 'Genérico', '', 1, datetime('now'), datetime('now')),
('mat_e_016', 'CX-APARELHAGEM', 'Caixa de aparelhagem', 'caixas', 'electrician', 'un', 0.45, 0.95, 23, 'Fornecedor base', 'Genérico', '', 1, datetime('now'), datetime('now')),
('mat_e_017', 'CX-DERIV', 'Caixa de derivação', 'caixas', 'electrician', 'un', 1.10, 2.20, 23, 'Fornecedor base', 'Genérico', '', 1, datetime('now'), datetime('now'));
