# Especificació del Frontend: Arquitectura i Rutes (React)

## 1. Estructura de Rutes (React Router)
L'aplicació es dividirà en tres grans àrees protegides (segons el rol) i una àrea pública.

**Rutes Públiques:**
- `/` -> Landing page molt senzilla.
- `/login` -> Formulari d'accés (correu i contrasenya).
- `/registre` -> Creació de compte per a nous administradors (pares).

**Rutes de l'Estudiant (Disseny Gamificat i Net):**
- `/estudiant/dashboard` -> Pantalla principal: Marcador global, ratxes i selecció d'assignatura.
- `/estudiant/assignatura/:id_assignatura` -> Llista de blocs temàtics (ex: Fraccions, L'aparell digestiu).
- `/estudiant/exercici/:id_topic` -> El motor d'exercicis. Interfície immersiva sense menús de navegació complexos, només el repàs i l'eixida.

**Rutes de l'Admin (Pares):**
- `/admin/dashboard` -> Resum del progrés dels xiquets assignats.
- `/admin/alumnes` -> Gestió (alta/baixa) i vista detallada de les mètriques de cada alumne.
- `/admin/exercicis` -> Creador d'exercicis (formularis per a afegir noves preguntes, pendents de validació).

**Rutes del Superadmin (Gestió Total):**
- `/superadmin/dashboard` -> Panell de control global.
- `/superadmin/validacions` -> Llista d'usuaris i exercicis pendents d'aprovar (botons d'Aprovar/Rebutjar).

## 2. Arquitectura de Carpetes
L'estructura del projecte React (dins de `src/`) s'organitzarà per dominis per a facilitar l'escalabilitat:

```text
src/
├── assets/           # Imatges, icones, sons d'encert/errada.
├── components/       # Components reutilitzables
│   ├── ui/           # Botons, Modals, Targetes (genèrics)
│   ├── student/      # Interfícies vistoses (Marcador, Feedback visual)
│   └── admin/        # Taules de dades, Formularis
├── features/         # Lògica agrupada per funcionalitat
│   ├── auth/         # Context d'autenticació i protecció de rutes
│   └── exercises/    # El "Motor d'Exercicis" (QA, Match, FillBlanks)
├── hooks/            # Custom hooks (ex: useSupabase, useMetrics)
├── pages/            # Les vistes principals associades a les rutes
└── services/         # Connexions directes a la API de Supabase