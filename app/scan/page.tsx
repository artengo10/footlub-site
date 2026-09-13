'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './scan.module.css';
import { detectFootKeypoints, getCenterCropRect, OneEuroFilter, type Keypoint } from '../../lib/footModel';

type Phase = 'intro' | 'loading' | 'scanning' | 'error' | 'done';
type AlignState = 'searching' | 'too-far' | 'too-close' | 'off-center' | 'aligned';

interface Step {
  label: string;
  instruction: string;
}

// Больше НЕ просим класть стопу на лист бумаги - модель находит стопу
// напрямую по картинке, лист А4 был нужен только старому (отклонённому)
// способу определения границ стопы по цвету фона.
const STEPS: Step[] = [
  { label: 'Сверху', instruction: 'Наведи камеру на стопу сверху' },
  { label: 'Внешняя сторона', instruction: 'Сними стопу с внешней стороны' },
  { label: 'Внутренняя сторона', instruction: 'Теперь сними стопу с внутренней стороны' },
  { label: 'Подошва', instruction: 'Приподними стопу и наведи камеру на подошву' },
];

const HOLD_MS = 900;
const STEP_COOLDOWN_MS = 2500; // время на разворот стопы после смены шага
// Пороги считаем по прямоугольнику, охватывающему все 8 найденных точек,
// относительно квадратной области кадра, которую видит модель (см.
// getCenterCropRect в lib/footModel.ts) - тот же принцип, что был у старой
// детекции по листу бумаги (MIN/MAX_AREA_RATIO, CENTER_TOLERANCE), только
// теперь по настоящим точкам стопы, а не по цветовому пятну.
const MIN_AREA_RATIO = 0.05;
const MAX_AREA_RATIO = 0.75;
const CENTER_TOLERANCE = 0.22;
const MIN_CONFIDENCE = 0.35; // ниже - считаем, что модель не уверена/не видит стопу
const DEBUG = true;

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
  const [, setAlignState] = useState<AlignState>('searching');
  const [captures, setCaptures] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState('');
  const [modelReady, setModelReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const scratchCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const inferBusyRef = useRef(false);
  const holdStartRef = useRef<number | null>(null);
  const lastSpokenStateRef = useRef<string>('');
  const stepIndexRef = useRef(0);
  const capturingRef = useRef(false);
  const lastDebugUpdateRef = useRef(0);
  // По одному фильтру на x и на y каждой из 8 точек - убирает дрожание между
  // кадрами (см. OneEuroFilter в lib/footModel.ts). minCutoff/beta подобраны
  // для этого случая: стопа обычно лежит неподвижно, руки чуть подрагивают -
  // нужно сильное сглаживание в покое (низкий minCutoff), но без задержки,
  // если реально двигаешь камеру (beta даёт отклик на скорость движения).
  const smoothersRef = useRef<{ x: OneEuroFilter; y: OneEuroFilter }[]>(
    Array.from({ length: 8 }, () => ({
      x: new OneEuroFilter(0.8, 0.4, 1.0),
      y: new OneEuroFilter(0.8, 0.4, 1.0),
    }))
  );

  const alignStateRef = useRef<AlignState>('searching');
  // Момент последней смены шага - сразу после неё нога ещё стоит в СТАРОМ
  // положении (уже "выровнена" под старый ракурс), поэтому таймер удержания
  // не должен запускаться первые STEP_COOLDOWN_MS - иначе снимок сделается
  // почти мгновенно, раньше, чем успеешь повернуть стопу под новый ракурс.
  const stepChangeTimeRef = useRef(0);

  useEffect(() => {
    stepIndexRef.current = stepIndex;
  }, [stepIndex]);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
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

  function drawOverlay(points: Keypoint[] | null, video: HTMLVideoElement) {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // <video> на экране показан через CSS object-fit:cover - он МАСШТАБИРУЕТ
    // и ОБРЕЗАЕТ реальный кадр под размер блока на странице. Если считать
    // масштаб просто "ширина блока / ширина видео" (без учёта обрезки),
    // точки съедут в сторону от настоящей стопы на экране. Здесь повторяем
    // ту же математику, что и у object-fit:cover, чтобы точки легли ровно
    // поверх реального изображения.
    const scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
    const offsetX = (canvas.width - video.videoWidth * scale) / 2;
    const offsetY = (canvas.height - video.videoHeight * scale) / 2;

    // Настоящая зона, которую анализирует модель - квадрат по центру КАДРА
    // (см. getCenterCropRect), а не декоративный прямоугольник, что был тут
    // раньше и не совпадал с реальной зоной анализа (точки могли "вылезать"
    // за его пределы, хотя оставались внутри настоящей зоны). Рисуем её
    // здесь же, той же математикой, что и точки - гарантированно совпадает.
    const crop = getCenterCropRect(video.videoWidth, video.videoHeight);
    ctx.strokeStyle =
      alignStateRef.current === 'aligned' ? 'rgba(61, 220, 132, 0.9)' : 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(
      crop.x * scale + offsetX,
      crop.y * scale + offsetY,
      crop.size * scale,
      crop.size * scale
    );

    if (!points) return;

    for (const p of points) {
      if (p.confidence < MIN_CONFIDENCE) continue;
      ctx.beginPath();
      ctx.arc(p.x * scale + offsetX, p.y * scale + offsetY, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(80, 220, 140, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function handleAlignResult(state: AlignState) {
    setAlignState(state);
    alignStateRef.current = state;

    const spokenKey = `${stepIndexRef.current}:${state}`;
    if (state !== 'aligned' && lastSpokenStateRef.current !== spokenKey) {
      lastSpokenStateRef.current = spokenKey;
      if (state === 'searching') speak('Не вижу стопу');
      else if (state === 'too-far') speak('Поднеси ближе');
      else if (state === 'too-close') speak('Отодвинь немного');
      else if (state === 'off-center') speak('Помести стопу по центру');
    }

    const cooldownActive = performance.now() - stepChangeTimeRef.current < STEP_COOLDOWN_MS;

    if (state === 'aligned' && !cooldownActive) {
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

  function evaluateAlignment(points: Keypoint[], video: HTMLVideoElement): AlignState {
    const good = points.filter((p) => p.confidence >= MIN_CONFIDENCE);
    if (good.length < 6) return 'searching'; // модель уверенно нашла меньше 6 из 8 точек

    const crop = getCenterCropRect(video.videoWidth, video.videoHeight);
    const xs = good.map((p) => p.x);
    const ys = good.map((p) => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);

    const areaRatio = ((maxX - minX) * (maxY - minY)) / (crop.size * crop.size);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const cropCenterX = crop.x + crop.size / 2;
    const cropCenterY = crop.y + crop.size / 2;
    const offX = Math.abs(cx - cropCenterX) / crop.size;
    const offY = Math.abs(cy - cropCenterY) / crop.size;

    if (areaRatio < MIN_AREA_RATIO) return 'too-far';
    if (areaRatio > MAX_AREA_RATIO) return 'too-close';
    if (offX > CENTER_TOLERANCE || offY > CENTER_TOLERANCE) return 'off-center';
    return 'aligned';
  }

  async function detectionLoop() {
    const video = videoRef.current;
    const scratch = scratchCanvasRef.current;
    if (!video || !scratch) {
      rafRef.current = requestAnimationFrame(() => detectionLoop());
      return;
    }

    if (!inferBusyRef.current) {
      inferBusyRef.current = true;
      try {
        const raw = await detectFootKeypoints(video, scratch);
        // Сглаживаем координаты каждой точки по времени (см. OneEuroFilter) -
        // сама уверенность (confidence) не сглаживаем, она и так используется
        // только для порога "видно/не видно".
        const now = performance.now();
        const points = raw
          ? raw.map((p, i) => {
              const s = smoothersRef.current[i];
              return { x: s.x.filter(now, p.x), y: s.y.filter(now, p.y), confidence: p.confidence };
            })
          : null;
        drawOverlay(points, video);

        if (points) {
          const state = evaluateAlignment(points, video);
          if (DEBUG && performance.now() - lastDebugUpdateRef.current > 250) {
            lastDebugUpdateRef.current = performance.now();
            const avgConf = points.reduce((s, p) => s + p.confidence, 0) / points.length;
            setDebugInfo(`avg conf: ${avgConf.toFixed(2)}\nstate: ${state}`);
          }
          handleAlignResult(state);
        } else {
          if (DEBUG && performance.now() - lastDebugUpdateRef.current > 250) {
            lastDebugUpdateRef.current = performance.now();
            setDebugInfo(`points: null\nvideo ready: ${video.readyState}, ${video.videoWidth}x${video.videoHeight}`);
          }
          handleAlignResult('searching');
        }
      } catch (e) {
        console.error('Ошибка распознавания:', e);
        // На телефоне консоль браузера не видна - показываем ошибку прямо
        // поверх видео, чтобы можно было сфотографировать и прислать текст.
        const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
        setDebugInfo(`ОШИБКА:\n${msg}`);
      } finally {
        inferBusyRef.current = false;
      }
    }

    rafRef.current = requestAnimationFrame(() => detectionLoop());
  }

  async function startScan() {
    setErrorMsg('');
    setPhase('loading');
    try {
      // Модель (~несколько МБ) грузится и разогревается заранее, чтобы не
      // тормозить первый кадр съёмки.
      await detectFootKeypoints(
        document.createElement('video'),
        scratchCanvasRef.current ?? document.createElement('canvas')
      ).catch(() => null);
      setModelReady(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStepIndex(0);
      setPhase('scanning');
      speak(STEPS[0].instruction);
      rafRef.current = requestAnimationFrame(() => detectionLoop());
    } catch (err) {
      console.error(err);
      stopCamera();
      setErrorMsg('Не удалось включить камеру или загрузить модель. Проверь разрешение на камеру в браузере.');
      setPhase('error');
    }
  }

  useEffect(() => {
    if (phase === 'scanning') {
      lastSpokenStateRef.current = '';
      holdStartRef.current = null;
      capturingRef.current = false;
      stepChangeTimeRef.current = performance.now();
      // Новый шаг - новый ракурс стопы, сглаживать "переезд" от старой
      // позиции точек к новой не нужно (иначе точки будут неправильно
      // "ехать" по экрану первые пару кадров нового шага).
      smoothersRef.current = Array.from({ length: 8 }, () => ({
        x: new OneEuroFilter(0.8, 0.4, 1.0),
        y: new OneEuroFilter(0.8, 0.4, 1.0),
      }));
      speak(STEPS[stepIndex].instruction);
    }
  }, [stepIndex, phase]);

  return (
    <div className={styles.page}>
      <div className={`${styles.stage} ${phase !== 'scanning' ? styles.stageHidden : ''}`}>
        <video ref={videoRef} className={styles.video} muted playsInline />
        <canvas ref={overlayCanvasRef} className={styles.overlayCanvas} />
        {phase === 'scanning' && (
          <>
            <div className={styles.statusBar}>
              <div className={styles.statusText}>
                Шаг {stepIndex + 1}/{STEPS.length}: {STEPS[stepIndex].label}
              </div>
            </div>
            {DEBUG && <div className={styles.debug}>{debugInfo}</div>}
          </>
        )}
      </div>

      {phase === 'intro' && (
        <div className={styles.intro}>
          <h1>Скан стопы</h1>
          <p>
            Понадобится только камера телефона — лист бумаги не нужен. Модель сама находит
            стопу на видео и подсказывает голосом и вибрацией, как её держать — снимем 4 ракурса
            подряд.
          </p>
          <button className={styles.startButton} onClick={startScan}>
            Начать скан
          </button>
        </div>
      )}

      {phase === 'loading' && (
        <div className={styles.intro}>
          <h1>Загрузка…</h1>
          <p>{modelReady ? 'Включаем камеру.' : 'Загружаем модель распознавания стопы.'}</p>
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
      <canvas ref={scratchCanvasRef} style={{ display: 'none' }} />
    </div>
  );
}
