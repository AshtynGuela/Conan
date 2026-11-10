/* ============================================================
   CONAN – Reference UI JavaScript
   Exact 1280x800 layout scaling and multi-step wizard
   ============================================================ */

"use strict";

/* ---------- utilities ---------- */
const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );

/* ---------- storage ---------- */
const mem = {};
const get = (k, d) => {
  try {
    const v = localStorage.getItem("conan." + k);
    if (v != null) return JSON.parse(v);
  } catch {}
  return k in mem ? mem[k] : d;
};
const set = (k, v) => {
  mem[k] = v;
  try { localStorage.setItem("conan." + k, JSON.stringify(v)); } catch {}
};

/* ---------- risk category ---------- */
const cat = (p) => (p < 35 ? "Low" : p <= 65 ? "Moderate" : "High");
const catClass = (c) => ({ Low: "low", Moderate: "mod", High: "high" }[c] || "low");

/* ---------- scale options (1–8 or 1–9 per field) ---------- */
const SCALE_OPTS_8 = [
  { v: 1, label: "1 – Minimal / None" },
  { v: 2, label: "2 – Very Low" },
  { v: 3, label: "3 – Low" },
  { v: 4, label: "4 – Slightly Below Moderate" },
  { v: 5, label: "5 – Moderate" },
  { v: 6, label: "6 – Slightly Above Moderate" },
  { v: 7, label: "7 – High" },
  { v: 8, label: "8 – Very High" },
];
const SCALE_OPTS_9 = [...SCALE_OPTS_8, { v: 9, label: "9 – Extreme" }];
const scaleOpts = (max) => (max >= 9 ? SCALE_OPTS_9 : SCALE_OPTS_8);

/* ---------- factor dictionary ---------- */
const FACTOR_INFO = {
  // Environmental & Genetic
  air:    { label: "Air Pollution Exposure",   desc: "How much the patient is exposed to polluted air, such as traffic fumes, smoke, or heavily polluted areas.", max: 8 },
  dust:   { label: "Dust Allergy",             desc: "How strongly the patient experiences allergy symptoms when exposed to dust.", max: 8 },
  alc:    { label: "Alcohol Consumption",      desc: "How frequently or heavily the patient consumes alcoholic drinks.", max: 8 },
  occ:    { label: "Occupational Hazards",     desc: "How much the patient's work exposes them to dust, chemicals, smoke, asbestos, or other potentially harmful substances.", max: 8 },
  fam:    { label: "Family/Genetic History",   desc: "Whether the patient may have an inherited or family-related tendency toward lung disease.", max: 7 },
  chr:    { label: "Chronic Lung Disease",     desc: "The level of long-term lung problems or disease the patient has experienced.", max: 7 },

  // Lifestyle & Body
  pas:    { label: "Secondhand Smoke Exposure", desc: "How much the patient is exposed to tobacco smoke from other people.", max: 8 },
  smk:    { label: "Smoking History",            desc: "The patient's level of tobacco-smoking exposure based on the model's scoring scale.", max: 8 },
  obes:   { label: "Obesity",                    desc: "The level of excess body weight represented by this model's scoring scale.", max: 7 },
  diet:   { label: "Balanced Diet",              desc: "How consistently the patient's diet includes a variety of nutritious foods such as vegetables, fruits, protein, and whole grains.", max: 7 },
  cold:   { label: "Frequent Colds",             desc: "How often the patient experiences colds or repeated cold-like illnesses.", max: 7 },
  snor:   { label: "Snoring",                    desc: "How frequently or severely the patient snores while sleeping.", max: 7 },

  // Clinical Symptoms
  pain:   { label: "Chest Pain",               desc: "How often or severely the patient experiences pain or discomfort in their chest.", max: 9 },
  blood:  { label: "Coughing Up Blood",        desc: "Whether the patient has noticed blood when coughing. Use the scale provided by the model.", max: 9 },
  tired:  { label: "Fatigue",                  desc: "How often or severely the patient experiences unusual tiredness or lack of energy.", max: 9 },
  wl:     { label: "Unexplained Weight Loss",  desc: "The level of unexpected weight loss that the patient has experienced.", max: 8 },
  sob:    { label: "Shortness of Breath",      desc: "How often or severely the patient experiences pain or discomfort in their chest.", max: 9 },
  wheeze: { label: "Wheezing",                 desc: "How often the patient experiences a high-pitched whistling sound when breathing.", max: 8 },
  swal:   { label: "Difficulty Swallowing",    desc: "How much difficulty the patient experiences when swallowing food or liquids.", max: 8 },
  nail:   { label: "Fingernail Changes",       desc: "The degree of rounded or enlarged fingertips/fingernails represented by the model's scale.", max: 9 },
  dry:    { label: "Dry Cough",                desc: "How often the patient experiences a cough that does not produce mucus or phlegm.", max: 7 },
};

/* ---------- multi-step wizard definitions (matching images 9-16, 20-30) ---------- */
const CLINICAL_STEPS = [
  { type: "personal", title: "PATIENT'S PERSONAL INFORMATION", btn: "NEXT→" },
  { type: "factors",  title: "ENVIRONMENTAL & GENETIC FACTORS", fields: ["air", "dust", "alc", "occ"], btn: "NEXT→" },
  { type: "factors",  title: "ENVIRONMENTAL & GENETIC FACTORS", fields: ["fam", "chr"], btn: "NEXT→" },
  { type: "factors",  title: "LIFESTYLE & BODY FACTORS", fields: ["pas", "smk", "obes", "diet"], btn: "NEXT→" },
  { type: "factors",  title: "LIFESTYLE & BODY FACTORS", fields: ["cold", "snor"], btn: "NEXT→" },
  { type: "factors",  title: "CLINICAL SYMPTOMS", fields: ["pain", "blood", "tired", "wl"], btn: "NEXT→" },
  { type: "factors",  title: "CLINICAL SYMPTOMS", fields: ["sob", "wheeze", "swal", "nail"], btn: "NEXT→" },
  { type: "factors",  title: "CLINICAL SYMPTOMS", fields: ["dry"], btn: "ANALYZE CLINICAL RISK→" },
];

const IMAGING_STEPS = [
  { type: "personal", title: "PATIENT'S PERSONAL INFORMATION", btn: "NEXT→" },
  { type: "upload",   title: "UPLOAD PATIENT'S CHEST RADIOGRAPH IMAGE", btn: "ANALYZE CHEST X-RAY→" },
];

const COMBINED_STEPS = [
  { type: "personal", title: "PATIENT'S PERSONAL INFORMATION", btn: "NEXT→" },
  { type: "factors",  title: "ENVIRONMENTAL & GENETIC FACTORS", fields: ["air", "dust", "alc", "occ"], btn: "NEXT→" },
  { type: "factors",  title: "ENVIRONMENTAL & GENETIC FACTORS", fields: ["fam", "chr"], btn: "NEXT→" },
  { type: "factors",  title: "LIFESTYLE & BODY FACTORS", fields: ["pas", "smk", "obes", "diet"], btn: "NEXT→" },
  { type: "factors",  title: "LIFESTYLE & BODY FACTORS", fields: ["cold", "snor"], btn: "NEXT→" },
  { type: "factors",  title: "CLINICAL SYMPTOMS", fields: ["pain", "blood", "tired", "wl"], btn: "NEXT→" },
  { type: "factors",  title: "CLINICAL SYMPTOMS", fields: ["sob", "wheeze", "swal", "nail"], btn: "NEXT→" },
  { type: "factors",  title: "CLINICAL SYMPTOMS", fields: ["dry"], btn: "NEXT→" },
  { type: "upload",   title: "UPLOAD PATIENT'S CHEST RADIOGRAPH IMAGE", btn: "GET COMBINED RESULT→" },
];

const TITLE = {
  clinical: "CLINICAL RISK ASSESSMENT",
  imaging:  "CHEST X-RAY ANALYSIS",
  combined: "COMBINED RISK ASSESSMENT",
};

/* ---------- app state ---------- */
let S = {
  vals: {},
  step: 0,
  mode: "clinical",
  img: null,
  imgName: "",
  imgFor: 0,
  res: null,
  saved: false,
  err: "",
  wipe: false,
  route: "",
  privacyAccepted: false,
  showPrivacy: false,
};

function resetForm(mode) {
  S.mode = mode;
  S.step = 0;
  S.img = null;
  S.imgName = "";
  S.res = null;
  S.saved = false;
  S.err = "";
  S.vals = {};
  for (const k in FACTOR_INFO) {
    S.vals[k] = 1;
  }
}

/* ---------- prediction calculations ---------- */
function predictClinical(v) {
  let t = 0, n = 0;
  for (const k in FACTOR_INFO) {
    const f = FACTOR_INFO[k];
    const val = v[k] || 1;
    t += (val - 1) / (f.max - 1);
    n++;
  }
  return n ? Math.round((t / n) * 100) : 0;
}

function predictImaging(name, img) {
  if (!img) return 20;
  let h = 0;
  const str = (name || "") + img.length;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) % 101;
  }
  return h;
}

/* ============================================================
   HEADER
   ============================================================ */
function renderHeader(route) {
  const u = get("session");
  const isLoggedIn = !!u;
  const isPreLogin = ["", "home-landing", "login", "signup"].includes(route);

  const topLinks = `
    <a href="#/about">About</a>
    <span class="nav-sep">|</span>
    <a href="#/contact">Contact</a>
    <span class="nav-sep">|</span>
    <a href="#/faq">FAQ</a>
  `;

  const hamburger = !isPreLogin
    ? `<button class="hamburger-btn" data-act="menu" aria-label="Open menu" aria-expanded="false" aria-controls="header-menu">
         <span></span><span></span><span></span>
       </button>`
    : "";

  const menuItems = isLoggedIn
    ? `<a href="#/about">About the Model</a>
       <a href="#/manual">User Manual</a>
       <a href="#/privacy-policy">Privacy Notice</a>
       <a href="#/terms">Terms &amp; Conditions</a>
       <a href="#/settings">Settings</a>
       <button data-act="signout">Sign out</button>`
    : `<a href="#/about">About the Model</a>
       <a href="#/manual">User Manual</a>
       <a href="#/privacy-policy">Privacy Notice</a>
       <a href="#/terms">Terms &amp; Conditions</a>
       <a href="#/login">Sign in</a>`;

  return `
<header>
  <a class="brand" href="${isLoggedIn ? '#/' : '#/home-landing'}">
    <span class="brand-mark"><img src="images/logo-hd.png" alt="CONAN Logo" onerror="this.src='images/logo.png'"></span>
    <div class="brand-text">
      <span class="brand-name">CONAN</span>
      <span class="brand-sub">Lung Cancer Risk Prediction System</span>
    </div>
  </a>
  <nav class="top-nav" aria-label="Main Navigation">
    <div class="${isPreLogin ? 'top-nav-box' : ''}">${topLinks}</div>
    ${hamburger}
  </nav>
  <div class="header-menu" id="header-menu" hidden>
    <a class="mobile-nav-link" href="#/contact">Contact</a>
    <a class="mobile-nav-link" href="#/faq">FAQ</a>
    ${menuItems}
  </div>
</header>`;
}

/* ============================================================
   SUB-NAV BAR (Integrated for all post-login pages)
   ============================================================ */
function renderSubnav(route) {
  const isWizard = ["clinical", "imaging", "combined"].includes(route);
  const isResults = route === "results";

  if (isWizard) {
    const backHref = S.step === 0 ? "#/assess" : "#";
    const backAttr = S.step === 0 ? "" : 'data-act="back"';
    return `
<nav class="subnav" aria-label="Assessment Navigation">
  <div class="subnav-wizard-wrap">
    <a href="${backHref}" class="subnav-back-pill" ${backAttr}>← ASSESSMENT</a>
    <span class="subnav-wizard-title">${TITLE[S.mode] || "ASSESSMENT"}</span>
  </div>
</nav>`;
  }

  if (isResults) {
    return `
<nav class="subnav" aria-label="Results Navigation">
  <div class="subnav-results-wrap">
    <a href="#/assess" class="subnav-back-pill">← Assessment</a>
    <span class="nav-sep">|</span>
    <span class="subnav-wizard-title">Results</span>
  </div>
</nav>`;
  }

  const items = [
    ["#/", "HOME", route === "home"],
    ["#/assess", "ASSESSMENT", route === "assess"],
    ["#/dashboard", "PATIENT RECORDS", route === "dashboard"],
  ];

  return `
<nav class="subnav" aria-label="Main sections">
  <div class="subnav-tabs">
    ${items.map(([href, label, active]) =>
      `<a href="${href}" class="subnav-tab ${active ? 'active' : ''}"${active ? ' aria-current="page"' : ''}>${label}</a>`
    ).join("")}
  </div>
</nav>`;
}

/* ============================================================
   LANDING PAGE (Pre-login, Exact Image 1)
   ============================================================ */
function homeLanding() {
  return `
<div class="landing">
  <!-- Feature 1: Healthcare Support -->
  <div class="landing-col">
    <div class="feature-card-content">
      <img src="images/canva/hearticon.svg" class="feature-icon-img" width="67" height="68" alt="" aria-hidden="true">
      <h2 class="feature-card-title">Healthcare Support</h2>
      <p class="feature-card-desc">CONAN assists healthcare professionals by integrating clinical risk factors and chest X-ray analysis into a structured risk assessment, supporting informed screening and further evaluation of patients.</p>
    </div>
  </div>

  <!-- Feature 2: Early Intervention -->
  <div class="landing-col bordered">
    <div class="feature-card-content">
      <img src="images/canva/ribicon.svg" class="feature-icon-img" width="68" height="68" alt="" aria-hidden="true">
      <h2 class="feature-card-title">Early Intervention</h2>
      <p class="feature-card-desc">CONAN helps organize patient information and imaging results into clear risk classifications, supporting timely identification of patients who may require further evaluation.</p>
    </div>
  </div>

  <!-- Right Panel: Headline & CTAs -->
  <div class="landing-right-panel">
    <div>
      <h1 class="landing-hero-head">SPOT THE RISK<br>BEFORE IT<br>STOPS A LIFE</h1>
      <p class="landing-hero-desc">CONAN brings lung cancer risk awareness closer to everyone, using clinical information and chest X-ray analysis to help identify potential risks earlier and encourage timely action.</p>
    </div>
    <div>
      <h2 class="landing-system-title">Lung Cancer Risk<br>Screening System</h2>
      <div class="landing-buttons-row">
        <a href="#/login" class="btn-pill-white">Log In</a>
        <a href="#/signup" class="btn-pill-mint">Create Account</a>
      </div>
    </div>
  </div>
</div>`;
}

/* ============================================================
   LOG IN (Exact Image 3)
   ============================================================ */
function login() {
  return `
<div class="auth-page">
  <div class="auth-card">
    <h1>LOG IN</h1>
    ${S.err ? `<div class="err-msg">${esc(S.err)}</div>` : ""}
    <form id="signin-form">
      <div class="auth-field">
        <input class="auth-input" id="email" aria-label="Email or mobile phone number" name="email" type="text" placeholder="Email or Mobile Phone Number" autocomplete="username" required>
      </div>
      <div class="auth-field">
        <input class="auth-input" id="pw" aria-label="Password" name="pw" type="password" placeholder="Password" autocomplete="current-password" required>
      </div>
      <button class="auth-btn-pill" type="submit">LOG IN</button>
      <button type="button" class="auth-forgot" data-act="forgot">Forgot Password?</button>
      <label class="auth-check">
        <input type="checkbox" name="remember"> Remember Me
      </label>
      <p class="auth-link">Don't have an account? <a href="#/signup">Sign Up</a></p>
    </form>
  </div>
</div>`;
}

/* ============================================================
   SIGN UP (Exact Image 2)
   ============================================================ */
function signup() {
  return `
<div class="auth-page">
  <div class="auth-card">
    <h1>SIGN UP</h1>
    ${S.err ? `<div class="err-msg">${esc(S.err)}</div>` : ""}
    <form id="signup-form">
      <div class="auth-field">
        <input class="auth-input" id="reg-email" aria-label="Email address" name="email2" type="text" placeholder="Email or Mobile Phone Number" autocomplete="username" required>
      </div>
      <div class="auth-field">
        <input class="auth-input" id="reg-pw" aria-label="Password" name="pw2" type="password" placeholder="Password" autocomplete="new-password" required>
      </div>
      <div class="auth-field">
        <input class="auth-input" id="reg-pw3" aria-label="Confirm password" name="pw3" type="password" placeholder="Confirm Password" autocomplete="new-password" required>
      </div>
      <button class="auth-btn-pill" type="submit">SIGN UP</button>
      <label class="auth-check">
        <input type="checkbox" name="remember"> Remember Me
      </label>
      <p class="auth-link">Already have an account? <a href="#/login">Log In</a></p>
    </form>
  </div>
</div>`;
}

/* ============================================================
   POST-LOGIN HOME (Exact Image 7)
   ============================================================ */
function home() {
  return `
<div class="hero-section">
  <div class="hero-left-content">
    <h1 class="hero-headline">SPOT THE RISK<br>BEFORE IT STOPS A LIFE</h1>
    <p class="hero-desc">CONAN uses clinical information and chest X-ray imaging to provide an integrated view of lung cancer risk—helping bring early risk awareness closer to every community.</p>
    <a href="#/assess" class="hero-cta-btn">GET STARTED →</a>
  </div>
  <div class="hero-ribbon-col" aria-hidden="true">
    <img src="images/canva/ribbon-hq.svg" width="872" height="520" alt="">
  </div>
</div>`;
}

/* ============================================================
   ASSESSMENT PATH SELECTION (Exact Image 8)
   ============================================================ */
function assess() {
  return `
<div class="assess-page">
  <div class="assess-page-title">CHOOSE ASSESSMENT PATH</div>
  <div class="assess-cards-grid">
    <!-- Card 1: Clinical Risk Assessment -->
    <div class="assess-option-card">
      <div class="assess-card-top">
        <img class="assess-card-icon" src="images/canva/clinical.png" width="70" height="84" alt="" aria-hidden="true">
        <h2 class="assess-card-title">Clinical Risk<br>Assessment</h2>
      </div>
      <p class="assess-card-body">Enter patient's personal information, symptoms, health history, and other relevant clinical information. CONAN analyzes 23 key risk factors to generate an estimated lung cancer risk level for professional review and clinical decision support.</p>
      <a href="#/clinical" class="assess-card-start-btn">Start Assessment</a>
    </div>

    <!-- Card 2: Chest X-Ray Analysis -->
    <div class="assess-option-card">
      <div class="assess-card-top">
        <img class="assess-card-icon" src="images/canva/radiology.png" width="70" height="84" alt="" aria-hidden="true">
        <h2 class="assess-card-title">Chest X-Ray<br>Analysis</h2>
      </div>
      <p class="assess-card-body">Upload the patient's chest x-ray for risk analysis. CONAN processes and evaluates the image for relevant radiographic patterns and generate an estimated lung cancer risk level for professional review and clinical decision support.</p>
      <a href="#/imaging" class="assess-card-start-btn">Start Assessment</a>
    </div>

    <!-- Card 3: Combined Risk Assessment -->
    <div class="assess-option-card">
      <div class="assess-card-top">
        <img class="assess-card-icon" src="images/canva/combined.png" width="70" height="84" alt="" aria-hidden="true">
        <h2 class="assess-card-title">Combined Risk<br>Assessment</h2>
      </div>
      <p class="assess-card-body">Enter the patient's clinical data and upload their chest x-ray image to generate an integrated lung cancer risk level for professional review and clinical decision support.</p>
      <a href="#/combined" class="assess-card-start-btn">Start Assessment</a>
    </div>
  </div>
</div>`;
}

/* ============================================================
   WIZARD CONTROLLER (Images 9–16, 20–30)
   ============================================================ */
function getWizardSteps() {
  if (S.mode === "imaging") return IMAGING_STEPS;
  if (S.mode === "combined") return COMBINED_STEPS;
  return CLINICAL_STEPS;
}

function wiz() {
  const steps = getWizardSteps();
  const stepIdx = Math.min(S.step, steps.length - 1);
  const cur = steps[stepIdx];

  let cardContent = "";
  if (cur.type === "personal") {
    cardContent = renderPersonalFields(cur.title, cur.btn);
  } else if (cur.type === "factors") {
    cardContent = renderFactorsStep(cur.title, cur.fields, cur.btn);
  } else if (cur.type === "upload") {
    cardContent = renderUploadStep(cur.title, cur.btn);
  }

  return `
<div class="wiz-page">
  ${S.err ? `<div class="err-msg">${esc(S.err)}</div>` : ""}
  ${cardContent}
</div>`;
}

/* Personal Information Step (Exact Images 9, 20, 22) */
function renderPersonalFields(title, btnLabel) {
  const v = S.vals;
  return `
<div class="wiz-card">
  <div class="wiz-section-label">${title}</div>
  <div class="wiz-fields-grid">
    <!-- Col 1, Row 1: Patient ID -->
    <div class="wiz-field-item">
      <label class="wiz-field-label" for="f-patientId">
        Patient ID <span class="info-circle-icon" title="Identifier">?</span>
      </label>
      <input class="wiz-input" id="f-patientId" data-wf="patientId" type="text" placeholder="Enter patient ID" value="${esc(v.patientId || "")}">
    </div>

    <!-- Col 2, Row 1: Medical Mission/Outreach Site -->
    <div class="wiz-field-item">
      <label class="wiz-field-label" for="f-site">
        Medical Mission/Outreach Site <span class="info-circle-icon" title="Site of evaluation">?</span>
      </label>
      <div class="wiz-select-wrapper">
        <select class="wiz-select" id="f-site" data-wf="site">
          <option value="" disabled ${!v.site ? "selected" : ""}>Select purpose of patient's evaluation</option>
          <option value="Screening" ${v.site === "Screening" ? "selected" : ""}>Screening</option>
          <option value="Diagnostic" ${v.site === "Diagnostic" ? "selected" : ""}>Diagnostic</option>
          <option value="Follow-up" ${v.site === "Follow-up" ? "selected" : ""}>Follow-up</option>
          <option value="Medical Mission" ${v.site === "Medical Mission" ? "selected" : ""}>Medical Mission</option>
          <option value="Other" ${v.site === "Other" ? "selected" : ""}>Other</option>
        </select>
        <span class="wiz-dropdown-arrow">▼</span>
      </div>
    </div>

    <!-- Col 1, Row 2: Sex -->
    <div class="wiz-field-item">
      <label class="wiz-field-label" for="f-sex">Sex</label>
      <div class="wiz-select-wrapper">
        <select class="wiz-select" id="f-sex" data-wf="sex">
          <option value="" disabled ${!v.sex ? "selected" : ""}>Select sex assigned at birth</option>
          <option value="Male" ${v.sex === "Male" ? "selected" : ""}>Male</option>
          <option value="Female" ${v.sex === "Female" ? "selected" : ""}>Female</option>
        </select>
        <span class="wiz-dropdown-arrow">▼</span>
      </div>
    </div>

    <!-- Col 2, Row 2: Age -->
    <div class="wiz-field-item">
      <label class="wiz-field-label" for="f-age">Age</label>
      <input class="wiz-input" id="f-age" data-wf="age" type="number" min="1" max="120" placeholder="Enter age in years" value="${esc(v.age || "")}">
    </div>

    <!-- Col 1, Row 3: Assessor -->
    <div class="wiz-field-item">
      <label class="wiz-field-label" for="f-assessor">
        Assessor <span class="info-circle-icon" title="Healthcare professional">?</span>
      </label>
      <input class="wiz-input" id="f-assessor" data-wf="assessor" type="text" placeholder="Enter expertise and professional ID" value="${esc(v.assessor || "")}">
    </div>

    <!-- Col 2, Row 3: Assessment Date -->
    <div class="wiz-field-item">
      <label class="wiz-field-label" for="f-date">Assessment Date</label>
      <input class="wiz-input" id="f-date" data-wf="date" type="text" placeholder="MM/DD/YYYY" value="${esc(v.date || new Date().toLocaleDateString('en-US'))}">
    </div>
  </div>

  <div class="wiz-card-footer">
    <button class="btn-wiz-next" data-act="next">${btnLabel}</button>
  </div>
</div>`;
}

/* Factor Fields Steps (Exact Images 10–16, 23–29) */
function renderFactorsStep(title, fields, btnLabel) {
  return `
<div class="wiz-card">
  <div class="wiz-section-label">${title}</div>
  <div class="wiz-fields-grid">
    ${fields.map((key) => renderFactorBox(key)).join("")}
  </div>
  <div class="wiz-card-footer">
    <button class="btn-wiz-next" data-act="next">${btnLabel}</button>
  </div>
</div>`;
}

function renderFactorBox(key) {
  const f = FACTOR_INFO[key];
  if (!f) return "";
  const opts = scaleOpts(f.max);
  const curVal = S.vals[key] ?? 1;

  return `
<div class="factor-item-wrap">
  <label class="factor-item-title" for="factor-${key}">${f.label}</label>
  <div class="factor-box-container">
    <div class="factor-box-desc">${esc(f.desc)}</div>
    <div class="factor-select-wrapper">
      <select class="factor-select" id="factor-${key}" data-wf="${key}">
        <option value="" disabled ${!curVal ? "selected" : ""}>Select corresponding scale rating</option>
        ${opts.map((o) => `<option value="${o.v}" ${curVal == o.v ? "selected" : ""}>${o.label}</option>`).join("")}
      </select>
      <span class="factor-dropdown-arrow">▼</span>
    </div>
  </div>
</div>`;
}

/* X-Ray Radiograph Upload Step (Exact Images 21, 30) */
function renderUploadStep(title, btnLabel) {
  return `
<div class="wiz-card wiz-upload">
  <div class="wiz-section-label">${title}</div>
  <label class="xray-drop-container" id="xray-drop" for="xray-file">
    <input class="xray-file-input" type="file" id="xray-file" accept="image/png,image/jpeg">
    ${S.img
      ? `<img class="xray-preview-img" src="${S.img}" alt="Selected chest X-ray preview">
         <p class="xray-drop-label"><strong>${esc(S.imgName)}</strong></p>
         <p class="xray-drop-sublabel">Click to choose a different image</p>`
      : `<img class="xray-landscape-graphic" src="images/canva/upload.png" alt="" aria-hidden="true">
         <p class="xray-drop-label">Drop your image here, or <strong>browse</strong></p>
         <p class="xray-drop-sublabel">Supports JPG, JPEG, PNG</p>`
    }
  </label>
  <div class="wiz-card-footer">
    <button class="btn-wiz-next" data-act="next" ${!S.img ? "disabled" : ""}>${btnLabel}</button>
  </div>
</div>`;
}

/* ============================================================
   WIZARD NAVIGATION
   ============================================================ */
function next() {
  const steps = getWizardSteps();
  S.err = "";

  // Validate personal info step
  if (S.step === 0) {
    if (!S.vals.sex) {
      S.err = "Please select the patient's sex assigned at birth.";
      return draw();
    }
    if (!S.vals.age) {
      S.err = "Please enter the patient's age.";
      return draw();
    }
  }

  // Check upload if upload step
  const cur = steps[S.step];
  if (cur.type === "upload" && !S.img) {
    S.err = "Please upload a chest radiograph image to continue.";
    return draw();
  }

  // Advance step if not final
  if (S.step < steps.length - 1) {
    S.step++;
    draw();
    return;
  }

  // Final step reached -> Compute risk
  const r = {
    id: Date.now(),
    date: new Date().toISOString(),
    patientId: S.vals.patientId || ("P-" + Math.floor(1000 + Math.random() * 9000)),
    age: S.vals.age,
    sex: S.vals.sex,
  };

  if (S.mode !== "imaging") r.pc = predictClinical(S.vals);
  if (S.mode !== "clinical") r.pi = predictImaging(S.imgName, S.img);

  r.type = S.mode === "clinical" ? "Clinical" : S.mode === "imaging" ? "X-ray" : "Combined";
  r.p = S.mode === "combined"
    ? Math.round((r.pc + r.pi) / 2)
    : S.mode === "clinical" ? r.pc : r.pi;

  r.cat = cat(r.p);
  S.res = r;
  S.saved = false;
  S.imgFor = S.mode === "clinical" ? 0 : r.id;

  location.hash = "#/results";
}

/* ============================================================
   RESULTS PAGE (Exact Images 17, 18)
   ============================================================ */
function results() {
  const r = S.res;
  if (!r) {
    return `
<div class="results-page">
  <div class="static-card">
    <h1>No Assessment Results Found</h1>
    <p>Please complete an assessment to view predicted risk and factor breakdown.</p>
    <br>
    <a href="#/assess" class="btn-wiz-next">Go to Assessments</a>
  </div>
</div>`;
  }

  const cl = catClass(r.cat);
  const confPercent = Math.min(100, Math.max(15, 100 - Math.abs(r.p - 50)));

  const breakdownFactors = [
    { icon: "👤", bg: "#d1fae5", name: "Age", sub: "Higher age increases risk", val: r.age ? `${r.age} years` : "62 years", cat: "Low" },
    { icon: "🚬", bg: "#dbeafe", name: "Smoking History", sub: "Current or former smoker", val: S.vals.smk > 3 ? "Yes" : "No", cat: r.cat },
    { icon: "🫁", bg: "#f3e8ff", name: "Coughing", sub: "Persistent cough", val: S.vals.dry > 2 || S.vals.blood > 1 ? "Yes" : "No", cat: r.cat },
    { icon: "🫁", bg: "#e0f2fe", name: "Shortness of Breath", sub: "Difficulty breathing", val: S.vals.sob > 2 ? "Yes" : "No", cat: "Low" },
    { icon: "⚡", bg: "#fae8ff", name: "Chest Pain", sub: "Pain in chest area", val: S.vals.pain > 2 ? "Yes" : "No", cat: "Low" },
    { icon: "❤️", bg: "#dbeafe", name: "Chronic Disease", sub: "Existing chronic conditions", val: S.vals.chr > 2 ? "Yes" : "No", cat: "Low" },
  ];

  return `
<div class="results-page">
  <!-- Risk Banner Card -->
  <div class="result-card-banner ${cl}">
    <div class="result-top-row">
      <div class="result-type-badge">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        ${TITLE[S.mode] || "Risk Assessment"}
      </div>
      <div class="result-pill-badge ${cl}">
        <span class="dot"></span>
        ${r.cat} Risk
      </div>
    </div>

    <div class="result-title-row">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      ${r.cat} Risk Detected
    </div>

    <p class="result-desc-text">
      The integrated analysis of your clinical information and chest X-ray image indicates a ${r.cat.toLowerCase()} probability of lung cancer. This result should be interpreted alongside other clinical information and professional medical judgment. It is not a diagnosis.
    </p>

    <div class="confidence-box">
      <div class="confidence-header">
        <span>Confidence Score</span>
        <span>${confPercent}%</span>
      </div>
      <div class="confidence-track">
        <div class="confidence-bar" style="width: ${confPercent}%"></div>
      </div>
    </div>
  </div>

  <!-- Medical Disclaimer Alert -->
  <div class="disclaimer-alert">
    <span class="disclaimer-icon">⚠️</span>
    <p><strong>Medical Disclaimer:</strong> CONAN provides screening and risk assessment support for healthcare professionals. Results are NOT a medical diagnosis and should be interpreted alongside relevant clinical information and professional medical judgment.</p>
  </div>

  <!-- Risk Factor Breakdown -->
  <div class="breakdown-section">
    <div class="breakdown-header-wrap">
      <div class="breakdown-head-title">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
          <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
          <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
        </svg>
        Risk Factor Breakdown
      </div>
      <div class="breakdown-head-sub">Clinical factors contributing to your lung cancer risk probability.</div>
    </div>

    <div class="breakdown-3col-grid">
      ${breakdownFactors.map((f) => `
        <div class="breakdown-tile">
          <div class="breakdown-tile-top">
            <div class="tile-icon-circle" style="background: ${f.bg}">${f.icon}</div>
            <div class="tile-factor-name">${f.name}</div>
            <div class="tile-badge ${catClass(f.cat)}">${f.cat} Risk</div>
          </div>
          <div class="tile-factor-sub">${f.sub}</div>
          <div class="tile-factor-val">${f.val}</div>
        </div>
      `).join("")}
    </div>
  </div>

  <!-- Actions -->
  <div class="results-action-row">
    <button class="btn-result-action primary" data-act="save">
      ${S.saved ? "✓ Saved to Records" : "💾 Save Result to Records"}
    </button>
    <a href="#/assess" class="btn-result-action secondary">Start New Assessment</a>
    <button class="btn-result-action secondary" onclick="window.print()">🖨️ Print / Export</button>
  </div>
</div>`;
}

/* ============================================================
   PATIENT RECORDS / DASHBOARD (Image 31)
   ============================================================ */
function dashboard() {
  const u = get("session");
  const hist = get("hist." + u, []);

  const total = hist.length;
  const lowCount = hist.filter((x) => x.cat === "Low").length;
  const modHighCount = total - lowCount;

  return `
<div class="dashboard-page">
  <div class="dashboard-surface">
  <div class="dashboard-stats-grid">
    <div class="dash-stat-card">
      <div class="dash-stat-label">TOTAL PATIENTS SCREENED</div>
      <div class="dash-stat-num">${total}</div>
    </div>
    <div class="dash-stat-card">
      <div class="dash-stat-label">LOW RISK CLASSIFICATIONS</div>
      <div class="dash-stat-num">${lowCount}</div>
    </div>
    <div class="dash-stat-card">
      <div class="dash-stat-label">MODERATE / HIGH RISK CASES</div>
      <div class="dash-stat-num">${modHighCount}</div>
    </div>
  </div>

  <div class="dash-table-card">
    <div class="dash-table-title">PATIENT RECORDS DATABASE</div>
    ${hist.length === 0
      ? `<p style="color: #64748b; font-size: 1rem;">No patient assessments saved yet. Complete an assessment to see records listed here.</p>`
      : `<table>
           <thead>
             <tr>
               <th>PATIENT ID</th>
               <th>DATE</th>
               <th>TYPE</th>
               <th>RISK CATEGORY</th>
               <th>ACTIONS</th>
             </tr>
           </thead>
           <tbody>
             ${hist.map((h) => `
               <tr>
                 <td><strong>${esc(h.patientId || h.id)}</strong></td>
                 <td>${new Date(h.date).toLocaleDateString()}</td>
                 <td>${h.type || "Clinical"}</td>
                 <td>
                   <span class="tile-badge ${catClass(h.cat)}">${h.cat} Risk</span>
                 </td>
                 <td>
                   <button class="subnav-back-pill" style="height:32px; padding:0 14px; font-size:0.85rem;" data-act="view" data-id="${h.id}">View</button>
                   <button class="subnav-back-pill" style="height:32px; padding:0 14px; font-size:0.85rem; background:#dc2626;" data-act="rm" data-id="${h.id}">Delete</button>
                 </td>
               </tr>
             `).join("")}
           </tbody>
         </table>`
    }
  </div>
  </div>
</div>`;
}

/* ============================================================
   PRIVACY CONSENT MODAL (Images 5, 6)
   ============================================================ */
function privacyConsentModal() {
  return `
<div class="modal-overlay" id="privacy-modal" role="dialog" aria-modal="true" aria-labelledby="privacy-modal-title">
  <div class="modal-box">
    <div class="modal-head">
      <svg class="modal-head-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <rect x="9" y="9" width="6" height="5" rx="1"/>
        <path d="M10 9V7a2 2 0 1 1 4 0v2"/>
      </svg>
      <div class="modal-head-title">
        <h2 id="privacy-modal-title" tabindex="-1">Privacy Policy &amp; Consent</h2>
        <p>Please review before using CONAN for patient assessment.</p>
      </div>
    </div>
    <div class="modal-scroll-body" tabindex="0" role="region" aria-label="Privacy policy details">
      <h3>Authorized Professional Use</h3>
      <p>CONAN is intended exclusively for healthcare professionals. Authorized users are responsible for ensuring that patient information entered into the system is obtained and handled appropriately.</p>
      <h3>Purpose of Processing</h3>
      <p>CONAN analyzes clinical information and chest X-ray images to generate a lung cancer risk assessment and provide additional information for further clinical evaluation and decision-making.</p>
      <h3>Medical Disclaimer</h3>
      <div class="modal-disclaimer-card">
        ⚠️ CONAN is a clinical decision-support and screening tool. Its results are not a definitive diagnosis and should be interpreted by a qualified healthcare professional together with other relevant clinical information.
      </div>
      <h3>Patient Data Privacy</h3>
      <p>Patient health information is sensitive personal information. Only necessary information should be entered, and the healthcare professional must ensure that appropriate patient consent or another lawful basis for processing is in place before processing the information.</p>
      <h3>Acknowledgement</h3>
      <p>By continuing, I confirm that I am an authorized healthcare professional and understand CONAN's purpose, privacy requirements, and limitations.</p>
    </div>
    <div class="modal-foot">
      <button class="btn-modal-decline" data-act="privacy-decline">Decline</button>
      <button class="btn-modal-accept" data-act="privacy-accept">I Understand &amp; Accept</button>
    </div>
  </div>
</div>`;
}

/* ============================================================
   STATIC INFORMATION PAGES
   ============================================================ */
function about() {
  return `
<div class="static-page">
  <div class="static-card">
    <h1>About CONAN</h1>
    <h2>Lung Cancer Risk Prediction &amp; Screening System</h2>
    <p>CONAN is designed to support clinicians and community outreach health missions by providing rapid, accessible risk stratification for lung cancer. The model combines 23 clinical symptoms, environmental factors, and lifestyle indicators with deep convolutional neural network analysis of chest radiographs.</p>
    <h2>Multimodal Architecture</h2>
    <p>By bringing together structured clinical health factor scales and radiographic image analysis, CONAN produces unified screening recommendations that help health teams prioritize patients for formal diagnostic workup and low-dose computed tomography (LDCT).</p>
  </div>
</div>`;
}

function manual() {
  return `
<div class="static-page">
  <div class="static-card">
    <h1>CONAN User Manual</h1>
    <h2>1. Account &amp; Privacy</h2>
    <p>Create an authorized account and review the Clinical Privacy &amp; Consent terms prior to conducting patient evaluations.</p>
    <h2>2. Choose Assessment Path</h2>
    <p>Select between Clinical Risk Assessment (23 questionnaire factors), Chest X-Ray Analysis (imaging only), or Combined Risk Assessment (multimodal analysis).</p>
    <h2>3. Complete Evaluation</h2>
    <p>Enter patient personal details, select factor scale ratings, and submit for instant stratification.</p>
  </div>
</div>`;
}

function privacyPage() {
  return `
<div class="static-page">
  <div class="static-card">
    <h1>Privacy Notice</h1>
    <p>CONAN respects all applicable patient health privacy guidelines. No patient data is shared with external commercial entities. All records are maintained within your authorized clinical database session.</p>
  </div>
</div>`;
}

function terms() {
  return `
<div class="static-page">
  <div class="static-card">
    <h1>Terms &amp; Conditions</h1>
    <p>CONAN is intended strictly as a clinical decision-support and screening aid. It is not an automated diagnostic system and must not replace professional clinical judgment.</p>
  </div>
</div>`;
}

function faq() {
  return `
<div class="static-page">
  <div class="static-card">
    <h1>Frequently Asked Questions</h1>
    <h2>What scale is used for factor ratings?</h2>
    <p>The rating scales range from 1 (Minimal / None) up to 8 or 9 (Extreme), matching standard clinical factor metrics.</p>
    <h2>What image formats are supported for X-ray analysis?</h2>
    <p>PNG and JPEG formats under 15 MB are accepted.</p>
  </div>
</div>`;
}

function contact() {
  return `
<div class="static-page">
  <div class="static-card">
    <h1>Contact Support</h1>
    <p>For research, hospital deployment, and clinical inquiry:</p>
    <p>Email: <strong>support@conan-health.org</strong></p>
    <p>Development Team: D.R. Alanib, S.F. Gojar, V.T. Gadil</p>
  </div>
</div>`;
}

function settings() {
  const u = get("session");
  return `
<div class="static-page">
  <div class="static-card">
    <h1>Account Settings</h1>
    <p>Logged in as: <strong>${esc(u || "Guest")}</strong></p>
    <br>
    <button class="btn-wiz-next" data-act="wipe">Clear Saved History</button>
    <button class="btn-wiz-next" style="background:#dc2626; margin-left:12px;" data-act="delacct">Delete Account</button>
  </div>
</div>`;
}

/* View dictionary */
const V = {
  "": homeLanding,
  "home-landing": homeLanding,
  login,
  signup,
  home,
  assess,
  clinical: wiz,
  imaging: wiz,
  combined: wiz,
  results,
  dashboard,
  about,
  manual,
  "privacy-policy": privacyPage,
  terms,
  faq,
  contact,
  settings,
};

/* ============================================================
   RENDER & ROUTER
   ============================================================ */
function draw() {
  const route = S.route || "home-landing";
  const app = $("#app");
  const pageChanged = document.body.dataset.page !== route;
  const previousStep = Number(app.dataset.step);
  const stepChanged = !pageChanged && Object.hasOwn(TITLE, route) && previousStep !== S.step;
  document.body.dataset.page = route;
  app.dataset.step = String(S.step);
  app.dataset.motion = pageChanged ? "page" : "";
  if (stepChanged) app.dataset.motion = S.step > previousStep ? "step-forward" : "step-back";
  const u = get("session");
  const isLoggedIn = !!u;
  const isPreLogin = ["home-landing", "login", "signup", ""].includes(route);

  const viewFn = V[route] || (isLoggedIn ? home : homeLanding);
  const content = viewFn();
  const privacyHtml = S.showPrivacy ? privacyConsentModal() : "";
  const subnav = (isLoggedIn && !isPreLogin) ? renderSubnav(route) : "";

  app.innerHTML =
    renderHeader(route) +
    subnav +
    `<main id="main" tabindex="-1">${content}</main>` +
    `<footer>Developed by D.R. Alanib, S.F. Gojar, V.T. Gadil · <a href="#/privacy-policy">Privacy Notice</a></footer>` +
    privacyHtml;

  if (S.showPrivacy) {
    const modal = $("#privacy-modal");
    for (const child of app.children) child.inert = child !== modal;
    $("#privacy-modal-title").focus({ preventScroll: true });
  } else if (stepChanged) {
    const heading = $(".wiz-section-label");
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    if (heading.getBoundingClientRect().top < 0) {
      heading.scrollIntoView({ block: "start", behavior: "instant" });
    }
  }
}

function route() {
  let r = location.hash.slice(2) || "";
  const u = get("session");

  if (!r) r = u ? "home" : "home-landing";
  if (r === "home" && !u) r = "home-landing";

  if (r !== S.route) {
    S.err = "";
    if (["clinical", "imaging", "combined"].includes(r)) {
      resetForm(r);
    }
    S.route = r;
  }
  draw();
  window.scrollTo(0, 0);
}

/* ============================================================
   FILE PICKER
   ============================================================ */
function pick(f) {
  if (!f) return;
  if (!/^image\/(png|jpeg)$/.test(f.type)) {
    S.err = "Please select a PNG or JPG chest radiograph image.";
    return draw();
  }
  if (f.size > 15e6) {
    S.err = "Image size exceeds 15 MB limit.";
    return draw();
  }
  const r = new FileReader();
  r.onload = () => {
    S.img = r.result;
    S.imgName = f.name;
    S.err = "";
    draw();
  };
  r.readAsDataURL(f);
}

/* ============================================================
   AUTH HELPERS
   ============================================================ */
async function hashPw(p, e) {
  try {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(e + ":" + p));
    return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
  } catch {
    return btoa(e + ":" + p);
  }
}

function afterAuth() {
  location.hash = S.res && !S.saved ? "#/results" : "#/";
}

function saveRes() {
  const u = get("session");
  if (!u || !S.res) return;
  const hist = get("hist." + u, []);
  if (!hist.some((x) => x.id === S.res.id)) {
    hist.unshift(S.res);
  }
  set("hist." + u, hist);
  S.saved = true;
  draw();
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */
document.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const d = Object.fromEntries(new FormData(f));
  const users = get("users", {});
  S.err = "";

  if (f.id === "signin-form") {
    const em = (d.email || "").trim().toLowerCase();
    const u = users[em];
    if (!u || u.h !== (await hashPw(d.pw, em))) {
      S.err = "Email or password is incorrect.";
      return draw();
    }
    set("session", em);
    S.showPrivacy = !get("privacy-ok." + em);
    if (S.showPrivacy) {
      S.privacyUser = em;
      draw();
    } else {
      afterAuth();
    }
  }

  if (f.id === "signup-form") {
    const em = (d.email2 || "").trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(em)) {
      S.err = "Please enter a valid email address.";
      return draw();
    }
    if ((d.pw2 || "").length < 6) {
      S.err = "Password must be at least 6 characters.";
      return draw();
    }
    if (d.pw2 !== d.pw3) {
      S.err = "Passwords do not match.";
      return draw();
    }
    if (users[em]) {
      S.err = "An account with this email already exists.";
      return draw();
    }
    users[em] = {
      name: em.split("@")[0],
      h: await hashPw(d.pw2, em),
    };
    set("users", users);
    set("session", em);
    S.showPrivacy = true;
    S.privacyUser = em;
    draw();
  }
});

/* Input / Change delegation */
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset.wf) S.vals[t.dataset.wf] = t.value;
  if (t.id === "xray-file") pick(t.files[0]);
});

document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.dataset.wf) S.vals[t.dataset.wf] = t.value;
});

/* Drag & Drop */
document.addEventListener("dragover", (e) => {
  const box = e.target.closest("#xray-drop");
  if (box) {
    e.preventDefault();
    box.classList.add("drag-over");
  }
});

document.addEventListener("dragleave", (e) => {
  const box = e.target.closest("#xray-drop");
  if (box) box.classList.remove("drag-over");
});

document.addEventListener("drop", (e) => {
  const box = e.target.closest("#xray-drop");
  if (box) {
    e.preventDefault();
    box.classList.remove("drag-over");
    pick(e.dataTransfer.files[0]);
  }
});

function closeHeaderMenu({ restoreFocus = false } = {}) {
  const menu = $("#header-menu");
  if (!menu || menu.hidden) return;
  menu.hidden = true;
  const toggle = $("[data-act=menu]");
  toggle?.setAttribute("aria-expanded", "false");
  if (restoreFocus) toggle?.focus();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeHeaderMenu({ restoreFocus: true });
});

/* Click delegation */
document.addEventListener("click", (e) => {
  if (!e.target.closest("#header-menu, [data-act=menu]")) {
    closeHeaderMenu();
  }

  const b = e.target.closest("[data-act]");
  if (!b) return;
  if (b.tagName === "A") e.preventDefault();
  const act = b.dataset.act;
  const id = +b.dataset.id;
  const u = get("session");

  switch (act) {
    case "menu": {
      const m = $("#header-menu");
      if (m) {
        m.hidden = !m.hidden;
        b.setAttribute("aria-expanded", String(!m.hidden));
      }
      break;
    }
    case "next":
      next();
      break;
    case "back":
      S.step = Math.max(0, S.step - 1);
      S.err = "";
      draw();
      break;
    case "privacy-accept":
      S.showPrivacy = false;
      if (S.privacyUser) set("privacy-ok." + S.privacyUser, true);
      afterAuth();
      break;
    case "privacy-decline":
      S.showPrivacy = false;
      set("session", null);
      location.hash = "#/home-landing";
      draw();
      break;
    case "forgot":
      alert("Password reset is not configured. Please contact your site administrator.");
      break;
    case "save":
      saveRes();
      break;
    case "signout":
      set("session", null);
      location.hash = "#/home-landing";
      draw();
      break;
    case "wipe":
      try {
        localStorage.removeItem("conan.hist." + u);
      } catch {}
      draw();
      break;
    case "delacct": {
      const us = get("users", {});
      delete us[u];
      set("users", us);
      try {
        localStorage.removeItem("conan.hist." + u);
      } catch {}
      set("session", null);
      location.hash = "#/home-landing";
      draw();
      break;
    }
    case "view": {
      const hist = get("hist." + u, []);
      S.res = hist.find((x) => x.id === id);
      S.saved = true;
      location.hash = "#/results";
      break;
    }
    case "rm": {
      const hist = get("hist." + u, []).filter((x) => x.id !== id);
      set("hist." + u, hist);
      draw();
      break;
    }
  }
});

/* Router listener & initialization */
window.addEventListener("hashchange", route);
route();
