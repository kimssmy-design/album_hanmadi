// ===== GAS 통신 =====

function isGasUrlSet() {
  return /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(APP_CONFIG.GAS_URL);
}

// 네트워크 오류일 때만 최대 3회 재시도
async function gas(action, data, retries) {
  retries = retries || 3;
  var url = APP_CONFIG.GAS_URL + '?action=' + encodeURIComponent(action);
  for (var i = 1; i <= retries; i++) {
    try {
      var res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data || {})
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      if (i === retries) throw e;
      await new Promise(function (r) { setTimeout(r, i * 1000); });
    }
  }
}

// 페이지 열릴 때 GAS 깨워두기 (첫 제출 지연 줄이기)
(function warmup() {
  if (!isGasUrlSet()) return;
  fetch(APP_CONFIG.GAS_URL, { method: 'GET' }).catch(function () {});
})();
