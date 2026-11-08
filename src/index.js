let poemWriter;
let currentPoem = "";
const savedPoemsKey = "poemas-guardados";
const savePoemButton = document.querySelector("#save-poem");
const savedPoemsList = document.querySelector("#saved-poems-list");
const savedPoemsEmpty = document.querySelector("#saved-poems-empty");
const savedPoemsStatus = document.querySelector("#saved-poems-status");

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

  poemWriter = new Typewriter("#poem-content", {
    strings: poem,
    autoStart: true,
    delay: 35,
    cursor: "",
  });
  currentPoem = plainPoem;
  savePoemButton.hidden = false;
}

function generatePoem(event) {
  event.preventDefault();

  const instructionsInput = document.querySelector("#user-instructions");
  const submitButton = document.querySelector(".submit-button");
  const poemElement = document.querySelector("#poem");
  const poemContent = document.querySelector("#poem-content");
  const apiKey = "2046c535afeb092fo82f1d306d8a2b2t";
  const context =
    "Eres poeta en español. Escribe un poema breve, emotivo y esperanzador de cuatro versos sobre el amor, la esperanza, la vida, la salud y la paz, inspirado por el tema indicado. Celebra el cariño, el bienestar, la calma, la fuerza para seguir adelante y la belleza de vivir. Separa cada verso con <br />. No incluyas título ni firma.";
  const prompt = `Escribe un poema en español sobre el amor, la esperanza, la vida, la salud y la paz, inspirado en: ${instructionsInput.value.trim()}`;
  const query = new URLSearchParams({ prompt, context, key: apiKey });
  const apiURL = `https://api.shecodes.io/ai/v1/generate?${query}`;

  currentPoem = "";
  savePoemButton.hidden = true;
  savePoemButton.disabled = false;
  savePoemButton.textContent = "Guardar poema";
  savedPoemsStatus.textContent = "";
  if (poemWriter) {
    poemWriter.stop();
    poemWriter = null;
  }

  poemElement.classList.remove("hidden");
  poemElement.setAttribute("aria-busy", "true");
  poemContent.textContent = `Escribiendo un poema sobre ${instructionsInput.value.trim()}…`;
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
