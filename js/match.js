/*
 * 별빛 사주 — 연애 궁합 (0.9)
 * build(rA, inA, rB, inB) → { type, name, keywords, summary[], chapters[], chars, rel }
 * rA/rB: SajuEngine.calculate 결과 (A = 나, B = 상대), inB.name: 상대 이름(없으면 '상대')
 * 성별은 쓰지 않는다. 판정(궁합 이름·합충)은 A와 B를 바꿔 넣어도 같아야 한다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./saju-engine.js'), require('./saju-analysis.js'), require('./match-texts.js'), require('./newyear-texts.js'), require('./deep/a.js'), require('./match-verdict.js'));
  } else root.Match = factory(root.SajuEngine, root.SajuAnalysis, root.SAJU_MT || {}, root.SAJU_NY || {}, root.SAJU_DEEP || {}, root.MatchVerdict);
})(typeof self !== 'undefined' ? self : this, function (E, A, M, N, D, MV) {
  'use strict';
  var C = E.constants, SE = C.STEM_ELEMENT;
  var EL = ['wood', 'fire', 'earth', 'metal', 'water'];
  var ELK = { wood: '나무', fire: '불', earth: '흙', metal: '쇠', water: '물' };
  var GROUP_OF = { bigyeon: 'bigeop', geobjae: 'bigeop', siksin: 'siksang', sanggwan: 'siksang', pyeonjae: 'jaeseong', jeongjae: 'jaeseong', pyeongwan: 'gwanseong', jeonggwan: 'gwanseong', pyeonin: 'inseong', jeongin: 'inseong' };
  var BR_COMBINE = { '0-1': 1, '2-11': 1, '3-10': 1, '4-9': 1, '5-8': 1, '6-7': 1 };
  var BR_CLASH = { '0-6': 1, '1-7': 1, '2-8': 1, '3-9': 1, '4-10': 1, '5-11': 1 };
  var BR_PUNISH = { '2-5': 1, '5-8': 1, '2-8': 1, '1-10': 1, '7-10': 1, '1-7': 1, '0-3': 1 };
  var WONJIN = { '0-7': 1, '1-6': 1, '2-9': 1, '3-8': 1, '4-11': 1, '5-10': 1 };
  var STEM_COMBINE = { '0-5': 1, '1-6': 1, '2-7': 1, '3-8': 1, '4-9': 1 };
  var STEM_CLASH = { '0-6': 1, '1-7': 1, '2-8': 1, '3-9': 1 };
  function pk(a, b) { return Math.min(a, b) + '-' + Math.max(a, b); }
  function tri(b) { return b % 4; } // 申子辰=0, 巳酉丑=1, 寅午戌=2, 亥卯未=3 (지지 번호를 4로 나눈 나머지)
  function bat(w) { var c = String(w).charCodeAt(String(w).length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 !== 0; }
  function jo(w, a, b) { return w + (bat(w) ? a : b); }
  function ieyo(w) { return w + (bat(w) ? '이에요' : '예요'); }
  function fill(t, o) { return String(t || '').replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  // {X은} {P에게} 같은 사람 자리 글자를 받침에 맞춰 채운다
  function person(label) {
    if (label === '나') return { '': '나', 은: '나는', 이: '내가', 을: '나를', 과: '나와', 의: '나의', 에게: '나에게' };
    return { '': label, 은: jo(label, '은', '는'), 이: jo(label, '이', '가'), 을: jo(label, '을', '를'), 과: jo(label, '과', '와'), 의: label + '의', 에게: label + '에게' };
  }
  function fillP(t, map) { return String(t || '').replace(/\{([XYP])(은|이|을|과|의|에게)?\}/g, function (m, k, j) { return map[k] ? map[k][j || ''] : m; }); }
  function P(t, cls) { return t ? { p: t, cls: cls || '' } : null; }
  function H(t) { return { h: t }; }
  function clean(arr) { return arr.filter(function (x) { return x; }); }

  // 두 지지의 관계 (순서를 바꿔도 같다)
  function brRel(a, b) {
    var k = pk(a, b);
    if (a === b) return 'same';
    if (BR_COMBINE[k]) return 'hap';
    if (tri(a) === tri(b)) return 'half';
    if (BR_CLASH[k]) return 'clash';
    if (WONJIN[k]) return 'wonjin';
    if (BR_PUNISH[k]) return 'punish';
    return 'none';
  }
  function weakest(r) {
    var min = 99, w = null;
    EL.forEach(function (e) { if (r.elements[e] < min) { min = r.elements[e]; w = e; } });
    return { el: w, n: min };
  }
  // 궁합 판정: 대칭인 값만 쓴다
  function judge(rA, rB) {
    var sA = rA.pillars.day.stem, sB = rB.pillars.day.stem;
    var d = ((SE[sB] - SE[sA]) % 5 + 5) % 5;
    var stem = STEM_COMBINE[pk(sA, sB)] ? 'combine' : d === 0 ? 'same' : (d === 1 || d === 4) ? 'gen' : 'ctrl';
    var day = brRel(rA.pillars.day.branch, rB.pillars.day.branch);
    var year = brRel(rA.pillars.year.branch, rB.pillars.year.branch);
    var wA = weakest(rA), wB = weakest(rB);
    var fillA = wA.n <= 1 && rB.elements[wA.el] >= 2, fillB = wB.n <= 1 && rA.elements[wB.el] >= 2;
    var type = stem === 'combine' ? 'stemHap' : day === 'hap' ? 'branchHap' : day === 'clash' ? 'clash' : (fillA && fillB) ? 'fill'
      : day === 'half' ? 'half' : day === 'wonjin' ? 'wonjin' : stem === 'same' ? 'same' : stem === 'gen' ? 'gen' : 'ctrl';
    return { type: type, stem: stem, d: d, stemClash: !!STEM_CLASH[pk(sA, sB)], day: day, year: year, wA: wA, wB: wB, fillA: fillA, fillB: fillB };
  }

  function build(rA, inA, rB, inB) {
    var J = judge(rA, rB), T = M.types[J.type];
    var pLabel = inB && inB.name ? inB.name + '님' : '상대';
    var me = person('나'), pp = person(pLabel), map = { P: pp };
    function F(t, o) { return fillP(fill(t, o || {}), map); }
    var sA = rA.pillars.day.stem, sB = rB.pillars.day.stem, elA = EL[SE[sA]], elB = EL[SE[sB]];
    var dA = rA.pillars.day, dB = rB.pillars.day;

    // ---------- 1. 두 사람의 기본 결 ----------
    var c1 = [{ chips: T.kw.map(function (k) { return '#' + k; }), label: '두 사람의 낱말' }, P(T.intro, 'lead'), P(M.typeMore[J.type])];
    c1.push(H('타고난 모습'));
    var imgA = M.stemImg[sA], imgB = M.stemImg[sB];
    c1.push(P('나는 ' + imgA + '처럼 ' + M.stemTrait[sA] + ' 사람(' + dA.stemHanja + ' ' + dA.stemKo + ')이고, ' + pp['은'] + ' ' + imgB + '처럼 ' + M.stemTrait[sB] + ' 사람(' + dB.stemHanja + ' ' + dB.stemKo + ')이에요.' +
      (sA === sB ? ' ' + imgA + ' 둘이 나란히 선 모습이죠.' : '')));
    if (sA === sB) c1.push(H('사랑할 때 두 사람은'), P('두 사람은 사랑하는 방식도 닮았어요. ' + M.loveStyle[sA]));
    else c1.push(H('사랑할 때 나는'), P(M.loveStyle[sA]), H('사랑할 때 ' + pp['은']), P(M.loveStyle[sB]));
    c1.push(H('두 글자의 관계'));
    var o1 = { el: ELK[elA], elA: ELK[elA], elB: ELK[elB] };
    if (J.stem === 'combine') { c1.push(P(M.stemRel.combine[pk(sA, sB)])); c1.push(P(M.stemRel.combineCommon)); }
    else if (J.stem === 'same') c1.push(P(F(sA === sB ? M.stemRel.sameStem : M.stemRel.sameEl, o1)));
    else if (J.d === 1) c1.push(P(F(M.stemRel.genGive, o1)));
    else if (J.d === 4) c1.push(P(F(M.stemRel.genGet, o1)));
    else if (J.d === 2) c1.push(P(F(M.stemRel.ctrlGive, o1)));
    else c1.push(P(F(M.stemRel.ctrlGet, o1)));
    if (J.stemClash) c1.push(P(M.stemRel.clashExtra));

    // ---------- 2. 함께 있을 때의 분위기 ----------
    var bA = dA.branchHanja + '(' + dA.branchKo + ')', bB = dB.branchHanja + '(' + dB.branchKo + ')';
    var c2 = [P(M.dayIntro), { list: ['나 · ' + bA + ': ' + M.dayStyle[dA.branch], pLabel + ' · ' + bB + ': ' + M.dayStyle[dB.branch]], label: '집에서의 두 사람' }, H('두 자리의 만남')];
    c2.push(P(M.dayRel[J.day]));
    var yA = rA.pillars.year, yB = rB.pillars.year;
    c2.push(H('띠 궁합'));
    c2.push(P('나는 ' + rA.animal + '띠, ' + pp['은'] + ' ' + rB.animal + '띠예요. ' + M.yearRel[J.year] + ' ' + M.yearNote));

    // ---------- 3. 서로에게 어떤 사람 ----------
    var gBA = A.godOf(sA, sB), gAB = A.godOf(sB, sA); // gBA: 상대가 나에게, gAB: 내가 상대에게
    var GK = A.GOD_KO || {};
    var c3 = [P(M.roleIntro),
      H(pp['은'] + ' 나에게 · ' + (GK[gBA] || '')), P(fillP(M.role[gBA], { X: pp, Y: me })),
      H('나는 ' + pp['에게'] + ' · ' + (GK[gAB] || '')), P(fillP(M.role[gAB], { X: me, Y: pp }))];

    // ---------- 4. 서로 채워 주는 기운 ----------
    var c4 = [{ bars: [{ name: '나', el: rA.elements }, { name: pLabel, el: rB.elements }] }];
    var wA = J.wA, wB = J.wB;
    var giftA = M.elGift[wA.el], giftB = M.elGift[wB.el];
    if (J.fillA) c4.push(P('나에게 가장 적은 ' + ELK[wA.el] + ' 기운을 ' + pp['은'] + ' ' + rB.elements[wA.el] + '개나 가지고 있어요. ' + pp['과'] + ' 함께 있으면 ' + jo(giftA, '을', '를') + ' 자연스럽게 얻어요.'));
    else if (wA.n >= 2) c4.push(P('나는 다섯 기운을 고르게 가진 편이에요.'));
    else c4.push(P('나에게 가장 적은 ' + ELK[wA.el] + ' 기운은 ' + pp['에게'] + '도 많지 않아요. 이 기운은 두 사람이 함께 채워 가면 좋아요.'));
    if (J.fillB) c4.push(P(pp['에게'] + ' 가장 적은 ' + ELK[wB.el] + ' 기운을 나는 ' + rA.elements[wB.el] + '개 가지고 있어요. 나는 ' + pp['에게'] + ' ' + jo(giftB, '을', '를') + ' 건네주는 사람이에요.'));
    else if (wB.n >= 2) c4.push(P(pp['은'] + ' 다섯 기운을 고르게 가진 편이에요.'));
    else if (!(wB.el === wA.el && !J.fillA && wA.n <= 1)) c4.push(P(pp['에게'] + ' 가장 적은 ' + ELK[wB.el] + ' 기운은 나에게도 많지 않아요. 둘이 같이 채워 가면 좋은 기운이에요.'));
    c4.push(P(M.fillSum[J.fillA && J.fillB ? 'both' : (J.fillA || J.fillB) ? 'one' : 'none']));
    var togetherEl = (!J.fillA && wA.n <= 1) ? wA.el : (!J.fillB && wB.n <= 1) ? wB.el : null;
    if (togetherEl) c4.push(P('함께 채우는 방법: ' + M.elTogether[togetherEl]));
    if (!rB.pillars.hour) c4.push(P(F(M.noTime), 'note'));

    // ---------- 5. 잘 지내는 법 ----------
    var c5 = [{ list: M.talk[J.type], label: '다툴 때 이렇게 말해 보세요' },
      { list: [M.careStem[J.stem], M.careBr[J.day]], label: '서로 조심하면 좋은 점' }];

    // ---------- 6. 두 사람의 2027 ----------
    var g27A = A.godOf(sA, 3), g27B = A.godOf(sB, 3), grA = GROUP_OF[g27A], grB = GROUP_OF[g27B];
    var lineA = (N.oneLine && N.oneLine[g27A] || {}).line, lineB = (N.oneLine && N.oneLine[g27B] || {}).line;
    var c6 = [P('2027년 정미년(丁未年)은 나에게 ‘' + lineA + '’, ' + pp['에게'] + '는 ‘' + lineB + '’예요.'),
      { list: ['나: ' + M.y27[grA], pLabel + ': ' + M.y27[grB]], label: '2027년의 두 사람' },
      P(grA === grB ? M.y27same : M.y27diff)];
    var hapA = dA.branch === 6, hapB = dB.branch === 6, clA = dA.branch === 1, clB = dB.branch === 1;
    function who(a, b) { return a && b ? '두 사람 모두의' : a ? '나의' : pp['의']; }
    if (hapA || hapB) c6.push(P(fill(M.y27hap, { who: who(hapA, hapB) })));
    if (clA || clB) c6.push(P(fill(M.y27clash, { who: who(clA, clB) })));
    var VD = MV.love(rA, rB, J, pp), YR = MV.year(rA, rB, 'love', pp);
    c6.push(H('석 달씩 보는 두 사람'), P(YR.intro));
    YR.quarters.forEach(function (q) { c6.push({ quarter: q }); });
    c6.push(H(YR.whenHead), { when: YR.when, wide: true });

    // ---------- 7. 행운 데이트 ----------
    var aA = A.analyze(rA, { gender: (inA && inA.gender) || 'F' }), aB = A.analyze(rB, { gender: 'F' });
    var hA = aA.helper, hB = aB.helper, HP = D.helper || {}, pA = HP[hA] || {}, pB = HP[hB] || {};
    var same = hA === hB;
    var lucky = [['함께 입으면 좋은 색', same ? (pA.colors || []).join(', ') : (pA.colors || [])[0] + ', ' + (pB.colors || [])[0]],
      ['데이트 방향', same ? pA.direction : pA.direction + ', ' + pB.direction]];
    if (same) lucky.push(['두 사람에게 좋은 곳', (pA.places || []).join(', ')]);
    else { lucky.push(['나에게 좋은 곳', (pA.places || []).join(', ')]); lucky.push([pLabel + '에게 좋은 곳', (pB.places || []).join(', ')]); }
    var nums = (pA.numbers || []).concat(same ? [] : (pB.numbers || []));
    lucky.push(['행운의 숫자', nums.join(', ')]);
    var c7 = [P(F(same ? M.dateSame : M.dateDiff, { el: ELK[hA], elA: ELK[hA], elB: ELK[hB] })), { lucky: lucky }];

    var stemShort = J.stem === 'combine' ? '천간합, 서로 손을 잡는 글자' : J.stem === 'same' ? '같은 ' + ELK[elA] + ' 기운, 닮은 결'
      : (J.d === 1 || J.d === 2) ? ELK[elA] + ' 기운(나)이 ' + ELK[elB] + ' 기운(' + pLabel + ')을 ' + (J.d === 1 ? '살려 주는' : '다듬어 주는') + ' 사이'
        : ELK[elB] + ' 기운(' + pLabel + ')이 ' + ELK[elA] + ' 기운(나)을 ' + (J.d === 4 ? '살려 주는' : '다듬어 주는') + ' 사이';
    var BS = { same: '같은 글자, 닮은 생활', hap: '육합, 손을 잡는 자리', half: '삼합, 같은 방향', clash: '충, 서로 끌리는 자석', wonjin: '원진, 말로 푸는 사이', punish: '형, 서로 다듬는 사이', none: '자유롭게 정이 쌓이는 사이' };
    var summary = [
      VD.line,
      VD.line2,
      '함께 좋은 달: ' + YR.when[0][1],
      '두 사람은 ‘' + T.name + '’예요.',
      '기본 결: ' + stemShort,
      '함께 있을 때: ' + BS[J.day],
      M.notice
    ];
    var chapters = [
      { id: 'mt-verdict', title: '한눈에 보는 궁합', sub: '대화 · 함께 생활 · 끌림 · 서로 채우기 · 오래 가기', blocks: [{ verdict: VD.verdict }, VD.table, P(VD.legend, 'note')] },
      { id: 'mt-base', title: '두 사람의 기본 결', sub: dA.stemHanja + ' ' + ELK[elA] + ' · ' + dB.stemHanja + ' ' + ELK[elB], blocks: clean(c1) },
      { id: 'mt-mood', title: '함께 있을 때의 분위기', sub: '배우자 자리 ' + dA.branchHanja + ' · ' + dB.branchHanja, blocks: clean(c2) },
      { id: 'mt-role', title: '서로에게 어떤 사람', sub: '십신으로 보는 두 사람', blocks: clean(c3) },
      { id: 'mt-fill', title: '서로 채워 주는 기운', sub: '다섯 기운 나란히 보기', blocks: clean(c4) },
      { id: 'mt-tips', title: '잘 지내는 법', sub: '다툴 때 해 볼 말과 조심할 점', blocks: c5 },
      { id: 'mt-2027', title: '두 사람의 2027', sub: '정미년(丁未年) · 석 달씩 보기', blocks: clean(c6) },
      { id: 'mt-date', title: '행운 데이트', sub: '두 사람을 돕는 기운', blocks: clean(c7) }
    ];
    var chars = summary.join('').length;
    chapters.forEach(function (c) { c.blocks.forEach(function (b) { if (b.p) chars += b.p.length; if (b.list) b.list.forEach(function (t) { chars += t.length; }); if (b.wx) b.wx.forEach(function (x) { chars += x.text.length; }); if (b.quarter) { chars += b.quarter.head.length; b.quarter.rows.forEach(function (x) { chars += x.text.length; }); } }); });
    return { kind: 'mt', verdict: VD, yearGood: YR.when[0][1], base: stemShort, mood: BS[J.day], type: J.type, name: T.name, keywords: T.kw, summary: summary, chapters: chapters, chars: chars, rel: J, pLabel: pLabel };
  }

  return { build: build, judge: judge, brRel: brRel };
});
