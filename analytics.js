/*
 * 별빛 사주 — 방문 통계 (구글 애널리틱스)
 * 이름·생일·태어난 곳 같은 입력 내용은 절대 보내지 않는다. "무엇을 눌렀는지" 횟수만 센다.
 * 공개 주소(saju.krangr.com)에서만 켜진다. 내 컴퓨터에서 시험할 때는 보내지 않는다.
 */
(function () {
  var GA_ID = 'G-LYRKTQX43Q'; // 측정 ID. 비어 있으면 아무것도 보내지 않는다.
  var on = !!GA_ID && location.hostname === 'saju.krangr.com';
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.track = function (name, params) {
    try {
      if (on) window.gtag('event', name, params || {});
      else if (window.__TRACK_LOG) window.__TRACK_LOG.push([name, params || {}]);
    } catch (e) { }
  };
  if (!on) return;
  var s = document.createElement('script');
  s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
})();
