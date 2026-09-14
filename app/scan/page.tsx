'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './scan.module.css';
import { detectFootKeypoints, getCenterCropRect, OneEuroFilter, type Keypoint } from '../../lib/footModel';

type Phase = 'intro' | 'loading' | 'scanning' | 'foot-switch' | 'error' | 'done';
type AlignState = 'searching' | 'too-far' | 'too-close' | 'off-center' | 'aligned';
type FootSide = 'right' | 'left';

interface Step {
  label: string;
  instruction: string;
}

interface Capture {
  side: FootSide;
  label: string;
  dataUrl: string;
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

// Индексы точек (см. KEYPOINT_NAMES в lib/footModel.ts: big_toe=0, toe_2=1,
// toe_3=2, toe_4=3, little_toe=4, heel=5, outer_edge=6, inner_edge=7), которые
// реально видно на КАЖДОМ конкретном ракурсе - на боковых фото стопы видно
// не все 8 точек, а только те, что смотрят на камеру. Проверяем и рисуем
// только их, а не все 8 подряд - иначе для невидимых на этом ракурсе точек
// модель выдаёт шумные, случайно блуждающие координаты (её этому не учили),
// и они мешают и визуально, и при проверке "встал ли ты правильно".
const STEP_KEYPOINTS: number[][] = [
  [0, 1, 2, 3, 4, 6, 7], // Сверху - все, кроме пятки (её не видно сверху)
  [4, 5, 6],             // Внешняя сторона - мизинец, пятка, внешний край
  [0, 5, 7],             // Внутренняя сторона - большой палец, пятка, внутренний край (свод)
  [0, 1, 2, 3, 4, 5, 6, 7], // Подошва - видно всё
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
  // Сканируем ОБЕ стопы по очереди (4 ракурса на правую, потом 4 на левую) -
  // для стельки нужна пара, не одна стопа. Модель сама точки искать умеет
  // на любой стопе (синтетика при обучении включала обе) - тут просто
  // порядок съёмки на уровне сайта, сама модель про "лево/право" не знает.
  const [footSide, setFootSide] = useState<FootSide>('right');
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [debugInfo, setDebugInfo] = useState('');
  const [modelReady, setModelReady] = useState(false);
  // 'environment' - задняя камера (удобна для вида сверху), 'user' - фронтальная
  // (её удобнее использовать, положив телефон на пол экраном вверх, для боковых
  // ракурсов и подошвы - см. переписку). Зеркалим ТОЛЬКО картинку на экране
  // (CSS) для привычного вида - на то, что видит модель, это не влияет:
  // canvas.drawImage(video) всегда берёт сырой, незеркальный кадр из видео,
  // CSS-трансформации на это никак не действуют (проверено по документации).
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

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
  const footSideRef = useRef<FootSide>('right');
  // Нужен, чтобы цикл распознавания (detectionLoop) не пытался авто-снимать
  // кадр, пока показан промежуточный экран "переложи на левую стопу" -
  // сам цикл работает непрерывно (камеру между стопами не выключаем).
  const phaseRef = useRef<Phase>('intro');

  useEffect(() => {
    stepIndexRef.current = stepIndex;
  }, [stepIndex]);

  useEffect(() => {
    footSideRef.current = footSide;
  }, [footSide]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  // Открывает камеру с указанной стороны (не трогая цикл распознавания -
  // он продолжает читать videoRef.current, ему всё равно, откуда взялся поток).
  async function openCamera(mode: 'environment' | 'user') {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 1280 } },
      audio: false,
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  }

  async function switchCamera() {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    try {
      await openCamera(next);
      setFacingMode(next);
    } catch (err) {
      console.error('Не удалось переключить камеру:', err);
    }
  }

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
    setCaptures((prev) => [
      ...prev,
      { side: footSideRef.current, label: STEPS[stepIndexRef.current].label, dataUrl },
    ]);
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

    // Рисуем только точки, которые реально должны быть видны на ТЕКУЩЕМ
    // ракурсе (см. STEP_KEYPOINTS) - для остальных модель не обучена и может
    // выдать случайно блуждающую координату, показывать её только запутывает.
    const expected = STEP_KEYPOINTS[stepIndexRef.current];
    for (const i of expected) {
      const p = points[i];
      if (!p || p.confidence < MIN_CONFIDENCE) continue;
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
            if (footSideRef.current === 'right') {
              // Правая стопа готова - не выключаем камеру, переходим к левой.
              speak('Отлично, правая стопа готова. Теперь левая стопа');
              setPhase('foot-switch');
            } else {
              stopCamera();
              setPhase('done');
            }
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

  function evaluateAlignment(points: Keypoint[], video: HTMLVideoElement, expected: number[]): AlignState {
    // Смотрим только на точки, ожидаемые для ЭТОГО ракурса (см. STEP_KEYPOINTS) -
    // например, сбоку пятку/большой палец видно, а мизинец нет, и требовать
    // его уверенного обнаружения бессмысленно - там физически другая нога.
    const relevant = expected.map((i) => points[i]).filter(Boolean);
    const good = relevant.filter((p) => p.confidence >= MIN_CONFIDENCE);
    const minGood = Math.max(2, expected.length - 1); // допускаем максимум 1 промах
    if (good.length < minGood) return 'searching';

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

    if (!inferBusyRef.current && phaseRef.current === 'scanning') {
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
          const state = evaluateAlignment(points, video, STEP_KEYPOINTS[stepIndexRef.current]);
          if (DEBUG && performance.now() - lastDebugUpdateRef.current > 250) {
            lastDebugUpdateRef.current = performance.now();
            const expected = STEP_KEYPOINTS[stepIndexRef.current];
            const avgConf = expected.reduce((s, i) => s + points[i].confidence, 0) / expected.length;
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

  function continueToLeftFoot() {
    setFootSide('left');
    footSideRef.current = 'left';
    setStepIndex(0);
    setPhase('scanning');
  }

  async function startScan() {
    setErrorMsg('');
    setPhase('loading');
    setFootSide('right');
    footSideRef.current = 'right';
    try {
      // Модель (~несколько МБ) грузится и разогревается заранее, чтобы не
      // тормозить первый кадр съёмки.
      await detectFootKeypoints(
        document.createElement('video'),
        scratchCanvasRef.current ?? document.createElement('canvas')
      ).catch(() => null);
      setModelReady(true);

      await openCamera(facingMode);

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
      // На первом шаге новой стопы (stepIndex===0) уточняем голосом, какая
      // именно стопа сейчас снимается - дальше по шагам это и так понятно.
      const prefix = stepIndex === 0 ? (footSide === 'right' ? 'Правая стопа. ' : 'Левая стопа. ') : '';
      speak(prefix + STEPS[stepIndex].instruction);
    }
  }, [stepIndex, phase, footSide]);

  return (
    <div className={styles.page}>
      <div className={`${styles.stage} ${phase !== 'scanning' ? styles.stageHidden : ''}`}>
        <video
          ref={videoRef}
          className={styles.video}
          style={facingMode === 'user' ? { transform: 'scaleX(-1)' } : undefined}
          muted
          playsInline
        />
        <canvas ref={overlayCanvasRef} className={styles.overlayCanvas} />
        {phase === 'scanning' && (
          <>
            <div className={styles.switchCameraGroup}>
              <button
                type="button"
                className={styles.switchCameraButton}
                onClick={switchCamera}
                aria-label="Переключить камеру"
              >
                ⟲
              </button>
              <span className={styles.switchCameraHint}>Переверните камеру для удобства</span>
            </div>
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
            стопу на видео и подсказывает голосом и вибрацией, как её держать — снимем по 4 ракурса
            с каждой стопы (сначала правая, потом левая), 8 фото всего.
          </p>
          <button className={styles.startButton} onClick={startScan}>
            Начать скан
          </button>
        </div>
      )}

      {phase === 'foot-switch' && (
        <div className={styles.intro}>
          <h1>Правая стопа готова!</h1>
          <p>Теперь переложи камеру (или стопу) и отсканируем левую стопу — те же 4 ракурса.</p>
          <button className={styles.startButton} onClick={continueToLeftFoot}>
            Сканировать левую стопу
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
          <p>Обе стопы сняты — по 4 ракурса на каждую.</p>
          <h2 className={styles.thumbGroupTitle}>Правая стопа</h2>
          <div className={styles.thumbGrid}>
            {captures
              .filter((c) => c.side === 'right')
              .map((c, i) => (
                <img key={i} src={c.dataUrl} className={styles.thumb} alt={c.label} />
              ))}
          </div>
          <h2 className={styles.thumbGroupTitle}>Левая стопа</h2>
          <div className={styles.thumbGrid}>
            {captures
              .filter((c) => c.side === 'left')
              .map((c, i) => (
                <img key={i} src={c.dataUrl} className={styles.thumb} alt={c.label} />
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
