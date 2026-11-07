/// <reference lib="webworker" />
// On-device background removal. Models are downloaded once from the Hugging Face hub and cached by the browser.
import { pipeline, env, type RawImage } from '@huggingface/transformers';

env.allowLocalModels = false;

const MODELS = {
  object: { id: 'onnx-community/BiRefNet_lite-ONNX', dtype: 'fp16' }, // MIT licence, any subject
  portrait: { id: 'Xenova/modnet', dtype: 'fp32' }, // Apache-2.0, people
} as const;

const loaded = new Map<string, Promise<any>>();

async function getPipe(kind: keyof typeof MODELS) {
  const m = MODELS[kind];
  if (!loaded.has(kind)) {
    const device = (self.navigator as any).gpu ? 'webgpu' : 'wasm';
    const p = pipeline('background-removal', m.id, {
      device,
      dtype: m.dtype as any,
      progress_callback: (e: any) => {
        if (e.status === 'progress' && e.total) (self as any).postMessage({ type: 'progress', loaded: e.loaded, total: e.total, file: e.file });
      },
    } as any).catch(async (err) => {
      if (device === 'webgpu') {
        return pipeline('background-removal', m.id, { device: 'wasm', dtype: m.dtype as any } as any);
      }
      throw err;
    });
    loaded.set(kind, p);
    p.catch(() => loaded.delete(kind));
  }
  return loaded.get(kind)!;
}

self.onmessage = async (e: MessageEvent) => {
  const { id, src, kind } = e.data as { id: number; src: string; kind: keyof typeof MODELS };
  try {
    const pipe = await getPipe(kind);
    (self as any).postMessage({ type: 'status', id, status: 'running' });
    const out = (await pipe(src)) as RawImage;
    const data = out.data as Uint8ClampedArray;
    (self as any).postMessage({ type: 'done', id, width: out.width, height: out.height, channels: out.channels, data }, [data.buffer]);
  } catch (err: any) {
    (self as any).postMessage({ type: 'error', id, message: String(err?.message ?? err) });
  }
};
