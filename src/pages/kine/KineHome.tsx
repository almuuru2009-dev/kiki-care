import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, MessageCircle, CalendarCheck } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { KikiCard, StatBadge, AvatarCircle } from '@/components/kiki/KikiComponents';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const stagger = {
  container: { transition: { staggerChildren: 0.08 } },
  item: { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } },
};

interface LinkedPatient {
  id: string;
  name: string;
  caregiver_name: string;
  diagnosis: string | null;
  gmfcs: number | null;
}

export default function KineHome() {
  const navigate = useNavigate();
  const { user, profile } = useAuthContext();
  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Get active links with children
    const { data: links } = await supabase
      .from('therapist_caregiver_links')
      .select('id, caregiver_id, child_id')
      .eq('therapist_id', user.id)
      .eq('status', 'active');

    if (links && links.length > 0) {
      const childIds = links.map(l => l.child_id).filter(Boolean) as string[];
      const caregiverIds = links.map(l => l.caregiver_id).filter(Boolean) as string[];

      // Get children
      let childrenData: any[] = [];
      if (childIds.length > 0) {
        const { data } = await supabase.from('children').select('*').in('id', childIds);
        childrenData = data || [];
      }

      // Get caregiver profiles
      let caregiverProfiles: any[] = [];
      if (caregiverIds.length > 0) {
        const { data } = await supabase.from('profiles').select('id, name').in('id', caregiverIds);
        caregiverProfiles = data || [];
      }

      const mapped: LinkedPatient[] = links.map(link => {
        const child = childrenData.find(c => c.id === link.child_id);
        const caregiver = caregiverProfiles.find(p => p.id === link.caregiver_id);
        return {
          id: link.id,
          name: child?.name || 'Sin nombre',
          caregiver_name: caregiver?.name || 'Cuidador/a',
          diagnosis: child?.diagnosis || null,
          gmfcs: child?.gmfcs || null,
        };
      });
      setPatients(mapped);
    }

    // Count unread messages
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('read', false);
    setUnreadCount(count || 0);

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

  return (
    <AppShell>
      <motion.div className="px-4 pb-6" variants={stagger.container} initial="initial" animate="animate">
        {/* Header */}
        <motion.div variants={stagger.item} className="flex items-center justify-between pt-4 mb-5">
          <div>
            <h1 className="text-xl font-bold text-foreground">{greeting}, {firstName}</h1>
            <p className="text-sm text-muted-foreground">
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
            {/* Stats */}
            <motion.div variants={stagger.item} className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
              <StatBadge value={patients.length.toString()} label="Pacientes activos" color="bg-mint-50" />
              <StatBadge
                value={unreadCount.toString()}
                label="Mensajes sin leer"
                icon={<MessageCircle size={16} className="text-blue-brand" />}
                color="bg-blue-50"
              />
            </motion.div>

            {/* Patient list */}
            <motion.div variants={stagger.item} className="mt-5">
              <h2 className="text-base font-semibold mb-3">Tus pacientes</h2>
              <div className="space-y-2">
                {patients.map(p => (
                  <KikiCard key={p.id} className="border-l-4 border-l-mint" onClick={() => navigate('/kine/patients')}>
                    <div className="flex items-center gap-3">
                      <AvatarCircle name={p.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.diagnosis || 'Sin diagnóstico'} {p.gmfcs ? `· GMFCS ${p.gmfcs}` : ''}</p>
                        <p className="text-[10px] text-muted-foreground">Cuidador/a: {p.caregiver_name}</p>
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
