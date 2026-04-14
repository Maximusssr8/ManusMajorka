/**
 * Academy progress API.
 *
 * Persists which Academy lessons a user has completed in
 * public.academy_progress (see scripts/academy-progress-migration.sql).
 * The client uses optimistic UI; these endpoints are the source of truth
 * on mount / cross-device sync.
 *
 * All endpoints require auth. RLS enforces per-user isolation; we also
 * scope every query to req.user.userId defensively.
 */
import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { getSupabaseAdmin } from '../_core/supabase';

const router = Router();

// GET /api/academy/progress — all completed lesson_ids for current user.
router.get('/progress', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('academy_progress')
      .select('lesson_id, completed_at')
      .eq('user_id', userId);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({
      completed: (data ?? []).map((r) => ({
        lesson_id: r.lesson_id,
        completed_at: r.completed_at,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// POST /api/academy/progress  { lesson_id }
router.post('/progress', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const lessonId = typeof req.body?.lesson_id === 'string' ? req.body.lesson_id.trim() : '';
    if (!lessonId || lessonId.length > 200) {
      res.status(400).json({ error: 'Invalid lesson_id' });
      return;
    }
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('academy_progress')
      .upsert(
        {
          user_id: userId,
          lesson_id: lessonId,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id', ignoreDuplicates: true },
      );
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ success: true, lesson_id: lessonId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// DELETE /api/academy/progress/:lessonId — undo completion.
router.delete('/progress/:lessonId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const lessonId = req.params.lessonId;
    if (!lessonId || lessonId.length > 200) {
      res.status(400).json({ error: 'Invalid lesson_id' });
      return;
    }
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('academy_progress')
      .delete()
      .eq('user_id', userId)
      .eq('lesson_id', lessonId);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
