import { useGlobal } from 'reactn';
import { ProjectFile, ProjectSettings, FrameSize } from 'project/types';

export interface ProjectContext {
  project: ProjectFile;
  settings: ProjectSettings;
  /** 作品フレーム（画面に映る領域）のピクセルサイズ */
  frame: FrameSize;
  fps: number;
  setProject: (project: ProjectFile) => void;
}

/** プロジェクト設定への共通アクセサ。解像度・fps のハードコードはここに集約する */
export const useProject = (): ProjectContext => {
  const [project, setProject] = useGlobal('project');
  return {
    project,
    settings: project.settings,
    frame: project.settings.frame,
    fps: project.settings.fps,
    setProject,
  };
};
