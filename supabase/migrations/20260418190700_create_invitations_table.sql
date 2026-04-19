-- Migración definitiva para invitaciones (Nuevo nombre para evitar conflictos)
DROP TABLE IF EXISTS public.kiki_invitations CASCADE;

CREATE TABLE public.kiki_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    kinesio_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '2 days'),
    accepted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.kiki_invitations ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "kiki_invitations_insert" ON public.kiki_invitations FOR INSERT TO authenticated WITH CHECK (auth.uid() = kinesio_id);
CREATE POLICY "kiki_invitations_select" ON public.kiki_invitations FOR SELECT TO authenticated USING (true);
CREATE POLICY "kiki_invitations_update" ON public.kiki_invitations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.kiki_invitations;
