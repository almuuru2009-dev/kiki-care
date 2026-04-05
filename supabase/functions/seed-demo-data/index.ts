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

    // Demo therapist
    const kineEmail = "kine@kikiapp.com";
    const { data: existingKine } = await admin.auth.admin.listUsers();
    const kineExists = existingKine?.users?.find(u => u.email === kineEmail);
    
    let kineId: string;
    if (kineExists) {
      kineId = kineExists.id;
      results.push("Kine user already exists");
    } else {
      const { data: kineUser, error: kineErr } = await admin.auth.admin.createUser({
        email: kineEmail,
        password: "#Demo1234",
        email_confirm: true,
        user_metadata: { name: "Dr. Juan Pérez", role: "kinesiologist", specialty: "Kinesiología Pediátrica" },
      });
      if (kineErr) throw kineErr;
      kineId = kineUser.user.id;
      results.push("Kine user created");
    }

    // Ensure kine profile
    await admin.from("profiles").upsert({
      id: kineId,
      name: "Dr. Juan Pérez",
      email: kineEmail,
      role: "kinesiologist",
      specialty: "Kinesiología Pediátrica",
      institution: "Hospital Garrahan",
      matricula: "MN-45892",
    }, { onConflict: "id" });

    // Demo caregiver
    const careEmail = "caregiver@kikicare.com";
    const careExists = existingKine?.users?.find(u => u.email === careEmail);
    
    let careId: string;
    if (careExists) {
      careId = careExists.id;
      results.push("Caregiver user already exists");
    } else {
      const { data: careUser, error: careErr } = await admin.auth.admin.createUser({
        email: careEmail,
        password: "#Demo1234",
        email_confirm: true,
        user_metadata: { name: "María García", role: "caregiver" },
      });
      if (careErr) throw careErr;
      careId = careUser.user.id;
      results.push("Caregiver user created");
    }

    // Ensure caregiver profile
    await admin.from("profiles").upsert({
      id: careId,
      name: "María García",
      email: careEmail,
      role: "caregiver",
    }, { onConflict: "id" });

    // Create child for caregiver
    const { data: existingChild } = await admin.from("children").select("id").eq("caregiver_id", careId).limit(1);
    let childId: string;
    if (existingChild && existingChild.length > 0) {
      childId = existingChild[0].id;
      results.push("Child already exists");
    } else {
      const { data: childData, error: childErr } = await admin.from("children").insert({
        caregiver_id: careId,
        name: "Tomás García",
        age: 6,
        diagnosis: "PCI espástica bilateral",
        gmfcs: 2,
      }).select("id").single();
      if (childErr) throw childErr;
      childId = childData.id;
      results.push("Child created");
    }

    // Link therapist ↔ caregiver
    const { data: existingLink } = await admin.from("therapist_caregiver_links")
      .select("id")
      .eq("therapist_id", kineId)
      .eq("caregiver_email", careEmail)
      .eq("status", "active")
      .limit(1);

    let linkId: string;
    if (existingLink && existingLink.length > 0) {
      linkId = existingLink[0].id;
      results.push("Link already exists");
    } else {
      const { data: linkData, error: linkErr } = await admin.from("therapist_caregiver_links").insert({
        therapist_id: kineId,
        caregiver_id: careId,
        caregiver_email: careEmail,
        child_id: childId,
        status: "active",
        responded_at: new Date().toISOString(),
      }).select("id").single();
      if (linkErr) throw linkErr;
      linkId = linkData.id;
      results.push("Link created");
    }

    // Create exercises
    const exerciseNames = [
      { name: "Estiramiento de isquiotibiales", target_area: "Piernas", duration: 5, sets: 3, reps: "10 repeticiones" },
      { name: "Fortalecimiento de core", target_area: "Tronco", duration: 8, sets: 4, reps: "8 repeticiones" },
      { name: "Equilibrio en bipedestación", target_area: "Global", duration: 10, sets: 2, reps: "30 segundos" },
    ];

    const exerciseIds: string[] = [];
    for (const ex of exerciseNames) {
      const { data: existingEx } = await admin.from("exercises").select("id").eq("name", ex.name).eq("created_by", kineId).limit(1);
      if (existingEx && existingEx.length > 0) {
        exerciseIds.push(existingEx[0].id);
      } else {
        const { data: newEx } = await admin.from("exercises").insert({
          ...ex,
          created_by: kineId,
          is_community: false,
          thumbnail_color: "#7EEDC4",
        }).select("id").single();
        if (newEx) exerciseIds.push(newEx.id);
      }
    }
    results.push(`${exerciseIds.length} exercises ready`);

    // Create treatment plans
    for (const exId of exerciseIds) {
      const { data: existingPlan } = await admin.from("treatment_plans")
        .select("id").eq("child_id", childId).eq("exercise_id", exId).limit(1);
      if (!existingPlan || existingPlan.length === 0) {
        await admin.from("treatment_plans").insert({
          child_id: childId,
          therapist_id: kineId,
          exercise_id: exId,
          day_of_week: [1, 2, 3, 4, 5],
          active: true,
        });
      }
    }
    results.push("Treatment plans ready");

    // Create some sessions
    const { data: existingSessions } = await admin.from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("caregiver_id", careId);
    
    if (!existingSessions || (existingSessions as any) === 0) {
      const sessionDates = [];
      for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i * 2);
        sessionDates.push(d.toISOString());
      }
      for (const date of sessionDates) {
        await admin.from("sessions").insert({
          child_id: childId,
          caregiver_id: careId,
          difficulty: Math.floor(Math.random() * 3) + 1,
          child_mood: Math.floor(Math.random() * 3) + 3,
          pain_reported: Math.random() > 0.8,
          completed_at: date,
        });
      }
      results.push("Sessions created");
    }

    // Create messages
    const { data: existingMsgs } = await admin.from("messages")
      .select("id")
      .or(`sender_id.eq.${kineId},receiver_id.eq.${kineId}`)
      .limit(1);

    if (!existingMsgs || existingMsgs.length === 0) {
      const msgs = [
        { sender_id: kineId, receiver_id: careId, content: "Hola María, ¿cómo va Tomás con los ejercicios?", link_id: linkId },
        { sender_id: careId, receiver_id: kineId, content: "¡Hola Dr. Pérez! Va muy bien, ya hace los estiramientos solo.", link_id: linkId },
        { sender_id: kineId, receiver_id: careId, content: "Excelente, vamos a agregar uno nuevo la semana que viene.", link_id: linkId },
        { sender_id: careId, receiver_id: kineId, content: "Perfecto, muchas gracias!", link_id: linkId },
      ];
      for (let i = 0; i < msgs.length; i++) {
        const d = new Date();
        d.setHours(d.getHours() - (msgs.length - i) * 2);
        await admin.from("messages").insert({
          ...msgs[i],
          read: i < msgs.length - 1,
          created_at: d.toISOString(),
        });
      }
      results.push("Messages created");
    }

    // Create community exercises
    const communityExercises = [
      { name: "Movilidad articular pasiva", target_area: "Global", duration: 10, description: "Ejercicio guiado de movilidad pasiva para miembros superiores e inferiores" },
      { name: "Respiración diafragmática", target_area: "Tronco", duration: 5, description: "Técnica de respiración profunda para mejorar la capacidad respiratoria" },
    ];
    for (const ce of communityExercises) {
      const { data: existing } = await admin.from("exercises").select("id").eq("name", ce.name).eq("is_community", true).limit(1);
      if (!existing || existing.length === 0) {
        await admin.from("exercises").insert({
          ...ce,
          created_by: kineId,
          is_community: true,
          sets: 3,
          reps: "10 repeticiones",
          thumbnail_color: "#A78BFA",
        });
      }
    }
    results.push("Community exercises ready");

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
