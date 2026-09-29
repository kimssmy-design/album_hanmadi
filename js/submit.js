// ===== 입력 폼, 제출, 덮어쓰기 확인 =====

(function () {
  var $ = function (id) { return document.getElementById(id); };
  var idInput = $('sid'), nameInput = $('sname'), msgInput = $('smsg');
  var btn = $('submitBtn');
  var pending = null; // 덮어쓰기 확인 대기 중인 제출값

  // GAS URL 미설정 경고 (선생님 확인용)
  if (!isGasUrlSet()) {
    $('setupWarn').hidden = false;
  }

  // 글자 수 카운터 (공백 정리 후 기준)
  function updateCounter() {
    var len = cleanText(msgInput.value).length;
    var el = $('msgCount');
    el.textContent = len + ' / ' + APP_CONFIG.MSG_MAX;
    el.classList.toggle('over', len > APP_CONFIG.MSG_MAX);
  }
  msgInput.setAttribute('maxlength', String(APP_CONFIG.MSG_MAX + 5));
  msgInput.addEventListener('input', function () { updateCounter(); setError('msg', ''); });
  idInput.addEventListener('input', function () {
    idInput.value = idInput.value.replace(/\D/g, '').slice(0, 4);
    setError('id', '');
  });
  nameInput.addEventListener('input', function () { setError('name', ''); });
  updateCounter();

  function setError(field, text) {
    var map = { id: 'idErr', name: 'idErr', msg: 'msgErr', server: 'serverErr' };
    $(map[field]).textContent = text;
  }

  // 로딩 표시
  var tick = null;
  function startLoading() {
    btn.disabled = true;
    btn.textContent = '제출하는 중...';
    $('progWrap').hidden = false;
    var steps = [['30%', '연결하는 중'], ['65%', '저장하는 중'], ['85%', '거의 다 됐어요']];
    var i = 0;
    $('progFill').style.width = '10%';
    tick = setInterval(function () {
      if (i >= steps.length) { clearInterval(tick); return; }
      $('progFill').style.width = steps[i][0];
      $('progLabel').textContent = steps[i][1] + '...';
      i++;
    }, 700);
  }
  function stopLoading() {
    clearInterval(tick);
    $('progWrap').hidden = true;
    $('progLabel').textContent = '';
    btn.disabled = false;
    btn.textContent = '제출하기';
  }

  async function send(data, overwrite) {
    startLoading();
    setError('server', '');
    try {
      var res = await gas('submit', {
        id: data.id, name: data.name, msg: data.msg, overwrite: overwrite
      });
      stopLoading();

      if (res.ok) {
        showStatus(res);
      } else if (res.code === 'exists') {
        openConfirm(data, res.prev);
      } else {
        setError('server', res.msg || '제출에 실패했어요. 다시 시도해 주세요.');
      }
    } catch (e) {
      stopLoading();
      setError('server', '인터넷 연결을 확인하고 다시 제출해 주세요.');
    }
  }

  btn.addEventListener('click', function () {
    if (!isGasUrlSet()) {
      setError('server', '아직 준비 중이에요. 선생님께 알려 주세요.');
      return;
    }
    var v = validateForm(idInput.value, nameInput.value, msgInput.value);
    if (!v.ok) { setError(v.field, v.error); return; }
    send(v, false);
  });

  // ===== 덮어쓰기 확인 창 =====
  function openConfirm(data, prev) {
    pending = data;
    $('prevMsg').textContent = '“' + prev + '”';
    $('newMsg').textContent = '“' + data.msg + '”';
    $('confirmModal').hidden = false;
  }
  function closeConfirm() {
    $('confirmModal').hidden = true;
    pending = null;
  }
  $('cancelBtn').addEventListener('click', closeConfirm);
  $('overwriteBtn').addEventListener('click', function () {
    var data = pending;
    closeConfirm();
    if (data) send(data, true);
  });

  // 처음으로 (다른 학생이 같은 기기로 제출할 때)
  $('againBtn').addEventListener('click', function () {
    idInput.value = '';
    nameInput.value = '';
    msgInput.value = '';
    updateCounter();
    $('statusScreen').hidden = true;
    $('formScreen').hidden = false;
  });
})();
