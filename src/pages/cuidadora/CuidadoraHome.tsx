import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Calendar, MessageCircle, ChevronRight, Trophy, Sparkles } from 'lucide-react';
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
  const { currentUser, exercises, todaySessionCompleted, conversations, medals, moodEntries } = useAppStore();
  const firstName = currentUser?.name.split(' ')[0] || 'Luciana';
  const greeting = new Date().getHours() < 12 ? '☀️' : new Date().getHours() < 18 ? '🌤' : '🌙';
  const todayExercises = exercises.slice(0, 3);
  const unread = conversations.find(c => c.id === 'conv-1')?.unreadCount || 0;
  const earnedMedals = medals.filter(m => m.earned);
  const nextMedal = medals.find(m => !m.earned);
  const lastMood = moodEntries[moodEntries.length - 1];

  return (
    <AppShell>
      <motion.div className="px-4 pb-6" variants={stagger.container} initial="initial" animate="animate">
        <motion.div variants={stagger.item} className="pt-4 mb-4">
          <h1 className="text-xl font-bold">Hola, {firstName} {greeting}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </motion.div>

        {/* Streak card with Kiki */}
        <motion.div variants={stagger.item}>
          <div className="rounded-xl p-4 mb-4 bg-gradient-to-r from-mint-300 to-mint-200 relative overflow-hidden">
            <motion.img
              src={kikiMascot}
              alt="Kiki"
              className="absolute -right-2 -bottom-3 w-28 h-28 object-contain"
              animate={{ y: [0, -5, 0], rotate: [0, 2, -2, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <Flame size={20} className="text-navy" />
              <span className="text-lg font-bold text-navy">3 días seguidos</span>
            </div>
            <div className="w-3/4 h-2 rounded-full bg-navy/10 mb-1">
              <div className="h-2 rounded-full bg-navy/40 transition-all" style={{ width: '60%' }} />
            </div>
            <p className="text-xs text-navy/70 relative z-10">Esta semana: 3/5 sesiones</p>
            <p className="text-xs text-navy/80 mt-1 font-medium relative z-10">¡Valentín está progresando muy bien!</p>
          </div>
        </motion.div>

        {/* Medal teaser */}
        {nextMedal && (
          <motion.div variants={stagger.item} className="mb-4">
            <KikiCard className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100" onClick={() => navigate('/cuidadora/medals')}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <span className="text-2xl">{nextMedal.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={12} className="text-gold" />
                    <p className="text-xs font-semibold text-gold">Próxima medalla</p>
                  </div>
                  <p className="text-sm font-medium mt-0.5">{nextMedal.title}</p>
                  <div className="w-full h-1.5 rounded-full bg-amber-200 mt-1">
                    <div className="h-1.5 rounded-full bg-gold" style={{ width: `${nextMedal.progress || 0}%` }} />
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </KikiCard>
          </motion.div>
        )}

        {/* Today's routine */}
        <motion.div variants={stagger.item}>
          <KikiCard className={todaySessionCompleted ? 'bg-mint-50 border border-mint-200' : ''}>
            {todaySessionCompleted ? (
              <div className="text-center py-4">
                <motion.div
                  className="w-12 h-12 rounded-full bg-mint flex items-center justify-center mx-auto mb-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
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

        {/* Medals showcase */}
        <motion.div variants={stagger.item} className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Trophy size={16} className="text-gold" />
              <h3 className="text-sm font-semibold">Mis medallas</h3>
            </div>
            <button onClick={() => navigate('/cuidadora/medals')} className="text-xs text-mint-600 font-medium">
              Ver todas →
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {earnedMedals.slice(-4).map(medal => (
              <motion.div
                key={medal.id}
                whileHover={{ scale: 1.08 }}
                className="min-w-[60px] rounded-xl bg-mint-50 border border-mint-200 p-2 text-center"
              >
                <span className="text-xl">{medal.icon}</span>
                <p className="text-[8px] font-semibold mt-0.5 text-navy leading-tight">{medal.title}</p>
              </motion.div>
            ))}
          </div>
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

        {/* Kiki daily tip */}
        <motion.div variants={stagger.item} className="mt-4">
          <div className="flex items-start gap-3 bg-mint-50/60 border border-mint-100 rounded-xl p-3">
            <img src={kikiMascot} alt="Kiki" className="w-10 h-10 object-contain shrink-0" />
            <div>
              <p className="text-xs font-semibold text-navy">💡 Tip del día</p>
              <p className="text-[11px] text-navy/70 mt-0.5">
                Hacer los ejercicios a la misma hora cada día ayuda a crear el hábito. ¡Valentín se acostumbrará más rápido! 🕐
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
