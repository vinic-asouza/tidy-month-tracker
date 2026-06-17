import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BrandMark } from '@/components/brand/BrandMark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getAuthErrorMessage } from '@/utils/authErrors';
import { z } from 'zod';

const emailSchema = z.string().email('E-mail inválido');
const passwordSchema = z
  .string()
  .min(6, 'Senha deve ter pelo menos 6 caracteres')
  .max(72, 'Senha deve ter no máximo 72 caracteres');

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const [signupEmailSent, setSignupEmailSent] = useState(false);
  const { signIn, signUp, resetPassword, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }
    
    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }
    
    if (!isLogin && password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isForgotPassword) {
      try {
        emailSchema.parse(email);
      } catch (err) {
        if (err instanceof z.ZodError) {
          setErrors({ email: err.errors[0].message });
        }
        return;
      }

      setIsLoading(true);
      setErrors({});
      try {
        const normalizedEmail = email.trim().toLowerCase();
        const { error } = await resetPassword(normalizedEmail);
        if (error) {
          toast.error(getAuthErrorMessage(error));
        } else {
          toast.success('Enviamos um link de recuperação para o seu e-mail');
          setIsForgotPassword(false);
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (isLogin) {
        const { error } = await signIn(normalizedEmail, password);
        if (error) {
          toast.error(getAuthErrorMessage(error));
        } else {
          toast.success('Login realizado com sucesso!');
        }
      } else {
        const { error } = await signUp(normalizedEmail, password);
        if (error) {
          toast.error(getAuthErrorMessage(error));
        } else {
          setSignupEmailSent(true);
          toast.success('Cadastro realizado! Verifique seu e-mail para confirmar.');
          setIsLogin(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background gradient-subtle flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background gradient-subtle flex flex-col">
      {/* Header */}
      <header className="p-6">
        <BrandMark />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-lg p-8 border border-border/60 shadow-sm">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">
                {isForgotPassword
                  ? 'Recuperar senha'
                  : isLogin
                    ? 'Bem-vindo de volta!'
                    : 'Crie sua conta'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isForgotPassword
                  ? 'Informe seu e-mail para receber o link de redefinição'
                  : isLogin
                    ? 'Entre para acessar suas finanças'
                    : 'Comece a controlar suas finanças hoje'}
              </p>
            </div>

            {signupEmailSent && (
              <Alert className="mb-4">
                <AlertDescription>
                  Enviamos um link de confirmação. Verifique sua caixa de entrada e spam antes de
                  fazer login.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                    className={`pl-10 rounded-md h-10 ${errors.email ? 'border-destructive' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
              </div>

              {/* Password */}
              {!isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                    className={`pl-10 pr-10 rounded-md h-10 ${errors.password ? 'border-destructive' : ''}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
              </div>
              )}

              {isForgotPassword && (
                <p className="text-xs text-muted-foreground">
                  O link abrirá uma página segura para definir sua nova senha.
                </p>
              )}

              {isLogin && !isForgotPassword && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setErrors({});
                      setPassword('');
                      setConfirmPassword('');
                    }}
                    className="text-sm text-primary hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              )}

              {/* Confirm Password (only for signup) */}
              {!isLogin && !isForgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirmar Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: undefined })); }}
                      className={`pl-10 rounded-md h-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-destructive text-sm">{errors.confirmPassword}</p>}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-10 rounded-md gradient-primary shadow-glow hover:opacity-90 transition-opacity text-primary-foreground"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isForgotPassword ? (
                  'Enviar link'
                ) : isLogin ? (
                  'Entrar'
                ) : (
                  'Criar conta'
                )}
              </Button>
            </form>

            {/* Toggle */}
            <div className="mt-6 text-center space-y-2">
              {isForgotPassword ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setErrors({});
                  }}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  Voltar ao login
                </button>
              ) : (
              <p className="text-sm text-muted-foreground">
                {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                    setEmail('');
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  className="ml-1 text-primary font-medium hover:underline"
                >
                  {isLogin ? 'Cadastre-se' : 'Faça login'}
                </button>
              </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Controle Financeiro Pessoal</span>
          <span className="text-border">•</span>
          <span>Dados sincronizados na nuvem</span>
        </div>
      </footer>
    </div>
  );
};

export default Auth;
