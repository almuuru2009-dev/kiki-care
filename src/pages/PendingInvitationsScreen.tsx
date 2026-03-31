import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import kikiMascot from '@/assets/kiki-mascot.png';

interface PendingInvite {
  id: string;
  therapist_id: string;
  therapist_name: string;
  therapist_specialty: string | null;
  invited_at: string;
}

export default function PendingInvitationsScreen() {
  const navigate = useNavigate();
  const { user, profile } = useAuthContext();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadInvitations();
  }, [user]);

  const loadInvitations = async () => {
    if (!user?.email) return;
    
    // Get pending invitations for this caregiver's email
    const { data: links } = await supabase
      .from('therapist_caregiver_links')
      .select('id, therapist_id, invited_at')
      .eq('caregiver_email', user.email)
      .eq('status', 'pending');

    if (!links || links.length === 0) {
      setInvites([]);
      setLoading(false);
      return;
    }

    // Fetch therapist profiles
    const therapistIds = links.map(l => l.therapist_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, specialty')
      .in('id', therapistIds);

    const enriched = links.map(link => {
      const therapist = profiles?.find(p => p.id === link.therapist_id);
      return {
        id: link.id,
        therapist_id: link.therapist_id,
        therapist_name: therapist?.name || 'Kinesiólogo',
        therapist_specialty: therapist?.specialty || null,
        invited_at: link.invited_at,
      };
    });

    setInvites(enriched);
    setLoading(false);
  };

  const handleAccept = async (inviteId: string) => {
    if (!user) return;
    setProcessing(inviteId);

    const { error } = await supabase
      .from('therapist_caregiver_links')
      .update({
        status: 'active',
        caregiver_id: user.id,
        responded_at: new Date().toISOString(),
      })
      .eq('id', inviteId);

    if (error) {
      toast.error('Error al aceptar la invitación');
    } else {
      toast.success('¡Vínculo aceptado!');
      setInvites(prev => prev.filter(i => i.id !== inviteId));
    }
    setProcessing(null);
  };

  const handleReject = async (inviteId: string) => {
    if (!user) return;
    setProcessing(inviteId);

    const { error } = await supabase
      .from('therapist_caregiver_links')
      .update({
        status: 'rejected',
        caregiver_id: user.id,
        responded_at: new Date().toISOString(),
      })
      .eq('id', inviteId);

    if (error) {
      toast.error('Error al rechazar la invitación');
    } else {
      toast.success('Invitación rechazada');
      setInvites(prev => prev.filter(i => i.id !== inviteId));
    }
    setProcessing(null);
  };

  const handleContinue = () => {
    if (profile?.role === 'kinesiologist') {
      navigate('/kine/home');
    } else {
      navigate('/cuidadora/home');
    }
  };

  if (loading) {
    return (
      <div className="mobile-frame flex flex-col min-h-screen bg-background items-center justify-center">
        <div className="w-10 h-10 border-2 border-mint border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (invites.length === 0) {
    // No pending invitations, auto-redirect
    handleContinue();
    return null;
  }

  return (
    <div className="mobile-frame flex flex-col min-h-screen bg-background">
      <motion.div
        className="flex-1 px-6 pt-10 pb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col items-center mb-8">
          <img src={kikiMascot} alt="Kiki" className="w-16 h-16 object-contain mb-4" />
          <h1 className="text-xl font-bold text-foreground text-center">
            Tenés invitaciones pendientes
          </h1>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Un kinesiólogo quiere vincularse con vos para seguir el tratamiento del niño.
          </p>
        </div>

        <div className="space-y-3">
          {invites.map(invite => (
            <motion.div
              key={invite.id}
              className="card-kiki p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-mint-100 flex items-center justify-center">
                  <UserPlus size={20} className="text-mint-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{invite.therapist_name}</p>
                  {invite.therapist_specialty && (
                    <p className="text-xs text-muted-foreground">{invite.therapist_specialty}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    Invitación del {new Date(invite.invited_at).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(invite.id)}
                  disabled={processing === invite.id}
                  className="btn-primary flex-1 text-sm flex items-center justify-center gap-1"
                >
                  <Check size={14} /> Aceptar
                </button>
                <button
                  onClick={() => handleReject(invite.id)}
                  disabled={processing === invite.id}
                  className="flex-1 py-2.5 rounded-xl border border-red-200 text-rust text-sm font-medium flex items-center justify-center gap-1"
                >
                  <X size={14} /> Rechazar
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <button
          onClick={handleContinue}
          className="btn-ghost w-full text-sm mt-6"
        >
          Decidir después
        </button>
      </motion.div>
    </div>
  );
}
