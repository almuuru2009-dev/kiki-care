import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ForgotPasswordScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/change-password',
    });

    if (error) {
      toast.error('Error al enviar el email. Intentá de nuevo.');
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="mobile-frame flex flex-col min-h-screen bg-background">
      <div className="px-4 pt-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
      </div>

      <motion.div className="flex-1 px-6 pt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {sent ? (
          <div className="flex flex-col items-center text-center pt-12">
            <motion.div className="w-20 h-20 rounded-full bg-mint-100 flex items-center justify-center mb-6"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
              <Check size={40} className="text-mint-600" />
            </motion.div>
            <h1 className="text-xl font-bold text-foreground mb-2">¡Email enviado!</h1>
            <p className="text-sm text-muted-foreground mb-2">
              Revisá tu bandeja de entrada en <span className="font-medium text-foreground">{email}</span>
            </p>
            <p className="text-xs text-muted-foreground mb-8">
              Si no ves el email, revisá la carpeta de spam. El enlace expira en 1 hora.
            </p>
            <button onClick={() => navigate('/login')} className="btn-primary w-full">Volver al inicio de sesión</button>
            <button onClick={() => { setSent(false); setEmail(''); }} className="btn-ghost w-full text-sm mt-2">Reenviar email</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-mint-50 flex items-center justify-center">
                <Mail size={28} className="text-mint-600" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-foreground text-center mb-2">Recuperar contraseña</h1>
            <p className="text-sm text-muted-foreground text-center mb-8">
              Ingresá el email con el que te registraste y te enviaremos un enlace para restablecer tu contraseña.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-kiki" placeholder="tu@email.com" required />
              </div>
              <button type="submit" disabled={loading || !email.trim()} className="btn-primary w-full text-center disabled:opacity-60">
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>
              <button type="button" onClick={() => navigate('/login')} className="btn-ghost w-full text-center text-sm">Volver al inicio de sesión</button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
