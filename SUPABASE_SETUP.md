# 🚗 Sistema de Controle de Frotas - Guia de Integração Supabase

## ✅ Checklist de Configuração

### 1. Criar um Projeto no Supabase
- [ ] Acesse [https://app.supabase.com](https://app.supabase.com)
- [ ] Clique em "New Project"
- [ ] Preencha os dados (nome, banco de dados, senha)
- [ ] Aguarde a criação do projeto

### 2. Executar o Arquivo SQL
- [ ] Abra o arquivo `supabase/database.sql`
- [ ] Copie TODO o conteúdo
- [ ] No Supabase:
  - Vá para "SQL Editor"
  - Clique em "New Query"
  - Cole TODO o código SQL
  - Clique em "Run" (ou Ctrl+Enter)
- [ ] Verifique se as tabelas foram criadas em "Table Editor"

### 3. Obter as Credenciais do Supabase
- [ ] No seu projeto Supabase, vá para "Settings" > "API"
- [ ] Copie:
  - **Project URL** (servirá para `VITE_SUPABASE_URL`)
  - **anon public** (servirá para `VITE_SUPABASE_ANON_KEY`)

### 4. Configurar Variáveis de Ambiente
- [ ] Crie um arquivo `.env.local` na raiz do projeto
- [ ] Copie o conteúdo de `.env.example` para `.env.local`
- [ ] Preencha com suas credenciais:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Testar a Conexão
- [ ] Abra o terminal na pasta do projeto
- [ ] Execute `npm run dev`
- [ ] Abra a aplicação no navegador
- [ ] Tente criar um novo registro de veículo
- [ ] Verifique em "Table Editor" > "vehicle_records" se o registro foi criado

---

## 📁 Estrutura de Arquivos Criados

```
projeto/
├── supabase/
│   ├── database.sql              ← Arquivo completo para criar todas as tabelas
│   └── migrations/
│       └── 20260304132509_...    (antigo, pode ser removido)
├── .env.example                   ← Exemplo de variáveis de ambiente
├── .env.local                     ← CRIAR este arquivo com suas credenciais
└── (outros arquivos)
```

---

## 🔐 Segurança - Row Level Security (RLS)

O arquivo SQL já vem configurado com:
- ✅ RLS habilitado na tabela `vehicle_records`
- ✅ Políticas que permitem acesso público (para aplicação interna)

**Nota:** Se esta fosse uma aplicação pública, você deveria:
- Implementar autenticação no Supabase
- Modificar as políticas RLS para aceitar apenas usuários autenticados

---

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
- ✓ Verifique se o arquivo `.env.local` existe
- ✓ Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão preenchidos
- ✓ Reinicie o servidor de desenvolvimento (`npm run dev`)

### Erro ao criar novo registro
- ✓ Verifique se as tabelas foram criadas no Supabase
- ✓ Verifique as credenciais no `.env.local`
- ✓ Abra o console do navegador e procure por erros

### Tabelas não aparecem no Supabase
- ✓ Verifique se o SQL foi executado sem erros
- ✓ Atualize a página do navegador (F5)
- ✓ Verifique se está no banco de dados correto

---

## 📊 Tabelas Criadas

### `vehicle_records`
Armazena todos os registros de retirada e devolução de veículos.

**Campos principais:**
- `id` - Identificador único (UUID)
- `vehicle_plate` - Placa do veículo
- `reason` - Motivo da utilização
- `authorized_by` - Quem autorizou
- `pickup_date`, `pickup_time` - Data e hora de retirada
- `pickup_name`, `pickup_signature` - Responsável e assinatura de retirada
- `return_date`, `return_time` - Data e hora de devolução (opcional)
- `return_name`, `return_signature` - Responsável e assinatura de devolução (opcional)
- `observations` - Observações adicionais
- `status` - "Em uso" ou "Devolvido"
- `created_at`, `updated_at` - Timestamps automáticos

---

## 🚀 Próximos Passos

1. ✅ Execute o arquivo SQL no Supabase
2. ✅ Configure as variáveis de ambiente
3. ✅ Execute `npm run dev` para iniciar a aplicação
4. ✅ Teste a funcionalidade de criar e visualizar registros

---

## 📚 Referências

- [Documentação Supabase](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)

---

**Última atualização:** 04/03/2026
