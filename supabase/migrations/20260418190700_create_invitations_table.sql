-- Crear tabla de invitaciones por código
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    kinesio_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
    accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.invitations ENABLE CONTROL;

-- Políticas de RLS para invitaciones
CREATE POLICY "Kinesiologos pueden crear sus propias invitaciones"
    ON public.invitations FOR INSERT
    WITH CHECK (auth.uid() = kinesio_id);

CREATE POLICY "Kinesiologos pueden ver sus propias invitaciones"
    ON public.invitations FOR SELECT
    USING (auth.uid() = kinesio_id);

CREATE POLICY "Cualquier usuario autenticado puede ver invitaciones por código"
    ON public.invitations FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios pueden actualizar el estado de una invitación si la aceptan"
    ON public.invitations FOR UPDATE
    USING (status = 'pending')
    WITH CHECK (auth.uid() = accepted_by);
