import type { AuthError } from '@supabase/supabase-js';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos',
  email_not_confirmed: 'Confirme seu e-mail antes de fazer login',
  user_already_registered: 'Este e-mail já está cadastrado',
  user_already_exists: 'Este e-mail já está cadastrado',
  signup_disabled: 'Cadastro temporariamente indisponível',
  weak_password: 'Senha muito fraca. Use pelo menos 6 caracteres',
  over_request_rate_limit: 'Muitas tentativas. Aguarde um momento e tente novamente',
};

const MESSAGE_FALLBACKS: [RegExp, string][] = [
  [/invalid login credentials/i, 'E-mail ou senha incorretos'],
  [/email not confirmed/i, 'Confirme seu e-mail antes de fazer login'],
  [/user already registered/i, 'Este e-mail já está cadastrado'],
];

export function getAuthErrorMessage(error: AuthError | Error): string {
  const authError = error as AuthError;
  if (authError.code && AUTH_ERROR_MESSAGES[authError.code]) {
    return AUTH_ERROR_MESSAGES[authError.code];
  }

  for (const [pattern, message] of MESSAGE_FALLBACKS) {
    if (pattern.test(error.message)) {
      return message;
    }
  }

  return 'Não foi possível concluir a operação. Tente novamente.';
}
