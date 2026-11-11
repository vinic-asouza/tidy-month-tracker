/**
 * DEV-186 — Banner offline (shell PWA).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { OfflineBanner } from "../OfflineBanner";

describe("OfflineBanner", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      get: () => true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("não renderiza quando online", () => {
    render(<OfflineBanner />);
    expect(screen.queryByTestId("offline-banner")).not.toBeInTheDocument();
  });

  it("mostra aviso quando offline e some ao voltar online", () => {
    let online = false;
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      get: () => online,
    });

    render(<OfflineBanner />);
    expect(screen.getByTestId("offline-banner")).toHaveTextContent(
      /Sem conexão — reconecte para ver seus dados/,
    );

    online = true;
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.queryByTestId("offline-banner")).not.toBeInTheDocument();
  });
});
