import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, Heart } from 'lucide-react';
import kikiMascot from '@/assets/kiki-mascot.png';

export default function RoleSelectScreen() {
  const navigate = useNavigate();

  const handleSelect = (role: 'kinesiologist' | 'caregiver') => {
    navigate('/login', { state: { role } });
  };

  return (
    <div className="max-w-[420px] mx-auto w-full flex flex-col min-h-screen bg-background px-6 py-8">
      <motion.div
        className="flex flex-col items-center mt-8"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <img src={kikiMascot} alt="Kiki" className="w-20 h-20 object-contain mb-3" />
        <h1 className="text-2xl font-bold text-foreground">
          Kiki<span className="text-mint">Care</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">¿Cómo querés ingresar?</p>
      </motion.div>

      <div className="flex-1 flex flex-col justify-center gap-4 mt-8">
        <motion.button
          onClick={() => handleSelect('kinesiologist')}
          className="w-full bg-navy rounded-xl p-6 text-left active:scale-[0.97] transition-transform"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="w-12 h-12 rounded-full bg-mint/20 flex items-center justify-center mb-3">
            <ClipboardList className="text-mint" size={24} />
          </div>
          <h2 className="text-lg font-semibold text-navy-50">Kinesiólogo</h2>
          <p className="text-sm text-navy-300 mt-1">Gestioná pacientes, planes y seguimiento</p>
        </motion.button>

        <motion.button
          onClick={() => handleSelect('caregiver')}
          className="w-full bg-card border-2 border-mint rounded-xl p-6 text-left active:scale-[0.97] transition-transform"
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <div className="w-12 h-12 rounded-full bg-mint/10 flex items-center justify-center mb-3">
            <Heart className="text-mint-500" size={24} />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Cuidadora</h2>
          <p className="text-sm text-muted-foreground mt-1">Seguí la rutina diaria de tu hijo</p>
        </motion.button>
      </div>

      <motion.p
        className="text-center text-sm text-muted-foreground mt-6 pb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        ¿Sos nuevo?{' '}
        <button onClick={() => navigate('/register')} className="text-mint-500 font-medium">
          Creá tu cuenta
        </button>
      </motion.p>
    </div>
  );
}
