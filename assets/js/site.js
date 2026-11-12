/*
 * IIRLab website
 * 각 페이지는 data/*.yml 파일을 읽어서 내용을 그립니다.
 * 내용 수정은 data 폴더의 yml 파일만 고치면 됩니다.
 */

const NAV = [
  { href: "index.html", label: "Home", page: "home" },
  { href: "research.html", label: "Research", page: "research" },
  { href: "people.html", label: "People", page: "people" },
  { href: "publications.html", label: "Publications", page: "publications" },
  { href: "projects.html", label: "Projects", page: "projects" },
  { href: "equipment.html", label: "Equipment", page: "equipment" },
  { href: "awards.html", label: "Awards", page: "awards" },
  { href: "contact.html", label: "Contact", page: "contact" },
];

// 논문 저자 목록에서 굵게 표시할 이름
const PI_NAMES = ["Young Jin Park", "Youngjin Park", "YoungJin Park", "박영진"];

const ICONS = {
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.1-7-12a7 7 0 0 1 14 0c0 5.9-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>',
};

/* ---------- helpers ---------- */

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const $ = (sel) => document.querySelector(sel);

async function loadData(name) {
  const res = await fetch(`data/${name}.yml`, { cache: "no-cache" });
  if (!res.ok) throw new Error(`data/${name}.yml (${res.status})`);
  // CORE_SCHEMA: 날짜를 Date 객체로 바꾸지 않고 문자열로 유지
  return jsyaml.load(await res.text(), { schema: jsyaml.CORE_SCHEMA });
}

function formatDate(d) {
  return String(d ?? "").replace(/-/g, ". ");
}

function highlightAuthors(authors) {
  let html = esc(authors);
  for (const n of PI_NAMES) html = html.split(esc(n)).join(`<b>${esc(n)}</b>`);
  return html;
}

function initials(name) {
  const s = String(name).trim();
  if (/[가-힣]/.test(s[0])) return s.length >= 3 ? s.slice(1, 3) : s;
  return s.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

/* ---------- layout ---------- */

function renderHeader(site, page) {
  const links = NAV.map(
    (n) => `<a href="${n.href}"${n.page === page ? ' class="active" aria-current="page"' : ""}>${n.label}</a>`
  ).join("");
  $("#site-header").outerHTML = `
    <header class="site-header">
      <div class="container">
        <a class="logo" href="index.html"><img src="assets/img/logo.png" alt="IIRLab — ${esc(site.full_name)}"><small>${esc(site.full_name_ko)}</small></a>
        <button class="nav-toggle" aria-label="메뉴 열기" aria-expanded="false">${ICONS.menu}</button>
        <nav class="nav">${links}</nav>
      </div>
    </header>`;
  const btn = $(".nav-toggle");
  btn.addEventListener("click", () => {
    const open = $(".nav").classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
  });
}

function renderFooter(site) {
  const c = site.contact;
  $("#site-footer").outerHTML = `
    <footer class="site-footer">
      <div class="container">
        <div>
          <img class="footer-logo" src="assets/img/logo-white.png" alt="IIRLab">
          <p>${esc(site.full_name_ko)}</p>
          <p>${esc(site.affiliation)}</p>
        </div>
        <div>
          <p>${esc(c.address_ko)}</p>
          <p>${esc(c.phone)} · <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>
        </div>
        <div class="copy">© ${new Date().getFullYear()} IIRLab, Gyeongsang National University · <a href="admin/">관리자</a></div>
      </div>
    </footer>`;
}

/* ---------- shared blocks ---------- */

function newsItemHTML(n) {
  const date = formatDate(n.date) + (n.end_date ? ` – ${formatDate(n.end_date)}` : "");
  const media = [];
  if (n.image) media.push(`<img src="${esc(n.image)}" alt="${esc(n.title)}" loading="lazy">`);
  if (n.video) media.push(`<div class="embed"><iframe src="${esc(n.video)}" allow="autoplay; fullscreen" loading="lazy" title="${esc(n.title)}"></iframe></div>`);
  return `
    <article class="news-item">
      <div class="date">${esc(date)}</div>
      <div>
        <h3>${esc(n.title)}</h3>
        ${n.body ? `<p>${esc(n.body)}</p>` : ""}
        ${media.length ? `<div class="news-media">${media.join("")}</div>` : ""}
      </div>
    </article>`;
}

function pubItemHTML(p, idx) {
  const link = p.link || (p.doi ? `https://doi.org/${p.doi}` : "");
  return `
    <li class="pub" data-search="${esc([p.authors, p.title, p.title_en, p.venue, p.year].join(" ").toLowerCase())}">
      <span class="idx">${idx}</span>
      <div>
        <div class="title">${esc(p.title)}</div>
        ${p.title_en ? `<div class="title-en">${esc(p.title_en)}</div>` : ""}
        <div class="authors">${highlightAuthors(p.authors)}</div>
        <div class="venue">${esc(p.venue)}${p.year ? `, ${esc(p.year)}` : ""}${link ? `<a href="${esc(link)}" target="_blank" rel="noopener">${p.doi ? "DOI" : "Link"}</a>` : ""}</div>
      </div>
    </li>`;
}

function demoCardHTML(d, areaTitles = {}) {
  return `
    <button class="demo${d.portrait ? "" : " wide"}" data-demo="${esc(d.id)}" aria-label="${esc(d.title)} 영상 재생">
      <img src="${esc(d.poster)}" alt="" loading="lazy">
      <span class="play">${ICONS.play}</span>
      <span class="meta">${areaTitles[d.area] ? `<span>${esc(areaTitles[d.area])}</span>` : ""}<b>${esc(d.title)}</b></span>
    </button>`;
}

// 데모 카드를 누르면 큰 화면으로 재생
function setupLightbox(demos) {
  if (!$(".lightbox")) {
    document.body.insertAdjacentHTML("beforeend", `
      <div class="lightbox" role="dialog" aria-modal="true" aria-label="데모 영상">
        <button class="close" aria-label="닫기">×</button>
        <div class="box"><video controls playsinline></video><h3></h3><p></p></div>
      </div>`);
  }
  const lb = $(".lightbox");
  const video = lb.querySelector("video");
  const close = () => { video.pause(); video.removeAttribute("src"); video.load(); lb.classList.remove("open"); };
  lb.querySelector(".close").onclick = close;
  lb.onclick = (e) => { if (e.target === lb) close(); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && lb.classList.contains("open")) close(); });

  document.querySelectorAll("[data-demo]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const d = demos.find((x) => x.id === btn.dataset.demo);
      if (!d) return;
      video.poster = d.poster || "";
      video.src = d.video;
      lb.querySelector("h3").textContent = d.title;
      lb.querySelector("p").textContent = d.caption || "";
      lb.classList.add("open");
      video.play().catch(() => {});
    });
  });
}

/* ---------- pages ---------- */

const pages = {
  async home(site) {
    const [research, demos, pubs, projects] = await Promise.all([
      loadData("research"), loadData("demos"), loadData("publications"), loadData("projects"),
    ]);
    const name = esc(site.full_name).replace(/\b([IR])(?=\w)/g, '<span class="initial">$1</span>');
    const areaTitles = Object.fromEntries(research.areas.map((a) => [a.id, a.title]));
    const count = (...keys) => keys.reduce((s, k) => s + (pubs[k] || []).length, 0);
    const stats = [
      { value: count("international_journal", "domestic_journal", "international_conference", "domestic_conference"), label: "Publications", href: "publications.html" },
      { value: count("patents_granted", "patents_applied", "patents_domestic"), label: "Patents", href: "publications.html#patents" },
      { value: (projects.current || []).length, label: "Ongoing Projects", href: "projects.html" },
    ];

    $("#content").innerHTML = `
      <section class="hero">
        <div class="container">
          <div class="hero-text">
            <span class="headline">${esc(site.headline)}</span>
            <h1>${name}</h1>
            <p class="ko">${esc(site.full_name_ko)}</p>
            <p class="aff">${esc(site.affiliation)}</p>
            <p class="lead">${esc(site.tagline)}</p>
            <div class="btn-row">
              <a class="btn btn-primary" href="research.html">Our Research</a>
              <a class="btn btn-ghost" href="#demos">Open Lab Demos</a>
            </div>
          </div>
          <div class="hero-panel">
            <p class="panel-label">Research Focus</p>
            ${research.areas.map((a, i) => `
              <a class="focus-item" href="research.html#${esc(a.id)}">
                <span class="area-index">${String(i + 1).padStart(2, "0")}</span>
                <span><b>${esc(a.title)}</b><small>${esc(a.title_ko)}</small></span>
              </a>`).join("")}
            <div class="hero-stats">
              ${stats.map((s) => `<a href="${s.href}"><b>${s.value}</b><span>${s.label}</span></a>`).join("")}
            </div>
          </div>
        </div>
      </section>

      <section class="section soft">
        <div class="container">
          <div class="section-head">
            <div><p class="eyebrow">Research</p><h2>What we work on</h2></div>
            <a class="more-link" href="research.html">All research</a>
          </div>
          <div class="grid grid-3">
            ${research.areas.map((a, i) => `
              <article class="card area-card">
                <a class="card-link" href="research.html#${esc(a.id)}">
                  ${a.cover ? `<div class="thumb" style="background-image:url('${esc(a.cover)}')"></div>` : ""}
                  <div class="card-body">
                    <span class="area-index">${String(i + 1).padStart(2, "0")}</span>
                    <h3>${esc(a.title)}</h3>
                    <p class="muted" style="margin:0">${esc(a.title_ko)}</p>
                  </div>
                </a>
              </article>`).join("")}
          </div>
        </div>
      </section>

      <section class="section" id="demos">
        <div class="container">
          <div class="section-head">
            <div><p class="eyebrow">Open Lab</p><h2>Demo Videos</h2></div>
            <span class="muted">영상을 누르면 크게 재생됩니다</span>
          </div>
          <div class="demo-grid">${demos.map((d) => demoCardHTML(d, areaTitles)).join("")}</div>
        </div>
      </section>

      <section class="section" style="padding-top:0">
        <div class="container">
          <div class="join-band">
            <div>
              <h2>${esc(site.recruit.title)}</h2>
              <p>${esc(site.recruit.body)}</p>
            </div>
            <a class="btn btn-primary" href="mailto:${esc(site.contact.email)}">${esc(site.contact.email)}</a>
          </div>
        </div>
      </section>`;
    setupLightbox(demos);
  },

  async news() {
    const news = await loadData("news");
    $("#content").innerHTML = `<div class="container section"><div class="news-list">${news.map(newsItemHTML).join("")}</div></div>`;
  },

  async research() {
    const [{ areas }, demos] = await Promise.all([loadData("research"), loadData("demos")]);
    const num = (i) => String(i + 1).padStart(2, "0");

    const overview = `
      <section class="area-overview">
        <div class="container">
          <div class="overview-grid">
            ${areas.map((a, i) => `
              <a class="overview-card" href="#${esc(a.id)}">
                <span class="area-index">${num(i)}</span>
                <b>${esc(a.title)}</b>
                <span>${esc(a.title_ko)}</span>
              </a>`).join("")}
          </div>
        </div>
      </section>`;

    const areaHTML = (a, i) => {
      const areaDemos = demos.filter((d) => d.area === a.id);
      return `
      <section class="area${i % 2 ? " alt" : ""}" id="${esc(a.id)}">
        <div class="container">
          <div class="area-intro">
            <div class="area-text">
              <p class="eyebrow">Research ${num(i)}</p>
              <h2>${esc(a.title)}</h2>
              <div class="ko-title">${esc(a.title_ko)}</div>
              <p class="summary">${esc(a.summary)}</p>
              ${a.highlights ? `<div class="highlights">${a.highlights.map((h) => `<div class="highlight"><b>${esc(h.value)}</b><span>${esc(h.label)}</span></div>`).join("")}</div>` : ""}
            </div>
            ${a.cover ? `<div class="area-cover"><img src="${esc(a.cover)}" alt="${esc(a.title)}" loading="lazy"></div>` : ""}
          </div>

          <h3 class="block-title">Research Topics</h3>
          <ol class="topic-grid">${(a.topics || []).map((t) => `<li>${esc(t)}</li>`).join("")}</ol>

          ${a.figures ? `
            <h3 class="block-title">Figures</h3>
            <div class="figures">${a.figures.map((f) => `
              <figure${f.photo ? ' class="photo"' : ""}><img src="${esc(f.src)}" alt="${esc(f.caption)}" loading="lazy"><figcaption>${esc(f.caption)}</figcaption></figure>`).join("")}
            </div>` : ""}

          ${areaDemos.length ? `
            <h3 class="block-title">Demo Videos</h3>
            <div class="demo-grid">${areaDemos.map((d) => demoCardHTML(d)).join("")}</div>` : ""}

          ${a.video ? `
            <div class="figures"><figure><div class="embed" style="border-radius:0"><iframe src="${esc(a.video)}" allow="autoplay; fullscreen" loading="lazy" title="${esc(a.video_caption || a.title)}"></iframe></div>${a.video_caption ? `<figcaption>${esc(a.video_caption)}</figcaption>` : ""}</figure></div>` : ""}
        </div>
      </section>`;
    };

    $("#content").innerHTML = overview + areas.map(areaHTML).join("");
    setupLightbox(demos);
  },

  async people() {
    const { professor: p, members, alumni } = await loadData("people");
    const memberCard = (m) => `
      <article class="card member">
        <div class="avatar">${esc(initials(m.name))}${m.photo ? `<img src="${esc(m.photo)}" alt="${esc(m.name)}" loading="lazy" onerror="this.remove()">` : ""}</div>
        <h3>${esc(m.name)}</h3>
        ${m.name_alt ? `<div class="alt">${esc(m.name_alt)}</div>` : ""}
        ${m.email ? `<a class="email" href="mailto:${esc(m.email)}">${esc(m.email)}</a>` : ""}
        ${m.interests ? `<div class="tags">${m.interests.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : ""}
        ${m.cv ? `<details><summary>CV</summary><ul>${m.cv.map((c) => {
          const [period, text] = String(c).split(" | ");
          return `<li>${text ? `${esc(text)}<br><span class="muted">${esc(period)}</span>` : esc(period)}</li>`;
        }).join("")}</ul></details>` : ""}
      </article>`;

    $("#content").innerHTML = `
      <section class="section">
        <div class="container">
          <div class="prof">
            <div class="prof-photo${p.photo ? "" : " placeholder"}" style="${p.photo ? `background-image:url('${esc(p.photo)}')` : ""}" role="img" aria-label="${esc(p.name)}">${p.photo ? "" : esc(initials(p.name))}</div>
            <div>
              <p class="eyebrow">Principal Investigator</p>
              <h2>Prof. ${esc(p.name)} <span class="muted" style="font-weight:500;font-size:1.1rem">${esc(p.name_ko)}</span></h2>
              <div class="role">${esc(p.title)} · ${esc(p.department)}</div>
              <ul class="contact-list">
                <li>${ICONS.mail}<a href="mailto:${esc(p.email)}">${esc(p.email)}</a></li>
                <li>${ICONS.phone}${esc(p.phone)}</li>
                <li>${ICONS.pin}${esc(p.office)}</li>
              </ul>
              <div class="prof-cols">
                <div>
                  <h4>Research Fields</h4>
                  ${p.research_fields.map((f) => `<div class="field-group"><strong>${esc(f.title)}</strong><ul>${f.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("")}
                </div>
                <div>
                  <h4>Education</h4>
                  <ul class="timeline">${p.education.map((e) => `<li><span class="period">${esc(e.period)}</span><span>${esc(e.title)}${e.note ? `<span class="note">${esc(e.note)}</span>` : ""}</span></li>`).join("")}</ul>
                  <h4>Employment</h4>
                  <ul class="timeline">${p.employment.map((e) => `<li><span class="period">${esc(e.period)}</span><span>${esc(e.title)}</span></li>`).join("")}</ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section soft">
        <div class="container">
          <p class="eyebrow">Members</p><h2>Current Members</h2>
          ${members.map((g) => `
            <h3 class="group-title">${esc(g.group)}</h3>
            <div class="grid grid-3">${g.people.map(memberCard).join("")}</div>`).join("")}
        </div>
      </section>

      <section class="section">
        <div class="container">
          <p class="eyebrow">Alumni</p><h2>Alumni</h2>
          <table class="alumni-table">
            <thead><tr><th>Name</th><th>Degree</th><th>Current Affiliation</th></tr></thead>
            <tbody>
              ${alumni.flatMap((g) => g.people.map((a) => `<tr><td>${esc(a.name)}</td><td class="muted">${esc(g.group)}</td><td>${a.affiliation ? esc(a.affiliation) : '<span class="muted">—</span>'}</td></tr>`)).join("")}
            </tbody>
          </table>
        </div>
      </section>`;
  },

  async publications() {
    const d = await loadData("publications");
    const sections = [
      { id: "intl-journal", title: "International Journals", items: d.international_journal },
      { id: "dom-journal", title: "Domestic Journals", items: d.domestic_journal },
      { id: "intl-conf", title: "International Conferences", items: d.international_conference },
      { id: "dom-conf", title: "Domestic Conferences", items: d.domestic_conference },
    ];
    const patents = [
      { title: "US Patents · Granted", items: d.patents_granted || [] },
      { title: "US Patents · Applications", items: d.patents_applied || [] },
      { title: "Korean Patents · Applications", items: d.patents_domestic || [] },
    ].filter((p) => p.items.length);
    const patentCount = patents.reduce((s, p) => s + p.items.length, 0);

    const pubSection = (s) => {
      const items = s.items || [];
      if (!items.length) return `<section class="pub-section" id="${s.id}"><h2>${s.title}</h2><div class="empty">준비 중입니다.</div></section>`;
      const byYear = new Map();
      items.forEach((p, i) => {
        const y = p.year ?? "";
        if (!byYear.has(y)) byYear.set(y, []);
        byYear.get(y).push(pubItemHTML(p, items.length - i));
      });
      const rows = [...byYear].map(([y, lis]) => `<div class="pub-year">${esc(y)}</div><ul class="pub-list">${lis.join("")}</ul>`).join("");
      return `<section class="pub-section" id="${s.id}"><h2>${s.title} <span class="count">${items.length}</span></h2>${rows}</section>`;
    };

    $("#content").innerHTML = `
      <div class="container section">
        <div class="toolbar">
          ${sections.map((s) => `<a class="chip" href="#${s.id}">${s.title}<span class="count">${(s.items || []).length}</span></a>`).join("")}
          <a class="chip" href="#patents">Patents<span class="count">${patentCount}</span></a>
          <input class="search" type="search" placeholder="Search title, author, venue…" aria-label="논문 검색">
        </div>
        ${sections.map(pubSection).join("")}
        <section class="pub-section" id="patents">
          <h2>Patents <span class="count">${patentCount}</span></h2>
          ${patents.map((p) => `
            <div class="pub-year">${esc(p.title.toUpperCase())}</div>
            <ul class="pub-list">${p.items.map((x, i) => `
              <li class="pub" data-search="${esc([x.number, x.title, x.title_en, x.inventors].join(" ").toLowerCase())}">
                <span class="idx">${p.items.length - i}</span>
                <div>
                  <div class="title">${esc(x.title)}</div>
                  ${x.title_en ? `<div class="title-en">${esc(x.title_en)}</div>` : ""}
                  ${x.inventors ? `<div class="authors">${highlightAuthors(x.inventors)}</div>` : ""}
                  <div class="venue">${esc(x.number)} · ${esc(formatDate(x.date))}</div>
                </div>
              </li>`).join("")}</ul>`).join("")}
        </section>
      </div>`;

    // 검색
    $(".search").addEventListener("input", (e) => {
      const q = e.target.value.trim().toLowerCase();
      document.querySelectorAll(".pub").forEach((el) => {
        el.style.display = !q || el.dataset.search.includes(q) ? "" : "none";
      });
      document.querySelectorAll(".pub-list").forEach((ul) => {
        const visible = [...ul.children].some((li) => li.style.display !== "none");
        const label = ul.previousElementSibling;
        if (label && label.classList.contains("pub-year")) label.style.display = visible ? "" : "none";
        ul.style.display = visible ? "" : "none";
      });
    });
  },

  async projects() {
    const d = await loadData("projects");
    const item = (p, current) => `
      <article class="project">
        <h3>${p.type ? `<span class="type">${esc(p.type)}</span>` : ""}${esc(p.title)}</h3>
        <div class="meta"><strong>${esc(p.period)}</strong>${esc(p.role || "")}${current ? '<br><span class="badge">Ongoing</span>' : ""}</div>
        <div class="sponsor">${esc(p.sponsor)}</div>
        ${p.lead ? `<div class="lead">주관: ${esc(p.lead)}</div>` : ""}
      </article>`;
    $("#content").innerHTML = `
      <div class="container section">
        <h2>Ongoing Projects <span class="muted" style="font-size:1rem">${(d.current || []).length}</span></h2>
        <div class="grid" style="margin-bottom:48px">${(d.current || []).map((p) => item(p, true)).join("") || '<div class="empty">진행 중인 과제가 없습니다.</div>'}</div>
        <h2>Completed Projects <span class="muted" style="font-size:1rem">${(d.finished || []).length}</span></h2>
        <div class="grid">${(d.finished || []).map((p) => item(p, false)).join("")}</div>
      </div>`;
  },

  async equipment() {
    const d = await loadData("equipment");
    const id = (c) => c.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    $("#content").innerHTML = `
      <div class="container section">
        <div class="toolbar">${d.map((c) => `<a class="chip" href="#${id(c.category)}">${esc(c.category)}<span class="count">${c.items.length}</span></a>`).join("")}</div>
        ${d.map((c) => `
          <section class="equip-section" id="${id(c.category)}">
            <h3 class="group-title">${esc(c.category)}</h3>
            <div class="grid grid-4">
              ${c.items.map((e) => `
                <article class="card equip-card">
                  ${e.image
                    ? `<div class="thumb" style="background-image:url('${esc(e.image)}')" role="img" aria-label="${esc(e.name)}"></div>`
                    : `<div class="thumb empty-thumb" aria-hidden="true">${esc(initials(e.name))}</div>`}
                  <div class="card-body"><h3>${esc(e.name)}</h3>${e.spec ? `<p>${esc(e.spec)}</p>` : ""}</div>
                </article>`).join("")}
            </div>
          </section>`).join("")}
      </div>`;
  },

  async awards() {
    const d = await loadData("awards");
    const top = (a) => /대상|1등|금상/.test(a.prize);
    const people = new Set(d.flatMap((a) => String(a.winners || "").split(",").map((s) => s.trim()).filter(Boolean)));
    $("#content").innerHTML = `
      <div class="container section">
        <div class="stats">
          <div class="stat"><b>${d.length}</b><span>Total awards</span></div>
          <div class="stat"><b>${d.filter(top).length}</b><span>Grand / gold prizes</span></div>
          <div class="stat"><b>${people.size}</b><span>Student awardees</span></div>
        </div>
        <div class="award-list">
          ${d.map((a) => `
            <article class="award">
              <div class="year${a.year ? "" : " none"}">${a.year ? esc(a.year) : "—"}</div>
              <div>
                <h3>${esc(a.event)}<span class="prize${top(a) ? " top" : ""}">${esc(a.prize)}</span></h3>
                ${a.topic ? `<p class="topic">${esc(a.topic)}</p>` : ""}
                <p class="winners">${esc(a.winners)}</p>
              </div>
            </article>`).join("")}
        </div>
      </div>`;
  },

  async contact(site) {
    const c = site.contact;
    $("#content").innerHTML = `
      <div class="container section">
        <div class="contact-grid">
          <div class="card contact-card">
            <p class="eyebrow">Join Us</p>
            <h2>${esc(site.recruit.title)}</h2>
            <p>${esc(site.recruit.body)}</p>
            <p>관심 있는 학생은 아래 메일로 연락 바랍니다.</p>
            <a class="btn btn-primary" href="mailto:${esc(c.email)}" style="margin-bottom:24px">${esc(c.email)}</a>
            <ul class="contact-list">
              <li>${ICONS.phone}${esc(c.phone)}</li>
              <li>${ICONS.pin}<span>${esc(c.address_ko)}<br><span class="muted">${esc(c.address_en)}</span></span></li>
            </ul>
          </div>
          <div class="map"><iframe src="${esc(c.map_embed)}" loading="lazy" title="IIRLab location" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
        </div>
      </div>`;
  },
};

/* ---------- boot ---------- */

(async function main() {
  const page = document.body.dataset.page;
  try {
    const site = await loadData("site");
    renderHeader(site, page);
    renderFooter(site);
    if (pages[page]) await pages[page](site);
  } catch (err) {
    console.error(err);
    const el = $("#content") || document.body;
    el.innerHTML = `<div class="container section"><div class="empty">내용을 불러오지 못했습니다: ${esc(err.message)}</div></div>`;
  }
  // 렌더링 후 #앵커로 이동
  if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
})();
