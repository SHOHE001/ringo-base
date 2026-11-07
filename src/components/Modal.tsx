import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

type ModalProps = {
  labelledBy: string;
  children: ReactNode;
  onEscape?: () => void;
};

const FOCUSABLE =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/**
 * 画面中央のモーダル。開いたときのフォーカス移動と Tab の循環、
 * 閉じたときのフォーカス復元だけを担当する。
 */
export function Modal({ labelledBy, children, onEscape }: ModalProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const escapeRef = useRef(onEscape);
  escapeRef.current = onEscape;

  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const card = cardRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () =>
      card
        ? Array.from(card.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
            (element) => element.offsetParent !== null,
          )
        : [];

    const first = focusables()[0];
    (first ?? card)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (escapeRef.current) {
          event.preventDefault();
          escapeRef.current();
        }
        return;
      }
      if (event.key !== 'Tab' || !card) return;

      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        card.focus();
        return;
      }

      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === firstItem || document.activeElement === card)
      ) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  return (
    <div className="modal-backdrop">
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        ref={cardRef}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}
