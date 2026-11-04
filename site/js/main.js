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

  doc.addEventListener("visibilitychange", function () { if (doc.hidden) stopAllPreviews(); });
})();
