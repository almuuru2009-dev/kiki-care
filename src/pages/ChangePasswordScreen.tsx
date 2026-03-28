import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Check, Lock } from 'lucide-react';

export default function ChangePasswordScreen() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPass.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (newPass !== confirm) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setSuccess(true);
    setLoading(false);
    setTimeout(() => navigate(-1), 1500);
  };

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
        <h1 className="text-lg font-semibold">Cambiar contraseña</h1>
      </div>

      <motion.div className="flex-1 px-6 pt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-full bg-mint-50 flex items-center justify-center">
            <Lock size={24} className="text-mint-600" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Contraseña actual</label>
            <div className="relative">
              <input type={showCurrent ? 'text' : 'password'} value={current} onChange={e => setCurrent(e.target.value)} className="input-kiki pr-10" required />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Toggle">
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Nueva contraseña</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)} className="input-kiki pr-10" placeholder="Mínimo 6 caracteres" required />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Toggle">
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Confirmar nueva contraseña</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="input-kiki" required />
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
