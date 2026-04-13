import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, MessageCircle, Activity, TrendingUp, ChevronRight, Users, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { AppShell } from '@/components/layout/AppShell';
import { KikiCard, StatBadge, AvatarCircle, RiskBadge } from '@/components/kiki/KikiComponents';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { calculateRisk, type FamilyPattern } from '@/lib/maa';

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } },
};

interface PatientSummary {
  linkId: string;
  childId: string;
  childName: string;
  caregiverName: string;
  caregiverId: string;
  diagnosis: string | null;
  gmfcs: number | null;
  avatarColor: string;
  sessionCount: number;
  lastSessionDaysAgo: number;
  adherencePercent: number;
  riskLevel: 'BAJO' | 'MODERADO' | 'ALTO';
  riskScore: number;
}

export default function KineHome() {
  const navigate = useNavigate();
  const { user, profile } = useAuthContext();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [todaySessions, setTodaySessions] = useState(0);
  const [weeklyActivity, setWeeklyActivity] = useState<{ day: string; sessions: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Get active links
    const { data: links } = await supabase
      .from('therapist_caregiver_links')
      .select('id, caregiver_id, child_id')
      .eq('therapist_id', user.id)
      .eq('status', 'active');

    if (!links || links.length === 0) {
      setPatients([]);
      setLoading(false);
      return;
    }

    const childIds = links.map(l => l.child_id).filter(Boolean) as string[];
    const caregiverIds = links.map(l => l.caregiver_id).filter(Boolean) as string[];

    // Fetch children, profiles, sessions in parallel
    const [childrenRes, profilesRes, sessionsRes, unreadRes] = await Promise.all([
      childIds.length > 0 ? supabase.from('children').select('*').in('id', childIds) : { data: [] },
      caregiverIds.length > 0 ? supabase.from('profiles').select('id, name').in('id', caregiverIds) : { data: [] },
      childIds.length > 0 ? supabase.from('sessions').select('id, child_id, completed_at').in('child_id', childIds).order('completed_at', { ascending: false }) : { data: [] },
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('read', false),
    ]);

    const childrenMap = new Map((childrenRes.data || []).map(c => [c.id, c]));
    const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
    const allSessions = sessionsRes.data || [];

    // Calculate weekly activity (last 7 days)
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const now = new Date();
    const weekData: { day: string; sessions: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = allSessions.filter(s => s.completed_at.startsWith(dateStr)).length;
      weekData.push({ day: dayNames[d.getDay()], sessions: count });
    }
    setWeeklyActivity(weekData);

    // Today's sessions
    const todayStr = now.toISOString().split('T')[0];
    setTodaySessions(allSessions.filter(s => s.completed_at.startsWith(todayStr)).length);

    // Build patient summaries with MAA
    const mapped: PatientSummary[] = links.map(link => {
      const child = link.child_id ? childrenMap.get(link.child_id) : null;
      const caregiver = link.caregiver_id ? profileMap.get(link.caregiver_id) : null;
      const childSessions = allSessions.filter(s => s.child_id === link.child_id);

      // Calculate adherence (sessions in last 14 days vs expected 5/week)
      const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
      const recentSessions = childSessions.filter(s => new Date(s.completed_at) >= twoWeeksAgo);
      const expectedSessions = 10; // 5/week * 2 weeks
      const adherencePercent = Math.min(100, Math.round((recentSessions.length / expectedSessions) * 100));

      // Last session days ago
      const lastSession = childSessions[0];
      const lastSessionDaysAgo = lastSession
        ? Math.floor((now.getTime() - new Date(lastSession.completed_at).getTime()) / 86400000)
        : 30;

      // MAA risk calculation
      const pattern: FamilyPattern = {
        patientId: link.id,
        baselineFrequency: 5,
        baselineHour: 10,
        recentFrequency: recentSessions.length / 2,
        lastSessionDaysAgo,
        avgDurationMinutes: 15,
        baselineDurationMinutes: 20,
        responseLatencyHours: lastSessionDaysAgo > 3 ? 48 : 6,
      };
      const maaResult = calculateRisk(pattern);

      return {
        linkId: link.id,
        childId: link.child_id || '',
        childName: child?.name || 'Sin nombre',
        caregiverName: caregiver?.name || 'Cuidador/a',
        caregiverId: link.caregiver_id || '',
        diagnosis: child?.diagnosis || null,
        gmfcs: child?.gmfcs || null,
        avatarColor: child?.avatar_color || '#7EEDC4',
        sessionCount: childSessions.length,
        lastSessionDaysAgo,
        adherencePercent,
        riskLevel: maaResult.riskLevel,
        riskScore: maaResult.riskScore,
      };
    });

    setPatients(mapped);
    setUnreadCount(unreadRes.count || 0);
    setLoading(false);
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  })();
  const firstName = profile?.name?.split(' ').pop() || 'Profesional';
  const hasPatients = patients.length > 0;
  const patientsAtRisk = patients.filter(p => p.riskLevel !== 'BAJO');
  const avgAdherence = hasPatients ? Math.round(patients.reduce((s, p) => s + p.adherencePercent, 0) / patients.length) : 0;
  const recentActivity = [...patients].sort((a, b) => a.lastSessionDaysAgo - b.lastSessionDaysAgo).slice(0, 5);

  return (
    <AppShell>
      <motion.div className="px-4 pb-6" variants={stagger.container} initial="initial" animate="animate">
        {/* Header */}
        <motion.div variants={stagger.item} className="flex items-center justify-between pt-4 mb-4">
          <div>
            <h1 className="text-lg font-bold text-foreground">{greeting}, {firstName}</h1>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
              {hasPatients && ` · ${patients.length} paciente${patients.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <AvatarCircle name={profile?.name || 'KP'} color="#7EEDC4" size="md" />
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !hasPatients ? (
          <motion.div variants={stagger.item}>
            <KikiCard className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-mint-50 flex items-center justify-center mx-auto mb-4">
                <Users size={28} className="text-mint-500" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">¡Bienvenido a KikiCare!</h2>
              <p className="text-sm text-muted-foreground mb-4 px-4">
                Empezá agregando tu primer paciente. Invitá al cuidador/a para vincularlos.
              </p>
              <button onClick={() => navigate('/kine/patients')} className="btn-primary text-sm px-6">
                Ir a Pacientes
              </button>
            </KikiCard>
          </motion.div>
        ) : (
          <>
            {/* Alert Banner */}
            {patientsAtRisk.length > 0 && (
              <motion.div variants={stagger.item}>
                <KikiCard
                  className="mb-4 border-l-4 border-l-rust bg-red-50/50 cursor-pointer"
                  onClick={() => navigate('/kine/alerts')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <AlertTriangle size={20} className="text-rust" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {patientsAtRisk.length} paciente{patientsAtRisk.length !== 1 ? 's' : ''} requiere{patientsAtRisk.length === 1 ? '' : 'n'} atención
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {patientsAtRisk.filter(p => p.riskLevel === 'ALTO').length > 0
                          ? `${patientsAtRisk.filter(p => p.riskLevel === 'ALTO').length} en riesgo alto`
                          : 'Adherencia en caída detectada'}
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-muted-foreground" />
                  </div>
                </KikiCard>
              </motion.div>
            )}

            {/* KPI Cards */}
            <motion.div variants={stagger.item} className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 mb-4">
              <StatBadge
                value={`${avgAdherence}%`}
                label="Adherencia prom."
                icon={<TrendingUp size={14} className="text-mint-600" />}
                color="bg-mint-50"
              />
              <StatBadge
                value={todaySessions.toString()}
                label="Sesiones hoy"
                icon={<Activity size={14} className="text-blue-brand" />}
                color="bg-blue-50"
              />
              <StatBadge
                value={unreadCount.toString()}
                label="Mensajes"
                icon={<MessageCircle size={14} className="text-violet-500" />}
                color="bg-violet-50"
              />
            </motion.div>

            {/* Weekly Activity Chart */}
            <motion.div variants={stagger.item} className="mb-4">
              <KikiCard>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Actividad semanal</h3>
                  <BarChart3 size={14} className="text-muted-foreground" />
                </div>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={weeklyActivity}>
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#7A8FA8' }} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8 }}
                      formatter={(value: number) => [`${value} sesiones`, '']}
                    />
                    <Bar dataKey="sessions" fill="hsl(var(--mint))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </KikiCard>
            </motion.div>

            {/* Recent Activity Feed */}
            <motion.div variants={stagger.item} className="mb-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Actividad reciente</h3>
                <button onClick={() => navigate('/kine/patients')} className="text-xs text-mint-600 font-medium">
                  Ver todos
                </button>
              </div>
              <div className="space-y-2">
                {recentActivity.map(p => (
                  <KikiCard
                    key={p.linkId}
                    className="!p-3"
                    onClick={() => navigate(`/kine/patients/${p.linkId}`)}
                  >
                    <div className="flex items-center gap-3">
                      <AvatarCircle name={p.childName} color={p.avatarColor} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium truncate">{p.childName}</p>
                          <RiskBadge level={p.riskLevel} />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {p.lastSessionDaysAgo === 0 ? 'Hoy' : p.lastSessionDaysAgo === 1 ? 'Ayer' : `Hace ${p.lastSessionDaysAgo} días`}
                          {p.diagnosis ? ` · ${p.diagnosis}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${p.adherencePercent >= 70 ? 'text-mint-600' : p.adherencePercent >= 40 ? 'text-gold' : 'text-rust'}`}>
                          {p.adherencePercent}%
                        </p>
                        <p className="text-[9px] text-muted-foreground">adherencia</p>
                      </div>
                    </div>
                  </KikiCard>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </AppShell>
  );
}
