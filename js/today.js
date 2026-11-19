/*
 * 별빛 사주 — 오늘의 운세 (0.11 · 0.13 공부·배움 칸)
 * build(r, a, input, ymd) → { kind:'td', date, pillar, god, title, summary[], areas[], flow[], hours[], lucky[], todo, rest, week[], tomorrow, chars }
 * r: SajuEngine.calculate 결과, a: SajuAnalysis.analyze 결과, ymd: { y, m, d } (서울 날짜)
 * 같은 사람·같은 날이면 언제 열어도 같은 결과. 글: SAJU_TD(src/today-texts.js)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./saju-engine.js'), require('./saju-analysis.js'), require('./today-texts.js'));
  } else root.Today = factory(root.SajuEngine, root.SajuAnalysis, root.SAJU_TD || {});
})(typeof self !== 'undefined' ? self : this, function (E, A, T) {
  'use strict';
  var C = E.constants, SE = C.STEM_ELEMENT, BE = C.BRANCH_ELEMENT;
  var EL = ['wood', 'fire', 'earth', 'metal', 'water'];
  var ELK = { wood: '나무', fire: '불', earth: '흙', metal: '쇠', water: '물' };
  var GROUP_OF = { bigyeon: 'bigeop', geobjae: 'bigeop', siksin: 'siksang', sanggwan: 'siksang', pyeonjae: 'jaeseong', jeongjae: 'jaeseong', pyeongwan: 'gwanseong', jeonggwan: 'gwanseong', pyeonin: 'inseong', jeongin: 'inseong' };
  var BR_COMBINE = { '0-1': 1, '2-11': 1, '3-10': 1, '4-9': 1, '5-8': 1, '6-7': 1 };
  var BR_CLASH = { '0-6': 1, '1-7': 1, '2-8': 1, '3-9': 1, '4-10': 1, '5-11': 1 };
  var BR_PUNISH = { '2-5': 1, '5-8': 1, '2-8': 1, '1-10': 1, '7-10': 1, '1-7': 1, '0-3': 1 };
  var WONJIN = { '0-7': 1, '1-6': 1, '2-9': 1, '3-8': 1, '4-11': 1, '5-10': 1 };
  var TRIPLE = [[8, 0, 4], [2, 6, 10], [5, 9, 1], [11, 3, 7]];
  var HIDDEN_MAIN = A.HIDDEN.map(function (h) { return h[h.length - 1]; }); // 지지의 본기 천간 (분석 모듈의 지장간 표에서)
  var AREAS = ['work', 'money', 'love', 'people', 'body', 'study'];
  var AREA_KO = { work: '일', money: '돈', love: '사랑', people: '사람', body: '몸', study: '공부·배움' };
  // 오늘 날 글자 무리가 갈래마다 주는 기운
  var AREA_G = {
    bigeop: { work: 0, money: -0.5, love: 0, people: 1, body: 0.5, study: 0 },
    siksang: { work: 0.5, money: 0.5, love: 1, people: 0.5, body: 0, study: 0.5 },
    jaeseong: { work: 0.5, money: 1, love: 0.5, people: 0, body: -0.5, study: -0.5 },
    gwanseong: { work: 1, money: 0, love: 0.5, people: -0.5, body: -0.5, study: 0.5 },
    inseong: { work: 0.5, money: -0.5, love: 0, people: 0.5, body: 1, study: 1 }
  };
  var DIR = { wood: '동쪽', fire: '남쪽', earth: '가까운 동네', metal: '서쪽', water: '북쪽' };
  var WX = ['cloud', 'part', 'sun'];
  var WX_KO = { sun: '맑음', part: '구름 조금', cloud: '흐림' };
  var WX_ICON = { sun: '☀', part: '⛅', cloud: '☁' };
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];
  var DAY = 86400000;

  function mod(a, n) { return ((a % n) + n) % n; }
  function pk(a, b) { return Math.min(a, b) + '-' + Math.max(a, b); }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function bat(w) { var c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c % 28 !== 0; }
  function fill(t, o) {
    return String(t || '').replace(/\{([A-Z]+)(은|이|을|과|의)?\}/g, function (m, k, j) {
      var v = o[k]; if (v == null) return m;
      if (!j) return v;
      var b = bat(String(v));
      return v + ({ '은': b ? '은' : '는', '이': b ? '이' : '가', '을': b ? '을' : '를', '과': b ? '과' : '와', '의': '의' })[j];
    });
  }
  function dayNo(y, m, d) { return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2000, 0, 1)) / DAY); }
  function addDays(ymd, n) { var t = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d) + n * DAY); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; }
  function pick(arr, v) { return arr && arr.length ? arr[mod(v, arr.length)] : ''; }

  // 오늘 날 지지와 내 글자 하나의 관계
  function windOf(tb, nb) {
    if (tb === nb) return 'same';
    var k = pk(tb, nb);
    if (BR_CLASH[k]) return 'clash';
    if (BR_COMBINE[k]) return 'combine';
    if (TRIPLE.some(function (t) { return t.indexOf(tb) >= 0 && t.indexOf(nb) >= 0; })) return 'combine';
    if (BR_PUNISH[k]) return 'punish';
    if (WONJIN[k]) return 'wonjin';
    return 'none';
  }

  // 하루 계산 (글 없이 숫자만) — 이번 주 날씨 줄에도 쓴다
  function score(r, a, ymd) {
    var me = r.dayMaster.stem, tp = E.dayPillarOf(ymd.y, ymd.m, ymd.d);
    var god = A.godOf(me, tp.stem), grp = GROUP_OF[god];
    var bgrp = GROUP_OF[A.godOf(me, HIDDEN_MAIN[tp.branch])];
    var s = {}, helper = a.helper, ch = a.climateHelper;
    AREAS.forEach(function (k) { s[k] = AREA_G[grp][k] + AREA_G[bgrp][k] * 0.5 - 0.25; });
    var help = 0;
    if (EL[SE[tp.stem]] === helper) help += 0.5;
    if (EL[BE[tp.branch]] === helper) help += 0.5;
    if (ch && (EL[SE[tp.stem]] === ch || EL[BE[tp.branch]] === ch)) help += 0.25;
    AREAS.forEach(function (k) { s[k] += help; });
    var db = r.pillars.day.branch, mb = r.pillars.month.branch;
    var wind = windOf(tp.branch, db), mwind = windOf(tp.branch, mb);
    if (wind === 'combine') { s.love += 1; s.people += 0.5; }
    if (wind === 'clash') { s.love -= 1; s.body -= 0.5; s.study -= 0.5; }
    if (wind === 'punish') s.people -= 1;
    if (wind === 'wonjin') { s.people -= 0.5; s.love -= 0.5; }
    if (wind === 'same') s.people += 0.5;
    if (mwind === 'combine') s.work += 0.5;
    if (mwind === 'clash') s.work -= 1;
    var lv = {}, sum = 0;
    AREAS.forEach(function (k) { lv[k] = s[k] >= 0.75 ? 2 : s[k] <= -0.75 ? 0 : 1; sum += s[k]; });
    // 맑은 갈래가 하나도 없는 날은 가장 나은 갈래 하나를 맑게 (겁주는 날을 만들지 않는다)
    if (!AREAS.some(function (k) { return lv[k] === 2; })) {
      var best = AREAS.slice().sort(function (x, y) { return s[y] - s[x]; })[0]; lv[best] = 2;
    }
    // 하루 전체 날씨는 여섯 칸 그림과 어긋나지 않게 칸 수로 정한다
    var nSun = 0, nCloud = 0;
    AREAS.forEach(function (k) { if (lv[k] === 2) nSun++; if (lv[k] === 0) nCloud++; });
    var overall = nCloud >= 2 ? 0 : (nCloud === 0 && nSun >= 3) || nSun >= 4 ? 2 : 1;
    return { pillar: tp, god: god, grp: grp, bgrp: bgrp, help: help, wind: wind, mwind: mwind, s: s, lv: lv, overall: overall, no: dayNo(ymd.y, ymd.m, ymd.d) };
  }

  // 행운의 색·숫자 — 결과 화면의 짧은 운세 칸과 똑같이 나온다
  function luckyOf(r, ymd) {
    var seed = hash(ymd.y + '-' + ymd.m + '-' + ymd.d + '|' + r.pillars.day.hanja + '|' + (r.pillars.hour ? r.pillars.hour.hanja : ''));
    var weak = EL.slice().sort(function (a, b) { return r.elements[a] - r.elements[b]; });
    var minN = r.elements[weak[0]];
    var pool = weak.filter(function (e) { return r.elements[e] === minN; });
    return { seed: seed, el: pool[seed % pool.length], num: (seed >>> 3) % 9 + 1 };
  }

  // 좋은 시간대: 내 일지와 합이 되는 시간 (깨어 있는 辰~亥 시간대에서)
  function hoursOf(r, a, tp) {
    var db = r.pillars.day.branch, out = [];
    var six = [], tri = [];
    for (var b = 4; b <= 11; b++) {
      if (b === db) continue;
      if (BR_COMBINE[pk(b, db)]) six.push(b);
      else if (TRIPLE.some(function (t) { return t.indexOf(b) >= 0 && t.indexOf(db) >= 0; })) tri.push(b);
    }
    six.concat(tri).forEach(function (b) { if (out.length < 2 && !BR_CLASH[pk(b, tp.branch)]) out.push({ b: b, why: six.indexOf(b) >= 0 ? 'six' : 'tri' }); });
    if (out.length < 2) for (var x = 4; x <= 11 && out.length < 2; x++) {
      if (EL[BE[x]] === a.helper && x !== db && !BR_CLASH[pk(x, db)] && !BR_CLASH[pk(x, tp.branch)] && !out.some(function (o) { return o.b === x; })) out.push({ b: x, why: 'help' });
    }
    // 그래도 없으면 내 일지·오늘 날과 부딪치지 않는 잔잔한 시간 하나
    if (!out.length) for (var z = 4; z <= 11 && !out.length; z++) {
      var kz = pk(z, db);
      if (z !== db && !BR_CLASH[kz] && !BR_PUNISH[kz] && !WONJIN[kz] && !BR_CLASH[pk(z, tp.branch)]) out.push({ b: z, why: 'calm' });
    }
    out.sort(function (p, q) { return p.b - q.b; });
    return out.map(function (o) {
      var st = mod((tp.stem % 5) * 2 + o.b, 10);
      var from = o.b * 2 - 1, to = o.b * 2 + 1;
      function hm(h) { h = mod(h, 24); return { ap: h < 12 ? '오전' : '오후', t: (h % 12 || 12) + '시 30분' }; }
      var f = hm(from), t = hm(to);
      return { b: o.b, why: o.why, hanja: C.STEMS[st] + C.BRANCHES[o.b], ko: C.BRANCHES_KO[o.b] + '시', range: f.ap + ' ' + f.t + ' ~ ' + (t.ap === f.ap ? '' : t.ap + ' ') + t.t };
    });
  }

  function build(r, a, input, ymd) {
    var name = input && input.name ? input.name : '';
    var sc = score(r, a, ymd), tp = sc.pillar;
    var mp = E.calculate({ calendar: 'solar', year: ymd.y, month: ymd.m, day: ymd.d, hour: 12, minute: 0 }).pillars.month;
    var mgrp = GROUP_OF[A.godOf(r.dayMaster.stem, mp.stem)];
    // 되풀이 줄이기: 같은 무리·같은 글자가 다시 올 때마다 다음 글로 넘어간다
    var no = sc.no, ix = 54 + no;
    var sCyc = Math.floor(ix / 10), vg = sCyc * 2 + mod(ix, 2), bCyc = Math.floor(ix / 12);
    var gt = T.god[sc.god];
    var me = r.dayMaster;
    var o = { NAME: name || '나', DB: r.pillars.day.branchKo, TB: tp.branchKo, MON: mp.ko, DK: tp.ko, DH: tp.hanja,
      SK: tp.stemKo, SH: tp.stemHanja, BK: tp.branchKo, BH: tp.branchHanja, SI: T.stemImg[tp.stem], BI: T.branchImg[tp.branch],
      MK: me.ko, MH: me.hanja, GK: A.GOD_KO[sc.god], GG: T.groupKo[sc.grp] };
    var areas = AREAS.map(function (k, i) {
      var w = WX[sc.lv[k]];
      return { k: k, ko: AREA_KO[k], wx: w, icon: WX_ICON[w], wxKo: WX_KO[w], text: fill(pick(T.area[k][w][sc.grp], vg + i), o) };
    });
    var about = fill(T.aboutDay, o) + ' ' + fill(pick(T.godMean[sc.god], sCyc), o);
    var saying = pick(T.saying[sc.god], sCyc);
    var un = A.unseongOf(me.stem, tp.branch);
    var unLine = '오늘 땅 글자 ' + tp.branchKo + '(' + tp.branchHanja + ')' + (bat(tp.branchKo) ? '은' : '는') + ' 내 일간에게 ' + pick(T.unseong[un.key], bCyc);
    var bestA = AREAS.slice().sort(function (x, y) { return sc.s[y] - sc.s[x]; })[0];
    var low = AREAS.filter(function (k) { return sc.lv[k] === 0; });
    var sumLine2 = low.length
      ? fill(pick(T.sumBest, no), { A: AREA_KO[bestA] }) + ' ' + fill(pick(T.sumLow, no + 1), { B: low.map(function (k) { return AREA_KO[k]; }).join('·') })
      : fill(pick(T.sumBest, no), { A: AREA_KO[bestA] }) + ' ' + pick(T.sumNoLow, no);
    var summary = [fill(pick(gt.sum, sCyc), o), sumLine2];
    var noon;
    if (sc.wind === 'none') noon = pick(T.noon[sc.grp], vg);
    else {
      var db = r.pillars.day.branch, mates = [];
      for (var b = 0; b < 12; b++) if (windOf(b, db) === sc.wind) mates.push(b);
      noon = pick(T.wind[sc.wind].concat((T.windMore || {})[sc.wind] || []), bCyc * mates.length + Math.max(0, mates.indexOf(tp.branch)));
    }
    var flow = [
      { when: '아침', text: fill(pick(T.flow[sc.grp].am, vg), o) },
      { when: '낮', text: fill(noon, o) },
      { when: '저녁', text: fill(pick(T.flow[sc.grp].pm, vg + 1), o) }
    ];
    var month = fill(pick(T.month[mgrp], mp.branch), o);
    var lk = luckyOf(r, ymd), lc = (T.color || {})[lk.el] || { name: ELK[lk.el] };
    var hours = hoursOf(r, a, tp);
    var hwhy = ['six', 'tri', 'help', 'calm'].filter(function (w) { return hours.some(function (h) { return h.why === w; }); })[0];
    var hourText = hours.length ? fill(pick(T.hourWhy[hwhy], no), { H: hours.map(function (h) { return h.ko; }).join('·') }) : '';
    var lucky = [['행운의 색', lc.name], ['행운의 숫자', String(lk.num)], ['행운의 방향', DIR[lk.el]], ['오늘 가까이할 기운', ELK[a.helper] + ' 기운']];
    var todo = pick(T.todo[sc.god], sCyc), rest = pick(T.rest[sc.god], sCyc + 1);
    var week = [];
    for (var i = 0; i < 7; i++) {
      var dd = addDays(ymd, i), s2 = i === 0 ? sc : score(r, a, dd);
      var dw = new Date(Date.UTC(dd.y, dd.m - 1, dd.d)).getUTCDay();
      week.push({ label: i === 0 ? '오늘' : i === 1 ? '내일' : DOW[dw], md: dd.m + '.' + dd.d, wx: WX[s2.overall], icon: WX_ICON[WX[s2.overall]], ko: E.dayPillarOf(dd.y, dd.m, dd.d).ko });
    }
    var tmw = score(r, a, addDays(ymd, 1));
    var tomorrow = fill(pick(T.tease[tmw.god], Math.floor((ix + 1) / 10)), o) + (tmw.overall === 0 ? ' ' + pick(T.teaseCloud, ix) : '');
    var title = gt.title;
    var chars = summary.join('').length + areas.reduce(function (n, x) { return n + x.text.length; }, 0) + flow.reduce(function (n, x) { return n + x.text.length; }, 0) +
      about.length + unLine.length + saying.length + month.length + hourText.length + todo.length + rest.length + tomorrow.length;
    return {
      kind: 'td', date: ymd, dow: DOW[new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d)).getUTCDay()], pillar: tp, monthPillar: mp, god: sc.god, grp: sc.grp, wind: sc.wind, help: sc.help,
      title: title, kw: gt.kw, summary: summary, about: about, unLine: unLine, unseong: un.ko, saying: saying, month: month, areas: areas, flow: flow, hours: hours, hourText: hourText,
      lucky: lucky, luckyEl: lk.el, luckyHex: lc.hex, todo: todo, rest: rest, week: week, tomorrow: tomorrow, overall: WX[sc.overall], chars: chars, s: sc.s
    };
  }

  return { build: build, score: score, luckyOf: luckyOf, hoursOf: hoursOf, windOf: windOf, AREAS: AREAS, WX_ICON: WX_ICON, WX_KO: WX_KO };
});
