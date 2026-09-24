(() => {
  "use strict";
  const root = document.documentElement;
  const themeButton = document.querySelector(".theme-toggle");
  const preference = window.matchMedia("(prefers-color-scheme: dark)");
  let manualTheme = false;
  function setTheme(dark) {
    root.dataset.theme = dark ? "dark" : "light";
    themeButton.setAttribute(
      "aria-label",
      `Switch to ${dark ? "light" : "dark"} theme`,
    );
    document.querySelector('meta[name="theme-color"]').content = dark
      ? "#151413"
      : "#e4e2df";
  }
  setTheme(preference.matches);
  themeButton.addEventListener("click", () => {
    manualTheme = true;
    setTheme(root.dataset.theme !== "dark");
  });
  preference.addEventListener("change", (event) => {
    if (!manualTheme) setTheme(event.matches);
  });

  const list = document.querySelector("#capture-list");
  const form = document.querySelector("#capture-form");
  const input = document.querySelector("#capture-input");
  const announcement = document.querySelector("#announcement");
  const tabs = [...document.querySelectorAll("[data-collection]")];
  const initialCards = [...list.children].map((card) => card.cloneNode(true));
  let cards = [];
  let collection = "captures";
  let nextID = 0;
  const announce = (text) => {
    announcement.textContent = text;
  };

  function createEntry(element) {
    const entry = { id: ++nextID, element, archived: false };
    const button = document.createElement("button");
    button.type = "button";
    button.className = "card-archive";
    button.textContent = "✓";
    const label = element.querySelector("h3, p").textContent;
    button.setAttribute("aria-label", `Archive: ${label}`);
    button.title = "Mark done";
    button.addEventListener("click", () => {
      entry.archived = !entry.archived;
      button.textContent = entry.archived ? "↶" : "✓";
      button.title = entry.archived ? "Restore capture" : "Mark done";
      button.setAttribute(
        "aria-label",
        `${entry.archived ? "Restore" : "Archive"}: ${label}`,
      );
      render();
      announce(
        entry.archived ? "Capture moved to Archive." : "Capture restored.",
      );
      const next = list.querySelector(".card-archive");
      (next || tabs.find((tab) => tab.dataset.collection === collection)).focus(
        { preventScroll: true },
      );
    });
    element.append(button);
    return entry;
  }
  function render() {
    const archived = collection === "archive";
    const visible = cards.filter((card) => card.archived === archived);
    list.replaceChildren(...visible.map((card) => card.element));
    if (!visible.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      const symbol = document.createElement("span");
      symbol.textContent = "↳";
      empty.append(
        symbol,
        archived
          ? "A little satisfaction lives here. Mark a capture done to try it."
          : "All clear. A little room for your next thought.",
      );
      list.append(empty);
    }
    document.querySelector("#capture-count").textContent = cards.filter(
      (card) => !card.archived,
    ).length;
    document.querySelector("#archive-count").textContent = cards.filter(
      (card) => card.archived,
    ).length;
    tabs.forEach((tab) => {
      const active = tab.dataset.collection === collection;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-pressed", String(active));
    });
  }
  tabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      collection = tab.dataset.collection;
      render();
      announce(`Showing ${collection}.`);
    }),
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) {
      input.focus();
      return;
    }
    if (cards.length >= 30) {
      announce(
        "The preview holds 30 captures. Reset the preview to start again.",
      );
      return;
    }
    const card = document.createElement("article");
    card.className = "capture-card new-card";
    const meta = document.createElement("div");
    meta.className = "card-meta";
    const type = document.createElement("span");
    type.textContent = "↳ NOTE";
    const time = document.createElement("span");
    time.textContent = "JUST NOW";
    meta.append(type, time);
    const title = document.createElement("h3");
    title.textContent = text;
    card.append(meta, title);
    cards.unshift(createEntry(card));
    collection = "captures";
    render();
    list.scrollTop = 0;
    input.value = "";
    input.focus({ preventScroll: true });
    announce(
      "Thought captured. This preview is temporary and clears when you reload.",
    );
  });
  function reset() {
    cards = initialCards.map((card) => createEntry(card.cloneNode(true)));
    collection = "captures";
    input.value = "";
    render();
  }
  document.querySelector("#reset-demo").addEventListener("click", () => {
    reset();
    announce("Preview reset.");
  });
  reset();

  const copyButton = document.querySelector("#copy-install");
  let copyTimer;
  copyButton?.addEventListener("click", async () => {
    const code = document.querySelector("#install-code");
    try {
      await navigator.clipboard.writeText(code.textContent);
      copyButton.textContent = "Copied ✓";
      announce("Build commands copied.");
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection.removeAllRanges();
      selection.addRange(range);
      copyButton.textContent = "Selected";
      announce(
        "Clipboard unavailable. Build commands selected; use your copy shortcut.",
      );
    }
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copyButton.textContent = "Copy ⧉";
    }, 2500);
  });
})();
