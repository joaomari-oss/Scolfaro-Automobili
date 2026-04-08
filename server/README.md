# Scolfaro Automobili — Backend API

## Configuração rápida

### 1. Instalar dependências
```bash
cd server
npm install
```

### 2. Criar o arquivo de variáveis de ambiente
```bash
cp .env.example .env
```
Abra `server/.env` e preencha:

```
GEMINI_API_KEY=AIzaSy...           # obrigatório para IA
FIPE_API_TOKEN=                    # opcional (1000 req/dia com token)
PORT=3001
```

### 3. Obter a chave da API Gemini
1. Acesse **https://aistudio.google.com/app/apikey**
2. Faça login ou crie uma conta
3. Clique em **Create API key**
4. Copie a chave (começa com `AIza...`)
5. Cole no `server/.env` no campo `GEMINI_API_KEY`

### 4. Rodar o servidor (desenvolvimento)
```bash
# A partir da raiz do projeto:
npm run dev            # roda frontend + backend juntos

# Ou separado:
npm run dev:api        # só o backend
npm run dev:ui         # só o frontend
```

## Rotas disponíveis

| Método | Rota                    | Descrição                        |
|--------|-------------------------|----------------------------------|
| GET    | `/api/health`           | Verifica se o servidor está ativo |
| POST   | `/api/ia/buscar-valores`| Consulta valor de mercado + FIPE via IA |
| POST   | `/api/fipe/search`      | Busca valor oficial na Tabela FIPE |

### POST `/api/ia/buscar-valores`
```json
{ "marca": "Ferrari", "modelo": "488 GTB", "ano": 2019, "quilometragem": 15000, "combustivel": "Gasolina" }
```
Resposta: `{ "valorMercado": 2100000, "valorFipe": 1980000, "observacao": "..." }`

### POST `/api/fipe/search`
```json
{ "marca": "Ferrari", "modelo": "488 GTB", "ano": 2019 }
```
Resposta (API FIPE v2):
```json
{ "success": true, "data": { "found": true, "data": { "brand": "Ferrari", "model": "488 GTB", "modelYear": 2019, "price": "R$ 1.980.000,00", "codeFipe": "...", "fuel": "Gasolina", "referenceMonth": "abril de 2026" } } }
```

## Observações

- A chave da API **NUNCA** deve ser commitada no Git
- `server/.env` já está no `.gitignore`
- Sem a `GEMINI_API_KEY`, o servidor roda em **modo de estimativa local** (valores aproximados sem IA)
- O token FIPE é opcional (registre-se em **https://fipe.online/register** via GitHub). Sem token: 500 req/dia. Com token: 1000 req/dia
- O servidor roda na porta **3001** por padrão, o frontend na **5173**
