import type { Metadata } from 'next';
import styles from './shop.module.css';

export const metadata: Metadata = {
  title: 'Магазин — FootLub',
  description:
    'Три типа индивидуальных спортивных стелек FootLub: Базовая, Спортивная, Профессиональная. Цены от 3 000 до 4 500 ₽. Доставка по всей России.',
  alternates: { canonical: 'https://footlub.ru/shop' },
};

const products = [
  {
    name: 'Базовая',
    price: 'от 3 000 ₽',
    desc: 'Для ежедневного спорта и фитнеса. Поддерживает свод, распределяет нагрузку при ходьбе и тренировках в зале.',
    features: ['TPU 95A решётчатая структура', 'Подходит для кроссовок и кед', 'Срок службы 12+ месяцев'],
  },
  {
    name: 'Спортивная',
    price: 'от 3 700 ₽',
    desc: 'Для бега, велоспорта и командных видов спорта. Усиленная амортизация в зоне пятки и носка.',
    features: ['Усиленная зона пятки', 'Совместима с беговыми кроссовками', 'Учитывает тип пронации'],
    highlight: true,
  },
  {
    name: 'Профессиональная',
    price: 'от 4 500 ₽',
    desc: 'Для трейлраннинга, футбола и интенсивных нагрузок. Максимальная точность под форму конкретной обуви.',
    features: ['Подгонка под колодку обуви', 'Совместима с бутсами и велотуфлями', 'Повышенная износостойкость'],
  },
];

export default function ShopPage() {
  return (
    <section className={styles.section}>
      <div className="container">
        <h1 className={styles.title}>Магазин</h1>
        <p className={styles.sub}>
          Все стельки изготавливаются индивидуально после сканирования стопы в приложении FootLub.
        </p>
        <div className={styles.grid}>
          {products.map((p) => (
            <article key={p.name} className={`${styles.card} ${p.highlight ? styles.cardHighlight : ''}`}>
              {p.highlight && <div className={styles.badge}>Популярное</div>}
              <h2 className={styles.name}>{p.name}</h2>
              <div className={styles.price}>{p.price}</div>
              <p className={styles.desc}>{p.desc}</p>
              <ul className={styles.features}>
                {p.features.map((f) => (
                  <li key={f} className={styles.feature}>
                    <span className={styles.check}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href="#" className={styles.cta}>
                Заказать в приложении
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
