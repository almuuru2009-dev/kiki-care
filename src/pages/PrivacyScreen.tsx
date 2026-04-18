import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { KikiCard } from '@/components/kiki/KikiComponents';

export default function PrivacyScreen() {
  const navigate = useNavigate();

  return (
    <div className="mobile-frame flex flex-col min-h-screen bg-background">
      <div className="px-4 pt-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold">Política de privacidad</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        <KikiCard className="space-y-4 text-sm text-foreground leading-relaxed">
          <p className="text-xs text-muted-foreground">Última actualización: 15 de marzo de 2025</p>

          <h2 className="font-semibold text-base">1. Información que Recopilamos</h2>
          <p><span className="font-medium">Datos personales:</span> Nombre, email, matrícula profesional (kinesiólogos), datos del niño (nombre, edad, diagnóstico, nivel GMFCS).</p>
          <p><span className="font-medium">Datos de uso:</span> Registro de sesiones, duración, dificultad reportada, notas del cuidador, ánimo del niño, horarios de actividad.</p>
          <p><span className="font-medium">Datos de comunicación:</span> Mensajes entre kinesiólogo y cuidador dentro de la App.</p>

          <h2 className="font-semibold text-base">2. Cómo Utilizamos la Información</h2>
          <p>Utilizamos los datos exclusivamente para: facilitar el seguimiento terapéutico entre profesional y familia, generar alertas de adherencia (KAE), producir reportes e informes de progreso, mejorar la calidad del servicio.</p>

          <h2 className="font-semibold text-base">3. Base Legal</h2>
          <p>El tratamiento de datos se realiza conforme a la Ley 25.326 de Protección de Datos Personales y su Decreto Reglamentario 1558/2001. Los datos sensibles de salud se tratan bajo consentimiento expreso del titular o su representante legal.</p>

          <h2 className="font-semibold text-base">4. Almacenamiento y Seguridad</h2>
          <p>Los datos se almacenan en servidores seguros con encriptación AES-256 en reposo y TLS 1.3 en tránsito. Implementamos controles de acceso basados en roles, auditoría de accesos, y respaldos automáticos diarios.</p>

          <h2 className="font-semibold text-base">5. Compartir Información</h2>
          <p>No vendemos ni compartimos datos personales con terceros. La información del paciente solo es accesible por: el cuidador registrado, el kinesiólogo asignado, y el equipo técnico de KikiCare (para soporte, con acceso limitado y auditado).</p>

          <h2 className="font-semibold text-base">6. Derechos del Usuario</h2>
          <p>Conforme a la Ley 25.326, tenés derecho a: acceder a tus datos personales, solicitar rectificación de datos incorrectos, solicitar la supresión de tus datos, oponerte al tratamiento de tus datos. Para ejercer estos derechos, escribí a privacidad@kikicare.app.</p>

          <h2 className="font-semibold text-base">7. Datos de Menores</h2>
          <p>Los datos de los niños son ingresados y gestionados exclusivamente por sus cuidadores legales. KikiCare no recopila datos directamente de menores.</p>

          <h2 className="font-semibold text-base">8. Kiki Adherence Engine (KAE)</h2>
          <p>El KAE procesa datos de uso (frecuencia, duración, horarios, ánimo) de forma automatizada para generar alertas de riesgo de abandono. Este procesamiento tiene fines exclusivamente terapéuticos y los resultados son orientativos.</p>

          <h2 className="font-semibold text-base">9. Retención de Datos</h2>
          <p>Los datos se conservan mientras la cuenta esté activa y durante 12 meses posteriores a la última actividad. Pasado este plazo, los datos se eliminan de forma irreversible salvo obligación legal que requiera su conservación.</p>

          <h2 className="font-semibold text-base">10. Contacto</h2>
          <p>Responsable de tratamiento: KikiCare. Dirección de contacto: privacidad@kikicare.app. Autoridad de control: Agencia de Acceso a la Información Pública (AAIP).</p>
        </KikiCard>
      </div>
    </div>
  );
}
