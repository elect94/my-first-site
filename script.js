// 나의 첫 웹사이트 - 동작(JavaScript) 파일
// index.html의 </body> 바로 위에서 <script src="script.js"></script>로 불러와요

// ===== 글로우 효과: 버튼과 프로필이 마우스에 끌려오고, 클릭하면 물결이 퍼지게 =====
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
// 버튼과 프로필 사진에 같은 효과 적용
document.querySelectorAll('.glow-btn, .glow-avatar').forEach(function (btn) {
  // 마우스 쪽으로 끌려가는 최대 거리(px). data-strength가 있으면 그 값 사용
  const strength = Number(btn.dataset.strength) || 8;

  // 마우스가 버튼 위에서 움직일 때
  btn.addEventListener('pointermove', function (event) {
    const box = btn.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;   // 0 ~ 1
    const y = (event.clientY - box.top) / box.height;   // 0 ~ 1

    // 하이라이트 위치
    btn.style.setProperty('--mx', (x * 100) + '%');
    btn.style.setProperty('--my', (y * 100) + '%');

    // 마우스 쪽으로 끌려가기
    if (!reduceMotion.matches) {
      btn.style.transform = 'translate(' + (x - 0.5) * strength + 'px, ' + (y - 0.5) * strength + 'px)';
    }
  });

  // 마우스가 버튼을 떠나면 제자리로
  btn.addEventListener('pointerleave', function () {
    btn.style.transform = '';
  });

  // 클릭하면 물결 효과
  btn.addEventListener('click', function (event) {
    const inner = btn.querySelector('.glow-inner');
    if (reduceMotion.matches || !inner) return;  // 프로필 사진엔 물결 없음
    const box = inner.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'glow-ripple';
    ripple.setAttribute('aria-hidden', 'true');
    // 키보드(Enter)로 누르면 좌표가 없으니 가운데에서 퍼지게
    const fromPointer = event.clientX !== 0 || event.clientY !== 0;
    ripple.style.left = (fromPointer ? event.clientX - box.left : box.width / 2) + 'px';
    ripple.style.top = (fromPointer ? event.clientY - box.top : box.height / 2) + 'px';
    inner.appendChild(ripple);
    setTimeout(function () { ripple.remove(); }, 700);
  });
});

// ===== 배경음악 =====
const bgm = document.getElementById('bgm');
const musicToggle = document.getElementById('music-toggle');
let userPaused = false;   // 사용자가 직접 끈 경우 다시 켜지 않기
bgm.volume = 0.4;         // 소리 크기 (0 ~ 1)

// 버튼 모양을 음악 상태에 맞추기
function updateMusicButton() {
  const playing = !bgm.paused;
  musicToggle.classList.toggle('is-playing', playing);
  musicToggle.setAttribute('aria-pressed', playing);
  musicToggle.setAttribute('aria-label', playing ? '배경음악 끄기' : '배경음악 켜기');
}
bgm.addEventListener('play', updateMusicButton);
bgm.addEventListener('pause', updateMusicButton);

// 버튼을 누르면 켜기/끄기
musicToggle.addEventListener('click', function () {
  if (bgm.paused) {
    userPaused = false;
    bgm.play();
  } else {
    userPaused = true;
    bgm.pause();
  }
});

// 브라우저는 소리 자동재생을 막는 경우가 많아요.
// 막히면, 방문자가 페이지를 처음 클릭하거나 키를 누를 때 재생을 시작해요.
// ===== 미니 플레이어 =====
const player = document.querySelector('.player');
const playBtn = document.getElementById('player-play');
const stopBtn = document.getElementById('player-stop');
const muteBtn = document.getElementById('player-mute');
const seek = document.getElementById('player-seek');
const currentText = document.getElementById('player-current');
const durationText = document.getElementById('player-duration');

// 초를 "1:05" 같은 모양으로 바꾸기
function formatTime(seconds) {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m + ':' + String(s).padStart(2, '0');
}

// 재생/일시정지 상태에 맞게 플레이어 모양 바꾸기
function updatePlayer() {
  const playing = !bgm.paused;
  player.classList.toggle('is-playing', playing);
  playBtn.setAttribute('aria-label', playing ? '일시정지' : '재생');
}
bgm.addEventListener('play', updatePlayer);
bgm.addEventListener('pause', updatePlayer);

// ▶ / ❚❚ 버튼
playBtn.addEventListener('click', function () {
  if (bgm.paused) {
    userPaused = false;
    bgm.play();
  } else {
    userPaused = true;
    bgm.pause();
  }
});

// ■ 끄기 버튼: 멈추고 처음으로
stopBtn.addEventListener('click', function () {
  userPaused = true;
  bgm.pause();
  bgm.currentTime = 0;
});

// 🔊 소리 켜기/끄기 버튼
muteBtn.addEventListener('click', function () {
  bgm.muted = !bgm.muted;
});
bgm.addEventListener('volumechange', function () {
  player.classList.toggle('is-muted', bgm.muted);
  muteBtn.setAttribute('aria-pressed', bgm.muted);
  muteBtn.setAttribute('aria-label', bgm.muted ? '소리 켜기' : '소리 끄기');
});

// 재생 위치 막대와 시간 표시
bgm.addEventListener('loadedmetadata', function () {
  durationText.textContent = formatTime(bgm.duration);
});
if (bgm.readyState >= 1) durationText.textContent = formatTime(bgm.duration);

bgm.addEventListener('timeupdate', function () {
  currentText.textContent = formatTime(bgm.currentTime);
  if (bgm.duration) seek.value = (bgm.currentTime / bgm.duration) * 100;
});

// 막대를 끌면 그 위치로 이동
seek.addEventListener('input', function () {
  if (bgm.duration) bgm.currentTime = (seek.value / 100) * bgm.duration;
});

function startOnFirstAction(event) {
  if (event.target.closest('#music-toggle, .player')) return;  // 음악 버튼은 각자 처리
  document.removeEventListener('pointerdown', startOnFirstAction);
  document.removeEventListener('keydown', startOnFirstAction);
  if (!userPaused && bgm.paused) bgm.play().catch(function () {});
}

bgm.play().catch(function () {
  document.addEventListener('pointerdown', startOnFirstAction);
  document.addEventListener('keydown', startOnFirstAction);
});
