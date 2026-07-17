-- Studio Kids — dados iniciais
-- Usuarios de teste nao sao semeados aqui: senhas devem passar pelo
-- fluxo de auth do Supabase (hash bcrypt via GoTrue), nao por INSERT
-- direto em auth.users. Para testar localmente, cadastre-se em /login
-- e depois rode o UPDATE comentado no fim deste arquivo para virar
-- professor ou admin.

insert into public.categories (name, slug, icon) values
  ('Programacao', 'programacao', 'code-2'),
  ('Matematica', 'matematica', 'sigma'),
  ('Idiomas', 'idiomas', 'languages'),
  ('Design', 'design', 'palette'),
  ('Negocios', 'negocios', 'briefcase'),
  ('Ciencias', 'ciencias', 'flask-conical'),
  ('Musica', 'musica', 'music'),
  ('Carreira', 'carreira', 'trending-up')
on conflict (slug) do nothing;

-- Depois de criar uma conta pelo app, promova-a para professor ou admin:
-- update public.profiles set role = 'professor' where username = 'seu_usuario';
-- update public.profiles set role = 'admin' where username = 'seu_usuario';
