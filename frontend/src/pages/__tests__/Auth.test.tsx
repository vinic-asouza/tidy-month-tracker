/**
 * DEV-69 — Tela de autenticação.
 *
 * Cobre validação de formulário (e-mail, senha e confirmação no cadastro),
 * tradução do erro retornado pelo Supabase e o redirect de quem já está
 * autenticado. O `AuthContext` é mockado — nenhuma chamada real é feita.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  resetPassword: vi.fn(),
  authState: { user: null as { id: string } | null, loading: false },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});

vi.mock('sonner', () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: mocks.signIn,
    signUp: mocks.signUp,
    resetPassword: mocks.resetPassword,
    signOut: vi.fn(),
    session: null,
    user: mocks.authState.user,
    loading: mocks.authState.loading,
  }),
}));

import Auth from '../Auth';

function renderAuth() {
  return render(
    <MemoryRouter>
      <Auth />
    </MemoryRouter>
  );
}

function fillInput(labelOrId: string, value: string) {
  fireEvent.change(screen.getByLabelText(labelOrId), { target: { value } });
}

function goToSignup() {
  fireEvent.click(screen.getByRole('button', { name: 'Cadastre-se' }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.authState.user = null;
  mocks.authState.loading = false;
  mocks.signIn.mockResolvedValue({ error: null });
  mocks.signUp.mockResolvedValue({ error: null });
  mocks.resetPassword.mockResolvedValue({ error: null });
});

describe('render inicial', () => {
  it('abre no modo login, sem confirmação de senha', () => {
    renderAuth();

    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Confirmar Senha')).not.toBeInTheDocument();
  });

  it('mostra apenas o loader enquanto a sessão carrega', () => {
    mocks.authState.loading = true;
    renderAuth();

    expect(screen.queryByRole('button', { name: 'Entrar' })).not.toBeInTheDocument();
  });
});

describe('redirect de usuário autenticado', () => {
  it('redireciona para a home quando já existe sessão', async () => {
    mocks.authState.user = { id: 'user-1' };
    renderAuth();

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('não redireciona enquanto a sessão ainda está carregando', () => {
    mocks.authState.user = { id: 'user-1' };
    mocks.authState.loading = true;
    renderAuth();

    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('não redireciona quando não há sessão', () => {
    renderAuth();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});

describe('validação do formulário', () => {
  it('bloqueia o cadastro quando as senhas não coincidem', async () => {
    renderAuth();
    goToSignup();

    fillInput('E-mail', 'pessoa@exemplo.com');
    fillInput('Senha', 'senha123');
    fillInput('Confirmar Senha', 'senha124');
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText('As senhas não coincidem')).toBeInTheDocument();
    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it('não exige confirmação de senha no login', async () => {
    renderAuth();

    fillInput('E-mail', 'pessoa@exemplo.com');
    fillInput('Senha', 'senha123');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mocks.signIn).toHaveBeenCalledWith('pessoa@exemplo.com', 'senha123');
    });
  });

  it('rejeita e-mail vazio com a mensagem do schema', async () => {
    renderAuth();

    fillInput('Senha', 'senha123');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('E-mail inválido')).toBeInTheDocument();
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it('não envia quando o e-mail é rejeitado pela validação nativa do input', async () => {
    renderAuth();

    // `type="email"` barra o submit antes do handler, então nem o schema roda.
    fillInput('E-mail', 'nao-e-email');
    fillInput('Senha', 'senha123');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mocks.signIn).not.toHaveBeenCalled();
    });
  });

  it('rejeita senha com menos de 6 caracteres', async () => {
    renderAuth();

    fillInput('E-mail', 'pessoa@exemplo.com');
    fillInput('Senha', '123');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(
      await screen.findByText('Senha deve ter pelo menos 6 caracteres')
    ).toBeInTheDocument();
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it('limpa o erro do campo ao digitar novamente', async () => {
    renderAuth();

    fillInput('Senha', 'senha123');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('E-mail inválido')).toBeInTheDocument();

    fillInput('E-mail', 'pessoa@exemplo.com');
    expect(screen.queryByText('E-mail inválido')).not.toBeInTheDocument();
  });

  it('normaliza o e-mail (trim + minúsculas) antes de enviar', async () => {
    renderAuth();

    fillInput('E-mail', '  Pessoa@Exemplo.COM  ');
    fillInput('Senha', 'senha123');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mocks.signIn).toHaveBeenCalledWith('pessoa@exemplo.com', 'senha123');
    });
  });
});

describe('login', () => {
  it('traduz o erro retornado pelo Supabase no toast', async () => {
    mocks.signIn.mockResolvedValue({
      error: Object.assign(new Error('Invalid login credentials'), {
        code: 'invalid_credentials',
      }),
    });
    renderAuth();

    fillInput('E-mail', 'pessoa@exemplo.com');
    fillInput('Senha', 'senha123');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith('E-mail ou senha incorretos');
    });
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
  });

  it('avisa sucesso quando o login passa', async () => {
    renderAuth();

    fillInput('E-mail', 'pessoa@exemplo.com');
    fillInput('Senha', 'senha123');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mocks.toastSuccess).toHaveBeenCalledWith('Login realizado com sucesso!');
    });
  });
});

describe('cadastro', () => {
  it('mostra o aviso de confirmação de e-mail e volta para o login', async () => {
    renderAuth();
    goToSignup();

    fillInput('E-mail', 'pessoa@exemplo.com');
    fillInput('Senha', 'senha123');
    fillInput('Confirmar Senha', 'senha123');
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    await waitFor(() => {
      expect(mocks.signUp).toHaveBeenCalledWith('pessoa@exemplo.com', 'senha123');
    });
    expect(await screen.findByText(/Enviamos um link de confirmação/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('traduz o erro de e-mail já cadastrado', async () => {
    mocks.signUp.mockResolvedValue({
      error: Object.assign(new Error('User already registered'), {
        code: 'user_already_registered',
      }),
    });
    renderAuth();
    goToSignup();

    fillInput('E-mail', 'pessoa@exemplo.com');
    fillInput('Senha', 'senha123');
    fillInput('Confirmar Senha', 'senha123');
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith('Este e-mail já está cadastrado');
    });
    expect(screen.queryByText(/Enviamos um link de confirmação/)).not.toBeInTheDocument();
  });
});

describe('recuperação de senha', () => {
  it('envia o link e volta para o login', async () => {
    renderAuth();
    fireEvent.click(screen.getByRole('button', { name: 'Esqueci minha senha' }));

    fillInput('E-mail', 'pessoa@exemplo.com');
    fireEvent.click(screen.getByRole('button', { name: 'Enviar link' }));

    await waitFor(() => {
      expect(mocks.resetPassword).toHaveBeenCalledWith('pessoa@exemplo.com');
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      'Enviamos um link de recuperação para o seu e-mail'
    );
  });

  it('não envia com e-mail inválido', async () => {
    renderAuth();
    fireEvent.click(screen.getByRole('button', { name: 'Esqueci minha senha' }));

    fireEvent.click(screen.getByRole('button', { name: 'Enviar link' }));

    expect(await screen.findByText('E-mail inválido')).toBeInTheDocument();
    expect(mocks.resetPassword).not.toHaveBeenCalled();
  });

  it('não pede senha no modo recuperação', () => {
    renderAuth();
    fireEvent.click(screen.getByRole('button', { name: 'Esqueci minha senha' }));

    expect(screen.queryByLabelText('Senha')).not.toBeInTheDocument();
  });
});
