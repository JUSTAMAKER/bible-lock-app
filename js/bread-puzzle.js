(function () {
  const NS = "http://www.w3.org/2000/svg";
  const N = 13;
  const CX = 200,
    CY = 200,
    R = 190;
  const ANGLE = 360 / N;

  const svg = document.getElementById("bread-svg");
  const stage = document.getElementById("puzzle-stage");
  const glowOverlay = document.getElementById("glow-overlay");
  const revealNote = document.getElementById("reveal-note");

  function el(tag, attrs) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function polar(cx, cy, r, angleDeg) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }

  function wedgePath(k) {
    const start = k * ANGLE;
    const end = (k + 1) * ANGLE;
    const [x1, y1] = polar(CX, CY, R, start);
    const [x2, y2] = polar(CX, CY, R, end);
    return `M${CX},${CY} L${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 0,1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
  }

  // deterministic pseudo-random seeds so the texture is stable across reloads
  function seededRandom(seed) {
    let s = seed;
    return function () {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  function buildDefs() {
    const defs = el("defs", {});

    const gradient = el("radialGradient", {
      id: "crustGradient",
      cx: "42%",
      cy: "38%",
      r: "75%",
    });
    gradient.appendChild(el("stop", { offset: "0%", "stop-color": "#e8c27a" }));
    gradient.appendChild(el("stop", { offset: "55%", "stop-color": "#d1943f" }));
    gradient.appendChild(el("stop", { offset: "100%", "stop-color": "#8a5423" }));
    defs.appendChild(gradient);

    const filter = el("filter", { id: "breadTexture", x: "-20%", y: "-20%", width: "140%", height: "140%" });
    filter.appendChild(
      el("feTurbulence", {
        type: "fractalNoise",
        baseFrequency: "0.9",
        numOctaves: "2",
        seed: "7",
        result: "noise",
      })
    );
    filter.appendChild(
      el("feColorMatrix", {
        in: "noise",
        type: "matrix",
        values: "0 0 0 0 0.35   0 0 0 0 0.22   0 0 0 0 0.08   0 0 0 0.9 0",
      })
    );
    defs.appendChild(filter);

    for (let k = 0; k < N; k++) {
      const clip = el("clipPath", { id: "wedge-" + k });
      clip.appendChild(el("path", { d: wedgePath(k) }));
      defs.appendChild(clip);
    }

    svg.appendChild(defs);
  }

  function buildBreadFill() {
    const group = el("g", { id: "breadFill" });

    group.appendChild(el("circle", { cx: CX, cy: CY, r: R, fill: "url(#crustGradient)" }));

    const texture = el("rect", {
      x: CX - R,
      y: CY - R,
      width: R * 2,
      height: R * 2,
      filter: "url(#breadTexture)",
      opacity: "0.55",
    });
    texture.style.mixBlendMode = "multiply";
    group.appendChild(texture);

    // score lines (uneven knife slashes) - continuous only when reassembled correctly
    const slashAngles = [15, 60, 100, 145, 190, 235];
    const rand = seededRandom(42);
    slashAngles.forEach((baseAngle) => {
      const wobble = (rand() - 0.5) * 10;
      const angle = baseAngle + wobble;
      const len = R * (0.85 + rand() * 0.3);
      const [x1, y1] = polar(CX, CY, len, angle);
      const [x2, y2] = polar(CX, CY, len, angle + 180);
      group.appendChild(
        el("line", {
          x1: x1.toFixed(2),
          y1: y1.toFixed(2),
          x2: x2.toFixed(2),
          y2: y2.toFixed(2),
          stroke: "#5c3010",
          "stroke-width": 3.5,
          "stroke-linecap": "round",
          opacity: 0.5,
        })
      );
    });

    // seed specks scattered across the whole circle
    const seedRand = seededRandom(101);
    for (let i = 0; i < 26; i++) {
      const a = seedRand() * 360;
      const r = seedRand() * R * 0.92;
      const [sx, sy] = polar(CX, CY, r, a);
      group.appendChild(
        el("ellipse", {
          cx: sx.toFixed(2),
          cy: sy.toFixed(2),
          rx: 2.6,
          ry: 1.8,
          fill: "#3b2110",
          opacity: 0.55,
          transform: `rotate(${(seedRand() * 360).toFixed(1)} ${sx.toFixed(2)} ${sy.toFixed(2)})`,
        })
      );
    }

    group.appendChild(
      el("circle", { cx: CX, cy: CY, r: R, fill: "none", stroke: "#6b3d1a", "stroke-width": 5, opacity: 0.45 })
    );

    svg.appendChild(group);
  }

  function shuffledSlots() {
    let slots;
    let valid = false;
    while (!valid) {
      slots = Array.from({ length: N }, (_, i) => i);
      for (let i = slots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [slots[i], slots[j]] = [slots[j], slots[i]];
      }
      valid = slots.every((slot, home) => slot !== home);
    }
    return slots;
  }

  let solved = false;
  const pieces = []; // { home, slot, group, spin }

  function setSpin(piece, animate) {
    const delta = ((piece.slot - piece.home) * ANGLE) % 360;
    piece.spin.style.transition = animate ? "transform 0.35s ease" : "none";
    piece.spin.style.transformOrigin = `${CX}px ${CY}px`;
    piece.spin.style.transform = `rotate(${delta}deg)`;
  }

  function buildPieces() {
    const initialSlots = shuffledSlots();

    for (let home = 0; home < N; home++) {
      const group = el("g", { class: "piece", "data-home": home });
      const spin = el("g", { class: "spin" });
      const clipped = el("g", { "clip-path": `url(#wedge-${home})` });
      clipped.appendChild(el("use", { href: "#breadFill" }));
      spin.appendChild(clipped);
      group.appendChild(spin);
      svg.appendChild(group);

      const piece = { home, slot: initialSlots[home], group, spin };
      pieces.push(piece);
      setSpin(piece, false);

      attachDrag(piece);
    }
  }

  function pieceAtSlot(slot) {
    return pieces.find((p) => p.slot === slot);
  }

  function angleToSlot(clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    const scale = 400 / rect.width;
    const x = (clientX - rect.left) * scale - CX;
    const y = (clientY - rect.top) * scale - CY;
    let deg = (Math.atan2(y, x) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    return Math.floor(deg / ANGLE) % N;
  }

  function checkWin() {
    if (pieces.every((p) => p.slot === p.home)) {
      solved = true;
      reveal();
    }
  }

  function reveal() {
    stage.classList.add("solved");
    setTimeout(() => {
      revealNote.classList.add("show");
      if (window.SoundFX) {
        try {
          SoundFX.playSuccess();
        } catch (e) {
          console.warn("사운드 재생 실패:", e);
        }
      }
    }, 900);
  }

  function attachDrag(piece) {
    let dragging = false;
    let highlighted = null;

    piece.group.style.cursor = "grab";

    piece.group.addEventListener("pointerdown", (e) => {
      if (solved) return;
      dragging = true;
      piece.group.setPointerCapture(e.pointerId);
      piece.group.style.cursor = "grabbing";
      svg.appendChild(piece.group); // bring to front
      piece.spin.style.transition = "none";
      piece.spin.style.filter = "drop-shadow(0 0 6px rgba(0,0,0,0.5))";
    });

    piece.group.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const targetSlot = angleToSlot(e.clientX, e.clientY);
      const targetPiece = pieceAtSlot(targetSlot);
      if (highlighted && highlighted !== targetPiece) {
        highlighted.spin.style.opacity = "1";
      }
      if (targetPiece && targetPiece !== piece) {
        targetPiece.spin.style.opacity = "0.6";
        highlighted = targetPiece;
      } else {
        highlighted = null;
      }
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      piece.group.style.cursor = "grab";
      piece.spin.style.filter = "";
      if (highlighted) {
        highlighted.spin.style.opacity = "1";
      }

      const targetSlot = angleToSlot(e.clientX, e.clientY);
      const targetPiece = pieceAtSlot(targetSlot);

      if (targetPiece && targetPiece !== piece) {
        const tmp = piece.slot;
        piece.slot = targetPiece.slot;
        targetPiece.slot = tmp;
        setSpin(piece, true);
        setSpin(targetPiece, true);
        checkWin();
      } else {
        setSpin(piece, true);
      }
      highlighted = null;
    }

    piece.group.addEventListener("pointerup", endDrag);
    piece.group.addEventListener("pointercancel", endDrag);
  }

  buildDefs();
  buildBreadFill();
  buildPieces();
})();
