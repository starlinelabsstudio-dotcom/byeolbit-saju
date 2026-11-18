/*
 * 별빛 사주 — 속궁합 · 일 궁합 (0.10)
 * buildSok(rA, inA, rB, inB) / buildWork(rA, inA, rB, inB) → { type, name, keywords, summary[], chapters[], chars, rel, pLabel }
 * 연애 궁합(match.js)의 판정을 바탕으로 보는 눈만 바꾼다. 성별은 쓰지 않는다.
 * 궁합 이름은 A와 B를 바꿔 넣어도 같아야 하고, 방향이 있는 값(도화·이끄는 쪽)은 뒤집혀 나와야 한다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./saju-engine.js'), require('./saju-analysis.js'), require('./match.js'), require('./match-more-texts.js'), require('./newyear-texts.js'), require('./deep/a.js'));
  } else root.MatchMore = factory(root.SajuEngine, root.SajuAnalysis, root.Match, root.SAJU_MT2 || {}, root.SAJU_NY || {}, root.SAJU_DEEP || {});
})(typeof self !== 'undefined' ? self : this, function (E, A, MT, S, N, D) {
  'use strict';
  var C = E.constants, SE = C.STEM_ELEMENT;
  var EL = ['wood', 'fire', 'earth', 'metal', 'water'];
  var ELK = { wood: '나무', fire: '불', earth: '흙', metal: '쇠', water: '물' };
  var GROUP_OF = { bigyeon: 'bigeop', geobjae: 'bigeop', siksin: 'siksang', sanggwan: 'siksang', pyeonjae: 'jaeseong', jeongjae: 'jaeseong', pyeongwan: 'gwanseong', jeonggwan: 'gwanseong', pyeonin: 'inseong', jeongin: 'inseong' };
  // 도화: 삼합 무리(지지 번호 % 4)마다 정해진 글자 — 申子辰→酉, 巳酉丑→午, 寅午戌→卯, 亥卯未→子
  var DOHWA = [9, 6, 3, 0];
  function dohwaOf(b) { return DOHWA[b % 4]; }
  function bat(w) { var c = String(w).charCodeAt(String(w).length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 !== 0; }
  function jo(w, a, b) { return w + (bat(w) ? a : b); }
  function ieyo(w) { return w + (bat(w) ? '이에요' : '예요'); }
  function fill(t, o) { return String(t || '').replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function person(label) {
    if (label === '나') return { '': '나', 은: '나는', 이: '내가', 을: '나를', 과: '나와', 의: '나의', 에게: '나에게' };
    return { '': label, 은: jo(label, '은', '는'), 이: jo(label, '이', '가'), 을: jo(label, '을', '를'), 과: jo(label, '과', '와'), 의: label + '의', 에게: label + '에게' };
  }
  function fillP(t, map) { return String(t || '').replace(/\{([XYP])(은|이|을|과|의|에게)?\}/g, function (m, k, j) { return map[k] ? map[k][j || ''] : m; }); }
  function P(t, cls) { return t ? { p: t, cls: cls || '' } : null; }
  function H(t) { return { h: t }; }
  function clean(arr) { return arr.filter(function (x) { return x; }); }
  function pairKey(a, b) { return [a, b].sort().join('-'); }
  function countChars(summary, chapters) {
    var n = summary.join('').length;
    chapters.forEach(function (c) { c.blocks.forEach(function (b) { if (b.p) n += b.p.length; if (b.list) b.list.forEach(function (t) { n += t.length; }); if (b.lucky) b.lucky.forEach(function (l) { n += l[1].length; }); if (b.roles) b.roles.rows.forEach(function (x) { n += x.job.length + x.who.length; }); }); });
    return n;
  }
  function people(inB) {
    var pLabel = inB && inB.name ? inB.name + '님' : '상대';
    return { pLabel: pLabel, me: person('나'), pp: person(pLabel) };
  }
  function brs(r) { return ['year', 'month', 'day', 'hour'].map(function (k) { return r.pillars[k]; }).filter(Boolean).map(function (p) { return p.branch; }); }
  // A의 도화 글자(띠·일지 기준)가 B 사주에 있으면 그 글자 번호, 없으면 -1
  function dohwaHit(rA, rB) {
    var c = [dohwaOf(rA.pillars.year.branch), dohwaOf(rA.pillars.day.branch)], b = brs(rB);
    for (var i = 0; i < c.length; i++) if (b.indexOf(c[i]) >= 0) return c[i];
    return -1;
  }
  function tempOf(r) {
    var mb = r.pillars.month.branch, sh = [5, 6, 7].indexOf(mb) >= 0 ? 2 : [11, 0, 1].indexOf(mb) >= 0 ? -2 : 0;
    return r.elements.fire - r.elements.water + sh;
  }
  function tcls(t) { return t >= 2 ? 'warm' : t <= -2 ? 'cool' : 'mild'; }
  var RANK3 = { fast: 2, mid: 1, slow: 0, careful: 0 };
  function gap(a, b) { var d = Math.abs(RANK3[a] - RANK3[b]); return d === 0 ? 'same' : d === 1 ? 'near' : 'far'; }

  // ================= 속궁합 =================
  function sokSpeed(r, tc) {
    var s = r.pillars.day.stem, b = r.pillars.day.branch;
    var v = (s % 2 === 0 ? 1 : 0) + ([2, 5, 8, 11].indexOf(b) >= 0 ? 1 : [1, 4, 7, 10].indexOf(b) >= 0 ? -1 : 0) + (tc === 'warm' ? 1 : tc === 'cool' ? -1 : 0);
    return v >= 2 ? 'fast' : v === 1 ? 'mid' : 'slow';
  }
  function exprOf(a) { var s = a.groupCount.siksang, i = a.groupCount.inseong; return s > i ? 'express' : i > s ? 'receive' : 'balance'; }
  function judgeSok(rA, rB) {
    var J = MT.judge(rA, rB);
    var dAB = dohwaHit(rA, rB), dBA = dohwaHit(rB, rA);
    var tA = tempOf(rA), tB = tempOf(rB), cA = tcls(tA), cB = tcls(tB), tk = pairKey(cA, cB);
    var type = J.stem === 'combine' ? 'stemHap' : J.day === 'hap' ? 'branchHap' : J.day === 'clash' ? 'clash'
      : (dAB >= 0 && dBA >= 0) ? 'dohwa' : tk === 'cool-warm' ? 'balance' : tk === 'warm-warm' ? 'warm'
        : (J.day === 'half' || J.day === 'same' || tk === 'cool-cool') ? 'calm' : 'slow';
    var aA = A.analyze(rA, { gender: 'F' }), aB = A.analyze(rB, { gender: 'F' });
    var sA = sokSpeed(rA, cA), sB = sokSpeed(rB, cB);
    return { type: type, stem: J.stem, day: J.day, dohwaAB: dohwaHit(rA, rB), dohwaBA: dBA, tA: tA, tB: tB, cA: cA, cB: cB, tk: tk,
      speedA: sA, speedB: sB, speedGap: gap(sA, sB), exprA: exprOf(aA), exprB: exprOf(aB), helperA: aA.helper, helperB: aB.helper };
  }

  function buildSok(rA, inA, rB, inB) {
    var J = judgeSok(rA, rB), T = S.sok.types[J.type], X = S.sok;
    var pe = people(inB), pLabel = pe.pLabel, me = pe.me, pp = pe.pp;
    function F(t, o) { return fillP(fill(t, o || {}), { P: pp }); }
    var dA = rA.pillars.day, dB = rB.pillars.day;

    // 1. 서로 끌리는 힘
    var c1 = [{ chips: T.kw.map(function (k) { return '#' + k; }), label: '두 사람의 낱말' }, P(T.intro, 'lead'), P(T.more), P(X.pullIntro)];
    c1.push(H('배우자 자리의 만남 · ' + dA.branchHanja + ' ' + dB.branchHanja), P(X.dayRel[J.day]));
    if (J.stem === 'combine') c1.push(P(X.stemHapExtra));
    c1.push(H('매력의 별, 도화'), P(X.dohwaIntro));
    function chName(b) { return C.BRANCHES_KO[b] + '(' + C.BRANCHES[b] + ')'; }
    if (J.dohwaAB >= 0) c1.push(P(F(X.dohwaToMe, { ch: chName(J.dohwaAB) })));
    if (J.dohwaBA >= 0) c1.push(P(F(X.dohwaToP, { ch: chName(J.dohwaBA) })));
    if (J.dohwaAB >= 0 && J.dohwaBA >= 0) c1.push(P(X.dohwaBoth));
    if (J.dohwaAB < 0 && J.dohwaBA < 0) c1.push(P(X.dohwaNone));

    // 2. 두 사람의 온도
    var c2 = [P(X.tempIntro), { temps: [{ name: '나', v: J.tA, cls: J.cA }, { name: pLabel, v: J.tB, cls: J.cB }] }];
    if (J.cA === J.cB) c2.push(P(fillP(X.tempOne[J.cA], { X: { '은': '두 사람은 모두' } })));
    else c2.push(P(fillP(X.tempOne[J.cA], { X: me })), P(fillP(X.tempOne[J.cB], { X: pp })));
    c2.push(H('두 온도가 만나면'), P(X.tempPair[J.tk]));
    if (!rA.pillars.hour || !rB.pillars.hour) c2.push(P(X.tempNote, 'note'));

    // 3. 가까워지는 속도
    var c3 = [P(X.speedIntro)];
    if (J.speedA === J.speedB) c3.push(P(fillP(X.speedOne[J.speedA], { X: { '은': '두 사람은 모두' } })));
    else c3.push(P(fillP(X.speedOne[J.speedA], { X: me })), P(fillP(X.speedOne[J.speedB], { X: pp })));
    c3.push(P(X.speedPair[J.speedGap]), { list: X.speedTips[J.speedGap], label: '두 사람의 속도를 맞추는 법' });

    // 4. 사랑을 표현하는 법
    var c4 = [P(X.exprIntro)];
    if (J.exprA === J.exprB) c4.push(P(fillP(X.exprOne[J.exprA], { X: { '은': '두 사람은 모두' } })));
    else c4.push(P(fillP(X.exprOne[J.exprA], { X: me })), P(fillP(X.exprOne[J.exprB], { X: pp })));
    c4.push(P(X.exprPair[pairKey(J.exprA, J.exprB)]));
    var elA = EL[SE[dA.stem]], elB = EL[SE[dB.stem]];
    if (elA === elB) c4.push({ list: X.touch[elA], label: '두 사람 모두에게 닿는 표현 (' + ELK[elA] + ' 기운)' });
    else c4.push({ list: X.touch[elB], label: pp['에게'] + ' 닿는 표현 (' + ELK[elB] + ' 기운)' }, { list: X.touch[elA], label: '나에게 닿는 표현 (' + ELK[elA] + ' 기운)' });

    // 5. 둘에게 맞는 분위기
    var hA = J.helperA, hB = J.helperB, mA = X.mood[hA], mB = X.mood[hB], same = hA === hB;
    function mix(k) { return same ? mA[k] : mA[k].split(', ')[0] + ', ' + mB[k].split(', ')[0]; }
    var c5 = [P(F(same ? X.moodIntro.same : X.moodIntro.diff, { el: ELK[hA], elA: ELK[hA], elB: ELK[hB] })),
      { lucky: [['빛', mix('light')], ['음악', mix('music')], ['향', mix('scent')], ['함께 가면 좋은 곳', mix('place')]] }, P(X.moodEnd)];

    var TK = { warm: '따뜻함', mild: '알맞음', cool: '시원함' }, SK = { fast: '빠른 편', mid: '보통', slow: '천천히' };
    var summary = ['두 사람은 ‘' + T.name + '’예요.',
      '끌림: ' + (J.day === 'hap' ? '배우자 자리 육합' : J.day === 'clash' ? '배우자 자리 충' : J.stem === 'combine' ? '천간합' : (J.dohwaAB >= 0 && J.dohwaBA >= 0) ? '서로의 도화' : (J.dohwaAB >= 0 || J.dohwaBA >= 0) ? '한쪽의 도화' : '시간이 쌓이는 끌림'),
      '온도: 나 ' + TK[J.cA] + ' · ' + pLabel + ' ' + TK[J.cB],
      '속도: 나 ' + SK[J.speedA] + ' · ' + pLabel + ' ' + SK[J.speedB],
      X.notice];
    var chapters = [
      { id: 'sk-pull', title: '서로 끌리는 힘', sub: '배우자 자리 · 천간합 · 도화', blocks: clean(c1) },
      { id: 'sk-temp', title: '두 사람의 온도', sub: '따뜻함과 시원함', blocks: clean(c2) },
      { id: 'sk-speed', title: '가까워지는 속도', sub: '양·음과 배우자 자리', blocks: clean(c3) },
      { id: 'sk-expr', title: '사랑을 표현하는 법', sub: '식상과 인성', blocks: clean(c4) },
      { id: 'sk-mood', title: '둘에게 맞는 분위기', sub: '두 사람을 돕는 기운', blocks: clean(c5) }
    ];
    return { kind: 'sk', type: J.type, name: T.name, keywords: T.kw, summary: summary, chapters: chapters, chars: countChars(summary, chapters), rel: J, pLabel: pLabel };
  }

  // ================= 일 궁합 =================
  function workSpeed(a, r) {
    var v = (r.pillars.day.stem % 2 === 0 ? 1 : 0) + (a.climate === 'hot' || a.climate === 'hotDry' ? 1 : a.climate === 'cold' || a.climate === 'coldWet' ? -1 : 0);
    return v >= 2 ? 'fast' : v === 1 ? 'mid' : 'careful';
  }
  function judgeWork(rA, rB) {
    var J = MT.judge(rA, rB);
    var month = MT.brRel(rA.pillars.month.branch, rB.pillars.month.branch);
    var rub = J.stemClash || month === 'clash';
    var type = J.stem === 'combine' ? 'combine' : rub ? 'rub' : (J.fillA && J.fillB) ? 'fill' : J.stem === 'ctrl' ? 'lead' : J.stem === 'gen' ? 'grow' : 'peer';
    // 이끄는 쪽: 내 기운이 상대 기운을 누르면(d=2) 나, 반대(d=3)면 상대. 살려 주는 쪽: d=1이면 나, d=4면 상대.
    var leader = J.stem === 'ctrl' ? (J.d === 2 ? 'A' : 'B') : null, giver = J.stem === 'gen' ? (J.d === 1 ? 'A' : 'B') : null;
    var aA = A.analyze(rA, { gender: 'F' }), aB = A.analyze(rB, { gender: 'F' });
    var sA = workSpeed(aA, rA), sB = workSpeed(aB, rB);
    var sum = {}; EL.forEach(function (e) { sum[e] = rA.elements[e] + rB.elements[e]; });
    var top = EL.slice().sort(function (a, b) { return sum[b] - sum[a] || EL.indexOf(a) - EL.indexOf(b); })[0];
    var low = EL.slice().sort(function (a, b) { return sum[a] - sum[b] || EL.indexOf(a) - EL.indexOf(b); })[0];
    return { type: type, stem: J.stem, d: J.d, stemClash: J.stemClash, month: month, fillA: J.fillA, fillB: J.fillB, leader: leader, giver: giver,
      speedA: sA, speedB: sB, speedGap: gap(sA, sB), sum: sum, top: top, low: low, helperA: aA.helper, helperB: aB.helper };
  }

  function buildWork(rA, inA, rB, inB) {
    var J = judgeWork(rA, rB), T = S.work.types[J.type], X = S.work;
    var pe = people(inB), pLabel = pe.pLabel, me = pe.me, pp = pe.pp;
    function F(t, o) { return fillP(fill(t, o || {}), { P: pp }); }
    var dA = rA.pillars.day, dB = rB.pillars.day, sA = dA.stem, sB = dB.stem, elA = EL[SE[sA]], elB = EL[SE[sB]];
    var GK = A.GOD_KO || {};

    // 1. 두 사람의 자리
    var c1 = [{ chips: T.kw.map(function (k) { return '#' + k; }), label: '두 사람의 낱말' }, P(T.intro, 'lead'), P(T.more), H('누가 이끌고 누가 받쳐 주나'), P(X.roleIntro)];
    if (J.stem === 'combine') c1.push(P(X.role.combine));
    else if (J.stem === 'same') c1.push(P(X.role.same));
    else if (J.stem === 'ctrl') c1.push(P(J.leader === 'A' ? fillP(X.role.lead, { X: me, Y: pp }) : fillP(X.role.lead, { X: pp, Y: me })));
    else c1.push(P(J.giver === 'A' ? fillP(X.role.grow, { X: me, Y: pp }) : fillP(X.role.grow, { X: pp, Y: me })));
    var gBA = A.godOf(sA, sB), gAB = A.godOf(sB, sA);
    c1.push(H(pp['은'] + ' 나에게 · ' + (GK[gBA] || '')), P(fillP(X.god[GROUP_OF[gBA]], { X: pp, Y: me })),
      H('나는 ' + pp['에게'] + ' · ' + (GK[gAB] || '')), P(fillP(X.god[GROUP_OF[gAB]], { X: me, Y: pp })));

    // 2. 각자 잘하는 일
    var c2 = [P(X.skillIntro)];
    if (elA === elB) c2.push(P(fillP(X.stemWork[elA], { X: { '은': '두 사람은 모두' } })));
    else c2.push(P(fillP(X.stemWork[elA], { X: me })), P(fillP(X.stemWork[elB], { X: pp })));
    var rows = [], mine = [], theirs = [], weak = [];
    EL.forEach(function (e) {
      var a = rA.elements[e], b = rB.elements[e], job = X.skillName[e];
      var who = a > b ? '나' : b > a ? pLabel : a === 0 ? '둘 다 도움 받기' : '둘이 함께';
      if (a > b) mine.push(job); else if (b > a) theirs.push(job);
      if (a + b <= 1) weak.push(e);
      rows.push({ job: job, el: e, elKo: ELK[e], a: a, b: b, who: who });
    });
    c2.push({ roles: { names: ['나', pLabel], rows: rows } });
    var line = [];
    if (mine.length) line.push('나는 ' + mine.join('·') + ' 쪽을');
    if (theirs.length) line.push(pp['은'] + ' ' + theirs.join('·') + ' 쪽을');
    if (line.length) c2.push(P(line.join(', ') + ' 맡으면 좋아요.'));
    weak.forEach(function (e) { c2.push(P(fill(X.skillBothWeak, { el: ELK[e], job: X.skillName[e] }))); });
    c2.push(P(X.skillEnd, 'note'));

    // 3. 일하는 속도
    var c3 = [P(X.speedIntro)];
    if (J.speedA === J.speedB) c3.push(P(fillP(X.speedOne[J.speedA], { X: { '은': '두 사람은 모두' } })));
    else c3.push(P(fillP(X.speedOne[J.speedA], { X: me })), P(fillP(X.speedOne[J.speedB], { X: pp })));
    c3.push(P(X.speedPair[J.speedGap]));

    // 4. 부딪치기 쉬운 순간
    var mA = rA.pillars.month, mB = rB.pillars.month;
    var c4 = [P(X.rubIntro), H('일하는 자리의 만남 · ' + mA.branchHanja + ' ' + mB.branchHanja), P(X.monthRel[J.month])];
    if (J.stemClash) c4.push(P(X.stemClash));
    c4.push({ list: X.talk[J.type], label: '부딪치기 쉬운 순간과 해 볼 말' });

    // 5. 같이 하면 잘되는 일
    var jn = X.join[J.top];
    var c5 = [P(X.joinIntro), { bars: [{ name: '나', el: rA.elements }, { name: pLabel, el: rB.elements }] }, P(jn.p), { list: jn.list, label: '두 사람이 같이 하면 좋은 일' }];

    // 6. 두 사람의 2027 일 흐름
    var g27A = A.godOf(sA, 3), g27B = A.godOf(sB, 3), grA = GROUP_OF[g27A], grB = GROUP_OF[g27B];
    var lineA = (N.oneLine && N.oneLine[g27A] || {}).line, lineB = (N.oneLine && N.oneLine[g27B] || {}).line;
    var c6 = [P(X.y27Intro), P('2027년은 나에게 ‘' + lineA + '’, ' + pp['에게'] + '는 ‘' + lineB + '’예요.'),
      { list: ['나: ' + X.y27[grA], pLabel + ': ' + X.y27[grB]], label: '2027년 일의 흐름' }, P(grA === grB ? X.y27same : X.y27diff), P(X.notice, 'note')];

    var roleShort = J.stem === 'combine' ? '손을 맞잡고 함께' : J.stem === 'same' ? '나란히 반씩 나눠' : J.stem === 'ctrl' ? (J.leader === 'A' ? '나 이끄는 쪽 · ' + pLabel + ' 받쳐 주는 쪽' : pLabel + ' 이끄는 쪽 · 나 받쳐 주는 쪽')
      : (J.giver === 'A' ? '나 생각을 건네는 쪽 · ' + pLabel + ' 결과를 내는 쪽' : pLabel + ' 생각을 건네는 쪽 · 나 결과를 내는 쪽');
    var skillShort = '잘하는 일: 나 ' + X.skillName[elA] + (elA === elB ? '' : ' · ' + pLabel + ' ' + X.skillName[elB]) + (elA === elB ? ' (둘 다)' : '');
    var summary = ['두 사람은 ‘' + T.name + '’' + (bat(T.name) ? '이에요.' : '예요.'), '자리: ' + roleShort, skillShort, '함께하면 좋은 일: ' + jn.list[0], X.notice];
    var chapters = [
      { id: 'wk-role', title: '두 사람의 자리', sub: dA.stemHanja + ' ' + ELK[elA] + ' · ' + dB.stemHanja + ' ' + ELK[elB], blocks: clean(c1) },
      { id: 'wk-skill', title: '각자 잘하는 일', sub: '역할 나누기 표', blocks: clean(c2) },
      { id: 'wk-speed', title: '일하는 속도', sub: '양·음과 사주의 온도', blocks: clean(c3) },
      { id: 'wk-rub', title: '부딪치기 쉬운 순간', sub: '일하는 자리(월지) ' + mA.branchHanja + ' · ' + mB.branchHanja, blocks: clean(c4) },
      { id: 'wk-join', title: '같이 하면 잘되는 일', sub: '두 사람의 기운을 합치면', blocks: clean(c5) },
      { id: 'wk-2027', title: '두 사람의 2027 일 흐름', sub: '정미년(丁未年)', blocks: clean(c6) }
    ];
    return { kind: 'wk', type: J.type, name: T.name, keywords: T.kw, summary: summary, chapters: chapters, chars: countChars(summary, chapters), rel: J, pLabel: pLabel,
      cardLines: ['자리 · ' + roleShort, skillShort.replace('잘하는 일: ', '잘하는 일 · ')] };
  }

  return { buildSok: buildSok, buildWork: buildWork, judgeSok: judgeSok, judgeWork: judgeWork, dohwaOf: dohwaOf, tempOf: tempOf };
});
