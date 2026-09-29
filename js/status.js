// ===== 제출 완료 + 반별 현황 화면 =====

// res: { mine: {id, name, msg, overwritten}, status: [{name,total,done,missing:[번호]}] }
function showStatus(res) {
  document.getElementById('formScreen').hidden = true;
  document.getElementById('statusScreen').hidden = false;

  var mine = res.mine || {};
  document.getElementById('doneTitle').textContent =
    mine.overwritten ? '한마디를 수정했어요' : '제출 완료!';
  document.getElementById('doneWho').textContent = mine.id + ' ' + mine.name;
  document.getElementById('doneMsg').textContent = '“' + mine.msg + '”';

  var grid = document.getElementById('statusGrid');
  grid.innerHTML = '';
  (res.status || []).forEach(function (c) {
    var card = document.createElement('div');
    card.className = 'class-card' + (c.missing.length === 0 ? ' full' : '');

    var title = document.createElement('p');
    title.className = 'class-name';
    title.textContent = c.name + '반';

    var count = document.createElement('p');
    count.className = 'class-count';
    count.textContent = c.done + ' / ' + c.total + '명 제출';

    var miss = document.createElement('p');
    miss.className = c.missing.length === 0 ? 'class-full' : 'class-miss';
    miss.textContent = c.missing.length === 0
      ? '전원 제출'
      : '미제출: ' + c.missing.map(function (n) { return n + '번'; }).join(', ');

    card.appendChild(title);
    card.appendChild(count);
    card.appendChild(miss);
    grid.appendChild(card);
  });

  window.scrollTo(0, 0);
}
