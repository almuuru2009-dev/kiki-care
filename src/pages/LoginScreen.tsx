import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import kikiMascot from '@/assets/kiki-mascot.png';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { selectedRole, login } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roleLabel = selectedRole === 'kinesiologist' ? 'Kinesiólogo' : 'Cuidadora';
  const demoEmail = selectedRole === 'kinesiologist' ? 'kine@kikicare.app' : 'mama@kikicare.app';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(r => setTimeout(r, 600));

    const success = login(email, password);
    if (success) {
      const path = selectedRole === 'kinesiologist' ? '/kine/home' : '/cuidadora/home';
      navigate(path);
    } else {
      setError('Email o contraseña incorrectos');
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
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-mint-100 text-mint-700">
              Iniciando como {roleLabel}
            </span>
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

          <button type="button" className="btn-ghost w-full text-center text-sm">
            Olvidé mi contraseña
          </button>
        </form>

        <div className="mt-6 p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground text-center">
            <span className="font-medium">Demo:</span> {demoEmail} / demo1234
          </p>
        </div>

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
