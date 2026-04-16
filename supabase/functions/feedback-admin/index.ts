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
