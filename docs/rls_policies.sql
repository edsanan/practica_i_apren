-- 1. Habilitar RLS en totes les taules sensibles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_scores ENABLE ROW LEVEL SECURITY;

-- 2. Polítiques per a 'profiles' (Usuaris)
-- Un estudiant o admin només pot veure i editar el seu propi perfil
CREATE POLICY "Usuaris veuen el seu propi perfil" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Un pare/mare (admin) pot veure i gestionar els perfils dels seus fills
CREATE POLICY "Admins gestionen els seus fills" ON profiles
  FOR ALL USING (
    parent_id = auth.uid() AND 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- 3. Polítiques per a 'exercises' (Exercicis)
-- Qualsevol usuari (inclòs estudiants) pot veure exercicis ACTIUS
CREATE POLICY "Tots veuen exercicis actius" ON exercises
  FOR SELECT USING (status = 'active');

-- Els admins (pares) poden veure, crear i editar els seus propis exercicis (encara que estiguen pendents)
CREATE POLICY "Admins gestionen els seus propis exercicis" ON exercises
  FOR ALL USING (
    created_by = auth.uid() AND 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- 4. Polítiques per a 'metrics' i 'student_scores' (Mètriques i Puntuacions)
-- Els estudiants només poden llegir i inserir les seues pròpies mètriques
CREATE POLICY "Estudiants gestionen les seues mètriques" ON metrics
  FOR ALL USING (student_id = auth.uid());

-- Els pares (admins) poden llegir les mètriques exclusivament dels seus fills
CREATE POLICY "Admins veuen mètriques dels fills" ON metrics
  FOR SELECT USING (
    student_id IN (SELECT id FROM profiles WHERE parent_id = auth.uid())
  );

-- 5. Polítiques per al SUPERADMIN (El "Mode Déu")
-- El superadmin bota totes les restriccions i té accés total a qualsevol taula
CREATE POLICY "Superadmin accés total a perfils" ON profiles
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin');

CREATE POLICY "Superadmin accés total a exercicis" ON exercises
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin');

CREATE POLICY "Superadmin accés total a mètriques" ON metrics
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin');