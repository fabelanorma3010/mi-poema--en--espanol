let poemWriter;

function displayPoem(response) {
  const poem = response.data.answer;
  if (typeof poem !== "string" || poem.trim() === "") {
    throw new Error("The poem service returned an empty response.");
  }

  poemWriter = new Typewriter("#poem-content", {
    strings: poem,
    autoStart: true,
    delay: 35,
    cursor: "",
  });
}

function generatePoem(event) {
  event.preventDefault();

  const instructionsInput = document.querySelector("#user-instructions");
  const submitButton = document.querySelector(".submit-button");
  const poemElement = document.querySelector("#poem");
  const poemContent = document.querySelector("#poem-content");
  const apiKey = "2046c535afeb092fo82f1d306d8a2b2t";
  const context =
    "Eres poeta en español. Escribe un poema breve, emotivo y esperanzador de cuatro versos sobre el amor, la esperanza y la vida, inspirado por el tema indicado. Celebra el cariño, la fuerza para seguir adelante y la belleza de vivir. Separa cada verso con <br />. No incluyas título ni firma.";
  const prompt = `Escribe un poema en español sobre el amor, la esperanza y la vida, inspirado en: ${instructionsInput.value.trim()}`;
  const query = new URLSearchParams({ prompt, context, key: apiKey });
  const apiURL = `https://api.shecodes.io/ai/v1/generate?${query}`;

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
sirenToggle.addEventListener("click", () => {
  const isOn = sirenToggle.getAttribute("aria-pressed") !== "true";
  sirenToggle.setAttribute("aria-pressed", String(isOn));
  sirenToggle.classList.toggle("is-on", isOn);
  sirenToggleLabel.textContent = isOn ? "Apagar sirena" : "Encender sirena";
});
