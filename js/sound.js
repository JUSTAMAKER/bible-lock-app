// Web Audio API로 효과음을 즉시 합성합니다. (오디오 파일 불필요)
// 모바일 자동재생 정책 때문에, 반드시 사용자의 탭(클릭) 이벤트 안에서 먼저 호출되어야 합니다.

const SoundFX = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    return ctx;
  }

  function tone(freq, start, duration, type = "sine", peakGain = 0.25) {
    const audioCtx = getCtx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peakGain, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  return {
    unlock() {
      getCtx();
    },
    playTick() {
      const now = getCtx().currentTime;
      tone(880, now, 0.12, "square", 0.15);
    },
    playSuccess() {
      const now = getCtx().currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        tone(freq, now + i * 0.11, 0.28, "triangle", 0.22);
      });
    },
    playError() {
      const now = getCtx().currentTime;
      tone(220, now, 0.25, "sawtooth", 0.25);
      tone(160, now + 0.15, 0.35, "sawtooth", 0.25);
    },
  };
})();
