-- BuildQuote Pro - Fase 2
-- Migration 0003: catálogo de marcas, séries e materiais

CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  website TEXT,
  country TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS series (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_series_brand_slug ON series(brand_id, slug);
CREATE INDEX IF NOT EXISTS idx_series_brand ON series(brand_id);

CREATE TABLE IF NOT EXISTS catalog_materials (
  id TEXT PRIMARY KEY,
  series_id TEXT,
  brand_id TEXT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  subcategory TEXT,
  unit TEXT NOT NULL DEFAULT 'un',
  base_price REAL NOT NULL DEFAULT 0,
  vat_rate REAL NOT NULL DEFAULT 23,
  color TEXT,
  finish TEXT,
  image_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE SET NULL,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_catalog_materials_brand ON catalog_materials(brand_id);
CREATE INDEX IF NOT EXISTS idx_catalog_materials_series ON catalog_materials(series_id);
CREATE INDEX IF NOT EXISTS idx_catalog_materials_category ON catalog_materials(category);
CREATE INDEX IF NOT EXISTS idx_catalog_materials_code ON catalog_materials(code);

CREATE TABLE IF NOT EXISTS material_compatibility (
  id TEXT PRIMARY KEY,
  material_id TEXT NOT NULL,
  compatible_material_id TEXT NOT NULL,
  compatibility_type TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (material_id) REFERENCES catalog_materials(id) ON DELETE CASCADE,
  FOREIGN KEY (compatible_material_id) REFERENCES catalog_materials(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_compat_material ON material_compatibility(material_id);

-- =====================================================================
-- SEED: Marcas
-- =====================================================================
INSERT OR IGNORE INTO brands (id, name, slug, logo_url, website, country, created_at) VALUES
('brd_efapel',   'Efapel',           'efapel',           NULL, 'https://www.efapel.com',           'PT', datetime('now')),
('brd_legrand',  'Legrand',          'legrand',          NULL, 'https://www.legrand.pt',           'FR', datetime('now')),
('brd_schneider','Schneider Electric','schneider-electric',NULL,'https://www.se.com/pt',            'FR', datetime('now')),
('brd_cin',      'CIN',              'cin',              NULL, 'https://www.cin.com',              'PT', datetime('now')),
('brd_robbialac','Robbialac',        'robbialac',        NULL, 'https://www.robbialac.pt',         'PT', datetime('now')),
('brd_sika',     'Sika',             'sika',             NULL, 'https://prt.sika.com',             'CH', datetime('now')),
('brd_weber',    'Weber',            'weber',            NULL, 'https://www.pt.weber',             'FR', datetime('now')),
('brd_pladur',   'Pladur',           'pladur',           NULL, 'https://www.pladur.com',           'ES', datetime('now')),
('brd_knauf',    'Knauf',            'knauf',            NULL, 'https://www.knauf.pt',             'DE', datetime('now'));

-- =====================================================================
-- SEED: Séries Efapel
-- =====================================================================
INSERT OR IGNORE INTO series (id, brand_id, name, slug, description, image_url, is_active, created_at) VALUES
('ser_efapel_21', 'brd_efapel', 'Série 21', 'serie-21', 'Aparelhagem residencial clássica Efapel', NULL, 1, datetime('now')),
('ser_efapel_45', 'brd_efapel', 'Série 45', 'serie-45', 'Aparelhagem modular design contemporâneo Efapel', NULL, 1, datetime('now')),
('ser_efapel_90', 'brd_efapel', 'Efapel 90', 'efapel-90', 'Aparelhagem premium linha 90 Efapel', NULL, 1, datetime('now'));

-- =====================================================================
-- SEED: Séries Legrand
-- =====================================================================
INSERT OR IGNORE INTO series (id, brand_id, name, slug, description, image_url, is_active, created_at) VALUES
('ser_leg_niloe',   'brd_legrand', 'Niloe',   'niloe',   'Aparelhagem modular residencial Legrand Niloe',   NULL, 1, datetime('now')),
('ser_leg_celiane', 'brd_legrand', 'Celiane', 'celiane', 'Aparelhagem premium decorativa Legrand Celiane', NULL, 1, datetime('now')),
('ser_leg_mosaic',  'brd_legrand', 'Mosaic',  'mosaic',  'Aparelhagem modular flexível Legrand Mosaic',    NULL, 1, datetime('now'));

-- =====================================================================
-- SEED: Materiais de catálogo — Efapel Série 21
-- =====================================================================
INSERT OR IGNORE INTO catalog_materials (id, series_id, brand_id, code, name, description, category, subcategory, unit, base_price, vat_rate, color, finish, image_url, is_active, created_at, updated_at) VALUES
('cat_ef21_tom_sch', 'ser_efapel_21', 'brd_efapel', 'EFA-21-TOM-SCH', 'Tomada Schuko Efapel Série 21',
  'Tomada Schuko 2P+T 16A 250V Efapel Série 21', 'aparelhagem', 'tomadas', 'un', 4.90, 23, 'branco', 'mate', NULL, 1, datetime('now'), datetime('now')),

('cat_ef21_int_sim', 'ser_efapel_21', 'brd_efapel', 'EFA-21-INT-SIM', 'Interruptor Simples Efapel Série 21',
  'Interruptor simples 10A 250V Efapel Série 21', 'aparelhagem', 'interruptores', 'un', 4.50, 23, 'branco', 'mate', NULL, 1, datetime('now'), datetime('now')),

('cat_ef21_int_biv', 'ser_efapel_21', 'brd_efapel', 'EFA-21-INT-BIV', 'Interruptor Bivias Efapel Série 21',
  'Interruptor bivias/comutador 10A 250V Efapel Série 21', 'aparelhagem', 'interruptores', 'un', 5.20, 23, 'branco', 'mate', NULL, 1, datetime('now'), datetime('now'));

-- =====================================================================
-- SEED: Materiais de catálogo — Efapel Série 45
-- =====================================================================
INSERT OR IGNORE INTO catalog_materials (id, series_id, brand_id, code, name, description, category, subcategory, unit, base_price, vat_rate, color, finish, image_url, is_active, created_at, updated_at) VALUES
('cat_ef45_tom_sch', 'ser_efapel_45', 'brd_efapel', 'EFA-45-TOM-SCH', 'Tomada Schuko Efapel Série 45',
  'Tomada Schuko 2P+T 16A 250V Efapel Série 45 design slim', 'aparelhagem', 'tomadas', 'un', 6.80, 23, 'branco', 'brilhante', NULL, 1, datetime('now'), datetime('now')),

('cat_ef45_int_sim', 'ser_efapel_45', 'brd_efapel', 'EFA-45-INT-SIM', 'Interruptor Simples Efapel Série 45',
  'Interruptor simples 10A 250V Efapel Série 45', 'aparelhagem', 'interruptores', 'un', 6.40, 23, 'branco', 'brilhante', NULL, 1, datetime('now'), datetime('now'));

-- =====================================================================
-- SEED: Materiais de catálogo — Legrand Niloe
-- =====================================================================
INSERT OR IGNORE INTO catalog_materials (id, series_id, brand_id, code, name, description, category, subcategory, unit, base_price, vat_rate, color, finish, image_url, is_active, created_at, updated_at) VALUES
('cat_lgn_tom_sch', 'ser_leg_niloe', 'brd_legrand', 'LEG-NIL-TOM-SCH', 'Tomada Schuko Legrand Niloe',
  'Tomada Schuko 2P+T 16A Legrand Niloe', 'aparelhagem', 'tomadas', 'un', 7.20, 23, 'branco', 'mate', NULL, 1, datetime('now'), datetime('now')),

('cat_lgn_int_sim', 'ser_leg_niloe', 'brd_legrand', 'LEG-NIL-INT-SIM', 'Interruptor Simples Legrand Niloe',
  'Interruptor simples 10AX Legrand Niloe', 'aparelhagem', 'interruptores', 'un', 6.90, 23, 'branco', 'mate', NULL, 1, datetime('now'), datetime('now'));

-- =====================================================================
-- SEED: Materiais de catálogo — Schneider (disjuntores)
-- =====================================================================
INSERT OR IGNORE INTO catalog_materials (id, series_id, brand_id, code, name, description, category, subcategory, unit, base_price, vat_rate, color, finish, image_url, is_active, created_at, updated_at) VALUES
('cat_sch_dis16',  NULL, 'brd_schneider', 'SCH-DISJ-16A', 'Disjuntor 16A Schneider iC60N',
  'Disjuntor magnetotérmico 16A 1P+N Schneider iC60N', 'proteção', 'disjuntores', 'un', 8.50, 23, 'branco', NULL, NULL, 1, datetime('now'), datetime('now')),

('cat_sch_dis20',  NULL, 'brd_schneider', 'SCH-DISJ-20A', 'Disjuntor 20A Schneider iC60N',
  'Disjuntor magnetotérmico 20A 1P+N Schneider iC60N', 'proteção', 'disjuntores', 'un', 8.90, 23, 'branco', NULL, NULL, 1, datetime('now'), datetime('now')),

('cat_sch_dis32',  NULL, 'brd_schneider', 'SCH-DISJ-32A', 'Disjuntor 32A Schneider iC60N',
  'Disjuntor magnetotérmico 32A 1P+N Schneider iC60N', 'proteção', 'disjuntores', 'un', 9.80, 23, 'branco', NULL, NULL, 1, datetime('now'), datetime('now')),

('cat_sch_dif30',  NULL, 'brd_schneider', 'SCH-DIF-30MA', 'Diferencial 30mA Schneider iID',
  'Interruptor diferencial 40A 30mA 2P AC Schneider iID', 'proteção', 'diferenciais', 'un', 28.50, 23, 'branco', NULL, NULL, 1, datetime('now'), datetime('now'));

-- =====================================================================
-- SEED: Materiais de catálogo — CIN (tintas)
-- =====================================================================
INSERT OR IGNORE INTO catalog_materials (id, series_id, brand_id, code, name, description, category, subcategory, unit, base_price, vat_rate, color, finish, image_url, is_active, created_at, updated_at) VALUES
('cat_cin_plasto_15L', NULL, 'brd_cin', 'CIN-PLASTOCEL-15L', 'Tinta CIN Plastocel 15L',
  'Tinta plástica interior Plastocel CIN 15 litros', 'tintas', 'interior', 'un', 42.00, 23, 'branco', 'mate', NULL, 1, datetime('now'), datetime('now')),

('cat_cin_plasto_4L',  NULL, 'brd_cin', 'CIN-PLASTOCEL-4L', 'Tinta CIN Plastocel 4L',
  'Tinta plástica interior Plastocel CIN 4 litros', 'tintas', 'interior', 'un', 14.50, 23, 'branco', 'mate', NULL, 1, datetime('now'), datetime('now')),

('cat_cin_ext_15L',    NULL, 'brd_cin', 'CIN-CINACRYL-15L', 'Tinta CIN Cinacryl Exterior 15L',
  'Tinta acrílica exterior Cinacryl CIN 15 litros', 'tintas', 'exterior', 'un', 58.00, 23, 'branco', 'mate', NULL, 1, datetime('now'), datetime('now'));

-- =====================================================================
-- SEED: Materiais de catálogo — Robbialac (tintas)
-- =====================================================================
INSERT OR IGNORE INTO catalog_materials (id, series_id, brand_id, code, name, description, category, subcategory, unit, base_price, vat_rate, color, finish, image_url, is_active, created_at, updated_at) VALUES
('cat_rob_lavavel_15L', NULL, 'brd_robbialac', 'ROB-LAVAVEL-15L', 'Tinta Robbialac Lavável 15L',
  'Tinta plástica lavável interior Robbialac 15 litros', 'tintas', 'interior', 'un', 38.00, 23, 'branco', 'acetinado', NULL, 1, datetime('now'), datetime('now'));

-- =====================================================================
-- SEED: Materiais de catálogo — Sika (impermeabilizações)
-- =====================================================================
INSERT OR IGNORE INTO catalog_materials (id, series_id, brand_id, code, name, description, category, subcategory, unit, base_price, vat_rate, color, finish, image_url, is_active, created_at, updated_at) VALUES
('cat_sika_tecto177', NULL, 'brd_sika', 'SIKA-TECTO-177-4KG', 'Sika Tecto-177 4kg',
  'Impermeabilizante acrílico elástico Sika Tecto-177 4kg', 'impermeabilizacao', 'coberturas', 'un', 32.00, 23, 'cinza', NULL, NULL, 1, datetime('now'), datetime('now'));

-- =====================================================================
-- SEED: Compatibilidades exemplo
-- =====================================================================
INSERT OR IGNORE INTO material_compatibility (id, material_id, compatible_material_id, compatibility_type, notes, created_at) VALUES
('cmp_001', 'cat_ef21_tom_sch', 'cat_ef21_int_sim', 'serie', 'Mesma série Efapel 21 — compatíveis na mesma placa', datetime('now')),
('cmp_002', 'cat_ef21_int_sim', 'cat_ef21_int_biv', 'serie', 'Mesma série Efapel 21', datetime('now')),
('cmp_003', 'cat_ef45_tom_sch', 'cat_ef45_int_sim', 'serie', 'Mesma série Efapel 45', datetime('now')),
('cmp_004', 'cat_lgn_tom_sch',  'cat_lgn_int_sim',  'serie', 'Mesma série Legrand Niloe', datetime('now')),
('cmp_005', 'cat_sch_dis16',    'cat_sch_dif30',    'sistema', 'Compatíveis no mesmo quadro Schneider', datetime('now'));
