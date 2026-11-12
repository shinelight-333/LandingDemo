"use strict";

// Учебные расценки за работы. Материалы, мебель и техника считаются отдельно.
const repairOptions = {
  cosmetic: {
    label: "Косметический ремонт",
    rate: 6000,
    includes: ["Подготовка и покраска стен", "Обновление напольного покрытия", "Замена плинтусов и освещения"]
  },
  capital: {
    label: "Капитальный ремонт",
    rate: 14000,
    includes: ["Демонтаж и подготовка основания", "Новая электрика и сантехника", "Черновая и чистовая отделка"]
  },
  newbuild: {
    label: "Ремонт с нуля",
    rate: 12000,
    includes: ["Подготовка стен и пола", "Электрика и сантехника", "Чистовая отделка"]
  }
};

const housingOptions = {
  new: { label: "Новостройка", coefficient: 1 },
  secondary: { label: "Вторичное жильё", coefficient: 1.12 }
};

const upperEstimateCoefficient = 1.2;
const numberFormatter = new Intl.NumberFormat("ru-RU");
const calculator = document.querySelector("#calculator-form");
const areaInput = document.querySelector("#area");
const areaRange = document.querySelector("#area-range");
const areaError = document.querySelector("#area-error");
const estimatePrice = document.querySelector("#estimate-price");
const estimateMeta = document.querySelector("#estimate-meta");
const estimateIncludes = document.querySelector("#estimate-includes");
const estimateFormula = document.querySelector("#estimate-formula");
const estimateCta = document.querySelector("#estimate-cta");
const contactEstimate = document.querySelector("#contact-estimate");
const contactParameters = document.querySelector("#contact-parameters");
const contactForm = document.querySelector("#contact-form");
const formResult = document.querySelector("#form-result");
const nameInput = document.querySelector("#contact-name");
const phoneInput = document.querySelector("#contact-phone");
let currentEstimate = null;

function setFieldError(input, errorElement, message) {
  input.setAttribute("aria-invalid", String(Boolean(message)));
  errorElement.textContent = message;
}

function updateEstimate() {
  const housing = housingOptions[calculator.elements.housing.value];
  const repair = repairOptions[calculator.elements.repair.value];
  const area = areaInput.valueAsNumber;
  const validArea = areaInput.validity.valid && Number.isFinite(area);

  formResult.hidden = true;
  estimateCta.setAttribute("aria-disabled", String(!validArea));
  setFieldError(areaInput, areaError, validArea ? "" : "Введите целую площадь от 20 до 200 м².");

  estimateIncludes.replaceChildren(...repair.includes.map(item => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    return listItem;
  }));

  if (!validArea) {
    currentEstimate = null;
    estimatePrice.textContent = "Укажите площадь";
    estimateMeta.textContent = "Для расчёта нужно целое значение от 20 до 200 м².";
    estimateFormula.textContent = "Площадь × расценка выбранного ремонта × коэффициент типа жилья. Верхняя граница включает учебный запас 20%.";
    contactEstimate.textContent = "Уточните площадь";
    contactParameters.textContent = "Вернитесь к калькулятору, чтобы завершить расчёт.";
    return;
  }

  areaRange.value = String(area);
  const rangeProgress = (area - Number(areaRange.min)) / (Number(areaRange.max) - Number(areaRange.min)) * 100;
  areaRange.style.setProperty("--range-progress", `${rangeProgress}%`);

  const lower = Math.round(area * repair.rate * housing.coefficient);
  const upper = Math.round(lower * upperEstimateCoefficient);
  const lowerFormatted = numberFormatter.format(lower);
  const upperFormatted = numberFormatter.format(upper);
  const price = `${lowerFormatted}–${upperFormatted} ₽`;
  const parameters = `${area} м² · ${housing.label} · ${repair.label}`;
  currentEstimate = { price, parameters };

  estimatePrice.replaceChildren(
    document.createTextNode(`${lowerFormatted} —`),
    document.createElement("br"),
    document.createTextNode(`${upperFormatted} ₽`)
  );
  estimateMeta.textContent = parameters;
  estimateFormula.textContent = `${area} м² × ${numberFormatter.format(repair.rate)} ₽ × ${numberFormatter.format(housing.coefficient)}. Верхняя граница включает запас 20% для демонстрации диапазона. Коэффициент для новостройки — 1, для вторичного жилья — 1,12.`;
  contactEstimate.textContent = price;
  contactParameters.textContent = parameters;
}

function updateHousingChoices() {
  const secondaryHousing = calculator.elements.housing.value === "secondary";
  const newbuildInput = calculator.querySelector('input[name="repair"][value="newbuild"]');
  newbuildInput.disabled = secondaryHousing;

  if (secondaryHousing && newbuildInput.checked) {
    calculator.elements.repair.value = "capital";
  }

  document.querySelector("#housing-help").textContent = secondaryHousing
    ? "Для вторичного жилья доступны косметический и капитальный ремонт. В расчёте применяется учебный коэффициент 1,12."
    : "Для новостройки на этапе черновой отделки подойдёт ремонт с нуля.";
}

calculator.addEventListener("submit", event => event.preventDefault());
calculator.addEventListener("input", event => {
  if (event.target === areaRange) {
    areaInput.value = areaRange.value;
  }
  updateHousingChoices();
  updateEstimate();
});

estimateCta.addEventListener("click", event => {
  if (!currentEstimate) {
    event.preventDefault();
    areaInput.focus();
  }
});

document.querySelectorAll("[data-service]").forEach(link => {
  link.addEventListener("click", () => {
    const repair = link.dataset.service;
    if (repair === "newbuild") {
      calculator.elements.housing.value = "new";
    }
    updateHousingChoices();
    calculator.elements.repair.value = repair;
    updateEstimate();
  });
});

function validateName() {
  const name = nameInput.value.trim();
  const valid = name.length >= 2 && /\p{L}/u.test(name);
  setFieldError(nameInput, document.querySelector("#name-error"), valid ? "" : "Введите имя длиной от двух символов.");
  return valid;
}

function validatePhone() {
  const phone = phoneInput.value.trim();
  const digitCount = phone.replace(/\D/g, "").length;
  const valid = /^[+\d\s()–—-]+$/.test(phone) && digitCount >= 10 && digitCount <= 15;
  setFieldError(phoneInput, document.querySelector("#phone-error"), valid ? "" : "Укажите телефон из 10–15 цифр, например +7 (999) 123-45-67.");
  return valid;
}

nameInput.addEventListener("input", () => {
  formResult.hidden = true;
  if (nameInput.getAttribute("aria-invalid") === "true") validateName();
});

phoneInput.addEventListener("input", () => {
  formResult.hidden = true;
  if (phoneInput.getAttribute("aria-invalid") === "true") validatePhone();
});

contactForm.addEventListener("submit", event => {
  event.preventDefault();
  formResult.hidden = true;
  const nameValid = validateName();
  const phoneValid = validatePhone();

  if (!currentEstimate) {
    areaInput.focus();
    return;
  }
  if (!nameValid) {
    nameInput.focus();
    return;
  }
  if (!phoneValid) {
    phoneInput.focus();
    return;
  }

  formResult.textContent = `${nameInput.value.trim()}, демо заполнено. Ваш расчёт — ${currentEstimate.price}. ${currentEstimate.parameters}. Имя и телефон обработаны только на этой странице. Это демонстрация формы.`;
  formResult.hidden = false;
  formResult.focus({ preventScroll: true });
});

const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector("#mobile-menu");

function closeMenu() {
  mobileMenu.hidden = true;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Открыть меню");
}

menuToggle.addEventListener("click", () => {
  const expanded = menuToggle.getAttribute("aria-expanded") === "true";
  mobileMenu.hidden = expanded;
  menuToggle.setAttribute("aria-expanded", String(!expanded));
  menuToggle.setAttribute("aria-label", expanded ? "Открыть меню" : "Закрыть меню");
});

mobileMenu.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !mobileMenu.hidden) {
    closeMenu();
    menuToggle.focus();
  }
});
document.addEventListener("click", event => {
  if (!event.target.closest(".site-header")) closeMenu();
});
window.matchMedia("(min-width: 851px)").addEventListener("change", event => {
  if (event.matches) closeMenu();
});

const projects = [
  {
    image: "assets/images/living-room.jpg",
    title: "Тёплый минимализм",
    description: "62 м² · Новостройка · Интерьерная концепция, созданная с помощью ИИ",
    alt: "Гостиная с дубовым паркетом, светлым диваном и солнечным светом"
  },
  {
    image: "assets/images/kitchen.jpg",
    title: "Тихое утро",
    description: "38 м² · Вторичное жильё · Интерьерная концепция, созданная с помощью ИИ",
    alt: "Кухня с зелёными фасадами, деревянными шкафами и круглым обеденным столом"
  },
  {
    image: "assets/images/bedroom.jpg",
    title: "Мягкая классика",
    description: "84 м² · Новостройка · Интерьерная концепция, созданная с помощью ИИ",
    alt: "Светлая спальня с деревянным изголовьем, молдингами и льняным текстилем"
  }
];

const gallery = document.querySelector("#gallery-dialog");
const galleryImage = document.querySelector("#gallery-image");
let galleryIndex = 0;
let galleryOpener = null;

function showProject(index) {
  galleryIndex = (index + projects.length) % projects.length;
  const project = projects[galleryIndex];
  galleryImage.src = project.image;
  galleryImage.alt = project.alt;
  document.querySelector("#gallery-title").textContent = project.title;
  document.querySelector("#gallery-description").textContent = project.description;
  document.querySelector("#gallery-counter").textContent = `${galleryIndex + 1} / ${projects.length}`;
}

document.querySelectorAll("[data-gallery]").forEach(button => {
  button.addEventListener("click", () => {
    galleryOpener = button;
    showProject(Number(button.dataset.gallery));
    gallery.showModal();
    document.body.classList.add("modal-open");
  });
});

document.querySelector(".gallery-close").addEventListener("click", () => gallery.close());
document.querySelector("#gallery-prev").addEventListener("click", () => showProject(galleryIndex - 1));
document.querySelector("#gallery-next").addEventListener("click", () => showProject(galleryIndex + 1));
gallery.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    showProject(galleryIndex - 1);
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    showProject(galleryIndex + 1);
  }
});
gallery.addEventListener("click", event => {
  if (event.target !== gallery) return;
  const bounds = gallery.getBoundingClientRect();
  const outsideDialog = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  if (outsideDialog) gallery.close();
});
gallery.addEventListener("close", () => {
  document.body.classList.remove("modal-open");
  galleryOpener?.focus({ preventScroll: true });
});

updateHousingChoices();
updateEstimate();
