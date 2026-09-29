// ===== 설정 파일 =====
// GAS 배포 후 받은 웹앱 URL로 반드시 교체하세요. (끝이 /exec 로 끝나야 함)
var APP_CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbxDIJGXxXlN8Iz2-YPa9qfGqnjDESz73KR-t6OHYUKKdnaNYxgEsj4hqyZAe2wrKEEi/exec',

  MSG_MAX: 30,   // 한마디 최대 글자 수
  MSG_MIN: 1,    // 한마디 최소 글자 수 (공백 제외 후 기준)

  // 반별 학번 범위와 제외 학번 (Code.gs의 CLASSES와 반드시 같게 유지)
  CLASSES: [
    { name: '3-1', start: 3101, end: 3126, exclude: [3108] },
    { name: '3-2', start: 3201, end: 3226, exclude: [3208, 3226] },
    { name: '3-3', start: 3301, end: 3325, exclude: [] },
    { name: '3-4', start: 3401, end: 3426, exclude: [3426] }
  ]
};
