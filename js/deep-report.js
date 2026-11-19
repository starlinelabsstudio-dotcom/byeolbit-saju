/*
 * 별빛 사주 — 깊은 감정서 조립 (0.6)
 * build(r, a, input) → { title, summary[], chapters[] }
 * 글 조각: SAJU_DEEP(src/deep/a·b·c.js), SAJU_TEXTS(src/texts.js). 사람마다 8글자 전체로 고르고 이어 붙인다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(Object.assign({}, require('./deep/a.js'), require('./deep/b.js'), require('./deep/c.js')), require('./texts.js'));
  } else root.DeepReport = factory(root.SAJU_DEEP || {}, root.SAJU_TEXTS || {});
})(typeof self !== 'undefined' ? self : this, function (D, T) {
  'use strict';
  var ELK = { wood: '나무', fire: '불', earth: '흙', metal: '쇠', water: '물' };
  var GROUP_KO = { bigeop: '나와 같은 힘', siksang: '내가 펼치는 힘', jaeseong: '내가 다루는 힘(재물)', gwanseong: '나를 다스리는 힘(일·규칙)', inseong: '나를 돕는 힘(배움·보살핌)' };
  var GROUP_SHORT = { bigeop: '나와 같은 힘', siksang: '펼치는 힘', jaeseong: '다루는 힘', gwanseong: '다스리는 힘', inseong: '돕는 힘' };
  var INTER_ORDER = ['branchClash', 'branchCombine', 'tripleCombine', 'branchPunish', 'stemCombine', 'stemClash'];

  function g(obj, k) { return obj && obj[k] ? obj[k] : null; }
  function bat(w) { var c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c % 28 !== 0; }
  function josa(w, a, b) { return w + (bat(w) ? a : b); }
  function godLabel(k) { var t = g(D.tenGod, k); return t ? t.name + '(' + t.easy + ')' : k; }
  // 이름(괄호 앞 글자)의 받침으로 조사를 고른다: godJ('jeongjae', '이에요', '예요') → '정재(…)예요'
  function godJ(k, a, b) { var t = g(D.tenGod, k); return godLabel(k) + (t && bat(t.name) ? a : b); }
  function P(text, cls) { return text ? { p: text, cls: cls || '' } : null; }
  function H(text) { return { h: text }; }
  function clean(arr) { return arr.filter(function (x) { return x; }); }

  function build(r, a, input) {
    var name = (input && input.name) ? input.name + '님' : '당신';
    var nameJ = (input && input.name) ? input.name + '님' : '당신';
    var dmS = r.pillars.day.stemHanja, dm = g(D.dayMasterDeep, dmS) || {}, dmT = g(T.dayMaster, dmS) || {};
    var mB = r.pillars.month.branchHanja, season = g(D.season, mB) || {};
    var st = g(D.strength, a.strength.level) || {};
    var helper = g(D.helper, a.helper) || {};
    var dom = a.dominantGroup;
    var monthGod = a.monthGod, dayGod = a.dayBranchGod;
    var chapters = [];

    // ---------- 0. 한눈에 ----------
    var summary = clean([
      dmT.title ? '나를 나타내는 글자는 ' + r.pillars.day.stemKo + '(' + dmS + '), ‘' + dmT.title + '’' + (bat(dmT.title) ? '이에요.' : '예요.') : null,
      season.title ? '태어난 달은 ‘' + season.title + '’의 기운이에요.' : null,
      '사주에서 가장 센 기운은 ' + GROUP_KO[dom] + '이에요.',
      st.title ? '내 힘은 ‘' + st.title + '’ 쪽이에요.' : null,
      '나를 돕는 기운은 ' + ELK[a.helper] + (a.climateHelper ? ', 그리고 온도를 맞춰 주는 ' + ELK[a.climateHelper] : '') + ' 기운이에요.'
    ]);

    // ---------- 1. 타고난 기질 ----------
    chapters.push({ id: 'nature', title: '타고난 기질', sub: dmT.title || '', blocks: clean([
      P(dm.nature),
      H(season.title || '태어난 계절'),
      P(season.text),
      P(g(D.climate, a.climate)),
      H('빛나는 점'), P(dm.strengths),
      H('조심스러운 그림자'), P(dm.shadow),
      H('더 빛나는 방향'), P(dm.growth)
    ]) });

    // 겉 글자에는 없지만 땅속 글자(지장간)에 숨어 있을 때 덧붙이는 말
    function hidList(list) {
      var seen = {}, out = [];
      (list || []).forEach(function (x) { var k = x.branch + x.stem; if (!seen[k]) { seen[k] = 1; out.push(x.branch + '(' + x.branchKo + ') 속의 ' + x.stem + '(' + x.stemKo + ')'); } });
      return out.join(', ');
    }
    function hidNote(list, what) {
      if (!list || !list.length) return null;
      var lastKo = list[list.length - 1].stemKo, lc = lastKo.charCodeAt(0) - 0xac00, ro = (lc % 28 === 0 || lc % 28 === 8) ? '로' : '으로';
      var hk = hidList(list); hidNote.seen = hidNote.seen || {};
      if (hidNote.seen[hk]) return null; hidNote.seen[hk] = 1;
      if (hidNote.used) return P('이 기운은 땅속 글자 ' + hidList(list) + ro + ' 조금 숨어 있어요.', 'tip');
      hidNote.used = true;
      return P('다만 겉으로 드러난 글자에 없을 뿐, 땅속에 숨은 글자(지장간)에는 ' + hidList(list) + ro + ' ' + what + '이 조금 숨어 있어요. 아주 없는 것이 아니라 조용히 품고 있다가, 운에서 같은 기운이 들어올 때 깨어나는 편이에요.', 'tip');
    }
    // ---------- 2. 성격 깊이 보기 ----------
    var godsSorted = Object.keys(a.godCount).filter(function (k) { return a.godCount[k] > 0; })
      .sort(function (x, y) { return a.godCount[y] - a.godCount[x]; });
    var pb = [];
    pb.push({ table: a.gods.map(function (x) { return { pos: x.label, char: x.char + '(' + x.charKo + ')', god: godLabel(x.god) }; }) });
    if (monthGod) {
      var mg = g(D.tenGod, monthGod.god) || {};
      pb.push(H('사회에서 보여 주는 얼굴 — ' + mg.name));
      pb.push(P('태어난 달의 아래 글자 ' + monthGod.char + '(' + monthGod.charKo + ')는 ' + nameJ + '에게 ' + godJ(monthGod.god, '이에요', '예요') + '. 태어난 달은 사주에서 가장 힘이 센 자리라, 이 기운이 ' + nameJ + '의 바탕 성격과 일하는 방식을 크게 만들어요.'));
      pb.push(P(mg.strong));
    }
    godsSorted.slice(0, 3).forEach(function (k) {
      if (monthGod && k === monthGod.god) return;
      var t = g(D.tenGod, k); if (!t) return;
      pb.push(H((a.godCount[k] >= 2 ? '여러 번 나오는 ' : '함께 있는 ') + t.name + ' — ' + t.easy));
      pb.push(P(t.strong));
    });
    var shadowGod = godsSorted[0] && g(D.tenGod, godsSorted[0]);
    if (shadowGod) { pb.push(H('지나칠 때 생기는 모습')); pb.push(P(shadowGod.shadow)); }
    ['bigeop', 'siksang', 'jaeseong', 'gwanseong', 'inseong'].forEach(function (gr) {
      if (a.groupCount[gr] >= 3) { pb.push(H(GROUP_KO[gr] + '이 많아요')); pb.push(P(g(D.groupMany, gr))); }
    });
    ['bigeop', 'siksang', 'jaeseong', 'gwanseong', 'inseong'].forEach(function (gr) {
      if (a.groupCount[gr] === 0) { pb.push(H(GROUP_KO[gr] + '이 겉으로 드러나지 않아요')); pb.push(P(g(D.groupNone, gr))); var hn = a.hidden && hidNote(a.hidden.groups[gr], '이 기운'); if (hn) pb.push(hn); }
    });
    pb.push(H('내 힘의 세기 — ' + (st.title || '')));
    pb.push(P(st.text)); pb.push(P(st.advice, 'tip'));
    chapters.push({ id: 'character', title: '성격 깊이 보기', sub: '여덟 글자가 나에게 어떤 기운인지', blocks: clean(pb) });

    // ---------- 3. 일과 적성 ----------
    var car = g(D.career, dom) || {};
    chapters.push({ id: 'work', title: '일과 적성', sub: car.title || '', blocks: clean([
      P(car.text),
      monthGod ? H('일하는 방식') : null,
      monthGod ? P((g(D.tenGod, monthGod.god) || {}).work) : null,
      car.fields ? { chips: car.fields, label: '잘 맞는 일·분야' } : null,
      helper.jobs ? { chips: helper.jobs, label: '나를 돕는 ' + ELK[a.helper] + ' 기운의 일' } : null
    ]) });

    // ---------- 4. 재물 ----------
    var gc = a.groupCount, lv = a.strength.level, strong = lv === 'strong' || lv === 'veryStrong', weak = lv === 'weak' || lv === 'veryWeak';
    var mk = [];
    if (gc.jaeseong === 0) mk.push('noWealth');
    else if (gc.jaeseong >= 2 && weak) mk.push('wealthStrongSelfWeak');
    else if (strong) mk.push('wealthWithStrongSelf');
    if (gc.siksang >= 1 && gc.jaeseong >= 1) mk.push('siksangMakesWealth');
    if (gc.bigeop >= 3) mk.push('manyBigeop');
    if (gc.gwanseong >= 1 && gc.jaeseong >= 1 && mk.length < 3) mk.push('steadyGwan');
    if (gc.inseong >= 3) mk.push('manyInseong');
    // 재물 장이 너무 짧지 않게: 두 문단은 되도록
    if (mk.length < 2 && mk.indexOf('balanced') < 0) mk.push('balanced');
    var mb = [P('사주에서 재물은 ‘' + GROUP_KO.jaeseong + '’으로 봐요. ' + nameJ + '의 여덟 글자에는 이 기운이 ' + (gc.jaeseong ? gc.jaeseong + '개' : '겉으로 드러나 있지 않') + (gc.jaeseong ? ' 있어요.' : '아요.'))];
    if (!gc.jaeseong && a.hidden) { var hm = hidNote(a.hidden.groups.jaeseong, '재물 기운'); if (hm) mb.push(hm); }
    mk.slice(0, 3).forEach(function (k) { mb.push(P(g(D.money, k))); });
    chapters.push({ id: 'money', title: '재물', sub: '돈을 버는 방식과 모으는 습관', blocks: clean(mb) });

    // ---------- 5. 연애·결혼 ----------
    var lb = [];
    if (dayGod) {
      lb.push(P('태어난 날의 아래 글자는 ‘배우자 자리’예요. ' + nameJ + '의 배우자 자리에는 ' + dayGod.char + '(' + dayGod.charKo + '), ' + godJ(dayGod.god, '이', '가') + ' 앉아 있어요.'));
      lb.push(P(g(D.love, dayGod.god)));
    }
    lb.push(H('나에게 짝이 되는 기운'));
    lb.push(P(g(D.partnerStar, a.partner.state)));
    var dayInter = a.interactions.filter(function (x) { return x.withDay && (x.type === 'branchClash' || x.type === 'branchCombine'); });
    // 부딪침·합이 여러 번이어도 같은 글은 한 번만
    var loveSeen = {};
    dayInter.forEach(function (x) {
      var k = x.type === 'branchClash' ? 'dayClash' : 'dayCombine';
      if (loveSeen[k]) return; loveSeen[k] = 1;
      lb.push(P(g(D.loveExtra, k)));
    });
    if (a.sinsal.some(function (s) { return s.key === 'dohwa'; })) lb.push(P(g(D.loveExtra, 'dohwa')));
    var dun = a.unseong.dB, un = dun && g(D.unseong, dun.key);
    if (un) { lb.push(H('배우자 자리의 힘 — ' + un.name)); lb.push(P(un.text)); }
    chapters.push({ id: 'love', title: '연애와 결혼', sub: '사랑하는 방식과 오래가는 비결', blocks: clean(lb) });

    // ---------- 6. 사람 관계 ----------
    var rb = [];
    [['bigeop', 'bigeopStrong', 'bigeopNone'], ['inseong', 'inseongStrong', 'inseongNone'], ['siksang', 'siksangStrong', 'siksangNone'], ['gwanseong', 'gwanStrong', 'gwanNone']].forEach(function (x) {
      var c = gc[x[0]];
      if (c >= 2) rb.push(P(g(D.relations, x[1])));
      else if (c === 0) rb.push(P(g(D.relations, x[2])));
    });
    if (!rb.length) rb.push(P(g(D.relations, gc.bigeop >= 1 ? 'bigeopStrong' : 'inseongStrong')));
    chapters.push({ id: 'people', title: '사람 관계', sub: '가족·친구·동료와 나', blocks: clean(rb.slice(0, 4)) });

    // ---------- 7. 글자의 만남과 특별한 별 ----------
    var sb = [];
    var inters = a.interactions.slice().sort(function (x, y) { return INTER_ORDER.indexOf(x.type) - INTER_ORDER.indexOf(y.type); });
    var seenType = {};
    inters.forEach(function (x) {
      var t = g(D.interactions, x.type); if (!t) return;
      var where = x.a && x.b ? josa(x.a[1].replace(/\(.*\)$/, ''), '과', '와') + ' ' + x.b[1] + '의 글자 ' + x.chars : '글자 ' + x.chars;
      sb.push(H(t.title + ' — ' + x.chars));
      sb.push(P(where + (x.becomes ? ', 함께 ' + x.becomes + ' 기운을 만들어요.' : '.') + (seenType[x.type] ? '' : ' ' + t.text)));
      seenType[x.type] = 1;
    });
    if (!inters.length) sb.push(P('여덟 글자끼리 크게 부딪치거나 묶이는 곳이 없어요. 마음이 한쪽으로 크게 흔들리지 않고, 스스로 정한 속도대로 걸어가는 사주예요.'));
    a.sinsal.forEach(function (s) {
      var t = g(D.sinsal, s.key); if (!t) return;
      sb.push(H(t.name + ' — ' + t.title)); sb.push(P('(' + s.at + ') ' + t.text));
    });
    chapters.push({ id: 'stars', title: '글자의 만남과 특별한 별', sub: '합·충·형과 신살', blocks: clean(sb) });

    // ---------- 8. 마음과 몸 돌보기 ----------
    var cb = [];
    ['wood', 'fire', 'earth', 'metal', 'water'].forEach(function (e) {
      var c = r.elements[e], t = g(D.care, e); if (!t) return;
      if (c >= 3) { cb.push(H(ELK[e] + ' 기운이 넘쳐요 (' + c + '개)')); cb.push(P(t.many)); }
      if (c === 0) { cb.push(H(ELK[e] + ' 기운이 비어 있어요')); cb.push(P(t.none)); var he = a.hidden && hidNote(a.hidden.els[e], ELK[e] + ' 기운'); if (he) cb.push(he); }
    });
    if (!cb.length) cb.push(P('다섯 기운이 고르게 퍼져 있어요. 한쪽으로 치우친 습관만 조심하면, 지금 생활 리듬을 지키는 것이 가장 좋은 돌봄이에요.'));
    cb.push(P('이 내용은 생활 습관을 위한 참고예요. 몸이 불편하면 꼭 전문가와 상의해 주세요.', 'note'));
    chapters.push({ id: 'care', title: '마음과 몸 돌보기', sub: '넘치는 기운과 비어 있는 기운', blocks: clean(cb) });

    // ---------- 9. 인생 흐름 (대운) ----------
    var startTxt = a.daeun.startAge === 0 ? '태어나서 ' + Math.max(1, a.daeun.startAgeMonths) + '개월 무렵' : a.daeun.startAge + '세' + (a.daeun.startAgeMonths ? ' ' + a.daeun.startAgeMonths + '개월' : '');
    var db = [P(nameJ + '의 큰 운은 ' + startTxt + '부터 10년마다 바뀌어요. ' + (a.daeun.forward ? '태어난 달에서 앞으로' : '태어난 달에서 뒤로') + ' 흘러가는 사주예요.')];
    db.push({ timeline: a.daeun.list.slice(0, 9).map(function (d) {
      var t = g(D.daeun, d.god) || {};
      return { age: Math.floor(d.fromAge) + '~' + Math.floor(d.toAge) + '세', year: d.fromYear + '년~', pillar: d.pillar.hanja, ko: d.pillar.ko, title: t.title || '', current: d.current, el: d.pillar.stemElement };
    }) });
    var cur = a.daeun.list.filter(function (d) { return d.current; })[0];
    var nxt = cur ? a.daeun.list[cur.n] : a.daeun.list[0];
    [cur, nxt].forEach(function (d, i) {
      if (!d) return;
      var t = g(D.daeun, d.god) || {};
      db.push(H((i === 0 ? '지금 걷고 있는 10년' : '다음에 올 10년') + ' — ' + Math.floor(d.fromAge) + '~' + Math.floor(d.toAge) + '세, ' + d.pillar.ko + '(' + d.pillar.hanja + ')'));
      db.push(P(t.text));
      if (i === 0 || !cur || d.groundGroup !== cur.groundGroup) db.push(P(g(D.daeunGround, d.groundGroup)));
      else db.push(P('바탕에 흐르는 기운은 지금 10년과 같아서, 지금 쌓아 둔 힘이 그대로 이어져요.'));
    });
    chapters.push({ id: 'daeun', title: '인생의 큰 흐름 (대운)', sub: '10년마다 바뀌는 바람', blocks: clean(db) });

    // ---------- 10. 올해·내년 ----------
    // 0.16 한 해 안에서 좋은 달·조심할 달 (신년운세와 같은 계산)
    function nyTiming(Y) {
      try {
        var NYm = (typeof module === 'object' && module.exports) ? require('./newyear.js') : (typeof self !== 'undefined' ? self.NewYear : null);
        return NYm && NYm.timing ? NYm.timing(r, a, Y) : null;
      } catch (e) { return null; }
    }
    var yb = [];
    a.years.forEach(function (y) {
      var t = g(D.yearLuck, y.god) || {};
      yb.push(H(y.year + '년 ' + y.pillar.ko + '(' + y.pillar.hanja + ') — ' + (t.title || '')));
      yb.push(P(y.pillar.ko + '년의 위 글자는 ' + nameJ + '에게 ' + godJ(y.god, '이에요', '예요') + '.'));
      yb.push(P(t.text));
      y.extra.forEach(function (k) { yb.push(P(g(D.yearExtra, k))); });
      var tm = nyTiming(y.year);
      if (tm) yb.push({ when: [['☀ 좋은 때', tm.goodText || '고르게'], ['☁ 조심할 때', tm.careText || '없어요 · 고르게 괜찮아요']] });
      if (t.tips) yb.push({ list: t.tips, label: y.year + '년에 해 보면 좋은 것' });
    });
    chapters.push({ id: 'years', title: '올해와 내년', sub: a.years.map(function (y) { return y.year + ' ' + y.pillar.ko; }).join(' · '), blocks: clean(yb) });

    // ---------- 11. 나를 돕는 기운 ----------
    var hb = [P(helper.text)];
    if (a.climateHelper) {
      var ch = g(D.helper, a.climateHelper) || {};
      hb.push(H('온도를 맞춰 주는 ' + ELK[a.climateHelper] + ' 기운'));
      hb.push(P(nameJ + '의 사주는 ' + ({ hot: '더운 쪽', hotDry: '덥고 마른 쪽', cold: '추운 쪽', coldWet: '춥고 습한 쪽' })[a.climate] + '이라, ' + ELK[a.climateHelper] + ' 기운이 마음의 온도를 맞춰 줘요. ' + (ch.text || '')));
    }
    if (helper.habits) hb.push({ list: helper.habits, label: '생활 습관' });
    hb.push({ lucky: [
      ['행운의 색', (helper.colors || []).join(', ')],
      ['좋은 방향', helper.direction || ''],
      ['행운의 숫자', (helper.numbers || []).join(', ')],
      ['힘이 나는 곳', (helper.places || []).join(', ')]
    ] });
    chapters.push({ id: 'helper', title: '나를 돕는 기운', sub: ELK[a.helper] + ' 기운' + (a.climateHelper ? ' · ' + ELK[a.climateHelper] + ' 기운' : ''), blocks: clean(hb) });

    // 글자 수
    var chars = summary.join('').length;
    chapters.forEach(function (c) { c.blocks.forEach(function (b) { if (b.p) chars += b.p.length; }); });
    return { name: name, summary: summary, chapters: chapters, chars: chars };
  }

  return { build: build, GROUP_SHORT: GROUP_SHORT };
});
