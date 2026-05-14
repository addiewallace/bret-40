const state = {
  data: null,
};

const $ = (selector) => document.querySelector(selector);

document.body.classList.add("locked");

async function loadData() {
  const response = await fetch("data/site-data.json");
  if (!response.ok) throw new Error("Could not load birthday data.");
  state.data = await response.json();
}

function paragraphs(text) {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p>${escapeHtml(part)}</p>`)
    .join("");
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return map[char];
  });
}

function renderHero() {
  const hero = $("#heroPhoto");
  const heroPhoto = state.data.heroPhoto || state.data.photos[0]?.src;
  if (heroPhoto) {
    const probe = new Image();
    probe.addEventListener("load", () => {
      hero.style.setProperty("--hero-image", `url("${heroPhoto}")`);
      hero.classList.add("has-photo");
    });
    probe.src = heroPhoto;
  }
}

function renderStories() {
  const stories = $("#stories");
  stories.innerHTML = state.data.notes
    .map((note, index) => {
      const assignedPhotos = note.photos || photosForStory(state.data.photos, index, state.data.notes.length);
      const classes = index === 0 ? "note-card featured" : "note-card";
      return `
        <article class="story-card">
          <div class="${classes}">
            <h3>${escapeHtml(note.name)}</h3>
            ${paragraphs(note.message)}
          </div>
          <div class="story-photos photo-count-${assignedPhotos.length}">
            ${assignedPhotos.map((photo, photoIndex) => photoTile(photo, photoIndex)).join("")}
          </div>
        </article>
      `;
    })
    .join("");

  wirePhotoFallbacks();
}

function photosForStory(photos, index, storyCount) {
  if (!photos.length) return [];
  if (photos.length <= storyCount) {
    return [photos[index % photos.length]];
  }
  const photosPerStory = Math.max(1, Math.floor(photos.length / storyCount));
  const extraUntil = photos.length % storyCount;
  const count = photosPerStory + (index < extraUntil ? 1 : 0);
  const start = index * photosPerStory + Math.min(index, extraUntil);
  return photos.slice(start, start + count);
}

function photoTile(photo, index) {
  const fallback = photo.caption || photo.date || "";
  return `
    <figure class="photo-tile">
      <img src="${photo.src}" alt="${escapeHtml(photo.alt)}" loading="eager" />
      <figcaption class="photo-fallback">${escapeHtml(fallback)}</figcaption>
    </figure>
  `;
}

function wirePhotoFallbacks() {
  document.querySelectorAll(".photo-tile img").forEach((img) => {
    const markLoaded = () => {
      const caption = img.nextElementSibling;
      if (caption) caption.hidden = true;
      img.classList.add("is-loaded");
    };

    if (img.complete && img.naturalWidth > 0) {
      markLoaded();
      return;
    }

    img.addEventListener("load", () => {
      markLoaded();
    });
    img.addEventListener("error", () => {
      img.hidden = true;
      img.closest(".photo-tile")?.classList.add("has-error");
    });
  });
}

function renderTrivia() {
  const trivia = $("#triviaGrid");
  trivia.innerHTML = state.data.questions
    .map((question, questionIndex) => {
      const choices = question.choices
        .map((choice, choiceIndex) => {
          return `<button class="choice" type="button" data-choice-index="${choiceIndex}">${escapeHtml(choice)}</button>`;
        })
        .join("");
      return `
        <article class="trivia-card" data-correct-index="${question.correctIndex}">
          <h3>${questionIndex + 1}. ${escapeHtml(question.prompt)}</h3>
          <div class="choice-list">${choices}</div>
          <p class="trivia-feedback" aria-live="polite"></p>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll(".choice").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".trivia-card");
      const group = card.querySelector(".choice-list");
      const feedback = card.querySelector(".trivia-feedback");
      const correctIndex = Number(card.dataset.correctIndex);
      const selectedIndex = Number(button.dataset.choiceIndex);

      group.querySelectorAll(".choice").forEach((choice) => {
        choice.classList.remove("is-selected", "is-correct", "is-wrong");
        const choiceIndex = Number(choice.dataset.choiceIndex);
        if (choiceIndex === correctIndex) {
          choice.classList.add("is-correct");
        }
      });

      button.classList.add("is-selected");
      if (selectedIndex === correctIndex) {
        feedback.textContent = "Correct. Bret lore remains intact.";
        feedback.className = "trivia-feedback is-correct";
      } else {
        button.classList.add("is-wrong");
        feedback.textContent = "Not quite. The highlighted answer is the one from the party.";
        feedback.className = "trivia-feedback is-wrong";
      }
    });
  });
}

function unlock() {
  $("#gate").classList.add("is-open");
  $("#site").classList.remove("is-locked");
  document.body.classList.remove("locked");
  sessionStorage.setItem("bret40Unlocked", "true");
}

function wireGate() {
  const form = $("#gateForm");
  const input = $("#accessCode");
  const error = $("#gateError");

  if (sessionStorage.getItem("bret40Unlocked") === "true") {
    unlock();
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (input.value.trim().toLowerCase() === state.data.accessCode.toLowerCase()) {
      unlock();
    } else {
      error.textContent = "Try the birthday code again.";
      input.select();
    }
  });
}

async function init() {
  await loadData();
  renderHero();
  renderStories();
  renderTrivia();
  wireGate();
}

init().catch((error) => {
  console.error(error);
  $("#gateError").textContent = "Something did not load. Refresh and try again.";
});
