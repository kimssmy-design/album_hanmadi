// ===== 졸업앨범 한마디 - GAS 백엔드 =====
// 시트는 비워 두면 '제출데이터' 탭과 헤더가 자동으로 만들어집니다.

var SHEET_NAME = '제출데이터';
var MSG_MAX = 30;

// 반별 학번 범위와 제외 학번 (js/config.js 의 CLASSES와 반드시 같게 유지)
var CLASSES = [
  { name: '3-1', start: 3101, end: 3126, exclude: [3108] },
  { name: '3-2', start: 3201, end: 3226, exclude: [3208, 3226] },
  { name: '3-3', start: 3301, end: 3325, exclude: [] },
  { name: '3-4', start: 3401, end: 3426, exclude: [3426] }
];

var HEADER = ['학번', '반', '번호', '이름', '한마디', '최초제출', '최종수정', '수정횟수'];
// 열 번호(0부터): 0 학번, 1 반, 2 번호, 3 이름, 4 한마디, 5 최초제출, 6 최종수정, 7 수정횟수

function doGet(e) {
  return jsonOut({ ok: true, msg: 'running' });
}

function doPost(e) {
  var params = {};
  try { params = JSON.parse(e.postData.contents); } catch (err) {}
  var action = (e.parameter && e.parameter.action) || '';
  var result;
  try {
    if (action === 'submit') result = handleSubmit(params);
    else result = { ok: false, msg: '알 수 없는 요청이에요.' };
  } catch (err) {
    result = { ok: false, msg: '서버 오류: ' + err.message };
  }
  return jsonOut(result);
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------- 유틸 ----------
function cleanText(s) {
  return String(s == null ? '' : s)
    .replace(/[\u200B-\u200D\u2060\uFEFF\u3164\u115F\u1160]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function findClass(id) {
  var n = Number(id);
  for (var i = 0; i < CLASSES.length; i++) {
    var c = CLASSES[i];
    if (n >= c.start && n <= c.end && c.exclude.indexOf(n) === -1) return c;
  }
  return null;
}

function nowStr() {
  return Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER);
    sheet.setFrozenRows(1);
    // 학번/이름/한마디 열을 텍스트 서식으로 (= 로 시작하는 문구가 수식으로 바뀌는 것 방지)
    sheet.getRange('A:A').setNumberFormat('@');
    sheet.getRange('D:E').setNumberFormat('@');
  }
  return sheet;
}

// ---------- 반별 현황 ----------
function buildStatus(rows) {
  var submitted = {};
  for (var i = 1; i < rows.length; i++) {
    submitted[String(rows[i][0]).trim()] = true;
  }
  var out = [];
  for (var k = 0; k < CLASSES.length; k++) {
    var c = CLASSES[k];
    var total = 0;
    var missing = [];
    for (var n = c.start; n <= c.end; n++) {
      if (c.exclude.indexOf(n) !== -1) continue;
      total++;
      if (!submitted[String(n)]) missing.push(n % 100);
    }
    out.push({ name: c.name, total: total, done: total - missing.length, missing: missing });
  }
  return out;
}

// ---------- 제출 ----------
function handleSubmit(params) {
  var id = cleanText(params.id);
  var name = cleanText(params.name);
  var msg = cleanText(params.msg);
  var overwrite = params.overwrite === true;

  // 서버에서도 한 번 더 검증 (공백만 있는 문구 차단)
  if (!/^\d{4}$/.test(id)) return { ok: false, msg: '학번 4자리를 입력해 주세요.' };
  var cls = findClass(id);
  if (!cls) return { ok: false, msg: '제출 대상 학번이 아니에요. 선생님께 확인해 주세요.' };
  if (name.length < 1 || name.length > 20) return { ok: false, msg: '이름을 확인해 주세요.' };
  if (msg.length < 1) return { ok: false, msg: '한마디를 적어 주세요.' };
  if (msg.length > MSG_MAX) return { ok: false, msg: '한마디는 ' + MSG_MAX + '자 이내로 적어 주세요.' };

  var lock = LockService.getScriptLock();
  try { lock.waitLock(15000); }
  catch (e) { return { ok: false, msg: '지금 제출하는 친구들이 많아요. 잠시 후 다시 눌러 주세요.' }; }

  try {
    var sheet = getSheet();
    var rows = sheet.getDataRange().getValues();

    var rowIdx = -1;
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === id) { rowIdx = i; break; }
    }

    var overwritten = false;

    if (rowIdx === -1) {
      // 신규 제출
      var t = nowStr();
      var newRow = [id, cls.name, String(Number(id) % 100), name, msg, t, t, 0];
      var r = sheet.getLastRow() + 1;
      sheet.getRange(r, 1, 1, 8).setNumberFormat('@').setValues([newRow]);
      rows.push(newRow);
    } else {
      var oldName = cleanText(rows[rowIdx][3]);
      var oldMsg = cleanText(rows[rowIdx][4]);

      // 다른 사람이 남의 학번으로 덮어쓰는 것 방지
      if (oldName.replace(/ /g, '') !== name.replace(/ /g, '')) {
        return { ok: false, msg: '이 학번은 다른 이름으로 이미 제출되어 있어요. 선생님께 확인해 주세요.' };
      }

      if (oldMsg === msg) {
        // 같은 내용 재제출 (재시도 등) → 그대로 완료 처리
      } else if (!overwrite) {
        return { ok: false, code: 'exists', prev: oldMsg };
      } else {
        var cnt = Number(rows[rowIdx][7]) || 0;
        var sr = rowIdx + 1;
        sheet.getRange(sr, 4, 1, 2).setNumberFormat('@').setValues([[name, msg]]);
        sheet.getRange(sr, 7, 1, 2).setValues([[nowStr(), cnt + 1]]);
        overwritten = true;
      }
    }

    SpreadsheetApp.flush();
    return {
      ok: true,
      mine: { id: id, name: name, msg: msg, overwritten: overwritten },
      status: buildStatus(rows)
    };
  } finally {
    lock.releaseLock();
  }
}

// ---------- 편집기에서 테스트용 (실행 후 시트에 생긴 테스트 행은 지워 주세요) ----------
function testSubmit() {
  Logger.log(JSON.stringify(handleSubmit({ id: '3101', name: '테스트', msg: '안녕', overwrite: false })));
}
function testOverwrite() {
  Logger.log(JSON.stringify(handleSubmit({ id: '3101', name: '테스트', msg: '바꾼 문구', overwrite: false })));
  Logger.log(JSON.stringify(handleSubmit({ id: '3101', name: '테스트', msg: '바꾼 문구', overwrite: true })));
}
