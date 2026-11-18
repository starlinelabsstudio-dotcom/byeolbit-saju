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
    var areaBlocks0 = [
      H('💼 일·공부'), P(ar.work),
      H('💰 돈'), P(ar.money),
      H('💗 사랑·사람'), P(love.join(' ')),
      H('🌿 몸 관리'), P(ar.health + ' ' + (N.healthClimate[a.climate] || N.healthClimate.mild)),
      H('🏠 가족·집'), P(ar.family),
      H('미리 챙기면 좋은 점'), P(N.care[god]),
      { list: N.tips[god], label: '2027년에 해 보면 좋은 것' }
    ];
    var areaBlocks = clean(areaBlocks0);

    // ---------- 3. 달마다 ----------
    var seenGod = {}, months = monthsOf(Y).map(function (m) {
      var g = A.godOf(me, m.pillar.stem), n = seenGod[g] = (seenGod[g] || 0) + 1;
      var v = N.month[g][Math.min(n, 2) - 1];
      var key = pk(m.pillar.branch, dayB);
      var flags = [];
      if (m.pillar.branch !== dayB && BR_CLASH[key]) flags.push('clashDay');
      else if (BR_COMBINE[key]) flags.push('combineDay');
      var help = m.pillar.stemElement === helper || m.pillar.branchElement === helper;
      var gg = GROUP_OF[g], gb = GROUPS[mod(BE[m.pillar.branch] - meEl, 5)];
      // 물결: 바깥으로 움직이는 정도(좋고 나쁨이 아님)
      var LV = { siksang: 4.2, jaeseong: 4.6, gwanseong: 3.4, bigeop: 3, inseong: 1.8 };
      var lv = LV[gg] + (gb === 'siksang' || gb === 'jaeseong' ? .4 : gb === 'inseong' ? -.4 : 0) + (flags[0] === 'clashDay' ? .5 : 0);
      var a1 = seoulMD(m.from), a2 = seoulMD(m.to - 86400000);
      var text = [N.season[m.i], v.text];
      flags.forEach(function (f) { text.push(N.monthExtra[f]); });
      if (help) text.push(fill(N.monthExtra.helper, { el: helperKo }));
      return { n: m.i + 1, pillar: m.pillar, god: g, flow: N.flow[g], range: a1.m + '.' + a1.d + ' ~ ' + a2.m + '.' + a2.d,
        label: (a1.y !== Y ? a1.y + '년 ' : '') + a1.m + '월', short: a1.m + '월', year: a1.y, text: text.join(' '), tip: v.tip, help: help, level: Math.max(1, Math.min(5.5, lv)), flags: flags };
    });
    var helpMonths = months.filter(function (m) { return m.help; }).map(function (m) { return m.label; });

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
      { id: 'ny-areas', title: '분야별 운', sub: '일·공부 · 돈 · 사랑 · 몸 · 가족', blocks: areaBlocks },
      { id: 'ny-months', title: '달마다의 운', sub: Y + '.' + months[0].range.split(' ~ ')[0] + ' ~ ' + (Y + 1) + '.' + months[11].range.split(' ~ ')[1], blocks: [
        P('사주의 달은 1일이 아니라 절기(입춘·경칩 같은 24절기 중 12개)에 바뀌어요. 그래서 날짜가 달력과 조금 달라요. 물결 그림은 바깥으로 활발히 움직이는 정도예요. 낮은 달은 나쁜 달이 아니라 안으로 다지고 쉬어 가는 달이에요.'),
        { wave: months },
        { list: [0, 1, 2, 3].map(function (s) {
          var ms = months.slice(s * 3, s * 3 + 3);
          return N.seasonName[s] + '(' + ms[0].short + '~' + ms[2].short + '): ' + ms.map(function (m) { return m.flow.replace(/ 달$/, ''); }).join(' → ');
        }), label: '계절별 흐름 한눈에' },
        { months: months }] },
      { id: 'ny-luck', title: '2027 행운 열쇠', sub: '나를 돕는 ' + helperKo + ' 기운', blocks: luck }
    ];
    var summary = [
      '2027년은 정미년(丁未年), 나에게는 ‘' + one.line + '’' + (bat(one.line) ? '이에요.' : '예요.'),
      '올해 들어오는 기운: ' + N.groupShort[grp] + (ground !== grp ? ', 그리고 바닥에 깔린 ' + N.groupShort[ground] : ''),
      helpMonths.length ? '힘이 나는 달: ' + helpMonths.join(', ') + ' (나를 돕는 ' + helperKo + ' 기운이 오는 달)' : '올해는 달마다 기운이 고르게 흘러가요.',
      N.beforeIpchun
    ];
    var chars = summary.join('').length;
    chapters.forEach(function (c) { c.blocks.forEach(function (b) { if (b.p) chars += b.p.length; if (b.months) b.months.forEach(function (m) { chars += m.text.length + m.tip.length; }); }); });
    return { year: Y, pillar: yp, god: god, oneLine: one.line, keywords: one.kw, summary: summary, chapters: chapters, months: months, chars: chars };

    function josaWa(w) { return bat(w) ? '과' : '와'; }
  }

  return { build: build, monthsOf: monthsOf };
});
