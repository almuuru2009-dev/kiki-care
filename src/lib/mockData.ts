import { format, subDays, subWeeks } from 'date-fns';
import type { User, Patient, Exercise, Session, Message, Conversation, MAAAlert, ExercisePlan, Notification, Milestone, Medal, MoodEntry } from './types';

const today = new Date();

export const users: User[] = [
  {
    id: 'kine-1',
    email: 'kine@kikicare.app',
    password: 'demo1234',
    name: 'Lic. Valeria Moreno',
    role: 'kinesiologist',
    specialty: 'Kinesiología Pediátrica',
    institution: 'Centro de Rehabilitación Infantil Buenos Aires',
    matricula: 'MN-48291',
  },
  {
    id: 'cuid-1',
    email: 'mama@kikicare.app',
    password: 'demo1234',
    name: 'Luciana Gómez',
    role: 'caregiver',
    childId: 'pat-1',
    therapistId: 'kine-1',
  },
];

export const patients: Patient[] = [
  { id: 'pat-1', name: 'Valentín Gómez', age: 6, diagnosis: 'PCI espástica bilateral', gmfcs: 3, adherence: 78, caregiverId: 'cuid-1', caregiverName: 'Luciana Gómez', therapistId: 'kine-1', avatarColor: '#7EEDC4', lastSessionDaysAgo: 1, sessionsPerWeek: 4.8, baselineFrequency: 5.2, baselineDuration: 22, avgDuration: 20, responseLatency: 3 },
  { id: 'pat-2', name: 'Sofía Berardi', age: 4, diagnosis: 'PCI espástica unilateral derecha', gmfcs: 2, adherence: 45, caregiverId: 'cuid-2', caregiverName: 'Carolina Berardi', therapistId: 'kine-1', avatarColor: '#5BA8E2', lastSessionDaysAgo: 6, sessionsPerWeek: 0, baselineFrequency: 5.2, baselineDuration: 20, avgDuration: 0, responseLatency: 48 },
  { id: 'pat-3', name: 'Mateo Fernández', age: 8, diagnosis: 'PCI discinética', gmfcs: 4, adherence: 92, caregiverId: 'cuid-3', caregiverName: 'Ana Fernández', therapistId: 'kine-1', avatarColor: '#D4971A', lastSessionDaysAgo: 0, sessionsPerWeek: 5.5, baselineFrequency: 5, baselineDuration: 25, avgDuration: 26, responseLatency: 1 },
  { id: 'pat-4', name: 'Emma Torres', age: 3, diagnosis: 'PCI espástica bilateral', gmfcs: 2, adherence: 61, caregiverId: 'cuid-4', caregiverName: 'María Torres', therapistId: 'kine-1', avatarColor: '#C84B2F', lastSessionDaysAgo: 2, sessionsPerWeek: 3.5, baselineFrequency: 5, baselineDuration: 18, avgDuration: 14, responseLatency: 12 },
  { id: 'pat-5', name: 'Lucas Pereira', age: 10, diagnosis: 'PCI espástica unilateral izquierda', gmfcs: 1, adherence: 88, caregiverId: 'cuid-5', caregiverName: 'Laura Pereira', therapistId: 'kine-1', avatarColor: '#4DC9A0', lastSessionDaysAgo: 0, sessionsPerWeek: 5, baselineFrequency: 5, baselineDuration: 22, avgDuration: 23, responseLatency: 2 },
  { id: 'pat-6', name: 'Mía Ruiz', age: 5, diagnosis: 'PCI atáxica', gmfcs: 3, adherence: 30, caregiverId: 'cuid-6', caregiverName: 'Daniela Ruiz', therapistId: 'kine-1', avatarColor: '#8AAFC8', lastSessionDaysAgo: 3, sessionsPerWeek: 1.5, baselineFrequency: 5, baselineDuration: 22, avgDuration: 8, responseLatency: 36 },
  { id: 'pat-7', name: 'Tomás Castro', age: 7, diagnosis: 'PCI espástica bilateral', gmfcs: 3, adherence: 70, caregiverId: 'cuid-7', caregiverName: 'Soledad Castro', therapistId: 'kine-1', avatarColor: '#2076BE', lastSessionDaysAgo: 1, sessionsPerWeek: 4, baselineFrequency: 5, baselineDuration: 20, avgDuration: 19, responseLatency: 5 },
  { id: 'pat-8', name: 'Isabella Díaz', age: 9, diagnosis: 'PCI espástica unilateral derecha', gmfcs: 2, adherence: 55, caregiverId: 'cuid-8', caregiverName: 'Florencia Díaz', therapistId: 'kine-1', avatarColor: '#C5D5E8', lastSessionDaysAgo: 3, sessionsPerWeek: 3, baselineFrequency: 5, baselineDuration: 20, avgDuration: 16, responseLatency: 18 },
];

export const exercises: Exercise[] = [
  { id: 'ex-1', name: 'Estiramiento de isquiotibiales en supino', targetArea: 'Miembro inferior', duration: 5, sets: 3, reps: '30s', difficulty: 'Fácil', thumbnailColor: '#7EEDC4', description: 'Elongación pasiva de isquiotibiales con el niño en posición supina.', videoDescription: 'Acostate boca arriba con Valentín. Tomá su pierna con ambas manos. Doblá la rodilla suavemente hacia el pecho y sostené 30 segundos. Repetir 3 veces de cada lado.', contraindications: 'Evitar en presencia de dolor agudo articular.', gmfcsLevels: [1,2,3,4] },
  { id: 'ex-2', name: 'Activación de tronco en sedestación', targetArea: 'Tronco', duration: 8, sets: 4, reps: '10 reps', difficulty: 'Medio', thumbnailColor: '#3B8FD0', description: 'Trabajo de control de tronco en posición sentada con desestabilizaciones suaves.', videoDescription: 'Sentá a Valentín en una superficie firme. Colocate detrás de él. Empujá suavemente desde los hombros en diferentes direcciones. Él debe intentar mantenerse derecho.', contraindications: 'No realizar sin supervisión si no logra sedestación independiente.', gmfcsLevels: [2,3,4] },
  { id: 'ex-3', name: 'Marcha en paralelas con apoyo', targetArea: 'Miembro inferior', duration: 10, sets: 3, reps: '5m', difficulty: 'Difícil', thumbnailColor: '#D4971A', description: 'Práctica de marcha asistida entre barras paralelas o con apoyo lateral.', videoDescription: 'Colocá a Valentín de pie entre dos sillas estables. Ayudalo a caminar apoyándose en ellas. Recorrer 5 metros ida y vuelta. Descansar entre series.', contraindications: 'Suspender si hay fatiga excesiva o dolor en miembros inferiores.', gmfcsLevels: [1,2,3] },
  { id: 'ex-4', name: 'Disociación de cinturas en suelo', targetArea: 'Tronco', duration: 6, sets: 3, reps: '8 reps', difficulty: 'Medio', thumbnailColor: '#4DC9A0', description: 'Trabajo de disociación entre cintura escapular y pélvica en decúbito.', videoDescription: 'Acostate en el suelo con Valentín boca arriba. Tomá sus rodillas juntas y giralas suavemente hacia un lado mientras los hombros quedan apoyados. Alternar lados.', contraindications: 'Cuidado con rotaciones forzadas de columna.', gmfcsLevels: [2,3,4,5] },
  { id: 'ex-5', name: 'Elongación de gastrocnemios con cuña', targetArea: 'Miembro inferior', duration: 5, sets: 3, reps: '45s', difficulty: 'Fácil', thumbnailColor: '#9DF5D6', description: 'Estiramiento de músculos de la pantorrilla usando una cuña o toalla enrollada.', videoDescription: 'Poné una toalla enrollada en el piso. Que Valentín apoye la punta de los pies sobre ella con los talones en el suelo. Sostener 45 segundos. Descansar y repetir.', contraindications: 'No forzar si hay espasticidad severa del tríceps sural.', gmfcsLevels: [1,2,3] },
  { id: 'ex-6', name: 'Control cefálico en prono sobre rodillo', targetArea: 'Cuello/Tronco', duration: 8, sets: 4, reps: '2min', difficulty: 'Medio', thumbnailColor: '#5BA8E2', description: 'Trabajo de control cefálico con el niño en posición prona sobre un rodillo terapéutico.', videoDescription: 'Colocá un rodillo o almohada cilíndrica debajo del pecho de Valentín. Boca abajo, mostrále un juguete adelante para que levante la cabeza. Mantener 2 minutos.', contraindications: 'Supervisar permanentemente. No dejar solo en esta posición.', gmfcsLevels: [3,4,5] },
  { id: 'ex-7', name: 'Transición supino–sedente con apoyo lateral', targetArea: 'Tronco', duration: 7, sets: 3, reps: '5 reps', difficulty: 'Difícil', thumbnailColor: '#C84B2F', description: 'Práctica de transición de acostado a sentado con asistencia lateral.', videoDescription: 'Acostate al lado de Valentín. Tomalo de la mano y guiá el movimiento de rotar hacia un costado y sentarse. Que él haga la mayor parte del esfuerzo posible.', contraindications: 'Evitar tirones bruscos. Respetar el ritmo del niño.', gmfcsLevels: [2,3,4] },
  { id: 'ex-8', name: 'Fortalecimiento de glúteos en bipedestación', targetArea: 'Miembro inferior', duration: 6, sets: 3, reps: '10 reps', difficulty: 'Medio', thumbnailColor: '#D4971A', description: 'Ejercicio de fortalecimiento de glúteos de pie con apoyo anterior.', videoDescription: 'Poné a Valentín de pie apoyado en una mesa baja. Pedile que levante una pierna hacia atrás, manteniendo la rodilla estirada. 10 veces cada pierna.', contraindications: 'Asegurar estabilidad del apoyo. No realizar si hay dolor lumbar.', gmfcsLevels: [1,2,3] },
  { id: 'ex-9', name: 'Equilibrio en sedestación sin apoyo de brazos', targetArea: 'Tronco', duration: 5, sets: 4, reps: '30s', difficulty: 'Medio', thumbnailColor: '#8AAFC8', description: 'Trabajo de equilibrio sentado sin usar las manos como apoyo.', videoDescription: 'Sentá a Valentín en un banquito bajo. Dále un juguete que necesite las dos manos. Que se mantenga sentado sin apoyar las manos. Sostener 30 segundos.', contraindications: 'Tener almohadones alrededor por seguridad.', gmfcsLevels: [2,3] },
  { id: 'ex-10', name: 'Patrón cruzado en cuadrupedia', targetArea: 'Tronco/MMSS', duration: 8, sets: 3, reps: '10 reps', difficulty: 'Difícil', thumbnailColor: '#2076BE', description: 'Ejercicio de coordinación en posición de cuatro puntos con patrón cruzado.', videoDescription: 'Poné a Valentín en cuatro puntos (manos y rodillas). Que levante un brazo y la pierna contraria al mismo tiempo. Alternar. Ayudalo si es necesario.', contraindications: 'No forzar si no logra mantener la posición de cuadrupedia.', gmfcsLevels: [1,2,3] },
  { id: 'ex-11', name: 'Extensión activa de rodilla en sedente', targetArea: 'Miembro inferior', duration: 5, sets: 3, reps: '12 reps', difficulty: 'Fácil', thumbnailColor: '#CCFBEA', description: 'Extensión activa de rodilla sentado en una silla alta para trabajar cuádriceps.', videoDescription: 'Sentá a Valentín en una silla donde los pies no toquen el piso. Pedile que estire una rodilla, mantenga 3 segundos y baje. 12 veces cada pierna.', contraindications: 'No usar peso adicional sin indicación profesional.', gmfcsLevels: [1,2,3,4] },
  { id: 'ex-12', name: 'Relajación miofascial de aductores', targetArea: 'Miembro inferior', duration: 6, sets: 2, reps: '60s', difficulty: 'Fácil', thumbnailColor: '#E8F0F7', description: 'Técnica de relajación miofascial para la musculatura aductora de cadera.', videoDescription: 'Acostate con Valentín boca arriba. Con la pelota blanda, hacé presión suave y circular en la parte interna del muslo. 60 segundos de cada lado. Preguntale si le duele.', contraindications: 'Evitar presión directa sobre hueso. Suspender ante dolor.', gmfcsLevels: [1,2,3,4,5] },
];

// Generate sessions for last 30 days for Valentín
function generateSessions(): Session[] {
  const sessions: Session[] = [];
  let id = 1;
  const timeSlots: Array<'morning' | 'afternoon' | 'evening'> = ['morning', 'afternoon', 'evening'];
  for (let i = 29; i >= 0; i--) {
    const date = subDays(today, i);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) continue;
    if (dayOfWeek === 6 && Math.random() > 0.4) continue;
    if (Math.random() > 0.75) continue;

    sessions.push({
      id: `sess-${id++}`,
      patientId: 'pat-1',
      date: format(date, 'yyyy-MM-dd'),
      exercisesCompleted: Math.random() > 0.2 ? 3 : 2,
      totalExercises: 3,
      durationMinutes: Math.floor(18 + Math.random() * 10),
      difficulty: Math.floor(1 + Math.random() * 5),
      note: i < 5 ? ['Valentín estuvo cansado hoy', 'Muy bien, cooperó mucho', 'Le dolía un poco la rodilla', ''][Math.floor(Math.random() * 4)] || undefined : undefined,
      mood: Math.floor(2 + Math.random() * 4),
      painReported: Math.random() > 0.8,
      timeOfDay: timeSlots[Math.floor(Math.random() * 3)],
    });
  }
  return sessions;
}

export const sessions: Session[] = generateSessions();

export const conversations: Conversation[] = [
  { id: 'conv-1', participants: ['kine-1', 'cuid-1'], patientId: 'pat-1', patientName: 'Valentín', caregiverName: 'Luciana Gómez', lastMessage: 'Perfecto, seguimos con el mismo plan', lastMessageTime: format(subDays(today, 0), "HH:mm"), unreadCount: 1 },
  { id: 'conv-2', participants: ['kine-1', 'cuid-2'], patientId: 'pat-2', patientName: 'Sofía', caregiverName: 'Carolina Berardi', lastMessage: 'Hola Carolina, ¿cómo están?', lastMessageTime: format(subDays(today, 2), "HH:mm"), unreadCount: 0 },
  { id: 'conv-3', participants: ['kine-1', 'cuid-3'], patientId: 'pat-3', patientName: 'Mateo', caregiverName: 'Ana Fernández', lastMessage: '¡Excelente progreso esta semana!', lastMessageTime: format(subDays(today, 1), "HH:mm"), unreadCount: 2 },
];

export const messages: Message[] = [
  { id: 'm-1', conversationId: 'conv-1', senderId: 'kine-1', text: 'Hola Luciana, ¿cómo estuvo la sesión de ayer con Valentín?', timestamp: format(subDays(today, 5), "yyyy-MM-dd'T'10:30:00"), isRead: true },
  { id: 'm-2', conversationId: 'conv-1', senderId: 'cuid-1', text: 'Hola Valeria! Bien, pero le costó bastante el estiramiento de isquiotibiales. Se quejó un poco.', timestamp: format(subDays(today, 5), "yyyy-MM-dd'T'11:15:00"), isRead: true },
  { id: 'm-3', conversationId: 'conv-1', senderId: 'kine-1', text: 'Puede ser que esté más tenso. Probá hacerlo más despacio, con 20 segundos en vez de 30. Si sigue molestando me avisás.', timestamp: format(subDays(today, 5), "yyyy-MM-dd'T'11:45:00"), isRead: true },
  { id: 'm-4', conversationId: 'conv-1', senderId: 'cuid-1', text: 'Dale, voy a probar así. ¿Puedo reemplazarlo por otro ejercicio si no mejora?', timestamp: format(subDays(today, 4), "yyyy-MM-dd'T'09:20:00"), isRead: true },
  { id: 'm-5', conversationId: 'conv-1', senderId: 'kine-1', text: 'Sí, en ese caso hacé la relajación miofascial de aductores en su lugar. Es más suave y trabaja la misma zona.', timestamp: format(subDays(today, 4), "yyyy-MM-dd'T'10:00:00"), isRead: true },
  { id: 'm-6', conversationId: 'conv-1', senderId: 'cuid-1', text: 'Perfecto! Ayer hice esa y estuvo mucho mejor. Valentín hasta se divirtió con la pelotita 😄', timestamp: format(subDays(today, 2), "yyyy-MM-dd'T'16:30:00"), isRead: true },
  { id: 'm-7', conversationId: 'conv-1', senderId: 'kine-1', text: '¡Qué bueno! Vamos a mantener ese cambio en el plan entonces. El miércoles lo vemos en consultorio.', timestamp: format(subDays(today, 1), "yyyy-MM-dd'T'09:00:00"), isRead: true },
  { id: 'm-8', conversationId: 'conv-1', senderId: 'cuid-1', text: 'Genial, ahí vamos. ¿A las 10 como siempre?', timestamp: format(subDays(today, 1), "yyyy-MM-dd'T'09:30:00"), isRead: true },
  { id: 'm-9', conversationId: 'conv-1', senderId: 'kine-1', text: 'Sí, a las 10. Perfecto, seguimos con el mismo plan', timestamp: format(subDays(today, 0), "yyyy-MM-dd'T'08:15:00"), isRead: false },
];

export const maaAlerts: MAAAlert[] = [
  { id: 'alert-1', patientId: 'pat-2', patientName: 'Sofía Berardi', patientAge: 4, riskLevel: 'ALTO', riskScore: 82, triggerReason: '5 días sin registrar sesión. Frecuencia cayó de 5,2 a 0 sesiones/semana. Última actividad: hace 6 días.', suggestedAction: 'Contactar a la familia urgente. Evaluar barreras y considerar simplificar el plan.', alertType: 'Sin actividad', detectedAt: format(subDays(today, 2), 'yyyy-MM-dd'), isActive: true, detectedDaysBefore: 8 },
  { id: 'alert-2', patientId: 'pat-6', patientName: 'Mía Ruiz', patientAge: 5, riskLevel: 'ALTO', riskScore: 75, triggerReason: 'Patrón de registro irregular. Sesiones acortadas (promedio 8min vs 22min normal). Riesgo de abandono progresivo.', suggestedAction: 'Revisar la dificultad del plan actual. Enviar mensaje motivacional.', alertType: 'Patrón irregular', detectedAt: format(subDays(today, 1), 'yyyy-MM-dd'), isActive: true, detectedDaysBefore: 7 },
  { id: 'alert-3', patientId: 'pat-4', patientName: 'Emma Torres', patientAge: 3, riskLevel: 'MODERADO', riskScore: 52, triggerReason: 'Reducción de adherencia del 72% al 61% en últimas 2 semanas. Cambio de horario detectado.', suggestedAction: 'Monitorear la próxima semana. Preguntar si hay cambios en la rutina familiar.', alertType: 'Adherencia en caída', detectedAt: format(subDays(today, 3), 'yyyy-MM-dd'), isActive: true, detectedDaysBefore: 10 },
];

export const exercisePlans: ExercisePlan[] = [
  { id: 'plan-1', patientId: 'pat-1', name: 'Plan Semana 8 — Fortalecimiento miembro inferior', startDate: format(subWeeks(today, 8), 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd'), frequency: 5, exercises: ['ex-1', 'ex-2', 'ex-3'], isActive: true },
];

export const notifications: Notification[] = [
  { id: 'not-1', type: 'alert', title: 'Alerta KAE — Sofía Berardi', description: '5 días sin actividad registrada', timestamp: format(subDays(today, 0), "yyyy-MM-dd'T'08:00:00"), isRead: false, link: '/kine/alerts', color: '#C84B2F' },
  { id: 'not-2', type: 'session', title: 'Sesión completada', description: 'Luciana completó la sesión de Valentín', timestamp: format(subDays(today, 0), "yyyy-MM-dd'T'07:30:00"), isRead: false, link: '/kine/patients/pat-1', color: '#7EEDC4' },
  { id: 'not-3', type: 'message', title: 'Nuevo mensaje', description: 'Luciana Gómez te envió un mensaje', timestamp: format(subDays(today, 1), "yyyy-MM-dd'T'09:30:00"), isRead: true, link: '/kine/messages/conv-1', color: '#3B8FD0' },
  { id: 'not-4', type: 'milestone', title: 'Logro desbloqueado', description: 'Valentín completó 20 sesiones', timestamp: format(subDays(today, 3), "yyyy-MM-dd'T'14:00:00"), isRead: true, link: '/cuidadora/child', color: '#D4971A' },
  { id: 'not-5', type: 'alert', title: 'Alerta KAE — Mía Ruiz', description: 'Patrón de registro irregular detectado', timestamp: format(subDays(today, 1), "yyyy-MM-dd'T'10:00:00"), isRead: false, link: '/kine/alerts', color: '#C84B2F' },
];

export const milestones: Milestone[] = [
  { id: 'ms-1', patientId: 'pat-1', title: 'Primera semana completada', date: format(subWeeks(today, 8), 'yyyy-MM-dd'), achieved: true },
  { id: 'ms-2', patientId: 'pat-1', title: '5 días seguidos', date: format(subWeeks(today, 3), 'yyyy-MM-dd'), achieved: true },
  { id: 'ms-3', patientId: 'pat-1', title: '20 sesiones completadas', date: format(subWeeks(today, 1), 'yyyy-MM-dd'), achieved: true },
  { id: 'ms-4', patientId: 'pat-1', title: '30 sesiones completadas', achieved: false },
];

export const medals: Medal[] = [
  // Earned
  { id: 'med-1', patientId: 'pat-1', title: 'Primer Paso', description: '¡Completaste tu primera sesión!', icon: '🐣', category: 'milestone', earnedDate: format(subWeeks(today, 8), 'yyyy-MM-dd'), earned: true, requirement: 'Completar 1 sesión' },
  { id: 'med-2', patientId: 'pat-1', title: 'Guerrero de 3', description: '3 días seguidos sin parar', icon: '🔥', category: 'streak', earnedDate: format(subWeeks(today, 5), 'yyyy-MM-dd'), earned: true, requirement: '3 días consecutivos' },
  { id: 'med-3', patientId: 'pat-1', title: 'Semana Perfecta', description: '¡5 sesiones en una semana!', icon: '⭐', category: 'consistency', earnedDate: format(subWeeks(today, 4), 'yyyy-MM-dd'), earned: true, requirement: '5 sesiones en 1 semana' },
  { id: 'med-4', patientId: 'pat-1', title: 'Héroe de la Constancia', description: '¡10 sesiones completadas!', icon: '🏅', category: 'milestone', earnedDate: format(subWeeks(today, 4), 'yyyy-MM-dd'), earned: true, requirement: 'Completar 10 sesiones' },
  { id: 'med-5', patientId: 'pat-1', title: 'Racha Imparable', description: '5 días seguidos de ejercicios', icon: '💪', category: 'streak', earnedDate: format(subWeeks(today, 3), 'yyyy-MM-dd'), earned: true, requirement: '5 días consecutivos' },
  { id: 'med-6', patientId: 'pat-1', title: 'Campeón de 20', description: '¡20 sesiones y contando!', icon: '🏆', category: 'milestone', earnedDate: format(subWeeks(today, 1), 'yyyy-MM-dd'), earned: true, requirement: 'Completar 20 sesiones' },
  { id: 'med-7', patientId: 'pat-1', title: 'Buena Onda', description: 'Sesión con ánimo excelente', icon: '😄', category: 'effort', earnedDate: format(subDays(today, 5), 'yyyy-MM-dd'), earned: true, requirement: 'Reportar ánimo 5/5 en una sesión' },
  // In progress
  { id: 'med-8', patientId: 'pat-1', title: 'Racha de Fuego', description: '7 días seguidos sin parar', icon: '🌟', category: 'streak', earned: false, progress: 43, requirement: '7 días consecutivos' },
  { id: 'med-9', patientId: 'pat-1', title: 'Leyenda de 30', description: '30 sesiones completadas', icon: '👑', category: 'milestone', earned: false, progress: 73, requirement: 'Completar 30 sesiones' },
  { id: 'med-10', patientId: 'pat-1', title: 'Sin Dolor', description: '2 semanas sin reportar dolor', icon: '💚', category: 'effort', earned: false, progress: 60, requirement: '14 sesiones sin dolor reportado' },
  { id: 'med-11', patientId: 'pat-1', title: 'Madrugador', description: '5 sesiones antes de las 10am', icon: '🌅', category: 'special', earned: false, progress: 40, requirement: '5 sesiones por la mañana' },
  { id: 'med-12', patientId: 'pat-1', title: 'Comunicador', description: 'Enviar 5 notas al kinesiólogo', icon: '💬', category: 'special', earned: false, progress: 80, requirement: 'Escribir notas en 5 sesiones' },
];

export const moodEntries: MoodEntry[] = [
  { id: 'mood-1', patientId: 'pat-1', date: format(subDays(today, 6), 'yyyy-MM-dd'), childMood: 4, caregiverEnergy: 3, painLevel: 0, cooperationLevel: 4 },
  { id: 'mood-2', patientId: 'pat-1', date: format(subDays(today, 5), 'yyyy-MM-dd'), childMood: 3, caregiverEnergy: 2, painLevel: 1, cooperationLevel: 3, notes: 'Día complicado' },
  { id: 'mood-3', patientId: 'pat-1', date: format(subDays(today, 4), 'yyyy-MM-dd'), childMood: 5, caregiverEnergy: 4, painLevel: 0, cooperationLevel: 5 },
  { id: 'mood-4', patientId: 'pat-1', date: format(subDays(today, 3), 'yyyy-MM-dd'), childMood: 4, caregiverEnergy: 4, painLevel: 0, cooperationLevel: 4 },
  { id: 'mood-5', patientId: 'pat-1', date: format(subDays(today, 2), 'yyyy-MM-dd'), childMood: 2, caregiverEnergy: 2, painLevel: 2, cooperationLevel: 2, notes: 'Le dolía la rodilla' },
  { id: 'mood-6', patientId: 'pat-1', date: format(subDays(today, 1), 'yyyy-MM-dd'), childMood: 4, caregiverEnergy: 3, painLevel: 0, cooperationLevel: 4 },
];

// Weekly adherence data for charts
export const weeklyAdherence = [
  { week: 'Sem 1', adherence: 65 },
  { week: 'Sem 2', adherence: 72 },
  { week: 'Sem 3', adherence: 68 },
  { week: 'Sem 4', adherence: 80 },
  { week: 'Sem 5', adherence: 75 },
  { week: 'Sem 6', adherence: 78 },
];

export const dailySessions = [
  { day: 'Lun', sessions: 7 },
  { day: 'Mar', sessions: 6 },
  { day: 'Mié', sessions: 8 },
  { day: 'Jue', sessions: 5 },
  { day: 'Vie', sessions: 7 },
  { day: 'Sáb', sessions: 3 },
  { day: 'Dom', sessions: 1 },
];
