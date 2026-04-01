import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MessageCircle, ChevronRight, Heart } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { KikiCard } from '@/components/kiki/KikiComponents';
import { ExerciseCard } from '@/components/kiki/ExerciseCard';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthContext } from '@/contexts/AuthContext';
import kikiGlasses from '@/assets/kiki-glasses.png';

const stagger = {
  container: { transition: { staggerChildren: 0.08 } },
  item: { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } },
};

export default function CuidadoraHome() {
  const navigate = useNavigate();
  const { profile } = useAuthContext();
  const { exercises, todaySessionCompleted, conversations } = useAppStore();
  const firstName = profile?.name?.split(' ')[0] || 'Cuidador/a';
  const greeting = new Date().getHours() < 12 ? '☀️' : new Date().getHours() < 18 ? '🌤' : '🌙';
  const todayExercises = exercises.slice(0, 3);
  const unread = conversations.find(c => c.id === 'conv-1')?.unreadCount || 0;
  const totalTime = todayExercises.reduce((s, e) => s + e.duration, 0);
  const completedCount = todaySessionCompleted ? todayExercises.length : 0;
  const hasExercises = todayExercises.length > 0;

  return (
    <AppShell>
      <motion.div className="px-4 pb-6" variants={stagger.container} initial="initial" animate="animate">
        <motion.div variants={stagger.item} className="pt-4 mb-4">
          <h1 className="text-xl font-bold">Hola, {firstName} {greeting}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </motion.div>

        {!hasExercises ? (
          /* Empty state for new caregivers */
          <motion.div variants={stagger.item}>
            <KikiCard className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-mint-50 flex items-center justify-center mx-auto mb-4">
                <Heart size={28} className="text-mint-500" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">¡Bienvenida a KikiCare!</h2>
              <p className="text-sm text-muted-foreground mb-4 px-4">
                Tu kinesiólogo/a te asignará un plan de ejercicios. Mientras tanto, completá el perfil de tu hijo/a.
              </p>
              <button onClick={() => navigate('/cuidadora/child')} className="btn-primary text-sm px-6">
                Ir a Mi Perfil
              </button>
            </KikiCard>
          </motion.div>
        ) : (
          <>
            {/* Plan de hoy */}
            <motion.div variants={stagger.item}>
              <div className="rounded-xl p-4 mb-4 bg-gradient-to-r from-mint-300 to-mint-200 relative overflow-hidden">
                <motion.img
                  src={kikiGlasses}
                  alt="Kiki"
                  className="absolute -right-2 -bottom-3 w-28 h-28 object-contain"
                  animate={{ y: [0, -5, 0], rotate: [0, 2, -2, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="relative z-10">
                  <h2 className="text-base font-bold text-navy mb-1">Plan de hoy</h2>
                  <p className="text-sm text-navy/80">{todayExercises.length} ejercicios · ~{totalTime} minutos</p>
                  <div className="w-3/4 h-2 rounded-full bg-navy/10 mt-2 mb-1">
                    <div className="h-2 rounded-full bg-navy/40 transition-all" style={{ width: `${(completedCount / todayExercises.length) * 100}%` }} />
                  </div>
                  <p className="text-xs text-navy/60">{completedCount}/{todayExercises.length} completados</p>
                </div>
              </div>
            </motion.div>

            {/* Today's routine */}
            <motion.div variants={stagger.item}>
              <KikiCard className={todaySessionCompleted ? 'bg-mint-50 border border-mint-200' : ''}>
                {todaySessionCompleted ? (
                  <div className="text-center py-4">
                    <motion.div className="w-12 h-12 rounded-full bg-mint flex items-center justify-center mx-auto mb-2"
                      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                      <svg className="w-6 h-6 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                    <p className="font-semibold text-foreground">Sesión completada</p>
                    <p className="text-xs text-muted-foreground mt-1">¡Buen trabajo hoy!</p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-base font-semibold mb-1">Rutina de hoy</h2>
                    <p className="text-xs text-muted-foreground mb-3">{todayExercises.length} ejercicios · ~{totalTime} minutos</p>
                    <div className="space-y-2 mb-4">
                      {todayExercises.map(ex => (
                        <ExerciseCard key={ex.id} name={ex.name} duration={ex.duration} sets={ex.sets} reps={ex.reps} thumbnailColor={ex.thumbnailColor} targetArea={ex.targetArea} />
                      ))}
                    </div>
                    <button onClick={() => navigate('/cuidadora/session')} className="btn-primary w-full text-sm">
                      Comenzar sesión →
                    </button>
                  </>
                )}
              </KikiCard>
            </motion.div>
          </>
        )}

        {/* Next appointment */}
        <motion.div variants={stagger.item} className="mt-4">
          <KikiCard className="bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-blue-brand" />
              <div>
                <p className="text-sm font-medium">Próxima consulta</p>
                <p className="text-xs text-muted-foreground">Aún sin consulta agendada</p>
              </div>
            </div>
          </KikiCard>
        </motion.div>

        {/* Unread message */}
        {unread > 0 && (
          <motion.div variants={stagger.item} className="mt-3">
            <KikiCard className="bg-amber-50 border border-amber-100 cursor-pointer" onClick={() => navigate('/cuidadora/messages/conversation')}>
              <div className="flex items-center gap-3">
                <MessageCircle size={18} className="text-gold" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Mensaje nuevo</p>
                  <p className="text-xs text-muted-foreground">Toca para responder</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </KikiCard>
          </motion.div>
        )}

        {/* Kiki daily tip */}
        <motion.div variants={stagger.item} className="mt-4">
          <div className="flex items-start gap-3 bg-mint-50/60 border border-mint-100 rounded-xl p-3">
            <img src={kikiGlasses} alt="Kiki" className="w-10 h-10 object-contain shrink-0" />
            <div>
              <p className="text-xs font-semibold text-navy">💡 Tip del día</p>
              <p className="text-[11px] text-navy/70 mt-0.5">
                Hacer los ejercicios a la misma hora cada día ayuda a crear el hábito. ¡Se acostumbrará más rápido! 🕐
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
