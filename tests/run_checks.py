"""
개발 검증 스크립트 — 앱(index.html)의 점수 계산을 브라우저에서 그대로 실행해 확인합니다.
실행: pip install playwright && playwright install chromium
      python tests/run_checks.py
AI는 호출하지 않습니다 (기본 규칙만). AI 조건(B~D)은 claude.ai에서 앱의 "AI 실험실" 화면으로 실행하세요.
"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright

APP = (pathlib.Path(__file__).resolve().parent.parent / "index.html").as_uri()

CHECKS = r"""() => {
  const out = {};
  // 1) 예시 조건 4개
  const base = { sex:'남', curT:null, budget:0, used:'', usedFeel:'change' };
  const cases = [
    {...base, nick:'a',hand:'중',grip:'하',exp:'중',styles:['smash','defense'],env:'winter',cycle:'mid',review:'아스트록스 88D 써봤는데 헤드가 무거워서 수비할 때 손목이 아팠어요. 텐션 26은 너무 빡빡하게 느껴졌어요.'},
    {...base, nick:'b',hand:'상',grip:'상',exp:'상',styles:['smash'],env:'year',cycle:'short',curT:27,review:'나노플레어 800은 빠른데 스매시에 힘이 안 실려요. 거트는 BG66 울티맥스를 썼는데 한 달도 안 돼 끊어졌어요.'},
    {...base, nick:'c',hand:'하',grip:'하',exp:'하',styles:['net','light'],env:'summer',cycle:'long',budget:100000,review:''},
    {...base, nick:'d',hand:'중',grip:'중',exp:'중',styles:['allround'],env:'year',cycle:'mid',review:''},
  ];
  out.examples = cases.map(c => { const s = ruleParse(c.review), r = recommend(c, s);
    return { who: c.nick, rackets: r.top.slice(0,3).map(x => `${x.ko} ${x.wPick} ${x.score}%`), strings: r.strings.slice(0,3).map(x => `${x.ko} ${x.score}%`), tension: r.tension.join('-') }; });
  // 2) AI 실험실 기준선 (기본 규칙)
  const per = LAB_CASES.map((c,i) => { const s = ruleParse(c.text); return { i:i+1, ms:0, jsonOk:true, model:'규칙', spec:s, g:gradeCase(c,s) }; });
  const a = summarize(LAB_CONDS[0], per);
  out.labBaseline = { fieldAcc: a.fieldAcc, ok: a.fieldOk, n: a.fieldN, nameAcc: a.nameAcc, attackOk: a.attackOk };
  // 3) 가상 사용자 (손 3 × 악력 3 × 구력 3 × 스타일 7 × 계절 3 × 교체 주기 3)
  const sims = simulateAll(); const brand = {}, gut = {}; let errors = 0; const in3 = new Set(), gut3 = new Set();
  for (const s of sims) { const t = s.rec.top[0], g = s.rec.strings[0]; if (!t || !g) { errors++; continue; }
    gut[g.ko] = (gut[g.ko]||0)+1; s.rec.strings.slice(0,3).forEach(x => gut3.add(x.id));
    brand[t.brand] = (brand[t.brand]||0)+1; s.rec.top.slice(0,3).forEach(g => [g, ...g.same].forEach(r => in3.add(r.id))); }
  out.personas = { n: sims.length, errors, racketTop1Brand: brand, racketsInTop3: `${in3.size}/${RACKETS.length}`, stringTop1: gut, stringsInTop3: `${gut3.size}/${STRINGS.length}` };
  return JSON.stringify(out);
}"""

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(APP); pg.wait_for_timeout(500)
    res = json.loads(pg.evaluate(CHECKS))
    b.close()
print(json.dumps(res, ensure_ascii=False, indent=2))
assert not errs, errs
assert res["personas"]["errors"] == 0
print("모든 점검 통과")
