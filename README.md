# IIRLab Website

Intelligent and Interactive Robotics Lab (경상국립대학교 기계공학부) 홈페이지입니다.
GitHub Pages로 배포되며, 빌드 과정 없이 파일을 고치면 바로 반영됩니다.

- 주소: https://iirl-gnu.github.io
- 저장소: https://github.com/iirl-gnu/iirl-gnu.github.io

---

## 0. 관리자 화면에서 수정하기 (가장 쉬움)

**https://iirl-gnu.github.io/admin/** (사이트 맨 아래 "관리자" 링크)

뉴스, 데모 영상, 구성원, 수상, 장비, 연구 분야, 연락처를 입력 양식으로 고치고 **저장**하면
GitHub에 바로 커밋되어 1~2분 뒤 사이트에 반영됩니다. ([Sveltia CMS](https://sveltiacms.app) 사용, 설정은 `admin/config.yml`)

### 로그인 준비 (사람마다 처음 한 번)

1. 저장소 편집 권한이 있는 GitHub 계정이 필요합니다.
   학생 계정은 저장소 **Settings → Collaborators → Add people**로 초대합니다.
2. 본인 계정으로 GitHub 로그인 → https://github.com/settings/personal-access-tokens/new
   - Token name: `iirlab-admin` / Expiration: 원하는 기간 (예: 1년)
   - Resource owner: `iirl-gnu`
   - Repository access: **Only select repositories** → `iirl-gnu.github.io`
   - Permissions → Repository permissions → **Contents: Read and write**
   - **Generate token** → 나온 토큰(`github_pat_...`)을 복사
3. 관리자 화면에서 **Sign In Using Access Token** → 토큰 붙여넣기

- 토큰은 비밀번호와 같습니다. 다른 사람과 공유하지 말고, 사람마다 각자 만드세요.
- 졸업 등으로 권한을 없애려면 Collaborators에서 제거하면 그 사람의 토큰도 더 이상 쓸 수 없습니다.
- "Sign In with GitHub" 버튼은 별도 인증 서버가 필요해서 지금은 동작하지 않습니다. 토큰 로그인을 쓰세요.
- 관리자 화면에서 저장하면 yml 파일 안의 `#` 주석(작성 예시)은 지워집니다. 예시는 이 README를 참고하세요.
- 관리자 화면에서 고친 뒤 내 컴퓨터에서 작업할 때는 GitHub Desktop에서 **Fetch → Pull**을 먼저 하세요.
- 논문·특허·과제는 엑셀에서 자동 생성되므로 관리자 화면에 없습니다 (아래 1번).

## 1. 논문·특허·과제 갱신 (엑셀 → 자동)

`data/publications.yml`과 `data/projects.yml`은 **연구실적 엑셀에서 자동으로 만들어집니다.** 직접 고치지 마세요.

1. 연구실적 엑셀(`박영진_연구실적_정리.xlsx`)을 수정합니다.
2. 엑셀 파일을 `tools/update.bat` 아이콘 위로 **끌어다 놓습니다.**
   (또는 `python tools/sync_from_excel.py "엑셀 경로"`)
3. "완료!"와 항목별 건수가 나오면 GitHub Desktop에서 커밋 → Push 합니다.

엑셀에서 읽는 시트: 국제저널, 국내저널, 국제학술대회, 국내학술대회, 특허_등록, 특허_출원, 특허_국내출원, 연구과제

- 시트 이름과 **첫 줄(헤더) 이름**으로 열을 찾으므로 열 순서는 바뀌어도 됩니다. 헤더 이름은 바꾸지 마세요.
- `No` 칸에 숫자가 있는 행만 읽습니다. 메모 행은 No를 비워두면 무시됩니다.
- 연구비, 이력서 반영 여부, 비고 같은 내부 정보는 홈페이지에 올라가지 않습니다.
- 과제는 **참여 종료일**이 오늘 이후면 "진행 중"으로 표시됩니다.
- 특허_출원 시트에서 비고에 "등록" 또는 "Abandoned"가 있는 건은 제외됩니다.
- 엑셀 파일 자체는 `.gitignore`로 저장소에 올라가지 않습니다.

## 2. 그 외 내용 수정 (yml 직접 편집)

| 하고 싶은 일 | 수정할 파일 |
|---|---|
| 데모 영상 추가 | `data/demos.yml` + `media/demos/`에 영상·대표이미지 |
| 뉴스 올리기 | `data/news.yml` (맨 위에 추가) |
| 새 멤버 추가 / 졸업생 이동 | `data/people.yml` |
| 수상 실적 추가 | `data/awards.yml` (맨 위에 추가) |
| 장비 추가 | `data/equipment.yml` |
| 연구 분야 소개 수정 | `data/research.yml` |
| 연락처, 모집 문구, 메인 문구 | `data/site.yml` |

각 파일 맨 위에 작성 예시가 주석(`#`)으로 적혀 있습니다.

### 데모 영상 추가

1. `media/demos/`에 영상(mp4)과 대표 이미지(jpg)를 넣습니다. 대표 이미지가 없으면 영상 첫 장면을 캡처해서 쓰세요.
2. `data/demos.yml`에 항목을 추가합니다. `featured: true`인 영상이 홈 화면 맨 위에 자동 재생됩니다.
3. 영상은 **25MB 이하**를 권장합니다. 더 크면 GitHub 웹 업로드가 안 되고(Desktop은 100MB까지 가능), 방문자 로딩도 느려집니다.

### 사진 추가

`images/` 아래 알맞은 폴더(`people/`, `news/`, `equipment/` 등)에 사진을 넣고 yml에 경로를 적습니다.
예: `photo: images/people/hong.jpg` — 가로 1600px, 1MB 이하 권장.

### YAML 작성 시 주의

- 들여쓰기는 **스페이스 2칸**입니다. 탭(Tab)을 쓰면 안 됩니다.
- 값에 콜론(`:`)이 들어가면 따옴표로 감싸세요. 예: `title: "Design: a study"`
- 페이지에 "내용을 불러오지 못했습니다"가 나오면 대부분 들여쓰기나 따옴표 문제입니다.

## 3. 로컬에서 미리 보기

이 폴더에서:

```bash
python -m http.server 8000
```

브라우저에서 http://localhost:8000 을 엽니다. (html 파일을 더블클릭하면 데이터가 로드되지 않습니다.)

## 4. 배포 (GitHub Pages)

### 처음 한 번

1. [GitHub Desktop](https://desktop.github.com/) 설치 → `iirl-gnu` 계정으로 로그인
2. **File → Add local repository** → 이 폴더 선택 → "create a repository" 클릭
   - Name: `iirl-gnu.github.io` (이 이름이어야 주소가 `iirl-gnu.github.io`가 됩니다)
3. **Publish repository** → "Keep this code private" **체크 해제** (무료 계정은 공개 저장소만 Pages 가능)
4. github.com의 저장소 → **Settings → Pages** → Source: `Deploy from a branch`, Branch: `main` / `(root)` → Save
5. 1~2분 뒤 https://iirl-gnu.github.io 접속

### 이후 수정할 때

파일 수정 → GitHub Desktop에서 변경 내용 확인 → Summary 입력 → **Commit to main** → **Push origin**

작은 텍스트 수정은 github.com에서 파일을 열고 연필 아이콘으로 바로 고쳐도 됩니다.

## 구조

```
index.html, research.html, ...   페이지 틀 (수정할 일 거의 없음)
data/*.yml                       페이지 내용
media/demos/                     데모 영상과 대표 이미지
images/                          연구 그림, 사진
assets/css/style.css             디자인 (색상은 맨 위 :root)
assets/js/site.js                yml을 읽어 화면을 그리는 코드, 메뉴 목록
assets/img/                      로고, 파비콘
admin/                           관리자 화면 (Sveltia CMS) 과 입력 양식 설정
tools/sync_from_excel.py         엑셀 → yml 변환
tools/update.bat                 위 스크립트를 끌어다 놓기로 실행
```
