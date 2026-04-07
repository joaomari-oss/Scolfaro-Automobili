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
ANTHROPIC_API_KEY=sk-ant-api...    # obrigatório para IA
FIPE_API_TOKEN=                    # opcional
PORT=3001
```

### 3. Obter a chave da API Anthropic
1. Acesse **https://console.anthropic.com**
2. Faça login ou crie uma conta
3. No menu lateral, clique em **API Keys**
4. Clique em **Create Key**
5. Copie a chave (começa com `sk-ant-api...`)
6. Cole no `server/.env` no campo `ANTHROPIC_API_KEY`

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
Resposta: `{ "success": true, "data": { "found": true, "data": { "Valor": "R$ 1.980.000,00", ... } } }`

## Observações

- A chave da API **NUNCA** deve ser commitada no Git
- `server/.env` já está no `.gitignore`
- Sem a `ANTHROPIC_API_KEY`, o servidor roda em **modo de estimativa local** (valores aproximados sem IA)
- O token FIPE é opcional; sem ele, o limite é 500 requisições por dia
- O servidor roda na porta **3001** por padrão, o frontend na **5173**
