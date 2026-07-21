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
    videoReveal: document.getElementById("video-reveal"),
    lockSubtitle: document.getElementById("lock-subtitle"),
    puzzleContent: document.getElementById("puzzle-content"),
    finalReveal: document.getElementById("final-reveal"),
    finalTitle: document.getElementById("final-title"),
    finalCode: document.getElementById("final-code"),
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

    if (stage.reveal && stage.reveal.type === "videos") {
      setMessage("잠금 해제!", "success");
      showVideoReveal(stage.reveal);
      return;
    }

    setMessage(stage.openMessage || "잠금 해제!", "success");

    if (stage.revealPhone) {
      els.phoneReveal.textContent = "📞 " + stage.revealPhone;
      els.phoneReveal.hidden = false;
    }
  }

  function showVideoReveal(reveal) {
    els.videoReveal.hidden = false;
    let endedCount = 0;

    reveal.videos.forEach((v) => {
      const block = document.createElement("div");
      block.className = "video-block";

      const label = document.createElement("p");
      label.className = "video-label";
      label.textContent = v.label;

      const video = document.createElement("video");
      video.className = "reveal-video";
      video.src = v.src;
      video.controls = true;
      video.playsInline = true;

      video.addEventListener("ended", () => {
        endedCount++;
        if (endedCount === reveal.videos.length) {
          showFinalReveal(reveal);
        }
      });

      block.appendChild(label);
      block.appendChild(video);
      els.videoReveal.appendChild(block);
    });
  }

  function showFinalReveal(reveal) {
    els.puzzleContent.hidden = true;
    els.lockSubtitle.hidden = true;
    els.finalTitle.textContent = reveal.finalTitle;
    els.finalCode.textContent = reveal.finalCode;
    els.finalReveal.hidden = false;
    safeSound(() => SoundFX.playSuccess());
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
