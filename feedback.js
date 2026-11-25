/*
 * 별빛 사주 — 의견 받기 (v0.18.0)
 * 1) 풀이마다 👍 잘 맞아요 / 👎 잘 안 맞아요  2) 이상한 점·좋은 점 적어 보내기
 * 보낸 내용은 운영자만 보는 구글 설문지(별빛 사주 의견)에 쌓인다. 다른 사람에게는 보이지 않는다.
 * 이름·생일 같은 입력값은 자동으로 붙이지 않는다. 보내는 것: 화면 종류, 평가, 적은 글, 판 번호.
 * 공개 주소(saju.krangr.com)에서만 실제로 보낸다. 시험할 때는 window.__FB_LOG 에 쌓기만 한다.
 */
(function () {
  var VER = '0.18.0';
  var FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSfpXTJH3JxV9tuXySKSVfvZFmGfjv2Tea2B2eBkmpVpIJpJwQ/formResponse';
  var F = { screen: 'entry.1541733126', vote: 'entry.237308749', text: 'entry.603552117', ver: 'entry.651704149' };
  var on = location.hostname === 'saju.krangr.com';
  var NAME = { saju: '사주 결과', deep: '깊은 감정서', ny: '2027 신년운세', td: '오늘의 운세', mt: '연애 궁합', sk: '속궁합', wk: '일 궁합', home: '첫 화면' };
  var DAY_MAX = 8; // 하루에 보낼 수 있는 횟수 (장난 도배 막기)

  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function countToday() {
    try { var o = JSON.parse(localStorage.getItem('byeolbit-saju-fb') || '{}'); return o.d === today() ? o.n : 0; } catch (e) { return 0; }
  }
  function addCount() {
    try { localStorage.setItem('byeolbit-saju-fb', JSON.stringify({ d: today(), n: countToday() + 1 })); } catch (e) { }
  }
  function send(screen, vote, text) {
    if (countToday() >= DAY_MAX) return false;
    addCount();
    var body = new URLSearchParams();
    body.append(F.screen, NAME[screen] || screen);
    body.append(F.vote, vote || '');
    body.append(F.text, text || '');
    body.append(F.ver, VER);
    if (on) { try { fetch(FORM, { method: 'POST', mode: 'no-cors', body: body }); } catch (e) { } }
    else if (window.__FB_LOG) window.__FB_LOG.push(body.toString());
    return true;
  }
  function sfx(k) { try { if (window.__sfx) window.__sfx(k); } catch (e) { } }
  function track(n, p) { try { if (window.track) window.track(n, p); } catch (e) { } }

  function html(votes) {
    return (votes
      ? '<p class="card-k">✦ 별빛에게 한마디</p><h3>이 풀이, 나와 잘 맞았나요?</h3>' +
        '<div class="fb-votes"><button type="button" class="fb-v" data-v="up">👍 잘 맞아요</button><button type="button" class="fb-v" data-v="down">👎 잘 안 맞아요</button></div>' +
        '<p class="fb-thx" hidden>고마워요! 더 잘 맞는 풀이를 만드는 데 쓸게요.</p>' +
        '<button class="fb-open" type="button">✎ 이상한 점 · 좋은 점 적어 보내기</button>'
      : '<p class="card-k">✦ 별빛에게 한마디</p><h3>이상한 점 · 좋은 점 보내기</h3>') +
      '<div class="fb-box"' + (votes ? ' hidden' : '') + '>' +
      '<div class="fb-kind" role="group" aria-label="의견 종류"><button type="button" data-k="이상한 점" class="on">이상한 점</button><button type="button" data-k="좋은 점">좋은 점</button><button type="button" data-k="바라는 것">바라는 것</button></div>' +
      '<textarea maxlength="500" rows="4" placeholder="예) 3월 설명이 앞뒤가 안 맞아요 / 데이트 장소 풀이가 재밌어요"></textarea>' +
      '<p class="fb-warn">이름·생일·연락처는 적지 말아 주세요.</p>' +
      '<button class="btn-main fb-send" type="button">보내기</button>' +
      '<p class="fb-msg" role="status"></p></div>';
  }

  function wire(el, getScreen) {
    var box = el.querySelector('.fb-box'), ta = el.querySelector('textarea'), msg = el.querySelector('.fb-msg');
    var kind = '이상한 점', voted = '';
    el.querySelectorAll('.fb-v').forEach(function (b) {
      b.addEventListener('click', function () {
        if (voted) return;
        voted = b.dataset.v === 'up' ? '👍 잘 맞아요' : '👎 잘 안 맞아요';
        el.querySelectorAll('.fb-v').forEach(function (x) { x.disabled = true; x.classList.toggle('pick', x === b); });
        el.querySelector('.fb-thx').hidden = false;
        b.classList.add('burst'); sfx('pop');
        send(getScreen(), voted, '');
        track('feedback_vote', { screen: getScreen(), vote: b.dataset.v });
        if (b.dataset.v === 'down' && box.hidden) { box.hidden = false; kind = '이상한 점'; }
      });
    });
    var op = el.querySelector('.fb-open');
    if (op) op.addEventListener('click', function () { box.hidden = !box.hidden; if (!box.hidden) ta.focus(); });
    el.querySelectorAll('.fb-kind button').forEach(function (b) {
      b.addEventListener('click', function () {
        kind = b.dataset.k;
        el.querySelectorAll('.fb-kind button').forEach(function (x) { x.classList.toggle('on', x === b); });
      });
    });
    el.querySelector('.fb-send').addEventListener('click', function () {
      var t = ta.value.trim();
      if (t.length < 2) { msg.textContent = '한두 마디만 적어 주세요.'; msg.className = 'fb-msg err'; ta.focus(); return; }
      if (!send(getScreen(), voted || kind, '[' + kind + '] ' + t)) { msg.textContent = '오늘은 충분히 받았어요. 내일 또 들려주세요.'; msg.className = 'fb-msg err'; return; }
      track('feedback_send', { screen: getScreen(), kind: kind });
      ta.value = ''; msg.textContent = '잘 받았어요. 고마워요! ✦'; msg.className = 'fb-msg ok'; sfx('open');
      if (el.classList.contains('fb-pop')) setTimeout(function () { var m = document.getElementById('fbModal'); if (m) m.hidden = true; }, 1400);
    });
    el._reset = function () {
      voted = ''; kind = '이상한 점'; ta.value = ''; msg.textContent = ''; msg.className = 'fb-msg';
      el.querySelectorAll('.fb-v').forEach(function (x) { x.disabled = false; x.classList.remove('pick', 'burst'); });
      var th = el.querySelector('.fb-thx'); if (th) th.hidden = true;
      if (op) box.hidden = true;
      el.querySelectorAll('.fb-kind button').forEach(function (x, i) { x.classList.toggle('on', i === 0); });
    };
  }

  var cur = { r: 'saju', rp: 'deep' };
  function make(id, beforeId, screenKey) {
    var before = document.getElementById(beforeId);
    if (!before) return null;
    var el = document.createElement('article');
    el.className = 'glass card fb'; el.id = id; el.innerHTML = html(true);
    before.parentNode.insertBefore(el, before);
    wire(el, function () { return cur[screenKey]; });
    return el;
  }

  function init() {
    var a = make('rFeedback', 'rDonate', 'r');
    var b = make('rpFeedback', 'rpDonate', 'rp');
    // 맨 아래 '의견 보내기' 창 (어느 화면에서나)
    var modal = document.createElement('div');
    modal.className = 'modal'; modal.id = 'fbModal'; modal.hidden = true;
    modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', '의견 보내기');
    modal.innerHTML = '<div class="modal-box"><article class="glass card fb fb-pop"><button class="pop-x" type="button" aria-label="닫기">✕</button>' + html(false) + '</article></div>';
    document.body.appendChild(modal);
    var mc = modal.querySelector('.fb-pop');
    var where = function () {
      if (!document.getElementById('viewReport').hidden) return cur.rp;
      if (!document.getElementById('viewResult').hidden) return cur.r;
      return 'home';
    };
    wire(mc, where);
    var close = function () { modal.hidden = true; };
    modal.querySelector('.pop-x').addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) close(); });
    var copy = document.querySelector('.foot .copy');
    if (copy) {
      var lk = document.createElement('a'); lk.href = '#'; lk.id = 'fbLink'; lk.textContent = '의견 보내기';
      lk.addEventListener('click', function (e) { e.preventDefault(); mc._reset(); modal.hidden = false; track('feedback_open'); setTimeout(function () { mc.querySelector('textarea').focus(); }, 50); });
      copy.insertBefore(document.createTextNode(' · '), copy.firstChild);
      copy.insertBefore(lk, copy.firstChild);
    }
    window.Feedback = {
      result: function () { cur.r = 'saju'; if (a) a._reset(); },
      report: function (mode) { cur.rp = mode || 'deep'; if (b) b._reset(); }
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
