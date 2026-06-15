import React, { useState, useEffect, useRef, useGlobal } from 'reactn';
import {
  DialogContainer,
  Dialog,
  Heading,
  Content,
  ButtonGroup,
  Button,
  RadioGroup,
  Radio,
  ProgressBar,
  Flex,
  Text,
} from '@adobe/react-spectrum';
import { useProject } from 'hooks/useProject';
import { usePsd } from 'hooks/usePsd';
import { useT } from 'i18n';
import { exportVideo, totalFrames, ExportControl } from 'video/exportVideo';
import { downloadOrSaveVideo } from 'video/saveVideo';
import type { VideoQuality } from 'video/quality';

type Phase = 'options' | 'encoding';

/**
 * 動画書き出しの駆動役。videoExportRequested が立つと品質選択ダイアログを出し、
 * 書き出し開始でエンコード→進捗表示→出力（Web=DL / Electron=保存）を行う。PrintHost と対の構造。
 */
export const VideoExportHost: React.FC = () => {
  const t = useT();
  const [requested, setRequested] = useGlobal('videoExportRequested');
  const { frame, fps } = useProject();
  const cuts = usePsd();
  const fileName = useGlobal('globalFileName')[0];
  const baseName = fileName.replace(/\.json$/i, '');

  const [phase, setPhase] = useState<Phase>('options');
  const [quality, setQuality] = useState<VideoQuality>('high');
  const [progress, setProgress] = useState(0);
  const controlRef = useRef<ExportControl>({ canceled: false });

  // メニュー（Electron）からの要求を購読してフラグを立てる
  useEffect(() => {
    if (!window.api?.onExportVideoRequest) return;
    const handler = () => setRequested(true);
    window.api.onExportVideoRequest(handler);
    return () => window.api?.removeExportVideoRequest?.();
  }, [setRequested]);

  // CUT 0 件では何もしない（メニュー/ボタン無効化への二重防御）
  useEffect(() => {
    if (requested && cuts.length === 0) setRequested(false);
  }, [requested, cuts.length, setRequested]);

  const close = () => {
    setRequested(false);
    setPhase('options');
    setProgress(0);
    controlRef.current = { canceled: false };
  };

  const runExport = async () => {
    setPhase('encoding');
    setProgress(0);
    controlRef.current = { canceled: false };
    try {
      const bytes = await exportVideo(
        cuts,
        frame,
        fps,
        quality,
        (p) => setProgress(p.total ? Math.round((p.frame / p.total) * 100) : 0),
        controlRef.current,
      );
      if (bytes) await downloadOrSaveVideo(bytes, baseName);
    } catch (e) {
      console.error('video export failed', e);
    } finally {
      close();
    }
  };

  if (!requested || cuts.length === 0) return null;
  const total = totalFrames(cuts);
  const currentFrame = Math.round((progress / 100) * total);

  return (
    <DialogContainer
      onDismiss={() => {
        if (phase === 'options') close();
      }}
    >
      <Dialog>
        <Heading>{t('videoExport.title')}</Heading>
        <Content>
          {phase === 'options' ? (
            <RadioGroup
              label={t('videoExport.quality.label')}
              value={quality}
              onChange={(v) => setQuality(v as VideoQuality)}
            >
              <Radio value="high">{t('videoExport.quality.high')}</Radio>
              <Radio value="medium">{t('videoExport.quality.medium')}</Radio>
            </RadioGroup>
          ) : (
            <Flex direction="column" gap="size-100">
              <ProgressBar label={t('videoExport.encoding')} value={progress} />
              <Text>{t('videoExport.frameCount', { frame: currentFrame, total })}</Text>
            </Flex>
          )}
        </Content>
        <ButtonGroup>
          {phase === 'options' ? (
            <>
              <Button variant="secondary" onPress={close}>
                {t('common.cancel')}
              </Button>
              <Button variant="cta" onPress={runExport}>
                {t('videoExport.start')}
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              onPress={() => {
                controlRef.current.canceled = true;
              }}
            >
              {t('common.cancel')}
            </Button>
          )}
        </ButtonGroup>
      </Dialog>
    </DialogContainer>
  );
};
