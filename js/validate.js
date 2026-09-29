// ===== 입력값 정리 및 검증 =====

// 공백만 있는 입력 방지: 보이지 않는 문자 제거 → 연속 공백 1칸으로 → 앞뒤 공백 제거
// (\s 에는 일반 스페이스, 탭, 줄바꿈, 전각 스페이스(U+3000) 모두 포함)
function cleanText(s) {
  return String(s == null ? '' : s)
    .replace(/[\u200B-\u200D\u2060\uFEFF\u3164\u115F\u1160]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// 학번 → 반 정보. 대상이 아니면 null
function findClass(id) {
  var n = Number(id);
  var list = APP_CONFIG.CLASSES;
  for (var i = 0; i < list.length; i++) {
    var c = list[i];
    if (n >= c.start && n <= c.end && c.exclude.indexOf(n) === -1) return c;
  }
  return null;
}

// 폼 전체 검증. 통과하면 정리된 값을 돌려줌
function validateForm(rawId, rawName, rawMsg) {
  var id = cleanText(rawId);
  var name = cleanText(rawName);
  var msg = cleanText(rawMsg);

  if (!/^\d{4}$/.test(id)) {
    return { ok: false, field: 'id', error: '학번 4자리를 입력해 주세요.' };
  }
  if (!findClass(id)) {
    return { ok: false, field: 'id', error: '제출 대상 학번이 아니에요. 선생님께 확인해 주세요.' };
  }
  if (name.length < 1) {
    return { ok: false, field: 'name', error: '이름을 입력해 주세요.' };
  }
  if (name.length > 20) {
    return { ok: false, field: 'name', error: '이름이 너무 길어요.' };
  }
  if (msg.length < APP_CONFIG.MSG_MIN) {
    return { ok: false, field: 'msg', error: '한마디를 적어 주세요. (공백만으로는 제출할 수 없어요)' };
  }
  if (msg.length > APP_CONFIG.MSG_MAX) {
    return { ok: false, field: 'msg', error: '한마디는 ' + APP_CONFIG.MSG_MAX + '자 이내로 적어 주세요.' };
  }
  return { ok: true, id: id, name: name, msg: msg };
}
