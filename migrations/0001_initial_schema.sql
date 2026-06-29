-- BuildQuote Pro - Fase 1 MVP
-- Migration 0001: utilizadores, profissionais e módulos

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'professional',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS professionals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  business_name TEXT,
  nif TEXT,
  profession TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  service_area TEXT,
  logo_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_core INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS professional_modules (
  id TEXT PRIMARY KEY,
  professional_id TEXT NOT NULL,
  module_code TEXT NOT NULL,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE,
  FOREIGN KEY (module_code) REFERENCES modules(code) ON DELETE CASCADE,
  UNIQUE (professional_id, module_code)
);

INSERT OR IGNORE INTO modules (id, code, name, description, is_core, is_active, created_at) VALUES
('mod_core_quoting', 'quoting_core', 'Orçamentação no Local', 'Criação de orçamentos por zonas, materiais, mão de obra e margens.', 1, 1, datetime('now')),
('mod_profession_engine', 'profession_engine', 'Motor de Cálculo por Profissão', 'Regras independentes por profissão para cálculo automático.', 1, 1, datetime('now')),
('mod_material_catalog', 'material_catalog', 'Catálogo de Materiais e Séries', 'Materiais, marcas, preços e compatibilidades.', 0, 1, datetime('now')),
('mod_quote_approval', 'quote_approval', 'Aprovação do Orçamento', 'Fluxo de estados de aprovação pelo cliente e profissional.', 1, 1, datetime('now')),
('mod_payments', 'payments', 'Pagamento da Adjudicação', 'Pagamento online da adjudicação.', 0, 0, datetime('now')),
('mod_supplier_orders', 'supplier_orders', 'Encomenda Automática ao Fornecedor', 'Geração e envio automático da lista de materiais.', 0, 0, datetime('now')),
('mod_public_profile', 'public_profile', 'Página Pública do Profissional', 'Perfil público e pedidos de orçamento online.', 0, 1, datetime('now'));
