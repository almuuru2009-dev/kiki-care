-- Permitir que las cuidadoras vean los ejercicios que les fueron asignados en un plan
CREATE POLICY "Caregivers can view assigned exercises"
ON public.exercises
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.treatment_plans
    JOIN public.children ON public.children.id = public.treatment_plans.child_id
    WHERE public.treatment_plans.exercise_id = public.exercises.id
      AND public.children.caregiver_id = auth.uid()
  )
);

-- Asegurar que las cuidadoras puedan ver los ejercicios de la comunidad (por si acaso)
-- DROP POLICY IF EXISTS "Community exercises are viewable" ON public.exercises;
-- CREATE POLICY "Community exercises are viewable" ON public.exercises FOR SELECT TO authenticated USING (is_community = true OR created_by = auth.uid());
