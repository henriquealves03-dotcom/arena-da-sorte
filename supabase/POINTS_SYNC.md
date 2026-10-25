# Sincronização segura de pontos fictícios

A integração usa o histórico de pontos como fonte do saldo. O navegador não envia saldo para gravar; a Edge Function determina o resultado e a quantidade de pontos no servidor.

## Arquivos
- migrations/20261025000100_secure_demo_points.sql: adiciona registro de tentativas e remove escrita do cliente no ledger.
- functions/play-demo-game/index.ts: valida a sessão Supabase, limita rodadas, determina resultados no servidor e registra apenas pontos fictícios.

## Instalação necessária no Supabase
1. Abra o projeto correto no Supabase e faça backup antes de alterar o banco.
2. Execute o SQL da migration no SQL Editor.
3. Em Edge Functions, crie/publique uma função chamada play-demo-game com o código de functions/play-demo-game/index.ts.
4. Configure os secrets da função pelo painel Supabase. Ela precisa de SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (ou secret key equivalente suportada pelo projeto) e SUPABASE_ANON_KEY ou SUPABASE_PUBLISHABLE_KEY. Nunca coloque service-role/secret keys no HTML, GitHub ou conversa.
5. Confira que a função exige JWT (verify_jwt=true, padrão) e que o domínio do site está autorizado na configuração de CORS.
6. Teste com duas contas de teste: cada conta deve ler apenas seu próprio ledger; chamadas sem sessão devem falhar; INSERT/UPDATE/DELETE diretos em point_ledger por usuário autenticado devem ser negados; tentativas rápidas devem receber HTTP 429.

## Limites e estado
- Esta função trata roleta, cartas, dados e reflexo.
- Limite de 20 tentativas por minuto e pausa mínima de 1,5 segundo por usuário.
- Pontos são fictícios, sem valor monetário, saque, aposta ou prêmio real.
- Esta alteração de código não aplica automaticamente a migration nem publica a Edge Function.
- O frontend ainda precisa chamar supabaseClient.functions.invoke('play-demo-game', ...) e exibir o saldo retornado. Não use o cálculo local como saldo autoritativo para usuários conectados.
