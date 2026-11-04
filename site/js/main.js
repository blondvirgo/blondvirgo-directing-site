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

  /* ---- 3. FX library: BLONDVIRGO <-> ALEX RUSU ----------------------
     Every effect: name, how long it runs, and when (0–1) the word swaps.
     "letters" effects animate each letter; the others animate the whole
     word plus the two coloured ghost copies.                          */
  var EFFECTS = [
    { name: "breakdown", dur: 1900, swapAt: 0.5, letters: true },
    { name: "rgb",       dur: 900,  swapAt: 0.5 },
    { name: "vhs",       dur: 900,  swapAt: 0.48 },
    { name: "flicker",   dur: 900,  swapAt: 0.5 },
    { name: "negative",  dur: 700,  swapAt: 0.5 },
    { name: "crush",     dur: 1100, swapAt: 0.51, letters: true },
    { name: "static",    dur: 900,  swapAt: 0.5 },
    { name: "slide",     dur: 1100, swapAt: 0.45, letters: true }
  ];

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
  }

  function letters() { return wordmark.querySelectorAll(".wordmark__letter"); }

  function pickEffect(wanted) {
    var pool = EFFECTS.filter(function (f) { return f.name !== lastFx; });
    var fx = wanted ? EFFECTS.filter(function (f) { return f.name === wanted; })[0] : null;
    return fx || pool[Math.floor(Math.random() * pool.length)];
  }

  // run one effect; swapText=true switches the word half way through
  function runFx(wanted, swapText) {
    if (!wordmark || busy) return;
    busy = true;
    var fx = reduceMotion ? { name: "fade", dur: 1200, swapAt: 0.5, letters: true } : pickEffect(wanted);
    lastFx = fx.name;
    var next = swapText ? (nameIndex === 0 ? 1 : 0) : nameIndex;

    letters().forEach(scatter);

    if (fx.name === "breakdown" || fx.name === "fade") {
      wordmark.classList.add("is-breaking");
      setTimeout(function () {
        nameIndex = next;
        setWord(names[nameIndex]);
        letters().forEach(scatter);
        void wordmark.offsetWidth;
        wordmark.classList.remove("is-breaking");
      }, fx.dur * fx.swapAt);
      setTimeout(function () { busy = false; }, fx.dur);
      return;
    }

    wordmark.classList.add("fx-" + fx.name);
    if (fx.name === "negative") root.classList.add("fx-negative");
    if (fx.name === "static") root.classList.add("fx-static-burst");

    setTimeout(function () {
      nameIndex = next;
      if (fx.letters) {
        // keep each letter's animation running: only replace the characters
        var chars = names[nameIndex].split("");
        var old = letters();
        if (old.length === chars.length) {
          old.forEach(function (l, i) { l.textContent = chars[i]; });
        } else {
          setWord(names[nameIndex]);
        }
        ghosts.forEach(function (g) { g.textContent = names[nameIndex]; });
      } else {
        setWord(names[nameIndex]);
      }
      if (fx.name === "negative") root.classList.remove("fx-negative");
    }, fx.dur * fx.swapAt);

    setTimeout(function () {
      wordmark.classList.remove("fx-" + fx.name);
      root.classList.remove("fx-static-burst");
      busy = false;
    }, fx.dur);
  }

  if (wordmark && wordmark.hasAttribute("data-swap")) {
    setWord(names[0]);

    if (swapCfg.onClick !== false) {
      wordmark.addEventListener("click", function (e) {
        e.preventDefault();
        runFx(null, true);
      });
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
  window.BV = { fx: function (name, swap) { runFx(name, swap !== false); }, effects: EFFECTS.map(function (f) { return f.name; }) };

  // nav links, footer wordmark and social icons glitch when clicked
  doc.querySelectorAll(".nav__link, .footer__wordmark, .notfound__link").forEach(function (n) {
    n.addEventListener("click", function () { glitchText(n); });
    if (canHover) n.addEventListener("mouseenter", function () { glitchText(n); });
  });
  doc.querySelectorAll(".socials__link").forEach(function (n) {
    n.addEventListener("click", function () { glitchText(n); });
  });

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
