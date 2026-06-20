import React, { useEffect } from 'react';
import { Locale } from './content/manifest';
import Close from '@spectrum-icons/workflow/Close';

export interface ZoomMedia {
  src: string;
  isVideo: boolean;
  label: string;
}

const CLOSE_LABEL: Record<Locale, string> = { ja: '閉じる', ko: '닫기', en: 'Close' };

/* ランディングのメディアをクリックで中央・ネイティブ解像度に拡大表示するライトボックス。
   背景・メディアを問わずどこをクリックしても閉じる（Esc でも閉じる）。右上に明示的な
   閉じるボタンも置く（一応の親切）。開いている間は背面のスクロールを止める。
   SSR では zoom=null＝非描画なのでハイドレーションに影響しない。 */
export const Lightbox: React.FC<{ media: ZoomMedia; locale: Locale; onClose: () => void }> = ({ media, locale, onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-modal="true" aria-label={media.label}>
      <button className="lightbox-close" aria-label={CLOSE_LABEL[locale]} onClick={onClose}>
        <Close aria-hidden />
      </button>
      {media.isVideo ? (
        <video src={media.src} autoPlay loop muted playsInline />
      ) : (
        <img src={media.src} alt={media.label} />
      )}
    </div>
  );
};
