const ARROW_SYMBOL = {
  up: "⬆️",
  down: "⬇️",
  left: "⬅️",
  right: "➡️",
};

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[:.,'"~\-]/g, "");
}

function getStageIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("stage");
}

function findMatchingArrows(stage, inputText) {
  const normalizedInput = normalize(inputText);
  if (!normalizedInput) return null;

  if (stage.password) {
    return normalizedInput === normalize(stage.password) ? stage.verses[0].arrows : null;
  }

  for (const verse of stage.verses) {
    for (const ref of verse.refs) {
      if (normalize(ref) === normalizedInput) {
        return verse.arrows;
      }
    }
  }
  return null;
}

function init() {
  const els = {
    title: document.getElementById("stage-title"),
    subtitle: document.getElementById("stage-subtitle"),
    hint: document.getElementById("stage-hint"),
    form: document.getElementById("verse-form"),
    input: document.getElementById("verse-input"),
    submitBtn: document.getElementById("submit-btn"),
    message: document.getElementById("message"),
    arrowStage: document.getElementById("arrow-stage"),
    arrowSequence: document.getElementById("arrow-sequence"),
    replayBtn: document.getElementById("replay-btn"),
    puzzleCard: document.getElementById("puzzle-card"),
    notFound: document.getElementById("not-found"),
  };

  const stageId = getStageIdFromURL();
  const stage = stageId ? STAGES[stageId] : null;

  if (!stage) {
    els.puzzleCard.hidden = true;
    els.notFound.hidden = false;
    return;
  }

  const passwordMode = Boolean(stage.password);

  els.title.textContent = stage.title;

  if (passwordMode) {
    els.subtitle.textContent = "비밀번호를 입력하세요";
    els.input.placeholder = "비밀번호 입력";
    els.input.setAttribute("inputmode", "numeric");
    els.hint.textContent = "정답을 입력하면 방향 자물쇠 화면으로 자동 이동합니다";
  }

  let lastArrows = null;
  let revealing = false;

  function setMessage(text, kind) {
    els.message.textContent = text;
    els.message.className = "message" + (kind ? " " + kind : "");
  }

  async function revealArrows(arrows) {
    revealing = true;
    els.submitBtn.disabled = true;
    els.arrowStage.hidden = false;
    els.arrowStage.textContent = "";
    els.arrowSequence.innerHTML = "";

    for (let i = 0; i < arrows.length; i++) {
      const dir = arrows[i];
      safeSound(() => SoundFX.playTick());
      els.arrowStage.textContent = ARROW_SYMBOL[dir];
      els.arrowStage.classList.remove("pulse");
      // force reflow to restart animation
      void els.arrowStage.offsetWidth;
      els.arrowStage.classList.add("pulse");
      await sleep(750);
    }

    els.arrowStage.hidden = true;
    els.arrowStage.textContent = "";
    els.arrowSequence.innerHTML = "";

    revealing = false;
    els.submitBtn.disabled = false;
    els.replayBtn.hidden = false;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function safeSound(fn) {
    try {
      fn();
    } catch (err) {
      console.warn("사운드 재생 실패:", err);
    }
  }

  els.form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (revealing) return;

    safeSound(() => SoundFX.unlock());

    const arrows = findMatchingArrows(stage, els.input.value);
    if (arrows) {
      lastArrows = arrows;
      setMessage("정답입니다! 화살표를 순서대로 확인하세요.", "success");
      els.replayBtn.hidden = true;
      await revealArrows(arrows);

      if (passwordMode) {
        setMessage("방향 자물쇠 화면으로 이동합니다...", "success");
        await sleep(1200);
        window.location.href = `direction-lock.html?stage=${encodeURIComponent(stageId)}`;
      }
    } else {
      lastArrows = null;
      els.arrowStage.hidden = true;
      els.arrowSequence.innerHTML = "";
      els.replayBtn.hidden = true;
      safeSound(() => SoundFX.playError());
      setMessage(passwordMode ? "오답입니다. 비밀번호를 다시 확인해보세요." : "오답입니다. 구절을 다시 확인해보세요.", "error");
      els.puzzleCard.classList.remove("shake");
      void els.puzzleCard.offsetWidth;
      els.puzzleCard.classList.add("shake");
    }
  });

  els.replayBtn.addEventListener("click", () => {
    if (revealing || !lastArrows) return;
    SoundFX.unlock();
    revealArrows(lastArrows);
  });
}

document.addEventListener("DOMContentLoaded", init);
