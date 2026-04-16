import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json().catch(() => ({ step: "users" }));
    const { step } = body;
    const results: string[] = [];

    if (step === "users") {
      const { data: allUsers } = await admin.auth.admin.listUsers();

      // KINE
      const kineEmail = "kine@kikiapp.com";
      let kineExists = allUsers?.users?.find(u => u.email === kineEmail);
      let kineId: string;
      if (kineExists) {
        kineId = kineExists.id;
      } else {
        const { data, error } = await admin.auth.admin.createUser({
          email: kineEmail, password: "#Demo1234", email_confirm: true,
          user_metadata: { name: "Dr. Juan Pérez", role: "kinesiologist" },
        });
        if (error) throw error;
        kineId = data.user.id;
      }
      await admin.from("profiles").upsert({
        id: kineId, name: "Dr. Juan Pérez", email: kineEmail, role: "kinesiologist",
        specialty: "Neurológica", institution: "Hospital Garrahan", matricula: "MN-45892", onboarding_completed: true,
      }, { onConflict: "id" });

      // CAREGIVER
      const careEmail = "caregiver@kikicare.com";
      let careExists = allUsers?.users?.find(u => u.email === careEmail);
      let careId: string;
      if (careExists) {
        careId = careExists.id;
      } else {
        const { data, error } = await admin.auth.admin.createUser({
          email: careEmail, password: "#Demo1234", email_confirm: true,
          user_metadata: { name: "María García", role: "caregiver" },
        });
        if (error) throw error;
        careId = data.user.id;
      }
      await admin.from("profiles").upsert({
        id: careId, name: "María García", email: careEmail, role: "caregiver", onboarding_completed: true,
      }, { onConflict: "id" });

      results.push(`kineId=${kineId}`);
      results.push(`careId=${careId}`);

      return new Response(JSON.stringify({ ok: true, kineId, careId, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (step === "data") {
      const { kineId, careId } = body;
      if (!kineId || !careId) throw new Error("Missing kineId/careId");

      // Create child + link
      const { data: mainChild } = await admin.from("children").insert({
        caregiver_id: careId, name: "Tomás García", age: 6, diagnosis: "PCI espástica bilateral", gmfcs: 2,
        notes: "Le gusta jugar con dinosaurios. Responde bien a juegos con música. Mejor rendimiento por la mañana.",
      }).select("id").single();

      if (mainChild) {
        const { data: link } = await admin.from("therapist_caregiver_links").insert({
          therapist_id: kineId, caregiver_id: careId, caregiver_email: "caregiver@kikicare.com",
          child_id: mainChild.id, status: "active", responded_at: new Date().toISOString(),
        }).select("id").single();

        // Exercises with richer data
        const exerciseDefs = [
          { name: "Estiramiento de isquiotibiales", target_area: "Piernas", duration: 5, description: "Posición inicial: Sentado con piernas extendidas.\n\nInstrucciones: Alcanzar los dedos de los pies con las manos, manteniendo la espalda recta. Mantener 15 segundos.\n\nPrecauciones: No forzar si hay dolor. Respetar el rango de movimiento del niño." },
          { name: "Fortalecimiento de core", target_area: "Tronco", duration: 8, description: "Posición inicial: Acostado boca arriba con rodillas flexionadas.\n\nInstrucciones: Elevar cabeza y hombros suavemente. Mantener 5 segundos. Repetir.\n\nProgresión: Agregar rotaciones suaves cuando domine el movimiento básico." },
          { name: "Equilibrio en bipedestación", target_area: "Global", duration: 10, description: "Posición inicial: De pie con apoyo en una silla o barra.\n\nInstrucciones: Soltar el apoyo gradualmente. Intentar mantener 10 segundos sin apoyo.\n\nVariante: Pararse en un pie alternando. Usar superficie inestable para mayor desafío." },
          { name: "Movilidad de tobillo", target_area: "Piernas", duration: 5, description: "Posición inicial: Sentado con pies en el suelo.\n\nInstrucciones: Mover los tobillos en círculos, 10 veces en cada dirección. Luego flexión y extensión.\n\nObjetivo: Mejorar rango articular y propiocepción." },
        ];
        const exIds: string[] = [];
        for (const ex of exerciseDefs) {
          const { data } = await admin.from("exercises").insert({
            ...ex, created_by: kineId, sets: 3, reps: "10 repeticiones",
          }).select("id").single();
          if (data) exIds.push(data.id);
        }

        // Treatment plans with day_of_week
        for (let i = 0; i < exIds.length; i++) {
          await admin.from("treatment_plans").insert({
            child_id: mainChild.id, therapist_id: kineId, exercise_id: exIds[i],
            day_of_week: [1, 2, 3, 4, 5], active: true,
          });
        }

        // Sessions (15 over past 30 days)
        for (let i = 0; i < 15; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i * 2);
          await admin.from("sessions").insert({
            child_id: mainChild.id, caregiver_id: careId,
            difficulty: Math.floor(Math.random() * 3) + 1,
            child_mood: Math.floor(Math.random() * 3) + 3,
            pain_reported: Math.random() > 0.85,
            completed_at: d.toISOString(),
          });
        }

        // Messages
        if (link) {
          const msgs = [
            { sender_id: kineId, receiver_id: careId, content: "Hola María, ¿cómo va Tomás con los ejercicios?", link_id: link.id },
            { sender_id: careId, receiver_id: kineId, content: "¡Hola Dr. Pérez! Va muy bien, le gustan los de equilibrio.", link_id: link.id },
            { sender_id: kineId, receiver_id: careId, content: "Excelente, le agregué un ejercicio nuevo de movilidad de tobillo.", link_id: link.id },
            { sender_id: careId, receiver_id: kineId, content: "Perfecto, lo probamos mañana. ¡Gracias!", link_id: link.id },
          ];
          for (const m of msgs) {
            await admin.from("messages").insert({ ...m, read: true });
          }
        }

        // Medals (only first-session, rest to be earned)
        const yr = new Date().getFullYear();
        await admin.from("medals").insert([
          { user_id: careId, medal_type: "first-session", title: "Primera sesión", description: "Completaste tu primera sesión", points_awarded: 10, year: yr },
          { user_id: careId, medal_type: "streak-3", title: "Racha de 3", description: "Completaste 3 sesiones", points_awarded: 15, year: yr },
          { user_id: careId, medal_type: "streak-7", title: "Semana completa", description: "Completaste 7 sesiones", points_awarded: 25, year: yr },
          { user_id: careId, medal_type: "ten-sessions", title: "10 sesiones", description: "Completaste 10 sesiones", points_awarded: 30, year: yr },
        ]);
        const mo = new Date().getMonth() + 1;
        await admin.from("user_points").insert({
          user_id: careId, month: mo, year: yr, sessions_completed: 15, sessions_required: 20, points: 80,
        });

        // Appointments (upcoming)
        const today = new Date();
        for (let i = 0; i < 4; i++) {
          const apptDate = new Date(today);
          apptDate.setDate(apptDate.getDate() + 3 + i * 7);
          const descriptions = ["Control mensual", "Revisión de plan", "Evaluación de progreso", "Seguimiento"];
          await admin.from("appointments").insert({
            therapist_id: kineId, child_id: mainChild.id,
            appointment_date: apptDate.toISOString().split("T")[0],
            start_time: "10:00", duration_minutes: 45,
            description: descriptions[i] || "Consulta",
          });
        }
      }

      // Extra caregivers for kine
      const extras = [
        { email: "laura@demo.kikicare.com", name: "Laura Fernández", child: "Sofía Fernández", age: 4, diag: "PCI hemiplejía derecha", gmfcs: 1 },
        { email: "carlos@demo.kikicare.com", name: "Carlos Rodríguez", child: "Mateo Rodríguez", age: 8, diag: "PCI diplejía espástica", gmfcs: 3 },
        { email: "ana@demo.kikicare.com", name: "Ana López", child: "Valentina López", age: 3, diag: "PCI atáxica", gmfcs: 2 },
      ];
      const { data: allU } = await admin.auth.admin.listUsers();
      for (const ec of extras) {
        let ecId: string;
        const ex = allU?.users?.find(u => u.email === ec.email);
        if (ex) { ecId = ex.id; } else {
          const { data, error } = await admin.auth.admin.createUser({
            email: ec.email, password: "#Demo1234", email_confirm: true,
            user_metadata: { name: ec.name, role: "caregiver" },
          });
          if (error) { results.push(`skip ${ec.email}`); continue; }
          ecId = data.user.id;
        }
        await admin.from("profiles").upsert({ id: ecId, name: ec.name, email: ec.email, role: "caregiver", onboarding_completed: true }, { onConflict: "id" });
        const { data: ch } = await admin.from("children").insert({
          caregiver_id: ecId, name: ec.child, age: ec.age, diagnosis: ec.diag, gmfcs: ec.gmfcs,
        }).select("id").single();
        if (ch) {
          await admin.from("therapist_caregiver_links").insert({
            therapist_id: kineId, caregiver_id: ecId, caregiver_email: ec.email,
            child_id: ch.id, status: "active", responded_at: new Date().toISOString(),
          });
          for (let i = 0; i < 5; i++) {
            const d = new Date(); d.setDate(d.getDate() - i * 3);
            await admin.from("sessions").insert({
              child_id: ch.id, caregiver_id: ecId,
              difficulty: 2, child_mood: 4, completed_at: d.toISOString(),
            });
          }
        }
      }

      // Community exercises
      await admin.from("community_exercises").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await admin.from("community_exercises").insert([
        { clinical_name: "Elongación asistida de psoas", simple_name: "Estiramiento de cadera", gmfcs: "II–IV", category: "Elongación", area: "MMII", adherence: 85, icon: "🦿", validated: true, rating: 4.9, reviews: 18, author_name: "Lic. Ana Rodríguez", author_city: "CABA" },
        { clinical_name: "Fortalecimiento de glúteos", simple_name: "Ejercicios de cadera", gmfcs: "II–III", category: "Fortalecimiento", area: "MMII", adherence: 72, icon: "💪", validated: false, rating: 4.1, reviews: 7, author_name: "Lic. Martín Gómez", author_city: "Córdoba" },
        { clinical_name: "Estabilizadores de tronco", simple_name: "Equilibrio sentado", gmfcs: "II–III", category: "Control postural", area: "Tronco", adherence: 84, icon: "🧘", validated: true, rating: 4.7, reviews: 23, author_name: "Lic. Sofía López", author_city: "Rosario" },
        { clinical_name: "Facilitación de marcha", simple_name: "Práctica de pasos", gmfcs: "I–III", category: "Marcha", area: "Global", adherence: 78, icon: "🚶", validated: false, rating: 3.8, reviews: 5, author_name: "Lic. Pedro Martínez", author_city: "Mendoza" },
        { clinical_name: "Movilidad de tobillo", simple_name: "Mover el tobillo", gmfcs: "III–V", category: "Elongación", area: "MMII", adherence: 90, icon: "🦶", validated: true, rating: 4.8, reviews: 31, author_name: "Lic. Carolina Torres", author_city: "CABA" },
        { clinical_name: "Respiración diafragmática", simple_name: "Respiración con la pancita", gmfcs: "I–V", category: "Respiratorio", area: "Tronco", adherence: 65, icon: "🫁", validated: false, rating: 4.2, reviews: 12, author_name: "Lic. Diego Ruiz", author_city: "La Plata" },
        { clinical_name: "Fortalecimiento de mano", simple_name: "Juego con plastilina", gmfcs: "I–III", category: "Función de mano", area: "MMSS", adherence: 92, icon: "✋", validated: true, rating: 4.6, reviews: 15, author_name: "Lic. Valeria Paz", author_city: "Tucumán" },
        { clinical_name: "Control cefálico en prono", simple_name: "Levantar la cabecita", gmfcs: "IV–V", category: "Control postural", area: "Control cefálico", adherence: 70, icon: "👶", validated: true, rating: 4.5, reviews: 20, author_name: "Lic. Ana Rodríguez", author_city: "CABA" },
        { clinical_name: "Transferencias sentado-parado", simple_name: "Pararse y sentarse", gmfcs: "I–III", category: "Funcional", area: "Global", adherence: 88, icon: "🪑", validated: true, rating: 4.4, reviews: 9, author_name: "Lic. Roberto Sánchez", author_city: "Salta" },
        { clinical_name: "Propiocepción plantar", simple_name: "Caminar en texturas", gmfcs: "I–II", category: "Sensorial", area: "MMII", adherence: 75, icon: "🦶", validated: false, rating: 4.0, reviews: 6, author_name: "Lic. Laura Méndez", author_city: "Neuquén" },
      ]);

      // Notifications
      await admin.from("notifications").insert([
        { user_id: kineId, title: "Nuevo paciente vinculado", body: "María García aceptó la invitación.", type: "link", read: true },
        { user_id: kineId, title: "Sesión completada", body: "Tomás García completó su sesión de hoy.", type: "session", read: false },
        { user_id: careId, title: "¡Medalla desbloqueada!", body: "Ganaste la medalla '10 sesiones'.", type: "medal", read: false },
        { user_id: careId, title: "Nueva consulta agendada", body: "Dr. Pérez agendó una consulta para el próximo martes.", type: "appointment", read: false },
      ]);

      // Settings
      await admin.from("user_settings").upsert([
        { user_id: kineId, daily_reminder: true, therapist_messages: true, weekly_reports: true, sound_effects: true, language: "es" },
        { user_id: careId, daily_reminder: true, therapist_messages: true, sound_effects: true, language: "es" },
      ], { onConflict: "user_id" });

      results.push("All data seeded");
      return new Response(JSON.stringify({ ok: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid step. Use 'users' or 'data'" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
