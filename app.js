/* 별빛 사주 — 화면 */
(function () {
  'use strict';
  var E = window.SajuEngine;
  var T = window.SAJU_TEXTS || {};
  var C = E.constants;
  var $ = function (id) { return document.getElementById(id); };
  var EL_KO = { wood: '나무', fire: '불', earth: '흙', metal: '쇠', water: '물' };
  var EL_ORDER = ['wood', 'fire', 'earth', 'metal', 'water'];
  var STORE_KEY = 'byeolbit-saju-last';
  var POP_KEY = 'byeolbit-saju-lucky-day';
  var luckyToday = null;
  function fillLucky(pre, L) {
    var it = L.it, ph = $(pre + 'Photo');
    $(pre + 'Name').textContent = it.name;
    $(pre + 'Why').innerHTML = esc(it.why) + (it.product ? '<small class="li-prod">' + esc(it.product) + '</small>' : '');
    $(pre + 'Link').href = L.href;
    ph.href = L.href;
    ph.style.setProperty('--li-col', L.col);
    if (it.img) {
      ph.style.backgroundImage = '';
      ph.innerHTML = '<img alt="' + it.name.replace(/"/g, '') + '" src="' + it.img + '">';
      ph.querySelector('img').onerror = function () { var card = ph.closest('.lucky-card'); if (card) card.hidden = true; };
    } else {
      ph.style.display = 'none';
      ph.innerHTML = '<span class="li-tag">' + { wood: '나무', fire: '불', earth: '흙', metal: '쇠', water: '물' }[L.el] + ' 기운</span><span class="li-ph">' + it.q + '</span>';
    }
    var nt = $(pre + 'Notice');
    nt.textContent = L.notice; nt.hidden = !L.notice;
    var ad = $(pre + 'Ad'); if (ad) ad.hidden = !L.notice;
  }
  function maybeLuckyPopup() {
    var LK = window.SAJU_LUCKY;
    if (!LK || !LK.PARTNER.popup || !LK.PARTNER.enabled || !luckyToday || !luckyToday.notice) return; // 파트너스 링크가 있을 때만
    var seen = null;
    try { seen = localStorage.getItem(POP_KEY); } catch (e) { }
    if (seen === luckyToday.day) return; // 하루 한 번만
    // 상품 사진이 다 받아진 뒤에만 띄운다 (사진이 안 열리면 창을 띄우지 않음)
    var pre = new Image();
    pre.onload = function () {
      if ($('viewResult').hidden) return; // 그사이 다른 화면으로 갔으면 띄우지 않음
      try { localStorage.setItem(POP_KEY, luckyToday.day); } catch (e) { }
      fillLucky('lp', luckyToday);
      $('luckyModal').hidden = false;
      sfx('open');
      $('lpSkip').focus();
    };
    pre.src = luckyToday.it.img;
  }
  function closeLucky() { $('luckyModal').hidden = true; }
  var SLUG_S = ['gap', 'eul', 'byeong', 'jeong', 'mu', 'gi', 'gyeong', 'sin', 'im', 'gye'];
  var SLUG_B = ['ja', 'chuk', 'in', 'myo', 'jin', 'sa', 'o', 'mi', 'sin', 'yu', 'sul', 'hae'];

  // ---------- 별 하늘 ----------
  var sky = $('stars'), sctx = sky.getContext('2d'), stars = [], shooting = null, dpr = 1;
  function resizeSky() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    sky.width = innerWidth * dpr; sky.height = innerHeight * dpr;
    var n = Math.round(innerWidth * innerHeight / 3500);
    stars = [];
    for (var i = 0; i < n; i++) {
      stars.push({ x: Math.random() * sky.width, y: Math.random() * sky.height, r: (Math.random() * 1.3 + .3) * dpr,
        p: Math.random() * 6.28, s: Math.random() * 1.5 + .5, gold: Math.random() < .12 });
    }
  }
  function drawSky(t) {
    sctx.clearRect(0, 0, sky.width, sky.height);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i], a = .45 + .55 * Math.sin(s.p + t / 1000 * s.s);
      sctx.globalAlpha = Math.max(.08, a);
      sctx.fillStyle = s.gold ? '#ffe9a8' : '#ffffff';
      sctx.beginPath(); sctx.arc(s.x, s.y, s.r, 0, 6.283); sctx.fill();
    }
    if (!shooting && Math.random() < .004) {
      shooting = { x: Math.random() * sky.width * .8 + sky.width * .2, y: Math.random() * sky.height * .35, v: (6 + Math.random() * 4) * dpr, life: 1 };
    }
    if (shooting) {
      var sh = shooting, len = 90 * dpr;
      var g = sctx.createLinearGradient(sh.x, sh.y, sh.x + len, sh.y - len * .45);
      g.addColorStop(0, 'rgba(255,240,200,' + sh.life + ')'); g.addColorStop(1, 'rgba(255,240,200,0)');
      sctx.globalAlpha = 1; sctx.strokeStyle = g; sctx.lineWidth = 1.6 * dpr;
      sctx.beginPath(); sctx.moveTo(sh.x, sh.y); sctx.lineTo(sh.x + len, sh.y - len * .45); sctx.stroke();
      sh.x -= sh.v; sh.y += sh.v * .45; sh.life -= .018;
      if (sh.life <= 0) shooting = null;
    }
    sctx.globalAlpha = 1;
    requestAnimationFrame(drawSky);
  }
  addEventListener('resize', resizeSky);
  // 밤하늘 사진은 다 받아진 뒤 서서히
  var photo = new Image();
  photo.onload = function () { var el = document.querySelector('.sky-photo'); el.style.backgroundImage = 'url(img/sky.jpg)'; el.classList.add('on'); };
  photo.src = 'img/sky.jpg';
  ['wood', 'fire', 'earth', 'metal', 'water'].forEach(function (e) { new Image().src = 'img/' + e + '.jpg'; });
  resizeSky(); requestAnimationFrame(drawSky);

  // ---------- 입력 칸 채우기 ----------
  function opt(sel, v, label, selected) {
    var o = document.createElement('option'); o.value = v; o.textContent = label; if (selected) o.selected = true; sel.appendChild(o);
  }
  var thisYear = new Date().getFullYear();
  for (var y = thisYear; y >= 1920; y--) opt($('fYear'), y, y + '년', y === 1995);
  for (var m = 1; m <= 12; m++) opt($('fMonth'), m, m + '월', m === 1);
  function fillDays() {
    var sel = $('fDay'), keep = +sel.value || 1;
    var cal = document.querySelector('input[name=cal]:checked').value;
    var max = cal === 'lunar' ? 30 : new Date(+$('fYear').value, +$('fMonth').value, 0).getDate();
    sel.innerHTML = '';
    for (var d = 1; d <= max; d++) opt(sel, d, d + '일', d === Math.min(keep, max));
  }
  fillDays();
  for (var h = 0; h < 24; h++) {
    var ap = h < 12 ? '오전' : '오후', hh = h % 12 === 0 ? 12 : h % 12;
    opt($('fHour'), h, ap + ' ' + hh + '시', h === 12);
  }
  for (var mi = 0; mi < 60; mi++) opt($('fMin'), mi, mi + '분', mi === 0);
  // 연애 궁합 상대 입력칸
  for (var py = thisYear; py >= 1920; py--) opt($('pYear'), py, py + '년', py === 1995);
  for (var pm = 1; pm <= 12; pm++) opt($('pMonth'), pm, pm + '월', pm === 1);
  function fillPDays() {
    var sel = $('pDay'), keep = +sel.value || 1;
    var cal = document.querySelector('input[name=pcal]:checked').value;
    var max = cal === 'lunar' ? 30 : new Date(+$('pYear').value, +$('pMonth').value, 0).getDate();
    sel.innerHTML = '';
    for (var d = 1; d <= max; d++) opt(sel, d, d + '일', d === Math.min(keep, max));
  }
  fillPDays();
  for (var ph = 0; ph < 24; ph++) opt($('pHour'), ph, (ph < 12 ? '오전 ' : '오후 ') + (ph % 12 === 0 ? 12 : ph % 12) + '시', ph === 12);
  for (var pmi = 0; pmi < 60; pmi++) opt($('pMin'), pmi, pmi + '분', pmi === 0);
  $('pYear').addEventListener('change', fillPDays);
  $('pMonth').addEventListener('change', fillPDays);
  document.querySelectorAll('input[name=pcal]').forEach(function (r) {
    r.addEventListener('change', function () {
      $('pLeapWrap').hidden = r.value !== 'lunar' || !r.checked;
      if (r.value === 'solar' && r.checked) $('pLeap').checked = false;
      fillPDays();
    });
  });
  $('pNoTime').addEventListener('change', function () { $('pTimeRow').hidden = this.checked; });
  $('mtForm').addEventListener('input', function () { $('mtErr').textContent = ''; });

  // 태어난 곳: 적는 즉시 어디로 알아들었는지 보여 준다
  function showPlace() {
    var r = window.SajuPlaces.resolve($('fPlace').value), h = $('fPlaceHint');
    h.className = 'place-hint ' + r.kind;
    if (r.kind === 'empty') h.textContent = '꼭 적어 주세요. 예) 경북 포항, 부산 해운대, 전주 · 모르면 도만 (예: 경북)';
    else if (r.ok) h.textContent = '✓ ' + r.label + ' 기준으로 계산해요';
    else h.textContent = '‘' + $('fPlace').value.trim() + '’은(는) 찾지 못했어요. 시·군·구나 도 이름으로 적어 주세요 (예: 경북 포항, 경북)';
    return r;
  }
  $('fPlace').addEventListener('input', function () { showPlace(); $('formErr').textContent = ''; });

  $('fYear').addEventListener('change', fillDays);
  $('fMonth').addEventListener('change', fillDays);
  document.querySelectorAll('input[name=cal]').forEach(function (r) {
    r.addEventListener('change', function () {
      $('leapWrap').hidden = r.value !== 'lunar' || !r.checked;
      if (r.value === 'solar' && r.checked) $('fLeap').checked = false;
      fillDays();
    });
  });
  $('fNoTime').addEventListener('change', function () {
    $('fHour').disabled = $('fMin').disabled = this.checked;
  });
  $('form').addEventListener('input', function () { $('formErr').textContent = ''; });

  // 지난 입력 불러오기
  function loadLast() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (!s) return;
      $('fName').value = s.name || '';
      document.querySelector('input[name=gender][value=' + (s.gender === 'M' ? 'M' : 'F') + ']').checked = true;
      document.querySelector('input[name=cal][value=' + (s.calendar === 'lunar' ? 'lunar' : 'solar') + ']').checked = true;
      $('leapWrap').hidden = s.calendar !== 'lunar';
      $('fLeap').checked = !!s.leap;
      $('fYear').value = s.year; $('fMonth').value = s.month; fillDays(); $('fDay').value = s.day;
      $('fNoTime').checked = s.hour == null;
      $('fHour').disabled = $('fMin').disabled = s.hour == null;
      if (s.hour != null) { $('fHour').value = s.hour; $('fMin').value = s.minute; }
      $('fPlace').value = s.placeText || '';
      $('fJasi').value = s.jasi || 'jojasi';
      $('fNoCorr').checked = !!s.noCorr;
    } catch (e) { /* 저장 안 되는 환경 */ }
  }
  loadLast();
  showPlace();

  function readForm() {
    var pr = window.SajuPlaces.resolve($('fPlace').value);
    var noTime = $('fNoTime').checked;
    return {
      name: $('fName').value.trim(),
      gender: document.querySelector('input[name=gender]:checked').value,
      calendar: document.querySelector('input[name=cal]:checked').value,
      leap: $('fLeap').checked,
      year: +$('fYear').value, month: +$('fMonth').value, day: +$('fDay').value,
      hour: noTime ? null : +$('fHour').value, minute: noTime ? null : +$('fMin').value,
      placeText: $('fPlace').value.trim(), placeName: pr.label, placeKind: pr.kind, longitude: pr.lon,
      jasi: $('fJasi').value, noCorr: $('fNoCorr').checked, solarCorrection: !$('fNoCorr').checked
    };
  }

  $('form').addEventListener('submit', function (ev) { ev.preventDefault(); runForm(false); });
  $('btnNyForm').addEventListener('click', function () { runForm(true); });
  $('btnMtForm').addEventListener('click', function () { runForm('mt'); });
  function runForm(ny) {
    var input = readForm();
    // 태어난 곳은 꼭 넣어야 한다 (모르면 도·광역시만이라도)
    if (input.placeKind === 'empty') { $('formErr').textContent = '태어난 곳을 적어 주세요. 정확히 모르시면 도나 시만 적어도 돼요 (예: 경북, 부산).'; $('fPlace').focus(); return; }
    if (input.placeKind === 'none') { $('formErr').textContent = '‘' + input.placeText + '’은(는) 찾지 못했어요. 시·군·구나 도 이름으로 적어 주세요 (예: 경북 포항, 경북).'; $('fPlace').focus(); return; }
    var result;
    try { result = E.calculate(input); }
    catch (e) { $('formErr').textContent = e.message || '날짜를 다시 확인해 주세요'; return; }
    try { localStorage.setItem(STORE_KEY, JSON.stringify(input)); } catch (e) { }
    last = { input: input, result: result };
    if (ny === 'mt') { mtFrom = 'input'; resultShown = false; openMatch(); return; }
    resultShown = true;
    if (ny) { $('gatherText').textContent = '2027년의 별을 모으고 있어요…'; gather(function () { $('gatherText').textContent = '별을 모으고 있어요…'; showResult(input, result, true); showNewYear(); }); return; }
    gather(function () { showResult(input, result); });
  }

  // ---------- 별 모으기 연출 ----------
  function gather(done) {
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { done(); return; }
    sfx('gather');
    var box = $('gather'), cv = $('gatherCanvas'), g = cv.getContext('2d');
    box.hidden = false;
    var W = cv.width = innerWidth * dpr, H = cv.height = innerHeight * dpr, cx = W / 2, cy = H / 2 - 30 * dpr;
    var ps = [];
    for (var i = 0; i < 140; i++) {
      var a = Math.random() * 6.283, d = Math.max(W, H) * (.5 + Math.random() * .4);
      ps.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, r: (Math.random() * 1.8 + .6) * dpr, k: .03 + Math.random() * .05 });
    }
    var t0 = performance.now(), finished = false;
    function finish() { if (finished) return; finished = true; box.hidden = true; done(); }
    setTimeout(finish, 2200); // 화면이 멈춰 있어도(백그라운드 탭) 결과는 꼭 나오게
    (function frame(now) {
      if (finished) return;
      var t = now - t0;
      g.clearRect(0, 0, W, H);
      ps.forEach(function (p) {
        p.x += (cx - p.x) * p.k; p.y += (cy - p.y) * p.k;
        g.fillStyle = Math.random() < .2 ? '#ffe08a' : '#fff';
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.fill();
      });
      var glow = Math.min(1, t / 1200);
      var rg = g.createRadialGradient(cx, cy, 0, cx, cy, 90 * dpr * glow + 1);
      rg.addColorStop(0, 'rgba(255,240,190,' + glow + ')'); rg.addColorStop(1, 'rgba(255,200,120,0)');
      g.fillStyle = rg; g.beginPath(); g.arc(cx, cy, 90 * dpr, 0, 6.283); g.fill();
      if (t < 1500) requestAnimationFrame(frame);
      else {
        // 번쩍
        g.fillStyle = 'rgba(255,245,220,.85)'; g.fillRect(0, 0, W, H);
        sfx('reveal');
        setTimeout(finish, 120);
      }
    })(t0);
  }

  // ---------- 결과 ----------
  function seoulToday() {
    var p = {};
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'numeric', day: 'numeric' })
      .formatToParts(new Date()).forEach(function (x) { p[x.type] = +x.value; });
    return { y: p.year, m: p.month, d: p.day };
  }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  var REL = [['bigyeon', 'geobjae'], ['siksin', 'sanggwan'], ['pyeonjae', 'jeongjae'], ['pyeongwan', 'jeonggwan'], ['pyeonin', 'jeongin']];
  function relation(me, other) {
    var e = C.STEM_ELEMENT, d = (e[other] - e[me] + 5) % 5;
    var same = C.STEM_YANG[me] === C.STEM_YANG[other];
    var row = d === 0 ? 0 : d === 1 ? 1 : d === 2 ? 2 : d === 3 ? 3 : 4;
    return REL[row][same ? 0 : 1];
  }
  var FALLBACK_COLOR = { wood: ['초록', '#5fe0a0'], fire: ['다홍', '#ff7b7b'], earth: ['노랑', '#f2c45a'], metal: ['은색', '#e3e9f5'], water: ['하늘색', '#6fb6ff'] };

  function showResult(input, r, quiet) {
    $('rTitle').textContent = input.name ? input.name + '님의 별자리 사주' : '나의 별자리 사주';
    var when = input.year + '년 ' + input.month + '월 ' + input.day + '일' + (input.calendar === 'lunar' ? ' (음력' + (input.leap ? ' 윤달' : '') + ')' : '');
    if (input.hour != null) when += ' ' + (input.hour < 12 ? '오전 ' : '오후 ') + (input.hour % 12 || 12) + '시 ' + input.minute + '분';
    $('rSub').textContent = when + ' · ' + r.animal + '띠';

    // 기둥 (오른쪽부터 년·월·일·시 → 화면은 시·일·월·년)
    var box = $('rPillars'); box.innerHTML = '';
    ['hour', 'day', 'month', 'year'].forEach(function (k, i) {
      var p = r.pillars[k], div = document.createElement('div');
      div.className = 'pl' + (k === 'day' ? ' me' : '') + (p ? '' : ' empty');
      var lab = { hour: '시', day: '일', month: '월', year: '년' }[k];
      div.innerHTML = p
        ? '<div class="lab">' + lab + '</div><div class="hj ' + p.stemElement + '">' + p.stemHanja + '</div><div class="hj ' + p.branchElement + '">' + p.branchHanja + '</div><div class="ko">' + p.ko + '</div><div class="el">' + EL_KO[p.stemElement] + '·' + EL_KO[p.branchElement] + '</div>'
        : '<div class="lab">' + lab + '</div><div class="hj">?</div><div class="hj">?</div><div class="ko">모름</div><div class="el">&nbsp;</div>';
      box.appendChild(div);
      setTimeout(function () { div.classList.add('show'); if (!quiet) sfx('pop'); }, quiet ? 0 : 250 + i * 260);
    });

    // 나를 나타내는 글자
    var dm = r.dayMaster, dmt = (T.dayMaster || {})[dm.hanja] || {};
    $('rHeroArt').className = 'hero-art ' + dm.element;
    $('rHeroArt').style.backgroundImage = 'url(img/' + dm.element + '.jpg)';
    $('rHeroArt').innerHTML = '<span>' + dm.hanja + '</span>';
    $('rHero').style.setProperty('--hero-img', 'url(img/' + dm.element + '.jpg)');
    $('rDmTitle').textContent = dmt.title || (dm.ko + ' — ' + dm.elementKo + '의 기운');
    $('rDmText').textContent = dmt.summary || '';
    $('rDmChips').innerHTML = (dmt.keywords || []).map(function (k) { return '<span>' + k + '</span>'; }).join('');

    // 다섯 기운
    var bars = $('rBars'); bars.innerHTML = '';
    var total = 0; EL_ORDER.forEach(function (e) { total += r.elements[e]; });
    EL_ORDER.forEach(function (e) {
      var n = r.elements[e];
      var row = document.createElement('div'); row.className = 'bar';
      row.innerHTML = '<span class="' + e + '">' + EL_KO[e] + '</span><div class="tr"><div class="f ' + e + '" style="background:var(--' + e + ')"></div></div><b class="' + e + '">' + n + '</b>';
      bars.appendChild(row);
      setTimeout(function () { row.querySelector('.f').style.width = Math.max(3, n / Math.max(total, 1) * 100 * 2.2) + '%'; }, 1400);
    });
    var et = $('rElemText'); et.innerHTML = '';
    EL_ORDER.forEach(function (e) {
      var n = r.elements[e], t = null;
      if (n >= 3 && T.elementMany) t = T.elementMany[e];
      if (n === 0 && T.elementNone) t = T.elementNone[e];
      if (t) { var d = document.createElement('div'); d.innerHTML = '<b class="' + e + '">' + t.title + '</b>' + t.text; et.appendChild(d); }
    });

    // 일주
    var il = (T.ilju || {})[r.pillars.day.hanja] || {};
    $('rIljuTitle').textContent = il.nickname || '';
    document.querySelector('#rIljuTitle').previousElementSibling.textContent = '나의 일주 · ' + r.pillars.day.ko + '일주 (' + r.pillars.day.hanja + ')';
    $('rIlju').innerHTML = [['성격', il.personality], ['일과 재능', il.work], ['사랑과 관계', il.love], ['이런 점을 챙겨요', il.care]]
      .filter(function (x) { return x[1]; })
      .map(function (x) { return '<div><b>' + x[0] + '</b>' + x[1] + '</div>'; }).join('') +
      '<a class="ilju-more" href="ilju/' + SLUG_S[r.pillars.day.stem] + SLUG_B[r.pillars.day.branch] + '.html">' + r.pillars.day.ko + '일주 더 알아보기 · 60일주 모아보기 →</a>';

    // 오늘의 운세
    var td = seoulToday(), tp = E.dayPillarOf(td.y, td.m, td.d);
    var rel = relation(dm.stem, tp.stem), tt = (T.today || {})[rel] || {};
    var seed = hash(td.y + '-' + td.m + '-' + td.d + '|' + r.pillars.day.hanja + '|' + (r.pillars.hour ? r.pillars.hour.hanja : ''));
    $('rTodayDate').textContent = td.m + '월 ' + td.d + '일 · 오늘은 ' + tp.ko + '일';
    $('rTodayTitle').textContent = '☾ ' + (tt.title || '오늘의 운세');
    $('rTodayText').textContent = tt.texts ? tt.texts[seed % tt.texts.length] : '';
    // 행운의 색: 내게 모자란 기운 중 날마다 하나
    var weak = EL_ORDER.slice().sort(function (a, b) { return r.elements[a] - r.elements[b]; });
    var minN = r.elements[weak[0]];
    var pool = weak.filter(function (e) { return r.elements[e] === minN; });
    var le = pool[seed % pool.length];
    var lc = (T.luckyColor || {})[le] || { name: FALLBACK_COLOR[le][0], hex: FALLBACK_COLOR[le][1] };
    $('rLuckyColor').innerHTML = '<i style="background:' + lc.hex + ';color:' + lc.hex + '"></i>' + lc.name;
    $('rLuckyNum').textContent = (seed >>> 3) % 9 + 1;
    // 오늘의 행운 아이템: 행운의 색과 같은 기운에서 날마다 하나 (결과는 절대 막지 않는다)
    var LK = window.SAJU_LUCKY;
    luckyToday = null;
    // 진짜 파트너스 링크와 상품 사진이 모두 있을 때만 보여 준다 (임시 사진·일반 링크는 절대 공개하지 않음)
    var ready = LK && LK.PARTNER.enabled && LK.items[le] && LK.items[le].filter(function (x) { return x.link && x.img; });
    if (ready && ready.length) {
      var list = ready, it = list[(seed >>> 7) % list.length];
      var useP = true;
      luckyToday = { it: it, el: le, col: lc.hex, href: useP ? it.link : 'https://www.coupang.com/np/search?q=' + encodeURIComponent(it.q),
        notice: useP ? LK.PARTNER.notice : '', day: td.y + '-' + td.m + '-' + td.d };
      fillLucky('rLi', luckyToday);
      $('rLuckyItem').style.setProperty('--li-col', lc.hex);
      $('rLuckyItem').hidden = false;
    } else { $('rLuckyItem').hidden = true; }

    // 후원(마음 보내기)
    var DN = LK && LK.DONATE;
    var donOn = !!(DN && DN.enabled && (DN.toss || DN.kakao));
    $('rDonate').hidden = !donOn;
    if (donOn) {
      $('rDonToss').hidden = !DN.toss; $('rDonToss').href = DN.toss || '#';
      $('rDonKakao').hidden = !DN.kakao; $('rDonKakao').href = DN.kakao || '#';
    }

    $('rNotes').innerHTML = r.notes.map(function (n) { return '<li>' + n + '</li>'; }).join('') +
      '<li>이달의 기준 절기: ' + r.monthTerm.name + '</li>' + (input.placeName ? '<li>태어난 곳: ' + esc(input.placeName) + '</li>' : '');

    $('viewInput').hidden = true; $('viewResult').hidden = false;
    scrollTo(0, 0);
    // 아래 카드들 차례로 등장
    var cards = document.querySelectorAll('#viewResult .glass, #viewResult .actions');
    cards.forEach(function (c, i) { c.classList.add('reveal'); c.classList.remove('in'); setTimeout(function () { c.classList.add('in'); }, 1300 + i * 140); });
    if (!quiet) setTimeout(maybeLuckyPopup, 4200);
  }

  function goInput(clear) {
    if (clear) { $('fName').value = ''; $('fPlace').value = ''; showPlace(); }
    $('viewResult').hidden = true; $('viewInput').hidden = false; scrollTo(0, 0);
  }
  $('btnAgain').addEventListener('click', function () { goInput(false); });
  $('btnFriend').addEventListener('click', function () { goInput(true); $('fName').focus(); });
  $('homeLink').addEventListener('click', function (e) { e.preventDefault(); document.body.classList.remove('reading'); $('viewReport').hidden = true; $('viewMatch').hidden = true; goInput(false); });
  // ---------- 깊은 감정서 ----------
  var SIZE_KEY = 'byeolbit-saju-size';
  function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function setSize(v) {
    $('viewReport').style.setProperty('--rs', v);
    document.querySelectorAll('.rp-size button').forEach(function (b) { b.classList.toggle('on', b.dataset.s === String(v)); });
    try { localStorage.setItem(SIZE_KEY, String(v)); } catch (e) { }
  }
  document.querySelectorAll('.rp-size button').forEach(function (b) { b.addEventListener('click', function () { setSize(b.dataset.s); }); });
  function renderBlock(b) {
    if (b.h) return '<h4>' + esc(b.h) + '</h4>';
    if (b.p) return '<p class="' + (b.cls || '') + '">' + esc(b.p) + '</p>';
    if (b.table) return '<table class="rp-table">' + b.table.map(function (t) { return '<tr><td>' + esc(t.pos) + '</td><td>' + esc(t.char) + '</td><td>' + esc(t.god) + '</td></tr>'; }).join('') + '</table>';
    if (b.chips) return '<p class="rp-label">' + esc(b.label) + '</p><div class="rp-chips">' + b.chips.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') + '</div>';
    if (b.list) return '<p class="rp-label">' + esc(b.label) + '</p><ul class="rp-ul">' + b.list.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul>';
    if (b.timeline) return '<div class="rp-tl">' + b.timeline.map(function (t) { return '<div class="' + (t.current ? 'cur' : '') + '"><span>' + esc(t.age) + '<br><small>' + esc(t.year) + '</small></span><b class="' + t.el + '">' + esc(t.pillar) + '</b><span>' + esc(t.title) + '</span></div>'; }).join('') + '</div>';
    if (b.wave) return waveSvg(b.wave);
    if (b.bars) {
      var mx = 1; b.bars.forEach(function (x) { EL_ORDER.forEach(function (e) { mx = Math.max(mx, x.el[e]); }); });
      return '<div class="mt-bars">' + EL_ORDER.map(function (e) {
        return '<div class="mt-bar"><span class="k ' + e + '">' + EL_KO[e] + '</span>' + b.bars.map(function (x, i) {
          return '<span class="b b' + i + '"><i class="' + e + '" style="width:' + Math.max(4, x.el[e] / mx * 100) + '%"></i><em>' + x.el[e] + '</em></span>';
        }).join('') + '</div>';
      }).join('') + '<p class="mt-bar-k">' + b.bars.map(function (x, i) { return '<span class="b' + i + '">' + esc(x.name) + '</span>'; }).join('') + '</p></div>';
    }
    if (b.roles) return '<table class="wk-roles"><tr><th>일</th><th>' + esc(b.roles.names[0]) + '</th><th>' + esc(b.roles.names[1]) + '</th><th>맡으면 좋은 사람</th></tr>' + b.roles.rows.map(function (x) {
      return '<tr><td><b class="' + x.el + '">' + esc(x.job) + '</b><small>' + esc(x.elKo) + ' 기운</small></td><td' + (x.a > x.b ? ' class="hi"' : '') + '>' + x.a + '</td><td' + (x.b > x.a ? ' class="hi"' : '') + '>' + x.b + '</td><td>' + esc(x.who) + '</td></tr>';
    }).join('') + '</table>';
    if (b.temps) return '<div class="sk-temps">' + b.temps.map(function (t) {
      var x = (Math.max(-6, Math.min(6, t.v)) + 6) / 12 * 100;
      return '<div class="sk-temp"><span class="who">' + esc(t.name) + '</span><span class="track"><i class="' + t.cls + '" style="left:' + x.toFixed(1) + '%"></i></span><span class="tv">' + ({ warm: '따뜻함', mild: '알맞음', cool: '시원함' }[t.cls]) + '</span></div>';
    }).join('') + '<p class="sk-temp-k"><span>❄ 시원함</span><span>따뜻함 ☀</span></p></div>';
    if (b.months) return '<div class="ny-mos">' + b.months.map(function (m) {
      return '<div class="ny-mo' + (m.help ? ' help' : '') + '"><div class="ny-mo-h"><b>' + esc(m.label) + '</b><span>' + esc(m.range) + '</span><em class="' + m.pillar.stemElement + '">' + esc(m.pillar.ko) + ' ' + m.pillar.hanja + '</em></div>' +
        '<p class="ny-flow">' + esc(m.flow) + (m.help ? ' <i>★ 힘이 나는 달</i>' : '') + '</p><p>' + esc(m.text) + '</p><p class="ny-tip">✓ ' + esc(m.tip) + '</p></div>';
    }).join('') + '</div>';
    if (b.wx) return '<div class="td-wx">' + b.wx.map(function (x) {
      return '<div class="td-wx-row ' + x.wx + '"><span class="ic" aria-hidden="true">' + x.icon + '</span><div><b>' + esc(x.ko) + ' <em>' + esc(x.wxKo) + '</em></b><p>' + esc(x.text) + '</p></div></div>';
    }).join('') + '</div>';
    if (b.flow) return '<div class="td-flow">' + b.flow.map(function (x) { return '<div><span>' + esc(x.when) + '</span><p>' + esc(x.text) + '</p></div>'; }).join('') + '</div>';
    if (b.hours) return '<p class="rp-label">좋은 시간</p><div class="td-hours">' + b.hours.map(function (x) { return '<span><b>' + esc(x.ko) + '</b> ' + esc(x.range) + '</span>'; }).join('') + '</div>' + (b.text ? '<p>' + esc(b.text) + '</p>' : '');
    if (b.say) return '<p class="td-say">“' + esc(b.say) + '”</p>';
    if (b.todo) return '<div class="td-todo"><div class="do"><span>✓ 오늘 해 볼 일</span><b>' + esc(b.todo[0]) + '</b></div><div class="rest"><span>☾ 오늘은 쉬어 갈 일</span><b>' + esc(b.todo[1]) + '</b></div></div>';
    if (b.week) return '<div class="td-week">' + b.week.map(function (w, i) {
      return '<div class="' + (i === 0 ? 'now ' : '') + w.wx + '"><span>' + esc(w.label) + '</span><i aria-label="' + ({ sun: '맑음', part: '구름 조금', cloud: '흐림' }[w.wx]) + '">' + w.icon + '</i><small>' + esc(w.md) + '</small></div>';
    }).join('') + '</div><p class="td-week-k"><span>☀ 맑음</span> · <span>⛅ 구름 조금</span> · <span>☁ 흐림</span></p>';
    if (b.lucky) return '<div class="rp-lucky">' + b.lucky.map(function (l) { return '<div><span>' + esc(l[0]) + '</span><b>' + esc(l[1]) + '</b></div>'; }).join('') + '</div>';
    return '';
  }
  function showReport() {
    if (!last) return;
    var input = last.input, r = last.result;
    var a = window.SajuAnalysis.analyze(r, { gender: input.gender });
    var rep = window.DeepReport.build(r, a, input);
    rpMode = 'deep'; setRpHead('deep');
    $('rpBody').parentNode.insertBefore($('rpLucky'), $('rpBody'));
    $('rpTitle').textContent = (input.name ? input.name + '님' : '나') + '의 깊은 감정서';
    $('rpSub').textContent = $('rSub').textContent + ' · ' + (input.gender === 'M' ? '남' : '여');
    $('rpPillars').innerHTML = ['hour', 'day', 'month', 'year'].map(function (k) {
      var p = r.pillars[k], lab = { hour: '시', day: '일·나', month: '월', year: '년' }[k];
      return '<div class="' + (k === 'day' ? 'me' : '') + '"><span class="' + (p ? p.stemElement : '') + '">' + (p ? p.stemHanja : '?') + '</span><br><span class="' + (p ? p.branchElement : '') + '">' + (p ? p.branchHanja : '?') + '</span><small>' + lab + '</small></div>';
    }).join('');
    $('rpSummary').innerHTML = rep.summary.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('');
    $('rpToc').innerHTML = rep.chapters.map(function (c, i) { return '<a href="#ch-' + c.id + '">' + (i + 1) + '. ' + esc(c.title) + '</a>'; }).join('');
    $('rpBody').innerHTML = rep.chapters.map(function (c, i) {
      return '<article class="glass card rp-ch" id="ch-' + c.id + '"><p class="no">제 ' + (i + 1) + ' 장</p><h3>' + esc(c.title) + '</h3><p class="chsub">' + esc(c.sub) + '</p>' + c.blocks.map(renderBlock).join('') + '</article>';
    }).join('');
    // 맨 위 행운 아이템(광고 표시 먼저), 맨 아래 후원
    if (luckyToday) { fillLucky('rp', luckyToday); var ad = $('rpAd'); if (ad) ad.hidden = !luckyToday.notice; $('rpLucky').hidden = false; } else $('rpLucky').hidden = true;
    var DN = window.SAJU_LUCKY && window.SAJU_LUCKY.DONATE, donOn = !!(DN && DN.enabled && (DN.toss || DN.kakao));
    $('rpDonate').hidden = !donOn;
    if (donOn) { $('rpDonToss').hidden = !DN.toss; $('rpDonToss').href = DN.toss || '#'; $('rpDonKakao').hidden = !DN.kakao; $('rpDonKakao').href = DN.kakao || '#'; }
    var sz = '1'; try { sz = localStorage.getItem(SIZE_KEY) || '1'; } catch (e) { }
    setSize(sz);
    $('viewResult').hidden = true; $('viewReport').hidden = false; scrollTo(0, 0);
    document.body.classList.add('reading');
    var chs = document.querySelectorAll('#viewReport .rp-ch');
    chs.forEach(function (c, i) { c.classList.add('reveal'); setTimeout(function () { c.classList.add('in'); }, 200 + i * 120); });
    window.__lastReportChars = rep.chars;
  }
  // ---------- 2027 신년운세 ----------
  var rpMode = 'deep', RP_HOW = null;
  function setRpHead(mode) {
    if (RP_HOW === null) RP_HOW = $('rpHow').textContent;
    var isM = mode === 'mt' || mode === 'sk' || mode === 'wk';
    $('rpPill').textContent = mode === 'td' ? '☾ 별빛 오늘의 운세' : mode === 'ny' ? '🎍 별빛 2027 신년운세' : mode === 'mt' ? '💞 별빛 연애 궁합' : mode === 'sk' ? '💗 별빛 속궁합' : mode === 'wk' ? '💼 별빛 일 궁합' : '✦ 별빛 깊은 감정서';
    $('rpPillars').className = 'rp-mini';
    $('rpMtCard').hidden = mode !== 'mt'; $('rpWkCard').hidden = mode !== 'wk'; $('rpTdCard').hidden = mode !== 'td'; $('rpToc').hidden = mode === 'td';
    $('rpMtAgain').hidden = $('rpOther').hidden = !isM;
    if (isM) {
      var others = ['mt', 'sk', 'wk'].filter(function (k) { return k !== mode; });
      $('rpOtherA').textContent = MK_LABEL[others[0]]; $('rpOtherA').dataset.k = others[0];
      $('rpOtherB').textContent = MK_LABEL[others[1]]; $('rpOtherB').dataset.k = others[1];
    }
    $('rpHow').textContent = mode === 'td' ? '이 오늘의 운세는 오늘 날짜의 글자(일진)와 이번 달 글자를 내 사주 여덟 글자와 명리학의 규칙(십신·지지의 합충형·원진·나를 돕는 기운)으로 맞춰 보고, 별빛 사주가 직접 쓴 풀이 글을 골라 이어 붙여 만들었어요. 같은 날에는 몇 번을 열어도 같은 풀이가 나와요.'
      : mode === 'sk' ? '이 속궁합은 두 사람의 배우자 자리(일지)와 천간합, 도화, 사주의 온도와 양·음, 식상·인성 기운을 명리학의 규칙으로 맞춰 보고, 별빛 사주가 직접 쓴 풀이 글을 골라 이어 붙여 만들었어요. 재미로 비유한 풀이이며 성별은 계산에 쓰지 않아요.'
      : mode === 'wk' ? '이 일 궁합은 두 사람의 일간 오행 관계(십신)와 일하는 자리(월지)의 합충, 다섯 기운의 수, 사주의 온도를 명리학의 규칙으로 맞춰 보고, 별빛 사주가 직접 쓴 풀이 글을 골라 이어 붙여 만들었어요. 동업·투자 같은 결정은 전문가와 상의해 주세요.'
      : mode === 'mt' ? '이 궁합은 두 사람의 사주 글자를 명리학의 규칙(천간합·오행의 상생상극·지지의 합충형·원진·십신)으로 맞춰 보고, 별빛 사주가 직접 쓴 풀이 글을 골라 이어 붙여 만들었어요. 성별은 계산에 쓰지 않아요.' : mode === 'ny' ? '이 신년운세는 내 사주 여덟 글자와 2027년 정미년, 그리고 절기로 바뀌는 열두 달의 글자를 명리학의 규칙(십신·합충·신살·대운)으로 맞춰 보고, 별빛 사주가 직접 쓴 풀이 글을 골라 이어 붙여 만들었어요.' : RP_HOW;
    $('rpNyCard').hidden = mode !== 'ny';
  }
  function waveSvg(ms) {
    var W = 360, Hh = 170, x0 = 20, dx = (W - 40) / 11;
    var pts = ms.map(function (m, i) { return [x0 + i * dx, 128 - (m.level - 1) / 4.5 * 92]; });
    var d = 'M' + pts[0][0] + ' ' + pts[0][1].toFixed(1);
    for (var i = 1; i < pts.length; i++) { var mx = ((pts[i - 1][0] + pts[i][0]) / 2).toFixed(1); d += ' C' + mx + ' ' + pts[i - 1][1].toFixed(1) + ' ' + mx + ' ' + pts[i][1].toFixed(1) + ' ' + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1); }
    var area = d + ' L' + pts[11][0].toFixed(1) + ' 140 L' + pts[0][0] + ' 140 Z';
    var dots = pts.map(function (p, i) {
      var m = ms[i];
      return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="4" class="' + (m.help ? 'h' : '') + '"/>' + (m.help ? '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] - 10).toFixed(1) + '" class="st">★</text>' : '') +
        '<text x="' + p[0].toFixed(1) + '" y="160" class="mo">' + m.short.replace('월', '') + '</text>';
    }).join('');
    return '<div class="ny-wave"><svg viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="12달 흐름 물결 그림"><defs><linearGradient id="nyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe08a" stop-opacity=".35"/><stop offset="1" stop-color="#ffe08a" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + area + '" fill="url(#nyG)"/><path d="' + d + '" class="ln"/>' + dots + '</svg>' +
      '<p class="ny-wave-k"><span>위로 갈수록 바깥으로 활발히</span><span>아래는 안으로 다지기</span><span>★ 나를 돕는 기운</span></p></div>';
  }
  var lastNy = null;
  function showNewYear() {
    if (!last) return;
    var input = last.input, r = last.result;
    var a = window.SajuAnalysis.analyze(r, { gender: input.gender });
    var rep = window.NewYear.build(r, a, input, 2027);
    lastNy = rep; rpMode = 'ny'; setRpHead('ny');
    $('rpTitle').textContent = (input.name ? input.name + '님' : '나') + '의 2027 신년운세';
    $('rpSub').textContent = $('rSub').textContent + ' · ' + (input.gender === 'M' ? '남' : '여');
    $('rpPillars').innerHTML = ['hour', 'day', 'month', 'year'].map(function (k) {
      var p = r.pillars[k], lab = { hour: '시', day: '일·나', month: '월', year: '년' }[k];
      return '<div class="' + (k === 'day' ? 'me' : '') + '"><span class="' + (p ? p.stemElement : '') + '">' + (p ? p.stemHanja : '?') + '</span><br><span class="' + (p ? p.branchElement : '') + '">' + (p ? p.branchHanja : '?') + '</span><small>' + lab + '</small></div>';
    }).join('') + '<div class="ny-yp"><span class="' + rep.pillar.stemElement + '">' + rep.pillar.hanja[0] + '</span><br><span class="' + rep.pillar.branchElement + '">' + rep.pillar.hanja[1] + '</span><small>2027년</small></div>';
    $('rpSummary').innerHTML = rep.summary.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('');
    $('rpToc').innerHTML = rep.chapters.map(function (c, i) { return '<a href="#ch-' + c.id + '">' + (i + 1) + '. ' + esc(c.title) + '</a>'; }).join('');
    $('rpBody').innerHTML = rep.chapters.map(function (c, i) {
      return '<article class="glass card rp-ch" id="ch-' + c.id + '"><p class="no">' + (i + 1) + ' / ' + rep.chapters.length + '</p><h3>' + esc(c.title) + '</h3><p class="chsub">' + esc(c.sub) + '</p>' + c.blocks.map(renderBlock).join('') + '</article>';
    }).join('');
    // 신년운세에서는 행운템을 풀이 맨 아래에 둔다
    $('rpBody').parentNode.insertBefore($('rpLucky'), $('rpDonate'));
    if (luckyToday) { fillLucky('rp', luckyToday); var ad = $('rpAd'); if (ad) ad.hidden = !luckyToday.notice; $('rpLucky').hidden = false; } else $('rpLucky').hidden = true;
    var DN = window.SAJU_LUCKY && window.SAJU_LUCKY.DONATE, donOn = !!(DN && DN.enabled && (DN.toss || DN.kakao));
    $('rpDonate').hidden = !donOn;
    var sz = '1'; try { sz = localStorage.getItem(SIZE_KEY) || '1'; } catch (e) { }
    setSize(sz);
    $('viewInput').hidden = true; $('viewResult').hidden = true; $('viewReport').hidden = false; scrollTo(0, 0);
    document.body.classList.add('reading');
    var chs = document.querySelectorAll('#viewReport .rp-ch');
    chs.forEach(function (c, i) { c.classList.add('reveal'); setTimeout(function () { c.classList.add('in'); }, 200 + i * 120); });
    window.__lastNyChars = rep.chars;
  }
  $('btnNy').addEventListener('click', function () {
    if (!last) return;
    $('gatherText').textContent = '2027년의 별을 모으고 있어요…';
    gather(function () { $('gatherText').textContent = '별을 모으고 있어요…'; showNewYear(); });
  });

  // ---------- 오늘의 운세 (0.11) ----------
  var lastTd = null;
  function showToday() {
    if (!last) return;
    var input = last.input, r = last.result;
    var a = window.SajuAnalysis.analyze(r, { gender: input.gender });
    var rep = window.Today.build(r, a, input, seoulToday());
    lastTd = rep; rpMode = 'td'; setRpHead('td');
    $('rpTitle').textContent = (input.name ? input.name + '님' : '나') + '의 오늘 운세';
    $('rpSub').textContent = rep.date.m + '월 ' + rep.date.d + '일 ' + rep.dow + '요일 · 오늘은 ' + rep.pillar.ko + '(' + rep.pillar.hanja + ')일';
    $('rpPillars').innerHTML = ['hour', 'day', 'month', 'year'].map(function (k) {
      var p = r.pillars[k], lab = { hour: '시', day: '일·나', month: '월', year: '년' }[k];
      return '<div class="' + (k === 'day' ? 'me' : '') + '"><span class="' + (p ? p.stemElement : '') + '">' + (p ? p.stemHanja : '?') + '</span><br><span class="' + (p ? p.branchElement : '') + '">' + (p ? p.branchHanja : '?') + '</span><small>' + lab + '</small></div>';
    }).join('') + '<div class="ny-yp"><span class="' + rep.pillar.stemElement + '">' + rep.pillar.hanja[0] + '</span><br><span class="' + rep.pillar.branchElement + '">' + rep.pillar.hanja[1] + '</span><small>오늘</small></div>';
    $('rpSummary').innerHTML = ['오늘의 이름: “' + rep.title + '”'].concat(rep.summary).map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('');
    var chs = [
      { id: 'td-wx', title: '오늘의 날씨', sub: '일 · 돈 · 사랑 · 사람 · 몸', blocks: [{ chips: rep.kw.map(function (k) { return '#' + k; }), label: '오늘의 낱말' }, { wx: rep.areas }] },
      { id: 'td-flow', title: '오늘의 흐름', sub: '아침 · 낮 · 저녁, 그리고 좋은 시간', blocks: [{ flow: rep.flow }].concat(rep.hours.length ? [{ hours: rep.hours, text: rep.hourText }] : []) },
      { id: 'td-about', title: '오늘 글자 풀이', sub: '오늘 날 글자와 내 글자의 만남', blocks: [{ p: rep.about }, { p: rep.month }, { say: rep.saying }] },
      { id: 'td-lucky', title: '오늘의 행운', sub: '나를 돕는 작은 것들', blocks: [{ lucky: rep.lucky }, { todo: [rep.todo, rep.rest] }] },
      { id: 'td-week', title: '이번 주 날씨', sub: '오늘부터 7일', blocks: [{ week: rep.week }, { p: rep.tomorrow, cls: 'td-tmw' }, { p: '내일 또 봐요 ☾', cls: 'td-bye' }] }
    ];
    $('rpToc').innerHTML = '';
    $('rpBody').innerHTML = chs.map(function (c, i) {
      return '<article class="glass card rp-ch" id="ch-' + c.id + '"><p class="no">' + (i + 1) + ' / ' + chs.length + '</p><h3>' + esc(c.title) + '</h3><p class="chsub">' + esc(c.sub) + '</p>' + c.blocks.map(renderBlock).join('') + '</article>';
    }).join('');
    // 행운템은 풀이 맨 아래 (광고 안내 문구는 행운템 칸 맨 위)
    $('rpBody').parentNode.insertBefore($('rpLucky'), $('rpDonate'));
    if (luckyToday) { fillLucky('rp', luckyToday); var ad = $('rpAd'); if (ad) ad.hidden = !luckyToday.notice; $('rpLucky').hidden = false; } else $('rpLucky').hidden = true;
    var DN = window.SAJU_LUCKY && window.SAJU_LUCKY.DONATE, donOn = !!(DN && DN.enabled && (DN.toss || DN.kakao));
    $('rpDonate').hidden = !donOn;
    var sz = '1'; try { sz = localStorage.getItem(SIZE_KEY) || '1'; } catch (e) { }
    setSize(sz);
    $('viewInput').hidden = true; $('viewResult').hidden = true; $('viewMatch').hidden = true; $('viewReport').hidden = false; scrollTo(0, 0);
    document.body.classList.add('reading');
    var cs = document.querySelectorAll('#viewReport .rp-ch');
    cs.forEach(function (c, i) { c.classList.add('reveal'); setTimeout(function () { c.classList.add('in'); }, 200 + i * 120); });
    window.__lastTdChars = rep.chars;
  }
  $('btnTd').addEventListener('click', function () {
    if (!last) return;
    $('gatherText').textContent = '오늘의 별을 모으고 있어요…';
    gather(function () { $('gatherText').textContent = '별을 모으고 있어요…'; showToday(); });
  });
  // 다시 온 사람: 첫 화면 맨 위에 오늘 운세 칸 (생일은 이 휴대폰 안에만 저장)
  function savedInput() { try { var s = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); return s && s.year ? s : null; } catch (e) { return null; } }
  function initTdBack() {
    var s = savedInput();
    if (!s) { $('tdBack').hidden = true; return; }
    var td = seoulToday();
    $('tdBackDate').textContent = td.m + '월 ' + td.d + '일 · 오늘은 ' + E.dayPillarOf(td.y, td.m, td.d).ko + '일';
    $('tdBackTitle').textContent = (s.name ? s.name + '님, ' : '') + '오늘 운세가 도착했어요 ☾';
    $('tdBackSub').textContent = '지난번에 넣은 생일(' + s.year + '.' + s.month + '.' + s.day + (s.calendar === 'lunar' ? ' 음력' : '') + ')로 바로 보여 드려요. 생일은 이 휴대폰 안에만 있어요.';
    $('btnForget').textContent = '내 정보 지우기'; $('btnForget').dataset.n = '0';
    $('tdBack').hidden = false;
  }
  $('btnTdBack').addEventListener('click', function () {
    var s = savedInput(), result;
    if (!s) { $('tdBack').hidden = true; return; }
    try { result = E.calculate(s); } catch (e) { $('tdBack').hidden = true; return; }
    last = { input: s, result: result }; resultShown = true;
    $('gatherText').textContent = '오늘의 별을 모으고 있어요…';
    gather(function () { $('gatherText').textContent = '별을 모으고 있어요…'; showResult(s, result, true); showToday(); });
  });
  // 실수로 지우지 않게 두 번 눌러야 지운다
  $('btnForget').addEventListener('click', function () {
    var b = this;
    if (b.dataset.n !== '1') { b.dataset.n = '1'; b.textContent = '한 번 더 누르면 이 휴대폰에서 지워져요'; return; }
    try { localStorage.removeItem(STORE_KEY); localStorage.removeItem(P_KEY); localStorage.removeItem(POP_KEY); } catch (e) { }
    $('form').reset(); $('fNoTime').checked = false; $('fHour').disabled = $('fMin').disabled = false; $('leapWrap').hidden = true;
    $('tdBack').hidden = true;
  });
  initTdBack();

  // ---------- 궁합 (연애 · 속궁합 · 일 궁합) ----------
  var MK_LABEL = { mt: '💞 연애 궁합 보기', sk: '💗 속궁합 보기', wk: '💼 일 궁합 보기' };
  var MK_TIP = { mt: '두 사람의 기본 결, 함께 있을 때의 분위기, 서로에게 어떤 사람인지 풀어 드려요.',
    sk: '두 사람의 끌림, 온도, 가까워지는 속도, 어울리는 분위기를 사주로 비유해 풀어 드려요.',
    wk: '함께 일할 때 누가 이끌고 누가 받쳐 주는지, 각자 잘하는 일과 부딪치기 쉬운 순간을 풀어 드려요.' };
  function mkind() { var c = document.querySelector('input[name=mkind]:checked'); return c ? c.value : 'mt'; }
  document.querySelectorAll('input[name=mkind]').forEach(function (x) { x.addEventListener('change', function () { $('mkTip').textContent = MK_TIP[mkind()]; }); });
  function otherKind() { var k = this.dataset.k; if (!last || !lastP || !k) return; document.querySelector('input[name=mkind][value=' + k + ']').checked = true; $('mkTip').textContent = MK_TIP[k]; showMatch(k); }
  $('rpOtherA').addEventListener('click', otherKind); $('rpOtherB').addEventListener('click', otherKind);
  var P_KEY = 'byeolbit-saju-partner', mtFrom = 'result', resultShown = false, lastMt = null, lastP = null;
  function openMatch() {
    var me = last.input;
    $('mtMe').textContent = '나: ' + (me.name ? me.name + ' · ' : '') + me.year + '.' + me.month + '.' + me.day + (me.calendar === 'lunar' ? ' (음력)' : '') + ' · ' + last.result.pillars.day.ko + '일주';
    try {
      var s = JSON.parse(localStorage.getItem(P_KEY) || 'null');
      if (s) {
        $('pName').value = s.name || '';
        document.querySelector('input[name=pcal][value=' + (s.calendar === 'lunar' ? 'lunar' : 'solar') + ']').checked = true;
        $('pLeapWrap').hidden = s.calendar !== 'lunar'; $('pLeap').checked = !!s.leap;
        $('pYear').value = s.year; $('pMonth').value = s.month; fillPDays(); $('pDay').value = s.day;
        $('pNoTime').checked = s.hour == null; $('pTimeRow').hidden = s.hour == null;
        if (s.hour != null) { $('pHour').value = s.hour; $('pMin').value = s.minute; }
      }
    } catch (e) { }
    $('mtErr').textContent = '';
    document.body.classList.remove('reading');
    $('viewInput').hidden = true; $('viewResult').hidden = true; $('viewReport').hidden = true; $('viewMatch').hidden = false; scrollTo(0, 0);
  }
  $('btnMt').addEventListener('click', function () { if (!last) return; mtFrom = 'result'; openMatch(); });
  $('rpMtAgain').addEventListener('click', function () { if (!last) return; mtFrom = resultShown ? 'result' : 'input'; $('pName').value = ''; try { localStorage.removeItem(P_KEY); } catch (e) { } openMatch(); });
  $('mtBack').addEventListener('click', function () {
    $('viewMatch').hidden = true;
    if (mtFrom === 'input' || !resultShown) $('viewInput').hidden = false; else { $('viewResult').hidden = false; }
    scrollTo(0, 0);
  });
  $('mtForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (!last) return;
    var noTime = $('pNoTime').checked;
    var pin = { name: $('pName').value.trim(), calendar: document.querySelector('input[name=pcal]:checked').value, leap: $('pLeap').checked,
      year: +$('pYear').value, month: +$('pMonth').value, day: +$('pDay').value, hour: noTime ? null : +$('pHour').value, minute: noTime ? null : +$('pMin').value };
    var pr;
    try { pr = E.calculate(pin); } catch (e) { $('mtErr').textContent = e.message || '날짜를 다시 확인해 주세요'; return; }
    try { localStorage.setItem(P_KEY, JSON.stringify(pin)); } catch (e) { }
    lastP = { input: pin, result: pr };
    var kind = mkind();
    $('gatherText').textContent = '두 사람의 별을 잇고 있어요…';
    gather(function () {
      $('gatherText').textContent = '별을 모으고 있어요…';
      if (!resultShown) { showResult(last.input, last.result, true); resultShown = true; }
      showMatch(kind);
    });
  });
  function pillRow(r) {
    return '<div class="rp-mini">' + ['hour', 'day', 'month', 'year'].map(function (k) {
      var p = r.pillars[k], lab = { hour: '시', day: '일', month: '월', year: '년' }[k];
      return '<div class="' + (k === 'day' ? 'me' : '') + '"><span class="' + (p ? p.stemElement : '') + '">' + (p ? p.stemHanja : '?') + '</span><br><span class="' + (p ? p.branchElement : '') + '">' + (p ? p.branchHanja : '?') + '</span><small>' + lab + '</small></div>';
    }).join('') + '</div>';
  }
  function showMatch(kind) {
    if (!last || !lastP) return;
    kind = kind || 'mt';
    var MM = window.MatchMore;
    var rep = kind === 'sk' ? MM.buildSok(last.result, last.input, lastP.result, lastP.input) : kind === 'wk' ? MM.buildWork(last.result, last.input, lastP.result, lastP.input) : window.Match.build(last.result, last.input, lastP.result, lastP.input);
    lastMt = rep; rpMode = kind; setRpHead(kind);
    var meName = last.input.name || '나', ic = { mt: ' 💞 ', sk: ' 💗 ', wk: ' 💼 ' }[kind];
    $('rpTitle').textContent = meName + ic + (lastP.input.name || '상대');
    $('rpSub').textContent = { mt: '연애 궁합', sk: '속궁합', wk: '일 궁합' }[kind] + ' · ' + rep.name;
    $('rpPillars').className = 'rp-mini mt-pair';
    $('rpPillars').innerHTML = '<div class="mt-row"><p class="mt-who">' + esc(meName) + '</p>' + pillRow(last.result) + '</div><div class="mt-row"><p class="mt-who">' + esc(lastP.input.name || '상대') + '</p>' + pillRow(lastP.result) + '</div>';
    $('rpSummary').innerHTML = rep.summary.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('');
    $('rpToc').innerHTML = rep.chapters.map(function (c, i) { return '<a href="#ch-' + c.id + '">' + (i + 1) + '. ' + esc(c.title) + '</a>'; }).join('');
    $('rpBody').innerHTML = rep.chapters.map(function (c, i) {
      return '<article class="glass card rp-ch" id="ch-' + c.id + '"><p class="no">' + (i + 1) + ' / ' + rep.chapters.length + '</p><h3>' + esc(c.title) + '</h3><p class="chsub">' + esc(c.sub) + '</p>' + c.blocks.map(renderBlock).join('') + '</article>';
    }).join('');
    $('rpBody').parentNode.insertBefore($('rpLucky'), $('rpDonate'));
    // 속궁합에는 행운템(광고)을 붙이지 않는다
    if (luckyToday && kind !== 'sk') { fillLucky('rp', luckyToday); var ad = $('rpAd'); if (ad) ad.hidden = !luckyToday.notice; $('rpLucky').hidden = false; } else $('rpLucky').hidden = true;
    var DN = window.SAJU_LUCKY && window.SAJU_LUCKY.DONATE, donOn = !!(DN && DN.enabled && (DN.toss || DN.kakao));
    $('rpDonate').hidden = !donOn;
    var sz = '1'; try { sz = localStorage.getItem(SIZE_KEY) || '1'; } catch (e) { }
    setSize(sz);
    $('viewInput').hidden = true; $('viewMatch').hidden = true; $('viewResult').hidden = true; $('viewReport').hidden = false; scrollTo(0, 0);
    document.body.classList.add('reading');
    var chs = document.querySelectorAll('#viewReport .rp-ch');
    chs.forEach(function (c, i) { c.classList.add('reveal'); setTimeout(function () { c.classList.add('in'); }, 200 + i * 120); });
    window.__lastMtChars = rep.chars;
  }

  // ---------- 감정서 기다림: 동그란 진행률 + 읽는 법 카드 ----------
  var DW_CARDS = [
    ['🧭', '사주는 지도예요, 정답이 아니에요', '타고난 기질과 흐름을 보여 줄 뿐, 앞날을 정해 두지 않아요.', '100% 믿기보다 나를 돌아보는 거울로 읽어 주세요.'],
    ['✍️', '와닿는 말에 밑줄을 그어 보세요', '감정서는 여러 갈래로 풀어요. 모든 문장이 꼭 맞을 수는 없어요.', '맞다 싶은 부분만 챙겨도 충분해요. 아닌 말은 가볍게 넘기세요.'],
    ['⏰', '태어난 시간이 정확할수록 깊어져요', '시간이 30분만 달라도 시주(태어난 시의 글자)가 바뀔 수 있어요.', '시간을 모르면 여섯 글자로 풀어요. 나중에 알게 되면 다시 넣어 보세요.'],
    ['☯️', '좋은 운, 나쁜 운은 따로 없어요', '같은 기운도 쓰기에 따라 장점이 되고 단점이 돼요.', '‘조심할 때’라고 적힌 곳은 겁낼 일이 아니라 미리 준비할 일로 읽어 주세요.'],
    ['🌦️', '대운은 10년마다 바뀌는 날씨예요', '계절이 바뀌듯 바탕이 달라질 뿐이에요.', '비가 오는 해에도 우산을 챙기는 건 나예요. 그 안에서 무엇을 할지는 내가 정해요.'],
    ['⚖️', '중요한 결정은 사주만으로 하지 마세요', '건강, 돈, 법, 진로처럼 큰 일은 꼭 그 분야 전문가와 상의하세요.', '감정서는 참고용이에요. 결정은 언제나 나의 몫이에요.'],
    ['🔒', '이 감정서는 이렇게 만들어져요', '만세력 계산과 명리 풀이 규칙에 따라 내 휴대폰 안에서 자동으로 만들어져요.', '적어 주신 생년월일과 이름은 어디에도 보내거나 모아 두지 않아요.'],
    ['📜', '1년 뒤에 다시 읽어 보세요', '다 읽은 뒤 ‘인쇄’ 버튼으로 종이나 PDF로 남길 수 있어요.', '시간이 지나 다시 읽으면 그때는 다른 문장이 와닿을 거예요.']
  ];
  var DW_STEPS = [[0, '여덟 글자를 펼치고 있어요'], [10, '나와 다른 글자의 관계(십신)를 살피는 중'], [24, '내 기운의 세기를 재는 중'], [36, '나에게 필요한 기운을 찾는 중'], [48, '합·충·신살을 맞춰 보는 중'], [58, '10년마다의 흐름(대운)을 그리는 중'], [70, '올해와 내년의 운을 읽는 중'], [80, '일·재물·사랑·건강을 풀어 쓰는 중'], [92, '11장으로 정리하는 중']];
  var dwState = null, dwMadeFor = '';
  (function buildCards() {
    $('dwTrack').innerHTML = DW_CARDS.map(function (c, i) {
      return '<div class="dw-card"><span class="no">' + (i + 1) + ' / ' + DW_CARDS.length + '</span><div class="ic">' + c[0] + '</div><h4>' + c[1] + '</h4><p>' + c[2] + '</p><p>' + c[3] + '</p></div>';
    }).join('');
    $('dwDots').innerHTML = DW_CARDS.map(function () { return '<i></i>'; }).join('');
  })();
  function dwShow(i) {
    if (!dwState) return;
    var n = DW_CARDS.length; dwState.card = (i + n) % n;
    $('dwTrack').style.transform = 'translateX(' + (-100 * dwState.card) + '%)';
    [].forEach.call($('dwDots').children, function (d, k) { d.className = k === dwState.card ? 'on' : ''; });
    dwState.lastTurn = Date.now();
  }
  $('dwPrev').addEventListener('click', function () { dwShow(dwState.card - 1); });
  $('dwNext').addEventListener('click', function () { dwShow(dwState.card + 1); });
  (function swipe() {
    var x0 = null;
    $('dwCards').addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    $('dwCards').addEventListener('touchend', function (e) {
      if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) dwShow(dwState.card + (dx < 0 ? 1 : -1));
    });
  })();
  function dwSetPct(p) {
    $('dwPct').textContent = p;
    $('dwBar').style.strokeDashoffset = (326.73 * (1 - p / 100)).toFixed(2);
    var step = DW_STEPS[0][1]; DW_STEPS.forEach(function (s) { if (p >= s[0]) step = s[1]; });
    if ($('dwStep').textContent !== step) $('dwStep').textContent = step;
  }
  function deepWait() {
    var total = window.__DW_MS || 60000; // 약 1분. 그동안 읽는 법 카드를 읽게 한다
    dwState = { card: 0, t0: Date.now(), lastTurn: Date.now(), done: false };
    $('dwDone').hidden = true; $('dwGo').hidden = true; $('dwStep').hidden = false;
    $('dwRing').classList.remove('full');
    $('deepWait').hidden = false; $('deepWait').scrollTop = 0;
    document.body.style.overflow = 'hidden';
    dwShow(0); dwSetPct(1);
    // 단계마다 잠깐 머무르는 진행: 처음은 빠르게, 끝으로 갈수록 천천히
    var tick = setInterval(function () {
      var st = dwState; if (!st || st.done) { clearInterval(tick); return; }
      var x = Math.min(1, (Date.now() - st.t0) / total);
      var p = Math.max(1, Math.min(100, Math.round(100 * (1 - Math.pow(1 - x, 1.7)))));
      if (x < 1 && p >= 100) p = 99;
      dwSetPct(p);
      if (Date.now() - st.lastTurn > 8000) dwShow(st.card + 1); // 8초마다 다음 카드
      if (x >= 1) {
        st.done = true; clearInterval(tick);
        $('dwStep').hidden = true; $('dwDone').hidden = false; $('dwGo').hidden = false;
        $('dwRing').classList.add('full'); sfx('reveal');
        dwMadeFor = JSON.stringify(last.input);
      }
    }, 250);
  }
  $('dwGo').addEventListener('click', function () {
    dwState = null; $('deepWait').hidden = true; document.body.style.overflow = '';
    showReport();
  });
  $('btnDeep').addEventListener('click', function () {
    if (!last) return;
    if (dwMadeFor === JSON.stringify(last.input)) { // 이미 만든 감정서는 바로 다시 연다
      $('gatherText').textContent = '감정서를 펼치고 있어요…';
      gather(function () { $('gatherText').textContent = '별을 모으고 있어요…'; showReport(); });
      return;
    }
    sfx('open'); deepWait();
  });
  $('rpBack').addEventListener('click', function () { document.body.classList.remove('reading'); $('viewMatch').hidden = true; $('viewInput').hidden = true; $('viewReport').hidden = true; $('viewResult').hidden = false; $(rpMode === 'td' ? 'rTodayDate' : rpMode === 'ny' ? 'rNyCta' : (rpMode === 'mt' || rpMode === 'sk' || rpMode === 'wk') ? 'rMtCta' : 'rDeepCta').scrollIntoView(); });
  $('rpTop').addEventListener('click', function () { scrollTo(0, 0); });
  $('rpPrint').addEventListener('click', function () { var v = $('viewReport').style.getPropertyValue('--rs'); window.print(); });
  $('rpPrintBig').addEventListener('click', function () {
    var prev = $('viewReport').style.getPropertyValue('--rs') || '1';
    $('viewReport').style.setProperty('--rs', '1.35');
    setTimeout(function () { window.print(); $('viewReport').style.setProperty('--rs', prev); }, 50);
  });

  // ---------- 별빛 공유 카드 (1080×1350) ----------
  var last = null, cardBlob = null;
  function loadImg(src) { return new Promise(function (ok, no) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = no; i.src = src; }); }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function cover(g, img, x, y, w, h) {
    var s = Math.max(w / img.width, h / img.height), iw = img.width * s, ih = img.height * s;
    g.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  }
  function wrapText(g, text, x, y, maxW, lh, maxLines) {
    var words = text.split(' '), line = '', lines = [];
    words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
    if (line) lines.push(line);
    lines.slice(0, maxLines).forEach(function (l, i) { g.fillText(l, x, y + i * lh); });
  }
  var COL = { wood: '#5fe0a0', fire: '#ff7b7b', earth: '#f2c45a', metal: '#e3e9f5', water: '#6fb6ff' };
  function makeCard(input, r) {
    var W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var g = cv.getContext('2d');
    var dm = r.dayMaster, dmt = (T.dayMaster || {})[dm.hanja] || {}, il = (T.ilju || {})[r.pillars.day.hanja] || {};
    return Promise.all([
      loadImg('img/sky.jpg'), loadImg('img/' + dm.element + '.jpg'),
      document.fonts.load('700 60px "Gowun Batang"'), document.fonts.load('100px "Song Myung"'), document.fonts.load('40px "Gowun Dodum"')
    ]).then(function (res) {
      var sky = res[0], art = res[1];
      // 배경
      g.fillStyle = '#120a2e'; g.fillRect(0, 0, W, H);
      g.globalAlpha = .75; cover(g, sky, 0, 0, W, H); g.globalAlpha = 1;
      var gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, 'rgba(18,10,46,.35)'); gr.addColorStop(.5, 'rgba(18,10,46,.55)'); gr.addColorStop(1, 'rgba(18,10,46,.9)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      // 별 가루
      for (var i = 0; i < 140; i++) { g.globalAlpha = Math.random() * .8 + .2; g.fillStyle = Math.random() < .2 ? '#ffe9a8' : '#fff'; g.beginPath(); g.arc(Math.random() * W, Math.random() * H, Math.random() * 2.2 + .4, 0, 6.283); g.fill(); }
      g.globalAlpha = 1;
      // 머리
      g.textAlign = 'center';
      g.fillStyle = '#ffe08a'; g.font = '700 38px "Gowun Batang"'; g.fillText('✦ 별빛 사주', W / 2, 92);
      g.fillStyle = '#f3ecff'; g.font = '700 62px "Gowun Batang"'; g.fillText((input.name ? input.name + '님의' : '나의') + ' 별자리 사주', W / 2, 180);
      g.fillStyle = '#c9bfe6'; g.font = '34px "Gowun Dodum"'; g.fillText(r.animal + '띠 · ' + r.pillars.day.ko + '일주', W / 2, 232);
      // 여덟 글자
      var keys = ['hour', 'day', 'month', 'year'], labs = ['시', '일', '월', '년'], bw = 200, gap = 26, x0 = (W - (bw * 4 + gap * 3)) / 2, y0 = 278, bh = 300;
      keys.forEach(function (k, i) {
        var p = r.pillars[k], x = x0 + i * (bw + gap);
        roundRect(g, x, y0, bw, bh, 30);
        g.fillStyle = k === 'day' ? 'rgba(255,224,138,.16)' : 'rgba(255,255,255,.08)'; g.fill();
        g.lineWidth = k === 'day' ? 4 : 2; g.strokeStyle = k === 'day' ? '#ffe08a' : 'rgba(255,255,255,.22)'; g.stroke();
        g.fillStyle = '#9a8fc0'; g.font = '30px "Gowun Dodum"'; g.fillText(k === 'day' ? '일 · 나' : labs[i], x + bw / 2, y0 + 50);
        g.font = '108px "Song Myung"';
        [[p ? p.stemHanja : '?', p ? COL[p.stemElement] : '#9a8fc0', 158], [p ? p.branchHanja : '?', p ? COL[p.branchElement] : '#9a8fc0', 268]].forEach(function (c) {
          g.fillStyle = c[1]; g.shadowColor = c[1]; g.shadowBlur = p ? 24 : 0; g.fillText(c[0], x + bw / 2, y0 + c[2]); g.shadowBlur = 0;
        });
      });
      // 그림 + 나를 나타내는 글자
      var ay = 618, ah = 400, ax = 70, aw = W - 140;
      g.save(); roundRect(g, ax, ay, aw, ah, 36); g.clip(); cover(g, art, ax, ay, aw, ah);
      var ag = g.createLinearGradient(0, ay, 0, ay + ah); ag.addColorStop(.35, 'rgba(18,10,46,0)'); ag.addColorStop(1, 'rgba(18,10,46,.92)');
      g.fillStyle = ag; g.fillRect(ax, ay, aw, ah); g.restore();
      roundRect(g, ax, ay, aw, ah, 36); g.lineWidth = 2; g.strokeStyle = 'rgba(255,230,160,.5)'; g.stroke();
      g.textAlign = 'left';
      g.fillStyle = COL[dm.element]; g.shadowColor = COL[dm.element]; g.shadowBlur = 30; g.font = '150px "Song Myung"'; g.fillText(dm.hanja, ax + aw - 190, ay + 170); g.shadowBlur = 0;
      g.fillStyle = '#ffe08a'; g.font = '700 50px "Gowun Batang"'; g.fillText(dmt.title || dm.elementKo + '의 기운', ax + 40, ay + ah - 96);
      g.fillStyle = '#f3ecff'; g.font = '36px "Gowun Dodum"'; g.fillText('“' + (il.nickname || '') + '”', ax + 40, ay + ah - 40);
      // 다섯 기운
      var ey = 1080, ew = (W - 140 - 4 * 20) / 5;
      EL_ORDER.forEach(function (e, i) {
        var x = 70 + i * (ew + 20), n = r.elements[e];
        roundRect(g, x, ey, ew, 120, 22); g.fillStyle = 'rgba(255,255,255,.08)'; g.fill();
        g.textAlign = 'center'; g.fillStyle = COL[e]; g.font = '32px "Gowun Dodum"'; g.fillText(EL_KO[e], x + ew / 2, ey + 48);
        g.font = '700 46px "Gowun Batang"'; g.shadowColor = COL[e]; g.shadowBlur = n ? 16 : 0; g.fillText(String(n), x + ew / 2, ey + 102); g.shadowBlur = 0;
      });
      // 아래
      g.textAlign = 'center'; g.fillStyle = '#c9bfe6'; g.font = '32px "Gowun Dodum"';
      var addr = (location.host + location.pathname).replace(/^www\./, '').replace(/index\.html$/, '').replace(/\/$/, '');
      g.fillText('나의 별자리 사주 보기 → ' + addr, W / 2, 1290);
      return new Promise(function (ok) { cv.toBlob(function (b) { ok({ blob: b, url: URL.createObjectURL(b) }); }, 'image/png'); });
    });
  }
  function makeNyCard(input, rep) {
    var W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var g = cv.getContext('2d');
    return Promise.all([loadImg('img/sky.jpg'), document.fonts.load('700 60px "Gowun Batang"'), document.fonts.load('100px "Song Myung"'), document.fonts.load('40px "Gowun Dodum"')]).then(function (res) {
      g.fillStyle = '#120a2e'; g.fillRect(0, 0, W, H);
      g.globalAlpha = .75; cover(g, res[0], 0, 0, W, H); g.globalAlpha = 1;
      var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(18,10,46,.35)'); gr.addColorStop(1, 'rgba(18,10,46,.9)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (var i = 0; i < 140; i++) { g.globalAlpha = Math.random() * .8 + .2; g.fillStyle = Math.random() < .2 ? '#ffe9a8' : '#fff'; g.beginPath(); g.arc(Math.random() * W, Math.random() * H, Math.random() * 2.2 + .4, 0, 6.283); g.fill(); }
      g.globalAlpha = 1; g.textAlign = 'center';
      g.fillStyle = '#ffe08a'; g.font = '700 38px "Gowun Batang"'; g.fillText('✦ 별빛 사주 · 2027 신년운세', W / 2, 96);
      g.fillStyle = '#f3ecff'; g.font = '700 60px "Gowun Batang"'; g.fillText((input.name ? input.name + '님의' : '나의') + ' 2027년', W / 2, 184);
      g.font = '200px "Song Myung"';
      [[rep.pillar.hanja[0], COL[rep.pillar.stemElement], W / 2 - 120], [rep.pillar.hanja[1], COL[rep.pillar.branchElement], W / 2 + 120]].forEach(function (c) {
        g.fillStyle = c[1]; g.shadowColor = c[1]; g.shadowBlur = 36; g.fillText(c[0], c[2], 430); g.shadowBlur = 0;
      });
      g.fillStyle = '#c9bfe6'; g.font = '34px "Gowun Dodum"'; g.fillText('정미년(丁未年)', W / 2, 500);
      g.fillStyle = '#ffe08a'; g.font = '700 54px "Gowun Batang"'; g.fillText('“' + rep.oneLine + '”', W / 2, 610);
      g.fillStyle = '#f3ecff'; g.font = '40px "Gowun Dodum"'; g.fillText(rep.keywords.map(function (k) { return '#' + k; }).join('   '), W / 2, 690);
      var x0 = 120, x1 = W - 120, dx = (x1 - x0) / 11, yb = 1010, hh = 190;
      var pts = rep.months.map(function (m, i) { return [x0 + i * dx, yb - (m.level - 1) / 4.5 * hh]; });
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      for (var k = 1; k < pts.length; k++) { var mx = (pts[k - 1][0] + pts[k][0]) / 2; g.bezierCurveTo(mx, pts[k - 1][1], mx, pts[k][1], pts[k][0], pts[k][1]); }
      g.strokeStyle = '#ffe08a'; g.lineWidth = 6; g.shadowColor = '#ffe08a'; g.shadowBlur = 18; g.stroke(); g.shadowBlur = 0;
      pts.forEach(function (p, i) {
        var m = rep.months[i];
        g.fillStyle = m.help ? '#5fe0a0' : '#ffe08a'; g.beginPath(); g.arc(p[0], p[1], m.help ? 12 : 9, 0, 6.283); g.fill();
        if (m.help) { g.font = '34px "Gowun Dodum"'; g.fillText('★', p[0], p[1] - 24); }
        g.fillStyle = '#c9bfe6'; g.font = '30px "Gowun Dodum"'; g.fillText(m.short.replace('월', ''), p[0], yb + 60);
      });
      g.fillStyle = '#9a8fc0'; g.font = '30px "Gowun Dodum"'; g.fillText('달마다의 흐름 (월) · ★ 힘이 나는 달', W / 2, yb + 116);
      g.fillStyle = '#c9bfe6'; g.font = '32px "Gowun Dodum"';
      var addr = (location.host + location.pathname).replace(/^www\./, '').replace(/index\.html$/, '').replace(/\/$/, '');
      g.fillText('나의 2027 신년운세 보기 → ' + addr, W / 2, 1290);
      return new Promise(function (ok) { cv.toBlob(function (b) { ok({ blob: b, url: URL.createObjectURL(b) }); }, 'image/png'); });
    });
  }
  function makeMtCard(meIn, pIn, rA, rB, rep) {
    var wk = rep.kind === 'wk';
    var W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var g = cv.getContext('2d');
    return Promise.all([loadImg('img/sky.jpg'), document.fonts.load('700 60px "Gowun Batang"'), document.fonts.load('100px "Song Myung"'), document.fonts.load('40px "Gowun Dodum"')]).then(function (res) {
      g.fillStyle = '#120a2e'; g.fillRect(0, 0, W, H);
      g.globalAlpha = .75; cover(g, res[0], 0, 0, W, H); g.globalAlpha = 1;
      var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(40,10,46,.35)'); gr.addColorStop(1, 'rgba(18,10,46,.92)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (var i = 0; i < 140; i++) { g.globalAlpha = Math.random() * .8 + .2; g.fillStyle = Math.random() < .25 ? '#ffc6d9' : '#fff'; g.beginPath(); g.arc(Math.random() * W, Math.random() * H, Math.random() * 2.2 + .4, 0, 6.283); g.fill(); }
      g.globalAlpha = 1; g.textAlign = 'center';
      g.fillStyle = '#ffe08a'; g.font = '700 38px "Gowun Batang"'; g.fillText(wk ? '✦ 별빛 사주 · 일 궁합' : '✦ 별빛 사주 · 연애 궁합', W / 2, 96);
      var nA = meIn.name || '나', nB = pIn.name || '상대';
      // 두 사람의 일주
      [[rA, nA, W / 2 - 230], [rB, nB, W / 2 + 230]].forEach(function (x) {
        var p = x[0].pillars.day, cx = x[2];
        roundRect(g, cx - 150, 170, 300, 420, 36); g.fillStyle = 'rgba(255,255,255,.08)'; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(255,200,220,.45)'; g.stroke();
        g.fillStyle = '#f3ecff'; g.font = '700 44px "Gowun Batang"'; g.fillText(x[1].length > 6 ? x[1].slice(0, 6) + '…' : x[1], cx, 236);
        g.font = '150px "Song Myung"';
        [[p.stemHanja, COL[p.stemElement], 400], [p.branchHanja, COL[p.branchElement], 550]].forEach(function (c) { g.fillStyle = c[1]; g.shadowColor = c[1]; g.shadowBlur = 30; g.fillText(c[0], cx, c[2]); g.shadowBlur = 0; });
      });
      var hc = wk ? '#ffe08a' : '#ff9ec0';
      g.font = '110px "Gowun Dodum"'; g.fillStyle = hc; g.shadowColor = hc; g.shadowBlur = 30; g.fillText(wk ? '✦' : '♥', W / 2, 420); g.shadowBlur = 0;
      g.fillStyle = '#ffe08a'; g.font = '700 64px "Gowun Batang"'; g.fillText('“' + rep.name + '”', W / 2, 740);
      g.fillStyle = '#f3ecff'; g.font = '42px "Gowun Dodum"'; g.fillText(rep.keywords.map(function (k) { return '#' + k; }).join('   '), W / 2, 830);
      g.fillStyle = '#c9bfe6'; g.font = '34px "Gowun Dodum"';
      var l1 = wk ? rep.cardLines[0] : rep.summary[1].replace('기본 결: ', ''), l2 = wk ? rep.cardLines[1] : rep.summary[2].replace('함께 있을 때: ', '함께 있으면 · ');
      wrapText(g, l1, W / 2, 930, W - 200, 50, 2);
      wrapText(g, l2, W / 2, 1040, W - 200, 50, 2);
      g.fillStyle = '#c9bfe6'; g.font = '32px "Gowun Dodum"';
      var addr = (location.host + location.pathname).replace(/^www\./, '').replace(/index\.html$/, '').replace(/\/$/, '');
      g.fillText((wk ? '우리 일 궁합 보기 → ' : '우리 궁합 보기 → ') + addr, W / 2, 1290);
      return new Promise(function (ok) { cv.toBlob(function (b) { ok({ blob: b, url: URL.createObjectURL(b) }); }, 'image/png'); });
    });
  }
  $('rpMtCard').addEventListener('click', function () {
    if (!last || !lastP || !lastMt) return;
    var btn = this; btn.disabled = true; btn.textContent = '카드를 그리는 중…';
    makeMtCard(last.input, lastP.input, last.result, lastP.result, lastMt).then(function (c) {
      cardBlob = c.blob; cardName = 'byeolbit-match.png'; $('cardImg').src = c.url; $('cardTip').textContent = '';
      var file = new File([c.blob], cardName, { type: 'image/png' });
      $('cardShare').hidden = !(navigator.canShare && navigator.canShare({ files: [file] }));
      $('cardModal').hidden = false; sfx('open');
    }).catch(function () { $('cardTip').textContent = '카드를 그리지 못했어요. 다시 눌러 주세요'; })
      .then(function () { btn.disabled = false; btn.textContent = '💞 우리 궁합 카드 만들기'; });
  });
  $('rpWkCard').addEventListener('click', function () {
    if (!last || !lastP || !lastMt || lastMt.kind !== 'wk') return;
    var btn = this; btn.disabled = true; btn.textContent = '카드를 그리는 중…';
    makeMtCard(last.input, lastP.input, last.result, lastP.result, lastMt).then(function (c) {
      cardBlob = c.blob; cardName = 'byeolbit-team.png'; $('cardImg').src = c.url; $('cardTip').textContent = '';
      var file = new File([c.blob], cardName, { type: 'image/png' });
      $('cardShare').hidden = !(navigator.canShare && navigator.canShare({ files: [file] }));
      $('cardModal').hidden = false; sfx('open');
    }).catch(function () { $('cardTip').textContent = '카드를 그리지 못했어요. 다시 눌러 주세요'; })
      .then(function () { btn.disabled = false; btn.textContent = '💼 우리 팀 카드 만들기'; });
  });
  var cardName = 'byeolbit-saju.png';
  function makeTdCard(input, rep) {
    var W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var g = cv.getContext('2d');
    return Promise.all([loadImg('img/sky.jpg'), document.fonts.load('700 60px "Gowun Batang"'), document.fonts.load('40px "Gowun Dodum"')]).then(function (res) {
      g.fillStyle = '#120a2e'; g.fillRect(0, 0, W, H);
      g.globalAlpha = .75; cover(g, res[0], 0, 0, W, H); g.globalAlpha = 1;
      var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(18,10,46,.35)'); gr.addColorStop(1, 'rgba(18,10,46,.92)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (var i = 0; i < 140; i++) { g.globalAlpha = Math.random() * .8 + .2; g.fillStyle = Math.random() < .2 ? '#bfe0ff' : '#fff'; g.beginPath(); g.arc(Math.random() * W, Math.random() * H, Math.random() * 2.2 + .4, 0, 6.283); g.fill(); }
      g.globalAlpha = 1; g.textAlign = 'center';
      g.fillStyle = '#ffe08a'; g.font = '700 38px "Gowun Batang"'; g.fillText('☾ 별빛 사주 · 오늘의 운세', W / 2, 96);
      g.fillStyle = '#f3ecff'; g.font = '700 58px "Gowun Batang"'; g.fillText((input.name ? input.name + '님의' : '나의') + ' 오늘', W / 2, 182);
      g.fillStyle = '#c9bfe6'; g.font = '34px "Gowun Dodum"'; g.fillText(rep.date.m + '월 ' + rep.date.d + '일 ' + rep.dow + '요일 · ' + rep.pillar.ko + '(' + rep.pillar.hanja + ')일', W / 2, 240);
      g.fillStyle = '#ffe08a'; g.font = '700 62px "Gowun Batang"'; g.shadowColor = '#ffe08a'; g.shadowBlur = 20;
      g.fillText('“' + rep.title + '”', W / 2, 350); g.shadowBlur = 0;
      var y0 = 420, rh = 112;
      rep.areas.forEach(function (x, i) {
        var y = y0 + i * (rh + 14);
        roundRect(g, 130, y, W - 260, rh, 28); g.fillStyle = x.wx === 'sun' ? 'rgba(255,224,138,.14)' : 'rgba(255,255,255,.08)'; g.fill();
        g.lineWidth = 2; g.strokeStyle = x.wx === 'sun' ? 'rgba(255,224,138,.55)' : 'rgba(255,255,255,.2)'; g.stroke();
        g.textAlign = 'left'; g.fillStyle = '#f3ecff'; g.font = '700 46px "Gowun Batang"'; g.fillText(x.ko, 180, y + 72);
        g.textAlign = 'center'; g.font = '64px sans-serif'; g.fillStyle = '#fff'; g.fillText(x.icon, W / 2 + 40, y + 80);
        g.textAlign = 'right'; g.fillStyle = x.wx === 'sun' ? '#ffe08a' : '#c9bfe6'; g.font = '38px "Gowun Dodum"'; g.fillText(x.wxKo, W - 180, y + 70);
      });
      var ly = y0 + 5 * (rh + 14) + 70;
      g.textAlign = 'center'; g.font = '38px "Gowun Dodum"';
      var lt = '행운의 색 ' + rep.lucky[0][1] + '   ·   행운의 숫자 ' + rep.lucky[1][1];
      var tw = g.measureText(lt).width;
      g.fillStyle = rep.luckyHex || '#ffe08a'; g.beginPath(); g.arc(W / 2 - tw / 2 - 36, ly - 13, 18, 0, 6.283); g.fill();
      g.fillStyle = '#f3ecff'; g.fillText(lt, W / 2 + 10, ly);
      g.fillStyle = '#ffe08a'; g.font = '40px "Gowun Batang"'; wrapText(g, '“' + rep.saying + '”', W / 2, ly + 86, W - 200, 52, 2);
      g.fillStyle = '#c9bfe6'; g.font = '32px "Gowun Dodum"';
      var addr = (location.host + location.pathname).replace(/^www\./, '').replace(/index\.html$/, '').replace(/\/$/, '');
      g.fillText('나의 오늘 운세 보기 → ' + addr, W / 2, 1290);
      return new Promise(function (ok) { cv.toBlob(function (b) { ok({ blob: b, url: URL.createObjectURL(b) }); }, 'image/png'); });
    });
  }
  $('rpTdCard').addEventListener('click', function () {
    if (!last || !lastTd) return;
    var btn = this; btn.disabled = true; btn.textContent = '카드를 그리는 중…';
    makeTdCard(last.input, lastTd).then(function (c) {
      cardBlob = c.blob; cardName = 'byeolbit-today.png'; $('cardImg').src = c.url; $('cardTip').textContent = '';
      var file = new File([c.blob], cardName, { type: 'image/png' });
      $('cardShare').hidden = !(navigator.canShare && navigator.canShare({ files: [file] }));
      $('cardModal').hidden = false; sfx('open');
    }).catch(function () { $('cardTip').textContent = '카드를 그리지 못했어요. 다시 눌러 주세요'; })
      .then(function () { btn.disabled = false; btn.textContent = '☾ 오늘의 운세 카드 만들기'; });
  });
  $('rpNyCard').addEventListener('click', function () {
    if (!last || !lastNy) return;
    var btn = this; btn.disabled = true; btn.textContent = '카드를 그리는 중…';
    makeNyCard(last.input, lastNy).then(function (c) {
      cardBlob = c.blob; cardName = 'byeolbit-2027.png'; $('cardImg').src = c.url; $('cardTip').textContent = '';
      var file = new File([c.blob], cardName, { type: 'image/png' });
      $('cardShare').hidden = !(navigator.canShare && navigator.canShare({ files: [file] }));
      $('cardModal').hidden = false; sfx('open');
    }).catch(function () { $('cardTip').textContent = '카드를 그리지 못했어요. 다시 눌러 주세요'; })
      .then(function () { btn.disabled = false; btn.textContent = '✧ 나의 2027 카드 만들기'; });
  });
  $('btnCard').addEventListener('click', function () {
    if (!last) return;
    var btn = this; btn.disabled = true; btn.textContent = '별빛 카드를 그리는 중…';
    makeCard(last.input, last.result).then(function (c) {
      cardBlob = c.blob; cardName = 'byeolbit-saju.png'; $('cardImg').src = c.url; $('cardTip').textContent = '';
      var file = new File([c.blob], cardName, { type: 'image/png' });
      $('cardShare').hidden = !(navigator.canShare && navigator.canShare({ files: [file] }));
      $('cardModal').hidden = false; sfx('open');
    }).catch(function () { $('cardTip').textContent = '카드를 그리지 못했어요. 다시 눌러 주세요'; })
      .then(function () { btn.disabled = false; btn.textContent = '✧ 별빛 카드 만들기'; });
  });
  $('cardSave').addEventListener('click', function () {
    if (!cardBlob) return;
    var a = document.createElement('a'); a.href = $('cardImg').src; a.download = cardName; document.body.appendChild(a); a.click(); a.remove();
    $('cardTip').textContent = '사진이 저장됐어요. 휴대폰에서는 사진을 길게 눌러 저장해도 돼요';
  });
  $('cardShare').addEventListener('click', function () {
    var file = new File([cardBlob], cardName, { type: 'image/png' });
    var ny = cardName.indexOf('2027') >= 0, mt = cardName.indexOf('match') >= 0, tm = cardName.indexOf('team') >= 0, td = cardName.indexOf('today') >= 0;
    navigator.share({ files: [file], title: '별빛 사주', text: (td ? '내 오늘의 운세야 ☾ ' : tm ? '우리 일 궁합 나왔어 💼 ' : mt ? '우리 궁합 나왔어 💞 ' : ny ? '내 2027 신년운세야 ✦ ' : '내 별자리 사주 카드야 ✦ ') + location.origin + location.pathname }).catch(function () { });
  });
  $('lpClose').addEventListener('click', closeLucky);
  $('lpSkip').addEventListener('click', closeLucky);
  $('luckyModal').addEventListener('click', function (e) { if (e.target === this) closeLucky(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeLucky(); $('cardModal').hidden = true; } });
  $('cardClose').addEventListener('click', function () { $('cardModal').hidden = true; });
  $('cardModal').addEventListener('click', function (e) { if (e.target === this) this.hidden = true; });

  // ---------- 소리 (파일 없이 만든 맑은 종소리, 끄기 가능) ----------
  var SOUND_KEY = 'byeolbit-saju-sound', soundOn = true, actx = null;
  try { soundOn = localStorage.getItem(SOUND_KEY) !== 'off'; } catch (e) { }
  var sbtn = document.createElement('button');
  sbtn.className = 'sound-btn'; sbtn.type = 'button';
  var SPK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/>';
  function paintSound() {
    sbtn.innerHTML = SPK + (soundOn ? '<path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>' : '<path d="M17 9l5 6M22 9l-5 6"/></svg>'); sbtn.setAttribute('aria-label', soundOn ? '소리 끄기' : '소리 켜기'); }
  paintSound();
  sbtn.addEventListener('click', function () { soundOn = !soundOn; try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch (e) { } paintSound(); if (soundOn) sfx('open'); });
  document.querySelector('.top').appendChild(sbtn);
  function tone(f, t0, dur, vol, type) {
    var o = actx.createOscillator(), gn = actx.createGain();
    o.type = type || 'sine'; o.frequency.value = f;
    gn.gain.setValueAtTime(0, t0); gn.gain.linearRampToValueAtTime(vol, t0 + .02); gn.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.connect(gn).connect(actx.destination); o.start(t0); o.stop(t0 + dur + .05);
  }
  function sfx(kind) {
    if (!soundOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t = actx.currentTime + .01;
      if (kind === 'gather') { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, t + i * .18, .9, .05, 'triangle'); }); }
      else if (kind === 'reveal') { [1568, 2093].forEach(function (f, i) { tone(f, t + i * .07, 1.4, .06); }); tone(784, t, 1.6, .04, 'triangle'); }
      else if (kind === 'pop') { tone(1175 + Math.random() * 200, t, .35, .035); }
      else if (kind === 'open') { tone(1319, t, .6, .04); tone(1976, t + .08, .8, .03); }
    } catch (e) { }
  }
})();
