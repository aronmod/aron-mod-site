import { LINKS } from "@/config/links";

/** Stato di supporto della mod sul server. */
export type ServerStatus = "working" | "partial" | "down" | "unknown";

/** Tri-state per funzioni/pacchetti: true = supportato, false = non supportato, null = da verificare. */
export type Support = boolean | null;

/** Funzioni filtrabili tramite i chip sopra la tabella. */
export const SERVER_FEATURES = ["autoDungeon", "switchAmmalia", "autoAlchimia", "captcha"] as const;

export type ServerFeature = (typeof SERVER_FEATURES)[number];

export type ServerRow = {
  name: string;
  url: string;
  status: ServerStatus;
  base: Support;
  plus: Support;
  features: Record<ServerFeature, Support>;
};

/**
 * Dataset centralizzato dei server supportati.
 * Per aggiungere un server basta appendere un oggetto qui.
 * Usa `null` quando il dato non è ancora confermato ("Da verificare").
 */
export const SERVERS: ServerRow[] = [
  {
    name: LINKS.server.name,
    url: LINKS.server.url,
    status: "working",
    base: true,
    plus: true,
    features: {
      autoDungeon: true,
      switchAmmalia: true,
      autoAlchimia: true,
      captcha: true,
    },
  },
];
