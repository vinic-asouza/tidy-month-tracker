/**
 * DEV-69 — Tradução das mensagens de erro de autenticação.
 *
 * A prioridade é: código do erro > fallback por mensagem > texto genérico.
 */

import { describe, it, expect } from 'vitest';
import type { AuthError } from '@supabase/supabase-js';
import { getAuthErrorMessage } from '../authErrors';

function authError(code: string | undefined, message = ''): AuthError {
  return { name: 'AuthApiError', message, code } as AuthError;
}

describe('getAuthErrorMessage — por código', () => {
  it('traduz email_not_confirmed', () => {
    expect(getAuthErrorMessage(authError('email_not_confirmed'))).toBe(
      'Confirme seu e-mail antes de fazer login'
    );
  });

  it('traduz invalid_credentials', () => {
    expect(getAuthErrorMessage(authError('invalid_credentials'))).toBe(
      'E-mail ou senha incorretos'
    );
  });

  it('traduz user_already_registered e user_already_exists com o mesmo texto', () => {
    expect(getAuthErrorMessage(authError('user_already_registered'))).toBe(
      'Este e-mail já está cadastrado'
    );
    expect(getAuthErrorMessage(authError('user_already_exists'))).toBe(
      'Este e-mail já está cadastrado'
    );
  });

  it('traduz signup_disabled', () => {
    expect(getAuthErrorMessage(authError('signup_disabled'))).toBe(
      'Cadastro temporariamente indisponível'
    );
  });

  it('traduz weak_password', () => {
    expect(getAuthErrorMessage(authError('weak_password'))).toBe(
      'Senha muito fraca. Use pelo menos 6 caracteres'
    );
  });

  it('traduz over_request_rate_limit', () => {
    expect(getAuthErrorMessage(authError('over_request_rate_limit'))).toBe(
      'Muitas tentativas. Aguarde um momento e tente novamente'
    );
  });

  it('o código tem prioridade sobre o fallback por mensagem', () => {
    const error = authError('email_not_confirmed', 'Invalid login credentials');
    expect(getAuthErrorMessage(error)).toBe('Confirme seu e-mail antes de fazer login');
  });
});

describe('getAuthErrorMessage — fallback por mensagem', () => {
  it('reconhece "Invalid login credentials" sem código', () => {
    expect(getAuthErrorMessage(new Error('Invalid login credentials'))).toBe(
      'E-mail ou senha incorretos'
    );
  });

  it('reconhece "Email not confirmed" sem código', () => {
    expect(getAuthErrorMessage(new Error('Email not confirmed'))).toBe(
      'Confirme seu e-mail antes de fazer login'
    );
  });

  it('reconhece "User already registered" sem código', () => {
    expect(getAuthErrorMessage(new Error('User already registered'))).toBe(
      'Este e-mail já está cadastrado'
    );
  });

  it('é case-insensitive no fallback', () => {
    expect(getAuthErrorMessage(new Error('EMAIL NOT CONFIRMED'))).toBe(
      'Confirme seu e-mail antes de fazer login'
    );
  });

  it('usa o fallback quando o código é desconhecido', () => {
    const error = authError('alguma_coisa_nova', 'Invalid login credentials');
    expect(getAuthErrorMessage(error)).toBe('E-mail ou senha incorretos');
  });
});

describe('getAuthErrorMessage — texto genérico', () => {
  it('cai no genérico para erro sem código e sem padrão conhecido', () => {
    expect(getAuthErrorMessage(new Error('Network request failed'))).toBe(
      'Não foi possível concluir a operação. Tente novamente.'
    );
  });

  it('cai no genérico para erro com mensagem vazia', () => {
    expect(getAuthErrorMessage(authError(undefined))).toBe(
      'Não foi possível concluir a operação. Tente novamente.'
    );
  });
});
