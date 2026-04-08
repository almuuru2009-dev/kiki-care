import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Check, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const passwordRules = [
  { test: (p: string) => p.length >= 8, label: 'Mínimo 8 caracteres' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Al menos una mayúscula' },
  { test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p), label: 'Al menos un carácter especial' },
];

export default function ChangePasswordScreen() {
  const navigate = useNavigate();
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get('type') === 'recovery') {
      setIsRecovery(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const failedRules = passwordRules.filter(r => !r.test(newPass));
    if (failedRules.length > 0) {
      setError(failedRules.map(r => r.label).join('. '));
      return;
    }
    if (newPass !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPass });

    if (updateError) {
      // Fix: friendly error message for missing session
      if (updateError.message.includes('Auth session missing') || updateError.message.includes('not authenticated')) {
        setError('Tu sesión expiró. Volvé a iniciar sesión.');
      } else {
        setError(updateError.message);
      }
      setLoading(false); // Fix: reset loading on error
      return;
    }

    setSuccess(true);
    setLoading(false);
    toast.success('Contraseña actualizada');
    setTimeout(() => navigate('/login', { replace: true }), 1500);
  };

  const pwdValid = passwordRules.map(r => ({ ...r, pass: r.test(newPass) }));

  if (success) {
    return (
      <div className="mobile-frame flex flex-col min-h-screen bg-background items-center justify-center px-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-mint-100 flex items-center justify-center mb-4">
            <Check size={40} className="text-mint-600" />
          </div>
          <h2 className="text-xl font-bold">Contraseña actualizada</h2>
          <p className="text-sm text-muted-foreground mt-1">Redirigiendo...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mobile-frame flex flex-col min-h-screen bg-background">
      <div className="px-4 pt-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold">{isRecovery ? 'Restablecer contraseña' : 'Cambiar contraseña'}</h1>
      </div>

      <motion.div className="flex-1 px-6 pt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-full bg-mint-50 flex items-center justify-center">
            <Lock size={24} className="text-mint-600" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Nueva contraseña</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)} className="input-kiki pr-10" required />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Toggle">
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {newPass && (
              <div className="mt-2 space-y-1">
                {pwdValid.map((r, i) => (
                  <div key={i} className={`flex items-center gap-1.5 text-xs ${r.pass ? 'text-mint-600' : 'text-rust'}`}>
                    {r.pass ? <Check size={12} /> : <AlertCircle size={12} />}
                    <span>{r.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Confirmar nueva contraseña</label>
            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} className="input-kiki pr-10" required />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Toggle confirm">
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-rust font-medium">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? 'Guardando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
