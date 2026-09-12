// Запуск обученной модели поиска 8 точек стопы прямо в браузере, через
// ONNX Runtime Web (WASM) - без сервера, без Python, всё на телефоне клиента.
//
// ВАЖНО про порядок каналов (RGB vs BGR) и нормализацию: модель обучалась
// в MMPose с preprocessor'ом mean=[123.675,116.28,103.53] std=[58.395,57.12,57.375]
// в порядке R,G,B (стандартный ImageNet). Canvas в браузере тоже отдаёт
// пиксели в порядке R,G,B,A - поэтому здесь НЕ нужно менять местами каналы,
// просто вычесть mean и поделить на std в том же порядке. Если перепутать
// R и B местами - модель будет выдавать случайный мусор без явной ошибки,
// поэтому именно этот момент перепроверить в первую очередь при отладке.

import * as ort from 'onnxruntime-web';

export const KEYPOINT_NAMES = [
  'big_toe', 'toe_2', 'toe_3', 'toe_4', 'little_toe',
  'heel', 'outer_edge', 'inner_edge',
] as const;

const MODEL_INPUT_SIZE = 256;
const MEAN = [123.675, 116.28, 103.53];
const STD = [58.395, 57.12, 57.375];

export interface Keypoint {
  x: number; // в координатах ИСХОДНОГО видео-кадра (videoWidth x videoHeight)
  y: number;
  confidence: number; // 0..1, чем выше - тем увереннее модель
}

export interface CropRect {
  // квадратная область кадра, которую мы вырезаем и скармливаем модели -
  // нужно для перевода координат точек обратно в пиксели видео
  x: number;
  y: number;
  size: number;
}

let sessionPromise: Promise<ort.InferenceSession> | null = null;

export function loadFootModel(): Promise<ort.InferenceSession> {
  if (!sessionPromise) {
    // Файлы движка (.wasm/.mjs) грузим с CDN (jsdelivr), а не со своего
    // сервера - так официально советует сама документация ONNX Runtime
    // Web. На своём сервере (self-host) в Safari на iPhone эти файлы
    // падали с невнятной ошибкой "Importing a module script failed" -
    // похоже на особенность того, как Safari подгружает JS-модули с
    // нашего нового поддомена/пути. CDN уже проверен тысячами проектов
    // и отдаёт правильные заголовки (включая CORS), поэтому надёжнее.
    // Версия закреплена (1.29.0), чтобы CDN не подсунул другую версию,
    // несовместимую с той, что стоит у нас в package.json.
    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.29.0/dist/';
    // Многопоточный WASM требует специальных HTTP-заголовков сервера
    // (Cross-Origin-Opener-Policy/Cross-Origin-Embedder-Policy), которых
    // на сайте нет - без них SharedArrayBuffer недоступен и всё тихо
    // сломается. Явно просим 1 поток - тот же .wasm-файл прекрасно
    // работает и в один поток, просто чуть медленнее.
    ort.env.wasm.numThreads = 1;
    sessionPromise = ort.InferenceSession.create('/model/model.onnx', {
      executionProviders: ['wasm'],
    });
  }
  return sessionPromise;
}

// Центральный квадратный вырез кадра - такой же формат, в каком модель
// видела картинки при обучении (256x256, стопа занимает большую часть кадра).
export function getCenterCropRect(videoWidth: number, videoHeight: number): CropRect {
  const size = Math.min(videoWidth, videoHeight);
  return {
    x: (videoWidth - size) / 2,
    y: (videoHeight - size) / 2,
    size,
  };
}

function preprocess(video: HTMLVideoElement, crop: CropRect, scratchCanvas: HTMLCanvasElement): Float32Array {
  scratchCanvas.width = MODEL_INPUT_SIZE;
  scratchCanvas.height = MODEL_INPUT_SIZE;
  const ctx = scratchCanvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(
    video,
    crop.x, crop.y, crop.size, crop.size,
    0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE
  );
  const { data } = ctx.getImageData(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);

  // CHW float32: [R-канал целиком, затем G, затем B] - формат, который
  // ожидает ONNX-модель (батч=1, каналы=3, высота, ширина).
  const pixelCount = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;
  const chw = new Float32Array(3 * pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    chw[i] = (r - MEAN[0]) / STD[0];
    chw[pixelCount + i] = (g - MEAN[1]) / STD[1];
    chw[2 * pixelCount + i] = (b - MEAN[2]) / STD[2];
  }
  return chw;
}

/** Прогоняет модель на текущем кадре видео. Возвращает 8 точек в координатах
 * исходного видео (можно рисовать поверх <video> напрямую), либо null,
 * если видео ещё не готово. */
export async function detectFootKeypoints(
  video: HTMLVideoElement,
  scratchCanvas: HTMLCanvasElement
): Promise<Keypoint[] | null> {
  if (video.readyState < 2 || video.videoWidth === 0) return null;

  const session = await loadFootModel();
  const crop = getCenterCropRect(video.videoWidth, video.videoHeight);
  const chw = preprocess(video, crop, scratchCanvas);

  const inputTensor = new ort.Tensor('float32', chw, [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]);
  const results = await session.run({ input: inputTensor });
  const output = results.keypoints.data as Float32Array; // (1,8,3) -> 24 чисел подряд: x,y,conf x8

  const scale = crop.size / MODEL_INPUT_SIZE; // перевод из 256-координат модели обратно в пиксели видео
  const points: Keypoint[] = [];
  for (let i = 0; i < 8; i++) {
    const x = output[i * 3] * scale + crop.x;
    const y = output[i * 3 + 1] * scale + crop.y;
    const confidence = output[i * 3 + 2];
    points.push({ x, y, confidence });
  }
  return points;
}
