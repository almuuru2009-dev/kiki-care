import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { KikiCard } from '@/components/kiki/KikiComponents';

export default function AuthConfirmScreen() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const handleConfirm = async () => {
      try {
        // Supabase handles the token in the URL automatically. 
        // We just need to check if the session is active now.
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error confirming auth:', error);
          setStatus('error');
          return;
        }

        if (session?.user?.email_confirmed_at) {
          setStatus('success');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          // If no session or not confirmed, it might be an invalid or expired link
          setStatus('error');
        }
      } catch (err) {
        console.error('Unexpected error during auth confirmation:', err);
        setStatus('error');
      }
    };

    handleConfirm();
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-background items-center justify-center p-6 max-w-[420px] mx-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="w-full"
      >
        <KikiCard className="w-full text-center py-8 px-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center py-4">
              <Loader2 className="w-12 h-12 text-mint animate-spin mb-4" />
              <h2 className="text-xl font-bold">Verificando...</h2>
              <p className="text-sm text-muted-foreground mt-2">Estamos activando tu cuenta.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center py-4">
              <div className="w-16 h-16 rounded-full bg-mint flex items-center justify-center mb-4">
                <Check size={32} className="text-navy" />
              </div>
              <h2 className="text-xl font-bold text-mint-700">¡Email verificado!</h2>
              <p className="text-sm text-muted-foreground mt-2">Ya podés iniciar sesión en KikiCare.<br />Redirigiendo al login...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center py-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <X size={32} className="text-rust" />
              </div>
              <h2 className="text-xl font-bold text-rust">Link inválido o expirado</h2>
              <p className="text-sm text-muted-foreground mt-2">No pudimos verificar tu cuenta. Por favor, solicitá un nuevo enlace o contactá a soporte.</p>
              <button 
                onClick={() => navigate('/login')} 
                className="btn-primary mt-8 w-full py-3"
              >
                Volver al login
              </button>
            </div>
          )}
        </KikiCard>
      </motion.div>
    </div>
  );
}
