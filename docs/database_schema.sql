-- 1. Definicions d'estats i tipus (Enums)
CREATE TYPE user_role AS ENUM ('student', 'admin', 'superadmin');
CREATE TYPE entity_status AS ENUM ('pending_validation', 'active', 'inactive');
CREATE TYPE exercise_type AS ENUM ('qa', 'match', 'fill_blanks');

-- 2. Perfils d'usuari (Estén el sistema auth.users de Supabase)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role user_role NOT NULL,
  status entity_status DEFAULT 'pending_validation',
  parent_id UUID REFERENCES profiles(id), -- Relaciona l'estudiant amb l'admin (pare/mare)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Currículum: Assignatures i Blocs temàtics
CREATE TABLE subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL -- ex: 'math', 'english', 'valencian'
);

CREATE TABLE topics (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(id),
  name VARCHAR(100) NOT NULL
);

-- 4. Motor d'exercicis
CREATE TABLE exercises (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER REFERENCES topics(id),
  type exercise_type NOT NULL,
  content JSONB NOT NULL, -- L'estructura flexible per a diferents tipus de preguntes
  created_by UUID REFERENCES profiles(id),
  status entity_status DEFAULT 'pending_validation',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Mètriques d'execució (Es guarda en acabar cada exercici)
CREATE TABLE metrics (
  id SERIAL PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  exercise_id INTEGER REFERENCES exercises(id),
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tauler de Gamificació (Marcador agregat)
CREATE TABLE student_scores (
  student_id UUID REFERENCES profiles(id),
  subject_id INTEGER REFERENCES subjects(id),
  total_score INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  PRIMARY KEY (student_id, subject_id)
);