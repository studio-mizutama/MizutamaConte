import { useGlobal } from 'reactn';

export type ToolName = 'Select' | 'Crop' | 'Text';

/** tool グローバル（単一選択 Set）から現在のツールを解決する。不正値は Select */
export const activeTool = (tool: Set<string> | undefined): ToolName => {
  const first = tool ? tool.values().next().value : undefined;
  return first === 'Crop' || first === 'Text' ? first : 'Select';
};

/** 現在の編集ツールを返すフック */
export const useTool = (): ToolName => activeTool(useGlobal('tool')[0]);
