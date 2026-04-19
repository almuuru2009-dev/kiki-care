-- Fix RLS for therapist_caregiver_links to allow caregivers to link themselves via code
-- 1. Eliminar la política restrictiva anterior si existe
DROP POLICY IF EXISTS "Therapists can create invitations" ON public.therapist_caregiver_links;

-- 2. Crear una política más amplia para INSERT
-- Permite insertar si el usuario es el terapeuta (para el sistema viejo) 
-- O si el usuario es el cuidador (para el sistema de códigos KIKI)
CREATE POLICY "Permitir crear vínculos a terapeutas o cuidadores" 
ON public.therapist_caregiver_links 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = therapist_id OR auth.uid() = caregiver_id);

-- 3. Asegurar que los cuidadores puedan ver su propio perfil y el de su hijo
-- (Esto ya debería estar, pero lo reforzamos si es necesario)
