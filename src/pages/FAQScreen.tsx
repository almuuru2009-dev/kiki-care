import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { KikiCard } from '@/components/kiki/KikiComponents';

const therapistFAQ = [
  {
    q: '¿Cómo verifica KikiCare mi licencia?',
    a: 'Al registrarte como kinesiólogo, ingresás tu número de matrícula profesional. Nuestro equipo verifica esta información contra los registros oficiales del Colegio de Kinesiólogos de tu jurisdicción. El proceso puede tomar hasta 48 horas hábiles. Mientras tanto, podés explorar la plataforma en modo demo.',
  },
  {
    q: '¿Qué sucede si una familia no registra sus sesiones?',
    a: 'El Motor de Adherencia Adaptativa (MAA) detecta automáticamente la inactividad. Si una familia no registra sesiones durante 3 o más días, el sistema genera una alerta en tu panel con el nivel de riesgo y una acción sugerida. Podés contactar a la familia directamente desde la alerta.',
  },
  {
    q: '¿Cómo funciona la alerta de abandono? ¿Cuándo se activa?',
    a: 'El MAA analiza múltiples señales: frecuencia de sesiones, duración promedio, horarios de actividad, estado de ánimo del niño y latencia de respuesta. Cuando detecta un cambio significativo respecto al patrón habitual, genera una alerta con nivel BAJO, MODERADO o ALTO. Las alertas ALTO se activan ante caídas abruptas de frecuencia o más de 5 días de inactividad.',
  },
  {
    q: '¿Puedo tener más de un cuidador por paciente?',
    a: 'Actualmente cada paciente tiene un cuidador principal asignado. Estamos trabajando en permitir múltiples cuidadores (por ejemplo, madre y padre) para que ambos puedan registrar sesiones y recibir notificaciones. Esta función estará disponible próximamente.',
  },
  {
    q: '¿Puedo exportar los datos de adherencia de mis pacientes?',
    a: 'Sí. Desde el perfil de cada paciente, en la pestaña "Resumen", podés generar un pre-informe con todos los datos de adherencia, dificultad promedio, notas de la cuidadora y estado MAA. Próximamente agregaremos exportación en formato PDF para presentar en instituciones o informes clínicos.',
  },
  {
    q: '¿Qué sucede con mis datos si dejo de usar KikiCare?',
    a: 'Tus datos personales y los de tus pacientes se mantienen almacenados de forma segura durante 12 meses después de tu última actividad. Podés solicitar la eliminación completa de tus datos en cualquier momento desde Configuración > Mi cuenta o contactando a soporte@kikicare.app.',
  },
  {
    q: '¿Cumple KikiCare con la Ley de Protección de Datos Personales de Argentina (Ley 25.326)?',
    a: 'Sí. KikiCare cumple plenamente con la Ley 25.326 de Protección de Datos Personales. Todos los datos de salud se almacenan de forma encriptada, se procesan exclusivamente para los fines declarados, y los usuarios pueden ejercer sus derechos de acceso, rectificación y supresión en cualquier momento. Además, cumplimos con los estándares de la Disposición 11/2006 de la AAIP.',
  },
];

const caregiverFAQ = [
  {
    q: '¿Qué hago si no entiendo alguno de los ejercicios?',
    a: 'Cada ejercicio incluye instrucciones paso a paso escritas en lenguaje simple, sin términos médicos complicados. Si aún así tenés dudas, podés enviarle un mensaje directamente a tu kinesiólogo desde la app. También podés revisar el video de referencia cuando esté disponible.',
  },
  {
    q: '¿Qué hago si mi hijo se niega a realizar los ejercicios?',
    a: 'Es completamente normal que algunos días sean más difíciles. Cada ejercicio tiene una variante "para días difíciles" que podés activar durante la sesión. Además, al registrar la sesión podés indicar el ánimo de tu hijo — esta información le ayuda al kinesiólogo a ajustar el plan. No te preocupes por los días complicados, lo importante es la constancia a largo plazo.',
  },
  {
    q: '¿Puede mi terapeuta ver todo lo que escribo en la aplicación?',
    a: 'Tu terapeuta puede ver los registros de sesión (ejercicios completados, duración, dificultad), las notas que escribís voluntariamente en cada sesión, y los mensajes del chat. El registro de ánimo y las respuestas emocionales son compartidos como datos generales para ayudar al seguimiento, pero siempre con tu conocimiento.',
  },
  {
    q: '¿Qué sucede si me salto algunos días?',
    a: 'No pasa nada grave. La app registra los días de actividad y los días sin sesión. Si hay varios días sin actividad, tu kinesiólogo puede recibir una notificación para acompañarte mejor. Lo más importante es retomar cuando puedas — cada sesión cuenta, no importa si hubo una pausa.',
  },
  {
    q: 'Mi terapeuta no está en KikiCare, ¿aun así puedo utilizar la aplicación?',
    a: 'Por el momento, KikiCare funciona con un kinesiólogo asignado que crea y supervisa el plan de ejercicios. Si tu terapeuta no usa la app, podés invitarlo a registrarse. Estamos trabajando en un modo independiente para que las familias puedan usar la app con planes predefinidos.',
  },
  {
    q: '¿Está segura la información de salud de mi hijo?',
    a: 'Sí. Toda la información médica se almacena de forma encriptada y solo es accesible por vos y el kinesiólogo asignado. KikiCare cumple con la Ley 25.326 de Protección de Datos Personales de Argentina. Nunca compartimos datos con terceros ni los usamos con fines comerciales.',
  },
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
    <div className="mobile-frame flex flex-col min-h-screen bg-background">
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
      </div>
    </div>
  );
}
