import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';

export default function RegisterScreen() {
  const navigate = useNavigate();
  const { selectedRole } = useAppStore();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'kinesiologist' | 'caregiver'>(selectedRole || 'caregiver');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    specialty: '', institution: '', matricula: '',
    childName: '', childAge: '', childDiagnosis: '', gmfcs: '', therapistName: '',
  });
  const [done, setDone] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFinish = () => {
    setDone(true);
    setTimeout(() => navigate('/login'), 1500);
  };

  return (
    <div className="mobile-frame flex flex-col min-h-screen bg-background">
      <div className="px-4 pt-4 flex items-center gap-3">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? 'bg-mint' : 'bg-muted'}`} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Paso {step} de 3</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {done ? (
          <motion.div key="done" className="flex-1 flex flex-col items-center justify-center px-6"
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}>
            <div className="w-20 h-20 rounded-full bg-mint flex items-center justify-center mb-4">
              <Check size={40} className="text-navy" />
            </div>
            <h2 className="text-xl font-bold text-foreground">¡Cuenta creada!</h2>
            <p className="text-sm text-muted-foreground mt-2">Redirigiendo al inicio de sesión...</p>
          </motion.div>
        ) : (
          <motion.div key={step} className="flex-1 px-6 pt-6"
            initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }}
            transition={{ duration: 0.3 }}>

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Datos personales</h2>
                <div className="flex gap-2">
                  {(['kinesiologist', 'caregiver'] as const).map(r => (
                    <button key={r} onClick={() => setRole(r)}
                      className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${role === r ? 'bg-mint text-navy' : 'bg-muted text-muted-foreground'}`}>
                      {r === 'kinesiologist' ? 'Kinesiólogo' : 'Cuidadora'}
                    </button>
                  ))}
                </div>
                <input className="input-kiki" placeholder="Nombre completo" value={formData.name} onChange={e => handleChange('name', e.target.value)} />
                <input className="input-kiki" placeholder="Email" type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} />
                <input className="input-kiki" placeholder="Contraseña" type="password" value={formData.password} onChange={e => handleChange('password', e.target.value)} />
                <input className="input-kiki" placeholder="Confirmar contraseña" type="password" value={formData.confirmPassword} onChange={e => handleChange('confirmPassword', e.target.value)} />
                <button onClick={() => setStep(2)} className="btn-primary w-full">Siguiente</button>
              </div>
            )}

            {step === 2 && role === 'kinesiologist' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Datos profesionales</h2>
                <select className="input-kiki" value={formData.specialty} onChange={e => handleChange('specialty', e.target.value)}>
                  <option value="">Especialidad</option>
                  <option>Kinesiología Pediátrica</option>
                  <option>Kinesiología Neurológica</option>
                  <option>Fisioterapia general</option>
                </select>
                <input className="input-kiki" placeholder="Institución / Centro" value={formData.institution} onChange={e => handleChange('institution', e.target.value)} />
                <input className="input-kiki" placeholder="Matrícula profesional" value={formData.matricula} onChange={e => handleChange('matricula', e.target.value)} />
                <button onClick={() => setStep(3)} className="btn-primary w-full">Siguiente</button>
              </div>
            )}

            {step === 2 && role === 'caregiver' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Datos del niño</h2>
                <input className="input-kiki" placeholder="Nombre del niño" value={formData.childName} onChange={e => handleChange('childName', e.target.value)} />
                <input className="input-kiki" placeholder="Edad" type="number" value={formData.childAge} onChange={e => handleChange('childAge', e.target.value)} />
                <select className="input-kiki" value={formData.childDiagnosis} onChange={e => handleChange('childDiagnosis', e.target.value)}>
                  <option value="">Diagnóstico</option>
                  <option>PCI espástica bilateral</option>
                  <option>PCI espástica unilateral</option>
                  <option>PCI discinética</option>
                  <option>PCI atáxica</option>
                  <option>PCI mixta</option>
                </select>
                <select className="input-kiki" value={formData.gmfcs} onChange={e => handleChange('gmfcs', e.target.value)}>
                  <option value="">Nivel GMFCS</option>
                  {[1,2,3,4,5].map(l => <option key={l} value={l}>Nivel {l}</option>)}
                </select>
                <input className="input-kiki" placeholder="Nombre del kinesiólogo" value={formData.therapistName} onChange={e => handleChange('therapistName', e.target.value)} />
                <button onClick={() => setStep(3)} className="btn-primary w-full">Siguiente</button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Confirmación</h2>
                <div className="card-kiki p-4 space-y-2">
                  <p className="text-sm"><span className="font-medium">Nombre:</span> {formData.name || 'No completado'}</p>
                  <p className="text-sm"><span className="font-medium">Email:</span> {formData.email || 'No completado'}</p>
                  <p className="text-sm"><span className="font-medium">Rol:</span> {role === 'kinesiologist' ? 'Kinesiólogo' : 'Cuidadora'}</p>
                  {role === 'kinesiologist' && (
                    <>
                      <p className="text-sm"><span className="font-medium">Especialidad:</span> {formData.specialty}</p>
                      <p className="text-sm"><span className="font-medium">Matrícula:</span> {formData.matricula}</p>
                    </>
                  )}
                  {role === 'caregiver' && (
                    <>
                      <p className="text-sm"><span className="font-medium">Niño:</span> {formData.childName}</p>
                      <p className="text-sm"><span className="font-medium">Diagnóstico:</span> {formData.childDiagnosis}</p>
                    </>
                  )}
                </div>
                <button onClick={handleFinish} className="btn-primary w-full">Crear cuenta</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
