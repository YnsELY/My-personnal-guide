# Comptes de test Store Review

Script: `scripts/create-store-review-accounts.ts`

## Prérequis
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Exécution
Utiliser un runtime TypeScript Node (ex: `tsx`) pour exécuter le script.

Exemple:

```bash
npx tsx scripts/create-store-review-accounts.ts
```

## Résultat
Le script crée/garantit:
- Un compte pèlerin de test
- Un compte guide de test déjà approuvé
- Un solde fictif sur la cagnotte pèlerin

Le script affiche les identifiants en sortie terminal.
