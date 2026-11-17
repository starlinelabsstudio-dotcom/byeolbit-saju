/* 별빛 사주 — 화면 */
(function () {
  'use strict';
  var E = window.SajuEngine;
  var T = window.SAJU_TEXTS || {};
  var C = E.constants;
  var $ = function (id) { return document.getElementById(id); };
  var EL_KO = { wood: '나무', fire: '불', earth: '흙', metal: '쇠', water: '물' };
  var EL_ORDER = ['wood', 'fire', 'earth', 'metal', 'water'];
  // 시·도 단위 (도는 도의 가운데쯤 경도). 경도 1도 차이는 시각 약 4분 차이라, 같은 도 안에서는 결과가 거의 같다.
  var PLACES = [
    ['서울', 126.98], ['부산', 129.08], ['대구', 128.60], ['인천', 126.71], ['광주', 126.85], ['대전', 127.38], ['울산', 129.31], ['세종', 127.29],
    ['경기도', 127.20], ['강원도', 128.30], ['충청북도', 127.70], ['충청남도', 126.90], ['전라북도', 127.10], ['전라남도', 126.90],
    ['경상북도', 128.70], ['경상남도', 128.40], ['제주도', 126.53], ['북한 지역', 126.50], ['해외 · 잘 모름 (서울로 계산)', 126.98]
  ];
  function placeIndex(name) { for (var i = 0; i < PLACES.length; i++) if (PLACES[i][0] === name) return i; return -1; }
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
      ph.innerHTML = '<img alt="' + it.name.replace(/"/g, '') + '" src="' + it.img + '"><span class="li-tag">쿠팡</span>';
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
  opt($('fPlace'), '', '태어난 곳을 골라 주세요', true);
  $('fPlace').options[0].disabled = true;
  PLACES.forEach(function (p, i) { opt($('fPlace'), i, p[0], false); });
  $('fPlace').addEventListener('change', function () { this.classList.toggle('empty', this.value === ''); });
  $('fPlace').classList.add('empty');

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
      var pi = placeIndex(s.placeName || '');
      if (pi >= 0) { $('fPlace').value = pi; $('fPlace').classList.remove('empty'); }
      $('fJasi').value = s.jasi || 'jojasi';
      $('fNoCorr').checked = !!s.noCorr;
    } catch (e) { /* 저장 안 되는 환경 */ }
  }
  loadLast();

  function readForm() {
    var pv = $('fPlace').value, place = pv === '' ? null : PLACES[+pv];
    var noTime = $('fNoTime').checked;
    return {
      name: $('fName').value.trim(),
      gender: document.querySelector('input[name=gender]:checked').value,
      calendar: document.querySelector('input[name=cal]:checked').value,
      leap: $('fLeap').checked,
      year: +$('fYear').value, month: +$('fMonth').value, day: +$('fDay').value,
      hour: noTime ? null : +$('fHour').value, minute: noTime ? null : +$('fMin').value,
      placeName: place ? place[0] : '', longitude: place ? place[1] : 126.98,
      jasi: $('fJasi').value, noCorr: $('fNoCorr').checked, solarCorrection: !$('fNoCorr').checked
    };
  }

  $('form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var input = readForm();
    if (!input.placeName) { $('formErr').textContent = '태어난 곳을 골라 주세요. 모르면 맨 아래 "해외 · 잘 모름"을 고르면 돼요.'; $('fPlace').focus(); return; }
    var result;
    try { result = E.calculate(input); }
    catch (e) { $('formErr').textContent = e.message || '날짜를 다시 확인해 주세요'; return; }
    try { localStorage.setItem(STORE_KEY, JSON.stringify(input)); } catch (e) { }
    last = { input: input, result: result };
    gather(function () { showResult(input, result); });
  });

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

  function showResult(input, r) {
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
      setTimeout(function () { div.classList.add('show'); sfx('pop'); }, 250 + i * 260);
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
      '<li>이달의 기준 절기: ' + r.monthTerm.name + '</li>';

    $('viewInput').hidden = true; $('viewResult').hidden = false;
    scrollTo(0, 0);
    // 아래 카드들 차례로 등장
    var cards = document.querySelectorAll('#viewResult .glass, #viewResult .actions');
    cards.forEach(function (c, i) { c.classList.add('reveal'); c.classList.remove('in'); setTimeout(function () { c.classList.add('in'); }, 1300 + i * 140); });
    setTimeout(maybeLuckyPopup, 4200);
  }

  function goInput(clear) {
    if (clear) { $('fName').value = ''; $('fPlace').value = ''; $('fPlace').classList.add('empty'); }
    $('viewResult').hidden = true; $('viewInput').hidden = false; scrollTo(0, 0);
  }
  $('btnAgain').addEventListener('click', function () { goInput(false); });
  $('btnFriend').addEventListener('click', function () { goInput(true); $('fName').focus(); });
  $('homeLink').addEventListener('click', function (e) { e.preventDefault(); document.body.classList.remove('reading'); $('viewReport').hidden = true; goInput(false); });
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
    if (b.lucky) return '<div class="rp-lucky">' + b.lucky.map(function (l) { return '<div><span>' + esc(l[0]) + '</span><b>' + esc(l[1]) + '</b></div>'; }).join('') + '</div>';
    return '';
  }
  function showReport() {
    if (!last) return;
    var input = last.input, r = last.result;
    var a = window.SajuAnalysis.analyze(r, { gender: input.gender });
    var rep = window.DeepReport.build(r, a, input);
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
  $('btnDeep').addEventListener('click', function () {
    $('gatherText').textContent = '감정서를 펼치고 있어요…';
    gather(function () { $('gatherText').textContent = '별을 모으고 있어요…'; showReport(); });
  });
  $('rpBack').addEventListener('click', function () { document.body.classList.remove('reading'); $('viewReport').hidden = true; $('viewResult').hidden = false; $('rDeepCta').scrollIntoView(); });
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
  $('btnCard').addEventListener('click', function () {
    if (!last) return;
    var btn = this; btn.disabled = true; btn.textContent = '별빛 카드를 그리는 중…';
    makeCard(last.input, last.result).then(function (c) {
      cardBlob = c.blob; $('cardImg').src = c.url; $('cardTip').textContent = '';
      var file = new File([c.blob], 'byeolbit-saju.png', { type: 'image/png' });
      $('cardShare').hidden = !(navigator.canShare && navigator.canShare({ files: [file] }));
      $('cardModal').hidden = false; sfx('open');
    }).catch(function () { $('cardTip').textContent = '카드를 그리지 못했어요. 다시 눌러 주세요'; })
      .then(function () { btn.disabled = false; btn.textContent = '✧ 별빛 카드 만들기'; });
  });
  $('cardSave').addEventListener('click', function () {
    if (!cardBlob) return;
    var a = document.createElement('a'); a.href = $('cardImg').src; a.download = 'byeolbit-saju.png'; document.body.appendChild(a); a.click(); a.remove();
    $('cardTip').textContent = '사진이 저장됐어요. 휴대폰에서는 사진을 길게 눌러 저장해도 돼요';
  });
  $('cardShare').addEventListener('click', function () {
    var file = new File([cardBlob], 'byeolbit-saju.png', { type: 'image/png' });
    navigator.share({ files: [file], title: '별빛 사주', text: '내 별자리 사주 카드야 ✦ ' + location.origin + location.pathname }).catch(function () { });
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
