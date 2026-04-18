import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hash, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { KikiCard } from '@/components/kiki/KikiComponents';

export default function JoinScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // If code is in URL, we could auto-trigger, but better let user click
  }, []);

  const handleConnect = async () => {
    if (!code.trim()) {
      toast.error('Ingresá un código');
      return;
    }

    setLoading(true);
    try {
      // 1. Buscar invitación
      const { data: invite, error: inviteErr } = await supabase
        .from('invitations')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .single();

      if (inviteErr || !invite) {
        toast.error('Código inválido');
        setLoading(false);
        return;
      }

      if (invite.status === 'accepted') {
        toast.error('Este código ya fue utilizado');
        setLoading(false);
        return;
      }

      if (invite.status === 'expired' || new Date(invite.expires_at) < new Date()) {
        if (invite.status !== 'expired') {
          await supabase.from('invitations').update({ status: 'expired' }).eq('id', invite.id);
        }
        toast.error('El código ha expirado');
        setLoading(false);
        return;
      }

      // 2. Crear vínculo
      const { error: linkErr } = await supabase.from('therapist_caregiver_links').insert({
        therapist_id: invite.kinesio_id,
        caregiver_id: user!.id,
        caregiver_email: user!.email!,
        status: 'active',
        responded_at: new Date().toISOString(),
      });

      if (linkErr) {
        if (linkErr.message.includes('unique')) {
          toast.error('Ya tenés un vínculo activo con este profesional');
        } else {
          throw linkErr;
        }
        setLoading(false);
        return;
      }

      // 3. Actualizar invitación
      await supabase.from('invitations').update({
        status: 'accepted',
        accepted_by: user!.id
      }).eq('id', invite.id);

      setSuccess(true);
      toast.success('¡Vinculación exitosa!');
      setTimeout(() => navigate('/cuidadora/home'), 2000);

    } catch (err: any) {
      console.error('Error joining:', err);
      toast.error('Error al procesar la vinculación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-[420px] mx-auto p-6 items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
        <KikiCard className="w-full p-8 text-center shadow-kiki-lg">
          {success ? (
            <div className="py-4">
              <div className="w-20 h-20 rounded-full bg-mint-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={40} className="text-mint-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">¡Conectado!</h2>
              <p className="text-sm text-muted-foreground">Te has vinculado correctamente con tu kinesiólogo/a.</p>
              <p className="text-xs text-mint-600 font-medium mt-4">Redirigiendo al inicio...</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6">
                <Hash size={32} className="text-blue-brand" />
              </div>
              <h1 className="text-xl font-bold mb-2">Vincular Kinesiólogo</h1>
              <p className="text-sm text-muted-foreground mb-8">
                Ingresá el código proporcionado por tu profesional para comenzar el seguimiento.
              </p>

              <div className="space-y-4 text-left">
                <div className="relative">
                  <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="KIKI-XXXX"
                    className="input-kiki pl-12 text-lg font-black tracking-widest placeholder:font-normal placeholder:tracking-normal"
                    disabled={loading}
                  />
                </div>

                <button
                  onClick={handleConnect}
                  disabled={loading || !code.trim()}
                  className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      Conectar ahora
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-xl border border-border">
                  <AlertCircle size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Si no tenés un código, solicitáselo a tu kinesiólogo/a. El código debe ser exacto (incluyendo el prefijo KIKI-).
                  </p>
                </div>
              </div>
            </>
          )}
        </KikiCard>

        {!success && (
          <button
            onClick={() => navigate(-1)}
            className="mt-6 text-sm text-muted-foreground font-medium hover:text-foreground transition-colors"
          >
            Volver atrás
          </button>
        )}
      </motion.div>
    </div>
  );
}
