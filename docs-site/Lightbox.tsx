import React, { useEffect } from 'react';

export interface ZoomMedia {
  src: string;
  isVideo: boolean;
  label: string;
}

/* ランディングのメディアをクリックで中央・ネイティブ解像度に拡大表示するライトボックス。
   背景（グレー面）クリックまたは Esc で閉じる。メディア自体のクリックでは閉じない。
   開いている間は背面のスクロールを止める。SSR では zoom=null＝非描画なのでハイドレーションに影響しない。 */
export const Lightbox: React.FC<{ media: ZoomMedia; onClose: () => void }> = ({ media, onClose }) => {
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

  const stop = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-modal="true" aria-label={media.label}>
      {media.isVideo ? (
        <video src={media.src} autoPlay loop muted playsInline onClick={stop} />
      ) : (
        <img src={media.src} alt={media.label} onClick={stop} />
      )}
    </div>
  );
};
