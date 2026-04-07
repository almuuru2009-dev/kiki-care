import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import kikiMascot from '@/assets/kiki-mascot.png';

const kineSlides = [
  {
    title: '¡Bienvenido a KikiCare!',
    description: 'Tu plataforma para gestionar la rehabilitación de tus pacientes de forma eficiente y organizada.',
    emoji: '👨‍⚕️',
    features: ['Gestión de pacientes', 'Planes de tratamiento', 'Seguimiento de adherencia'],
  },
  {
    title: 'Conectá con cuidadores',
    description: 'Invitá a los cuidadores de tus pacientes por email. Ellos podrán registrar sesiones y reportar el progreso diario.',
    emoji: '🤝',
    features: ['Invitaciones por email', 'Mensajería directa', 'Alertas de adherencia'],
  },
  {
    title: 'Biblioteca de ejercicios',
    description: 'Creá tus propios ejercicios, usá los de la comunidad y armá protocolos personalizados para cada paciente.',
    emoji: '📚',
    features: ['Ejercicios propios', 'Comunidad de terapeutas', 'Protocolos reutilizables'],
  },
];

const caregiverSlides = [
  {
    title: '¡Hola! Soy Kiki 🦎',
    description: 'Tu compañero en la rehabilitación de tu hijo. Juntos vamos a hacer que cada sesión cuente.',
    emoji: '💚',
    features: ['Ejercicios guiados', 'Seguimiento diario', 'Conexión con tu kinesiólogo'],
  },
  {
    title: 'Tu plan diario',
    description: 'Tu kinesiólogo te asignará ejercicios. Vos solo tenés que seguir el plan del día y registrar cómo fue la sesión.',
    emoji: '📋',
    features: ['Plan de hoy', 'Registro de sesiones', 'Notas para el terapeuta'],
  },
  {
    title: 'Medallas y recompensas',
    description: 'Por cada sesión completada ganás puntos. Acumulá puntos durante el año para acceder a premios y sorteos.',
    emoji: '🏅',
    features: ['Sistema de puntos', 'Medallas mensuales', 'Sorteo anual de premios'],
  },
];

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const { profile, user } = useAuthContext();
  const [current, setCurrent] = useState(0);
  const isKine = profile?.role === 'kinesiologist';
  const slides = isKine ? kineSlides : caregiverSlides;

  const handleFinish = async () => {
    if (user) {
      await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id);
    }
    navigate(isKine ? '/kine/home' : '/cuidadora/home', { replace: true });
  };

  const handleNext = () => {
    if (current < slides.length - 1) setCurrent(current + 1);
    else handleFinish();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-[420px] mx-auto">
      {/* Skip */}
      <div className="flex justify-end px-4 pt-4">
        <button onClick={handleFinish} className="text-xs text-muted-foreground">
          Omitir
        </button>
      </div>

      {/* Slides */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            className="flex flex-col items-center text-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <motion.img
              src={kikiMascot}
              alt="Kiki"
              className="w-24 h-24 object-contain mb-4"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <p className="text-4xl mb-3">{slides[current].emoji}</p>
            <h2 className="text-xl font-bold text-foreground mb-2">{slides[current].title}</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-[300px]">{slides[current].description}</p>
            <div className="space-y-2">
              {slides[current].features.map((f, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-2 text-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  <span className="w-5 h-5 rounded-full bg-mint flex items-center justify-center text-[10px] text-navy font-bold">✓</span>
                  <span className="text-foreground">{f}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === current ? 'bg-mint' : 'bg-muted'}`} />
          ))}
        </div>
        <div className="flex gap-3">
          {current > 0 && (
            <button onClick={() => setCurrent(current - 1)} className="btn-ghost flex items-center gap-1 text-sm">
              <ChevronLeft size={16} /> Anterior
            </button>
          )}
          <button onClick={handleNext} className="btn-primary flex-1 flex items-center justify-center gap-1">
            {current === slides.length - 1 ? 'Empezar' : 'Siguiente'}
            {current < slides.length - 1 && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
