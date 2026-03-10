import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Calendar, MessageCircle, ChevronRight } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { KikiCard } from '@/components/kiki/KikiComponents';
import { ExerciseCard } from '@/components/kiki/ExerciseCard';
import { useAppStore } from '@/stores/useAppStore';
import kikiMascot from '@/assets/kiki-mascot.png';

const stagger = {
  container: { transition: { staggerChildren: 0.08 } },
  item: { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } },
};

export default function CuidadoraHome() {
  const navigate = useNavigate();
  const { currentUser, exercises, todaySessionCompleted, conversations } = useAppStore();
  const firstName = currentUser?.name.split(' ')[0] || 'Luciana';
  const greeting = new Date().getHours() < 12 ? '☀️' : new Date().getHours() < 18 ? '🌤' : '🌙';
  const todayExercises = exercises.slice(0, 3);
  const unread = conversations.find(c => c.id === 'conv-1')?.unreadCount || 0;

  return (
    <AppShell>
      <motion.div className="px-4 pb-6" variants={stagger.container} initial="initial" animate="animate">
        <motion.div variants={stagger.item} className="pt-4 mb-4">
          <h1 className="text-xl font-bold">Hola, {firstName} {greeting}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </motion.div>

        {/* Streak card */}
        <motion.div variants={stagger.item}>
          <div className="rounded-xl p-4 mb-4 bg-gradient-to-r from-mint-300 to-mint-200 relative overflow-hidden">
            <img src={kikiMascot} alt="" className="absolute -right-4 -bottom-4 w-24 h-24 opacity-20 object-contain" />
            <div className="flex items-center gap-2 mb-2">
              <Flame size={20} className="text-navy" />
              <span className="text-lg font-bold text-navy">3 días seguidos</span>
            </div>
            <div className="w-full h-2 rounded-full bg-navy/10 mb-1">
              <div className="h-2 rounded-full bg-navy/40 transition-all" style={{ width: '60%' }} />
            </div>
            <p className="text-xs text-navy/70">Esta semana: 3/5 sesiones</p>
            <p className="text-xs text-navy/80 mt-1 font-medium">¡Valentín está progresando muy bien!</p>
          </div>
        </motion.div>

        {/* Today's routine */}
        <motion.div variants={stagger.item}>
          <KikiCard className={todaySessionCompleted ? 'bg-mint-50 border border-mint-200' : ''}>
            {todaySessionCompleted ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-mint flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-foreground">Sesión completada</p>
                <p className="text-xs text-muted-foreground mt-1">¡Buen trabajo hoy!</p>
              </div>
            ) : (
              <>
                <h2 className="text-base font-semibold mb-1">Rutina de hoy</h2>
                <p className="text-xs text-muted-foreground mb-3">3 ejercicios · ~23 minutos · Lic. Valeria Moreno</p>
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

        {/* Next appointment */}
        <motion.div variants={stagger.item} className="mt-4">
          <KikiCard className="bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-blue-brand" />
              <div>
                <p className="text-sm font-medium">Próxima consulta con Valeria</p>
                <p className="text-xs text-muted-foreground">Miércoles 5 de marzo · 10:00</p>
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
                  <p className="text-sm font-medium">Mensaje de Valeria</p>
                  <p className="text-xs text-muted-foreground">Toca para responder</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </KikiCard>
          </motion.div>
        )}
      </motion.div>
    </AppShell>
  );
}
