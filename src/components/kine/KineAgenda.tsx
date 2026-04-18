import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Clock, X, Calendar as CalendarIcon } from 'lucide-react';
import { KikiCard } from '@/components/kiki/KikiComponents';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  child_id: string;
  child_name: string;
  appointment_date: string;
  start_time: string;
  duration_minutes: number;
  description: string | null;
  status: string;
}

interface PatientOption {
  childId: string;
  childName: string;
}

const timeSlots = Array.from({ length: 24 }, (_, h) =>
  [`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`]
).flat().filter((_, i) => i >= 14 && i <= 40); // 7:00 to 20:00

const durationOptions = [30, 45, 60, 90, 120];

export function KineAgenda() {
  const { user } = useAuthContext();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [formPatient, setFormPatient] = useState('');
  const [formTime, setFormTime] = useState('09:00');
  const [formDuration, setFormDuration] = useState(30);
  const [formDesc, setFormDesc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
      // Real-time subscription for appointments
      const channel = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'appointments', filter: `therapist_id=eq.${user.id}` }, 
          () => loadData()
        )
        .subscribe();
      
      return () => { supabase.removeChannel(channel); };
    }
  }, [user, currentMonth]);

  const loadData = async () => {
    if (!user) return;

    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];

    const [apptRes, linksRes] = await Promise.all([
      supabase.from('appointments').select('*').eq('therapist_id', user.id)
        .gte('appointment_date', startOfMonth).lte('appointment_date', endOfMonth),
      supabase.from('therapist_caregiver_links').select('child_id').eq('therapist_id', user.id).eq('status', 'active'),
    ]);

    const apptData = apptRes.data || [];
    const childIds = (linksRes.data || []).map(l => l.child_id).filter(Boolean) as string[];

    let childMap = new Map<string, string>();
    if (childIds.length > 0) {
      const { data: children } = await supabase.from('children').select('id, name').in('id', childIds);
      (children || []).forEach(c => childMap.set(c.id, c.name));
      setPatients(childIds.map(id => ({ childId: id, childName: childMap.get(id) || 'Paciente' })));
    }

    setAppointments(apptData.map(a => ({
      ...a,
      child_name: childMap.get(a.child_id) || 'Paciente',
    })));

    setLoading(false);
  };

  const handleCreate = async () => {
    if (!formPatient || !selectedDate || !user) { toast.error('Seleccioná paciente y fecha'); return; }
    setSaving(true);

    const { error } = await supabase.from('appointments').insert({
      therapist_id: user.id,
      child_id: formPatient,
      appointment_date: selectedDate,
      start_time: formTime,
      duration_minutes: formDuration,
      description: formDesc || null,
    });

    if (error) {
      toast.error('Error al crear cita');
    } else {
      toast.success('Cita agendada');
      setShowCreate(false);
      setFormDesc('');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta cita?')) return;
    await supabase.from('appointments').delete().eq('id', id);
    toast.success('Cita eliminada');
  };

  // Calendar helpers
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const dayAppointments = appointments.filter(a => a.appointment_date === selectedDate);
  const appointmentDates = new Set(appointments.map(a => a.appointment_date));

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  return (
    <div className="space-y-4">
      <KikiCard className="!p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon size={18} className="text-mint-600" />
            <h3 className="text-sm font-bold">Agenda</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-1.5 rounded-full hover:bg-muted"><ChevronLeft size={16} /></button>
            <span className="text-xs font-bold w-24 text-center">{monthNames[month]} {year}</span>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-1.5 rounded-full hover:bg-muted"><ChevronRight size={16} /></button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 text-center mb-4">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
            <div key={d} className="text-[9px] font-black text-muted-foreground/50 py-1">{d}</div>
          ))}
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasAppt = appointmentDates.has(dateStr);

            return (
              <button key={i} onClick={() => setSelectedDate(dateStr)}
                className={`relative w-8 h-8 mx-auto rounded-full text-[11px] font-bold transition-all
                  ${isSelected ? 'bg-mint text-navy scale-110 shadow-sm' : isToday ? 'bg-mint-100 text-navy' : 'hover:bg-muted'}`}>
                {day}
                {hasAppt && <div className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? 'bg-navy' : 'bg-blue-brand'}`} />}
              </button>
            );
          })}
        </div>

        {/* Selected date appointments */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-muted-foreground uppercase">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric' })}
            </p>
            <button onClick={() => { setShowCreate(true); if (patients.length > 0 && !formPatient) setFormPatient(patients[0].childId); }}
              className="flex items-center gap-1 text-[11px] font-bold text-mint-600 hover:text-mint-700 transition-colors">
              <Plus size={14} /> Agendar
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-4"><div className="w-4 h-4 border-2 border-mint border-t-transparent rounded-full animate-spin" /></div>
          ) : dayAppointments.length === 0 ? (
            <p className="text-[11px] text-muted-foreground text-center py-4 bg-muted/20 rounded-xl border border-dashed border-border">Sin citas para hoy</p>
          ) : (
            <div className="space-y-2">
              {dayAppointments.sort((a, b) => a.start_time.localeCompare(b.start_time)).map(appt => (
                <div key={appt.id} className="group relative flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Clock size={16} className="text-blue-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{appt.child_name}</p>
                    <p className="text-[10px] text-muted-foreground">{appt.start_time.slice(0, 5)} · {appt.duration_minutes} min</p>
                  </div>
                  <button onClick={() => handleDelete(appt.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-rust transition-all">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </KikiCard>

      {/* Create appointment modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-[100] px-6">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-card rounded-2xl p-6 w-full max-w-[340px] shadow-2xl border border-white/20">
              <h3 className="font-bold text-center text-lg mb-1">Nueva cita</h3>
              <p className="text-[11px] text-muted-foreground text-center mb-6">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block ml-1">Paciente *</label>
                  <select className="input-kiki text-sm py-3" value={formPatient} onChange={e => setFormPatient(e.target.value)}>
                    <option value="">Seleccionar paciente...</option>
                    {patients.map(p => <option key={p.childId} value={p.childId}>{p.childName}</option>)}
                  </select>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block ml-1">Hora</label>
                    <select className="input-kiki text-sm py-3" value={formTime} onChange={e => setFormTime(e.target.value)}>
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block ml-1">Duración</label>
                    <select className="input-kiki text-sm py-3" value={formDuration} onChange={e => setFormDuration(Number(e.target.value))}>
                      {durationOptions.map(d => <option key={d} value={d}>{d} min</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block ml-1">Descripción (opcional)</label>
                  <input className="input-kiki text-sm py-3" value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Ej: Control mensual de GMFCS" />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button onClick={handleCreate} disabled={saving} className="btn-primary w-full py-4 text-sm">
                    {saving ? 'Guardando...' : 'Confirmar cita'}
                  </button>
                  <button onClick={() => setShowCreate(false)} className="btn-ghost w-full py-2 text-sm">Cancelar</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
