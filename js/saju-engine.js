/*
 * 별빛 사주 — 만세력 계산 엔진
 * 브라우저와 Node 양쪽에서 쓴다. 의존: lunar-javascript(절기 시각), korean-lunar-calendar(음력→양력, 한국천문연구원 기준)
 *
 * 규칙 (09_PRD.md 7번)
 *  - 년·월 기둥: 절입 "시각" 기준 (입춘 전이면 전년도)
 *  - 표준시·서머타임: Asia/Seoul 시간대 기록(1954~61년 UTC+8:30, 1948~60·1987~88 서머타임)을 Intl로 반영
 *  - 일·시 기둥: 출생지 경도로 평균 태양시 보정 (서울 126.98° → 약 -32분)
 *  - 자시: 'jojasi'(기본, 23시부터 다음 날) / 'yajasi'(23시대는 당일 일주, 시간 천간만 다음 날 기준)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./jie-table.js'), require('korean-lunar-calendar'));
  } else {
    root.SajuEngine = factory(root.SAJU_JIE, root.KoreanLunarCalendar);
  }
})(typeof self !== 'undefined' ? self : this, function (JIE_TABLE, KoreanLunarCalendar) {
  'use strict';

  var STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var STEMS_KO = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  var BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var BRANCHES_KO = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
  var ANIMALS = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
  // 오행: 0 나무, 1 불, 2 흙, 3 쇠, 4 물
  var ELEMENTS = ['wood', 'fire', 'earth', 'metal', 'water'];
  var ELEMENTS_KO = ['나무', '불', '흙', '쇠', '물'];
  var STEM_ELEMENT = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
  var BRANCH_ELEMENT = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
  var STEM_YANG = [true, false, true, false, true, false, true, false, true, false];
  var BRANCH_YANG = [true, false, true, false, true, false, true, false, true, false, true, false];

  // 12절(월이 바뀌는 절기). lunar-javascript 이름 → 월지 번호
  var JIE = [
    ['立春', 2], ['惊蛰', 3], ['清明', 4], ['立夏', 5], ['芒种', 6], ['小暑', 7],
    ['立秋', 8], ['白露', 9], ['寒露', 10], ['立冬', 11], ['大雪', 0], ['小寒', 1]
  ];
  var JIE_KO = { '立春': '입춘', '惊蛰': '경칩', '清明': '청명', '立夏': '입하', '芒种': '망종', '小暑': '소서',
    '立秋': '입추', '白露': '백로', '寒露': '한로', '立冬': '입동', '大雪': '대설', '小寒': '소한' };

  var MIN = 60000, HOUR = 3600000, DAY = 86400000;
  var SEOUL_LON = 126.98;

  function mod(a, n) { return ((a % n) + n) % n; }

  // ---------- 시간대 ----------
  var seoulFmt = null;
  function seoulParts(ms) {
    if (!seoulFmt) {
      seoulFmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Seoul', hourCycle: 'h23',
        year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'
      });
    }
    var p = {};
    seoulFmt.formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = +x.value; });
    return p;
  }
  // 그 순간 서울 벽시계가 UTC보다 몇 ms 앞서는지
  function seoulOffset(ms) {
    var p = seoulParts(ms);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000;
  }
  // 서울 벽시계 시각 → 실제 순간(UTC ms). 서머타임 겹침·건너뜀은 앞쪽 해석을 쓴다.
  function seoulWallToUtc(y, mo, d, h, mi, info) {
    var wall = Date.UTC(y, mo - 1, d, h, mi);
    // 한국이 써 온 시차(+8:30, +9, +9:30, +10) 후보 중 벽시계가 그대로 나오는 순간들
    var found = [];
    [8.5, 9, 9.5, 10].forEach(function (o) {
      var c = wall - o * HOUR;
      if (seoulOffset(c) === o * HOUR && found.indexOf(c) < 0) found.push(c);
    });
    if (info) info.ambiguous = found.length > 1;
    if (found.length) return Math.min.apply(null, found);
    // 서머타임 시작으로 건너뛴 시각: 그 전 시차로 해석
    if (info) info.skipped = true;
    return wall - seoulOffset(wall - 12 * HOUR);
  }

  // ---------- 절기 ----------
  // 절기 표(src/jie-table.js): 해마다 소한·입춘…대설 12개, UTC 초(36진수)
  var TABLE_ORDER = ['小寒', '立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪'];
  var JIE_BRANCH = {};
  JIE.forEach(function (j) { JIE_BRANCH[j[0]] = j[1]; });
  var jieRaw = JIE_TABLE.data.split(',');
  var jieCache = {};
  // 그 해(양력)의 12절 절입 순간들(UTC ms), 시간순
  function jieList(year) {
    if (jieCache[year]) return jieCache[year];
    if (year < JIE_TABLE.start || year > JIE_TABLE.end) throw new Error(JIE_TABLE.start + '~' + JIE_TABLE.end + '년 사이만 볼 수 있어요');
    var base = (year - JIE_TABLE.start) * 12;
    var out = TABLE_ORDER.map(function (n, i) {
      return { name: n, ko: JIE_KO[n], branch: JIE_BRANCH[n], ms: parseInt(jieRaw[base + i], 36) * 1000 };
    });
    jieCache[year] = out;
    return out;
  }
  function lastJieBefore(ms, year) {
    var all = [];
    [year - 1, year, year + 1].forEach(function (yy) {
      if (yy >= JIE_TABLE.start && yy <= JIE_TABLE.end) all = all.concat(jieList(yy));
    });
    var best = null, next = null;
    for (var i = 0; i < all.length; i++) {
      if (all[i].ms <= ms) { if (!best || all[i].ms > best.ms) best = all[i]; }
      else if (!next || all[i].ms < next.ms) next = all[i];
    }
    return { cur: best, next: next };
  }
  function ipchunMs(year) {
    var l = jieList(year);
    for (var i = 0; i < l.length; i++) if (l[i].name === '立春') return l[i].ms;
    return null;
  }

  // ---------- 간지 ----------
  function pillar(stem, branch, label) {
    return {
      label: label,
      stem: stem, branch: branch,
      stemHanja: STEMS[stem], stemKo: STEMS_KO[stem],
      branchHanja: BRANCHES[branch], branchKo: BRANCHES_KO[branch],
      hanja: STEMS[stem] + BRANCHES[branch], ko: STEMS_KO[stem] + BRANCHES_KO[branch],
      stemElement: ELEMENTS[STEM_ELEMENT[stem]], branchElement: ELEMENTS[BRANCH_ELEMENT[branch]]
    };
  }
  // 양력 날짜 → 일진 번호(0=甲子). 2000-01-01 = 戊午(54)
  function dayIndex(y, m, d) {
    var days = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2000, 0, 1)) / DAY);
    return mod(54 + days, 60);
  }
  function ganzhiOf(idx) { return { stem: idx % 10, branch: idx % 12 }; }

  // ---------- 음력 ----------
  function lunarToSolar(y, m, d, leap) {
    var c = new KoreanLunarCalendar();
    var ok = c.setLunarDate(y, m, d, !!leap);
    if (ok === false) return null;
    var s = c.getSolarCalendar();
    if (!s || !s.year) return null;
    return { year: s.year, month: s.month, day: s.day };
  }

  // ---------- 본 계산 ----------
  /*
   * input = {
   *   calendar: 'solar' | 'lunar', leap: bool,
   *   year, month, day,
   *   hour, minute   (시간 모르면 hour = null)
   *   longitude      (기본 서울 126.98)
   *   jasi: 'jojasi' | 'yajasi'
   *   solarCorrection: true (경도 보정 끄려면 false)
   * }
   */
  function calculate(input) {
    var notes = [];
    var y = input.year, m = input.month, d = input.day;
    if (input.calendar === 'lunar') {
      var s = lunarToSolar(y, m, d, input.leap);
      if (!s) throw new Error(input.leap ? '그해 ' + m + '월에는 윤달이 없어요. 날짜를 다시 확인해 주세요' : '음력 ' + m + '월에는 ' + d + '일이 없어요. 날짜를 다시 확인해 주세요');
      notes.push('음력 ' + y + '.' + m + '.' + d + (input.leap ? '(윤달)' : '') + ' → 양력 ' + s.year + '.' + s.month + '.' + s.day);
      y = s.year; m = s.month; d = s.day;
    }
    var hasTime = input.hour !== null && input.hour !== undefined && input.hour !== '';
    var hh = hasTime ? +input.hour : 12;
    var mi = hasTime ? +(input.minute || 0) : 0;
    var lon = input.longitude == null ? SEOUL_LON : +input.longitude;
    var jasi = input.jasi === 'yajasi' ? 'yajasi' : 'jojasi';
    var useCorr = input.solarCorrection !== false;

    var tinfo = {};
    var utc = seoulWallToUtc(y, m, d, hh, mi, tinfo);
    if (hasTime && tinfo.ambiguous) notes.push('서머타임이 끝나던 날이라 이 시각이 두 번 있었어요. 앞의 시각(서머타임)으로 계산했어요');
    if (hasTime && tinfo.skipped) notes.push('서머타임이 시작되며 시계가 건너뛴 시각이에요. 입력하신 시간을 다시 확인해 주세요');
    var offH = seoulOffset(utc) / HOUR;
    if (offH !== 9) notes.push('그때 한국 시계는 UTC+' + offH + (offH > 9 ? ' (서머타임)' : '') + ' 였어요');

    // 년주
    var sajuYear = y;
    var ip = ipchunMs(y);
    if (utc < ip) sajuYear = y - 1;
    var yIdx = mod(sajuYear - 4, 60);
    var yp = ganzhiOf(yIdx);

    // 월주
    var lj = lastJieBefore(utc, y);
    var mBranch = lj.cur.branch;
    var monthNo = mod(mBranch - 2, 12); // 寅월 = 0
    var mStem = mod((yp.stem % 5) * 2 + 2 + monthNo, 10);

    // 일주·시주 (평균 태양시)
    var solarMs = utc + (useCorr ? lon / 15 * HOUR : 9 * HOUR);
    var sd = new Date(solarMs);
    var sy = sd.getUTCFullYear(), sm = sd.getUTCMonth() + 1, sdd = sd.getUTCDate();
    var sh = sd.getUTCHours(), smi = sd.getUTCMinutes();
    var dIdx, hourP = null;
    if (hasTime) {
      dIdx = dayIndex(sy, sm, sdd);
      var late = sh === 23;
      if (late && jasi === 'jojasi') dIdx = mod(dIdx + 1, 60);
      var hBranch = Math.floor((sh + 1) / 2) % 12;
      var stemBase = ganzhiOf(late && jasi === 'yajasi' ? mod(dIdx + 1, 60) : dIdx).stem;
      var hStem = mod((stemBase % 5) * 2 + hBranch, 10);
      hourP = pillar(hStem, hBranch, '시');
      if (useCorr) notes.push('태어난 곳 기준 태양 시각 ' + pad(sh) + ':' + pad(smi) + ' 로 시주를 정했어요');
    } else {
      dIdx = dayIndex(y, m, d);
      notes.push('태어난 시간을 몰라서 시주는 비워 두었어요');
    }
    var dp = ganzhiOf(dIdx);

    var pillars = {
      year: pillar(yp.stem, yp.branch, '년'),
      month: pillar(mStem, mBranch, '월'),
      day: pillar(dp.stem, dp.branch, '일'),
      hour: hourP
    };

    // 절기 경계 근처 알림 (2시간 이내)
    if (Math.abs(utc - lj.cur.ms) < 2 * HOUR || (lj.next && Math.abs(lj.next.ms - utc) < 2 * HOUR)) {
      notes.push('절기가 바뀌는 시각 근처에 태어났어요. 태어난 시간이 정확한지 확인해 주세요');
    }

    // 오행 개수
    var counts = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    ['year', 'month', 'day', 'hour'].forEach(function (k) {
      var p = pillars[k];
      if (!p) return;
      counts[p.stemElement]++;
      counts[p.branchElement]++;
    });

    return {
      input: { solarYear: y, solarMonth: m, solarDay: d, hour: hasTime ? hh : null, minute: hasTime ? mi : null, longitude: lon, jasi: jasi },
      pillars: pillars,
      dayMaster: {
        stem: dp.stem, hanja: STEMS[dp.stem], ko: STEMS_KO[dp.stem],
        element: ELEMENTS[STEM_ELEMENT[dp.stem]], elementKo: ELEMENTS_KO[STEM_ELEMENT[dp.stem]], yang: STEM_YANG[dp.stem]
      },
      animal: ANIMALS[yp.branch],
      elements: counts,
      monthTerm: { name: lj.cur.ko, at: lj.cur.ms },
      utc: utc, sajuYear: sajuYear, hasTime: hasTime,
      notes: notes
    };
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // 오늘(또는 지정일)의 일진
  function dayPillarOf(y, m, d) { var g = ganzhiOf(dayIndex(y, m, d)); return pillar(g.stem, g.branch, '오늘'); }

  return {
    calculate: calculate,
    dayPillarOf: dayPillarOf,
    lunarToSolar: lunarToSolar,
    seoulWallToUtc: seoulWallToUtc,
    jieList: jieList,
    constants: {
      STEMS: STEMS, STEMS_KO: STEMS_KO, BRANCHES: BRANCHES, BRANCHES_KO: BRANCHES_KO,
      ELEMENTS: ELEMENTS, ELEMENTS_KO: ELEMENTS_KO, STEM_ELEMENT: STEM_ELEMENT, BRANCH_ELEMENT: BRANCH_ELEMENT,
      STEM_YANG: STEM_YANG, BRANCH_YANG: BRANCH_YANG
    }
  };
});
