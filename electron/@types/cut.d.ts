import { Psd } from 'ag-psd';

export interface Cut {
  picture?: Psd;
  cameraWork?: CameraWork;
  action?: Action;
  dialogue?: string;
  time?: number;
}

export interface Action {
  fadeIn?: 'None' | 'White In' | 'Black In' | 'Cross';
  fadeInDuration?: number;
  fadeOut?: 'None' | 'White Out' | 'Black Out' | 'Cross';
  fadeOutDuration?: number;
  text?: string;
}

export interface CameraWork {
  position?: { in: { x: number; y: number }; out: { x: number; y: number } };
  scale?: { in: number; out: number };
}
