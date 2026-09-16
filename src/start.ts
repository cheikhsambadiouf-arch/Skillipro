import { createStart } from "@tanstack/react-start";

// Configuration minimale. C'est ici qu'on ajouterait plus tard le middleware CSRF
// personnalisé, des adaptateurs de sérialisation, etc. si besoin.
export const startInstance = createStart(() => ({}));
