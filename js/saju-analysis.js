/*
 * 별빛 사주 — 깊은 분석 (0.6)
 * calculate() 결과 + 성별을 받아 십신, 내 힘의 세기, 돕는 기운, 계절·온도, 합충형, 신살, 12운성, 대운, 올해·내년 운을 구한다.
 * 브라우저: window.SajuAnalysis (SajuEngine 필요) / Node: require
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./saju-engine.js'));
  else root.SajuAnalysis = factory(root.SajuEngine);
})(typeof self !== 'undefined' ? self : this, function (E) {
  'use strict';
  var C = E.constants;
  var SE = C.STEM_ELEMENT, BE = C.BRANCH_ELEMENT, SY = C.STEM_YANG;
  var EL = ['wood', 'fire', 'earth', 'metal', 'water'];
  var ELK = ['나무', '불', '흙', '쇠', '물'];
  var DAY = 86400000;
  function mod(a, n) { return ((a % n) + n) % n; }

  // 지장간 (여기 → 중기 → 본기 순, 마지막이 본기)
  var HIDDEN = [[8, 9], [9, 7, 5], [4, 2, 0], [0, 1], [1, 9, 4], [4, 6, 2], [2, 5, 3], [3, 1, 5], [4, 8, 6], [6, 7], [7, 3, 4], [4, 0, 8]];
  function mainStem(b) { var h = HIDDEN[b]; return h[h.length - 1]; }

  var GOD_KEYS = ['bigyeon', 'geobjae', 'siksin', 'sanggwan', 'pyeonjae', 'jeongjae', 'pyeongwan', 'jeonggwan', 'pyeonin', 'jeongin'];
  var GOD_KO = { bigyeon: '비견', geobjae: '겁재', siksin: '식신', sanggwan: '상관', pyeonjae: '편재', jeongjae: '정재', pyeongwan: '편관', jeonggwan: '정관', pyeonin: '편인', jeongin: '정인' };
  var GROUP_OF = { bigyeon: 'bigeop', geobjae: 'bigeop', siksin: 'siksang', sanggwan: 'siksang', pyeonjae: 'jaeseong', jeongjae: 'jaeseong', pyeongwan: 'gwanseong', jeonggwan: 'gwanseong', pyeonin: 'inseong', jeongin: 'inseong' };
  var GROUPS = ['bigeop', 'siksang', 'jaeseong', 'gwanseong', 'inseong'];
  var GROUP_KO = { bigeop: '나와 같은 힘', siksang: '내가 펼치는 힘', jaeseong: '내가 다루는 힘(재물)', gwanseong: '나를 다스리는 힘(일·규칙)', inseong: '나를 돕는 힘(배움·보살핌)' };

  // 나(일간) 기준 다른 천간의 십신
  function godOf(me, other) {
    var d = mod(SE[other] - SE[me], 5), same = SY[me] === SY[other];
    return GOD_KEYS[d * 2 + (same ? 0 : 1)];
  }
  // 나 기준 어떤 오행이 어느 무리인지
  function groupOfElement(meEl, el) { return GROUPS[mod(el - meEl, 5)]; }

  var POS = [
    { key: 'yS', label: '태어난 해의 위 글자', short: '년간', w: 0.8 },
    { key: 'yB', label: '태어난 해의 아래 글자', short: '년지', w: 1.0 },
    { key: 'mS', label: '태어난 달의 위 글자', short: '월간', w: 1.0 },
    { key: 'mB', label: '태어난 달의 아래 글자', short: '월지', w: 3.0 },
    { key: 'dB', label: '태어난 날의 아래 글자(배우자 자리)', short: '일지', w: 1.5 },
    { key: 'hS', label: '태어난 시의 위 글자', short: '시간', w: 1.0 },
    { key: 'hB', label: '태어난 시의 아래 글자', short: '시지', w: 1.0 }
  ];

  // 12운성: 양간은 장생 자리부터 순행, 음간은 역행
  var UNSEONG = ['jangsaeng', 'mokyok', 'gwandae', 'geonrok', 'jewang', 'swe', 'byeong', 'sa', 'myo', 'jeol', 'tae', 'yang'];
  var UNSEONG_KO = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양'];
  var JANGSAENG = { 0: 11, 2: 2, 4: 2, 6: 5, 8: 8, 1: 6, 3: 9, 5: 9, 7: 0, 9: 3 };
  function unseongOf(stem, branch) {
    var start = JANGSAENG[stem];
    var i = SY[stem] ? mod(branch - start, 12) : mod(start - branch, 12);
    return { key: UNSEONG[i], ko: UNSEONG_KO[i] };
  }

  // 합·충·형
  var STEM_COMBINE = { '0-5': 2, '1-6': 3, '2-7': 4, '3-8': 0, '4-9': 1 }; // 합해서 되는 오행
  var STEM_CLASH = { '0-6': 1, '1-7': 1, '2-8': 1, '3-9': 1 };
  var BR_COMBINE = { '0-1': 2, '2-11': 0, '3-10': 1, '4-9': 3, '5-8': 4, '6-7': 1 };
  var BR_CLASH = { '0-6': 1, '1-7': 1, '2-8': 1, '3-9': 1, '4-10': 1, '5-11': 1 };
  var BR_PUNISH = { '2-5': 1, '5-8': 1, '2-8': 1, '1-10': 1, '7-10': 1, '1-7': 1, '0-3': 1 };
  var SELF_PUNISH = { 4: 1, 6: 1, 9: 1, 11: 1 };
  var TRIPLE = [[8, 0, 4, 4], [2, 6, 10, 1], [5, 9, 1, 3], [11, 3, 7, 0]]; // 생지, 왕지, 고지, 오행
  function pk(a, b) { return Math.min(a, b) + '-' + Math.max(a, b); }

  // 신살
  var GROUP3 = function (b) { return [0, 4, 8].indexOf(b) >= 0 ? 0 : [2, 6, 10].indexOf(b) >= 0 ? 1 : [5, 9, 1].indexOf(b) >= 0 ? 2 : 3; };
  var DOHWA = [9, 3, 6, 0], YEOKMA = [2, 8, 11, 5], HWAGAE = [4, 10, 1, 7];
  var CHEONEUL = { 0: [1, 7], 4: [1, 7], 6: [1, 7], 1: [0, 8], 5: [0, 8], 2: [11, 9], 3: [11, 9], 8: [5, 3], 9: [5, 3], 7: [2, 6] };
  var MUNCHANG = { 0: 5, 1: 6, 2: 8, 3: 9, 4: 8, 5: 9, 6: 11, 7: 0, 8: 2, 9: 3 };
  var GOEGANG = { '6-4': 1, '6-10': 1, '8-4': 1, '8-10': 1, '4-10': 1 };

  function idx60(stem, branch) { for (var i = 0; i < 60; i++) if (i % 10 === stem && i % 12 === branch) return i; return 0; }
  function gz(i) {
    return { stem: i % 10, branch: i % 12, hanja: C.STEMS[i % 10] + C.BRANCHES[i % 12], ko: C.STEMS_KO[i % 10] + C.BRANCHES_KO[i % 12],
      stemElement: EL[SE[i % 10]], branchElement: EL[BE[i % 12]] };
  }

  function analyze(r, opts) {
    opts = opts || {};
    var gender = opts.gender === 'M' ? 'M' : 'F';
    var now = opts.now || Date.now();
    var P = r.pillars, me = P.day.stem, meEl = SE[me];
    var stems = { yS: P.year.stem, mS: P.month.stem, hS: P.hour ? P.hour.stem : null };
    var branches = { yB: P.year.branch, mB: P.month.branch, dB: P.day.branch, hB: P.hour ? P.hour.branch : null };

    // ---- 십신 ----
    var gods = [], godCount = {}, groupCount = {}, groupWeight = {};
    GOD_KEYS.forEach(function (k) { godCount[k] = 0; });
    GROUPS.forEach(function (g) { groupCount[g] = 0; groupWeight[g] = 0; });
    POS.forEach(function (p) {
      var isStem = p.key.charAt(1) === 'S';
      var v = isStem ? stems[p.key] : branches[p.key];
      if (v === null || v === undefined) return;
      var stem = isStem ? v : mainStem(v);
      var god = godOf(me, stem);
      gods.push({ pos: p.key, label: p.label, short: p.short, god: god, godKo: GOD_KO[god], group: GROUP_OF[god],
        char: isStem ? C.STEMS[v] : C.BRANCHES[v], charKo: isStem ? C.STEMS_KO[v] : C.BRANCHES_KO[v] });
      godCount[god]++; groupCount[GROUP_OF[god]]++; groupWeight[GROUP_OF[god]] += p.w;
    });
    var ordered = GROUPS.slice().sort(function (a, b) { return groupWeight[b] - groupWeight[a]; });
    var dominantGroup = ordered[0];
    var monthGod = gods.filter(function (g) { return g.pos === 'mB'; })[0];
    var dayBranchGod = gods.filter(function (g) { return g.pos === 'dB'; })[0];

    // ---- 내 힘의 세기 ----
    var total = 0, support = 0;
    POS.forEach(function (p) {
      var isStem = p.key.charAt(1) === 'S', v = isStem ? stems[p.key] : branches[p.key];
      if (v === null || v === undefined) return;
      var el = isStem ? SE[v] : BE[v];
      total += p.w;
      var g = groupOfElement(meEl, el);
      if (g === 'bigeop' || g === 'inseong') support += p.w;
    });
    var ratio = total ? support / total : .5;
    var level = ratio < .25 ? 'veryWeak' : ratio < .42 ? 'weak' : ratio < .58 ? 'balanced' : ratio < .75 ? 'strong' : 'veryStrong';

    // ---- 오행 개수, 온도 ----
    var ec = r.elements, cnt = EL.map(function (e) { return ec[e]; });
    var mb = branches.mB;
    var seasonHeat = [5, 6, 7].indexOf(mb) >= 0 ? 2 : [11, 0, 1].indexOf(mb) >= 0 ? -2 : 0;
    var temp = cnt[1] - cnt[4] + seasonHeat;
    var climate = temp >= 3 ? (cnt[4] === 0 ? 'hotDry' : 'hot') : temp <= -3 ? (cnt[4] >= 3 ? 'coldWet' : 'cold') : 'mild';

    // ---- 돕는 기운 ----
    var cand = (level === 'strong' || level === 'veryStrong') ? [mod(meEl + 2, 5), mod(meEl + 1, 5), mod(meEl + 3, 5)]
      : (level === 'weak' || level === 'veryWeak') ? [mod(meEl + 4, 5), meEl] : [0, 1, 2, 3, 4];
    var helper = cand.slice().sort(function (a, b) { return cnt[a] - cnt[b] || cand.indexOf(a) - cand.indexOf(b); })[0];
    var climateHelper = null;
    if ((climate === 'hot' || climate === 'hotDry') && helper !== 4) climateHelper = 4;
    if ((climate === 'cold' || climate === 'coldWet') && helper !== 1) climateHelper = 1;

    // ---- 합·충·형 ----
    var inter = [];
    var sPos = [['yS', '태어난 해'], ['mS', '태어난 달'], ['dS', '태어난 날(나)'], ['hS', '태어난 시']];
    var sVal = { yS: stems.yS, mS: stems.mS, dS: me, hS: stems.hS };
    for (var i = 0; i < 4; i++) for (var j = i + 1; j < 4; j++) {
      var a = sVal[sPos[i][0]], b = sVal[sPos[j][0]];
      if (a === null || b === null) continue;
      var key = pk(a, b);
      if (STEM_COMBINE[key] !== undefined) inter.push({ type: 'stemCombine', a: sPos[i], b: sPos[j], chars: C.STEMS[a] + C.STEMS[b], becomes: ELK[STEM_COMBINE[key]], withDay: sPos[i][0] === 'dS' || sPos[j][0] === 'dS' });
      if (STEM_CLASH[key]) inter.push({ type: 'stemClash', a: sPos[i], b: sPos[j], chars: C.STEMS[a] + C.STEMS[b], withDay: sPos[i][0] === 'dS' || sPos[j][0] === 'dS' });
    }
    var bPos = [['yB', '태어난 해'], ['mB', '태어난 달'], ['dB', '태어난 날(배우자 자리)'], ['hB', '태어난 시']];
    for (i = 0; i < 4; i++) for (j = i + 1; j < 4; j++) {
      a = branches[bPos[i][0]]; b = branches[bPos[j][0]];
      if (a === null || b === null) continue;
      key = pk(a, b);
      var wd = bPos[i][0] === 'dB' || bPos[j][0] === 'dB';
      if (BR_COMBINE[key] !== undefined) inter.push({ type: 'branchCombine', a: bPos[i], b: bPos[j], chars: C.BRANCHES[a] + C.BRANCHES[b], becomes: ELK[BR_COMBINE[key]], withDay: wd });
      if (BR_CLASH[key]) inter.push({ type: 'branchClash', a: bPos[i], b: bPos[j], chars: C.BRANCHES[a] + C.BRANCHES[b], withDay: wd });
      if (BR_PUNISH[key] || (a === b && SELF_PUNISH[a])) inter.push({ type: 'branchPunish', a: bPos[i], b: bPos[j], chars: C.BRANCHES[a] + C.BRANCHES[b], withDay: wd });
    }
    var bl = [branches.yB, branches.mB, branches.dB, branches.hB].filter(function (x) { return x !== null; });
    TRIPLE.forEach(function (t) {
      var have = t.slice(0, 3).filter(function (x) { return bl.indexOf(x) >= 0; });
      if (have.length === 3 || (have.length === 2 && have.indexOf(t[1]) >= 0)) {
        inter.push({ type: 'tripleCombine', full: have.length === 3, chars: have.map(function (x) { return C.BRANCHES[x]; }).join(''), becomes: ELK[t[3]] });
      }
    });

    // ---- 신살 ----
    var sinsal = [];
    function addS(key, at) { if (!sinsal.some(function (s) { return s.key === key; })) sinsal.push({ key: key, at: at }); }
    [['yB', branches.yB], ['dB', branches.dB]].forEach(function (base) {
      var g3 = GROUP3(base[1]);
      bPos.forEach(function (p) {
        var v = branches[p[0]]; if (v === null || p[0] === base[0]) return;
        if (v === DOHWA[g3]) addS('dohwa', p[1]);
        if (v === YEOKMA[g3]) addS('yeokma', p[1]);
        if (v === HWAGAE[g3]) addS('hwagae', p[1]);
      });
    });
    bPos.forEach(function (p) {
      var v = branches[p[0]]; if (v === null) return;
      if (CHEONEUL[me].indexOf(v) >= 0) addS('cheoneul', p[1]);
      if (MUNCHANG[me] === v) addS('munchang', p[1]);
    });
    if (GOEGANG[me + '-' + branches.dB]) addS('goegang', '태어난 날');

    // ---- 12운성 ----
    var unseong = {};
    bPos.forEach(function (p) { var v = branches[p[0]]; if (v !== null) unseong[p[0]] = unseongOf(me, v); });

    // ---- 대운 ----
    var forward = (SY[P.year.stem] && gender === 'M') || (!SY[P.year.stem] && gender === 'F');
    var birthY = r.input.solarYear, jl = [];
    [birthY - 1, birthY, birthY + 1].forEach(function (y) { try { jl = jl.concat(E.jieList(y)); } catch (e) { } });
    jl.sort(function (x, y) { return x.ms - y.ms; });
    var target = null;
    for (i = 0; i < jl.length; i++) {
      if (forward && jl[i].ms > r.utc) { target = jl[i]; break; }
      if (!forward && jl[i].ms <= r.utc) target = jl[i];
    }
    var days = target ? Math.abs(target.ms - r.utc) / DAY : 15;
    var startMonths = Math.round(days / 3 * 12);
    var startAge = Math.floor(startMonths / 12), startAgeMonths = startMonths % 12;
    var mIdx = idx60(P.month.stem, P.month.branch);
    var birthMs = r.utc, ageNow = (now - birthMs) / (365.2425 * DAY);
    var daeun = [];
    for (i = 1; i <= 9; i++) {
      var p60 = gz(mod(mIdx + (forward ? i : -i), 60));
      var from = startAge + startAgeMonths / 12 + (i - 1) * 10;
      daeun.push({ n: i, pillar: p60, fromAge: from, toAge: from + 10, god: godOf(me, p60.stem),
        groundGroup: groupOfElement(meEl, BE[p60.branch]), current: ageNow >= from && ageNow < from + 10,
        fromYear: Math.floor(birthY + from) });
    }

    // ---- 올해·내년 ----
    function yearInfo(y) {
      var p = gz(mod(y - 4, 60)), extra = [];
      var db = branches.dB, mbb = branches.mB;
      if (BR_CLASH[pk(p.branch, db)]) extra.push('clashDay');
      if (BR_COMBINE[pk(p.branch, db)] !== undefined) extra.push('combineDay');
      if (BR_CLASH[pk(p.branch, mbb)]) extra.push('clashMonth');
      if (p.branch === db) extra.push('sameAsDay');
      return { year: y, pillar: p, god: godOf(me, p.stem), groundGroup: groupOfElement(meEl, BE[p.branch]), extra: extra };
    }
    var thisYear = new Date(now + 9 * 3600000).getUTCFullYear();

    // 짝이 되는 기운 (남: 재성, 여: 관성)
    var partnerGroup = gender === 'M' ? 'jaeseong' : 'gwanseong';
    var pc = groupCount[partnerGroup];

    return {
      gender: gender, me: me, meEl: EL[meEl], meElKo: ELK[meEl],
      gods: gods, godCount: godCount, groupCount: groupCount, groupWeight: groupWeight, dominantGroup: dominantGroup, groupOrder: ordered,
      monthGod: monthGod, dayBranchGod: dayBranchGod,
      strength: { level: level, ratio: ratio },
      climate: climate, helper: EL[helper], helperKo: ELK[helper], climateHelper: climateHelper === null ? null : EL[climateHelper],
      interactions: inter, sinsal: sinsal, unseong: unseong,
      daeun: { forward: forward, startAge: startAge, startAgeMonths: startAgeMonths, list: daeun },
      ageNow: ageNow, years: [yearInfo(thisYear), yearInfo(thisYear + 1)],
      partner: { group: partnerGroup, state: pc === 0 ? 'none' : pc === 1 ? 'one' : 'many', count: pc },
      constants: { GOD_KO: GOD_KO, GROUP_KO: GROUP_KO, ELK: ELK, EL: EL }
    };
  }

  return { analyze: analyze, godOf: godOf, unseongOf: unseongOf, HIDDEN: HIDDEN, GOD_KO: GOD_KO };
});
