# Directrius del Projecte: App Educativa 4t Primària

## 1. Pila Tecnològica i Arquitectura
- **Frontend:** React (components funcionals, Hooks) i CSS natiu.
- **Backend i Base de Dades:** Supabase (Pla Gratuït). S'utilitzarà PostgreSQL amb regles estrictes de Row Level Security (RLS).
- **Autenticació:** Correu electrònic i contrasenya via Supabase Auth.
- **Metodologia:** Desenvolupament Guiat per Especificacions (Spec-Driven Development). Sol·licitar confirmació abans de generar codi definitiu.

## 2. Rols i Regles de Negoci
- **Estudiant:** Accedeix a un tauler gamificat. Visualitza assignatures, blocs temàtics i un marcador amb les millors puntuacions. Només té permisos de lectura d'exercicis i escriptura de les seues pròpies mètriques.
- **Admin (Pare/Mare):** Pot donar d'alta/baixa estudiants i crear nous exercicis a partir de plantilles. Tot allò que crea queda en estat `pendent_validacio`. Pot visualitzar el progrés dels seus estudiants assignats.
- **Superadmin:** Té control total. Valida nous estudiants, nous admins i els exercicis creats pels admins. Pot crear qualsevol entitat directament validada.

## 3. Dinàmica d'Exercicis i Mètriques
- **Tipologia:** Preguntes i respostes, enllaçar conceptes, completar frases.
- **Mètriques en Temps Real:** El sistema enviarà les dades a Supabase (encerts, errades, temps emprat i actualització de ratxes) immediatament en acabar cada exercici individual, sense bloquejar la UI.
- **Visibilitat:** L'enfocament principal per a l'estudiant ha de ser vistós i orientat al reforç, mantenint l'objectiu pedagògic sense distraccions administratives.

## 4. Idiomes
- **Interfície i Menús:** Valencià.
- **Continguts:** Matemàtiques, Valencià i Coneixement del Medi (Valencià); Llengua Castellana (Castellà); Anglés (Anglés).
- **Codi Font i Base de Dades:** Anglés per a variables, funcions, taules i columnes.

## 5. Resolució d'Ambigüitats
- Detín l'execució i consulta qualsevol dubte estructural abans de programar. En rebre resposta, actualitza aquest fitxer `AI_INSTRUCTIONS.md` automàticament.