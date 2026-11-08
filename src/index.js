let poemWriter;
let currentPoem = "";
const savedPoemsKey = "poemas-guardados";
const savePoemButton = document.querySelector("#save-poem");
const poemActions = document.querySelector("#poem-actions");
const poemActionStatus = document.querySelector("#poem-action-status");
const savedPoemsList = document.querySelector("#saved-poems-list");
const savedPoemsEmpty = document.querySelector("#saved-poems-empty");
const savedPoemsStatus = document.querySelector("#saved-poems-status");

async function copyPoem(poem, status) {
  try {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      throw new Error("Clipboard API unavailable.");
    }
    await navigator.clipboard.writeText(poem);
    status.textContent = "Poema copiado.";
  } catch (error) {
    status.textContent = "No se pudo copiar. Selecciona el poema y cópialo manualmente.";
    console.error("Could not copy poem:", error);
  }
}

async function sharePoem(poem, status) {
  if (!navigator.share) {
    status.textContent = "Este navegador no permite compartir directamente. Usa «Copiar».";
    return;
  }
  try {
    await navigator.share({ title: "Un poema para ti", text: poem });
    status.textContent = "Poema compartido.";
  } catch (error) {
    if (error.name === "AbortError") {
      status.textContent = "Se canceló la opción de compartir.";
      return;
    }
    status.textContent = "No se pudo compartir el poema. Inténtalo de nuevo o usa «Copiar».";
    console.error("Could not share poem:", error);
  }
}

function downloadPoem(poem, status) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable.");
    context.font = "36px Georgia, serif";
    const lines = [];
    for (const paragraph of poem.split("\n")) {
      let line = "";
      for (const word of paragraph.trim().split(/\s+/)) {
        const candidate = line ? `${line} ${word}` : word;
        if (context.measureText(candidate).width <= 1000) {
          line = candidate;
          continue;
        }
        if (line) lines.push(line);
        line = "";
        for (const character of word) {
          if (context.measureText(line + character).width > 1000 && line) {
            lines.push(line);
            line = "";
          }
          line += character;
        }
      }
      lines.push(line);
    }
    canvas.height = Math.max(700, 260 + lines.length * 64);
    context.fillStyle = "#fff8f3";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#d7a1a0";
    context.lineWidth = 3;
    context.strokeRect(35, 35, canvas.width - 70, canvas.height - 70);
    context.textAlign = "center";
    context.fillStyle = "#a64c55";
    context.font = "bold 28px Arial, sans-serif";
    context.fillText("UN POEMA PARA TI", 600, 125);
    context.fillStyle = "#302323";
    context.font = "36px Georgia, serif";
    lines.forEach((line, index) => context.fillText(line, 600, 220 + index * 64));
    canvas.toBlob((blob) => {
      if (!blob) {
        status.textContent = "No se pudo crear la tarjeta. Inténtalo de nuevo.";
        console.error("Could not create poem card image.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "mi-poema.png";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = "Tarjeta descargada.";
    }, "image/png");
  } catch (error) {
    status.textContent = "No se pudo crear la tarjeta. Inténtalo de nuevo.";
    console.error("Could not create poem card:", error);
  }
}

function addSharingButtons(container, poem, status) {
  const actions = document.createElement("div");
  actions.className = "poem-actions";
  [
    ["Copiar", copyPoem],
    ["Compartir", sharePoem],
    ["Descargar tarjeta", downloadPoem],
  ].forEach(([label, action]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "share-poem-button";
    button.textContent = label;
    button.addEventListener("click", () => action(poem, status));
    actions.append(button);
  });
  container.append(actions);
}

function readSavedPoems() {
  const saved = localStorage.getItem(savedPoemsKey);
  if (saved === null) return [];

  const poems = JSON.parse(saved);
  if (!Array.isArray(poems) || !poems.every((poem) => typeof poem === "string")) {
    throw new Error("Invalid saved poem data.");
  }
  return poems;
}

function renderSavedPoems(poems) {
  savedPoemsList.replaceChildren();
  savedPoemsEmpty.hidden = poems.length > 0;
  poems.forEach((poem, index) => {
    const item = document.createElement("li");
    const text = document.createElement("p");
    const removeButton = document.createElement("button");
    text.className = "saved-poem-text";
    text.textContent = poem;
    removeButton.type = "button";
    removeButton.className = "remove-poem-button";
    removeButton.textContent = "Eliminar";
    removeButton.setAttribute("aria-label", `Eliminar poema ${index + 1}`);
    removeButton.addEventListener("click", () => {
      try {
        const currentPoems = readSavedPoems();
        if (currentPoems[index] !== poem) {
          renderSavedPoems(currentPoems);
          savedPoemsStatus.textContent = "La lista cambió. Vuelve a elegir el poema que deseas eliminar.";
          return;
        }
        currentPoems.splice(index, 1);
        localStorage.setItem(savedPoemsKey, JSON.stringify(currentPoems));
        renderSavedPoems(currentPoems);
        savedPoemsStatus.textContent = "Poema eliminado.";
      } catch (error) {
        savedPoemsStatus.textContent = "No se pudo eliminar el poema. Revisa el almacenamiento del navegador.";
        console.error("Could not delete saved poem:", error);
      }
    });
    item.append(text, removeButton);
    addSharingButtons(item, poem, savedPoemsStatus);
    savedPoemsList.append(item);
  });
}

try {
  renderSavedPoems(readSavedPoems());
} catch (error) {
  savedPoemsEmpty.hidden = true;
  savedPoemsStatus.textContent = "No se pudieron cargar los poemas guardados. Revisa el almacenamiento del navegador.";
  console.error("Could not load saved poems:", error);
}

savePoemButton.addEventListener("click", () => {
  if (!currentPoem) return;

  try {
    const poems = readSavedPoems();
    poems.unshift(currentPoem);
    localStorage.setItem(savedPoemsKey, JSON.stringify(poems));
    renderSavedPoems(poems);
    savePoemButton.disabled = true;
    savePoemButton.textContent = "Poema guardado";
    savedPoemsStatus.textContent = "Poema guardado en este navegador.";
  } catch (error) {
    savedPoemsStatus.textContent = "No se pudo guardar el poema. Revisa el almacenamiento del navegador.";
    console.error("Could not save poem:", error);
  }
});

document.querySelector("#copy-poem").addEventListener("click", () => copyPoem(currentPoem, poemActionStatus));
document.querySelector("#share-poem").addEventListener("click", () => sharePoem(currentPoem, poemActionStatus));
document.querySelector("#download-poem").addEventListener("click", () => downloadPoem(currentPoem, poemActionStatus));

const giftIntro = document.querySelector("#gift-intro");
const giftButton = document.querySelector("#gift-button");
const pageContent = document.querySelector("#page-content");
const pageTitle = document.querySelector("#page-title");
const stars = document.querySelector("#stars");

pageContent.hidden = true;
giftIntro.hidden = false;
giftButton.addEventListener("click", () => {
  giftButton.disabled = true;
  giftIntro.classList.add("is-opening");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.setTimeout(() => {
    giftIntro.hidden = true;
    pageContent.hidden = false;
    stars.hidden = false;
    document.body.classList.add("light-off");
    pageTitle.focus();
  }, reducedMotion ? 0 : 650);
});

function displayPoem(response) {
  const poem = response.data.answer;
  if (typeof poem !== "string" || poem.trim() === "") {
    throw new Error("The poem service returned an empty response.");
  }

  const parsedPoem = new DOMParser().parseFromString(poem, "text/html");
  parsedPoem.querySelectorAll("script, style").forEach((element) => element.remove());
  parsedPoem.querySelectorAll("br").forEach((element) => element.replaceWith("\n"));
  const plainPoem = parsedPoem.body.textContent.trim();
  if (!plainPoem) {
    throw new Error("The poem service returned no poem text.");
  }

  const safeText = document.createElement("div");
  safeText.textContent = plainPoem;
  poemWriter = new Typewriter("#poem-content", {
    strings: safeText.innerHTML.replace(/\n/g, "<br />"),
    autoStart: true,
    delay: 35,
    cursor: "",
  });
  currentPoem = plainPoem;
  poemActions.hidden = false;
}

function generatePoem(event) {
  event.preventDefault();

  const instructionsInput = document.querySelector("#user-instructions");
  const submitButton = document.querySelector(".submit-button");
  const poemElement = document.querySelector("#poem");
  const poemContent = document.querySelector("#poem-content");
  const apiKey = "2046c535afeb092fo82f1d306d8a2b2t";
  const theme = document.querySelector("#poem-theme").value;
  const tone = document.querySelector("#poem-tone").value;
  const length = document.querySelector("#poem-length").value;
  const context =
    "Eres poeta en español. Escribe un poema según las indicaciones del usuario. Separa cada verso con <br />. No incluyas título ni firma.";
  const inspiration = instructionsInput.value.trim();
  const prompt = `Escribe un poema de ${length} versos, de tono ${tone}, sobre ${theme}.${inspiration ? ` Inspírate en: ${inspiration}` : ""}`;
  const query = new URLSearchParams({ prompt, context, key: apiKey });
  const apiURL = `https://api.shecodes.io/ai/v1/generate?${query}`;

  currentPoem = "";
  poemActions.hidden = true;
  savePoemButton.disabled = false;
  savePoemButton.textContent = "Guardar poema";
  poemActionStatus.textContent = "";
  savedPoemsStatus.textContent = "";
  if (poemWriter) {
    poemWriter.stop();
    poemWriter = null;
  }

  poemElement.classList.remove("hidden");
  poemElement.setAttribute("aria-busy", "true");
  poemContent.textContent = `Escribiendo un poema sobre ${inspiration || theme}…`;
  poemContent.classList.add("generating");
  submitButton.disabled = true;

  axios
    .get(apiURL)
    .then((response) => {
      poemContent.classList.remove("generating");
      poemContent.textContent = "";
      displayPoem(response);
    })
    .catch((error) => {
      poemContent.classList.remove("generating");
      poemContent.textContent =
        "Lo sentimos, no se pudo crear tu poema. Inténtalo de nuevo.";
      console.error("Poem generation failed:", error);
    })
    .finally(() => {
      poemElement.setAttribute("aria-busy", "false");
      submitButton.disabled = false;
    });
}

const poemFormElement = document.querySelector("#poem-generator-form");
poemFormElement.addEventListener("submit", generatePoem);

const sirenToggle = document.querySelector("#siren-toggle");
const sirenToggleLabel = document.querySelector("#siren-toggle-label");
let sirenAudioContext;
let sirenOscillator;
let sirenSweep;

function stopSiren() {
  window.clearInterval(sirenSweep);
  sirenSweep = null;

  if (sirenOscillator) {
    sirenOscillator.stop();
    sirenOscillator = null;
  }

  if (sirenAudioContext) {
    const contextToClose = sirenAudioContext;
    sirenAudioContext = null;
    contextToClose.close().catch((error) => {
      console.error("Could not close siren audio:", error);
    });
  }
}

async function startSiren() {
  const AudioContext = window.AudioContext;
  if (!AudioContext) {
    throw new Error("Audio is not supported by this browser.");
  }

  sirenAudioContext = new AudioContext();
  await sirenAudioContext.resume();

  sirenOscillator = sirenAudioContext.createOscillator();
  const volume = sirenAudioContext.createGain();
  const now = sirenAudioContext.currentTime;

  sirenOscillator.type = "sine";
  sirenOscillator.frequency.setValueAtTime(660, now);
  sirenOscillator.connect(volume);
  volume.connect(sirenAudioContext.destination);
  volume.gain.setValueAtTime(0, now);
  volume.gain.linearRampToValueAtTime(0.035, now + 0.12);
  sirenOscillator.start(now);

  let highTone = true;
  sirenSweep = window.setInterval(() => {
    if (!sirenAudioContext || !sirenOscillator) return;
    const time = sirenAudioContext.currentTime;
    sirenOscillator.frequency.cancelScheduledValues(time);
    sirenOscillator.frequency.setTargetAtTime(highTone ? 880 : 660, time, 0.16);
    highTone = !highTone;
  }, 550);
}

sirenToggle.addEventListener("click", async () => {
  const isOn = sirenToggle.getAttribute("aria-pressed") !== "true";

  if (isOn) {
    sirenToggleLabel.textContent = "Iniciando sirena…";
    sirenToggle.disabled = true;

    try {
      await startSiren();
      sirenToggle.setAttribute("aria-pressed", "true");
      sirenToggle.classList.add("is-on");
      sirenToggleLabel.textContent = "Apagar sirena";
    } catch (error) {
      stopSiren();
      sirenToggleLabel.textContent = "No se pudo activar el sonido";
      console.error("Could not start siren audio:", error);
    } finally {
      sirenToggle.disabled = false;
    }
    return;
  }

  stopSiren();
  sirenToggle.setAttribute("aria-pressed", "false");
  sirenToggle.classList.remove("is-on");
  sirenToggleLabel.textContent = "Encender sirena";
});

const lightToggle = document.querySelector("#light-toggle");
const lightToggleLabel = document.querySelector("#light-toggle-label");
lightToggle.addEventListener("click", () => {
  const isOn = lightToggle.getAttribute("aria-pressed") !== "true";
  lightToggle.setAttribute("aria-pressed", String(isOn));
  lightToggle.classList.toggle("is-on", isOn);
  document.body.classList.toggle("light-on", isOn);
  document.body.classList.toggle("light-off", !isOn);
  stars.hidden = isOn;
  lightToggleLabel.textContent = isOn ? "Apagar luz" : "Encender luz";
});

const musicToggle = document.querySelector("#music-toggle");
const musicToggleLabel = document.querySelector("#music-toggle-label");
let musicContext;
let musicTimer;

function stopMusic() {
  window.clearInterval(musicTimer);
  musicTimer = null;
  if (musicContext) {
    const contextToClose = musicContext;
    musicContext = null;
    contextToClose.close().catch((error) => {
      console.error("Could not close music audio:", error);
    });
  }
}

function playMusicNote(context, frequency) {
  const oscillator = context.createOscillator();
  const volume = context.createGain();
  const now = context.currentTime;
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, now);
  volume.gain.setValueAtTime(0, now);
  volume.gain.linearRampToValueAtTime(0.025, now + 0.12);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
  oscillator.connect(volume);
  volume.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 1.2);
  oscillator.addEventListener("ended", () => {
    oscillator.disconnect();
    volume.disconnect();
  });
}

musicToggle.addEventListener("click", async () => {
  if (musicToggle.getAttribute("aria-pressed") === "true") {
    stopMusic();
    musicToggle.setAttribute("aria-pressed", "false");
    musicToggle.classList.remove("is-on");
    musicToggleLabel.textContent = "Activar música";
    return;
  }

  musicToggle.disabled = true;
  musicToggleLabel.textContent = "Iniciando música…";
  try {
    if (!window.AudioContext) throw new Error("Audio is not supported by this browser.");
    musicContext = new window.AudioContext();
    await musicContext.resume();
    const notes = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 392, 329.63];
    let index = 0;
    playMusicNote(musicContext, notes[index++]);
    musicTimer = window.setInterval(() => {
      playMusicNote(musicContext, notes[index % notes.length]);
      index += 1;
    }, 850);
    musicToggle.setAttribute("aria-pressed", "true");
    musicToggle.classList.add("is-on");
    musicToggleLabel.textContent = "Apagar música";
  } catch (error) {
    stopMusic();
    musicToggleLabel.textContent = "No se pudo activar la música";
    console.error("Could not start music:", error);
  } finally {
    musicToggle.disabled = false;
  }
});
