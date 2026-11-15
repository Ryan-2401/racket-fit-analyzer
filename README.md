# AI 라켓·거트 궁합 분석기

배드민턴 동호인이 써 본 라켓 후기("헤드가 무거워서 손목이 아팠어요")를 AI가 라켓 스펙으로 번역하고, 실제 판매 라켓 28종 중 몸과 플레이 스타일에 맞는 라켓과 텐션을 추천하는 웹 앱입니다.

머신러닝 AI 앱 개발 프로젝트 · 한국교통대학교 기계공학과 김민준 (1인 프로젝트)

- 실행 중인 앱: https://claude.ai/artifact/HmqESrTm4rCDP1BARtJ9vW
- 범위: 라켓 추천을 먼저 완성했고, 거트 추천은 다음 단계입니다 (기획서의 위험 관리 계획).

## 핵심 기능 3개

1. **후기 분석 (AI ①):** 자유롭게 쓴 후기 → 선호 스펙 JSON (밸런스·강성·무게 −1~1, 텐션 −3~3lbs, 만족·불만 라켓, 근거 문구)
2. **라켓 추천 (점수 계산):** 신체 조건(손 크기·악력·손목 유연성 상·중·하), 플레이 스타일, 계절, 선호 스펙으로 목표를 정하고 라켓 DB 28종과의 거리로 순위를 매김. AI가 아니라 계산이므로 같은 조건이면 같은 결과가 나옵니다.
3. **근거 설명 (AI ②):** 조건·후기와 추천 결과를 연결해 이유를 설명. 화면에 "AI가 생성한 내용"으로 표시합니다.

검증용 화면 2개: `#lab` AI 실험실(프롬프트·모델 비교), `#check` 편향 점검(가상 사용자 567명).

## 실행 방법

### 1. 웹사이트로 배포 (누구나 링크로 사용, AI 포함) — 사용자 테스트용

`index.html`(화면)과 `api/ai.js`(AI 호출 서버 함수)를 Vercel에 올리면 `https://○○○.vercel.app` 주소가 생기고, 친구들은 계정 없이 그 링크로 바로 씁니다. API 키는 코드가 아니라 Vercel 환경 변수에만 넣습니다.

**① AI API 키 받기 (둘 중 하나)**

| | 구글 Gemini (추천: 무료) | Anthropic Claude (유료) |
| --- | --- | --- |
| 받는 곳 | aistudio.google.com → Get API key | console.anthropic.com → API Keys |
| 비용 | 무료 등급으로 충분 (카드 불필요) | 선불 크레딧 필요 (테스트 몇십 번은 몇백 원 수준) |
| 쓰는 모델 | gemini-3.5-flash-lite (quick) / gemini-3.8-flash (default) | claude-haiku-5-5 (quick) / claude-sonnet-5-5 (default) |
| 주의 | 무료 등급은 보낸 내용이 구글 제품 개선에 쓰일 수 있음 → 후기에 개인정보를 적지 않도록 앱에 안내함. API 이용은 만 18세 이상 | — |

**② GitHub에 올리기:** github.com에서 새 저장소(New repository)를 만들고 "uploading an existing file"로 이 폴더의 파일을 모두 끌어다 놓은 뒤 Commit. (`.env.example`은 올려도 되지만 실제 키가 든 파일은 절대 올리지 마세요.)

**③ Vercel에 배포:** vercel.com에 GitHub 계정으로 가입 → Add New → Project → 방금 만든 저장소 Import → **Environment Variables**에 아래를 넣고 → Deploy.

| 이름 | 값 |
| --- | --- |
| `GEMINI_API_KEY` (또는 `ANTHROPIC_API_KEY`) | ①에서 받은 키 |
| `ACCESS_CODE` (선택, 권장) | 아무 단어 (예: `badminton2026`). 넣으면 이 코드가 붙은 링크로 연 사람만 AI를 쓸 수 있어 키가 남용되지 않습니다 |

**④ 친구에게 보낼 링크:** `https://○○○.vercel.app/?code=badminton2026` (ACCESS_CODE를 안 넣었으면 `?code=` 부분 없이).

**⑤ 설문 연결:** `index.html`에서 `const SURVEY_URL = "";`에 구글 폼 링크를 넣고 GitHub에서 저장(Commit)하면 Vercel이 자동으로 다시 배포합니다. 분석이 끝나면 결과 아래에 "설문 열기" 버튼이 나타납니다.

배포 후 "AI 실험실"(`/#lab`)도 이 서버로 실행되므로, 같은 주소에서 프롬프트·모델 비교 실험을 돌릴 수 있습니다.

### 2. claude.ai에서 실행 (만든 사람용)

https://claude.ai/artifact/HmqESrTm4rCDP1BARtJ9vW — claude.ai에 로그인한 상태로 엽니다. 같은 `index.html`이 claude.ai 안에서는 아티팩트의 AI 기능을 씁니다.

### 3. 내 컴퓨터에서 파일로 실행 (AI 없이)

`index.html`을 브라우저로 열면 됩니다. AI를 부를 수 없어서 후기 해석과 설명을 기본 규칙(키워드)으로 대신하며, 화면에 그 사실을 안내합니다.

### 4. 점검 스크립트

```bash
pip install playwright
playwright install chromium
python tests/run_checks.py
```

예시 조건 4개의 추천 결과, AI 실험실 기준선(기본 규칙 60%), 가상 사용자(신체 조건 27 × 스타일 7 = 189명)의 오류 수·브랜드 분포를 출력합니다. AI는 호출하지 않습니다.

## 파일 구성

| 경로 | 내용 |
| --- | --- |
| `index.html` | 앱 화면 전체 (HTML·CSS·JavaScript 한 파일, 외부 라이브러리 없음) |
| `api/ai.js` | AI 호출 서버 함수: 접근 코드 확인, 접속자별 요청 횟수 제한(10분에 80회), 요청 길이 제한, Gemini 또는 Claude 호출 |
| `vercel.json`, `package.json`, `.env.example` | 배포 설정 (환경 변수 이름 예시, 실제 키 없음) |
| `data/rackets.csv` | 라켓 DB 28종 (앱 코드의 `RACKETS` 배열을 표로 내보낸 것) |
| `data/rackets_discontinued.csv` | 단종·구형 라켓 12종 (`REF_RACKETS`). 추천하지 않고 "써 본 라켓" 기준점과 대체 라켓 찾기에만 사용 |
| `data/lab_cases.json` | AI 실험실의 가상 후기 12개와 정답 (개발 검증용 가상 데이터) |
| `tests/run_checks.py` | 점수 계산·기준선·편향 점검 스크립트 |

## 코드 안내 (index.html의 `<script>`)

| 함수·상수 | 하는 일 |
| --- | --- |
| `RACKETS` | 라켓 DB. `bal` 1 헤드라이트~5 헤드헤비, `flex` 1 매우 유연~5 매우 딱딱, `ws` 판매 무게 옵션, `est` 추정값 여부, `id` 출처 상세 페이지 번호 |
| `readForm()` | 입력 화면 값 읽기 |
| `specPrompt()` | AI ① 프롬프트: 값의 뜻·범위, 체감 표현 예시, 추측 금지, DB 이름 목록, 후기 속 지시 무시 |
| `askJSON()` | AI 호출. 8초 넘으면 안내, 30초면 중단 |
| `normalizeSpec()` | AI 출력 검증: 범위 밖 값 자르기, DB에 없는 라켓 이름 버리기 |
| `ruleParse()` | AI 실패 시 쓰는 키워드 규칙 해석 |
| `computeTarget()` | 신체 조건·스타일·선호 스펙 → 목표 밸런스·강성·무게, 텐션 |
| `scoreRackets()` | 목표와의 거리로 점수: `100 − 24 × (0.45·밸런스차 + 0.35·강성차 + 0.2·무게차)`, 불만 라켓 −30, 만족 +4, 추정 사양 −3 |
| `groupBySpec()` | 사양이 같은 라켓을 한 묶음으로 (동점이면 저렴한 모델이 대표) |
| `explainPrompt()` / `ruleExplain()` | AI ② 프롬프트 / 실패 시 기본 문장 |
| `analyze()` | 전체 흐름: 후기 분석 → 점수 계산 → 근거 설명, 단계별 실패 처리 |
| `serverSample()` | 웹사이트 버전에서 `/api/ai` 서버 함수 호출 (claude.ai 안에서는 아티팩트 AI 기능 사용) |
| `SURVEY_URL` | 사용자 테스트 설문(구글 폼) 주소 |
| `saveFeedback()` / `loadFeedback()` | claude.ai 버전의 앱 안 피드백 저장·모아보기 |
| `runLab()` | AI 실험실: 조건 4개 × 후기 12개 실행, 방향 정확도·이름 인식·JSON 성공률·응답 시간·공격 방어 채점, 요청 한도에 걸리면 기다렸다 재시도 |
| `simulateAll()` / `runCheck()` | 가상 사용자 567명 시뮬레이션과 편향 점검 |
| `SHOW_STRINGS` | 거트 기능 스위치. 거트 DB를 확정하면 `true`로 |

## 데이터 출처

라켓 사양(무게 옵션, 밸런스, 샤프트 강성, 가격)은 [배드민턴마켓](https://www.badmintonmarket.co.kr) 상품 상세 페이지의 글 설명과 상세 이미지 속 사양표에서 2026-11-15에 옮긴 사실 정보입니다. 이미지와 문구는 앱에 쓰지 않았습니다. 라켓마다 상세 페이지 링크가 `data/rackets.csv`와 앱의 "DB 보기"에 있습니다.

단종 라켓 12종은 판매처(BadmintonBay, Tennisnuts, Racquetguys 등)에 남아 있는 제조사 표기(밸런스·강성·무게)를 같은 1~5 점수로 바꿨고, 모델마다 출처 링크를 `data/rackets_discontinued.csv`에 적었습니다. 단종 라켓은 살 수 없으므로 추천 목록에는 나오지 않고, 사용자가 써 본 라켓의 사양을 알아내 "대체 라켓"을 찾는 데만 씁니다.

- 요넥스 11종: 대표 모델 직접 선정
- 빅터 10종, 리닝 7종: 판매순 상위 (색상만 다른 모델 제외)
- 밸런스 대신 "공격형·컨트롤형·스피드형" 같은 타입만 적힌 5종은 점수를 추정했고 앱에 "일부 사양 추정"으로 표시합니다.

`data/lab_cases.json`과 편향 점검의 가상 사용자는 개발 검증용으로 만든 데이터이며 실제 사람의 응답이 아닙니다.

## 개인정보·보안

- 이름·학번·연락처를 받지 않고 닉네임만 씁니다. 신체 정보는 상·중·하로만 받습니다.
- 코드에 API 키가 없습니다. 웹사이트 버전은 서버 환경 변수의 키로 AI를 부르고, claude.ai 버전은 아티팩트 런타임이 사용자 동의를 받아 처리합니다.
- 서버 함수는 접근 코드(선택), 접속자별 요청 횟수 제한, 요청 길이 제한으로 키 남용을 막고, 로그에 키나 후기 내용을 남기지 않습니다.
- 후기 입력란에 "외부 AI 서비스로 보내지니 개인정보를 적지 말라"는 안내를 표시합니다.
- 후기에 숨긴 지시(프롬프트 인젝션)는 따르지 않도록 프롬프트에 규칙을 넣고, AI 실험실 11번 후기로 확인합니다.
- 화면에 출력하는 모든 글자는 HTML로 해석되지 않게 바꿔 넣습니다.

## AI 사용 표시

이 저장소의 코드와 문서 초안은 Claude(Claude Opus 5.5, claude.ai)로 작성했습니다. 기획(PPT), 데이터 출처·대상 모델 선정, 범위 결정, 검토는 직접 했습니다. 날짜별 사용 내역과 주요 프롬프트는 최종 보고서의 "부록 A. AI 사용 로그"에 있습니다.
