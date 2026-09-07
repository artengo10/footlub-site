'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './scan.module.css';

type Phase = 'intro' | 'loading' | 'scanning' | 'error' | 'done';
type AlignState = 'searching' | 'too-far' | 'too-close' | 'off-center' | 'aligned';

interface Step {
  label: string;
  instruction: string;
}

const STEPS: Step[] = [
  { label: 'Сверху', instruction: 'Направь камеру на стопу сверху, стоя на полу' },
  { label: 'Внешняя сторона', instruction: 'Поверни телефон и сними стопу с внешней стороны' },
  { label: 'Внутренняя сторона', instruction: 'Теперь сними стопу с внутренней стороны' },
  { label: 'Подошва', instruction: 'Приподними стопу и наведи камеру на подошву снизу' },
];

const HOLD_MS = 900;
const MIN_AREA_RATIO = 0.08;
const MAX_AREA_RATIO = 0.42;
const CENTER_TOLERANCE = 0.16;

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'ru-RU';
  utter.rate = 1.05;
  window.speechSynthesis.speak(utter);
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export default function ScanPage() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [errorMsg, setErrorMsg] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [alignState, setAlignState] = useState<AlignState>('searching');
  const [captures, setCaptures] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const segmenterRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const holdStartRef = useRef<number | null>(null);
  const lastSpokenStateRef = useRef<string>('');
  const stepIndexRef = useRef(0);
  const capturingRef = useRef(false);

  useEffect(() => {
    stepIndexRef.current = stepIndex;
  }, [stepIndex]);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (segmenterRef.current) {
      try {
        segmenterRef.current.close();
      } catch {
        /* noop */
      }
      segmenterRef.current = null;
    }
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  function captureFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCaptures((prev) => [...prev, dataUrl]);
  }

  function handleAlignResult(state: AlignState) {
    setAlignState(state);

    const spokenKey = `${stepIndexRef.current}:${state}`;
    if (state !== 'aligned' && lastSpokenStateRef.current !== spokenKey) {
      lastSpokenStateRef.current = spokenKey;
      if (state === 'searching') speak('Не вижу стопу в кадре');
      else if (state === 'too-far') speak('Поднеси ближе');
      else if (state === 'too-close') speak('Отодвинь немного');
      else if (state === 'off-center') speak('Помести стопу по центру');
    }

    if (state === 'aligned') {
      if (holdStartRef.current === null) {
        holdStartRef.current = performance.now();
        vibrate(60);
      } else if (!capturingRef.current && performance.now() - holdStartRef.current > HOLD_MS) {
        capturingRef.current = true;
        vibrate([80, 40, 80]);
        speak('Отлично, снято');
        captureFrame();
        window.setTimeout(() => {
          const next = stepIndexRef.current + 1;
          if (next >= STEPS.length) {
            stopCamera();
            setPhase('done');
          } else {
            setStepIndex(next);
            lastSpokenStateRef.current = '';
            holdStartRef.current = null;
            capturingRef.current = false;
          }
        }, 700);
      }
    } else {
      holdStartRef.current = null;
    }
  }

  async function detectionLoop() {
    const video = videoRef.current;
    const segmenter = segmenterRef.current;
    if (!video || !segmenter || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(detectionLoop);
      return;
    }

    try {
      const result = segmenter.segmentForVideo(video, performance.now());
      const mask = result.categoryMask;
      if (mask) {
        const width = mask.width;
        const height = mask.height;
        const data: Uint8Array = mask.getAsUint8Array();

        let minX = width, maxX = 0, minY = height, maxY = 0, count = 0;
        const step = 2; // sample every 2nd pixel for speed
        for (let y = 0; y < height; y += step) {
          for (let x = 0; x < width; x += step) {
            if (data[y * width + x] > 0) {
              count++;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        mask.close();

        const totalSampled = (width / step) * (height / step);
        const areaRatio = count / totalSampled;

        if (count < 20) {
          handleAlignResult('searching');
        } else {
          const cx = (minX + maxX) / 2 / width;
          const cy = (minY + maxY) / 2 / height;
          const centered = Math.abs(cx - 0.5) < CENTER_TOLERANCE && Math.abs(cy - 0.5) < CENTER_TOLERANCE;

          if (areaRatio < MIN_AREA_RATIO) handleAlignResult('too-far');
          else if (areaRatio > MAX_AREA_RATIO) handleAlignResult('too-close');
          else if (!centered) handleAlignResult('off-center');
          else handleAlignResult('aligned');
        }
      }
    } catch {
      /* skip this frame */
    }

    rafRef.current = requestAnimationFrame(detectionLoop);
  }

  async function startScan() {
    setErrorMsg('');
    setPhase('loading');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      const segmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        outputCategoryMask: true,
        outputConfidenceMasks: false,
      });
      segmenterRef.current = segmenter;

      setStepIndex(0);
      setPhase('scanning');
      speak(STEPS[0].instruction);
      rafRef.current = requestAnimationFrame(detectionLoop);
    } catch (err) {
      console.error(err);
      stopCamera();
      setErrorMsg(
        'Не удалось включить камеру или загрузить модуль распознавания. Проверь разрешение на камеру в браузере и подключение к интернету.'
      );
      setPhase('error');
    }
  }

  useEffect(() => {
    if (phase === 'scanning') {
      lastSpokenStateRef.current = '';
      holdStartRef.current = null;
      capturingRef.current = false;
      speak(STEPS[stepIndex].instruction);
    }
  }, [stepIndex, phase]);

  return (
    <div className={styles.page}>
      {phase === 'intro' && (
        <div className={styles.intro}>
          <h1>Скан стопы</h1>
          <p>
            Понадобится камера телефона. Мы будем подсказывать голосом и вибрацией, как
            держать стопу — снимем 4 ракурса подряд.
          </p>
          <button className={styles.startButton} onClick={startScan}>
            Начать скан
          </button>
        </div>
      )}

      {phase === 'loading' && (
        <div className={styles.intro}>
          <h1>Загрузка…</h1>
          <p>Включаем камеру и готовим распознавание.</p>
        </div>
      )}

      {phase === 'error' && (
        <div className={styles.intro}>
          <h1>Что-то пошло не так</h1>
          <p className={styles.error}>{errorMsg}</p>
          <button className={styles.startButton} onClick={startScan}>
            Попробовать снова
          </button>
        </div>
      )}

      {phase === 'scanning' && (
        <div className={styles.stage}>
          <video ref={videoRef} className={styles.video} muted playsInline />
          <div className={styles.overlay}>
            <div
              className={`${styles.targetBox} ${alignState === 'aligned' ? styles.targetBoxAligned : ''}`}
            />
          </div>
          <div className={styles.statusBar}>
            <div className={styles.statusText}>
              Шаг {stepIndex + 1}/{STEPS.length}: {STEPS[stepIndex].label}
            </div>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className={styles.captured}>
          <h1>Готово!</h1>
          <p>Все 4 ракурса сняты.</p>
          <div className={styles.thumbGrid}>
            {captures.map((src, i) => (
              <img key={i} src={src} className={styles.thumb} alt={STEPS[i]?.label ?? ''} />
            ))}
          </div>
          <button
            className={styles.startButton}
            onClick={() => {
              setCaptures([]);
              setPhase('intro');
            }}
          >
            Начать заново
          </button>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
