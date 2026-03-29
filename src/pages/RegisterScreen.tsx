import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';

const passwordRules = [
  { test: (p: string) => p.length >= 8, label: 'Mínimo 8 caracteres' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Al menos una mayúscula' },
  { test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p), label: 'Al menos un carácter especial' },
];

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
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = 'Ingresá tu nombre';
    if (!formData.email.trim()) e.email = 'Ingresá tu email';
    if (!formData.password) {
      e.password = 'Ingresá una contraseña';
    } else {
      const failedRules = passwordRules.filter(r => !r.test(formData.password));
      if (failedRules.length > 0) e.password = failedRules.map(r => r.label).join('. ');
    }
    if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e: Record<string, string> = {};
    if (!acceptTerms) e.terms = 'Debés aceptar los términos y condiciones';
    if (!acceptPrivacy) e.privacy = 'Debés aceptar la política de privacidad';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFinish = () => {
    if (!validateStep3()) return;
    setDone(true);
    setTimeout(() => navigate('/login'), 1500);
  };

  const pwdValid = passwordRules.map(r => ({ ...r, pass: r.test(formData.password) }));

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
          <motion.div key={step} className="flex-1 px-6 pt-6 overflow-y-auto pb-6"
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
                <div>
                  <input className={`input-kiki ${errors.name ? 'border-rust' : ''}`} placeholder="Nombre completo" value={formData.name} onChange={e => handleChange('name', e.target.value)} />
                  {errors.name && <p className="text-xs text-rust mt-1">{errors.name}</p>}
                </div>
                <div>
                  <input className={`input-kiki ${errors.email ? 'border-rust' : ''}`} placeholder="Email" type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} />
                  {errors.email && <p className="text-xs text-rust mt-1">{errors.email}</p>}
                </div>
                <div>
                  <input className={`input-kiki ${errors.password ? 'border-rust' : ''}`} placeholder="Contraseña" type="password" value={formData.password} onChange={e => handleChange('password', e.target.value)} />
                  {formData.password && (
                    <div className="mt-2 space-y-1">
                      {pwdValid.map((r, i) => (
                        <div key={i} className={`flex items-center gap-1.5 text-xs ${r.pass ? 'text-mint-600' : 'text-rust'}`}>
                          {r.pass ? <Check size={12} /> : <AlertCircle size={12} />}
                          <span>{r.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.password && !formData.password && <p className="text-xs text-rust mt-1">{errors.password}</p>}
                </div>
                <div>
                  <input className={`input-kiki ${errors.confirmPassword ? 'border-rust' : ''}`} placeholder="Confirmar contraseña" type="password" value={formData.confirmPassword} onChange={e => handleChange('confirmPassword', e.target.value)} />
                  {errors.confirmPassword && <p className="text-xs text-rust mt-1">{errors.confirmPassword}</p>}
                </div>
                <button onClick={() => { if (validateStep1()) setStep(2); }} className="btn-primary w-full">Siguiente</button>
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

                {/* Terms & Privacy */}
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={acceptTerms} onChange={e => { setAcceptTerms(e.target.checked); setErrors(prev => ({ ...prev, terms: '' })); }}
                      className="mt-0.5 w-5 h-5 rounded border-2 border-border accent-mint" />
                    <span className="text-sm text-foreground">
                      Acepto los{' '}
                      <button onClick={(e) => { e.preventDefault(); navigate('/terms'); }} className="text-mint-500 font-medium underline">
                        Términos y Condiciones
                      </button>
                    </span>
                  </label>
                  {errors.terms && <p className="text-xs text-rust ml-8">{errors.terms}</p>}

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={acceptPrivacy} onChange={e => { setAcceptPrivacy(e.target.checked); setErrors(prev => ({ ...prev, privacy: '' })); }}
                      className="mt-0.5 w-5 h-5 rounded border-2 border-border accent-mint" />
                    <span className="text-sm text-foreground">
                      Acepto la{' '}
                      <button onClick={(e) => { e.preventDefault(); navigate('/privacy'); }} className="text-mint-500 font-medium underline">
                        Política de Privacidad
                      </button>
                    </span>
                  </label>
                  {errors.privacy && <p className="text-xs text-rust ml-8">{errors.privacy}</p>}
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
