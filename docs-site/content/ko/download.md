# 다운로드

최신 버전은 [GitHub Releases 페이지](https://github.com/studio-mizutama/MizutamaConte/releases) 에서 받을 수 있습니다. 각 릴리스에 Mac / Windows / Linux 용 바이너리를 순차적으로 추가하고 있습니다. 원하는 파일이 보이지 않는 경우, 아래의 **Web 버전** 또는 **직접 빌드** 를 이용하세요.

## ⚠️ 서명 없음·자기 책임 사용 안내

> **이 앱은 코드 서명·공증(notarization)을 하지 않았습니다.**
> **설치·실행은 본인 책임으로 진행해 주세요.** OS 의 보안 기능으로 인해 경고가 표시되지만, 이는 서명되지 않은 앱에 대한 표준적인 동작입니다.
> 다운로드는 **반드시 공식 저장소(studio-mizutama/MizutamaConte)에서만** 받으세요. 제3자가 재배포한 바이너리는 사용하지 마세요.

## macOS 최초 실행 절차

서명되지 않은 앱은 Gatekeeper 에 의해 최초 실행이 차단됩니다. 아래 방법 중 하나로 실행하세요.

### 방법 1：Finder 에서 열기(권장)

1. `Mizutama Conte.app` 을 **우클릭(Control + 클릭)** 합니다.
2. 메뉴에서 **「열기」** 를 선택합니다.
3. 표시된 대화 상자에서 다시 **「열기」** 를 선택합니다.

한 번 이 절차로 실행하면, 다음부터는 평소처럼 더블클릭으로 열 수 있습니다.

### 방법 2：터미널에서 quarantine 속성 제거

앱을 `응용 프로그램` 폴더로 옮긴 다음, 터미널에서 다음 명령을 실행합니다.

```sh
xattr -dr com.apple.quarantine "/Applications/Mizutama Conte.app"
```

### 그 밖의 선택지

- 저장소를 클론하여 **직접 빌드** 합니다.
- 설치가 필요 없는 **Web 버전**(아래 참조)을 사용합니다.

## Windows 최초 실행 절차

서명되지 않았기 때문에 SmartScreen 이 「Windows의 PC 보호」 메시지를 표시할 수 있습니다.

1. 대화 상자의 **「추가 정보」** 를 클릭합니다.
2. **「실행」** 을 클릭합니다.

## Web 버전(설치 불필요)

브라우저에서 바로 사용할 수 있는 Web 버전도 공개하고 있습니다.

- <https://studio-mizutama.github.io/MizutamaConte/>

다운로드나 설치가 필요 없으며, 파일 읽기·쓰기에는 브라우저의 File System Access API 를 사용합니다.
