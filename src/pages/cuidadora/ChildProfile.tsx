import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, LogOut, ChevronRight, Edit2, HelpCircle, Shield, Globe, MessageSquarePlus, UserMinus, Save, X, Trash2, AlertTriangle, Hash, Heart, ChevronDown } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KikiCard, AvatarCircle } from '@/components/kiki/KikiComponents';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import kikiGlasses from '@/assets/kiki-glasses.png';

interface ChildData {
  id: string;
  name: string;
  age: number | null;
  diagnosis: string | null;
  gmfcs: number | null;
}

interface TherapistLink {
  id: string;
  therapist_id: string;
  therapist_name: string;
  therapist_specialty: string | null;
  therapist_matricula: string | null;
}

export default function ChildProfile() {
  const navigate = useNavigate();
  const { user, profile, signOut, updateProfile } = useAuthContext();

  const [child, setChild] = useState<ChildData | null>(null);
  const [therapistLink, setTherapistLink] = useState<TherapistLink | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const [editingChild, setEditingChild] = useState(false);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childDiagnosis, setChildDiagnosis] = useState('');
  const [childGmfcs, setChildGmfcs] = useState('');

  const [editingAccount, setEditingAccount] = useState(false);
  const [editName, setEditName] = useState('');

  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  

  const [savedExercises, setSavedExercises] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<{type: string, value: string} | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
      setEditName(profile?.name || '');
      loadSavedExercises();
    }
  }, [user, profile]);

  const loadSavedExercises = async () => {
    if (!user) return;
    const { data: favs } = await supabase.from('saved_exercises').select('exercise_id').eq('user_id', user.id);
    if (!favs || favs.length === 0) { setSavedExercises([]); return; }
    
    const ids = favs.map(f => f.exercise_id);
    
    const [exRes, commRes] = await Promise.all([
      supabase.from('exercises').select('*').in('id', ids),
      supabase.from('community_exercises').select('*').in('id', ids)
    ]);
    
    const combined = [
      ...(exRes.data || []),
      ...(commRes.data || []).map(c => ({...c, name: c.clinical_name}))
    ];
    setSavedExercises(combined);
  };

  const filteredExercises = useMemo(() => {
    if (!activeFilter?.value) return savedExercises;
    return savedExercises.filter(ex => {
      const val = activeFilter.value.toLowerCase();
      if (activeFilter.type === 'area') {
        return (ex.target_area || ex.area || '').toLowerCase().includes(val);
      }
      if (activeFilter.type === 'difficulty') {
        return (ex.difficulty || '').toLowerCase() === val;
      }
      if (activeFilter.type === 'age') {
        return (ex.age_range || '').toLowerCase().includes(val);
      }
      return true;
    });
  }, [savedExercises, activeFilter]);

  const loadData = async () => {
    if (!user) return;

    const { data: children } = await supabase
      .from('children')
      .select('*')
      .eq('caregiver_id', user.id)
      .limit(1);

    if (children && children.length > 0) {
      const c = children[0];
      setChild({ id: c.id, name: c.name, age: c.age, diagnosis: c.diagnosis, gmfcs: c.gmfcs });
      setChildName(c.name);
      setChildAge(c.age?.toString() || '');
      setChildDiagnosis(c.diagnosis || '');
      setChildGmfcs(c.gmfcs?.toString() || '');
    }

    const { data: links } = await supabase
      .from('therapist_caregiver_links')
      .select('id, therapist_id')
      .eq('caregiver_id', user.id)
      .eq('status', 'active')
      .limit(1);

    if (links && links.length > 0) {
      const link = links[0];
      const { data: therapistProfile } = await supabase
        .from('profiles')
        .select('name, specialty, matricula')
        .eq('id', link.therapist_id)
        .single();

      setTherapistLink({
        id: link.id,
        therapist_id: link.therapist_id,
        therapist_name: therapistProfile?.name || 'Kinesiólogo',
        therapist_specialty: therapistProfile?.specialty || null,
        therapist_matricula: therapistProfile?.matricula || null,
      });
    }

    setLoadingData(false);
  };

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const handleSaveChild = async () => {
    if (!child) return;
    const { error } = await supabase
      .from('children')
      .update({
        name: childName,
        age: childAge ? parseInt(childAge) : null,
        diagnosis: childDiagnosis || null,
        gmfcs: childGmfcs ? parseInt(childGmfcs) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', child.id);

    if (error) {
      toast.error('Error al guardar');
    } else {
      setChild({ ...child, name: childName, age: childAge ? parseInt(childAge) : null, diagnosis: childDiagnosis, gmfcs: childGmfcs ? parseInt(childGmfcs) : null });
      toast.success('Información del niño actualizada');
      setEditingChild(false);
    }
  };

  const handleSaveAccount = async () => {
    if (!user) return;
    const { error } = await updateProfile({ name: editName });
    if (error) {
      toast.error('Error al guardar');
    } else {
      setEditingAccount(false);
      toast.success('Cuenta actualizada');
    }
  };

  const handleUnlink = async () => {
    if (!therapistLink) return;
    const { error } = await supabase
      .from('therapist_caregiver_links')
      .update({ status: 'archived', responded_at: new Date().toISOString() })
      .eq('id', therapistLink.id);

    if (error) {
      toast.error('Error al desvincular');
    } else {
      setTherapistLink(null);
      setShowUnlinkConfirm(false);
      toast.success('Kinesiólogo desvinculado');
    }
  };



  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;
      toast.success('Cuenta eliminada permanentemente');
      await signOut();
      navigate('/', { replace: true });
    } catch (e: any) {
      toast.error('Error al eliminar cuenta: ' + (e.message || 'Intenta de nuevo'));
      setDeleteLoading(false);
    }
  };

  const stagger = {
    container: { transition: { staggerChildren: 0.06 } },
    item: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } },
  };

  if (loadingData) {
    return (
      <AppShell>
        <ScreenHeader title="Perfil" />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ScreenHeader title="Perfil" />
      <motion.div className="px-4 pb-6 space-y-4" variants={stagger.container} initial="initial" animate="animate">
        {/* Child Hero */}
        <motion.div variants={stagger.item} className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-mint-100 flex items-center justify-center mb-3 relative">
            <motion.img src={kikiGlasses} alt="Kiki" className="w-16 h-16 object-contain"
              animate={{ y: [0, -4, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          </div>
          <h2 className="text-xl font-bold">{child?.name || 'Mi niño'}</h2>
          {child && <p className="text-sm text-muted-foreground">{child.age ? `${child.age} años` : ''}{child.diagnosis ? ` · ${child.diagnosis}` : ''}</p>}
          {child?.gmfcs && (
            <div className="flex gap-2 mt-2">
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-muted">GMFCS Nivel {child.gmfcs}</span>
            </div>
          )}
        </motion.div>

        {/* Review info banner */}
        <motion.div variants={stagger.item}>
          <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-2">
            <span className="text-sm">ℹ️</span>
            <p className="text-xs text-blue-700">Podés revisar y editar la información de tu hijo/a y tu cuenta en esta pantalla.</p>
          </div>
        </motion.div>

        {/* Child info (editable) */}
        {child && (
          <motion.div variants={stagger.item}>
            <KikiCard>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Información del niño</h3>
                <button onClick={() => {
                  if (editingChild) {
                    setChildName(child.name); setChildAge(child.age?.toString() || ''); setChildDiagnosis(child.diagnosis || ''); setChildGmfcs(child.gmfcs?.toString() || '');
                  }
                  setEditingChild(!editingChild);
                }} className="text-xs text-mint-500 font-medium flex items-center gap-1">
                  {editingChild ? <><X size={12} /> Cancelar</> : <><Edit2 size={12} /> Editar</>}
                </button>
              </div>
              {editingChild ? (
                <div className="space-y-2.5">
                  <div><label className="text-[10px] text-muted-foreground font-medium">Nombre</label><input className="input-kiki text-sm" value={childName} onChange={e => setChildName(e.target.value)} /></div>
                  <div><label className="text-[10px] text-muted-foreground font-medium">Edad (0-18)</label><input className="input-kiki text-sm" type="number" min="0" max="18" value={childAge} onChange={e => { const v = e.target.value; if (v === '' || (parseInt(v) >= 0 && parseInt(v) <= 18)) setChildAge(v); }} /></div>
                  <div><label className="text-[10px] text-muted-foreground font-medium">Diagnóstico</label>
                    <select className="input-kiki text-sm" value={childDiagnosis} onChange={e => setChildDiagnosis(e.target.value)}>
                      <option value="">Seleccionar</option><option>PCI espástica bilateral</option><option>PCI espástica unilateral</option><option>PCI discinética</option><option>PCI atáxica</option><option>PCI mixta</option>
                    </select>
                  </div>
                  <div><label className="text-[10px] text-muted-foreground font-medium">Nivel GMFCS</label>
                    <div className="flex gap-2 mt-1">{[1, 2, 3, 4, 5].map(level => (
                      <button key={level} onClick={() => setChildGmfcs(level.toString())} className={`w-9 h-9 rounded-full text-xs font-bold transition-colors ${childGmfcs === level.toString() ? 'bg-mint text-navy' : 'bg-muted text-muted-foreground'}`}>{level}</button>
                    ))}</div>
                  </div>
                  <button onClick={handleSaveChild} className="btn-primary w-full text-sm flex items-center justify-center gap-2"><Save size={14} /> Guardar cambios</button>
                </div>
              ) : (
                <>{[
                  { label: 'Nombre', value: child.name },
                  { label: 'Edad', value: child.age ? `${child.age} años` : '-' },
                  { label: 'Diagnóstico', value: child.diagnosis || '-' },
                  { label: 'GMFCS', value: child.gmfcs ? `Nivel ${child.gmfcs}` : '-' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}</>
              )}
            </KikiCard>
          </motion.div>
        )}

        {!child && (
          <motion.div variants={stagger.item}><KikiCard><p className="text-sm text-muted-foreground text-center py-4">No tenés un niño registrado aún. Tu kinesiólogo te enviará una invitación.</p></KikiCard></motion.div>
        )}

        {/* My therapist */}
        <motion.div variants={stagger.item}>
          <KikiCard>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mi kinesiólogo</h3>
            {therapistLink ? (
              <>
                <div className="flex items-center gap-3">
                  <AvatarCircle name={therapistLink.therapist_name} color="#7EEDC4" size="md" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{therapistLink.therapist_name}</p>
                    {therapistLink.therapist_specialty && <p className="text-xs text-muted-foreground">{therapistLink.therapist_specialty}</p>}
                    {therapistLink.therapist_matricula && <p className="text-xs text-muted-foreground">{therapistLink.therapist_matricula}</p>}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => navigate(`/cuidadora/messages/${therapistLink.therapist_id}`)} className="btn-secondary flex-1 text-sm"><Send size={14} className="inline mr-1" /> Mensaje</button>
                  <button onClick={() => setShowUnlinkConfirm(true)} className="flex-1 text-sm py-2 rounded-xl border border-red-200 text-rust font-medium flex items-center justify-center gap-1"><UserMinus size={14} /> Desvincular</button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No tenés un kinesiólogo vinculado</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Pedile a tu profesional su código de vinculación KIKI</p>
                <button 
                  onClick={() => navigate('/join')} 
                  className="btn-secondary w-full text-xs py-2 flex items-center justify-center gap-2"
                >
                  <Hash size={12} /> Ingresar código
                </button>
              </div>
            )}
          </KikiCard>
        </motion.div>

        {/* My account */}
        <motion.div variants={stagger.item}>
          <KikiCard>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mi cuenta</h3>
              <button onClick={() => { setEditingAccount(!editingAccount); setEditName(profile?.name || ''); }} className="text-xs text-mint-500 font-medium flex items-center gap-1">
                {editingAccount ? <><X size={12} /> Cancelar</> : <><Edit2 size={12} /> Editar</>}
              </button>
            </div>
            {editingAccount ? (
              <div className="space-y-2">
                <input className="input-kiki text-sm" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nombre" />
                <p className="text-xs text-muted-foreground">Email: {profile?.email || user?.email}</p>
                <button onClick={handleSaveAccount} className="btn-primary w-full text-sm">Guardar</button>
              </div>
            ) : (
              <>{[
                { label: 'Nombre', value: profile?.name || '-' },
                { label: 'Email', value: profile?.email || user?.email || '-' },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              ))}</>
            )}
          </KikiCard>
        </motion.div>

        {/* Saved Exercises */}
        <motion.div variants={stagger.item}>
          <KikiCard className="!p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-navy uppercase tracking-widest">Ejercicios guardados</h3>
              <Heart size={16} className="text-red-500 fill-red-500" />
            </div>

            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-hide">
              {[
                { id: 'area', label: 'Área', options: ['Miembros inferiores', 'Miembros superiores', 'Tronco y columna', 'Control cefálico', 'Global'] },
                { id: 'difficulty', label: 'Dificultad', options: ['Suave', 'Moderado', 'Intensivo'] },
                { id: 'age', label: 'Edad', options: ['0–2 años', '2–5 años', '5–10 años', '10–18 años'] }
              ].map(cat => (
                <div key={cat.id} className="relative shrink-0">
                  <button 
                    onClick={() => setActiveFilter(activeFilter?.type === cat.id ? null : { type: cat.id, value: '' })}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5
                      ${activeFilter?.type === cat.id ? 'bg-navy text-white border-navy' : 'bg-white text-muted-foreground border-border'}`}
                  >
                    {cat.label}
                    <ChevronDown size={12} className={`transition-transform ${activeFilter?.type === cat.id ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              ))}
              {activeFilter && (
                <button 
                  onClick={() => setActiveFilter(null)}
                  className="text-[10px] font-bold text-rust bg-red-50 px-3 py-1.5 rounded-full shrink-0"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Sub-filters (Values) */}
            <AnimatePresence>
              {activeFilter && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-1.5 pb-4 border-b border-border/50 mb-4"
                >
                  {[
                    { id: 'area', options: ['Miembros inferiores', 'Miembros superiores', 'Tronco y columna', 'Control cefálico', 'Global'] },
                    { id: 'difficulty', options: ['Suave', 'Moderado', 'Intensivo'] },
                    { id: 'age', options: ['0–2 años', '2–5 años', '5–10 años', '10–18 años'] }
                  ].find(c => c.id === activeFilter.type)?.options?.map(opt => (
                    <button 
                      key={opt}
                      onClick={() => setActiveFilter({ ...activeFilter, value: opt })}
                      className={`text-[10px] px-2.5 py-1 rounded-md font-bold transition-all
                        ${activeFilter.value === opt ? 'bg-mint text-navy shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Exercises Grid */}
            <div className="space-y-3">
              {filteredExercises.length > 0 ? (
                filteredExercises.map(ex => (
                  <div 
                    key={ex.id} 
                    onClick={() => navigate(`/cuidadora/exercise/${ex.id}`)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/30 active:scale-[0.98] transition-transform"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: (ex.thumbnail_color || '#7EEDC4') + '20' }}>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: ex.thumbnail_color || '#7EEDC4' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate text-navy">{ex.simple_name || ex.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {ex.target_area || ex.area || 'General'} · {ex.difficulty || 'Moderado'}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs text-muted-foreground italic">
                    {activeFilter?.value ? 'No se encontraron ejercicios con ese filtro' : 'Aún no tenés ejercicios guardados.'}
                  </p>
                </div>
              )}
            </div>
          </KikiCard>
        </motion.div>

        {/* Change password */}

        {/* Legal */}
        <motion.div variants={stagger.item}>
          <KikiCard>
            {[
              { icon: HelpCircle, label: 'Ayuda', path: '/faq' },
              { icon: Shield, label: 'Términos y condiciones', path: '/terms' },
              { icon: Globe, label: 'Política de privacidad', path: '/privacy' },
            ].map(item => (
              <div key={item.label} onClick={() => navigate(item.path)} className="flex items-center justify-between py-2.5 border-b border-border last:border-0 cursor-pointer">
                <div className="flex items-center gap-2"><item.icon size={16} className="text-muted-foreground" /><span className="text-sm">{item.label}</span></div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            ))}
          </KikiCard>
        </motion.div>




        {/* Logout */}
        <motion.div variants={stagger.item}>
          <button onClick={handleLogout} className="w-full text-center py-3 text-sm font-medium text-rust">
            <LogOut size={16} className="inline mr-2" /> Cerrar sesión
          </button>
        </motion.div>

        {/* Delete account - hide for demo */}
        {profile?.email && !profile.email.includes('kikicare.com') && !profile.email.includes('kikiapp.com') && !profile.email.includes('demo.kikicare.com') && (
          <motion.div variants={stagger.item}>
            <button onClick={() => setShowDeleteConfirm(true)} className="w-full text-center py-2 text-sm text-muted-foreground/60">
              <Trash2 size={12} className="inline mr-1" /> Eliminar cuenta
            </button>
          </motion.div>
        )}


      </motion.div>

      {/* Unlink confirmation */}
      {showUnlinkConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6" onClick={() => setShowUnlinkConfirm(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl p-6 w-full max-w-[340px] shadow-kiki-lg" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-base mb-2">¿Desvincular kinesiólogo?</h3>
            <p className="text-sm text-muted-foreground mb-4">Se archivará el vínculo con {therapistLink?.therapist_name}. Podés solicitar una nueva vinculación después.</p>
            <div className="flex gap-2">
              <button onClick={handleUnlink} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-rust">Sí, desvincular</button>
              <button onClick={() => setShowUnlinkConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-muted text-muted-foreground">Cancelar</button>
            </div>
          </motion.div>
        </div>
      )}



      {/* Delete account confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6" onClick={() => !deleteLoading && setShowDeleteConfirm(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl p-6 w-full max-w-[340px] shadow-kiki-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle size={24} className="text-rust" /></div>
              <div><h3 className="font-bold text-base">¿Eliminar cuenta?</h3><p className="text-xs text-muted-foreground">Esta acción es irreversible</p></div>
            </div>
            <div className="bg-red-50 rounded-xl p-3 mb-4">
              <p className="text-xs text-rust">Al eliminar tu cuenta:</p>
              <ul className="text-xs text-rust mt-1 space-y-0.5 list-disc pl-4">
                <li>Se eliminarán todos tus datos</li>
                <li>Se desvincularán todos los vínculos</li>
                <li>Se borrarán todos los mensajes</li>
                <li>Se eliminará tu email del sistema</li>
                <li>No podrás recuperar esta cuenta</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <button onClick={handleDeleteAccount} disabled={deleteLoading} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-rust disabled:opacity-60">{deleteLoading ? 'Eliminando...' : 'Sí, eliminar'}</button>
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleteLoading} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-muted text-muted-foreground">Cancelar</button>
            </div>
          </motion.div>
        </div>
      )}
    </AppShell>
  );
}
