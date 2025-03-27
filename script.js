const standardNotes = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const colorPalette = [
  "#8A2BE2", // Blue Violet
  "#9370DB", // Medium Purple
  "#BA55D3", // Orchid
  "#FF69B4", // Hot Pink
  "#FF1493", // Deep Pink
  "#DB7093", // Pale Violet Red
  "#C71585", // Medium Violet Red
  "#FF4500", // Orange Red
  "#FF6347", // Tomato
  "#FF7F50", // Coral
  "#FFB6C1", // Light Pink
  "#FFC0CB", // Pink
];

const canvasInterface = {
  setup() {
    const canvas = document.getElementById("visualizer");
    const ctx = canvas.getContext("2d");
    canvas.width = 800;
    canvas.height = 300;
    return { canvas, ctx };
  },
  addNote(note, octave) {
    const octHandle = octaveInterface.handle(octave);
    if (notePositions[octHandle][note]) return;

    const yOffset = 10;
    const numSlots = standardNotes.length;
    const slotNbr = standardNotes.indexOf(note);
    const y = (1 / numSlots) * slotNbr * canvas.height + yOffset;

    notePositions[octHandle][note] = { x: 0, y };
  },
  removeNote(note, octave) {
    const posHandle = octaveInterface.handle(octave);
    delete notePositions[posHandle][note];
  },
  noteColorHex(note) {
    return colorPalette[standardNotes.indexOf(note)];
  },
  draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const octHandle = octaveInterface.handle();
    for (const [note, pos] of Object.entries(notePositions[octHandle])) {
      ctx.fillStyle = this.noteColorHex(note);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  notesForward() {
    const octHandle = octaveInterface.handle();
    for (const [note, pos] of Object.entries(notePositions[octHandle])) {
      pos.x += canvas.width / 200;
      if (pos.x > canvas.width) stopNote(note);
    }
  },
};

const audioInterface = {
  synth: new Tone.PolySynth(Tone.Synth).toDestination(),
  sustainNote(note, octave) {
    this.synth.triggerAttack(`${note}${octave}`);
  },
  releaseNote(note, octave) {
    this.synth.triggerRelease(`${note}${octave}`);
  },
};

const octaveInterface = {
  octaveMin: 2,
  octaveMax: 8,
  octave: 4,
  current() {
    return this.octave;
  },
  handle(octave = this.current()) {
    return this.clamp(octave) - this.octaveMin;
  },
  up(n) {
    this.set(this.current() + n);
  },
  down(n) {
    this.set(this.current() - n);
  },
  set(octave) {
    const nextOctave = this.clamp(octave);
    if (this.octave === nextOctave) return;

    this.octave = nextOctave;
    this.octaveElementDOM().textContent = this.current();

    redrawTogglers();
  },
  octaveElementDOM() {
    return document.getElementById("octave-display");
  },
  clamp(octave) {
    if (octave > this.octaveMax) return this.octaveMax;
    if (octave < this.octaveMin) return this.octaveMin;
    return octave;
  },
  range() {
    const out = [];
    for (let o = this.octaveMin; o <= this.octaveMax; o++) out.push(o);

    return out;
  },
};

const notePositions = octaveInterface.range().map(() => ({}));

const toggles = octaveInterface
  .range()
  .map(() => Array(standardNotes.length).fill(false));

const togglers = document.getElementById("togglers-container");

function redrawTogglers() {
  return renderTogglers(togglers);
}

redrawTogglers();

const { canvas, ctx } = canvasInterface.setup();

function removeChildren(element) {
  while (element.firstChild) element.removeChild(element.firstChild);
}

function product(xs, ys) {
  const out = [];
  for (const x of xs) for (const y of ys) out.push([x, y]);

  return out;
}

function renderTogglers(container) {
  removeChildren(container);

  standardNotes.forEach((note, idx) => {
    const noteElement = document.createElement("div");
    const octHandle = octaveInterface.handle();
    const toggleHandle = idx;
    noteElement.classList.add("note");
    noteElement.textContent = note;
    noteElement.addEventListener("click", () => toggleNote(note));
    if (toggles[octHandle][toggleHandle]) noteElement.classList.add("active");
    container.appendChild(noteElement);
  });

  return container;
}

function toggleNote(note, octave) {
  if (!startNote(note, octave)) stopNote(note, octave);
}

function startNote(note, octave) {
  const handle = standardNotes.indexOf(note);
  const octHandle = octaveInterface.handle(octave);
  if (toggles[octHandle][handle]) return false;

  toggles[octHandle][handle] = true;

  const toggler = togglers.childNodes[handle];
  toggler.classList.add("active");

  canvasInterface.addNote(note, octave);
  audioInterface.sustainNote(note, octave);

  return true;
}

function stopNote(note, octave) {
  const handle = standardNotes.indexOf(note);
  const octHandle = octaveInterface.handle(octave);
  if (!toggles[octHandle][handle]) return false;

  toggles[octHandle][handle] = false;

  const toggler = togglers.childNodes[handle];
  toggler.classList.remove("active");

  canvasInterface.removeNote(note, octave);
  audioInterface.releaseNote(note, octave);

  return true;
}

function nextNote(note) {
  const handle = standardNotes.indexOf(note);
  const nextHandle = (handle + 1) % standardNotes.length;

  return standardNotes[nextHandle];
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toUpperCase();
  const note = key + (event.shiftKey ? "#" : "");

  if (note[0] === "M") {
    const muteAll = note === "M#";
    const inputs = product(
      standardNotes,
      muteAll ? octaveInterface.range() : [octaveInterface.current()]
    );
    inputs.forEach(([note, octave]) => stopNote(note, octave));
  } else if (standardNotes.indexOf(note) > -1) {
    toggleNote(note, octaveInterface.current());
  } else if (key === "E" || key === "B") {
    toggleNote(nextNote(key), octaveInterface.current());
  }
});

document.addEventListener("keydown", (event) => {
  const key = event.key;

  if (key === "ArrowUp") {
    octaveInterface.up(1);
  } else if (key === "ArrowDown") {
    octaveInterface.down(1);
  } else {
    const oct = Number(key);
    if (!isNaN(oct)) octaveInterface.set(oct);
  }
});

function animate() {
  canvasInterface.notesForward();
  canvasInterface.draw();
  requestAnimationFrame(animate);
}

animate();
