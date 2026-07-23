# Assistant Clinique — Chatbot IA

Documentation de l'assistant IA intégré à la page de consultation (SHIFA).

Composant : [`ConsultationChatbot.tsx`](../components/ConsultationChatbot.tsx)
Monté dans : [`ConsultationPage.tsx`](../components/ConsultationPage.tsx)

---

## 1. Rôle

L'assistant se comporte comme un **médecin senior expérimenté** qui épaule un
confrère pendant sa consultation. Il est intégré directement dans le dossier du
patient et agit comme une **aide à la décision médicale** — jamais comme un
remplaçant du jugement clinique du médecin.

| Aspect | Détail |
|---|---|
| Persona | Médecin senior / assistant clinique |
| Mission | Aide à la décision (rappels, posologies, diagnostics différentiels, protocoles) |
| Langue | Français |
| Limite | Ne pose pas de diagnostic définitif, ne prescrit pas à la place du médecin |
| Garde-fou | N'invente jamais de données patient ; demande l'info manquante |

---

## 2. Configuration technique

| Paramètre | Valeur | Rôle |
|---|---|---|
| Fournisseur | **Groq** (API compatible OpenAI) | Inférence rapide |
| Endpoint | `https://api.groq.com/openai/v1/chat/completions` | Chat Completions |
| Modèle | `openai/gpt-oss-20b` | Génération de texte |
| `temperature` | `0.4` | Réponses précises, peu aléatoires |
| `max_completion_tokens` | `700` | Plafonne la longueur (réponses concises) |
| `top_p` | `1` | Nucleus sampling |
| `stream` | `true` | Deltas partiels → affichage en temps réel |
| Clé API | `VITE_GROQ_API_KEY` (via `.env`) | Injectée au build par Vite |

> ⚠️ **Note de sécurité** : avec le préfixe `VITE_`, la clé est incluse dans le
> bundle navigateur et donc **visible côté client**. Acceptable pour une démo ;
> pour la production, passer par un proxy serveur (Express) gardant la clé
> côté serveur.

---

## 3. Prompt (les 5 blocs)

Le prompt système est construit selon 5 blocs : **Rôle · Instructions ·
Contexte · Entrée · Format de sortie**.

### RÔLE
> Tu es un assistant médical clinique — un médecin senior expérimenté qui épaule
> un confrère pendant sa consultation. Tu es intégré directement dans le dossier
> de consultation du patient et tu réponds comme une aide à la décision médicale
> de confiance.

### INSTRUCTIONS
- Réponds en français, vocabulaire médical précis.
- Sois BREF : vise moins de 150 mots. Va droit au but, pas de remplissage.
- Utilise le markdown : **gras** pour les termes clés, listes à puces, titres courts.
- Une idée par puce, phrases courtes. Pas de longs paragraphes.
- Tiens compte du contexte patient ; signale toute contre-indication ou allergie.
- N'invente JAMAIS de données patient. Si une info manque, demande-la.
- Ne remplace pas le jugement clinique ; pas de diagnostic définitif.

### CONTEXTE (injecté dynamiquement)
Résumé du dossier de la consultation en cours, transmis à chaque requête :
- Patient : nom + identifiant
- Âge, sexe, groupe sanguin
- Allergies
- Problèmes actifs
- Diagnostics en cours

> Source : construit dans `ConsultationPage.tsx` à partir des contextes
> `PatientContext`, `ChartContext` et `ConsultationContext`, puis passé via la
> prop `context`.

### ENTRÉE
La question du médecin = dernier message de la conversation. L'historique
complet des échanges est renvoyé à chaque appel pour garder le contexte
multi-tours.

### FORMAT DE SORTIE ATTENDU
```
**Réponse** : 1 phrase directe.
- puces courtes (diagnostics / posologies / examens)
- ⚠️ ligne d'alerte seulement si contre-indication/allergie pertinente
```
Le rappel « décision finale au médecin » n'apparaît **que** pour les questions
de prescription ou de traitement.

---

## 4. Rendu & expérience

| Fonction | Comportement |
|---|---|
| Lanceur | Cercle flottant en bas à droite avec l'icône `chatbotIcon.avif` |
| Panneau | **Sidebar** qui glisse de la droite vers la gauche + fond assombri |
| Streaming | Le texte s'affiche token par token (effet machine à écrire) |
| Markdown | Rendu maison : **gras**, *italique*, `code`, listes à puces, titres |
| Curseur | Barre clignotante avant l'arrivée du premier token |
| Multi-tours | Conserve l'historique de la conversation |

---

## 5. Fichiers liés

| Fichier | Rôle |
|---|---|
| `src/components/ConsultationChatbot.tsx` | Composant chatbot (UI + appel Groq + rendu markdown) |
| `src/components/ConsultationPage.tsx` | Monte le chatbot et fournit le contexte patient |
| `src/assests/chatbotIcon.avif` | Icône du lanceur et de l'en-tête |
| `.env` | `VITE_GROQ_API_KEY` (non commité) |
| `.env.example` | Modèle documentant la variable requise |
| `src/docs/text2text.md` | Référence API Groq (Chat Completions / streaming) |
