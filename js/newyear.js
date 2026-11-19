/*
 * 별빛 사주 — 2027 신년운세 (0.8)
 * build(r, a, input) → { year, pillar, oneLine, keywords, summary[], chapters[], months[], chars }
 * r: SajuEngine.calculate 결과, a: SajuAnalysis.analyze 결과
 * 글: SAJU_NY(src/newyear-texts.js), 돕는 기운의 색·방향·숫자: SAJU_DEEP.helper
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./saju-engine.js'), require('./saju-analysis.js'), require('./newyear-texts.js'), require('./deep/a.js'));
  } else root.NewYear = factory(root.SajuEngine, root.SajuAnalysis, root.SAJU_NY || {}, root.SAJU_DEEP || {});
})(typeof self !== 'undefined' ? self : this, function (E, A, N, D) {
  'use strict';
  var C = E.constants, SE = C.STEM_ELEMENT, BE = C.BRANCH_ELEMENT;
  var EL = ['wood', 'fire', 'earth', 'metal', 'water'];
  var ELK = { wood: '나무', fire: '불', earth: '흙', metal: '쇠', water: '물' };
  var GROUPS = ['bigeop', 'siksang', 'jaeseong', 'gwanseong', 'inseong'];
  var GROUP_OF = { bigyeon: 'bigeop', geobjae: 'bigeop', siksin: 'siksang', sanggwan: 'siksang', pyeonjae: 'jaeseong', jeongjae: 'jaeseong', pyeongwan: 'gwanseong', jeonggwan: 'gwanseong', pyeonin: 'inseong', jeongin: 'inseong' };
  var BR_COMBINE = { '0-1': 1, '2-11': 1, '3-10': 1, '4-9': 1, '5-8': 1, '6-7': 1 };
  var BR_CLASH = { '0-6': 1, '1-7': 1, '2-8': 1, '3-9': 1, '4-10': 1, '5-11': 1 };
  var BR_PUNISH = { '2-5': 1, '5-8': 1, '2-8': 1, '1-10': 1, '7-10': 1, '1-7': 1, '0-3': 1 };
  var STEM_COMBINE = { '0-5': 1, '1-6': 1, '2-7': 1, '3-8': 1, '4-9': 1 };
  var STEM_CLASH = { '0-6': 1, '1-7': 1, '2-8': 1, '3-9': 1 };
  var TRIPLE = [[8, 0, 4, 4], [2, 6, 10, 1], [5, 9, 1, 3], [11, 3, 7, 0]];
  var CHEONEUL = { 0: [1, 7], 4: [1, 7], 6: [1, 7], 1: [0, 8], 5: [0, 8], 2: [11, 9], 3: [11, 9], 8: [5, 3], 9: [5, 3], 7: [2, 6] };
  var HWAGAE = [4, 10, 1, 7];
  var YEAR_MS = 365.2425 * 86400000;
  function mod(a, n) { return ((a % n) + n) % n; }
  function pk(a, b) { return Math.min(a, b) + '-' + Math.max(a, b); }
  function group3(b) { return [0, 4, 8].indexOf(b) >= 0 ? 0 : [2, 6, 10].indexOf(b) >= 0 ? 1 : [5, 9, 1].indexOf(b) >= 0 ? 2 : 3; }
  function bat(w) { var c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c % 28 !== 0; }
  function fill(t, o) { return String(t || '').replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function gz(stem, branch) {
    return { stem: stem, branch: branch, hanja: C.STEMS[stem] + C.BRANCHES[branch], ko: C.STEMS_KO[stem] + C.BRANCHES_KO[branch],
      stemElement: EL[SE[stem]], branchElement: EL[BE[branch]] };
  }
  function seoulMD(ms) { var d = new Date(ms + 9 * 3600000); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() }; }
  function P(t, cls) { return t ? { p: t, cls: cls || '' } : null; }
  function H(t) { return { h: t }; }
  function clean(arr) { return arr.filter(function (x) { return x; }); }

  // 한 해의 달 12개: 寅월(입춘)부터 丑월(다음 해 소한)까지, 끝은 다음 해 입춘
  function monthsOf(Y) {
    var j1 = E.jieList(Y), j2 = E.jieList(Y + 1);
    function at(list, name) { return list.filter(function (j) { return j.name === name; })[0].ms; }
    var names = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪'];
    var starts = names.map(function (n) { return at(j1, n); }).concat([at(j2, '小寒'), at(j2, '立春')]);
    var ys = mod(Y - 4, 10), first = mod((ys % 5) * 2 + 2, 10);
    var out = [];
    for (var i = 0; i < 12; i++) out.push({ i: i, pillar: gz(mod(first + i, 10), mod(2 + i, 12)), from: starts[i], to: starts[i + 1] });
    return out;
  }

  // ── 0.16 판정: 달마다 갈래(일·돈·사랑·몸)별로 ☀좋음 / ⛅보통 / ☁조심 ──
  var AREAS = ['work', 'money', 'love', 'body'];
  // 그달 글자 무리가 갈래마다 주는 기운 (오늘의 운세와 같은 표)
  var AREA_G = {
    bigeop: { work: 0, money: -0.5, love: 0, body: 0.5 },
    siksang: { work: 0.5, money: 0.5, love: 1, body: 0 },
    jaeseong: { work: 0.5, money: 1, love: 0.5, body: -0.5 },
    gwanseong: { work: 1, money: 0, love: 0.5, body: -0.5 },
    inseong: { work: 0.5, money: -0.5, love: 0, body: 1 }
  };
  var TRI3 = [[8, 0, 4], [2, 6, 10], [5, 9, 1], [11, 3, 7]];
  var WONJIN = { '0-7': 1, '1-6': 1, '2-9': 1, '3-8': 1, '4-11': 1, '5-10': 1 };
  var HIDDEN_MAIN = A.HIDDEN.map(function (h) { return h[h.length - 1]; });
  function windOf(tb, nb) {
    if (tb === nb) return 'same';
    var k = pk(tb, nb);
    if (BR_CLASH[k]) return 'clash';
    if (BR_COMBINE[k]) return 'combine';
    if (TRI3.some(function (t) { return t.indexOf(tb) >= 0 && t.indexOf(nb) >= 0; })) return 'combine';
    if (BR_PUNISH[k]) return 'punish';
    if (WONJIN[k]) return 'wonjin';
    return 'none';
  }
  var BIAS = { work: -0.6, money: -0.1, love: -0.35, body: 0.1 }; // 갈래마다 좋음·조심 비율이 비슷해지게 맞춘 값
  var LV_CUT = { sun: 0.75, cloud: -0.5 }, OV_CUT = { sun: 0.5, cloud: 0.05 };
  var Q_CUT = { sun: 0.6, cloud: -0.3 }, Q_OV = { sun: 0.45, cloud: 0.12 }; // 석 달 평균은 덜 출렁이니 기준을 조금 좁힌다
  var WXK = ['cloud', 'part', 'sun'];
  function lvOf(v, c) { return v >= c.sun ? 2 : v <= c.cloud ? 0 : 1; }
  function scoreMonth(r, a, p) {
    var me = r.pillars.day.stem;
    var grp = GROUP_OF[A.godOf(me, p.stem)], bgrp = GROUP_OF[A.godOf(me, HIDDEN_MAIN[p.branch])];
    var s = {}, help = 0, ch = a.climateHelper;
    if (p.stemElement === a.helper) help += 0.5;
    if (p.branchElement === a.helper) help += 0.5;
    if (ch && ch !== a.helper && (p.stemElement === ch || p.branchElement === ch)) help += 0.25;
    AREAS.forEach(function (k) { s[k] = AREA_G[grp][k] + AREA_G[bgrp][k] * 0.5 + BIAS[k] + help; });
    var wind = windOf(p.branch, r.pillars.day.branch), mwind = windOf(p.branch, r.pillars.month.branch);
    if (wind === 'combine') s.love += 1;
    if (wind === 'clash') { s.love -= 1.25; s.body -= 0.5; }
    if (wind === 'punish' || wind === 'wonjin') s.love -= 0.5;
    if (mwind === 'combine') s.work += 0.5;
    if (mwind === 'clash') { s.work -= 1.25; s.money -= 0.25; }
    var lv = {}, sum = 0;
    AREAS.forEach(function (k) { lv[k] = lvOf(s[k], LV_CUT); sum += s[k]; });
    var ov = sum / AREAS.length;
    var o = lvOf(ov, OV_CUT);
    // 흐린 갈래가 없으면 달 전체가 '조심'이 되지 않게, 흐린 갈래가 있으면 '좋음'이 되지 않게
    if (o === 0 && !AREAS.some(function (k) { return lv[k] === 0; })) o = 1;
    if (o === 2 && AREAS.some(function (k) { return lv[k] === 0; })) o = 1;
    return { grp: grp, bgrp: bgrp, help: help, wind: wind, mwind: mwind, s: s, lv: lv, ov: ov, o: o };
  }
  // 양력 1~12월에 맞춘 사주 달 12개: 1월은 앞 해의 丑월, 2~12월은 그해의 寅~子월
  function calMonthsOf(Y) {
    var prev = monthsOf(Y - 1)[11], cur = monthsOf(Y);
    return [prev].concat(cur.slice(0, 11));
  }
  // 달 번호 목록 → "1·2월", "8~10월"
  function monthSpan(list) {
    if (!list.length) return '';
    var out = [], st = list[0], pv = list[0];
    for (var i = 1; i <= list.length; i++) {
      var x = list[i];
      if (x === pv + 1) { pv = x; continue; }
      out.push(st === pv ? st + '월' : (pv - st === 1 ? st + '·' + pv + '월' : st + '~' + pv + '월'));
      st = pv = x;
    }
    return out.join(', ');
  }
  // 깊은 감정서에서도 쓰는 한 해 시기 요약
  function timing(r, a, Y) {
    var ms = calMonthsOf(Y).map(function (m, i) { var sc = scoreMonth(r, a, m.pillar); sc.n = i + 1; return sc; });
    var good = ms.filter(function (m) { return m.o === 2; }).map(function (m) { return m.n; });
    var care = ms.filter(function (m) { return m.o === 0; }).map(function (m) { return m.n; });
    return { months: ms, good: good, care: care, goodText: monthSpan(good), careText: monthSpan(care) };
  }

  function build(r, a, input, Y) {
    Y = Y || 2027;
    var me = r.pillars.day.stem, meEl = SE[me];
    var yp = gz(mod(Y - 4, 10), mod(Y - 4, 12));
    var god = A.godOf(me, yp.stem), grp = GROUP_OF[god];
    var ground = GROUPS[mod(BE[yp.branch] - meEl, 5)];
    var one = N.oneLine[god];
    var POSK = ['year', 'month', 'day', 'hour'];
    var natal = POSK.map(function (k) { var p = r.pillars[k]; return p ? { k: k, stem: p.stem, branch: p.branch, sH: p.stemHanja, sK: p.stemKo, bH: p.branchHanja, bK: p.branchKo } : null; }).filter(function (x) { return x; });
    var dayB = r.pillars.day.branch;
    var helper = a.helper, helperKo = ELK[helper];
    var yearEls = [yp.stemElement, yp.branchElement];

    // ---------- 1. 올해의 바탕 ----------
    var bb = [];
    bb.push({ chips: one.kw.map(function (k) { return '#' + k; }), label: '2027년의 낱말' });
    bb.push(P(N.base[god]));
    bb.push(P(N.ground[ground]));
    // 내 사주 글자와의 만남
    var inter = [], loveClash = false, loveCombine = false;
    natal.forEach(function (n) {
      var key = pk(yp.branch, n.branch), area = N.posArea[n.k], pos = N.posName[n.k];
      var head = '올해 글자 未(미)가 ' + pos + '의 ' + n.bH + '(' + n.bK + ')';
      if (n.branch === yp.branch) inter.push(P('올해 글자 未(미)가 ' + pos + '에도 있어요. ' + fill(N.inter.same, { area: area })));
      else if (BR_CLASH[key]) { inter.push(P(head + josaWa(n.bK) + ' 부딪쳐요(충). ' + fill(N.inter.clash, { area: area }))); if (n.k === 'day') loveClash = true; }
      else if (BR_COMBINE[key]) { inter.push(P(head + josaWa(n.bK) + ' 손을 잡아요(합). ' + fill(N.inter.combine, { area: area }))); if (n.k === 'day') loveCombine = true; }
      else if (BR_PUNISH[key]) inter.push(P(head + josaWa(n.bK) + ' 서로 조이는 사이예요(형). ' + fill(N.inter.punish, { area: area })));
    });
    // 반합: 未와 같은 삼합 무리(亥卯未)의 글자가 내 사주에 있으면
    var tri = TRIPLE.filter(function (t) { return t.indexOf(yp.branch) >= 0 && t.indexOf(yp.branch) < 3; })[0];
    if (tri) {
      var mates = [], seenB = {};
      natal.forEach(function (n) { if (n.branch !== yp.branch && tri.slice(0, 3).indexOf(n.branch) >= 0 && !seenB[n.branch]) { seenB[n.branch] = 1; mates.push(n.bH + '(' + n.bK + ')'); } });
      if (mates.length) {
        var tg = GROUPS[mod(tri[3] - meEl, 5)];
        var lastKo = mates[mates.length - 1].slice(-2, -1);
        inter.push(P(fill(N.inter.triple, { chars: mates.join('·') + josaWa(lastKo), group: N.groupShort[tg] })));
      }
    }
    natal.forEach(function (n) {
      var key = pk(yp.stem, n.stem), pos = N.posName[n.k];
      if (STEM_COMBINE[key]) inter.push(P(fill(N.inter.stemCombine, { pos: pos, extra: n.k === 'day' ? N.inter.stemCombineDay : fill(N.inter.stemCombineOther, { area: N.posArea[n.k] }) })));
      else if (STEM_CLASH[key]) inter.push(P(fill(N.inter.stemClash, { pos: pos })));
    });
    if (inter.length) { bb.push(H('내 사주 글자와의 만남')); bb = bb.concat(inter); }
    // 특별한 별
    var star = [];
    if ((CHEONEUL[me] || []).indexOf(yp.branch) >= 0) star.push(P(N.cheoneul));
    var hw = natal.filter(function (n) { return (n.k === 'year' || n.k === 'day') && HWAGAE[group3(n.branch)] === yp.branch; });
    if (hw.length) star.push(P(N.hwagae));
    if (star.length) { bb.push(H('2027년에 들어오는 별')); bb = bb.concat(star); }
    // 대운과 겹침
    var midMs = Date.UTC(Y, 6, 1), age = (midMs - r.utc) / YEAR_MS, du = null;
    (a.daeun.list || []).forEach(function (d) { if (age >= d.fromAge && age < d.toAge) du = d; });
    bb.push(H('지금 10년의 흐름과 2027년'));
    if (!du) bb.push(P(N.daeun.none));
    else {
      var dg = GROUP_OF[A.godOf(me, du.pillar.stem)];
      var pil = du.pillar.ko + ' ' + du.pillar.hanja;
      // 무리 이름은 모두 '힘'으로 끝나서 조사는 '이'
      bb.push(P(fill(dg === grp ? N.daeun.same : N.daeun.diff, { pillar: pil, group: N.groupShort[grp], dgroup: N.groupShort[dg], ygroup: N.groupShort[grp] })));
    }
    bb.push(P(fill(yearEls.indexOf(helper) >= 0 ? N.helperYes : N.helperNo, { el: helperKo })));

    // ---------- 2. 분야별 ----------
    var ar = N.area[god], partner = a.partner.group === grp;
    var love = [ar.love];
    if (partner) love.push(input && input.gender === 'M' ? N.loveExtra.partnerM : N.loveExtra.partnerF);
    if (loveClash) love.push(N.loveExtra.clashDay); else if (loveCombine) love.push(N.loveExtra.combineDay);
    // ---------- 3. 달마다 (양력 1~12월에 맞춘 사주 달) + 판정 ----------
    var V = N.verdict, AK = V.areaKo, AI = V.areaIcon;
    var seenGod = {}, seenGood = {}, months = calMonthsOf(Y).map(function (m, idx) {
      var g = A.godOf(me, m.pillar.stem), n = seenGod[g] = (seenGod[g] || 0) + 1;
      var v = N.month[g][Math.min(n, 2) - 1];
      var key = pk(m.pillar.branch, dayB);
      var flags = [];
      if (m.pillar.branch !== dayB && BR_CLASH[key]) flags.push('clashDay');
      else if (BR_COMBINE[key]) flags.push('combineDay');
      var help = m.pillar.stemElement === helper || m.pillar.branchElement === helper;
      var sc = scoreMonth(r, a, m.pillar);
      var a1 = seoulMD(m.from), a2 = seoulMD(m.to - 86400000);
      var text = [idx === 0 ? N.seasonJan : N.season[idx - 1], v.text];
      flags.forEach(function (f) { text.push(N.monthExtra[f]); });
      if (help) text.push(fill(N.monthExtra.helper, { el: helperKo }));
      // 좋은 점: 가장 맑은 갈래 / 조심할 점: 흐린 갈래 중 가장 낮은 것
      var order = AREAS.slice().sort(function (x, y) { return sc.s[y] - sc.s[x]; });
      var bestK = order[0], worstK = order[order.length - 1];
      var gl = Math.max(1, sc.lv[bestK]), gkey = bestK + gl + sc.grp, gn = seenGood[gkey] = (seenGood[gkey] || 0) + 1;
      var good = { k: bestK, ko: AI[bestK] + ' ' + AK[bestK], text: V.S[bestK][gl][sc.grp][(gn + 1) % 2] }; // 같은 글이 겹치면 다른 벌로
      var care = sc.lv[worstK] === 0 ? { k: worstK, ko: AI[worstK] + ' ' + AK[worstK], text: V.S[worstK][0][sc.grp][0] } : null;
      return { n: idx + 1, pillar: m.pillar, god: g, flow: N.flow[g], range: a1.m + '.' + a1.d + ' ~ ' + a2.m + '.' + a2.d,
        label: a1.m + '월', short: a1.m + '월', year: a1.y, text: text.join(' '), tip: v.tip, help: help,
        level: Math.max(1, Math.min(5.5, 3.1 + sc.ov * 1.7)), flags: flags,
        o: sc.o, wx: WXK[sc.o], icon: V.icon[sc.o], wxKo: V.ko[sc.o], lv: sc.lv, s: sc.s, grp: sc.grp, wind: sc.wind, mwind: sc.mwind, good: good, care: care };
    });
    var helpMonths = months.filter(function (m) { return m.help; }).map(function (m) { return m.label; });
    var goodN = months.filter(function (m) { return m.o === 2; }).map(function (m) { return m.n; });
    var careN = months.filter(function (m) { return m.o === 0; }).map(function (m) { return m.n; });
    var yLv = goodN.length >= 6 && careN.length <= 2 ? 2 : (careN.length >= 4 || goodN.length <= 2) ? 0 : 1;
    var yearHead = V.yearHead[grp][yLv];

    // 갈래마다 좋은 달·조심할 달
    function areaMonths(k, want) { return months.filter(function (m) { return m.lv[k] === want; }).map(function (m) { return m.n; }); }
    function topMonths(k, cnt) { return months.slice().sort(function (x, y) { return y.s[k] - x.s[k] || x.n - y.n; }).slice(0, cnt).map(function (m) { return m.n; }).sort(function (x, y) { return x - y; }); }
    function whenOf(k) {
      var g = areaMonths(k, 2), c = areaMonths(k, 0);
      return { when: [[V.bestLabel, monthSpan(g.length ? g : topMonths(k, 2))], [V.careLabel, c.length ? monthSpan(c) : V.noCare]] };
    }

    // ---------- 2. 분야별 ----------
    var areaBlocks0 = [
      H('💼 일·공부'), P(ar.work), whenOf('work'),
      H('💰 돈'), P(ar.money), whenOf('money'),
      H('💗 사랑·사람'), P(love.join(' ')), whenOf('love'),
      H('🌿 몸 관리'), P(ar.health + ' ' + (N.healthClimate[a.climate] || N.healthClimate.mild)), whenOf('body'),
      H('🏠 가족·집'), P(ar.family),
      H('미리 챙기면 좋은 점'), P(N.care[god]),
      { list: N.tips[god], label: '2027년에 해 보면 좋은 것' }
    ];
    // 시기 한눈에
    function orTop(k) { var g = areaMonths(k, 2); return monthSpan(g.length ? g : topMonths(k, 2)); }
    var moveN = months.filter(function (m) { return m.wind === 'clash' || m.mwind === 'clash' || m.o === 0; }).map(function (m) { return m.n; });
    var restN = areaMonths('body', 0);
    areaBlocks0.push(H(V.timeHead), { when: [
      [V.time.work, orTop('work')], [V.time.love, orTop('love')], [V.time.money, orTop('money')],
      [V.time.move, moveN.length ? monthSpan(moveN) : V.noCare], [V.time.rest, restN.length ? monthSpan(restN) : V.noCare]
    ], wide: true });
    var areaBlocks = clean(areaBlocks0);

    // ---------- 석 달씩 ----------
    var quarters = [0, 1, 2, 3].map(function (q) {
      var ms = months.slice(q * 3, q * 3 + 3);
      var lv = {}, avg = {};
      AREAS.forEach(function (k) {
        avg[k] = (ms[0].s[k] + ms[1].s[k] + ms[2].s[k]) / 3;
        lv[k] = lvOf(avg[k], Q_CUT);
      });
      var ov = AREAS.reduce(function (t, k) { return t + avg[k]; }, 0) / AREAS.length;
      var o = lvOf(ov, Q_OV);
      if (o === 0 && !AREAS.some(function (k) { return lv[k] === 0; })) o = 1;
      if (o === 2 && AREAS.some(function (k) { return lv[k] === 0; })) o = 1;
      var rows = AREAS.map(function (k) {
        var pickM = ms.slice().sort(function (x, y) { return lv[k] === 0 ? x.s[k] - y.s[k] : lv[k] === 2 ? y.s[k] - x.s[k] : Math.abs(x.s[k] - avg[k]) - Math.abs(y.s[k] - avg[k]); })[0];
        var t = [V.S[k][lv[k]][pickM.grp][1]];
        // 이유와 달 콕 집기
        var clashM = ms.filter(function (m) { return (k === 'love' && m.wind === 'clash') || (k === 'work' && m.mwind === 'clash'); });
        var combM = ms.filter(function (m) { return (k === 'love' && m.wind === 'combine') || (k === 'work' && m.mwind === 'combine'); });
        if (clashM.length) t.push(fill(V.reason[k + 'Clash'], { M: monthSpan(clashM.map(function (m) { return m.n; })) }));
        else if (lv[k] === 2 && combM.length) t.push(fill(V.reason[k + 'Combine'], { M: monthSpan(combM.map(function (m) { return m.n; })) }));
        else if (lv[k] === 2) t.push(fill(V.reason.best, { M: pickM.short }));
        else if (lv[k] === 0) t.push(fill(V.reason.worst, { M: pickM.short }));
        return { k: k, ko: AK[k], icon: AI[k], lv: lv[k], wx: WXK[lv[k]], wxIcon: V.icon[lv[k]], wxKo: V.ko[lv[k]], text: t.join(' ') };
      });
      // 머리말: 가장 맑은 갈래와 가장 흐린 갈래
      var ord = AREAS.slice().sort(function (x, y) { return avg[y] - avg[x]; });
      var up = lv[ord[0]] === 2 ? ord[0] : null, down = lv[ord[3]] === 0 ? ord[3] : null;
      var head = up && down ? V.up[up] + ', ' + V.down[down] : up ? V.up[up] + ', ' + V.restOk : down ? V.down[down] + ', ' + V.restCalm : V.flat;
      var help = ms.filter(function (m) { return m.help; }).map(function (m) { return m.n; });
      return { label: (q * 3 + 1) + '~' + (q * 3 + 3) + '월', o: o, wx: WXK[o], icon: V.icon[o], wxKo: V.ko[o], head: head, rows: rows,
        months: ms.map(function (m) { return { short: m.short, icon: m.icon, wx: m.wx }; }), help: help.length ? fill(V.helpLine, { M: monthSpan(help), el: helperKo }) : '' };
    });

    // ---------- 4. 행운 열쇠 ----------
    var hp = (D.helper || {})[helper] || {};
    var luck = clean([
      P('2027년의 행운은 나를 돕는 ' + helperKo + ' 기운에서 와요. 생활 속에 이 기운을 가까이 두면 한 해의 균형이 잡혀요.'),
      { lucky: [
        ['행운의 색', (hp.colors || []).join(', ')],
        ['좋은 방향', hp.direction || ''],
        ['행운의 숫자', (hp.numbers || []).join(', ')],
        ['힘이 나는 달', helpMonths.length ? helpMonths.join(', ') : '한 해 고르게']
      ] },
      hp.habits ? { list: hp.habits, label: '2027년에 들이면 좋은 습관' } : null
    ]);

    var chapters = [
      { id: 'ny-base', title: '2027년의 바탕', sub: one.line, blocks: clean(bb) },
      { id: 'ny-quarter', title: '석 달씩 보는 ' + Y, sub: '1~3월 · 4~6월 · 7~9월 · 10~12월', blocks: [
        { verdict: { icon: V.icon[yLv], ko: V.ko[yLv], wx: WXK[yLv], head: yearHead, why: V.yearWhy[yLv],
          good: goodN.length ? monthSpan(goodN) : V.none, care: careN.length ? monthSpan(careN) : V.none } },
        P(V.legend)].concat(quarters.map(function (q) { return { quarter: q }; })) },
      { id: 'ny-areas', title: '분야별 운', sub: '일·공부 · 돈 · 사랑 · 몸 · 가족, 그리고 좋은 때', blocks: areaBlocks },
      { id: 'ny-months', title: '달마다의 운', sub: Y + '년 1월 ~ 12월', blocks: [
        P(V.monthIntro),
        { wave: months },
        { months: months }] },
      { id: 'ny-luck', title: '2027 행운 열쇠', sub: '나를 돕는 ' + helperKo + ' 기운', blocks: luck }
    ];
    var summary = [
      Y + '년 한 줄 판정: ' + V.icon[yLv] + ' ' + yearHead,
      '좋은 달: ' + (goodN.length ? monthSpan(goodN) : V.none) + ' · 조심할 달: ' + (careN.length ? monthSpan(careN) : V.none),
      '2027년은 정미년(丁未年), 나에게는 ‘' + one.line + '’' + (bat(one.line) ? '이에요.' : '예요.'),
      '올해 들어오는 기운: ' + N.groupShort[grp] + (ground !== grp ? ', 그리고 바닥에 깔린 ' + N.groupShort[ground] : ''),
      N.beforeIpchun
    ];
    var chars = summary.join('').length;
    chapters.forEach(function (c) { c.blocks.forEach(function (b) {
      if (b.p) chars += b.p.length;
      if (b.months) b.months.forEach(function (m) { chars += m.text.length + m.tip.length + m.good.text.length + (m.care ? m.care.text.length : 0); });
      if (b.quarter) b.quarter.rows.forEach(function (x) { chars += x.text.length; });
    }); });
    return { year: Y, pillar: yp, god: god, oneLine: one.line, keywords: one.kw, summary: summary, chapters: chapters, months: months, quarters: quarters,
      yearLv: yLv, yearHead: yearHead, goodMonths: goodN, careMonths: careN, chars: chars };

    function josaWa(w) { return bat(w) ? '과' : '와'; }
  }

  return { build: build, monthsOf: monthsOf, calMonthsOf: calMonthsOf, scoreMonth: scoreMonth, timing: timing, monthSpan: monthSpan };
});
