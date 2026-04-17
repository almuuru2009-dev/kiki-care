import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Clock, X, CalendarDays } from 'lucide-react';
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

interface PatientOption { childId: string; childName: string; }

const timeSlots = Array.from({ length: 27 }, (_, i) => {
  const total = 7 * 60 + i * 30;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});
const durationOptions = [30, 45, 60, 90, 120];
const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function AgendaSection() {
  const { user } = useAuthContext();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

  const [formPatient, setFormPatient] = useState('');
  const [formTime, setFormTime] = useState('09:00');
  const [formDuration, setFormDuration] = useState(30);
  const [formDesc, setFormDesc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadData();
    // realtime sync — caregivers will see updates immediately on their side via their own subscription
    const channel = supabase
      .channel('agenda-section-appts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const childIds = (linksRes.data || []).map(l => l.child_id).filter(Boolean) as string[];
    const childMap = new Map<string, string>();
    if (childIds.length > 0) {
      const { data: children } = await supabase.from('children').select('id, name').in('id', childIds);
      (children || []).forEach(c => childMap.set(c.id, c.name));
      setPatients(childIds.map(id => ({ childId: id, childName: childMap.get(id) || 'Paciente' })));
    }
    setAppointments((apptRes.data || []).map(a => ({ ...a, child_name: childMap.get(a.child_id) || 'Paciente' })));
  };

  const openCreate = () => {
    setEditing(null);
    if (patients.length > 0 && !formPatient) setFormPatient(patients[0].childId);
    setFormTime('09:00'); setFormDuration(30); setFormDesc('');
    setShowCreate(true);
  };

  const openEdit = (a: Appointment) => {
    setEditing(a);
    setFormPatient(a.child_id);
    setFormTime(a.start_time.slice(0, 5));
    setFormDuration(a.duration_minutes);
    setFormDesc(a.description || '');
    setShowCreate(true);
  };

  const handleSave = async () => {
    if (!formPatient || !selectedDate || !user) { toast.error('Seleccioná paciente y fecha'); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('appointments').update({
        child_id: formPatient,
        appointment_date: selectedDate,
        start_time: formTime,
        duration_minutes: formDuration,
        description: formDesc || null,
      }).eq('id', editing.id);
      if (error) toast.error('Error al actualizar'); else { toast.success('Cita actualizada'); setShowCreate(false); loadData(); }
    } else {
      const { error } = await supabase.from('appointments').insert({
        therapist_id: user.id,
        child_id: formPatient,
        appointment_date: selectedDate,
        start_time: formTime,
        duration_minutes: formDuration,
        description: formDesc || null,
      });
      if (error) toast.error('Error al crear'); else { toast.success('Cita creada'); setShowCreate(false); loadData(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Cancelar esta cita?')) return;
    await supabase.from('appointments').delete().eq('id', id);
    setAppointments(prev => prev.filter(a => a.id !== id));
    toast.success('Cita cancelada');
  };

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

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <CalendarDays size={14} /> Agenda
        </h3>
        <button onClick={openCreate} className="flex items-center gap-1 text-xs font-medium text-mint-600">
          <Plus size={14} /> Nueva cita
        </button>
      </div>

      <KikiCard className="!p-3 space-y-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            <ChevronLeft size={16} />
          </button>
          <p className="text-sm font-semibold">{monthNames[month]} {year}</p>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
            <div key={d} className="text-[9px] font-semibold text-muted-foreground py-0.5">{d}</div>
          ))}
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasAppt = appointmentDates.has(dateStr);
            return (
              <button key={i} onClick={() => setSelectedDate(dateStr)}
                className={`relative w-7 h-7 mx-auto rounded-full text-[11px] font-medium transition-colors
                  ${isSelected ? 'bg-mint text-navy' : isToday ? 'bg-mint-100 text-navy' : 'hover:bg-muted'}`}>
                {day}
                {hasAppt && <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-brand" />}
              </button>
            );
          })}
        </div>

        {selectedDate && (
          <div className="border-t pt-2 space-y-1.5">
            <p className="text-xs font-semibold">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
            {dayAppointments.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin citas este día</p>
            ) : (
              dayAppointments.sort((a, b) => a.start_time.localeCompare(b.start_time)).map(appt => (
                <div key={appt.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                  <Clock size={14} className="text-blue-brand shrink-0" />
                  <button onClick={() => openEdit(appt)} className="flex-1 text-left">
                    <p className="text-xs font-medium">{appt.start_time.slice(0, 5)} · {appt.child_name}</p>
                    <p className="text-[10px] text-muted-foreground">{appt.duration_minutes} min{appt.description ? ` · ${appt.description}` : ''}</p>
                  </button>
                  <button onClick={() => handleDelete(appt.id)} className="text-muted-foreground hover:text-rust" aria-label="Cancelar cita">
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </KikiCard>

      {showCreate && (
        <div className="fixed inset-0 bg-foreground/40 flex items-center justify-center z-50 px-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-xl p-5 w-full max-w-[340px] shadow-kiki-lg space-y-3">
            <h3 className="font-semibold text-center">{editing ? 'Editar cita' : 'Nueva cita'}</h3>
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
              <label className="text-xs font-medium block mb-1">Descripción</label>
              <input className="input-kiki text-sm" value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Ej: Control mensual" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm">
                {saving ? 'Guardando...' : (editing ? 'Guardar cambios' : 'Crear cita')}
              </button>
              <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1 text-sm">Cancelar</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
