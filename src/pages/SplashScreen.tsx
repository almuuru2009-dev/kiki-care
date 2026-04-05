import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '@/contexts/AuthContext';
import kikiMascot from '@/assets/kiki-mascot.png';

export default function SplashScreen() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuthContext();
  const [show, setShow] = useState(true);
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!minTimePassed) return;

    setShow(false);
    const fadeTimer = setTimeout(() => {
      if (loading) return;

      if (user && profile) {
        if (profile.role === 'kinesiologist') {
          navigate('/kine/home', { replace: true });
        } else {
          navigate('/cuidadora/home', { replace: true });
        }
      } else {
        navigate('/role-select', { replace: true });
      }
    }, 400);
    return () => clearTimeout(fadeTimer);
  }, [minTimePassed, loading, user, profile, navigate]);

  return (
    <div className="max-w-[420px] mx-auto w-full">
      <AnimatePresence>
        {show && (
          <motion.div
            className="flex flex-col items-center justify-center min-h-screen bg-background px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="animate-pulse-glow rounded-full"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <img src={kikiMascot} alt="Kiki" className="w-32 h-32 object-contain" />
            </motion.div>

            <motion.div
              className="mt-6 text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold text-foreground">
                Kiki<span className="text-mint">Care</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-2">La rehabilitación no para en casa</p>
            </motion.div>

            <motion.div
              className="mt-8 flex gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-mint"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
