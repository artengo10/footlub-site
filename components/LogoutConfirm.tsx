import styles from './LogoutConfirm.module.css';

type Props = {
  onConfirm: () => void;
  onCancel: () => void;
};

export default function LogoutConfirm({ onConfirm, onCancel }: Props) {
  return (
    <div className={styles.wrap}>
      <p className={styles.text}>Вы уверены, что хотите выйти?</p>
      <div className={styles.btns}>
        <button className={styles.cancel} onClick={onCancel}>Отмена</button>
        <button className={styles.confirm} onClick={onConfirm}>Выйти</button>
      </div>
    </div>
  );
}
