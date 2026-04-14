/**
 * Ad creative image generation — provider-agnostic wrapper.
 *
 * Provider priority:
 *   1. fal.ai (fal-ai/flux/schnell — fast, high quality, cheap)
 *   2. OpenAI (gpt-image-1 fallback)
 *   3. none — surfaces honest `no_provider` state to the UI
 *
 * Output URLs from fal/OpenAI are short-lived. We attempt to persist to the
 * Supabase Storage bucket `ad-creatives`; if that fails we return the temporary
 * URL with a `warning`.
 */

import { getSupabaseAdmin } from '../_core/supabase';

export type ImageStyle = 'lifestyle' | 'product' | 'ugc' | 'flatlay';
export type ImageAspect = '1:1' | '9:16' | '4:5';
export type ImageProvider = 'fal' | 'openai' | 'none';

export interface GenerateAdImageInput {
  prompt: string;
  productTitle: string;
  adCopy?: string;
  style?: ImageStyle;
  aspect?: ImageAspect;
}

export interface GenerateAdImageSuccess {
  ok: true;
  imageUrl: string;
  provider: Exclude<ImageProvider, 'none'>;
  model: string;
  warning?: string;
}

export interface GenerateAdImageFailure {
  ok: false;
  reason: 'no_provider' | 'generation_failed' | 'invalid_input';
  message?: string;
}

export type GenerateAdImageResult = GenerateAdImageSuccess | GenerateAdImageFailure;

export interface ImageProviderHealth {
  ok: boolean;
  provider: ImageProvider;
  reason?: 'no_provider';
}

const STYLE_DESCRIPTORS: Record<ImageStyle, string> = {
  lifestyle:
    'cinematic lifestyle photography, natural daylight, authentic real-home environment, shallow depth of field, candid feel',
  product:
    'clean studio product shot on seamless white background, soft even lighting, crisp detail, ecommerce hero angle',
  ugc:
    'iPhone-style user generated content photo, slightly imperfect framing, natural indoor lighting, relatable tone, mobile aspect',
  flatlay:
    'top-down flat lay styling, neutral background, complementary props arranged, editorial composition, soft shadows',
};

const ASPECT_TO_FAL: Record<ImageAspect, { image_size: string; width: number; height: number }> = {
  '1:1':  { image_size: 'square_hd',      width: 1024, height: 1024 },
  '9:16': { image_size: 'portrait_16_9',  width: 1024, height: 1792 },
  '4:5':  { image_size: 'portrait_4_3',   width: 1024, height: 1280 },
};

const ASPECT_TO_OPENAI: Record<ImageAspect, '1024x1024' | '1024x1792' | '1792x1024'> = {
  '1:1':  '1024x1024',
  '9:16': '1024x1792',
  '4:5':  '1024x1792',
};

const STORAGE_BUCKET = 'ad-creatives';
const MAX_RETRIES = 3;

function hasFal(): boolean {
  return Boolean(process.env.FAL_KEY);
}
function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getImageProvider(): ImageProvider {
  if (hasFal()) return 'fal';
  if (hasOpenAI()) return 'openai';
  return 'none';
}

export function getImageProviderHealth(): ImageProviderHealth {
  const provider = getImageProvider();
  return {
    ok: provider !== 'none',
    provider,
    reason: provider === 'none' ? 'no_provider' : undefined,
  };
}

function buildPrompt(input: GenerateAdImageInput): string {
  const style = input.style ?? 'lifestyle';
  const styleLine = STYLE_DESCRIPTORS[style];
  const copySnippet = (input.adCopy ?? '').slice(0, 220).replace(/\s+/g, ' ').trim();
  const parts = [
    `High-converting Meta/TikTok ad creative for: ${input.productTitle}.`,
    styleLine,
    copySnippet ? `Ad angle: ${copySnippet}` : '',
    'No embedded text, no watermarks, no logos. Vivid colour, strong focal point, thumb-stopping scroll appeal.',
  ].filter(Boolean);
  return parts.join(' ');
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      if (attempt < MAX_RETRIES - 1) {
        await sleep(500 * Math.pow(2, attempt));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('retry_exhausted');
}

interface FalResponse {
  images?: { url?: string }[];
  image?: { url?: string };
}

async function generateViaFal(prompt: string, aspect: ImageAspect): Promise<string> {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error('FAL_KEY missing');
  const body = {
    prompt,
    image_size: ASPECT_TO_FAL[aspect].image_size,
    num_inference_steps: 4,
    num_images: 1,
    enable_safety_checker: true,
  };
  const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
    method: 'POST',
    headers: {
      Authorization: `Key ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`fal_error_${res.status}:${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as FalResponse;
  const url = data.images?.[0]?.url ?? data.image?.url;
  if (!url) throw new Error('fal_no_url');
  return url;
}

interface OpenAIResponse {
  data?: { url?: string; b64_json?: string }[];
}

async function generateViaOpenAI(prompt: string, aspect: ImageAspect): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY missing');
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      size: ASPECT_TO_OPENAI[aspect],
      n: 1,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`openai_error_${res.status}:${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as OpenAIResponse;
  const first = data.data?.[0];
  if (first?.url) return first.url;
  if (first?.b64_json) return `data:image/png;base64,${first.b64_json}`;
  throw new Error('openai_no_url');
}

async function persistToSupabase(
  sourceUrl: string,
  ext: string
): Promise<{ url: string; warning?: string }> {
  try {
    const sb = getSupabaseAdmin();
    let bytes: Uint8Array;
    let contentType = 'image/png';
    if (sourceUrl.startsWith('data:')) {
      const match = sourceUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) return { url: sourceUrl, warning: 'invalid_data_url' };
      contentType = match[1];
      bytes = Uint8Array.from(Buffer.from(match[2], 'base64'));
    } else {
      const dl = await fetch(sourceUrl);
      if (!dl.ok) return { url: sourceUrl, warning: 'download_failed' };
      contentType = dl.headers.get('content-type') || contentType;
      bytes = new Uint8Array(await dl.arrayBuffer());
    }

    const path = `${new Date().toISOString().slice(0, 10)}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    const { error } = await sb.storage.from(STORAGE_BUCKET).upload(path, bytes, {
      contentType,
      upsert: false,
    });
    if (error) {
      return { url: sourceUrl, warning: `storage_upload_failed:${error.message}` };
    }
    const { data } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return { url: data.publicUrl };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown';
    return { url: sourceUrl, warning: `persist_failed:${message}` };
  }
}

export async function generateAdImage(
  input: GenerateAdImageInput
): Promise<GenerateAdImageResult> {
  if (!input.productTitle || input.productTitle.trim().length < 2) {
    return { ok: false, reason: 'invalid_input', message: 'productTitle required' };
  }

  const provider = getImageProvider();
  if (provider === 'none') {
    return { ok: false, reason: 'no_provider' };
  }

  const prompt = input.prompt?.trim() ? input.prompt : buildPrompt(input);
  const aspect: ImageAspect = input.aspect ?? '1:1';

  try {
    const rawUrl = await withRetry(() =>
      provider === 'fal' ? generateViaFal(prompt, aspect) : generateViaOpenAI(prompt, aspect)
    );
    const ext = rawUrl.startsWith('data:') ? 'png' : (rawUrl.split('?')[0].split('.').pop() || 'png').toLowerCase().slice(0, 4);
    const persisted = await persistToSupabase(rawUrl, ext);
    return {
      ok: true,
      imageUrl: persisted.url,
      provider,
      model: provider === 'fal' ? 'fal-ai/flux/schnell' : 'gpt-image-1',
      warning: persisted.warning,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    return { ok: false, reason: 'generation_failed', message };
  }
}
