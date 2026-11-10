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
  <!-- Landing headline and account actions -->
  <div class="landing-right-panel">
    <div>
      <h1 class="landing-hero-head">Spot the risk.<br><em>Before it stops a life.</em></h1>
      <p class="landing-hero-desc">A clinician-facing research demo for exploring a lung cancer screening workflow with sample data.</p>
    </div>
    <div>
      <h2 class="landing-system-title">Lung Cancer Risk Screening System</h2>
      <div class="landing-buttons-row">
        <a href="#/login" class="btn-pill-white">Log In</a>
        <a href="#/signup" class="btn-pill-mint">Create Account</a>
      </div>
      <p class="lab-demo-note">Research demo. Use sample patient data.</p>
    </div>
  </div>

  <!-- Feature 1: Healthcare Support -->
  <div class="landing-col">
    <div class="feature-card-content">
      <img src="images/canva/hearticon.svg" class="feature-icon-img" width="67" height="68" alt="" aria-hidden="true">
      <h2 class="feature-card-title">Healthcare Support</h2>
      <p class="feature-card-desc">Explore how a clinician could collect sample risk factors and review a structured screening result.</p>
    </div>
  </div>

  <!-- Feature 2: Early Intervention -->
  <div class="landing-col bordered">
    <div class="feature-card-content">
      <img src="images/canva/ribicon.svg" class="feature-icon-img" width="68" height="68" alt="" aria-hidden="true">
      <h2 class="feature-card-title">Early Intervention</h2>
      <p class="feature-card-desc">Walk through clinical, X-ray, and combined assessments using fictional patient details and sample images.</p>
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
    <form id="signin-form" novalidate>
      <div class="err-msg" data-auth-error role="alert" hidden></div>
      <div class="auth-field">
        <input class="auth-input" id="email" aria-label="Email or mobile phone number" aria-describedby="email-error" name="email" type="text" placeholder="Email or Mobile Phone Number" autocomplete="username" autocapitalize="none" spellcheck="false" required>
        <p class="auth-feedback" id="email-error" aria-live="polite"></p>
      </div>
      <div class="auth-field">
        <input class="auth-input" id="pw" aria-label="Password" aria-describedby="pw-error" name="pw" type="password" placeholder="Password" autocomplete="current-password" required>
        <p class="auth-feedback" id="pw-error" aria-live="polite"></p>
      </div>
      <button class="auth-btn-pill" type="submit">LOG IN</button>
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
    <form id="signup-form" novalidate>
      <div class="err-msg" data-auth-error role="alert" hidden></div>
      <div class="auth-field">
        <input class="auth-input" id="reg-email" aria-label="Email or mobile phone number" aria-describedby="reg-email-error" name="email2" type="text" placeholder="Email or Mobile Phone Number" autocomplete="username" autocapitalize="none" spellcheck="false" required>
        <p class="auth-feedback" id="reg-email-error" aria-live="polite"></p>
      </div>
      <div class="auth-field">
        <input class="auth-input" id="reg-pw" aria-label="Password" aria-describedby="reg-pw-error" name="pw2" type="password" placeholder="Password" autocomplete="new-password" required>
        <p class="auth-feedback" id="reg-pw-error" aria-live="polite"></p>
      </div>
      <div class="auth-field">
        <input class="auth-input" id="reg-pw3" aria-label="Confirm password" aria-describedby="reg-pw3-error" name="pw3" type="password" placeholder="Confirm Password" autocomplete="new-password" required>
        <p class="auth-feedback" id="reg-pw3-error" aria-live="polite"></p>
      </div>
      <button class="auth-btn-pill" type="submit">SIGN UP</button>
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
    <h1 class="hero-headline">Spot the risk.<br><em>Before it stops a life.</em></h1>
    <p class="hero-desc">Explore a lung cancer screening workflow using sample clinical information and chest X-ray images. This research demo produces simulated results.</p>
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
  <h1 class="assess-page-title">Choose an assessment path</h1>
  <div class="assess-cards-grid">
    <!-- Card 1: Clinical Risk Assessment -->
    <div class="assess-option-card">
      <div class="assess-card-top">
        <img class="assess-card-icon" src="images/canva/clinical.png" width="70" height="84" alt="" aria-hidden="true">
        <h2 class="assess-card-title">Clinical Risk<br>Assessment</h2>
      </div>
      <p class="assess-card-body">Work through a questionnaire on symptoms, health history, and clinical risk factors.</p>
      <a href="#/clinical" class="assess-card-start-btn">Start clinical assessment</a>
    </div>

    <!-- Card 2: Chest X-Ray Analysis -->
    <div class="assess-option-card">
      <div class="assess-card-top">
        <img class="assess-card-icon" src="images/canva/radiology.png" width="70" height="84" alt="" aria-hidden="true">
        <h2 class="assess-card-title">Chest X-Ray<br>Analysis</h2>
      </div>
      <p class="assess-card-body">Upload a sample chest X-ray and see how an imaging result would be presented.</p>
      <a href="#/imaging" class="assess-card-start-btn">Start X-ray assessment</a>
    </div>

    <!-- Card 3: Combined Risk Assessment -->
    <div class="assess-option-card">
      <div class="assess-card-top">
        <img class="assess-card-icon" src="images/canva/combined.png" width="70" height="84" alt="" aria-hidden="true">
        <h2 class="assess-card-title">Combined Risk<br>Assessment</h2>
      </div>
      <p class="assess-card-body">Complete the clinical questionnaire and upload a sample X-ray in one workflow.</p>
      <a href="#/combined" class="assess-card-start-btn">Start combined assessment</a>
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
  <div class="lab-progress">
    <span>Step ${stepIdx + 1} of ${steps.length}</span>
    <progress value="${stepIdx + 1}" max="${steps.length}" aria-label="Assessment progress"></progress>
  </div>
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
  const score = Math.min(100, Math.max(0, Number(r.p) || 0));
  const inputs = [["Clinical questionnaire", r.pc], ["Sample X-ray", r.pi]];

  return `
<div class="results-page">
  <h1 class="lab-page-title">Assessment result</h1>
  <section class="result-card-banner ${cl}" aria-label="Simulated assessment score">
    <div class="result-top-row">
      <span class="result-type-badge">${esc(r.type || "Assessment")}</span>
      <span class="result-pill-badge ${cl}">${esc(r.cat)} category</span>
    </div>
    <p class="result-title-row">${score} <span class="lab-score-unit">/ 100</span></p>
    <div class="confidence-track" aria-hidden="true">
      <div class="confidence-bar" style="width: ${score}%"></div>
    </div>
    <p class="result-desc-text">Simulated score for the research demo. It does not measure the likelihood of lung cancer.</p>
  </section>
  <section class="breakdown-section" aria-labelledby="demo-inputs">
    <h2 class="breakdown-head-title" id="demo-inputs">Scores used in this demo</h2>
    <dl class="lab-score-list">
      ${inputs.filter(([, value]) => Number.isFinite(value)).map(([label, value]) => `
        <div><dt>${label}</dt><dd>${value} / 100</dd></div>`).join("")}
    </dl>
  </section>
  <div class="results-action-row">
    <button class="btn-result-action primary" data-act="save" ${S.saved ? "disabled" : ""}>${S.saved ? "Saved to records" : "Save result"}</button>
    <a href="#/assess" class="btn-result-action secondary">Start new assessment</a>
    <button class="btn-result-action secondary" onclick="window.print()">Print / export</button>
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
  <h1 class="lab-page-title">Patient records</h1>
  <div class="dashboard-surface">
  <div class="dashboard-stats-grid">
    <div class="dash-stat-card">
      <div class="dash-stat-label">SAVED ASSESSMENTS</div>
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
    <h2 class="dash-table-title">Saved assessments</h2>
    ${hist.length === 0
      ? `<p class="lab-empty">No assessments saved yet. Complete an assessment and save its result to see it here.</p><a href="#/assess" class="btn-wiz-next">Choose an assessment</a>`
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
                   <div class="lab-record-actions">
                     <button class="subnav-back-pill" data-act="view" data-id="${h.id}">View</button>
                     <button class="subnav-back-pill lab-danger" data-act="rm" data-id="${h.id}">Delete</button>
                   </div>
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
      <p>This research demo uses questionnaire responses and a sample image to demonstrate the assessment workflow. Use fictional patient details and sample images.</p>
      <h3>Medical Disclaimer</h3>
      <div class="modal-disclaimer-card">
        This demo produces simulated scores. They cannot be used for screening, diagnosis, or clinical decisions.
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
    <p>CONAN is a research demo of a clinician-facing lung cancer screening workflow. It shows how questionnaire responses and chest X-ray uploads can fit into one assessment.</p>
    <h2>What this version demonstrates</h2>
    <p>Try the clinical, imaging, or combined path with sample data. Each path produces a simulated result that you can save and revisit in this browser.</p>
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
    <p>This demo saves accounts and assessment records in this browser’s local storage. Use fictional patient details and sample images. You can clear your saved history in Account Settings.</p>
  </div>
</div>`;
}

function terms() {
  return `
<div class="static-page">
  <div class="static-card">
    <h1>Terms &amp; Conditions</h1>
    <p>This version of CONAN is for research demonstrations with sample data. Its simulated scores cannot be used for screening, diagnosis, or clinical decisions.</p>
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
    <div class="lab-settings-actions">
      <button class="btn-wiz-next" data-act="wipe">Clear saved history</button>
      <button class="btn-wiz-next lab-danger" data-act="delacct">Delete account</button>
    </div>
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

function normalizeAccountId(value) {
  const identifier = value.trim().toLowerCase();
  if (/^\S+@\S+\.\S+$/.test(identifier)) return identifier;

  const phone = identifier.replace(/[\s().-]/g, "").replace(/^00/, "+");
  if (/^09\d{9}$/.test(phone)) return "+63" + phone.slice(1);
  if (/^639\d{9}$/.test(phone)) return "+" + phone;
  if (phone.startsWith("+63")) return /^\+639\d{9}$/.test(phone) ? phone : "";
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : "";
}

function authInputError(input) {
  if (input.type === "text") {
    if (!input.value.trim()) return "Enter your email or mobile number.";
    return normalizeAccountId(input.value) ? "" : "Enter a valid email or mobile number, such as 0917 123 4567.";
  }
  if (input.name === "pw3") {
    if (!input.value) return "Confirm your password.";
    return input.value === input.form.elements.pw2.value ? "" : "Passwords do not match.";
  }
  if (!input.value) return "Enter your password.";
  return input.value.length < 6 ? "Password must be at least 6 characters." : "";
}

function validateAuthInput(input) {
  const error = authInputError(input);
  const feedback = document.getElementById(input.id + "-error");
  if (feedback.textContent !== error) feedback.textContent = error;
  if (error) input.setAttribute("aria-invalid", "true");
  else input.removeAttribute("aria-invalid");
  return !error;
}

function setAuthError(form, message) {
  const alert = form.querySelector("[data-auth-error]");
  alert.hidden = !message;
  alert.textContent = message;
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */
document.addEventListener("submit", async (e) => {
  const form = e.target;
  if (!form.matches("#signin-form, #signup-form")) return;
  e.preventDefault();
  const submit = form.querySelector('[type="submit"]');
  if (submit.disabled) return;

  setAuthError(form, "");
  const invalid = Array.from(form.querySelectorAll(".auth-input")).filter(input => !validateAuthInput(input));
  if (invalid.length) {
    invalid[0].focus();
    return;
  }

  const signup = form.id === "signup-form";
  const identifier = form.elements[signup ? "email2" : "email"];
  const password = form.elements[signup ? "pw2" : "pw"];
  const id = normalizeAccountId(identifier.value);
  const enteredPassword = password.value;
  submit.disabled = true;

  try {
    const hash = await hashPw(enteredPassword, id);
    if (!form.isConnected || normalizeAccountId(identifier.value) !== id || password.value !== enteredPassword) return;
    if (signup && !validateAuthInput(form.elements.pw3)) return;

    const users = get("users", {});
    if (signup) {
      if (users[id]) {
        setAuthError(form, "An account with this email or mobile number already exists. Log in instead.");
        return;
      }
      users[id] = { name: id.split("@")[0], h: hash };
      set("users", users);
    } else if (users[id]?.h !== hash) {
      setAuthError(form, "The email, mobile number, or password is incorrect.");
      return;
    }

    set("session", id);
    S.showPrivacy = signup || !get("privacy-ok." + id);
    if (S.showPrivacy) {
      S.privacyUser = id;
      draw();
    } else {
      afterAuth();
    }
  } finally {
    submit.disabled = false;
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
  if (!t.matches(".auth-input")) return;
  setAuthError(t.form, "");
  validateAuthInput(t);
  if (t.name === "pw2") {
    const confirmation = t.form.elements.pw3;
    if (confirmation.value || confirmation.hasAttribute("aria-invalid")) validateAuthInput(confirmation);
  }
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
