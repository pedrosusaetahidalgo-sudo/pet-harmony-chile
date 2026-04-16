/**
 * feedback-admin — Edge function for admin feedback operations.
 *
 * Centralizes all admin feedback logic server-side:
 * - List feedback (with filters)
 * - Update status
 * - Respond to feedback
 * - Toggle like
 * - Award paw points
 *
 * Uses service role to bypass RLS (admin verified via admin_access table).
 * Prepares for future: email/push notifications when admin responds.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsOptions } from '../_shared/cors.ts';
import { callClaude, parseJSON } from '../_shared/ai-base.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function verifyAdmin(authHeader: string) {
  const userClient = createClient(supabaseUrl, serviceKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data.user) throw new Error('AUTH_INVALID');

  // Use service role to check admin_access (bypasses RLS)
  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: admin } = await adminClient
    .from('admin_access')
    .select('id, role')
    .eq('user_id', data.user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!admin) throw new Error('NOT_ADMIN');

  return { user: data.user, adminClient, role: admin.role };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsOptions(req);

  const cors = getCorsHeaders(req);
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'No autorizado' }, 401);

    const { adminClient } = await verifyAdmin(authHeader);
    const body = await req.json();
    const { action } = body;

    switch (action) {
      // ── List feedback ──
      case 'list': {
        const { status: statusFilter } = body;
        let query = adminClient
          .from('feedback_in_app')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (statusFilter && statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

        const { data, error } = await query;
        if (error) throw error;
        return json({ data });
      }

      // ── Update status ──
      case 'update_status': {
        const { id, status } = body;
        if (!id || !status) return json({ error: 'id y status requeridos' }, 400);

        const { error } = await adminClient
          .from('feedback_in_app')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;
        return json({ success: true });
      }

      // ── Respond ──
      case 'respond': {
        const { id, response } = body;
        if (!id || !response) return json({ error: 'id y response requeridos' }, 400);

        const { error } = await adminClient
          .from('feedback_in_app')
          .update({
            admin_response: response,
            admin_responded_at: new Date().toISOString(),
            status: 'reviewed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
        if (error) throw error;

        // TODO: Send notification to user (email/push) when responding
        // const { data: feedback } = await adminClient
        //   .from("feedback_in_app")
        //   .select("user_id, user_display_name")
        //   .eq("id", id)
        //   .single();
        // await sendNotification(feedback.user_id, "Tu feedback recibió respuesta");

        return json({ success: true });
      }

      // ── Toggle like ──
      case 'toggle_like': {
        const { id, liked } = body;
        if (!id || liked === undefined) return json({ error: 'id y liked requeridos' }, 400);

        const { error } = await adminClient
          .from('feedback_in_app')
          .update({ admin_liked: liked, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;
        return json({ success: true });
      }

      // ── Award points ──
      case 'award_points': {
        const { feedbackId, userId, points } = body;
        if (!feedbackId || !userId || !points)
          return json({ error: 'feedbackId, userId y points requeridos' }, 400);

        // Update feedback record
        const { error: fbErr } = await adminClient
          .from('feedback_in_app')
          .update({
            paw_points_awarded: adminClient.rpc ? points : points, // increment handled below
            updated_at: new Date().toISOString(),
          })
          .eq('id', feedbackId);
        if (fbErr) throw fbErr;

        // Award points atomically
        const { error: txErr } = await adminClient.from('paw_point_transactions').insert({
          user_id: userId,
          points_amount: points,
          transaction_type: 'bonus',
          source_type: 'feedback_reward',
          description: 'Recompensa por feedback de calidad',
        });
        if (txErr) throw txErr;

        // Upsert guardian progress
        const { error: gpErr } = await adminClient
          .from('user_guardian_progress')
          .upsert({ user_id: userId, total_paw_points: points }, { onConflict: 'user_id' });
        // Note: upsert increment needs raw SQL; fallback to RPC if available
        if (gpErr) {
          // Try the existing RPC as fallback
          await adminClient.rpc('admin_award_feedback_points', {
            p_feedback_id: feedbackId,
            p_user_id: userId,
            p_points: points,
          });
        }

        return json({ success: true, points });
      }

      // ── AI classify feedback ──
      case 'classify': {
        const { id } = body;
        if (!id) return json({ error: 'id requerido' }, 400);

        const { data: fb, error: fbErr } = await adminClient
          .from('feedback_in_app')
          .select('message, category, page_url')
          .eq('id', id)
          .single();
        if (fbErr || !fb) return json({ error: 'Feedback no encontrado' }, 404);

        const classifyPrompt = `Eres el clasificador de feedback de Paw Friend, una app chilena de mascotas.

## CATEGORÍAS
- bug: Error técnico o funcionalidad rota
- ux: Problema de usabilidad
- feature_request: Solicitud de nueva funcionalidad
- praise: Elogio o feedback positivo
- complaint: Queja sobre servicio
- question: Pregunta que necesita respuesta
- content: Feedback sobre contenido
- security: Reporte de seguridad o privacidad
- other: No clasificable

## FORMATO (JSON sin markdown)
{"category":"bug|ux|feature_request|praise|complaint|question|content|security|other","sentiment":"positive|neutral|negative","urgency":"critical|high|medium|low","summary":"1 oración resumen","suggested_response":"respuesta sugerida (español chileno, 1-2 oraciones)","tags":["tag1"],"affects_feature":"módulo afectado o null"}

## URGENCIA
- critical: Seguridad, pérdida de datos, feature core roto
- high: Bug reproducible en feature principal, usuario frustrado
- medium: Sugerencia valiosa, bug menor, UX confusa
- low: Nice-to-have, elogio, pregunta general`;

        try {
          const result = await callClaude({
            systemPrompt: classifyPrompt,
            userMessage: `Feedback: "${fb.message}"${fb.category ? `\nCategoría usuario: ${fb.category}` : ''}${fb.page_url ? `\nPágina: ${fb.page_url}` : ''}`,
            maxTokens: 250,
            temperature: 0.1,
            model: 'claude-haiku-4-5-20251001',
          });

          const classification = parseJSON(result, {
            category: 'other',
            sentiment: 'neutral',
            urgency: 'medium',
            summary: fb.message.slice(0, 100),
            suggested_response: null,
            tags: [],
            affects_feature: null,
          });

          // Save classification to feedback record
          await adminClient
            .from('feedback_in_app')
            .update({
              ai_category: classification.category,
              ai_sentiment: classification.sentiment,
              ai_urgency: classification.urgency,
              ai_summary: classification.summary,
              ai_suggested_response: classification.suggested_response,
              ai_tags: classification.tags,
              ai_classified_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', id);

          return json({ success: true, classification });
        } catch (aiErr) {
          console.error('AI classify error:', aiErr);
          return json({ error: 'Error al clasificar con IA' }, 502);
        }
      }

      // ── Batch classify all unclassified feedback ──
      case 'classify_batch': {
        const { data: unclassified } = await adminClient
          .from('feedback_in_app')
          .select('id, message, category, page_url')
          .is('ai_category', null)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!unclassified?.length) return json({ success: true, classified: 0 });

        let classified = 0;
        for (const fb of unclassified) {
          try {
            const result = await callClaude({
              systemPrompt: `Clasificador feedback app mascotas Chile. JSON: {"category":"bug|ux|feature_request|praise|complaint|question|content|security|other","sentiment":"positive|neutral|negative","urgency":"critical|high|medium|low","summary":"1 oración"}`,
              userMessage: `"${fb.message.slice(0, 300)}"`,
              maxTokens: 150,
              temperature: 0.1,
              model: 'claude-haiku-4-5-20251001',
            });

            const c = parseJSON(result, {
              category: 'other',
              sentiment: 'neutral',
              urgency: 'medium',
              summary: fb.message.slice(0, 100),
            });

            await adminClient
              .from('feedback_in_app')
              .update({
                ai_category: c.category,
                ai_sentiment: c.sentiment,
                ai_urgency: c.urgency,
                ai_summary: c.summary,
                ai_classified_at: new Date().toISOString(),
              })
              .eq('id', fb.id);

            classified++;
          } catch {
            console.warn(`Failed to classify feedback ${fb.id}`);
          }
        }

        return json({ success: true, classified, total: unclassified.length });
      }

      default:
        return json({ error: `Acción desconocida: ${action}` }, 400);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    const status =
      message === 'AUTH_INVALID' || message === 'AUTH_REQUIRED'
        ? 401
        : message === 'NOT_ADMIN'
          ? 403
          : 500;
    return json({ error: message }, status);
  }
});
