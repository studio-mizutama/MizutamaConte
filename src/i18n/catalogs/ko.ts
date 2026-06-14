import { TranslationKey } from './en';

/** 韓国語カタログ。en と同じキー集合を満たす必要がある（型で強制）。 */
export const ko: Record<TranslationKey, string> = {
  // 공통
  'common.cancel': '취소',
  'common.save': '저장',
  'common.loading.heading': '로딩 중...',
  'common.loading.ariaLabel': '로딩 중…',

  // 헤더
  'header.tab.edit': '편집',
  'header.tab.preview': '미리보기',
  'header.save.readOnly': '읽기 전용',
  'header.save.dirty': '저장 안 됨',
  'header.save.saving': '저장 중…',
  'header.save.saved': '저장됨',
  'header.save.error': '⚠ 저장 오류',
  'header.menu.ariaLabel': '메뉴',
  'header.menu.new': '새로 만들기',
  'header.menu.open': '열기',

  // 콘티 본문
  'conte.scene.expand': '씬 펼치기',
  'conte.scene.collapse': '씬 접기',
  'conte.scene.titleAriaLabel': '씬 {n} 제목',
  'conte.scene.untitledPlaceholder': '(제목 없는 씬)',
  'conte.scene.removeBreak': '씬 구분 해제',
  'conte.gutterAria': 'CUT {n}에 레이어 삽입',
  'conte.insertLayerAria': '새 레이어 삽입',
  'conte.newLayer': '새 레이어',
  'conte.newCut': 'CUT 추가',
  'conte.newScene': '새 씬',
  'conte.merge': '위아래 CUT 병합',
  'conte.mergeAria': 'CUT {n}을 다음과 병합',

  // 컷 행
  'cutRow.resizeAria': 'CUT {n} 크기 조정',
  'cutRow.splitAria': 'CUT {n}의 마지막 레이어 분리',
  'cutRow.splitTooltip': '마지막 레이어를 새 CUT으로 분리',
  'cutRow.openHint': '{name}을 더블클릭하여 페인트 앱에서 열기',
  'cutRow.launchFailed': '페인트 앱을 실행할 수 없습니다: {error}',
  'cutRow.webEditHint': '{name}을 로컬 페인트 앱에서 편집하세요.\n저장 후 프로젝트를 다시 열면 반영됩니다.',

  // 카메라 워크
  'cameraWork.swapScale': 'Scale In/Out 교체',
  'cameraWork.swapPosX': 'Pos X In/Out 교체',
  'cameraWork.swapPosY': 'Pos Y In/Out 교체',

  // 패널 제목
  'panels.transition': '트랜지션',
  'panels.cameraWork': '카메라 워크',
  'panels.outline': '아웃라인',
  'panels.duration': '길이',
  'panels.dialogue': '대사',

  // 도구
  'toolGroup.select': '선택 (V)',
  'toolGroup.crop': '자르기 (C)',
  'toolGroup.text': '텍스트 (T)',

  // 트랜지션
  'transition.fadeIn': '페이드 인',
  'transition.fadeOut': '페이드 아웃',
  'transition.duration': '길이',
  'transition.fade.none': '없음',
  'transition.fade.whiteIn': '화이트 인',
  'transition.fade.blackIn': '블랙 인',
  'transition.fade.whiteOut': '화이트 아웃',
  'transition.fade.blackOut': '블랙 아웃',
  'transition.fade.cross': '크로스',

  // Duration 패널
  'duration.label': 'Cut{cut} 길이 · {sec}초 @ {fps}fps',
  'duration.ariaLabel': '길이',

  // 설정 다이얼로그
  'settings.title': '설정',
  'settings.section.appearance': '표시',
  'settings.language.label': '언어',
  'settings.theme.label': '테마',
  'settings.theme.system': '시스템',
  'settings.theme.light': '라이트',
  'settings.theme.dark': '다크',
  'settings.section.project': '프로젝트',
  'settings.project.resolutionAspect': '해상도: {resolution} ／ 화면비: {aspect}',
  'settings.project.frameFps': '프레임: {width} × {height} ／ fps: {fps}',
  'settings.project.note': '※ 해상도·화면비는 새로 만들 때 지정합니다(기존 프로젝트에서는 변경할 수 없습니다)',
  'settings.section.paintApp': '페인트 앱',
  'settings.paintApp.modeLabel': '실행 방법',
  'settings.paintApp.mode.auto': '자동(설치된 앱 감지)',
  'settings.paintApp.mode.custom': '수동 지정',
  'settings.paintApp.pathLabel': '앱 경로',
  'settings.paintApp.browse': '찾아보기…',
  'settings.paintApp.detect': '설치된 앱 감지',
  'settings.paintApp.noneDetected': '없음(OS 기본 앱으로 열림)',

  // 새 프로젝트 다이얼로그
  'newProject.title': '새 프로젝트',
  'newProject.titleLabel': '제목',
  'newProject.resolutionLabel': '해상도',
  'newProject.aspectLabel': '화면비',
  'newProject.create': '만들기',
};
