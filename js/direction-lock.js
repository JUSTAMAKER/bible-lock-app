function getStageIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("stage");
}

function safeSound(fn) {
  try {
    fn();
  } catch (err) {
    console.warn("사운드 재생 실패:", err);
  }
}

function init() {
  const els = {
    title: document.getElementById("stage-title"),
    lockWrap: document.getElementById("lock-wrap"),
    pips: document.getElementById("pips"),
    message: document.getElementById("message"),
    phoneReveal: document.getElementById("phone-reveal"),
    lockCard: document.getElementById("lock-card"),
    notFound: document.getElementById("not-found"),
  };

  const stageId = getStageIdFromURL();
  const stage = stageId ? STAGES[stageId] : null;
  const target = stage && stage.verses && stage.verses[0] ? stage.verses[0].arrows : null;

  if (!stage || !target) {
    els.lockCard.hidden = true;
    els.notFound.hidden = false;
    return;
  }

  els.title.textContent = stage.title;

  let progress = 0;
  let opened = false;

  for (let i = 0; i < target.length; i++) {
    const pip = document.createElement("div");
    pip.className = "pip";
    els.pips.appendChild(pip);
  }
  const pipEls = Array.from(els.pips.children);

  function setMessage(text, kind) {
    els.message.textContent = text;
    els.message.className = "message" + (kind ? " " + kind : "");
  }

  function updatePips() {
    pipEls.forEach((pip, i) => {
      pip.classList.toggle("filled", i < progress);
    });
  }

  function resetProgress() {
    progress = 0;
    updatePips();
  }

  function shake() {
    els.lockWrap.classList.remove("shake");
    void els.lockWrap.offsetWidth;
    els.lockWrap.classList.add("shake");
  }

  function openLock() {
    opened = true;
    els.lockWrap.classList.add("open");
    safeSound(() => SoundFX.playSuccess());
    setMessage(stage.openMessage || "잠금 해제!", "success");

    if (stage.revealPhone) {
      els.phoneReveal.textContent = "📞 " + stage.revealPhone;
      els.phoneReveal.hidden = false;
    }
  }

  document.querySelectorAll(".dir-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (opened) return;
      safeSound(() => SoundFX.playTick());

      const dir = btn.dataset.dir;
      if (dir === target[progress]) {
        progress++;
        updatePips();
        setMessage("", "");
        if (progress === target.length) {
          openLock();
        }
      } else {
        safeSound(() => SoundFX.playError());
        shake();
        setMessage("잘못된 방향입니다. 처음부터 다시 입력하세요.", "error");
        resetProgress();
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", init);
