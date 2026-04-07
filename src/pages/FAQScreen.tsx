import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { KikiCard } from '@/components/kiki/KikiComponents';

const therapistFAQ = [
  { q: '¿Cómo verifica KikiCare mi licencia?', a: 'Al registrarte como kinesiólogo, ingresás tu número de matrícula profesional. Nuestro equipo verifica esta información contra los registros oficiales del Colegio de Kinesiólogos de tu jurisdicción. El proceso puede tomar hasta 48 horas hábiles.' },
  { q: '¿Qué sucede si una familia no registra sus sesiones?', a: 'El sistema detecta automáticamente la inactividad. Si una familia no registra sesiones durante 3 o más días, se genera una alerta en tu panel con el nivel de riesgo y una acción sugerida.' },
  { q: '¿Cómo funciona la alerta de abandono?', a: 'El sistema analiza frecuencia de sesiones, duración promedio, horarios de actividad y estado de ánimo del niño. Cuando detecta un cambio significativo, genera una alerta con nivel BAJO, MODERADO o ALTO.' },
  { q: '¿Puedo tener más de un cuidador por paciente?', a: 'Actualmente cada paciente tiene un cuidador principal asignado. Estamos trabajando en permitir múltiples cuidadores.' },
  { q: '¿Puedo exportar los datos de mis pacientes?', a: 'Sí. Desde el perfil de cada paciente podés generar un informe con todos los datos de adherencia, dificultad promedio y notas.' },
  { q: '¿Qué sucede con mis datos si dejo de usar KikiCare?', a: 'Tus datos se mantienen almacenados de forma segura durante 12 meses después de tu última actividad. Podés solicitar la eliminación completa desde tu perfil.' },
  { q: '¿Cumple KikiCare con la Ley de Protección de Datos?', a: 'Sí. KikiCare cumple con la Ley 25.326 de Protección de Datos Personales de Argentina. Todos los datos se almacenan de forma encriptada.' },
];

const caregiverFAQ = [
  { q: '¿Qué hago si no entiendo algún ejercicio?', a: 'Cada ejercicio incluye instrucciones paso a paso en lenguaje simple. Si tenés dudas, podés enviarle un mensaje a tu kinesiólogo desde la app.' },
  { q: '¿Qué hago si mi hijo se niega a hacer los ejercicios?', a: 'Es normal que algunos días sean más difíciles. Cada ejercicio tiene una variante "para días difíciles". Al registrar la sesión podés indicar el ánimo de tu hijo.' },
  { q: '¿Mi terapeuta ve todo lo que escribo?', a: 'Tu terapeuta puede ver los registros de sesión, las notas voluntarias de cada sesión y los mensajes del chat.' },
  { q: '¿Qué pasa si me salto algunos días?', a: 'La app registra los días de actividad. Lo más importante es retomar cuando puedas — cada sesión cuenta.' },
  { q: 'Mi terapeuta no está en KikiCare, ¿puedo usarla?', a: 'Por el momento funciona con un kinesiólogo asignado. Podés invitarlo a registrarse.' },
  { q: '¿Está segura la información de mi hijo?', a: 'Sí. Toda la información se almacena de forma encriptada y solo es accesible por vos y el kinesiólogo asignado.' },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-start gap-3 py-3 text-left">
        <span className="text-sm font-medium text-foreground flex-1">{q}</span>
        <ChevronDown size={16} className={`text-muted-foreground shrink-0 mt-0.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <p className="text-sm text-muted-foreground pb-3 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQScreen() {
  const navigate = useNavigate();

  return (
    <div className="max-w-[420px] mx-auto w-full flex flex-col min-h-screen bg-background">
      <div className="px-4 pt-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold">Preguntas frecuentes</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-4">
        <KikiCard>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Para terapeutas</h3>
          {therapistFAQ.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)}
        </KikiCard>

        <KikiCard>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Para cuidadores</h3>
          {caregiverFAQ.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)}
        </KikiCard>

        <KikiCard className="bg-mint-50 border border-mint-200">
          <div className="flex items-start gap-3">
            <Mail size={20} className="text-mint-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold">¿Tenés más dudas?</h3>
              <p className="text-xs text-muted-foreground mt-1">Escribinos a <span className="font-medium text-foreground">soporte.kikicare@gmail.com</span> y te respondemos en menos de 24 horas.</p>
            </div>
          </div>
        </KikiCard>
      </div>
    </div>
  );
}
