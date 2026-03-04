# 🚗 Sistema de Controle de Frotas - Guia Rápido de Integração

## 📦 Arquivos Criados/Atualizados

### 1. **`supabase/database.sql`** ⭐ ARQUIVO PRINCIPAL
Arquivo SQL único e completo com:
- ✅ Tabela `vehicle_records` totalmente estruturada
- ✅ Índices para performance
- ✅ Função e trigger para atualizar `updated_at` automaticamente
- ✅ Row Level Security (RLS) configurado
- ✅ Comentários em português para documentação

### 2. **`.env.example`**
Exemplo de variáveis de ambiente necessárias

### 3. **`SUPABASE_SETUP.md`**
Guia completo de configuração passo a passo

---

## 🚀 Passos Rápidos para Usar

### Passo 1: Executar o SQL no Supabase
```bash
1. Acesse https://app.supabase.com
2. Selecione seu projeto
3. Vá para "SQL Editor" → "New Query"
4. Abra e copie TODO o conteúdo de: supabase/database.sql
5. Cole no editor SQL do Supabase e execute (Run)
```

### Passo 2: Configurar Variáveis de Ambiente
```bash
1. Copie .env.example → .env.local
2. No Supabase, vá para Settings → API
3. Copie "Project URL" para VITE_SUPABASE_URL
4. Copie "anon public" para VITE_SUPABASE_ANON_KEY
5. Preencha no .env.local
```

### Passo 3: Iniciar a Aplicação
```bash
cd "c:\Users\Gontijo\Desktop\sistema de frotas\Frotas"
npm run dev
```

### Passo 4: Testar
- Abra http://localhost:5173
- Crie um novo registro
- Verifique no Supabase → Table Editor → vehicle_records

---

## 📋 Conteúdo do Arquivo SQL

O arquivo `supabase/database.sql` contém:

```sql
✅ EXTENSÃO: uuid-ossp para gerar UUIDs
✅ TABELA: vehicle_records com 17 colunas estruturadas
✅ ÍNDICES: 4 índices para otimizar queries
✅ FUNÇÃO: update_updated_at_column() 
✅ TRIGGER: atualizar updated_at automaticamente
✅ RLS: Row Level Security habilitado
✅ POLÍTICAS: 4 políticas de acesso (SELECT, INSERT, UPDATE, DELETE)
✅ COMENTÁRIOS: Documentação em português
```

---

## 🔑 Variáveis de Ambiente Necessárias

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Onde encontrar:**
1. Supabase Dashboard
2. Settings → API
3. Copie "Project URL" e "anon public"

---

## 📊 Estrutura da Tabela

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | Identificador único |
| `vehicle_plate` | text | Placa do veículo |
| `reason` | text | Motivo da utilização |
| `authorized_by` | text | Quem autorizou |
| `pickup_date` | date | Data de retirada |
| `pickup_time` | time | Hora de retirada |
| `pickup_name` | text | Nome de quem retirou |
| `pickup_signature` | text | Assinatura (Base64) de retirada |
| `return_date` | date | Data de devolução |
| `return_time` | time | Hora de devolução |
| `return_name` | text | Nome de quem devolveu |
| `return_signature` | text | Assinatura (Base64) de devolução |
| `observations` | text | Observações adicionais |
| `status` | text | "Em uso" ou "Devolvido" |
| `created_at` | timestamptz | Criado em |
| `updated_at` | timestamptz | Atualizado em |

---

## 🔗 Integração Código (Já Está Pronta!)

O código já está 100% integrado com Supabase:

- ✅ **`lib/supabase.ts`** - Cliente Supabase configurado
- ✅ **`services/vehicleService.ts`** - Serviço com CRUD completo
- ✅ **`types/database.ts`** - Types para TypeScript
- ✅ **`components/VehicleForm.tsx`** - Formulário de entrada
- ✅ **`components/DatabaseView.tsx`** - Visualização dos registros

---

## ⚠️ Importantes

1. **Nunca commitar `.env.local`** - Use `.env.local` para desenvolvimento
2. **RLS Público** - As políticas RLS permitem acesso público (se precisar apenas de autenticados, modifique as políticas)
3. **Backup** - Faça backup do banco antes de fazer mudanças

---

## 🆘 Erros Comuns

| Erro | Solução |
|------|---------|
| "Missing Supabase environment variables" | Verifique `.env.local` |
| "Relation not found" | Execute o SQL novamente |
| "No rows returned" | Verifique se os dados foram salvos |
| CORS error | Verifique credenciais do Supabase |

---

## 📞 Próximas Etapas

1. ✅ Execute o arquivo SQL
2. ✅ Configure `.env.local`
3. ✅ Rode `npm run dev`
4. ✅ Teste a aplicação

**Tudo está pronto para usar!** 🎉

---

*Sistema de Controle de Frotas - Integração Supabase*
*Última atualização: 04/03/2026*
