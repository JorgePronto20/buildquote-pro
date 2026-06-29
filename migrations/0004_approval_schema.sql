-- BuildQuote Pro - Fase 2
-- Migration 0004: aprovação de orçamentos
-- NOTA: public_token já existe na tabela quotes (criado em 0002). Não alterar quotes aqui.

CREATE TABLE IF NOT EXISTS quote_approvals (
  id TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL UNIQUE,
  approved_by_professional INTEGER NOT NULL DEFAULT 0,
  approved_by_client INTEGER NOT NULL DEFAULT 0,
  client_name TEXT,
  client_email TEXT,
  client_ip TEXT,
  professional_notes TEXT,
  client_notes TEXT,
  approved_at TEXT,
  rejected_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quote_approvals_quote ON quote_approvals(quote_id);
