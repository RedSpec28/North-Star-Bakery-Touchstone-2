"use strict";

// Two shared data structures keep product IDs, labels, and storage names consistent.
const bakeryProducts = [
  { id: "country", name: "Country bread", description: "Crusty, sliceable loaves" },
  { id: "wholegrain", name: "Whole-grain bread", description: "Hearty loaves" },
  { id: "specialty", name: "Specialty bread", description: "Seasonal bread flavors" },
  { id: "pastries", name: "Butter pastries", description: "Flaky morning favorites" },
  { id: "pastrybox", name: "Pastry box", description: "A selection to share" },
  { id: "cake", name: "Celebration cake", description: "Cakes by request" }
];
const storageKeys = {
  favorites: "northStarBakery.favorites.v1",
  requestType: "northStarBakery.requestType.v1"
};
const validationMessages = {
  name: "Please enter your name (at least 2 characters).",
  email: "Enter an email address like name@example.com.",
  requestType: "Choose a pre-order request or a general question.",
  pickupDate: "For a pre-order, choose a pickup date after today.",
  details: "Tell us what you need in at least 10 characters."
};

function getStoredValue(key) {
  try { return window.localStorage.getItem(key); }
  catch { return null; }
}
function storeValue(key, value) {
  try { window.localStorage.setItem(key, value); return true; }
  catch { return false; }
}
function getFavorites() {
  const raw = getStoredValue(storageKeys.favorites);
  if (!raw) return [];
  try {
    const ids = JSON.parse(raw);
    if (!Array.isArray(ids)) return [];
    return bakeryProducts.filter(product => ids.includes(product.id)).map(product => product.id);
  } catch { return []; }
}
function getProductById(id) { return bakeryProducts.find(product => product.id === id); }
function writeFavorites(ids) { return storeValue(storageKeys.favorites, JSON.stringify(ids)); }

function updateFavoritesPage(savedIds, announcement = "") {
  const catalog = document.getElementById("favorite-catalog");
  if (!catalog) return;
  document.getElementById("favorites-count").textContent = String(savedIds.length);
  const list = document.getElementById("favorites-list");
  list.replaceChildren();
  if (savedIds.length === 0) {
    const item = document.createElement("li");
    item.textContent = "No picks saved yet.";
    list.appendChild(item);
  } else {
    savedIds.forEach(id => {
      const product = getProductById(id);
      if (!product) return;
      const item = document.createElement("li");
      item.textContent = product.name;
      list.appendChild(item);
    });
  }
  for (const button of catalog.querySelectorAll("button[data-product-id]")) {
    const selected = savedIds.includes(button.dataset.productId);
    button.setAttribute("aria-pressed", String(selected));
    button.textContent = selected ? "Remove from saved picks" : "Save this pick";
    button.closest(".favorite-item").classList.toggle("is-saved", selected);
  }
  document.getElementById("clear-favorites").disabled = savedIds.length === 0;
  document.getElementById("favorites-note").textContent = announcement || (
    savedIds.length ? "Your choices are saved in this browser." : "Pick an item from the list to get started."
  );
}

function initializeFavoritesPage() {
  const catalog = document.getElementById("favorite-catalog");
  if (!catalog) return;
  // Build the cards from product records instead of repeating product data in HTML.
  bakeryProducts.forEach(product => {
    const card = document.createElement("div");
    card.className = "favorite-item";
    const title = document.createElement("h4");
    title.textContent = product.name;
    const description = document.createElement("p");
    description.textContent = product.description;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button button-outline";
    button.dataset.productId = product.id;
    button.setAttribute("aria-label", `Save or remove ${product.name}`);
    button.addEventListener("click", () => {
      const saved = getFavorites();
      const found = saved.includes(product.id);
      const next = found ? saved.filter(id => id !== product.id) : [...saved, product.id];
      const stored = writeFavorites(next);
      updateFavoritesPage(next, `${product.name} ${found ? "removed" : "saved"}. ${stored ? "Your choices will be here when you return." : "Browser storage is unavailable; this choice may not last."}`);
    });
    card.append(title, description, button);
    catalog.appendChild(card);
  });
  document.getElementById("clear-favorites").addEventListener("click", () => {
    const stored = writeFavorites([]);
    updateFavoritesPage([], stored ? "Saved picks cleared." : "Choices cleared for now. Browser storage is unavailable.");
  });
  const storedPicks = getFavorites();
  updateFavoritesPage(storedPicks, storedPicks.length ? "Restored your saved picks from this browser." : "Pick an item from the list to get started.");
}

function localToday() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function showFieldError(field, element, message) {
  const errorNode = document.getElementById(field);
  errorNode.textContent = message;
  if (element) element.setAttribute("aria-invalid", String(Boolean(message)));
  return message === "";
}
function validateName() {
  const field = document.getElementById("customer-name");
  return showFieldError("name-error", field, field.value.trim().length >= 2 ? "" : validationMessages.name);
}
function validateEmail() {
  const field = document.getElementById("customer-email");
  const value = field.value.trim();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
  return showFieldError("email-error", field, valid ? "" : validationMessages.email);
}
function getRequestType() { return document.querySelector('input[name="request_type"]:checked')?.value || ""; }
function validateRequestType() {
  const valid = ["pre-order", "general-question"].includes(getRequestType());
  const error = document.getElementById("type-error");
  error.textContent = valid ? "" : validationMessages.requestType;
  document.querySelectorAll('input[name="request_type"]').forEach(radio => radio.setAttribute("aria-invalid", String(!valid)));
  return valid;
}
function validatePickupDate() {
  const field = document.getElementById("pickup-date");
  const date = field.value;
  const valid = getRequestType() !== "pre-order" || (date && date > localToday());
  return showFieldError("date-error", field, valid ? "" : validationMessages.pickupDate);
}
function validateDetails() {
  const field = document.getElementById("item-details");
  return showFieldError("details-error", field, field.value.trim().length >= 10 ? "" : validationMessages.details);
}

function restoreRequestType() {
  const saved = getStoredValue(storageKeys.requestType);
  if (!["pre-order", "general-question"].includes(saved)) return;
  const radio = document.querySelector(`input[name="request_type"][value="${saved}"]`);
  if (radio) radio.checked = true;
  document.getElementById("remembered-choice").textContent = "Restored your last request type from this browser.";
}
function displaySavedPicks() {
  const ids = getFavorites();
  const summary = document.getElementById("saved-inquiry-summary");
  const addButton = document.getElementById("use-favorites");
  const names = ids.map(id => getProductById(id)?.name).filter(Boolean);
  summary.textContent = names.length ? `Saved in this browser: ${names.join(", ")}.` : "No saved picks yet. Visit Products to choose some.";
  addButton.disabled = names.length === 0;
  addButton.addEventListener("click", () => {
    const details = document.getElementById("item-details");
    const additions = names.filter(name => !details.value.toLowerCase().includes(name.toLowerCase()));
    const prefix = details.value.trim();
    details.value = [prefix, ...additions].filter(Boolean).join(prefix ? "\n" : ", ");
    details.dispatchEvent(new Event("input", { bubbles: true }));
    document.getElementById("form-status").textContent = "Your saved picks have been added. Add quantities and any questions before checking your request.";
  });
}
function initializeContactForm() {
  const form = document.getElementById("bakery-request-form");
  if (!form) return;
  form.noValidate = true; // Preserve native HTML validation if JavaScript is disabled.
  restoreRequestType();
  displaySavedPicks();
  const dateField = document.getElementById("pickup-date");
  dateField.min = localToday();
  let attempted = false;
  const checks = [validateName, validateEmail, validateRequestType, validatePickupDate, validateDetails];
  function recheck(check) {
    if (attempted) check();
    document.getElementById("form-status").textContent = "";
  }
  document.getElementById("customer-name").addEventListener("input", () => recheck(validateName));
  document.getElementById("customer-email").addEventListener("input", () => recheck(validateEmail));
  document.getElementById("item-details").addEventListener("input", () => recheck(validateDetails));
  dateField.addEventListener("change", () => recheck(validatePickupDate));
  for (const radio of form.querySelectorAll('input[name="request_type"]')) {
    radio.addEventListener("change", () => {
      const stored = storeValue(storageKeys.requestType, getRequestType());
      document.getElementById("remembered-choice").textContent = stored ? "We'll remember this request type in your browser." : "Your browser is not allowing this preference to be saved.";
      if (attempted) { validateRequestType(); validatePickupDate(); }
      document.getElementById("form-status").textContent = "";
    });
  }
  form.addEventListener("submit", event => {
    event.preventDefault(); // Student demonstration: never sends personal details.
    attempted = true;
    const results = checks.map(check => check());
    if (results.every(Boolean)) {
      document.getElementById("form-status").textContent = "Your request passed the checks. This is a class demo; nothing was sent to the bakery.";
    } else {
      document.getElementById("form-status").textContent = "Please fix the highlighted fields. Your entries are still here.";
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      firstInvalid?.focus();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initializeFavoritesPage();
  initializeContactForm();
});
