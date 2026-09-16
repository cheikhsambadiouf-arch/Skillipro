# SKILLIA — web

Site vitrine SKILLIA (TanStack Start + TanStack Router + React 19 + Tailwind v4).

## Démarrer

```bash
npm install
npm run dev
```

Le serveur démarre sur `http://localhost:3000`. `npm run build` puis `npm run start`
pour un test en conditions proches de la production.

## Structure

```
src/
├── router.tsx           Instancie le routeur (créé par Claude — requis par routeTree.gen.ts)
├── start.ts              Config TanStack Start (créé par Claude — requis par routeTree.gen.ts)
├── routeTree.gen.ts       Auto-généré — ne jamais éditer à la main, sera régénéré au premier `npm run dev`
├── routes/
│   ├── __root.tsx         Assemble I18nProvider + SiteHeader + <Outlet/> + SiteFooter (créé par Claude)
│   ├── index.tsx          Accueil : 4 espaces, principe fondateur, bilan du soir
│   ├── talent.tsx         Espace Talent : profil vivant, compétences, CV auto
│   ├── entreprise.tsx     Espace Entreprise : recherche par besoin, matching, pipeline
│   ├── kids.tsx           SKILLIA Kids : parcours du jour, univers, badges, grades, sécurité
│   └── parcours.tsx       Le compte qui grandit avec l'âge, orientation progressive
├── components/
│   ├── site-header.tsx    Nav + sélecteur de langue FR/EN
│   ├── site-footer.tsx
│   └── ui-bits.tsx        Section, SectionTitle, Card, Chip, Progress
├── lib/
│   ├── i18n.tsx           I18nProvider + useI18n() (créé par Claude)
│   └── i18n-dict.ts       Dictionnaire de traductions FR/EN (créé par Claude)
├── styles/
│   └── app.css            Design tokens (oklch), gradients, polices Sora/Manrope
└── assets/
    └── skillia-hero.jpg   Photo détourée du prototype, aplatie sur le fond du design system
```

## À vérifier / compléter

- **`src/components/site-header.tsx` et `site-footer.tsx`** : j'ai supposé ces noms de
  fichiers et ce dossier (`@/components/...`) pour faire correspondre les imports de
  `__root.tsx`. Si ton projet d'origine les nommait autrement, renomme les fichiers ou
  ajuste les imports dans `__root.tsx`.
- **Contenu du dictionnaire (`i18n-dict.ts`)** : j'ai écrit ce texte moi-même (FR + EN)
  à partir du cahier des charges SKILLIA — relis-le, c'est le genre de contenu qu'on
  ajuste volontiers une fois qu'on le voit en situation.
- **Aucun backend** : les pages affichent des données statiques (candidats, badges,
  etc.) codées en dur dans chaque route, comme dans les fichiers que tu as fournis.
- **Pas de tests, pas de CI, pas de déploiement configuré** — hors périmètre de ce qui a été demandé jusqu'ici.
