export const APP_URL =
  import.meta.env.VITE_APP_URL ?? "https://tidy-month-tracker.vercel.app";

export const AUTH_URL = `${APP_URL.replace(/\/$/, "")}/auth`;
