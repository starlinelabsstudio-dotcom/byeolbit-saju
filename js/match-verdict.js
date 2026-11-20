/*
 * 별빛 사주 — 궁합 판정 (0.17)
 * 세 궁합 맨 위의 한 줄 판정, 칸별 ☀/⛅/☁ 표, 두 사람의 2027 석 달 카드.
 * 판정은 A와 B를 바꿔 넣어도 같아야 한다(이름 자리만 바뀐다).
 * love(rA, rB, J, pp) / sok(J) / work(rA, rB, J) / year(rA, rB, area, pp)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./saju-analysis.js'), require('./newyear.js'), require('./match-verdict-texts.js'));
  } else root.MatchVerdict = factory(root.SajuAnalysis, root.NewYear, root.SAJU_MV || {});
})(typeof self !== 'undefined' ? self : this, function (A, NY, V) {
  'use strict';
  var EL = ['wood', 'fire', 'earth', 'metal', 'water'];
  var ELK = { wood: '나무', fire: '불', earth: '흙', metal: '쇠', water: '물' };
  var DOHWA = [9, 6, 3, 0];
  function bat(w) { var c = String(w).charCodeAt(String(w).length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 !== 0; }
  function jo(w, a, b) { return w + (bat(w) ? a : b); }
  function person(label) {
    if (label === '나') return { '': '나', 은: '나는', 이: '내가', 을: '나를', 과: '나와', 의: '나의', 에게: '나에게' };
    return { '': label, 은: jo(label, '은', '는'), 이: jo(label, '이', '가'), 을: jo(label, '을', '를'), 과: jo(label, '과', '와'), 의: label + '의', 에게: label + '에게' };
  }
  function fillW(t, key, map) { return String(t || '').replace(new RegExp('\\{' + key + '(은|이|을|과|의|에게)?\\}', 'g'), function (m, j) { return map[j || '']; }); }
  function brs(r) { return ['year', 'month', 'day', 'hour'].map(function (k) { return r.pillars[k]; }).filter(Boolean).map(function (p) { return p.branch; }); }
  function dohwaHit(rA, rB) {
    var c = [DOHWA[rA.pillars.year.branch % 4], DOHWA[rA.pillars.day.branch % 4]], b = brs(rB);
    return b.indexOf(c[0]) >= 0 || b.indexOf(c[1]) >= 0;
  }
  function tcls(r) {
    var mb = r.pillars.month.branch, sh = [5, 6, 7].indexOf(mb) >= 0 ? 2 : [11, 0, 1].indexOf(mb) >= 0 ? -2 : 0;
    var t = r.elements.fire - r.elements.water + sh;
    return t >= 2 ? 'warm' : t <= -2 ? 'cool' : 'mild';
  }
  function pairKey(a, b) { return [a, b].sort().join('-'); }
  function clamp(x) { return x < 0 ? 0 : x > 2 ? 2 : x; }
  function row(cellDef, lv, text) { return { wx: V.wx[lv], icon: cellDef[0], ko: cellDef[1], wxKo: V.icon[lv] + ' ' + V.lvKo[lv], text: text, lv: lv }; }
  // 칸들을 모아 한 줄 판정 블록으로
  function summarize(kind, rows, sum, cut) {
    var T = V[kind];
    var zeros = rows.filter(function (x) { return x.lv === 0; }).length;
    var lv = sum >= cut[1] ? 2 : (sum <= cut[0] || (sum === cut[0] + 1 && zeros >= 2)) ? 0 : 1;
    if (lv === 2 && zeros > 1) lv = 1;
    if (lv === 0 && zeros === 0) lv = 1;
    var good = rows.filter(function (x) { return x.lv === 2; }).map(function (x) { return x.ko; });
    var care = rows.filter(function (x) { return x.lv === 0; }).map(function (x) { return x.ko; });
    var goodText = good.length ? good.join(', ') : V.noGood, careText = care.length ? care.join(', ') : V.noCare;
    return {
      lv: lv, head: T.head[lv], goodText: goodText, careText: careText, rows: rows,
      verdict: { icon: V.icon[lv], ko: V.lvKo[lv], wx: V.wx[lv], head: T.head[lv], why: T.why[lv], good: goodText, care: careText,
        label: T.label, goodLabel: V.goodLabel, careLabel: V.careLabel },
      table: { wx: rows },
      legend: V.legend,
      line: T.label + ': ' + V.icon[lv] + ' ' + T.head[lv],
      line2: '잘 맞는 곳: ' + goodText + ' / 맞춰 갈 곳: ' + careText
    };
  }

  // ───── 연애 궁합: 대화 · 함께 생활 · 끌림 · 서로 채우기 · 오래 가기 ─────
  function love(rA, rB, J, pp) {
    var L = V.love, C = L.cells, rows = [];
    // 대화
    var tc = J.stem === 'combine' ? 'combine' : J.stem === 'gen' ? 'gen' : J.stem === 'same' ? 'same' : J.stemClash ? 'clash' : 'ctrl';
    var tl = { combine: 2, gen: 2, same: 1, ctrl: 1, clash: 0 }[tc], tt = L.talk[tc];
    if (J.day === 'wonjin') { tl = clamp(tl - 1); tt += L.talk.wonjin; }
    rows.push(row(C.talk, tl, tt));
    // 함께 생활
    var ll = { hap: 2, half: 2, same: 1, none: 1, wonjin: 1, punish: 0, clash: 0 }[J.day];
    rows.push(row(C.life, ll, L.life[J.day]));
    // 끌림
    var dAB = dohwaHit(rA, rB), dBA = dohwaHit(rB, rA), cA = tcls(rA), cB = tcls(rB);
    var ps = (J.stem === 'combine' ? 1 : 0) + (J.day === 'hap' ? 1 : 0) + (J.day === 'clash' ? 1 : 0) + (dAB ? 0.5 : 0) + (dBA ? 0.5 : 0) + (cA === 'cool' && cB === 'cool' ? -0.5 : 0) + (cA === 'warm' || cB === 'warm' ? 0.25 : 0);
    var pl = ps >= 1 ? 2 : ps >= 0 ? 1 : 0;
    var pc = J.day === 'clash' ? 'clash' : J.stem === 'combine' ? 'combine' : J.day === 'hap' ? 'hap' : (dAB && dBA) ? 'dohwaBoth' : (dAB || dBA) ? 'dohwaOne' : pl === 0 ? 'cool' : 'none';
    rows.push(row(C.pull, pl, L.pull[pc]));
    // 서로 채우기
    var fc, fl;
    if (J.fillA && J.fillB) { fc = 'both'; fl = 2; }
    else if (J.fillA) { fc = 'oneA'; fl = 1; }
    else if (J.fillB) { fc = 'oneB'; fl = 1; }
    else if (J.wA.n >= 2 && J.wB.n >= 2) { fc = 'even'; fl = 2; }
    else if (J.wA.el === J.wB.el && J.wA.n <= 1 && J.wB.n <= 1) { fc = 'same'; fl = J.wA.n + J.wB.n === 0 ? 0 : 1; }
    else { fc = 'none'; fl = 1; }
    rows.push(row(C.fill, fl, fillW(L.fill[fc], 'P', pp)));
    // 오래 가기: 네 칸 + 띠
    var s4 = tl + ll + pl + fl, ys = (J.year === 'hap' || J.year === 'half') ? 1 : J.year === 'clash' ? -1 : 0;
    var gl = s4 + ys >= 6 ? 2 : s4 + ys <= 3 ? 0 : 1;
    rows.push(row(C.long, gl, L.long[gl] + (ys > 0 ? L.yearHap : ys < 0 ? L.yearClash : '')));
    var sum = s4 + gl;
    return summarize('love', rows, sum, [4, 7]);
  }

  // ───── 속궁합: 끌림 · 온도 · 속도 · 표현 ─────
  function sok(J) {
    var K = V.sok, C = K.cells, L = V.love, rows = [];
    var dAB = J.dohwaAB >= 0, dBA = J.dohwaBA >= 0;
    var ps = (J.stem === 'combine' ? 1 : 0) + (J.day === 'hap' ? 1 : 0) + (J.day === 'clash' ? 1 : 0) + (dAB ? 0.5 : 0) + (dBA ? 0.5 : 0) + (J.cA === 'cool' && J.cB === 'cool' ? -0.5 : 0) + (J.cA === 'warm' || J.cB === 'warm' ? 0.25 : 0);
    var pl = ps >= 1 ? 2 : ps >= 0 ? 1 : 0;
    var pc = J.day === 'clash' ? 'clash' : J.stem === 'combine' ? 'combine' : J.day === 'hap' ? 'hap' : (dAB && dBA) ? 'dohwaBoth' : (dAB || dBA) ? 'dohwaOne' : pl === 0 ? 'cool' : 'none';
    rows.push(row(C.pull, pl, L.pull[pc]));
    var tl = { 'cool-warm': 2, 'warm-warm': 2, 'mild-warm': 2, 'mild-mild': 1, 'cool-mild': 1, 'cool-cool': 0 }[J.tk];
    rows.push(row(C.temp, tl, K.temp[J.tk]));
    var sl = { same: 2, near: 1, far: 0 }[J.speedGap];
    rows.push(row(C.speed, sl, K.speed[J.speedGap]));
    var ek = pairKey(J.exprA, J.exprB);
    var el = { 'express-receive': 2, 'balance-express': 2, 'balance-receive': 1, 'balance-balance': 1, 'express-express': 1, 'receive-receive': 0 }[ek];
    rows.push(row(C.expr, el, K.expr[ek]));
    return summarize('sok', rows, pl + tl + sl + el, [3, 6]);
  }

  // ───── 일 궁합: 역할 나누기 · 일하는 속도 · 부딪치는 곳 · 함께 낼 힘 ─────
  function work(rA, rB, J) {
    var W = V.work, C = W.cells, rows = [];
    var rk = J.stem === 'combine' ? 'combine' : J.stem === 'ctrl' ? 'lead' : J.stem === 'gen' ? 'grow' : 'same';
    var rl = rk === 'same' ? 1 : 2;
    rows.push(row(C.role, rl, W.role[rk]));
    var sl = { same: 2, near: 1, far: 0 }[J.speedGap];
    rows.push(row(C.speed, sl, W.speed[J.speedGap]));
    var bl = { hap: 2, half: 2, same: 1, none: 1, wonjin: 0, punish: 0, clash: 0 }[J.month], bt = W.rub[J.month];
    if (J.stemClash) { bl = clamp(bl - 1); bt += W.rub.stemClash; }
    rows.push(row(C.rub, bl, bt));
    var ol, ot, low = J.low;
    if (J.sum[low] === 0) { ol = 0; ot = W.power.gap.replace('{el}', ELK[low]).replace('{job}', ({ wood: '기획', fire: '알리기', earth: '관리', metal: '실행', water: '숫자' })[low]); }
    else if (J.fillA && J.fillB) { ol = 2; ot = W.power.both; }
    else if (J.fillA || J.fillB) { ol = 1; ot = W.power.one; }
    else if (J.sum[low] >= 2) { ol = 2; ot = W.power.even; }
    else { ol = 1; ot = W.power.even; }
    rows.push(row(C.power, ol, ot));
    return summarize('work', rows, rl + sl + bl + ol, [3, 6]);
  }

  // ───── 두 사람의 2027: 석 달 카드 4장 + 시기 표 ─────
  var QL = ['1~3월', '4~6월', '7~9월', '10~12월'];
  function year(rA, rB, area, pp, Y) {
    Y = Y || 2027;
    var Yt = V.year, me = person('나');
    var aA = A.analyze(rA, { gender: 'F' }), aB = A.analyze(rB, { gender: 'F' });
    var tA = NY.timing(rA, aA, Y).months, tB = NY.timing(rB, aB, Y).months;
    var windKey = area === 'love' ? 'wind' : 'mwind';
    var ms = tA.map(function (mA, i) {
      var mB = tB[i], a = mA.lv[area], b = mB.lv[area];
      var lv = a + b >= 4 ? 2 : (a + b <= 1) ? 0 : 1;
      return { n: i + 1, a: a, b: b, lv: lv, clA: mA[windKey] === 'clash', clB: mB[windKey] === 'clash' };
    });
    function M(n) { return n + '월'; }
    function lvAvg(list, k) { var s = 0; list.forEach(function (m) { s += m[k]; }); s /= list.length; return s >= 1.5 ? 2 : s < 0.75 ? 0 : 1; }
    var aIcon = area === 'love' ? '💗' : '💼';
    var quarters = [0, 1, 2, 3].map(function (q) {
      var qm = ms.slice(q * 3, q * 3 + 3), qs = 0;
      qm.forEach(function (m) { qs += m.a + m.b; });
      var sunN = qm.filter(function (m) { return m.lv === 2; }).length, cloudN = qm.filter(function (m) { return m.lv === 0; }).length;
      var lv = (sunN >= 1 && cloudN === 0 && qs >= 8) ? 2 : (cloudN >= 1 && qs <= 5) ? 0 : 1;
      var la = lvAvg(qm, 'a'), lb = lvAvg(qm, 'b');
      var head = Yt.qHead[area][lv];
      var both = qm.filter(function (m) { return m.a === 2 && m.b === 2; });
      var best = both.length ? both[0] : qm.slice().sort(function (x, y) { return (y.a + y.b) - (x.a + x.b) || x.n - y.n; })[0];
      if (lv >= 1 && best.a + best.b >= 3) head += Yt.best[area].replace('{m}', M(best.n));
      var tired = qm.filter(function (m) { return (m.a === 0) !== (m.b === 0); })[0];
      if (tired) head += tired.a === 0 ? Yt.tiredMe[area].replace('{m}', M(tired.n)) : fillW(Yt.tired[area].replace('{m}', M(tired.n)), 'W', pp);
      var cl = qm.filter(function (m) { return m.clA || m.clB; })[0], help = '';
      if (cl) help = fillW(Yt.clash[area].replace('{m}', M(cl.n)), 'W', cl.clA && cl.clB ? { '의': '두 사람 모두의' } : cl.clA ? me : pp);
      return {
        label: QL[q], wx: V.wx[lv], icon: V.icon[lv], wxKo: V.lvKo[lv], lv: lv,
        months: qm.map(function (m) { return { wx: V.wx[m.lv], short: M(m.n), icon: V.icon[m.lv] }; }),
        head: head,
        rows: [
          { wx: V.wx[la], icon: aIcon, ko: '나', wxIcon: V.icon[la], wxKo: V.lvKo[la], text: Yt.personLv[area][la] },
          { wx: V.wx[lb], icon: aIcon, ko: pp[''], wxIcon: V.icon[lb], wxKo: V.lvKo[lb], text: Yt.personLv[area][lb] }
        ],
        help: help
      };
    });
    var span = NY.monthSpan;
    var good = ms.filter(function (m) { return m.a === 2 && m.b === 2; }).map(function (m) { return m.n; });
    var goodText = span(good);
    if (!good.length) {
      var top = ms.slice().sort(function (x, y) { return (y.a + y.b) - (x.a + x.b) || x.n - y.n; }).slice(0, 2).map(function (m) { return m.n; }).sort(function (x, y) { return x - y; });
      goodText = span(top) + ' ' + Yt.nearBest;
    }
    var tA0 = ms.filter(function (m) { return m.a === 0; }).map(function (m) { return m.n; }), tB0 = ms.filter(function (m) { return m.b === 0; }).map(function (m) { return m.n; });
    var careParts = [];
    if (tB0.length) careParts.push(pp[''] + ' ' + span(tB0));
    if (tA0.length) careParts.push('나 ' + span(tA0));
    var cls = ms.filter(function (m) { return m.clA || m.clB; }).map(function (m) { return m.n; });
    var W = Yt.when[area];
    var when = [[W[0], goodText], [W[1], careParts.length ? careParts.join(' · ') : Yt.none], [W[2], cls.length ? span(cls) : Yt.none]];
    return { months: ms, quarters: quarters, when: when, goodText: good.length ? goodText : span(good), good: good, intro: area === 'love' ? Yt.introLove : Yt.introWork, whenHead: Yt.whenHead[area], legend: V.legend };
  }

  return { love: love, sok: sok, work: work, year: year };
});
