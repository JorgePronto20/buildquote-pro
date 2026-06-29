# BuildQuote Pro API

Backend da **Fase 1 MVP** da plataforma BuildQuote Pro: uma plataforma modular para orçamentação, adjudicação e encomenda automática de materiais para profissionais da construção civil.

## Stack

- Cloudflare Workers em JavaScript ES Modules puro
- Cloudflare D1 para base de dados relacional
- Cloudflare KV para cache/configuração
- Cloudflare R2 preparado para ficheiros/anexos
- JWT manual com Web Crypto API (`HMAC-SHA256`)
- Hash de passwords com PBKDF2 via Web Crypto API
- Sem bibliotecas externas de runtime

## Estrutura

```txt
buildquote-pro/
├── README.md
├── wrangler.toml
├── package.json
├── .gitignore
├── .env.example
├── migrations/
│   ├── 0001_initial_schema.sql
│   └── 0002_quotes_schema.sql
└── src/
    ├── worker.js
    ├── router.js
    ├── middleware/
    │   ├── auth.js
    │   ├── cors.js
    │   └── validation.js
    ├── modules/
    │   ├── auth/routes.js
    │   ├── professionals/routes.js
    │   ├── quotes/routes.js
    │   ├── quotes/service.js
    │   ├── materials/routes.js
    │   └── profession-engine/
    │       ├── routes.js
    │       └── formulas/
    │           ├── electrician.js
    │           ├── painter.js
    │           └── plumber.js
    └── utils/
        ├── ids.js
        ├── money.js
        ├── jwt.js
        └── responses.js
```

## Setup Cloudflare

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar base D1

```bash
npx wrangler d1 create buildquote_pro_db
```

Copie o `database_id` devolvido para `wrangler.toml`.

### 3. Criar namespace KV

```bash
npx wrangler kv namespace create APP_KV
```

Copie o `id` devolvido para `wrangler.toml`.

### 4. Criar bucket R2

```bash
npx wrangler r2 bucket create buildquote-pro-files
```

> O R2 fica preparado na Fase 1; upload/gestão de ficheiros será implementado em fase posterior.

### 5. Configurar segredo JWT

Em produção, não deixe o valor de exemplo em `wrangler.toml`:

```bash
npx wrangler secret put JWT_SECRET
```

Para desenvolvimento local, copie `.env.example` para `.dev.vars` e ajuste os valores.

### 6. Aplicar migrations

Local:

```bash
npm run db:migrate:local
```

Produção:

```bash
npm run db:migrate
```

### 7. Executar localmente

```bash
npm run dev
```

### 8. Deploy

```bash
npm run deploy
```

## Scripts

| Script | Descrição |
|---|---|
| `npm run dev` | Arranca `wrangler dev` |
| `npm run deploy` | Publica o Worker |
| `npm run db:migrate` | Aplica migrations D1 em produção |
| `npm run db:migrate:local` | Aplica migrations D1 localmente |
| `npm run check` | Verifica sintaxe de `worker.js` e `router.js` |

## Autenticação

Rotas protegidas exigem header:

```http
Authorization: Bearer <jwt>
```

Exceções públicas:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/quotes/public/:token`
- `POST /api/quotes/public/:token/accept`
- `GET /api/health`

Todas as respostas seguem o formato:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "message": null
}
```

## Endpoints principais

| Método | Endpoint | Auth | Descrição |
|---|---|---:|---|
| GET | `/api/health` | Não | Estado da API |
| POST | `/api/auth/register` | Não | Registar utilizador/profissional e emitir JWT |
| POST | `/api/auth/login` | Não | Login e emissão de JWT |
| GET | `/api/auth/me` | Sim | Dados do utilizador autenticado |
| GET | `/api/professional/me` | Sim | Perfil profissional |
| PUT | `/api/professional/me` | Sim | Atualizar perfil profissional |
| GET | `/api/quotes` | Sim | Listar orçamentos com filtros `status`, `cliente`, `date_from`, `date_to` |
| POST | `/api/quotes` | Sim | Criar orçamento |
| GET | `/api/quotes/:id` | Sim | Detalhe completo com zonas, itens e histórico |
| PUT | `/api/quotes/:id` | Sim | Atualizar orçamento |
| DELETE | `/api/quotes/:id` | Sim | Anular orçamento |
| POST | `/api/quotes/:id/duplicate` | Sim | Duplicar orçamento |
| POST | `/api/quotes/:id/send` | Sim | Marcar como enviado e gerar link público |
| POST | `/api/quotes/:id/approve` | Sim | Aprovar pelo profissional |
| POST | `/api/quotes/:id/cancel` | Sim | Anular orçamento |
| GET | `/api/quotes/public/:token` | Não | Ver orçamento por link público |
| POST | `/api/quotes/public/:token/accept` | Não | Cliente aceita orçamento |
| POST | `/api/quotes/:id/zones` | Sim | Adicionar zona |
| PUT | `/api/quotes/:id/zones/:zoneId` | Sim | Editar zona |
| DELETE | `/api/quotes/:id/zones/:zoneId` | Sim | Remover zona |
| POST | `/api/quotes/:id/items` | Sim | Adicionar item |
| PUT | `/api/quotes/:id/items/:itemId` | Sim | Editar item |
| DELETE | `/api/quotes/:id/items/:itemId` | Sim | Remover item |
| GET | `/api/professions` | Sim | Listar profissões disponíveis |
| GET | `/api/professions/:code/rules` | Sim | Regras de cálculo por profissão |
| POST | `/api/calculate` | Sim | Cálculo automático por profissão |
| GET | `/api/materials` | Sim | Listar materiais; filtros `profession`, `category`, `q` |
| POST | `/api/materials` | Sim | Criar material |
| PUT | `/api/materials/:id` | Sim | Editar material |
| DELETE | `/api/materials/:id` | Sim | Remover material logicamente |

## Exemplos rápidos

### Registo

```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"João Silva","email":"joao@example.com","password":"senha-segura","profession":"electrician"}'
```

### Criar orçamento

```bash
curl -X POST http://localhost:8787/api/quotes \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"client_name":"Cliente Teste","profession":"electrician","notes":"Instalação elétrica T2"}'
```

### Calcular materiais para eletricista

```bash
curl -X POST http://localhost:8787/api/calculate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"profession":"electrician","inputs":{"area_m2":80,"pontos_tomada":25,"pontos_iluminacao":12,"num_rooms":5}}'
```

## GitHub

Após substituir IDs e testar localmente:

```bash
git init
git add .
git commit -m "feat: fase 1 backend MVP"
```

Depois associe o repositório remoto no GitHub:

```bash
git remote add origin <URL_DO_REPOSITORIO>
git push -u origin main
```
