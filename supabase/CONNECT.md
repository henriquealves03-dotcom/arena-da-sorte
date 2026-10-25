# Conectar Arena da Sorte ao Supabase

O esquema inicial já foi executado. Este site é hospedado como página estática no GitHub Pages; por isso, a conexão usa apenas a URL do projeto e a chave **publishable** (pública), nunca uma chave secreta.

## Antes de ativar
- No Supabase, abra **Connect** ou **Settings → API Keys**.
- Copie o **Project URL** e a chave **publishable** (geralmente começa com `sb_publishable_`). Não copie nem publique `service_role`, `secret` ou senha do banco.
- O login por celular exige configurar um provedor SMS em **Authentication → Providers / Phone** e pode gerar custos.
- Não peça nem armazene CPF sem necessidade. Não use PIN de 6 dígitos como senha de conta; use autenticação por código SMS e os controles do Supabase Auth.
- As tabelas atuais guardam perfil, pontos fictícios e pedidos de reembolso de compras. Elas não habilitam apostas, prêmios em dinheiro, saques ou pagamentos.

## Estado atual
O site ainda não está ligado ao projeto Supabase. Os valores de conexão precisam ser configurados antes de habilitar autenticação. Depois, teste cadastro/login, recuperação de sessão e políticas RLS com uma conta de teste.

## Checklist
1. Confirmar que `profiles`, `point_ledger` e `purchase_refund_requests` aparecem no Table Editor.
2. Configurar provedor de autenticação e URL permitida em **Authentication → URL Configuration** (inclua a URL pública do GitHub Pages).
3. Inserir apenas URL do projeto e chave publishable na configuração pública do frontend.
4. Testar acesso autenticado e confirmar que cada usuário só consegue ler seus próprios dados.
5. Não colocar chaves secretas no HTML, JavaScript ou repositório.
