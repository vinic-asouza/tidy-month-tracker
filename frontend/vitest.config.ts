import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Evita que o client real (`integrations/supabase/client.ts`) estoure ao ser
    // importado de forma transitiva. Os testes mockam o módulo, mas isso garante
    // que nenhuma suíte dependa de configuração de ambiente.
    env: {
      VITE_SUPABASE_URL: "http://localhost",
      VITE_SUPABASE_PUBLISHABLE_KEY: "test-key",
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
