import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Clock, X } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { KikiCard } from '@/components/kiki/KikiComponents';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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

export default function AgendaScreen() {
  const { user } = useAuthContext();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [_loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [formPatient, setFormPatient] = useState('');
  const [formTime, setFormTime] = useState('09:00');
  const [formDuration, setFormDuration] = useState(30);
  const [formDesc, setFormDesc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadData();
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
      toast.success('Cita creada');
      setShowCreate(false);
      setFormDesc('');
      loadData();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta cita?')) return;
    await supabase.from('appointments').delete().eq('id', id);
    setAppointments(prev => prev.filter(a => a.id !== id));
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

  const dayAppointments = selectedDate ? appointments.filter(a => a.appointment_date === selectedDate) : [];
  const appointmentDates = new Set(appointments.map(a => a.appointment_date));

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  return (
    <AppShell>
      <div className="px-4 pt-4 pb-6 space-y-4">
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <ChevronLeft size={18} />
          </button>
          <h1 className="text-base font-semibold">{monthNames[month]} {year}</h1>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
            <div key={d} className="text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
          ))}
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasAppt = appointmentDates.has(dateStr);

            return (
              <button key={i} onClick={() => setSelectedDate(dateStr)}
                className={`relative w-9 h-9 mx-auto rounded-full text-xs font-medium transition-colors
                  ${isSelected ? 'bg-mint text-navy' : isToday ? 'bg-mint-100 text-navy' : 'hover:bg-muted'}`}>
                {day}
                {hasAppt && <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-brand" />}
              </button>
            );
          })}
        </div>

        {/* Selected date appointments */}
        {selectedDate && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
              </h2>
              <button onClick={() => { setShowCreate(true); if (patients.length > 0 && !formPatient) setFormPatient(patients[0].childId); }}
                className="flex items-center gap-1 text-xs font-medium text-mint-600">
                <Plus size={14} /> Crear cita
              </button>
            </div>

            {dayAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin citas este día</p>
            ) : (
              <div className="space-y-2">
                {dayAppointments.sort((a, b) => a.start_time.localeCompare(b.start_time)).map(appt => (
                  <KikiCard key={appt.id} className="!p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <Clock size={18} className="text-blue-brand" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{appt.child_name}</p>
                        <p className="text-xs text-muted-foreground">{appt.start_time.slice(0, 5)} · {appt.duration_minutes} min</p>
                        {appt.description && <p className="text-[11px] text-muted-foreground mt-0.5">{appt.description}</p>}
                      </div>
                      <button onClick={() => handleDelete(appt.id)} className="text-muted-foreground hover:text-rust">
                        <X size={14} />
                      </button>
                    </div>
                  </KikiCard>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create appointment modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-foreground/40 flex items-center justify-center z-50 px-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-xl p-5 w-full max-w-[340px] shadow-kiki-lg space-y-4">
            <h3 className="font-semibold text-center">Nueva cita</h3>
            <p className="text-xs text-muted-foreground text-center">
              {selectedDate && new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>

            <div>
              <label className="text-xs font-medium block mb-1">Paciente *</label>
              <select className="input-kiki text-sm" value={formPatient} onChange={e => setFormPatient(e.target.value)}>
                <option value="">Seleccionar...</option>
                {patients.map(p => <option key={p.childId} value={p.childId}>{p.childName}</option>)}
              </select>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium block mb-1">Hora</label>
                <select className="input-kiki text-sm" value={formTime} onChange={e => setFormTime(e.target.value)}>
                  {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium block mb-1">Duración</label>
                <select className="input-kiki text-sm" value={formDuration} onChange={e => setFormDuration(Number(e.target.value))}>
                  {durationOptions.map(d => <option key={d} value={d}>{d} min</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1">Descripción (opcional)</label>
              <input className="input-kiki text-sm" value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Ej: Control mensual" />
            </div>

            <div className="flex gap-2">
              <button onClick={handleCreate} disabled={saving} className="btn-primary flex-1 text-sm">
                {saving ? 'Creando...' : 'Crear cita'}
              </button>
              <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1 text-sm">Cancelar</button>
            </div>
          </motion.div>
        </div>
      )}
    </AppShell>
  );
}
