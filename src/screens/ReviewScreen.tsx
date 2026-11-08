import { reviewSessionSize, xpReview } from '../config';
import { Mascot } from '../components/Mascot';

type ReviewScreenProps = {
  /** 出題できる復習問題の数。 */
  count: number;
  onStart: () => void;
};

export function ReviewScreen({ count, onStart }: ReviewScreenProps) {
  if (count === 0) {
    return (
      <section className="empty-state" aria-labelledby="review-title">
        <Mascot mood="happy" size={128} />
        <h1 id="review-title">復習する問題はありません</h1>
        <p>レッスンでまちがえた問題が、ここにたまります。</p>
      </section>
    );
  }

  const session = Math.min(count, reviewSessionSize);

  return (
    <section className="review-screen" aria-labelledby="review-title">
      <Mascot mood="normal" size={128} />
      <h1 id="review-title">復習</h1>
      <p className="review-count">
        <strong>{count}</strong>
        <span> 問</span>
      </p>
      <p className="review-note">
        今回は {session} 問に挑戦します。正解した問題は、リストから消えます。
        最後まで終えると {xpReview} XP がもらえます。
      </p>
      <button type="button" className="btn btn-primary review-start" onClick={onStart}>
        復習する
      </button>
    </section>
  );
}
