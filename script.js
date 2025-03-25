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

const notePosition = {}; // { note: { x, y } }
const toggles = Array(standardNotes.length).fill(false);

const togglers = renderTogglers();

const audioInterface = {
  synth() {
    return new Tone.PolySynth(Tone.Synth).toDestination();
  },
  sustainNote(note) {
    synth.triggerAttack(note + "4");
  },
  releaseNote(note) {
    synth.triggerRelease(note + "4");
  },
};

const synth = audioInterface.synth();

const canvasInterface = {
  setup() {
    const canvas = document.getElementById("visualizer");
    const ctx = canvas.getContext("2d");
    canvas.width = 800;
    canvas.height = 300;
    return { canvas, ctx };
  },
  addNote(note) {
    if (notePosition[note]) return;

    const yOffset = 10;
    const numSlots = standardNotes.length;
    const slotNbr = standardNotes.indexOf(note);
    const y = (1 / numSlots) * slotNbr * canvas.height + yOffset;

    notePosition[note] = { x: 0, y };
  },
  removeNote(note) {
    delete notePosition[note];
  },
  noteColorHex(note) {
    return colorPalette[standardNotes.indexOf(note)];
  },
  draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const [note, pos] of Object.entries(notePosition)) {
      ctx.fillStyle = this.noteColorHex(note);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  notesForward() {
    for (const [note, pos] of Object.entries(notePosition)) {
      pos.x += canvas.width / 200;
      if (pos.x > canvas.width) stopNote(note);
    }
  },
};

const { canvas, ctx } = canvasInterface.setup();

function renderTogglers() {
  const container = document.getElementById("togglers-container");
  standardNotes.forEach((note) => {
    const noteElement = document.createElement("div");
    noteElement.classList.add("note");
    noteElement.textContent = note;
    noteElement.addEventListener("click", () => toggleNote(note));
    container.appendChild(noteElement);
  });

  return container;
}

function toggleNote(note) {
  if (!startNote(note)) stopNote(note);
}

function startNote(note) {
  const handle = standardNotes.indexOf(note);
  if (toggles[handle]) return false;

  toggles[handle] = true;

  const toggler = togglers.childNodes[handle];
  toggler.classList.add("active");

  canvasInterface.addNote(note);
  audioInterface.sustainNote(note);

  return true;
}

function stopNote(note) {
  const handle = standardNotes.indexOf(note);
  if (!toggles[handle]) return false;

  toggles[handle] = false;

  const toggler = togglers.childNodes[handle];
  toggler.classList.remove("active");

  canvasInterface.removeNote(note);
  audioInterface.releaseNote(note);

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
  if (note[0] === "M") standardNotes.forEach(stopNote);
  else if (standardNotes.indexOf(note) > -1) toggleNote(note);
  else if (key === "E" || key === "B") toggleNote(nextNote(key));
});

function animate() {
  canvasInterface.notesForward();
  canvasInterface.draw();
  requestAnimationFrame(animate);
}

animate();
