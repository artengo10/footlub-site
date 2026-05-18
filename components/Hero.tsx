import Image from 'next/image';
import styles from './Hero.module.css';

const athletes = [
  { name: 'Алексей Воронов', sport: 'Триатлонист, Ironman финишёр', initials: 'АВ', color: '#4f8ef7' },
  { name: 'Марина Соколова', sport: 'МС по лёгкой атлетике', initials: 'МС', color: '#34c77b' },
  { name: 'Денис Краснов', sport: 'Профессиональный баскетболист', initials: 'ДК', color: '#f7894f' },
];

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>

        <div className={styles.left}>
          <h1 className={styles.title}>
            Индивидуальная стелька,<br className={styles.br} />{' '}
            <span className={styles.accent}>созданная под вашу стопу</span>
          </h1>
          <a href="https://apps.apple.com/app/id6770307442" target="_blank" rel="noopener noreferrer" className={styles.cta}>
            Скачать приложение
          </a>
        </div>

        <div className={styles.right}>
          <Image
            src="/insole.png"
            alt="Стелька FootLub — индивидуальные спортивные стельки из TPU"
            width={500}
            height={500}
            className={styles.image}
            priority
          />
        </div>

        <div className={styles.proof}>
          <div className={styles.stars}>★★★★★</div>
          <p className={styles.recommendText}>Рекомендуют спортсмены</p>
          <div className={styles.athletes}>
            {athletes.map((a) => (
              <div key={a.name} className={styles.athlete}>
                <div className={styles.avatar} style={{ background: a.color }}>
                  {a.initials}
                </div>
                <div>
                  <div className={styles.athleteName}>{a.name}</div>
                  <div className={styles.athleteSport}>{a.sport}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
