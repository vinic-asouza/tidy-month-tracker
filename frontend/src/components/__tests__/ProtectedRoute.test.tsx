/**
 * DEV-69 — Guarda de rota.
 *
 * Sem sessão, redireciona para `/auth`; com sessão, renderiza o conteúdo;
 * enquanto carrega, não decide nada (evita flash de redirect).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  authState: { user: null as { id: string } | null, loading: false },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mocks.authState.user,
    loading: mocks.authState.loading,
    session: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
  }),
}));

import { ProtectedRoute } from '../ProtectedRoute';

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <p>Área privada</p>
            </ProtectedRoute>
          }
        />
        <Route path="/auth" element={<p>Tela de login</p>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  mocks.authState.user = null;
  mocks.authState.loading = false;
});

describe('ProtectedRoute', () => {
  it('redireciona para /auth quando não há sessão', () => {
    renderProtected();

    expect(screen.getByText('Tela de login')).toBeInTheDocument();
    expect(screen.queryByText('Área privada')).not.toBeInTheDocument();
  });

  it('renderiza o conteúdo quando há sessão', () => {
    mocks.authState.user = { id: 'user-1' };
    renderProtected();

    expect(screen.getByText('Área privada')).toBeInTheDocument();
  });

  it('não redireciona enquanto a sessão carrega', () => {
    mocks.authState.loading = true;
    renderProtected();

    expect(screen.queryByText('Tela de login')).not.toBeInTheDocument();
    expect(screen.queryByText('Área privada')).not.toBeInTheDocument();
  });
});
