import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import kikiMascot from '@/assets/kiki-mascot.png';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { selectedRole } = useAppStore();
  const { user, profile } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roleLabel = selectedRole === 'kinesiologist' ? 'Kinesiólogo' : 'Cuidadora';

  // If already logged in, redirect
  useEffect(() => {
    if (user && profile) {
      redirectByRole(profile.role);
    }
  }, [user, profile]);

  const redirectByRole = (role: string) => {
    if (role === 'kinesiologist') {
      navigate('/kine/home', { replace: true });
    } else {
      // Check for pending invitations first
      checkPendingInvitations();
    }
  };

  const checkPendingInvitations = async () => {
    if (!user?.email) {
      navigate('/cuidadora/home', { replace: true });
      return;
    }
    const { data } = await supabase
      .from('therapist_caregiver_links')
      .select('id')
      .eq('caregiver_email', user.email)
      .eq('status', 'pending')
      .limit(1);

    if (data && data.length > 0) {
      navigate('/pending-invitations', { replace: true });
    } else {
      // Check if caregiver has pending child to create
      const pendingChild = localStorage.getItem('kikicare_pending_child');
      if (pendingChild) {
        try {
          const childData = JSON.parse(pendingChild);
          await supabase.from('children').insert({
            caregiver_id: user!.id,
            name: childData.name,
            age: childData.age,
            diagnosis: childData.diagnosis,
            gmfcs: childData.gmfcs,
          });
          localStorage.removeItem('kikicare_pending_child');
        } catch (e) {
          console.error('Error creating child:', e);
        }
      }
      navigate('/cuidadora/home', { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (authError.message.includes('Email not confirmed')) {
        setError('Verificá tu email antes de iniciar sesión. Revisá tu bandeja de entrada.');
      } else {
        setError('Email o contraseña incorrectos');
      }
      setLoading(false);
      return;
    }

    if (data.user) {
      // Profile will be loaded by AuthContext, redirect handled by useEffect
      toast.success('¡Bienvenido!');
    }
    setLoading(false);
  };

  return (
    <div className="mobile-frame flex flex-col min-h-screen bg-background">
      <div className="px-4 pt-4">
        <button
          onClick={() => navigate('/role-select')}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
          aria-label="Volver"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <motion.div
        className="flex-1 px-6 pt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-8">
          <img src={kikiMascot} alt="Kiki" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Bienvenido</h1>
            {selectedRole && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-mint-100 text-mint-700">
                Iniciando como {roleLabel}
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-kiki"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-kiki pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.p
              className="text-sm text-rust font-medium"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-center disabled:opacity-60"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="btn-ghost w-full text-center text-sm"
          >
            Olvidé mi contraseña
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          ¿No tenés cuenta?{' '}
          <button onClick={() => navigate('/register')} className="text-mint-500 font-medium">
            Registrate
          </button>
        </p>
      </motion.div>
    </div>
  );
}
