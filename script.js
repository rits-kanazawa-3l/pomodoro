// テーマ切り替え
function changeTheme() {
  const theme = document.getElementById('themeSelect').value;
  document.body.className = '';
  document.body.classList.add('theme-' + theme);
  // ラベル色はCSSで制御
}

// 初期テーマ適用
window.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('themeSelect');
  if (select) select.value = 'modern';
  changeTheme();
});
// ログをテキストファイルで保存
function saveLog() {
  const log = document.getElementById("logArea").value;
  const blob = new Blob([log], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pomodoro_log_${getNowForFilename()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ファイル名用の日時文字列（YYYYMMDD_HHMM）
function getNowForFilename() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${y}${m}${d}_${hh}${mm}`;
}
// ページ読み込み時に通知許可をリクエスト
window.addEventListener('DOMContentLoaded', () => {
  if ("Notification" in window) {
    Notification.requestPermission();
  }
});

let isRunning = false;
let isWorkTime = true;
let timeLeft = 25 * 60;
let timerInterval;
let lastEventTime = null; // 前回イベント時刻

function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerElem = document.getElementById("timer");
  timerElem.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const modeElem = document.getElementById("mode");
  if (!isRunning) {
    modeElem.textContent = isWorkTime ? "作業開始前" : "休憩開始前";
  } else {
    modeElem.textContent = isWorkTime ? "作業中" : "休憩中";
  }
  modeElem.className = isWorkTime ? "work" : "break";

  // 残り1分未満で焦り演出
  if (timeLeft > 0 && timeLeft < 60) {
    timerElem.classList.add("hurry-up");
  } else {
    timerElem.classList.remove("hurry-up");
  }
}

function logAction(action) {
  const now = new Date();
  // 秒なしのタイムスタンプ（YYYY/MM/DD HH:MM）
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const timestamp = `${y}/${m}/${d} ${hh}:${mm}`;
  const logArea = document.getElementById("logArea");
  let diffText = "";
  if (lastEventTime) {
    const diffMs = now - lastEventTime;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin > 0) {
      if (diffMin < 60) {
        diffText = `（前回から${diffMin}分経過）`;
      } else {
        const diffHr = Math.floor(diffMin / 60);
        const remainMin = diffMin % 60;
        diffText = `（前回から${diffHr}時間${remainMin}分経過）`;
      }
    }
  }
  logArea.value += `${timestamp} - ${action}${diffText}\n`;
  lastEventTime = now;
}

function internalResetTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  isWorkTime = true;
  const workDuration = parseFloat(document.getElementById("workDuration").value) || 25;
  timeLeft = Math.round(workDuration * 60);
  updateDisplay();
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  updateDisplay();
  logAction(isWorkTime ? "作業スタート" : "休憩スタート");

  timerInterval = setInterval(() => {
    timeLeft--;
    updateDisplay();
    if (timeLeft < 0) {
      clearInterval(timerInterval);
      isRunning = false;

      // 通知表示
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(isWorkTime ? "休憩時間です！" : "作業時間です！");
      } else {
        // 通知が使えない場合はアラート
        alert(isWorkTime ? "休憩時間です！" : "作業時間です！");
      }

      // 状態切り替え
      isWorkTime = !isWorkTime;

      // 次の時間を設定
      const workDuration = parseFloat(document.getElementById("workDuration").value) || 25;
      const breakDuration = parseFloat(document.getElementById("breakDuration").value) || 5;
      timeLeft = Math.round(isWorkTime ? workDuration * 60 : breakDuration * 60);

      updateDisplay();

      //startTimer(); // 自動で次のセッション開始（スタートは手動にしたい場合はコメントアウトする）
    }
  }, 1000);
}

function changeTimer() {
  //internalResetTimer();
  const workDuration = parseFloat(document.getElementById("workDuration").value) || 25;
  const breakDuration = parseFloat(document.getElementById("breakDuration").value) || 5;
  timeLeft = Math.round(isWorkTime ? workDuration * 60 : breakDuration * 60);
}

function resetTimer() {
  internalResetTimer();
  logAction("リセット");
}

updateDisplay();
