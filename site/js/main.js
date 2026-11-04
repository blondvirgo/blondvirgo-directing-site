/* =====================================================================
   BLONDVIRGO – main.js (the only script)

   Reads PROJECTS and SETTINGS from projects.js and:
   1. builds the work grid (published videos only)
   2. adds the search-engine labels for each video
   3. runs the FX library: the title switches between BLONDVIRGO and the
      director's name with a different effect each time (click + timer)
   4. page-load and scroll animations (Blur-in, Rise)
   5. hover / tap previews
   6. the full-screen player
   ===================================================================== */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var settings = (typeof SETTINGS !== "undefined" && SETTINGS) || {};
  var all = (typeof PROJECTS !== "undefined" && Array.isArray(PROJECTS)) ? PROJECTS : [];
  var projects = all.filter(function (p) { return p && p.published !== false; });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---- settings ---------------------------------------------------- */
  if (settings.grain === false) root.setAttribute("data-grain", "off");
  if (settings.scanlines === false) root.setAttribute("data-scanlines", "off");
  if (settings.colourFringe === false) root.setAttribute("data-fringe", "off");

  var DIRECTOR = settings.director || "ALEX RUSU";
  var WORDMARK = settings.wordmark || "BLONDVIRGO";

  /* ---- helpers ----------------------------------------------------- */
  function el(tag, attrs, children) {
    var node = doc.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "text") node.textContent = attrs[k];
        else if (attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function label(p) { return p.artist + " – " + p.title; }            // "ARTIST – TITLE"
  function stripExt(name) { return String(name).replace(/\.[a-z0-9]+$/i, ""); }

  function aspectParts(p) {
    var m = /^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/.exec(String(p.aspect || "1:1"));
    return m ? [m[1], m[2]] : ["1", "1"];
  }

  function embedUrl(p) {
    var id = encodeURIComponent(String(p.embedId || "").trim());
    if (p.platform === "youtube") {
      return "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&playsinline=1&modestbranding=1";
    }
    var hash = String(p.embedHash || "").trim();
    var base = "https://player.vimeo.com/video/" + id;
    // Vimeo rule: for "private link" videos the h= code must come first
    return base + (hash ? "?h=" + encodeURIComponent(hash) + "&" : "?") + "dnt=1&autoplay=1&title=0&byline=0&portrait=0&color=ffffff";
  }

  // short text glitch on any element (nav links, titles, footer wordmark)
  function glitchText(node) {
    if (!node || reduceMotion) return;
    node.classList.remove("glitch-text");
    void node.offsetWidth;
    node.classList.add("glitch-text");
    setTimeout(function () { node.classList.remove("glitch-text"); }, 500);
  }

  var PLAY_SVG = '<svg class="tile__play" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 3l15 9-15 9z"/></svg>';

  /* ---- 0. shared chrome: menu, social icons, footer ------------------
     Defined ONCE here and in SETTINGS; every page gets the same ones.  */
  var ICONS = {
    instagram: '<path fill-rule="evenodd" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.3a4.7 4.7 0 1 1 0 9.4 4.7 4.7 0 0 1 0-9.4zm0 2a2.7 2.7 0 1 0 0 5.4 2.7 2.7 0 0 0 0-5.4zm5.2-3.4a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z"/>',
    youtube: '<path fill-rule="evenodd" d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.3 5 12 5 12 5s-6.3 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.7 19 12 19 12 19s6.3 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z"/>',
    vimeo: '<path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197a315.065 315.065 0 0 0 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797l-.013.01z"/>',
    linkedin: '<path fill-rule="evenodd" d="M22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0zM7.12 20.45H3.56V9h3.56v11.45zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zm15.11 13.02h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28z"/>',
    // post + app glyphs
    text: '<path d="M3 4h18v2H3zm0 5h18v2H3zm0 5h12v2H3z"/>',
    photo: '<path d="M3 4h18v16H3zm2 2v9l4-4 4 4 3-3 3 3V6zm11 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/>',
    video: '<path d="M3 5h12v4l6-3v12l-6-3v4H3z"/>',
    audio: '<path d="M14 3v12.3a3.5 3.5 0 1 1-2-3.2V7l-5 1.5v8.8a3.5 3.5 0 1 1-2-3.2V6z"/>',
    quote: '<path d="M6 7h5v5l-2 5H6l2-5H6zm8 0h5v5l-2 5h-3l2-5h-2z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 1.4 1.4 1-1a2 2 0 0 1 2.9 2.9l-3 3a2 2 0 0 1-2.9 0zm4-4a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1-1.4-1.4-1 1a2 2 0 0 1-2.9-2.9l3-3a2 2 0 0 1 2.9 0z"/>',
    chat: '<path d="M3 4h18v11H8l-5 4z"/>',
    camera: '<path d="M9 4h6l1.5 2H20v13H4V6h3.5zM12 9a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/>',
    contacts: '<path d="M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm-8 18c0-4 3.6-7 8-7s8 3 8 7z"/>',
    messages: '<path d="M12 3c5 0 9 3.2 9 7.2S17 17.4 12 17.4c-.8 0-1.6-.1-2.3-.2L5 20l1.2-3.4C4.2 15.3 3 13.4 3 10.2 3 6.2 7 3 12 3z"/>',
    notes: '<path d="M5 3h14v18H5zm2 5h10v1.5H7zm0 3h10v1.5H7zm0 3h7v1.5H7z"/>',
    settings: '<path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm-1.5-6h3l.5 2.5 1.8.8 2.2-1.4 2.1 2.1-1.4 2.2.8 1.8 2.5.5v3l-2.5.5-.8 1.8 1.4 2.2-2.1 2.1-2.2-1.4-1.8.8-.5 2.5h-3l-.5-2.5-1.8-.8-2.2 1.4-2.1-2.1 1.4-2.2-.8-1.8L2 13.5v-3l2.5-.5.8-1.8-1.4-2.2 2.1-2.1 2.2 1.4 1.8-.8z"/>',
    blog: '<path d="M4 4h16v12H9l-5 4zm3 3v2h10V7zm0 4v2h7v-2z"/>',
    work: '<path d="M4 6h16v12H4zm3 2v8l7-4z"/>',
    phone: '<path d="M7 2h10v20H7zm2 2v14h6V4zm3 15a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>'
  };

  function icon(name, cls) {
    return '<svg class="' + (cls || "icon") + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (ICONS[name] || "") + '</svg>';
  }

  var page = doc.body.getAttribute("data-page") || "";

  // the menu
  var navEl = doc.getElementById("nav");
  if (navEl && Array.isArray(settings.nav)) {
    settings.nav.forEach(function (item) {
      var href = item.href;
      // "#contact" / "#work" on another page go back to the homepage
      if (href.charAt(0) === "#" && page !== "work") href = "/" + href;
      var a = el("a", { "class": "nav__link", href: href, text: item.label });
      var isCurrent = (item.label === page) || (page === "work" && item.href === "/#work");
      if (isCurrent) a.setAttribute("aria-current", "page");
      navEl.appendChild(a);
    });
  }

  // social icon rows
  function socialsInto(ul) {
    (settings.socials || []).forEach(function (sm) {
      var li = el("li");
      var a = el("a", {
        "class": "socials__link", href: sm.url, target: "_blank", rel: "noopener",
        "aria-label": sm.label + " (opens in a new tab)"
      });
      a.innerHTML = icon(sm.id);
      li.appendChild(a); ul.appendChild(li);
    });
  }
  doc.querySelectorAll("[data-socials]").forEach(socialsInto);

  // the footer
  var footerEl = doc.querySelector("[data-footer]");
  if (footerEl) {
    footerEl.appendChild(el("button", {
      "class": "footer__wordmark", id: "negative-toggle", type: "button", "aria-pressed": "false",
      "aria-label": "BLONDVIRGO. Switch negative mode on or off", text: WORDMARK
    }));
    var ul = el("ul", { "class": "socials", "aria-label": "Contact BLONDVIRGO on social media" });
    socialsInto(ul);
    footerEl.appendChild(ul);
    footerEl.appendChild(el("p", { "class": "footer__copy", text: "© 2026 alex rusu / blondvirgo" }));
  }


  /* ---- 1. build the grid ------------------------------------------- */
  var grid = doc.getElementById("work-grid");

  projects.sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); });

  var count = projects.length;
  var colsDesktop = count === 1 ? 1 : count === 2 ? 2 : count === 4 ? 2 : 3;

  function sizesAttr() {
    if (count === 1) return "(min-width: 701px) 600px, 100vw";
    var desktop = Math.round(100 / colsDesktop) + "vw";
    return "(min-width: 1025px) " + desktop + ", (min-width: 701px) 50vw, 100vw";
  }

  function buildTile(p, index) {
    var ar = aspectParts(p);
    var name = label(p);
    var media = el("span", { "class": "tile__media", style: "--ar-w:" + ar[0] + ";--ar-h:" + ar[1] });

    if (p.still) {
      var base = stripExt(p.still);
      var eager = index < colsDesktop;
      var img = el("img", {
        "class": "tile__still",
        alt: name + ", music video still",
        loading: eager ? "eager" : "lazy",
        decoding: "async",
        fetchpriority: index === 0 ? "high" : null,
        src: "/images/" + p.still
      });
      if (Array.isArray(p.stillSizes) && p.stillSizes.length) {
        var webp = p.stillSizes.map(function (w) { return "/images/" + base + "-" + w + ".webp " + w + "w"; }).join(", ");
        var jpg = p.stillSizes.map(function (w) { return "/images/" + base + "-" + w + ".jpg " + w + "w"; }).join(", ");
        var pic = el("picture", null, [
          el("source", { type: "image/webp", srcset: webp, sizes: sizesAttr() }),
          el("source", { type: "image/jpeg", srcset: jpg, sizes: sizesAttr() })
        ]);
        pic.appendChild(img);
        media.appendChild(pic);
      } else {
        media.appendChild(img);
      }
    } else {
      media.classList.add("tile__media--empty");
      media.appendChild(el("span", { "class": "tile__fallback", "aria-hidden": "true", text: name }));
    }

    if (p.preview && !reduceMotion) {
      var video = el("video", {
        "class": "tile__preview",
        muted: "", playsinline: "", loop: "", preload: "none",
        "aria-hidden": "true", tabindex: "-1",
        "data-src": "/previews/" + p.preview
      });
      video.muted = true;
      media.appendChild(video);
    }

    media.insertAdjacentHTML("beforeend", PLAY_SVG);

    var meta = el("span", { "class": "tile__meta" }, [
      el("span", { "class": "tile__index", "aria-hidden": "true", text: pad(index + 1) }),
      el("span", { "class": "tile__title", text: name })
    ]);

    var link = el("a", {
      "class": "tile__link",
      href: p.link || "#",
      "data-index": String(index),
      "aria-label": "Play " + name
    }, [media, meta]);

    var tile = el("article", { "class": "tile rise" + (p.featured ? " tile--featured" : "") + (p.preview ? " tile--has-preview" : "") }, [link]);
    tile.style.setProperty("--i", String(index % colsDesktop));
    return tile;
  }

  if (grid) {
    grid.setAttribute("data-count", String(count));
    projects.forEach(function (p, i) { grid.appendChild(buildTile(p, i)); });
  }

  /* ---- 2. search-engine labels for each video ---------------------- */
  if (count) {
    var origin = window.location.origin;
    var list = projects.map(function (p, i) {
      var v = {
        "@type": "VideoObject",
        "name": label(p),
        "description": p.title + " by " + p.artist + ", music video directed by " + DIRECTOR + ".",
        "director": { "@type": "Person", "name": DIRECTOR },
        "url": p.link,
        "embedUrl": embedUrl(p).split("?")[0]
      };
      if (p.still) v.thumbnailUrl = origin + "/images/" + p.still;
      if (p.date) v.uploadDate = p.date;
      return { "@type": "ListItem", "position": i + 1, "item": v };
    });
    doc.head.appendChild(el("script", {
      type: "application/ld+json",
      text: JSON.stringify({ "@context": "https://schema.org", "@type": "ItemList", "name": "Work", "itemListElement": list })
    }));
  }

  // sticky negative mode: the footer wordmark flips the whole site
  var negToggle = doc.getElementById("negative-toggle");
  function setNegative(on) {
    root.classList.toggle("is-negative", !!on);
    if (negToggle) negToggle.setAttribute("aria-pressed", on ? "true" : "false");
  }
  if (negToggle) {
    negToggle.addEventListener("click", function () {
      setNegative(!root.classList.contains("is-negative"));
    });
  }

  /* ---- 3. FX library: BLONDVIRGO <-> ALEX RUSU ----------------------
     Every effect: name, how long it runs, and when (0–1) the word swaps.
     "letters" effects animate each letter; the others animate the whole
     word plus the two coloured ghost copies.                          */
  var FX_DUR = 1200;                                   // matches --fx-dur in the stylesheet
  var EFFECTS = [
    { name: "breakdown", dur: 1900,   swapAt: 0.5,  letters: true },
    { name: "rgb",       dur: FX_DUR, swapAt: 0.5,  distort: 18 },
    { name: "vhs",       dur: FX_DUR, swapAt: 0.5,  distort: 30 },
    { name: "flicker",   dur: FX_DUR, swapAt: 0.49 },
    { name: "crush",     dur: FX_DUR, swapAt: 0.51, letters: true },
    { name: "static",    dur: FX_DUR, swapAt: 0.5,  distort: 60 },
    { name: "slide",     dur: FX_DUR, swapAt: 0.45, letters: true },
    { name: "collage",   dur: 1500,   swapAt: 0.5,  letters: true, media: true },
    { name: "flip",      dur: FX_DUR, swapAt: 0.5,  letters: true }
  ];

  // the featured still, cut into the letters by the "collage" effect
  var fillStill = (function () {
    var p = projects.filter(function (x) { return x.still; })[0];
    return p ? "url('/images/" + p.still + "')" : "";
  })();

  /* distortion: warps the word through the SVG filter in index.html.
     strength rises to "peak" and falls back over "dur" milliseconds.  */
  var distortMap = doc.getElementById("bv-distort-map");
  var distortNoise = doc.getElementById("bv-distort-noise");
  var distortFrame = null;
  function distort(peak, dur) {
    if (!distortMap || !wordmark || reduceMotion) return;
    cancelAnimationFrame(distortFrame);
    var t0 = performance.now();
    wordmark.classList.add("is-distorting");
    (function tick(now) {
      var t = Math.min(1, (now - t0) / dur);
      var env = Math.sin(t * Math.PI);                        // 0 → 1 → 0
      distortMap.setAttribute("scale", (peak * env).toFixed(1));
      distortNoise.setAttribute("seed", String(Math.floor(now / 70) % 50));
      if (t < 1) distortFrame = requestAnimationFrame(tick);
      else { distortMap.setAttribute("scale", "0"); wordmark.classList.remove("is-distorting"); }
    })(t0);
  }

  // flip the whole site to negative (or back) with a tear
  function toggleNegative() {
    setNegative(!root.classList.contains("is-negative"));
    if (reduceMotion) return;
    root.classList.remove("fx-negative-switch");
    void root.offsetWidth;
    root.classList.add("fx-negative-switch");
    setTimeout(function () { root.classList.remove("fx-negative-switch"); }, 520);
  }

  var wordmark = doc.getElementById("wordmark");
  var textLayer = wordmark && wordmark.querySelector(".wordmark__text");
  var ghosts = wordmark ? wordmark.querySelectorAll(".wordmark__ghost") : [];
  var swapCfg = settings.titleSwap || {};
  var names = [WORDMARK, DIRECTOR];
  var nameIndex = 0;
  var busy = false;
  var lastFx = "";

  function setWord(text) {
    if (!textLayer) return;
    textLayer.textContent = "";
    text.split("").forEach(function (ch) {
      textLayer.appendChild(el("span", { "class": "wordmark__letter", text: ch }));
    });
    ghosts.forEach(function (g) { g.textContent = text; });
  }

  function scatter(letter) {
    letter.style.setProperty("--dx", rnd(-0.35, 0.35).toFixed(2) + "em");
    letter.style.setProperty("--dy", rnd(-0.45, 0.45).toFixed(2) + "em");
    letter.style.setProperty("--dr", rnd(-10, 10).toFixed(1) + "deg");
    letter.style.setProperty("--d", rnd(0, 0.35).toFixed(2) + "s");
    letter.style.setProperty("--bx", rnd(0, 100).toFixed(0) + "%");
    letter.style.setProperty("--by", rnd(0, 100).toFixed(0) + "%");
    if (fillStill) letter.style.setProperty("--fill", fillStill);
  }

  function letters() { return wordmark.querySelectorAll(".wordmark__letter"); }

  function pickEffect(wanted) {
    var pool = EFFECTS.filter(function (f) { return f.name !== lastFx && (!f.media || fillStill); });
    var fx = wanted ? EFFECTS.filter(function (f) { return f.name === wanted; })[0] : null;
    return fx || pool[Math.floor(Math.random() * pool.length)];
  }

  // run one effect; swapText=true switches the word part-way through;
  // fromClick=true adds the full-page negative hit at the swap moment
  var queued = null;
  function runFx(wanted, swapText, fromClick) {
    if (!wordmark) return;
    if (busy) { queued = [wanted, swapText, fromClick]; return; }   // play it after the current one
    busy = true;
    var fx = reduceMotion ? { name: "fade", dur: 1200, swapAt: 0.5, letters: true } : pickEffect(wanted);
    lastFx = fx.name;
    var next = swapText ? (nameIndex === 0 ? 1 : 0) : nameIndex;
    var flip = fromClick && swapCfg.negativeOnClick !== false;   // the click flips the site to negative/back

    letters().forEach(scatter);
    if (fx.distort) distort(fx.distort, fx.dur);
    if (fx.name === "static") root.classList.add("fx-static-burst");

    if (fx.name === "breakdown" || fx.name === "fade") {
      wordmark.classList.add("is-breaking");
      setTimeout(function () {
        nameIndex = next;
        setWord(names[nameIndex]);
        letters().forEach(scatter);
        void wordmark.offsetWidth;
        wordmark.classList.remove("is-breaking");
        if (flip) toggleNegative();
      }, fx.dur * fx.swapAt);
      setTimeout(function () { busy = false; drain(); }, fx.dur);
      return;
    }

    wordmark.classList.add("fx-" + fx.name);

    setTimeout(function () {
      nameIndex = next;
      if (fx.letters) {
        var chars = names[nameIndex].split("");
        var old = letters();
        if (old.length === chars.length) old.forEach(function (l, i) { l.textContent = chars[i]; });
        else setWord(names[nameIndex]);
        ghosts.forEach(function (g) { g.textContent = names[nameIndex]; });
      } else {
        setWord(names[nameIndex]);
      }
      if (flip) toggleNegative();
    }, fx.dur * fx.swapAt);

    setTimeout(function () {
      wordmark.classList.remove("fx-" + fx.name);
      root.classList.remove("fx-static-burst");
      busy = false;
      drain();
    }, fx.dur);
  }

  function drain() {
    if (!queued) return;
    var q = queued; queued = null;
    setTimeout(function () { runFx(q[0], q[1], q[2]); }, 80);
  }

  if (wordmark && wordmark.hasAttribute("data-swap")) {
    setWord(names[0]);

    if (swapCfg.onClick !== false) {
      wordmark.addEventListener("click", function (e) {
        e.preventDefault();
        runFx(null, true, true);
      });

      // press and hold: the word keeps warping until you let go
      var holdFrame = null, holdStart = 0;
      function holdTick(now) {
        if (!distortMap) return;
        var t = (now - holdStart) / 1000;
        var strength = Math.min(1, t / 0.6) * (26 + 10 * Math.sin(t * 9));
        distortMap.setAttribute("scale", strength.toFixed(1));
        distortNoise.setAttribute("seed", String(Math.floor(now / 60) % 50));
        holdFrame = requestAnimationFrame(holdTick);
      }
      function holdStartFn(e) {
        if (busy || reduceMotion || (e.pointerType === "mouse" && e.button !== 0)) return;
        holdStart = performance.now();
        wordmark.classList.add("is-held");
        cancelAnimationFrame(holdFrame);
        holdFrame = requestAnimationFrame(holdTick);
      }
      function holdEnd() {
        if (!wordmark.classList.contains("is-held")) return;
        cancelAnimationFrame(holdFrame);
        wordmark.classList.remove("is-held");
        if (distortMap) distortMap.setAttribute("scale", "0");
      }
      wordmark.addEventListener("pointerdown", holdStartFn);
      wordmark.addEventListener("pointerup", holdEnd);
      wordmark.addEventListener("pointercancel", holdEnd);
      wordmark.addEventListener("pointerleave", holdEnd);
    }

    var every = Number(swapCfg.everySeconds) || 0;
    if (every > 0) {
      var wordmarkVisible = true;
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          wordmarkVisible = entries[0].isIntersecting;
        }, { threshold: 0.5 }).observe(wordmark);
      }
      setInterval(function () {
        if (doc.hidden || !wordmarkVisible) return;
        runFx(null, true);
      }, every * 1000);
    }

    // one short rgb hit after the Blur-in, so the page "switches on"
    if (settings.fxOnLoad !== false && !reduceMotion) {
      setTimeout(function () { runFx("rgb", false); }, 1300);
    }
  }

  // lets you try an effect by name from the browser console: BV.fx("vhs")
  window.BV = {
    fx: function (name, swap) { runFx(name, swap !== false, true); },
    effects: EFFECTS.map(function (f) { return f.name; }),
    negative: function (on) { setNegative(on); }
  };

  // nav links, footer wordmark and social icons glitch when clicked
  doc.querySelectorAll(".nav__link, .footer__wordmark, .notfound__link").forEach(function (n) {
    n.addEventListener("click", function () { glitchText(n); });
    if (canHover) n.addEventListener("mouseenter", function () { glitchText(n); });
  });
  doc.querySelectorAll(".socials__link").forEach(function (n) {
    n.addEventListener("click", function () { glitchText(n); });
  });

  /* ---- rare whole-page glitch ---------------------------------------
     Checked every 5s; fires with a probability that averages one hit per
     pageGlitch.averageSeconds. Only animates header/main/footer, so
     clicks, scrolling and the player are never blocked.                */
  var pg = settings.pageGlitch || {};
  function pageGlitch() {
    if (reduceMotion) return;
    root.classList.remove("fx-page");
    void root.offsetWidth;
    root.classList.add("fx-page");
    setTimeout(function () { root.classList.remove("fx-page"); }, 520);
  }
  if (pg.enabled !== false && !reduceMotion) {
    var avg = Number(pg.averageSeconds) || 75;
    setInterval(function () {
      if (doc.hidden || busy || (player && !player.hidden)) return;
      if (Math.random() < 5 / avg) pageGlitch();
    }, 5000);
  }
  window.BV.pageGlitch = pageGlitch;

  /* ---- liquid cursor (desktop, fine pointer only) ------------------- */
  var cursor = doc.getElementById("cursor");
  var cursorCfg = settings.cursor === false ? { enabled: false } : (settings.cursor || {});
  if (cursor && canHover && !reduceMotion && cursorCfg.enabled !== false) {
    var blobs = Array.prototype.slice.call(cursor.querySelectorAll(".cursor__blob"));
    var canMixColour = !!(window.CSS && CSS.supports && CSS.supports("color", "color-mix(in srgb, red 50%, white)"));
    var pts = blobs.map(function () { return { x: -100, y: -100 }; });
    var tx = -100, ty = -100, shown = false, lastX = -100, lastY = -100, speed = 0, angle = 0, lastT = performance.now();
    var trail = 1 - Math.min(0.95, Math.max(0.05, parseFloat(getComputedStyle(root).getPropertyValue("--cursor-trail")) || 0.55));
    root.classList.add("has-cursor");

    doc.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!shown) { pts.forEach(function (p) { p.x = tx; p.y = ty; }); lastX = tx; lastY = ty; shown = true; }
      var over = e.target.closest ? e.target.closest("a, button, .tile__link") : null;
      cursor.classList.toggle("is-play", !!(over && over.classList.contains("tile__link")));
      cursor.classList.toggle("is-link", !!(over && !over.classList.contains("tile__link")));
    }, { passive: true });
    doc.addEventListener("mousedown", function () { cursor.classList.add("is-down"); });
    doc.addEventListener("mouseup", function () { cursor.classList.remove("is-down"); });
    doc.addEventListener("mouseleave", function () { cursor.style.opacity = "0"; });
    doc.addEventListener("mouseenter", function () { cursor.style.opacity = ""; });

    (function follow(now) {
      var dt = Math.max(1, now - lastT); lastT = now;
      // speed in px per ms, smoothed
      var dx = tx - lastX, dy = ty - lastY;
      var v = Math.sqrt(dx * dx + dy * dy) / dt;
      speed += (v - speed) * 0.2;
      if (v > 0.05) angle = Math.atan2(dy, dx);
      lastX = tx; lastY = ty;

      // head follows the mouse tightly, each blob follows the one before it
      pts[0].x += (tx - pts[0].x) * 0.5;
      pts[0].y += (ty - pts[0].y) * 0.5;
      for (var i = 1; i < pts.length; i++) {
        pts[i].x += (pts[i - 1].x - pts[i].x) * trail;
        pts[i].y += (pts[i - 1].y - pts[i].y) * trail;
      }

      // fast = stretched along the direction of travel, and coloured
      var stretch = 1 + Math.min(1.6, speed * 0.9);
      var squash = 1 / Math.sqrt(stretch);
      var down = cursor.classList.contains("is-down") ? 0.7 : 1;
      blobs[0].style.transform = "translate(" + pts[0].x.toFixed(1) + "px," + pts[0].y.toFixed(1) + "px) rotate(" + angle.toFixed(3) + "rad) scale(" + (stretch * down).toFixed(3) + "," + (squash * down).toFixed(3) + ")";
      for (var j = 1; j < blobs.length; j++) {
        blobs[j].style.transform = "translate(" + pts[j].x.toFixed(1) + "px," + pts[j].y.toFixed(1) + "px)";
      }
      if (cursorCfg.colourWithSpeed !== false && canMixColour) {
        // white when still; towards red, then cyan, the faster it moves
        var k = Math.min(1, speed / 2.2);
        var colour = k < 0.5
          ? "color-mix(in srgb, var(--fx-a) " + Math.round(k * 2 * 100) + "%, var(--color-text))"
          : "color-mix(in srgb, var(--fx-b) " + Math.round((k - 0.5) * 2 * 100) + "%, var(--fx-a))";
        cursor.style.setProperty("--cursor-colour", colour);
      }
      requestAnimationFrame(follow);
    })(performance.now());
  }

  /* ---- 4. animations ----------------------------------------------- */
  function reveal(node) { node.classList.add("is-in"); }

  doc.querySelectorAll(".blur-in").forEach(function (n) {
    requestAnimationFrame(function () { requestAnimationFrame(function () { reveal(n); }); });
  });
  doc.querySelectorAll(".hero .rise").forEach(function (n) {
    requestAnimationFrame(function () { requestAnimationFrame(function () { reveal(n); }); });
  });

  var tiles = Array.prototype.slice.call(doc.querySelectorAll(".tile"));
  if ("IntersectionObserver" in window && !reduceMotion) {
    var riseObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { reveal(e.target); riseObs.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    tiles.forEach(function (t) { riseObs.observe(t); });
  } else {
    tiles.forEach(reveal);
  }

  /* ---- 5. previews (silent loops) ---------------------------------- */
  function previewOf(tile) { return tile.querySelector(".tile__preview"); }

  function startPreview(tile) {
    var v = previewOf(tile);
    if (!v) return;
    if (!v.getAttribute("src")) v.setAttribute("src", v.getAttribute("data-src"));
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
    tile.classList.add("is-previewing");
  }

  function stopPreview(tile) {
    var v = previewOf(tile);
    if (!v) return;
    v.pause();
    tile.classList.remove("is-previewing");
  }

  function stopAllPreviews() { tiles.forEach(stopPreview); }

  if (!reduceMotion) {
    if (canHover) {
      tiles.forEach(function (t) {
        if (!previewOf(t)) return;
        t.addEventListener("mouseenter", function () { startPreview(t); });
        t.addEventListener("mouseleave", function () { stopPreview(t); });
        t.addEventListener("focusin", function () { startPreview(t); });
        t.addEventListener("focusout", function () { stopPreview(t); });
      });
    } else if ("IntersectionObserver" in window) {
      var prevObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) startPreview(e.target); else stopPreview(e.target);
        });
      }, { threshold: 0.5 });
      tiles.forEach(function (t) { if (previewOf(t)) prevObs.observe(t); });
    }
  }

  /* ---- 6. player --------------------------------------------------- */
  var player = doc.getElementById("player");
  var frame = doc.getElementById("player-frame");
  var caption = doc.getElementById("player-caption");
  var external = doc.getElementById("player-external");
  var closeBtn = doc.getElementById("player-close");
  var main = doc.querySelector("main");
  var lastFocus = null;

  function mountPlayer(p) {
    var ar = aspectParts(p);
    frame.style.setProperty("--ar-w", ar[0]);
    frame.style.setProperty("--ar-h", ar[1]);
    frame.innerHTML = "";
    if (p.still) {
      frame.appendChild(el("img", { "class": "player__poster", src: "/images/" + p.still, alt: "", "aria-hidden": "true" }));
    }
    var iframe = el("iframe", {
      src: embedUrl(p),
      title: label(p) + " (video)",
      allow: "autoplay; fullscreen; picture-in-picture; encrypted-media",
      allowfullscreen: "",
      referrerpolicy: "strict-origin-when-cross-origin"
    });
    iframe.addEventListener("load", function () { iframe.classList.add("is-loaded"); });
    frame.appendChild(iframe);
    caption.textContent = label(p) + " · " + p.year + " · directed by " + DIRECTOR;
    if (external) {
      external.href = p.link || "#";
      external.textContent = "watch on " + (p.platform === "youtube" ? "youtube" : "vimeo");
    }
    lastFocus = doc.activeElement;
    player.hidden = false;
    doc.body.classList.add("is-locked");
    closeBtn.focus();
  }

  function openPlayer(index) {
    var p = projects[index];
    if (!p || !player) return;
    stopAllPreviews();
    if (settings.fxOnTiles !== false && !reduceMotion && main) {
      // the page tears for a moment, then the player appears
      main.classList.remove("fx-open");
      void main.offsetWidth;
      main.classList.add("fx-open");
      setTimeout(function () { main.classList.remove("fx-open"); mountPlayer(p); }, 300);
    } else {
      mountPlayer(p);
    }
  }

  function closePlayer() {
    if (!player || player.hidden) return;
    frame.innerHTML = "";
    player.hidden = true;
    doc.body.classList.remove("is-locked");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
  }

  // warm up the connection to the video host the first time a tile is touched
  var preconnected = false;
  function preconnect(host) {
    if (preconnected) return;
    preconnected = true;
    doc.head.appendChild(el("link", { rel: "preconnect", href: host, crossorigin: "" }));
  }

  if (grid) {
    var warm = function (e) {
      var link = e.target.closest(".tile__link");
      if (!link) return;
      var p = projects[Number(link.getAttribute("data-index"))];
      preconnect(p && p.platform === "youtube" ? "https://www.youtube-nocookie.com" : "https://player.vimeo.com");
    };
    grid.addEventListener("mouseover", warm);
    grid.addEventListener("touchstart", warm, { passive: true });
    grid.addEventListener("focusin", warm);

    grid.addEventListener("click", function (e) {
      var link = e.target.closest(".tile__link");
      if (!link) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      e.preventDefault();
      openPlayer(Number(link.getAttribute("data-index")));
    });
  }

  if (player) {
    closeBtn.addEventListener("click", closePlayer);

    player.addEventListener("click", function (e) {
      if (e.target === player || e.target === doc.getElementById("player-stage")) closePlayer();
    });

    doc.addEventListener("keydown", function (e) {
      if (player.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); closePlayer(); }
    });

    var startStop = doc.getElementById("player-sentinel-start");
    var endStop = doc.getElementById("player-sentinel-end");
    function lastFocusable() { return external || frame.querySelector("iframe") || closeBtn; }
    startStop.addEventListener("focus", function () { lastFocusable().focus(); });
    endStop.addEventListener("focus", function () { closeBtn.focus(); });
    doc.addEventListener("focusin", function (e) {
      if (player.hidden) return;
      if (!player.contains(e.target)) closeBtn.focus();
    });
  }


  /* ---- 7. BLOG (tumblr-style) --------------------------------------- */
  var feed = doc.getElementById("blog-feed");
  var posts = (typeof POSTS !== "undefined" && Array.isArray(POSTS)) ? POSTS.filter(function (x) { return x && x.published !== false; }) : [];

  function ago(dateStr) {
    var d = new Date(dateStr + "T00:00:00");
    var days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (isNaN(days)) return "";
    if (days <= 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 30) return days + " days ago";
    var months = Math.floor(days / 30);
    if (months < 12) return months + (months === 1 ? " month ago" : " months ago");
    var years = Math.floor(days / 365);
    return years + (years === 1 ? " year ago" : " years ago");
  }

  function projectByTitle(title) {
    return projects.filter(function (p) { return p.title === title; })[0];
  }

  function paragraphs(text) {
    var box = el("div", { "class": "post__body" });
    String(text || "").split(/\n\s*\n/).forEach(function (para) {
      if (para.trim()) box.appendChild(el("p", { text: para.trim() }));
    });
    return box;
  }

  function buildPost(post, i) {
    var art = el("article", { "class": "post post--" + post.type + " rise", id: "post-" + (i + 1) });
    art.style.setProperty("--i", "0");

    var head = el("div", { "class": "post__head" });
    head.innerHTML = icon(post.type, "post__type");
    head.appendChild(el("span", { "class": "post__date", text: post.date || "" }));
    head.appendChild(el("span", { "class": "post__ago", text: ago(post.date) }));
    art.appendChild(head);

    if (post.type === "text") {
      if (post.title) art.appendChild(el("h3", { "class": "post__title", text: post.title }));
      art.appendChild(paragraphs(post.body));
    } else if (post.type === "photo") {
      var grid = el("div", { "class": "post__photos", "data-n": String(Math.min(6, (post.photos || []).length)) });
      (post.photos || []).forEach(function (file) {
        var a = el("a", { "class": "post__photo-link", href: "/images/" + file, target: "_blank", rel: "noopener" });
        a.appendChild(el("img", { "class": "post__photo", src: "/images/" + file, alt: (post.caption || "photo") + ", still", loading: i < 2 ? "eager" : "lazy", decoding: "async" }));
        grid.appendChild(a);
      });
      art.appendChild(grid);
      if (post.caption) art.appendChild(el("p", { "class": "post__caption", text: post.caption }));
    } else if (post.type === "video") {
      var p = projectByTitle(post.project);
      if (p) {
        var idx = projects.indexOf(p);
        var tile = buildTile(p, idx);
        tile.classList.remove("rise");
        tile.classList.add("post__video");
        var meta = tile.querySelector(".tile__meta"); if (meta) meta.remove();   // the caption does the job here
        art.appendChild(tile);
        tile.querySelector(".tile__link").addEventListener("click", function (e) {
          if (e.metaKey || e.ctrlKey || e.shiftKey) return;
          e.preventDefault(); openPlayer(idx);
        });
      }
      if (post.caption) art.appendChild(el("p", { "class": "post__caption", text: post.caption }));
    } else if (post.type === "audio") {
      var audio = el("audio", { "class": "post__audio", controls: "", preload: "none", src: "/audio/" + post.file });
      art.appendChild(audio);
      if (post.caption) art.appendChild(el("p", { "class": "post__caption", text: post.caption }));
    } else if (post.type === "quote") {
      art.appendChild(el("blockquote", { "class": "post__quote", text: post.quote || "" }));
      if (post.source) art.appendChild(el("p", { "class": "post__source", text: post.source }));
    } else if (post.type === "link") {
      var host = "";
      try { host = new URL(post.url).hostname.replace(/^www\./, ""); } catch (e) {}
      var a2 = el("a", { "class": "post__link", href: post.url, target: "_blank", rel: "noopener" }, [
        el("span", { "class": "post__link-title", text: post.title || post.url }),
        post.description ? el("span", { "class": "post__link-desc", text: post.description }) : null,
        el("span", { "class": "post__link-host", text: host })
      ]);
      a2.style.display = "block";
      a2.querySelectorAll("span").forEach(function (sp) { sp.style.display = "block"; });
      art.appendChild(a2);
    } else if (post.type === "chat") {
      if (post.title) art.appendChild(el("h3", { "class": "post__title", text: post.title }));
      var dl = el("dl", { "class": "post__chat" });
      (post.lines || []).forEach(function (line) {
        var m = /^([^:]+):\s*(.*)$/.exec(line);
        dl.appendChild(el("dt", { text: m ? m[1] : "" }));
        dl.appendChild(el("dd", { text: m ? m[2] : line }));
      });
      art.appendChild(dl);
    }

    var foot = el("div", { "class": "post__foot" });
    (post.tags || []).forEach(function (t) { foot.appendChild(el("a", { href: "/blog#tag-" + encodeURIComponent(t), "data-tag": t, text: "#" + t })); });
    var share = el("button", { "class": "post__share", type: "button", text: "share" });
    share.addEventListener("click", function () {
      var url = location.origin + "/blog#post-" + (i + 1);
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { share.textContent = "link copied"; setTimeout(function () { share.textContent = "share"; }, 1500); });
    });
    foot.appendChild(share);
    art.appendChild(foot);
    return art;
  }

  if (feed) {
    if (!posts.length) {
      feed.appendChild(el("p", { "class": "blog__empty", text: "nothing posted yet." }));
    } else {
      posts.forEach(function (post, i) { feed.appendChild(buildPost(post, i)); });
    }
    // sidebar
    var side = doc.getElementById("blog-side");
    if (side) {
      side.appendChild(el("div", { "class": "blog__avatar", "aria-hidden": "true", text: "BV" }));
      side.appendChild(el("p", { "class": "blog__name", text: WORDMARK.toLowerCase() }));
      if (settings.blogDescription) side.appendChild(el("p", { "class": "blog__desc", text: settings.blogDescription }));
      var ig = (settings.socials || []).filter(function (x) { return x.id === "instagram"; })[0];
      if (ig) { var ask = el("p"); ask.appendChild(el("a", { href: ig.url, target: "_blank", rel: "noopener", text: "ask me anything (instagram dm)" })); side.appendChild(ask); }
      var counts = {};
      posts.forEach(function (p) { (p.tags || []).forEach(function (t) { counts[t] = (counts[t] || 0) + 1; }); });
      var tags = Object.keys(counts);
      if (tags.length) {
        var tagBox = el("div", { "class": "blog__tags" });
        tags.forEach(function (t) {
          var a = el("a", { "class": "blog__tag", href: "/blog#tag-" + encodeURIComponent(t), "data-tag": t, text: "#" + t });
          a.appendChild(el("span", { "class": "blog__count", text: " " + counts[t] }));
          tagBox.appendChild(a);
        });
        side.appendChild(tagBox);
      }
      side.appendChild(el("p", { "class": "blog__count", text: posts.length + (posts.length === 1 ? " post" : " posts") }));
    }
    // tag filter: clicking a tag shows only those posts; click again to clear
    doc.addEventListener("click", function (e) {
      var t = e.target.closest("[data-tag]");
      if (!t) return;
      e.preventDefault();
      var tag = t.getAttribute("data-tag");
      var active = feed.getAttribute("data-tag") === tag ? "" : tag;
      feed.setAttribute("data-tag", active);
      feed.querySelectorAll(".post").forEach(function (art, i) {
        var has = !active || (posts[i].tags || []).indexOf(active) !== -1;
        art.hidden = !has;
      });
    });
    feed.querySelectorAll(".rise").forEach(function (n) { n.classList.add("is-in"); });
  }

  /* ---- 8. PHONE (white iPhone 5c) ----------------------------------- */
  var phone = doc.getElementById("phone");
  if (phone) {
    var stage = doc.getElementById("phone-stage");
    var screen = doc.getElementById("screen");
    var appLock = doc.getElementById("app-lock");
    var appHome = doc.getElementById("app-home");
    var appView = doc.getElementById("app-view");
    var appBody = doc.getElementById("app-body");
    var appTitle = doc.getElementById("app-title");
    var spinBtn = doc.getElementById("phone-spin");
    var resetBtn = doc.getElementById("phone-reset");
    var phoneCfg = settings.phone || {};
    var ry = -28, rx = 6, spinning = phoneCfg.spin !== false && !reduceMotion, using = false, dragging = false;
    var dragX = 0, dragY = 0, startRy = 0, startRx = 0, moved = false;

    function setRot() {
      phone.style.setProperty("--ry", ry.toFixed(2) + "deg");
      phone.style.setProperty("--rx", rx.toFixed(2) + "deg");
    }

    // clock
    function pad2(n) { return (n < 10 ? "0" : "") + n; }
    function clock() {
      var d = new Date();
      var t = pad2(d.getHours()) + ":" + pad2(d.getMinutes());
      doc.getElementById("screen-time").textContent = t;
      doc.getElementById("lock-time").textContent = t;
      doc.getElementById("lock-date").textContent = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).toLowerCase();
    }
    clock(); setInterval(clock, 15000);

    // spin loop
    (function spin() {
      if (spinning && !dragging && !using) { ry += 0.35; if (ry > 180) ry -= 360; setRot(); }
      requestAnimationFrame(spin);
    })();
    setRot();

    // drag to rotate
    stage.addEventListener("pointerdown", function (e) {
      if (using) return;
      dragging = true; moved = false;
      dragX = e.clientX; dragY = e.clientY; startRy = ry; startRx = rx;
      phone.classList.add("is-dragging");
      stage.setPointerCapture && stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - dragX, dy = e.clientY - dragY;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      ry = startRy + dx * 0.5; rx = Math.max(-40, Math.min(40, startRx - dy * 0.3));
      setRot();
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      phone.classList.remove("is-dragging");
      if (!moved && e.target.closest && e.target.closest(".phone")) use();   // a tap, not a drag
    }
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);

    function use() {
      using = true;
      ry = 0; rx = 0; setRot();
      phone.style.setProperty("--zoom", "1.15");
      phone.classList.add("is-using");
      spinBtn.setAttribute("aria-pressed", "false");
    }
    function letGo() {
      using = false;
      phone.style.setProperty("--zoom", "1");
      phone.classList.remove("is-using");
      rx = 6; setRot();
    }
    spinBtn.addEventListener("click", function () {
      spinning = !spinning;
      spinBtn.setAttribute("aria-pressed", spinning ? "true" : "false");
      if (spinning && using) letGo();
    });
    resetBtn.addEventListener("click", letGo);

    // screens
    function show(section) {
      [appLock, appHome, appView].forEach(function (sct) { sct.hidden = sct !== section; sct.classList.toggle("is-active", sct === section); });
    }
    doc.getElementById("unlock").addEventListener("click", function () { use(); show(appHome); });
    doc.getElementById("home-button").addEventListener("click", function () { show(appHome); });
    doc.getElementById("app-back").addEventListener("click", function () { show(appHome); });
    // while the phone is in use, the screen handles its own taps (not the drag)
    screen.addEventListener("pointerdown", function (e) { if (using) e.stopPropagation(); });
    doc.getElementById("home-button").addEventListener("pointerdown", function (e) { if (using) e.stopPropagation(); });

    var stills = [];
    projects.forEach(function (p) { if (p.still) stills.push({ file: p.still, label: label(p) }); });
    posts.forEach(function (p) { if (p.type === "photo") (p.photos || []).forEach(function (f) { if (!stills.some(function (x) { return x.file === f; })) stills.push({ file: f, label: p.caption || "" }); }); });

    // every app on the phone: a name, an icon, and what it shows
    var APPS = [
      { id: "camera", name: "camera", icon: "camera", render: function (box) {
        box.appendChild(el("p", { "class": "app__text", text: stills.length ? "camera roll · " + stills.length : "no photos yet" }));
        var g = el("div", { "class": "app__grid" });
        stills.forEach(function (st) {
          var a = el("a", { href: "/images/" + st.file, target: "_blank", rel: "noopener" });
          a.appendChild(el("img", { src: "/images/" + st.file, alt: st.label, loading: "lazy" }));
          g.appendChild(a);
        });
        box.appendChild(g);
      } },
      { id: "photos", name: "photos", icon: "photo", render: function (box) { APPS[0].render(box); } },
      { id: "videos", name: "videos", icon: "video", render: function (box) {
        if (!projects.length) box.appendChild(el("p", { "class": "app__text", text: "no videos yet" }));
        projects.forEach(function (p, i) {
          var row = el("button", { "class": "app__row", type: "button" });
          if (p.still) row.appendChild(el("img", { src: "/images/" + p.still, alt: "" }));
          row.appendChild(el("span", { text: label(p) }));
          row.appendChild(el("small", { text: String(p.year) }));
          row.addEventListener("click", function () { openPlayer(i); });
          box.appendChild(row);
        });
      } },
      { id: "notes", name: "notes", icon: "notes", render: function (box) {
        if (!posts.length) box.appendChild(el("p", { "class": "app__text", text: "no notes yet" }));
        posts.forEach(function (p, i) {
          var n = el("a", { "class": "app__note", href: "/blog#post-" + (i + 1), style: "display:block" });
          n.appendChild(el("span", { text: p.title || p.caption || p.quote || p.type }));
          n.appendChild(el("small", { text: p.date + " · " + p.type }));
          box.appendChild(n);
        });
      } },
      { id: "contacts", name: "contacts", icon: "contacts", render: function (box) {
        (settings.socials || []).forEach(function (sm) {
          var row = el("a", { "class": "app__row", href: sm.url, target: "_blank", rel: "noopener" });
          row.innerHTML = icon(sm.id, "icon") ;
          row.querySelector("svg").style.width = "1.2em"; row.querySelector("svg").style.height = "1.2em"; row.querySelector("svg").style.fill = "#fff";
          row.appendChild(el("span", { text: sm.id }));
          row.appendChild(el("small", { text: "open" }));
          box.appendChild(row);
        });
      } },
      { id: "messages", name: "messages", icon: "messages", render: function (box) {
        var ig = (settings.socials || []).filter(function (x) { return x.id === "instagram"; })[0];
        box.appendChild(el("p", { "class": "app__text", text: "no email. dms only." }));
        if (ig) { var a = el("a", { "class": "app__row", href: ig.url, target: "_blank", rel: "noopener" }); a.appendChild(el("span", { text: "message on instagram" })); a.appendChild(el("small", { text: "open" })); box.appendChild(a); }
      } },
      { id: "settings", name: "settings", icon: "settings", render: function (box) {
        var toggles = [
          { name: "negative", get: function () { return root.classList.contains("is-negative"); }, set: function (v) { setNegative(v); } },
          { name: "grain", get: function () { return root.getAttribute("data-grain") !== "off"; }, set: function (v) { if (v) root.removeAttribute("data-grain"); else root.setAttribute("data-grain", "off"); } },
          { name: "scanlines", get: function () { return root.getAttribute("data-scanlines") !== "off"; }, set: function (v) { if (v) root.removeAttribute("data-scanlines"); else root.setAttribute("data-scanlines", "off"); } },
          { name: "colour fringe", get: function () { return root.getAttribute("data-fringe") !== "off"; }, set: function (v) { if (v) root.removeAttribute("data-fringe"); else root.setAttribute("data-fringe", "off"); } }
        ];
        toggles.forEach(function (t) {
          var b = el("button", { "class": "app__toggle", type: "button", "aria-pressed": t.get() ? "true" : "false" });
          b.appendChild(el("span", { text: t.name })); b.appendChild(el("i"));
          b.addEventListener("click", function () { var v = !t.get(); t.set(v); b.setAttribute("aria-pressed", v ? "true" : "false"); });
          box.appendChild(b);
        });
      } },
      { id: "blog", name: "blog", icon: "blog", href: "/blog" },
      { id: "work", name: "work", icon: "work", href: "/" }
    ];
    var DOCK = ["videos", "contacts", "messages", "blog"];

    function appButton(app) {
      var b = el(app.href ? "a" : "button", { "class": "home__app" });
      if (app.href) b.setAttribute("href", app.href); else b.setAttribute("type", "button");
      var ic = el("span", { "class": "home__icon" }); ic.innerHTML = icon(app.icon, "");
      b.appendChild(ic); b.appendChild(el("span", { text: app.name }));
      if (!app.href) b.addEventListener("click", function () { openApp(app); });
      return b;
    }
    function openApp(app) {
      appTitle.textContent = app.name;
      appBody.innerHTML = "";
      app.render(appBody);
      show(appView);
    }
    var homeGrid = doc.getElementById("home-grid"), homeDock = doc.getElementById("home-dock");
    APPS.forEach(function (app) { if (DOCK.indexOf(app.id) === -1) homeGrid.appendChild(appButton(app)); });
    DOCK.forEach(function (id) { var app = APPS.filter(function (a) { return a.id === id; })[0]; if (app) homeDock.appendChild(appButton(app)); });

    window.BV.phone = { use: use, letGo: letGo, open: function (id) { var app = APPS.filter(function (a) { return a.id === id; })[0]; if (app && app.render) { use(); openApp(app); } }, unlock: function () { use(); show(appHome); } };
  }

  doc.addEventListener("visibilitychange", function () { if (doc.hidden) stopAllPreviews(); });
})();
