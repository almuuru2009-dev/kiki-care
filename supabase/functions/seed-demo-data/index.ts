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

    const results: string[] = [];

    // === DEMO THERAPIST ===
    const kineEmail = "kine@kikiapp.com";
    const { data: allUsers } = await admin.auth.admin.listUsers();
    const kineExists = allUsers?.users?.find(u => u.email === kineEmail);
    let kineId: string;
    if (kineExists) {
      kineId = kineExists.id;
      // Reset: delete all kine data
      await admin.from("messages").delete().or(`sender_id.eq.${kineId},receiver_id.eq.${kineId}`);
      await admin.from("treatment_plans").delete().eq("therapist_id", kineId);
      await admin.from("therapist_caregiver_links").delete().eq("therapist_id", kineId);
      await admin.from("exercises").delete().eq("created_by", kineId);
      await admin.from("notifications").delete().eq("user_id", kineId);
      await admin.from("feedback").delete().eq("user_id", kineId);
      await admin.from("user_settings").delete().eq("user_id", kineId);
      results.push("Kine data reset");
    } else {
      const { data: kineUser, error: kineErr } = await admin.auth.admin.createUser({
        email: kineEmail, password: "#Demo1234", email_confirm: true,
        user_metadata: { name: "Dr. Juan Pérez", role: "kinesiologist", specialty: "Kinesiología Pediátrica" },
      });
      if (kineErr) throw kineErr;
      kineId = kineUser.user.id;
      results.push("Kine user created");
    }

    await admin.from("profiles").upsert({
      id: kineId, name: "Dr. Juan Pérez", email: kineEmail, role: "kinesiologist",
      specialty: "Neurológica", institution: "Hospital Garrahan", matricula: "MN-45892", onboarding_completed: true,
    }, { onConflict: "id" });

    // === DEMO CAREGIVER ===
    const careEmail = "caregiver@kikicare.com";
    const careExists = allUsers?.users?.find(u => u.email === careEmail);
    let careId: string;
    if (careExists) {
      careId = careExists.id;
      await admin.from("messages").delete().or(`sender_id.eq.${careId},receiver_id.eq.${careId}`);
      await admin.from("sessions").delete().eq("caregiver_id", careId);
      await admin.from("medals").delete().eq("user_id", careId);
      await admin.from("user_points").delete().eq("user_id", careId);
      await admin.from("notifications").delete().eq("user_id", careId);
      await admin.from("feedback").delete().eq("user_id", careId);
      await admin.from("children").delete().eq("caregiver_id", careId);
      results.push("Caregiver data reset");
    } else {
      const { data: careUser, error: careErr } = await admin.auth.admin.createUser({
        email: careEmail, password: "#Demo1234", email_confirm: true,
        user_metadata: { name: "María García", role: "caregiver" },
      });
      if (careErr) throw careErr;
      careId = careUser.user.id;
      results.push("Caregiver user created");
    }

    await admin.from("profiles").upsert({
      id: careId, name: "María García", email: careEmail, role: "caregiver", onboarding_completed: true,
    }, { onConflict: "id" });

    // === ADDITIONAL CAREGIVERS (for 3+ patients) ===
    const extraCaregivers = [
      { email: "laura@demo.kikicare.com", name: "Laura Fernández", childName: "Sofía Fernández", age: 4, diagnosis: "PCI hemiplejía derecha", gmfcs: 1 },
      { email: "carlos@demo.kikicare.com", name: "Carlos Rodríguez", childName: "Mateo Rodríguez", age: 8, diagnosis: "PCI diplejía espástica", gmfcs: 3 },
      { email: "ana@demo.kikicare.com", name: "Ana López", childName: "Valentina López", age: 3, diagnosis: "PCI atáxica", gmfcs: 2 },
      { email: "pedro@demo.kikicare.com", name: "Pedro Martínez", childName: "Lucas Martínez", age: 11, diagnosis: "PCI cuadriplejía", gmfcs: 4 },
    ];

    const caregiverIds: { id: string; email: string; childId: string }[] = [];

    // Main caregiver child
    const { data: mainChild } = await admin.from("children").insert({
      caregiver_id: careId, name: "Tomás García", age: 6, diagnosis: "PCI espástica bilateral", gmfcs: 2,
    }).select("id").single();
    const mainChildId = mainChild!.id;

    // Link main caregiver
    const { data: mainLink } = await admin.from("therapist_caregiver_links").insert({
      therapist_id: kineId, caregiver_id: careId, caregiver_email: careEmail,
      child_id: mainChildId, status: "active", responded_at: new Date().toISOString(),
    }).select("id").single();
    const mainLinkId = mainLink!.id;
    caregiverIds.push({ id: careId, email: careEmail, childId: mainChildId });

    for (const ec of extraCaregivers) {
      const existing = allUsers?.users?.find(u => u.email === ec.email);
      let ecId: string;
      if (existing) {
        ecId = existing.id;
        await admin.from("children").delete().eq("caregiver_id", ecId);
        await admin.from("sessions").delete().eq("caregiver_id", ecId);
        await admin.from("therapist_caregiver_links").delete().eq("caregiver_id", ecId);
      } else {
        const { data: ecUser, error: ecErr } = await admin.auth.admin.createUser({
          email: ec.email, password: "#Demo1234", email_confirm: true,
          user_metadata: { name: ec.name, role: "caregiver" },
        });
        if (ecErr) { results.push(`Skip ${ec.email}: ${ecErr.message}`); continue; }
        ecId = ecUser.user.id;
      }
      await admin.from("profiles").upsert({
        id: ecId, name: ec.name, email: ec.email, role: "caregiver", onboarding_completed: true,
      }, { onConflict: "id" });

      const { data: child } = await admin.from("children").insert({
        caregiver_id: ecId, name: ec.childName, age: ec.age, diagnosis: ec.diagnosis, gmfcs: ec.gmfcs,
      }).select("id").single();

      if (child) {
        await admin.from("therapist_caregiver_links").insert({
          therapist_id: kineId, caregiver_id: ecId, caregiver_email: ec.email,
          child_id: child.id, status: "active", responded_at: new Date().toISOString(),
        });
        caregiverIds.push({ id: ecId, email: ec.email, childId: child.id });
      }
    }
    results.push(`${caregiverIds.length} caregivers + children ready`);

    // === EXERCISES ===
    const exerciseDefs = [
      { name: "Estiramiento de isquiotibiales", target_area: "Piernas", duration: 5, sets: 3, reps: "10 repeticiones" },
      { name: "Fortalecimiento de core", target_area: "Tronco", duration: 8, sets: 4, reps: "8 repeticiones" },
      { name: "Equilibrio en bipedestación", target_area: "Global", duration: 10, sets: 2, reps: "30 segundos" },
      { name: "Movilidad articular pasiva", target_area: "Piernas", duration: 6, sets: 3, reps: "12 repeticiones" },
      { name: "Respiración diafragmática", target_area: "Tronco", duration: 5, sets: 2, reps: "10 respiraciones" },
    ];

    const exerciseIds: string[] = [];
    for (const ex of exerciseDefs) {
      const { data: newEx } = await admin.from("exercises").insert({
        ...ex, created_by: kineId, is_community: false, thumbnail_color: "#7EEDC4",
      }).select("id").single();
      if (newEx) exerciseIds.push(newEx.id);
    }

    // Treatment plans for ALL children
    for (const cg of caregiverIds) {
      const exSubset = exerciseIds.slice(0, 3);
      for (const exId of exSubset) {
        await admin.from("treatment_plans").insert({
          child_id: cg.childId, therapist_id: kineId, exercise_id: exId,
          day_of_week: [1, 2, 3, 4, 5], active: true,
        });
      }
    }
    results.push("Treatment plans created");

    // === SESSIONS for main caregiver (rich data) ===
    for (let i = 0; i < 25; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i * 2 - Math.floor(Math.random() * 2));
      await admin.from("sessions").insert({
        child_id: mainChildId, caregiver_id: careId,
        difficulty: Math.floor(Math.random() * 3) + 1,
        child_mood: Math.floor(Math.random() * 3) + 3,
        pain_reported: Math.random() > 0.85,
        note: i % 5 === 0 ? "Hoy estuvo muy cooperativo" : i % 7 === 0 ? "Le costó un poco más que antes" : null,
        completed_at: d.toISOString(),
      });
    }

    // Sessions for other caregivers
    for (const cg of caregiverIds.slice(1)) {
      const count = 5 + Math.floor(Math.random() * 10);
      for (let i = 0; i < count; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i * 3);
        await admin.from("sessions").insert({
          child_id: cg.childId, caregiver_id: cg.id,
          difficulty: Math.floor(Math.random() * 4) + 1,
          child_mood: Math.floor(Math.random() * 3) + 2,
          pain_reported: Math.random() > 0.8,
          completed_at: d.toISOString(),
        });
      }
    }
    results.push("Sessions created");

    // === MESSAGES ===
    const msgs = [
      { sender_id: kineId, receiver_id: careId, content: "Hola María, ¿cómo va Tomás con los ejercicios?", link_id: mainLinkId },
      { sender_id: careId, receiver_id: kineId, content: "¡Hola Dr. Pérez! Va muy bien, ya hace los estiramientos solo.", link_id: mainLinkId },
      { sender_id: kineId, receiver_id: careId, content: "Excelente, vamos a agregar uno nuevo la semana que viene.", link_id: mainLinkId },
      { sender_id: careId, receiver_id: kineId, content: "Perfecto, muchas gracias!", link_id: mainLinkId },
      { sender_id: kineId, receiver_id: careId, content: "Recordá que esta semana agregamos el ejercicio de equilibrio. Avisame cómo le va.", link_id: mainLinkId },
    ];
    for (let i = 0; i < msgs.length; i++) {
      const d = new Date(); d.setHours(d.getHours() - (msgs.length - i) * 3);
      await admin.from("messages").insert({ ...msgs[i], read: i < msgs.length - 1, created_at: d.toISOString() });
    }

    // Messages with other caregivers
    for (const cg of caregiverIds.slice(1, 3)) {
      const { data: link } = await admin.from("therapist_caregiver_links").select("id").eq("therapist_id", kineId).eq("caregiver_id", cg.id).limit(1).single();
      if (link) {
        const d = new Date(); d.setHours(d.getHours() - 5);
        await admin.from("messages").insert({ sender_id: kineId, receiver_id: cg.id, content: "¿Cómo van las sesiones esta semana?", link_id: link.id, read: true, created_at: d.toISOString() });
        d.setHours(d.getHours() + 2);
        await admin.from("messages").insert({ sender_id: cg.id, receiver_id: kineId, content: "Bien, avanzando de a poco!", link_id: link.id, read: false, created_at: d.toISOString() });
      }
    }
    results.push("Messages created");

    // === MEDALS for caregiver ===
    const currentYear = new Date().getFullYear();
    await admin.from("medals").insert([
      { user_id: careId, medal_type: "first-session", title: "Primera sesión", description: "Completaste tu primera sesión", points_awarded: 10, year: currentYear },
      { user_id: careId, medal_type: "streak-3", title: "Racha de 3", description: "3 sesiones seguidas", points_awarded: 15, year: currentYear },
      { user_id: careId, medal_type: "streak-7", title: "Semana completa", description: "7 sesiones seguidas", points_awarded: 25, year: currentYear },
      { user_id: careId, medal_type: "ten-sessions", title: "10 sesiones", description: "Completaste 10 sesiones", points_awarded: 30, year: currentYear },
      { user_id: careId, medal_type: "twenty-sessions", title: "Campeón", description: "Completaste 20 sesiones", points_awarded: 50, year: currentYear },
    ]);

    // === POINTS for caregiver ===
    const currentMonth = new Date().getMonth() + 1;
    const pointsData = [];
    for (let m = 1; m <= currentMonth; m++) {
      const completed = m < currentMonth ? (7 + Math.floor(Math.random() * 4)) : Math.min(25, Math.floor(25 * m / currentMonth));
      pointsData.push({
        user_id: careId, month: m, year: currentYear,
        sessions_completed: Math.min(completed, 10), sessions_required: 10,
        star_earned: completed >= 10, points: completed >= 10 ? 50 : completed * 3,
      });
    }
    await admin.from("user_points").insert(pointsData);
    results.push("Medals + points created");

    // === NOTIFICATIONS ===
    await admin.from("notifications").insert([
      { user_id: kineId, title: "Nuevo paciente vinculado", body: "María García aceptó la invitación.", type: "link", read: true },
      { user_id: kineId, title: "Alerta MAA", body: "Lucas Martínez muestra baja adherencia esta semana.", type: "alert", read: false },
      { user_id: kineId, title: "Sesión completada", body: "Tomás García completó su sesión de hoy.", type: "session", read: false },
      { user_id: careId, title: "¡Medalla desbloqueada!", body: "Ganaste la medalla 'Campeón' por completar 20 sesiones.", type: "medal", read: false },
      { user_id: careId, title: "Recordatorio", body: "No olvides la sesión de hoy.", type: "reminder", read: true },
    ]);

    // === FEEDBACK ===
    await admin.from("feedback").insert([
      { user_id: kineId, text: "La app es muy útil para el seguimiento de mis pacientes.", type: "comment" },
    ]);

    // === USER SETTINGS ===
    await admin.from("user_settings").upsert([
      { user_id: kineId, daily_reminder: true, therapist_messages: true, weekly_reports: true, sound_effects: true, language: "es" },
      { user_id: careId, daily_reminder: true, therapist_messages: true, weekly_reports: false, sound_effects: true, language: "es" },
    ], { onConflict: "user_id" });

    // === COMMUNITY EXERCISES (14 from 8 therapists) ===
    await admin.from("community_exercises").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const communityData = [
      { clinical_name: "Elongación asistida de psoas en colchoneta", simple_name: "Estiramiento de cadera acostado", gmfcs: "II–IV", category: "Elongación", area: "MMII", evidence: "Guía clínica", adherence: 85, icon: "🦿", validated: true, rating: 4.9, reviews: 18, author_name: "Lic. Ana Rodríguez", author_city: "CABA", description: "Ejercicio de elongación pasiva del psoas ilíaco en decúbito dorsal con asistencia del cuidador.", instructions: "Con el niño acostado boca arriba, tomá la pierna desde atrás del muslo y llevala suavemente hacia el pecho. Mantené 30 segundos y soltá despacio." },
      { clinical_name: "Fortalecimiento de glúteos en decúbito lateral", simple_name: "Ejercicios de cadera de lado", gmfcs: "II–III", category: "Fortalecimiento", area: "MMII", evidence: "Adaptación", adherence: 72, icon: "💪", validated: false, rating: 4.1, reviews: 7, author_name: "Lic. Martín Gómez", author_city: "Córdoba", description: "Fortalecimiento de glúteo medio en posición lateral.", instructions: "Con el niño acostado de lado, pedile que levante la pierna de arriba lentamente y la baje. Repetir 10 veces." },
      { clinical_name: "Activación de estabilizadores de tronco en sedestación", simple_name: "Equilibrio sentado", gmfcs: "II–III", category: "Control postural", area: "Tronco", evidence: "Guía clínica", adherence: 84, icon: "🧘", validated: true, rating: 4.7, reviews: 23, author_name: "Lic. Sofía López", author_city: "Rosario", description: "Trabajo de activación de musculatura estabilizadora del tronco en posición sentada.", instructions: "Sentá al niño en una superficie firme. Pedile que se incline despacio hacia un lado y vuelva al centro." },
      { clinical_name: "Facilitación del patrón de marcha en bipedestación asistida", simple_name: "Práctica de pasos con apoyo", gmfcs: "I–III", category: "Marcha", area: "Global", evidence: "Práctica común", adherence: 78, icon: "🚶", validated: false, rating: 3.8, reviews: 5, author_name: "Lic. Pedro Martínez", author_city: "Mendoza", description: "Facilitación de la marcha con apoyo bilateral del cuidador.", instructions: "Parate frente al niño, tomale las dos manos y animalo a dar pasos hacia vos." },
      { clinical_name: "Movilidad articular pasiva de tobillo", simple_name: "Mover el tobillo suavemente", gmfcs: "III–V", category: "Elongación", area: "MMII", evidence: "Guía clínica", adherence: 90, icon: "🦶", validated: true, rating: 4.8, reviews: 31, author_name: "Lic. Carolina Torres", author_city: "CABA", description: "Movilización pasiva de la articulación del tobillo para mantener rango articular.", instructions: "Con el niño sentado o acostado, tomá el pie suavemente y hacé movimientos circulares lentos hacia ambos lados." },
      { clinical_name: "Respiración diafragmática guiada", simple_name: "Respiración con la pancita", gmfcs: "I–V", category: "Respiratorio", area: "Tronco", evidence: "Práctica común", adherence: 65, icon: "🫁", validated: false, rating: 4.2, reviews: 12, author_name: "Lic. Diego Ruiz", author_city: "La Plata", description: "Técnica de respiración profunda diafragmática adaptada para niños.", instructions: "Pedile al niño que ponga la mano en la panza. Que respire profundo inflando la panza como un globo y luego sople despacito." },
      { clinical_name: "Fortalecimiento de mano con plastilina", simple_name: "Juego con plastilina", gmfcs: "I–III", category: "Función de mano", area: "MMSS", evidence: "Adaptación", adherence: 92, icon: "✋", validated: true, rating: 4.6, reviews: 15, author_name: "Lic. Valeria Paz", author_city: "Tucumán", description: "Ejercicio de fortalecimiento de prensión y motricidad fina usando plastilina.", instructions: "Dale plastilina al niño y pedile que la apriete, la estire y haga bolitas. Jugá con él haciéndolo divertido." },
      { clinical_name: "Control cefálico en prono", simple_name: "Levantar la cabecita boca abajo", gmfcs: "IV–V", category: "Control postural", area: "Control cefálico", evidence: "Guía clínica", adherence: 70, icon: "👶", validated: true, rating: 4.5, reviews: 20, author_name: "Lic. Ana Rodríguez", author_city: "CABA", description: "Estimulación del control cefálico en posición prona con apoyo.", instructions: "Poné al niño boca abajo sobre una superficie firme. Usá un juguete colorido para que levante la cabecita unos segundos." },
      { clinical_name: "Transferencia de sedestación a bipedestación", simple_name: "Pararse desde sentado", gmfcs: "I–III", category: "Transferencias", area: "Global", evidence: "Práctica común", adherence: 68, icon: "🧍", validated: false, rating: 4.0, reviews: 8, author_name: "Lic. Martín Gómez", author_city: "Córdoba", description: "Práctica funcional de pararse desde la posición sentada.", instructions: "Sentá al niño en una silla baja. Ponete frente a él y ayudalo a pararse tomándolo de las manos." },
      { clinical_name: "Elongación de aductores en mariposa", simple_name: "Posición de mariposa", gmfcs: "I–IV", category: "Elongación", area: "MMII", evidence: "Guía clínica", adherence: 80, icon: "🦋", validated: true, rating: 4.4, reviews: 16, author_name: "Lic. Carolina Torres", author_city: "CABA", description: "Elongación pasiva de aductores en posición de mariposa.", instructions: "Sentá al niño con las plantas de los pies juntas. Presioná suavemente las rodillas hacia abajo y mantené 20 segundos." },
      { clinical_name: "Equilibrio dinámico con pelota", simple_name: "Juego de equilibrio con pelota", gmfcs: "I–II", category: "Equilibrio", area: "Global", evidence: "Adaptación", adherence: 88, icon: "⚽", validated: false, rating: 4.3, reviews: 9, author_name: "Lic. Pedro Martínez", author_city: "Mendoza", description: "Ejercicio de equilibrio dinámico usando una pelota como elemento motivador.", instructions: "Parado, pedile al niño que pase una pelota de una mano a otra. Después que la tire y la atrape." },
      { clinical_name: "Estimulación propioceptiva con texturas", simple_name: "Sentir diferentes texturas", gmfcs: "I–V", category: "Sensorial", area: "MMSS", evidence: "Práctica común", adherence: 75, icon: "🧸", validated: true, rating: 4.1, reviews: 11, author_name: "Lic. Valeria Paz", author_city: "Tucumán", description: "Estimulación sensorial usando distintas texturas para mejorar la propiocepción.", instructions: "Presentale al niño distintos materiales: suave, áspero, frío. Dejá que los toque y los explore con las manos." },
      { clinical_name: "Circuito motor adaptado", simple_name: "Circuito de juegos", gmfcs: "I–III", category: "Global", area: "Global", evidence: "Adaptación", adherence: 82, icon: "🎯", validated: false, rating: 4.5, reviews: 14, author_name: "Lic. Diego Ruiz", author_city: "La Plata", description: "Circuito de actividades motrices adaptadas al nivel funcional del niño.", instructions: "Armá un circuito con 3-4 estaciones: gatear bajo una mesa, pararse y tocar un juguete alto, sentarse en una silla y aplaudir." },
      { clinical_name: "Relajación muscular progresiva", simple_name: "Apretar y soltar", gmfcs: "I–V", category: "Relajación", area: "Global", evidence: "Práctica común", adherence: 60, icon: "😌", validated: true, rating: 4.0, reviews: 6, author_name: "Lic. Sofía López", author_city: "Rosario", description: "Técnica de relajación muscular progresiva adaptada para niños con parálisis cerebral.", instructions: "Pedile al niño que apriete fuerte los puños durante 5 segundos y después los suelte. Repetí con piernas, hombros y cara." },
    ];

    for (const ce of communityData) {
      await admin.from("community_exercises").insert({
        ...ce, age_range: "2–18 años", duration: 5 + Math.floor(Math.random() * 6),
        reps: "10 repeticiones", sets: 3,
      });
    }
    results.push("14 community exercises seeded");

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
