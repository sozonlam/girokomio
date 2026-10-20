const FALLBACK_IMAGE = "assets/leros-home.svg";
const DEFAULT_SITE = {
  name: "Εκκλησιαστικό Γηροκομείο Λέρου",
  hero_title: "Μια αγκαλιά φροντίδας\nστην καρδιά της Λέρου",
  hero_text: "Ένας τόπος αγάπης, σεβασμού και καθημερινής φροντίδας για τους ανθρώπους της τρίτης ηλικίας.",
  hero_image: FALLBACK_IMAGE,
  welcome_title: "Ένα σπίτι γεμάτο φροντίδα",
  welcome_image: FALLBACK_IMAGE,
  welcome_text: "<p>Στο Εκκλησιαστικό Γηροκομείο Λέρου, η φροντίδα ξεκινά από μια ζεστή καλημέρα. Με σεβασμό στην ιστορία και την προσωπικότητα κάθε ανθρώπου, δημιουργούμε μια καθημερινότητα με ασφάλεια, συντροφικότητα και χαρά.</p>"
};

const DEFAULT_PAGES = [
  { id: "history", title: "Ιστορικό", text: "<p>Το Εκκλησιαστικό Γηροκομείο Λέρου αποτελεί καρπό της αγάπης και της διακονίας της τοπικής Εκκλησίας προς τους ανθρώπους της τρίτης ηλικίας. Στον όμορφο τόπο της Λέρου, συνεχίζουμε με ευγνωμοσύνη μια πορεία προσφοράς, φιλοξενίας και σεβασμού.</p>" },
  { id: "purpose", title: "Σκοπός", text: "<p>Σκοπός μας είναι να προσφέρουμε στους φιλοξενούμενους φροντίδα, ασφάλεια και συντροφικότητα σε ένα περιβάλλον που σέβεται την αξιοπρέπεια και τις ανάγκες κάθε ανθρώπου.</p><p>Μεριμνούμε για μια καθημερινότητα με ανθρώπινη επαφή, ζεστασιά και ουσιαστική παρουσία.</p>" },
  { id: "life", title: "Η ζωή στο ίδρυμα", text: "<p>Η ζωή στο ίδρυμα είναι μια κοινή καθημερινότητα με στιγμές ξεκούρασης, επικοινωνίας, δημιουργίας και πνευματικής ζωής. Κάθε άνθρωπος είναι ξεχωριστός και η φροντίδα μας προσαρμόζεται στις δικές του ανάγκες.</p>" },
  { id: "admission", title: "Εισαγωγή στο ίδρυμα", text: "<p>Για πληροφορίες σχετικά με τη διαδικασία εισαγωγής και τα απαιτούμενα δικαιολογητικά, παρακαλούμε επικοινωνήστε με τη γραμματεία του ιδρύματος.</p>" },
  { id: "administration", title: "Διοίκηση", text: "<p>Το ίδρυμα διοικείται με υπευθυνότητα και μέριμνα για την εύρυθμη λειτουργία του και την καλύτερη δυνατή φροντίδα των φιλοξενούμενων.</p>" }
];

const DEFAULT_CONTACT = {
  address: "Λέρος, Δωδεκάνησα",
  phone: "",
  email: "",
  hours: "",
  donations_title: "Στηρίξτε το έργο μας",
  donations_note: "Για πληροφορίες σχετικά με δωρεές και τραπεζικούς λογαριασμούς, επικοινωνήστε μαζί μας.",
  bank_accounts: []
};

let site = DEFAULT_SITE;
let galleries = { spaces: [], current: [], older: [], patriarch: [], presidents: [] };
let activePhotos = [];
let activePhotoIndex = 0;

async function loadJson(path, fallback) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Could not load ${path}: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(error);
    return fallback;
  }
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function safeUrl(value = "") {
  const url = String(value).trim();
  return /^(https?:\/\/|\/(?!\/)|\.{1,2}\/|[a-z0-9_-]+\/)/i.test(url) ? url : "#";
}

function markdownToHtml(markdown = "") {
  const escaped = escapeHtml(markdown);
  const inline = text => text
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, source) => `<img src="${escapeHtml(safeUrl(source))}" alt="${alt}" loading="lazy">`)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
  const blocks = escaped.trim().split(/\n\s*\n/).filter(Boolean);
  return blocks.map(block => {
    const lines = block.split("\n");
    if (lines.every(line => /^\s*[-*]\s+/.test(line))) return `<ul>${lines.map(line => `<li>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>`).join("")}</ul>`;
    const heading = block.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length + 1;
      return `<h${level}>${inline(heading[2])}</h${level}>`;
    }
    return `<p>${lines.map(inline).join("<br>")}</p>`;
  }).join("");
}

function renderRichText(markdown) {
  return markdownToHtml(markdown);
}

function setSiteContent() {
  document.querySelectorAll("[data-site]").forEach(element => {
    const key = element.dataset.site;
    element.textContent = site[key] || DEFAULT_SITE[key] || "";
  });
  document.querySelectorAll("[data-site-image]").forEach(image => {
    image.src = safeUrl(site[image.dataset.siteImage] || FALLBACK_IMAGE);
  });
  document.querySelectorAll("[data-site-rich]").forEach(element => {
    element.innerHTML = renderRichText(site[element.dataset.siteRich] || DEFAULT_SITE[element.dataset.siteRich] || "");
  });
}

function renderNavigation() {
  const nav = document.getElementById("main-nav");
  const pageLink = (id, title) => `<a class="nav-link" href="#${id}">${escapeHtml(title)}</a>`;
  nav.innerHTML = [
    pageLink("history", "Ιστορικό"),
    pageLink("purpose", "Σκοπός"),
    pageLink("life", "Η ζωή στο ίδρυμα"),
    `<div class="nav-item dropdown">${pageLink("admission", "Εισαγωγή στο ίδρυμα")}<button class="nav-toggle" aria-label="Άνοιγμα υπομενού εισαγωγής" aria-expanded="false" aria-haspopup="true"><span aria-hidden="true">⌄</span></button><div class="submenu">${pageLink("documents", "Έγγραφα εισαγωγής")}</div></div>`,
    `<div class="nav-item dropdown">${pageLink("administration", "Διοίκηση")}<button class="nav-toggle" aria-label="Άνοιγμα υπομενού διοίκησης" aria-expanded="false" aria-haspopup="true"><span aria-hidden="true">⌄</span></button><div class="submenu">${pageLink("presidents", "Πρόεδροι")}</div></div>`,
    pageLink("news", "Τα νέα μας"),
    pageLink("spaces", "Οι χώροι μας"),
    `<div class="nav-item dropdown">${pageLink("gallery", "Φωτογραφικό υλικό")}<button class="nav-toggle" aria-label="Άνοιγμα υπομενού φωτογραφικού υλικού" aria-expanded="false" aria-haspopup="true"><span aria-hidden="true">⌄</span></button><div class="submenu">${pageLink("gallery-current", "Πρόσφατες φωτογραφίες")}${pageLink("gallery-older", "Παλαιότερες φωτογραφίες")}${pageLink("gallery-patriarch", "Με τον Πατριάρχη μας")}</div></div>`,
    pageLink("contact", "Επικοινωνία")
  ].join("");
  nav.querySelectorAll(".nav-toggle").forEach(button => button.addEventListener("click", () => {
    const item = button.closest(".nav-item");
    const open = item.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(open));
  }));
  nav.querySelectorAll(".nav-link").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    nav.querySelectorAll(".nav-item").forEach(item => item.classList.remove("is-open"));
    document.querySelector(".menu-toggle").setAttribute("aria-expanded", "false");
  }));
}

function renderPages(pages, documents, presidents) {
  const container = document.getElementById("content-pages");
  container.innerHTML = pages.map(page => `<section id="${escapeHtml(page.id)}" class="content-page"><div class="content-page-inner"><span class="eyebrow">Το ίδρυμά μας</span><h2>${escapeHtml(page.title)}</h2><div class="rich-text">${renderRichText(page.text)}</div></div></section>`).join("");
  const documentSection = `<section id="documents" class="content-page"><div class="content-page-inner"><span class="eyebrow">Χρήσιμα έγγραφα</span><h2>Έγγραφα εισαγωγής</h2><p>Κατεβάστε τα απαραίτητα έγγραφα για τη διαδικασία εισαγωγής.</p><div class="document-list">${documents.length ? documents.map(item => `<a class="document-link" href="${escapeHtml(safeUrl(item.file))}" download><span>${escapeHtml(item.title)}</span><small>PDF ↓</small></a>`).join("") : '<p class="empty-state">Τα έγγραφα θα αναρτηθούν σύντομα. Για πληροφορίες, επικοινωνήστε μαζί μας.</p>'}</div></div></section>`;
  const presidentSection = `<section id="presidents" class="content-page"><div class="content-page-inner"><span class="eyebrow">Με ευγνωμοσύνη</span><h2>Πρόεδροι</h2><div class="president-grid">${presidents.length ? presidents.map(person => `<article class="president-card"><img src="${escapeHtml(safeUrl(person.image || FALLBACK_IMAGE))}" alt="${escapeHtml(person.name || "Πρόεδρος")}"><div><h3>${escapeHtml(person.name)}</h3><p>${escapeHtml(person.years || "")}</p>${person.bio ? `<p>${escapeHtml(person.bio)}</p>` : ""}</div></article>`).join("") : '<p class="empty-state">Το ιστορικό των προέδρων θα αναρτηθεί σύντομα.</p>'}</div></div></section>`;
  container.insertAdjacentHTML("beforeend", documentSection + presidentSection);
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? escapeHtml(value) : new Intl.DateTimeFormat("el-GR", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function renderPosts(posts) {
  const sorted = [...posts].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const cards = sorted.map(post => `<article class="post-card">${post.image ? `<div class="post-card-image"><img src="${escapeHtml(safeUrl(post.image))}" alt="${escapeHtml(post.title)}" loading="lazy"></div>` : ""}<div class="post-card-copy"><time class="post-date" datetime="${escapeHtml(post.date || "")}">${formatDate(post.date)}</time><h3>${escapeHtml(post.title)}</h3><p>${escapeHtml(post.summary || "")}</p>${post.body ? `<div class="rich-text">${renderRichText(post.body)}</div>` : ""}</div></article>`).join("");
  document.getElementById("latest-posts").innerHTML = cards.slice(0, 3) || '<p class="empty-state">Τα νέα και οι ανακοινώσεις μας θα αναρτηθούν σύντομα.</p>';
  document.getElementById("all-posts").innerHTML = cards || '<p class="empty-state">Τα νέα και οι ανακοινώσεις μας θα αναρτηθούν σύντομα.</p>';
}

function photoTile(photo, index) {
  const image = safeUrl(photo.image || FALLBACK_IMAGE);
  const alt = photo.alt || photo.title || "Φωτογραφία από το ίδρυμα";
  const title = photo.title || alt;
  return `<button class="photo-tile" type="button" data-photo-index="${index}" aria-label="Προβολή φωτογραφίας: ${escapeHtml(title)}"><img src="${escapeHtml(image)}" alt="${escapeHtml(alt)}" loading="lazy"><span>${escapeHtml(title)}</span></button>`;
}

function attachGallery(container, photos) {
  container.querySelectorAll(".photo-tile").forEach(button => button.addEventListener("click", () => {
    activePhotos = photos;
    activePhotoIndex = Number(button.dataset.photoIndex);
    showLightbox();
  }));
}

function renderGalleries(data) {
  galleries = { ...galleries, ...data };
  const spaces = Array.isArray(galleries.spaces) ? galleries.spaces : [];
  const spacesElement = document.getElementById("spaces-gallery");
  spacesElement.innerHTML = spaces.length ? spaces.map((photo, index) => photoTile(photo, index, spaces)).join("") : '<p class="empty-state">Οι φωτογραφίες των χώρων θα αναρτηθούν σύντομα.</p>';
  attachGallery(spacesElement, spaces);
  const groups = [
    ["gallery-current", "Πρόσφατες φωτογραφίες", galleries.current],
    ["gallery-older", "Παλαιότερες φωτογραφίες", galleries.older],
    ["gallery-patriarch", "Με τον Πατριάρχη μας", galleries.patriarch]
  ];
  const groupContainer = document.getElementById("gallery-groups");
  groupContainer.innerHTML = groups.map(([id, title, photos]) => `<section id="${id}" class="gallery-group"><h3>${escapeHtml(title)}</h3><div class="photo-grid">${photos.length ? photos.map((photo, index) => photoTile(photo, index, photos)).join("") : '<p class="empty-state">Οι φωτογραφίες θα αναρτηθούν σύντομα.</p>'}</div></section>`).join("");
  groups.forEach(([id]) => {
    const element = document.getElementById(id);
    attachGallery(element, galleries[id.replace("gallery-", "")] || []);
  });
}

function showLightbox() {
  const dialog = document.getElementById("lightbox");
  const photo = activePhotos[activePhotoIndex];
  if (!photo) return;
  dialog.querySelector("img").src = safeUrl(photo.image || FALLBACK_IMAGE);
  dialog.querySelector("img").alt = photo.alt || photo.title || "";
  dialog.querySelector("figcaption").textContent = photo.title || photo.alt || "";
  dialog.querySelector(".lightbox-count").textContent = `${activePhotoIndex + 1} / ${activePhotos.length}`;
  if (!dialog.open) dialog.showModal();
}

function renderContact(contact) {
  const lines = [
    contact.address ? `<p><strong>Διεύθυνση:</strong> ${escapeHtml(contact.address)}</p>` : "",
    contact.phone ? `<p><strong>Τηλέφωνο:</strong> <a href="tel:${escapeHtml(contact.phone.replace(/[^\d+]/g, ""))}">${escapeHtml(contact.phone)}</a></p>` : "",
    contact.email ? `<p><strong>Email:</strong> <a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a></p>` : "",
    contact.hours ? `<p><strong>Ώρες επικοινωνίας:</strong> ${escapeHtml(contact.hours)}</p>` : ""
  ].join("");
  document.getElementById("contact-copy").innerHTML = `${lines ? `<div class="footer-contact">${lines}</div>` : ""}${contact.description ? renderRichText(contact.description) : '<p>Για πληροφορίες, επισκέψεις και δωρεές, παρακαλούμε επικοινωνήστε μαζί μας.</p>'}`;
  const donations = `<h3>${escapeHtml(contact.donations_title || "Στηρίξτε το έργο μας")}</h3><p>${escapeHtml(contact.donations_note || "")}</p>${(contact.bank_accounts || []).map(account => `<div class="bank-row"><strong>${escapeHtml(account.bank || "")}</strong><span>${escapeHtml(account.account_name || "")}</span><span>${escapeHtml(account.iban || "")}</span></div>`).join("")}`;
  document.getElementById("donations").innerHTML = donations;
  document.getElementById("footer-contact").innerHTML = lines || '<p>Λέρος, Δωδεκάνησα</p><p>Στοιχεία επικοινωνίας θα αναρτηθούν σύντομα.</p>';
  document.getElementById("footer-donations").innerHTML = `<h2>Δωρεές</h2><p>${escapeHtml(contact.donations_note || "Επικοινωνήστε μαζί μας για πληροφορίες δωρεών.")}</p>${(contact.bank_accounts || []).map(account => `<p class="footer-donation"><strong>${escapeHtml(account.bank || "")}</strong><br>${escapeHtml(account.account_name || "")}<br>${escapeHtml(account.iban || "")}</p>`).join("")}`;
}

function setupInteractions() {
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.getElementById("main-nav");
  menuButton.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(open));
  });
  const dialog = document.getElementById("lightbox");
  const movePhoto = direction => {
    activePhotoIndex = (activePhotoIndex + direction + activePhotos.length) % activePhotos.length;
    showLightbox();
  };
  dialog.querySelector(".lightbox-prev").addEventListener("click", () => movePhoto(-1));
  dialog.querySelector(".lightbox-next").addEventListener("click", () => movePhoto(1));
  dialog.querySelector(".lightbox-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") movePhoto(-1);
    if (event.key === "ArrowRight") movePhoto(1);
  });
  const notice = document.getElementById("cookie-notice");
  if (!localStorage.getItem("leros-cookie-notice-dismissed")) notice.hidden = false;
  document.getElementById("cookie-dismiss").addEventListener("click", () => {
    localStorage.setItem("leros-cookie-notice-dismissed", "yes");
    notice.hidden = true;
  });
  document.querySelector('a[href="#cookie-notice"]').addEventListener("click", event => {
    event.preventDefault();
    notice.hidden = false;
    document.getElementById("cookie-dismiss").focus();
  });
}

async function initialize() {
  const [siteData, pageData, postsData, documentData, galleryData, contactData] = await Promise.all([
    loadJson("content/site.json", DEFAULT_SITE),
    loadJson("content/pages.json", { pages: DEFAULT_PAGES, presidents: [] }),
    loadJson("content/news.json", { posts: [] }),
    loadJson("content/documents.json", { documents: [] }),
    loadJson("content/galleries.json", galleries),
    loadJson("content/contact.json", DEFAULT_CONTACT)
  ]);
  site = { ...DEFAULT_SITE, ...siteData };
  setSiteContent();
  renderNavigation();
  renderPages(pageData.pages || [], documentData.documents || [], pageData.presidents || []);
  renderPosts(postsData.posts || []);
  renderGalleries(galleryData);
  renderContact({ ...DEFAULT_CONTACT, ...contactData });
  document.getElementById("year").textContent = String(new Date().getFullYear());
  setupInteractions();
}

initialize();
