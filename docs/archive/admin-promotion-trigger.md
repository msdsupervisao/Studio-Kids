# Promoção a admin via SQL Editor está quebrada

**Achado em 2026-07-24**, durante o trabalho nos testes automatizados.

A migration `0005_security_hardening.sql` adicionou um trigger `protect_profile_privileges`
(BEFORE UPDATE em `profiles`) que só aceita mudança de `role` vinda de quem já é admin.

Isso quebrou a instrução do README de promover a primeira conta a admin via
`UPDATE ... SET role = 'admin'` no SQL Editor — esse UPDATE cai no mesmo trigger e falha
com "Somente administradores podem alterar papéis", mesmo rodando como superusuário
(o trigger depende de `auth.uid()`, que é nulo fora de uma request autenticada).

Hoje o único jeito de promover alguém é já estar logado como um admin existente e usar
`/admin/usuarios`.

O helper de e2e contorna isso apagando e reinserindo a linha do profile (o trigger é só
BEFORE UPDATE, não pega INSERT) — serve **só** para bootstrap de conta de teste, nunca usar
esse truque para promover uma conta real.

Vale atualizar o README ou adicionar um bootstrap alternativo (ex: RPC `security definer`
para o primeiro admin) quando sobrar tempo.
