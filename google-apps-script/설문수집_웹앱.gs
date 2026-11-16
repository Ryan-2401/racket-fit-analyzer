/**
 * 라켓 추천 앱 → 구글 시트 자동 저장 (앱 안 설문 응답 수집기)
 *
 * 친구는 앱 링크 하나만 받으면 돼요. 분석 후 결과 화면 아래 "1분 설문"을 보내면
 * 입력 조건·추천 결과·설문 점수가 이 시트에 한 줄씩 자동으로 쌓여요.
 *
 * 설치 (처음 한 번, 5분)
 *  1) script.google.com → 새 프로젝트 → 기본 코드를 지우고 이 파일 내용 전체 붙여넣기 → 저장(💾)
 *  2) 위쪽 함수 선택을 setup 으로 바꾸고 실행(▶) → 권한 허용
 *     ("확인되지 않은 앱" 경고 → 고급 → 이동 → 허용)
 *     → 실행 로그에 "응답 시트 주소"가 나와요. 데이터가 쌓이는 곳이에요.
 *  3) 오른쪽 위 [배포] → [새 배포] → 톱니바퀴(유형 선택) → [웹 앱]
 *       - 다음 사용자 인증 정보로 실행: 나
 *       - 액세스 권한이 있는 사용자: 모든 사용자
 *     → [배포] → 나오는 "웹 앱 URL"(…/exec 로 끝남)을 복사해서 만든 사람(앱 코드의 SHEET_URL)에 넣기
 *
 * 코드를 고친 뒤에는 [배포] → [배포 관리] → 연필 → 버전 "새 버전" → [배포] 해야 반영돼요. (웹 앱 URL은 그대로예요)
 */
const HEADERS = ['시각', '닉네임', '성별', '손 크기', '악력', '구력', '플레이 스타일', '써 본 라켓', '써 본 라켓 평가',
  '후기 있음', '후기', '추천 1위', '추천 2위', '추천 3위', '추천 텐션', 'AI 후기 분석', 'AI 설명',
  '적합도(1~5)', '설명 이해(1~5)', 'AI 후기 이해(1~5)', '사용 편의(1~5)', '시도 의향(1~5)', '헷갈린 부분', '의견',
  // ↓ 거트 추천을 넣으면서 뒤에 추가한 열 (앞쪽 열 순서는 그대로라 기존 응답과 섞이지 않아요)
  '추천 거트 1위', '추천 거트 2·3위', '계절', '거트 교체 주기', '지금 텐션', '라켓 예산'];

function setup() {
  const ss = SpreadsheetApp.create('라켓 추천 앱 설문 응답');
  const sh = ss.getSheets()[0];
  sh.setName('응답');
  sh.appendRow(HEADERS);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#e8f0fe');
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', ss.getId());
  Logger.log('응답 시트 주소 (데이터가 쌓이는 곳): ' + ss.getUrl());
  Logger.log('다음 단계: [배포] → [새 배포] → 웹 앱 (실행: 나, 액세스: 모든 사용자)');
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    const i = d.input || {};
    const t = d.top3 || [];
    const clip = (v, n) => String(v == null ? '' : v).slice(0, n);
    const n15 = v => { v = Number(v); return v >= 1 && v <= 5 ? v : ''; };
    const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    const sh = SpreadsheetApp.openById(id).getSheetByName('응답');
    if (sh.getLastColumn() < HEADERS.length) { // 예전 버전으로 만든 시트면 새 열 제목을 자동으로 추가
      sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold').setBackground('#e8f0fe');
    }
    const g = d.strings || [];
    sh.appendRow([
      new Date(), clip(d.nick, 20), clip(i.sex, 4), clip(i.hand, 6), clip(i.grip, 6), clip(i.exp, 10),
      clip(i.styles, 60), clip(i.used, 40), clip(i.usedFeel, 10), i.hasReview ? '예' : '아니오', clip(d.review, 500),
      clip(t[0], 40), clip(t[1], 40), clip(t[2], 40), clip(d.tension, 10),
      d.specAI ? 'AI' : '규칙', d.explainAI ? 'AI' : '규칙',
      n15(d.fit), n15(d.clear), n15(d.aiu), n15(d.easy), n15(d.try), clip(d.confuse, 200), clip(d.comment, 600),
      clip(g[0], 40), clip(g.slice(1, 3).join(', '), 80), clip(i.env, 10), clip(i.cycle, 12), clip(i.curT, 6), clip(i.budget, 14)
    ]);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error');
  } finally {
    lock.releaseLock();
  }
}

// 주소를 브라우저로 열었을 때 확인용
function doGet() {
  return ContentService.createTextOutput('라켓 추천 앱 설문 수집기가 작동 중이에요.');
}
