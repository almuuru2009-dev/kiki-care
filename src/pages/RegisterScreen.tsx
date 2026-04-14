import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, AlertCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KikiCard } from '@/components/kiki/KikiComponents';

const passwordRules = [
  { test: (p: string) => p.length >= 8, label: 'Mínimo 8 caracteres' },
  { test: (p: string) => p.length <= 20, label: 'Máximo 20 caracteres' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Al menos una mayúscula' },
  { test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p), label: 'Al menos un carácter especial' },
];

export default function RegisterScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'kinesiologist' | 'caregiver'>('caregiver');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    specialty: '', institution: '', matricula: '',
    childName: '', childAge: '', childDiagnosis: '', gmfcs: '', therapistName: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleChange = (field: string, value: string) => {
    if (field === 'password' && value.length > 20) return;
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

  const validateStep2Kine = () => {
    const e: Record<string, string> = {};
    if (!formData.specialty) e.specialty = 'Seleccioná tu especialidad';
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

  const handleFinish = async () => {
    if (!validateStep3()) return;
    setLoading(true);
    setErrors({});

    const metadata: Record<string, string> = {
      name: formData.name,
      role,
    };
    if (role === 'kinesiologist') {
      if (formData.specialty) metadata.specialty = formData.specialty;
      if (formData.institution) metadata.institution = formData.institution;
      if (formData.matricula) metadata.matricula = formData.matricula;
    }

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin + '/login',
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already been registered') || error.message.toLowerCase().includes('user already registered')) {
        setErrors({ email: 'Este correo ya está en uso. Intentá iniciar sesión.' });
        setStep(1);
      } else if (error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('security purposes')) {
        setErrors({ email: 'Demasiados intentos. Esperá unos segundos e intentá de nuevo.' });
      } else {
        toast.error('Error al crear la cuenta. Intentá de nuevo.');
      }
      setLoading(false);
      return;
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setErrors({ email: 'Este correo ya está en uso. Intentá iniciar sesión.' });
      setStep(1);
      setLoading(false);
      return;
    }

    // Sign out immediately - user needs to verify email first
    await supabase.auth.signOut();

    if (role === 'caregiver' && formData.childName && data.user) {
      localStorage.setItem('kikicare_pending_child', JSON.stringify({
        name: formData.childName,
        age: formData.childAge ? parseInt(formData.childAge) : null,
        diagnosis: formData.childDiagnosis || null,
        gmfcs: formData.gmfcs ? parseInt(formData.gmfcs) : null,
      }));
    }

    setLoading(false);
    setDone(true);
  };

  const pwdValid = passwordRules.map(r => ({ ...r, pass: r.test(formData.password) }));

  const handleStep1Next = () => {
    if (validateStep1()) setStep(2);
  };

  const handleStep2Next = () => {
    if (role === 'kinesiologist') {
      if (validateStep2Kine()) setStep(3);
    } else {
      setStep(3);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-[420px] mx-auto">
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
            <p className="text-sm text-muted-foreground mt-2 text-center px-4">
              Te enviamos un email de verificación. Revisá tu bandeja de entrada y hacé click en el enlace para activar tu cuenta.
            </p>
            <button onClick={() => navigate('/login')} className="btn-primary mt-6 px-8">
              Ir al inicio de sesión
            </button>
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
                  <input className={`input-kiki ${errors.password ? 'border-rust' : ''}`} placeholder="Contraseña" type="password" value={formData.password} onChange={e => handleChange('password', e.target.value)} maxLength={20} />
                  {formData.password && (
                    <div className="mt-2 space-y-1">
                      {pwdValid.map((r, i) => (
                        <div key={i} className={`flex items-center gap-1.5 text-xs ${r.pass ? 'text-mint-600' : 'text-muted-foreground'}`}>
                          {r.pass ? <Check size={12} /> : <AlertCircle size={12} />}
                          <span>{r.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.password && !formData.password && <p className="text-xs text-rust mt-1">{errors.password}</p>}
                </div>
                <div>
                  <input className={`input-kiki ${errors.confirmPassword ? 'border-rust' : ''}`} placeholder="Confirmar contraseña" type="password" value={formData.confirmPassword} onChange={e => handleChange('confirmPassword', e.target.value)} maxLength={20} />
                  {errors.confirmPassword && <p className="text-xs text-rust mt-1">{errors.confirmPassword}</p>}
                </div>
                <button onClick={handleStep1Next} className="btn-primary w-full">
                  Siguiente
                </button>
              </div>
            )}

            {step === 2 && role === 'kinesiologist' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Datos profesionales</h2>
                <div>
                  <select className={`input-kiki ${errors.specialty ? 'border-rust' : ''}`} value={formData.specialty} onChange={e => handleChange('specialty', e.target.value)}>
                    <option value="">Especialidad *</option>
                    <option>Kinesiología Pediátrica</option>
                    <option>Kinesiología Neurológica</option>
                    <option>Fisioterapia general</option>
                  </select>
                  {errors.specialty && <p className="text-xs text-rust mt-1">{errors.specialty}</p>}
                </div>
                <input className="input-kiki" placeholder="Institución / Centro" value={formData.institution} onChange={e => handleChange('institution', e.target.value)} />
                <input className="input-kiki" placeholder="Matrícula profesional" value={formData.matricula} onChange={e => handleChange('matricula', e.target.value)} />
                <button onClick={handleStep2Next} className="btn-primary w-full">Siguiente</button>
              </div>
            )}

            {step === 2 && role === 'caregiver' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Datos del niño</h2>
                <input className="input-kiki" placeholder="Nombre del niño" value={formData.childName} onChange={e => handleChange('childName', e.target.value)} />
                <input className="input-kiki" placeholder="Edad (0-18)" type="number" min="0" max="18" value={formData.childAge} onChange={e => {
                  const val = e.target.value;
                  if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 18)) handleChange('childAge', val);
                }} />
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
                <button onClick={handleStep2Next} className="btn-primary w-full">Siguiente</button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Confirmación</h2>
                <KikiCard className="!p-4 space-y-2">
                  <p className="text-sm"><span className="font-medium">Nombre:</span> {formData.name || 'No completado'}</p>
                  <p className="text-sm"><span className="font-medium">Email:</span> {formData.email || 'No completado'}</p>
                  <p className="text-sm"><span className="font-medium">Rol:</span> {role === 'kinesiologist' ? 'Kinesiólogo' : 'Cuidadora'}</p>
                  {role === 'kinesiologist' && (
                    <>
                      <p className="text-sm"><span className="font-medium">Especialidad:</span> {formData.specialty}</p>
                      {formData.matricula && <p className="text-sm"><span className="font-medium">Matrícula:</span> {formData.matricula}</p>}
                    </>
                  )}
                  {role === 'caregiver' && formData.childName && (
                    <>
                      <p className="text-sm"><span className="font-medium">Niño:</span> {formData.childName}</p>
                      {formData.childDiagnosis && <p className="text-sm"><span className="font-medium">Diagnóstico:</span> {formData.childDiagnosis}</p>}
                    </>
                  )}
                </KikiCard>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={acceptTerms} onChange={e => { setAcceptTerms(e.target.checked); setErrors(prev => ({ ...prev, terms: '' })); }}
                      className="mt-0.5 w-5 h-5 rounded border-2 border-border accent-mint" />
                    <span className="text-sm text-foreground">
                      Acepto los{' '}
                      <button onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} className="text-mint-500 font-medium underline">
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
                      <button onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }} className="text-mint-500 font-medium underline">
                        Política de Privacidad
                      </button>
                    </span>
                  </label>
                  {errors.privacy && <p className="text-xs text-rust ml-8">{errors.privacy}</p>}
                </div>

                <button onClick={handleFinish} disabled={loading} className="btn-primary w-full disabled:opacity-60">
                  {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowTermsModal(false)}>
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-card rounded-t-2xl w-full max-w-[420px] max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-border">
              <h3 className="text-lg font-semibold">Términos y condiciones</h3>
              <button onClick={() => setShowTermsModal(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <TermsContent />
            </div>
          </motion.div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowPrivacyModal(false)}>
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-card rounded-t-2xl w-full max-w-[420px] max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-border">
              <h3 className="text-lg font-semibold">Política de privacidad</h3>
              <button onClick={() => setShowPrivacyModal(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <PrivacyContent />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function TermsContent() {
  return (
    <div className="text-sm text-muted-foreground space-y-3">
      <h4 className="font-semibold text-foreground">1. Aceptación</h4>
      <p>Al usar KikiCare aceptás estos términos. Si no estás de acuerdo, no uses la app.</p>
      <h4 className="font-semibold text-foreground">2. Uso de la aplicación</h4>
      <p>KikiCare es una herramienta de apoyo para la rehabilitación domiciliaria. No reemplaza el criterio profesional.</p>
      <h4 className="font-semibold text-foreground">3. Cuentas</h4>
      <p>Sos responsable de la seguridad de tu cuenta. No compartas tus credenciales.</p>
      <h4 className="font-semibold text-foreground">4. Datos</h4>
      <p>Los datos ingresados son tratados conforme a la Ley 25.326 de Protección de Datos Personales.</p>
      <h4 className="font-semibold text-foreground">5. Limitación de responsabilidad</h4>
      <p>KikiCare no se responsabiliza por decisiones clínicas tomadas en base a la información de la app.</p>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="text-sm text-muted-foreground space-y-3">
      <h4 className="font-semibold text-foreground">1. Datos recopilados</h4>
      <p>Recopilamos nombre, email, datos del niño y registros de sesiones de ejercicios.</p>
      <h4 className="font-semibold text-foreground">2. Uso de datos</h4>
      <p>Los datos se usan exclusivamente para el funcionamiento de la app y seguimiento terapéutico.</p>
      <h4 className="font-semibold text-foreground">3. Almacenamiento</h4>
      <p>Los datos se almacenan en servidores seguros con encriptación.</p>
      <h4 className="font-semibold text-foreground">4. Derechos</h4>
      <p>Podés solicitar la eliminación de tu cuenta y todos tus datos en cualquier momento.</p>
      <h4 className="font-semibold text-foreground">5. Contacto</h4>
      <p>Para consultas: soporte.kikicare@gmail.com</p>
    </div>
  );
}
