import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { KikiCard } from '@/components/kiki/KikiComponents';

export default function TermsScreen() {
  const navigate = useNavigate();

  return (
    <div className="mobile-frame flex flex-col min-h-screen bg-background">
      <div className="px-4 pt-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold">Términos y condiciones</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        <KikiCard className="space-y-4 text-sm text-foreground leading-relaxed">
          <p className="text-xs text-muted-foreground">Última actualización: 15 de marzo de 2025</p>

          <h2 className="font-semibold text-base">1. Aceptación de los Términos</h2>
          <p>Al acceder y utilizar la aplicación KikiCare ("la App"), aceptás estos Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguna parte, no debés utilizar la App.</p>

          <h2 className="font-semibold text-base">2. Descripción del Servicio</h2>
          <p>KikiCare es una plataforma tecnológica que facilita la comunicación entre kinesiólogos y cuidadores de niños con parálisis cerebral infantil (PCI) para el seguimiento de planes de rehabilitación domiciliaria. La App no reemplaza la consulta médica profesional.</p>

          <h2 className="font-semibold text-base">3. Registro y Cuentas</h2>
          <p>Para utilizar la App debés registrarte proporcionando información veraz y actualizada. Sos responsable de mantener la confidencialidad de tus credenciales de acceso. Los kinesiólogos deben proporcionar su matrícula profesional vigente.</p>

          <h2 className="font-semibold text-base">4. Uso Aceptable</h2>
          <p>Te comprometés a utilizar la App exclusivamente para fines relacionados con la rehabilitación y seguimiento terapéutico. Queda prohibido: compartir información de pacientes con terceros no autorizados, usar la App con fines comerciales no autorizados, intentar vulnerar la seguridad del sistema.</p>

          <h2 className="font-semibold text-base">5. Datos de Salud</h2>
          <p>La información de salud ingresada en la App es considerada dato sensible según la Ley 25.326. KikiCare implementa medidas de seguridad para proteger esta información conforme a la normativa vigente.</p>

          <h2 className="font-semibold text-base">6. Propiedad Intelectual</h2>
          <p>Los ejercicios creados por los kinesiólogos dentro de la App son propiedad intelectual de sus autores. KikiCare posee los derechos sobre la plataforma, diseño, y contenido editorial propio.</p>

          <h2 className="font-semibold text-base">7. Limitación de Responsabilidad</h2>
          <p>KikiCare no es responsable por: diagnósticos médicos, decisiones terapéuticas tomadas en base a la información de la App, lesiones derivadas de la ejecución incorrecta de ejercicios, interrupciones del servicio por causas ajenas.</p>

          <h2 className="font-semibold text-base">8. Kiki Adherence Engine (KAE)</h2>
          <p>El KAE es una herramienta de apoyo que genera alertas basadas en patrones de uso. Las alertas son orientativas y no constituyen un diagnóstico ni reemplazan el juicio clínico del profesional.</p>

          <h2 className="font-semibold text-base">9. Cancelación</h2>
          <p>Podés cancelar tu cuenta en cualquier momento desde la configuración de la App. La cancelación implica la pérdida de acceso a los datos después de 12 meses de inactividad.</p>

          <h2 className="font-semibold text-base">10. Modificaciones</h2>
          <p>KikiCare se reserva el derecho de modificar estos términos. Los cambios serán notificados a través de la App con al menos 15 días de anticipación.</p>

          <h2 className="font-semibold text-base">11. Jurisdicción</h2>
          <p>Estos términos se rigen por las leyes de la República Argentina. Cualquier controversia será resuelta por los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.</p>

          <p className="text-xs text-muted-foreground pt-2">Para consultas: legal@kikicare.app</p>
        </KikiCard>
      </div>
    </div>
  );
}
