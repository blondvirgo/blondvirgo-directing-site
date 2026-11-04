/* =====================================================================
   BLONDVIRGO – main.js (the only script)

   Reads PROJECTS and SETTINGS from projects.js and:
   1. builds the work grid
   2. adds the search-engine labels for each video
   3. runs the animations (Blur-in, Rise) – only when motion is allowed
   4. handles hover / tap previews
   5. runs the full-screen player
   ===================================================================== */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var settings = (typeof SETTINGS !== "undefined" && SETTINGS) || {};
  var projects = (typeof PROJECTS !== "undefined" && Array.isArray(PROJECTS)) ? PROJECTS.slice() : [];

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---- settings ---------------------------------------------------- */
  if (settings.grain === false) root.setAttribute("data-grain", "off");

  var DIRECTOR = settings.director || "ALEX RUSU";

  /* ---- helpers ----------------------------------------------------- */
  function el(tag, attrs, children) {
    var node = doc.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "text") node.textContent = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function label(p) { return p.artist + " – " + p.title; }        // "ARTIST – TITLE"

  function aspectParts(p) {
    var m = /^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/.exec(String(p.aspect || "1:1"));
    return m ? [m[1], m[2]] : ["1", "1"];
  }

  function stripExt(name) { return String(name).replace(/\.[a-z0-9]+$/i, ""); }

  function embedUrl(p) {
    var id = encodeURIComponent(String(p.embedId || "").trim());
    if (p.platform === "youtube") {
      return "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&playsinline=1&modestbranding=1";
    }
    return "https://player.vimeo.com/video/" + id + "?dnt=1&autoplay=1&title=0&byline=0&portrait=0&color=ffffff";
  }

  var PLAY_SVG = '<svg class="tile__play" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 3l15 9-15 9z"/></svg>';

  /* ---- 1. build the grid ------------------------------------------- */
  var grid = doc.getElementById("work-grid");

  // featured first, then the order in the file
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
      var eager = index < colsDesktop;                      // first row loads straight away
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
      video.muted = true;                                   // belt and braces for autoplay rules
      media.appendChild(video);
    }

    media.insertAdjacentHTML("beforeend", PLAY_SVG);

    var link = el("a", {
      "class": "tile__link",
      href: p.link || "#",
      "data-index": String(index),
      "aria-label": "Play " + name
    }, [media, el("span", { "class": "tile__title", text: name })]);

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

  /* ---- 3. Breakdown: BLONDVIRGO <-> ALEX RUSU ------------------------ */
  var wordmark = doc.getElementById("wordmark");
  var swapCfg = settings.titleSwap || {};
  var names = [settings.wordmark || "BLONDVIRGO", DIRECTOR];
  var nameIndex = 0;
  var swapping = false;

  function setLetters(text, startBroken) {
    wordmark.textContent = "";
    var holder = el("span", { "aria-hidden": "true" });
    text.split("").forEach(function (ch, i) {
      var letter = el("span", { "class": "wordmark__letter", text: ch });
      if (startBroken) scatter(letter);
      holder.appendChild(letter);
    });
    wordmark.appendChild(holder);
    return holder;
  }

  function scatter(letter) {
    var rnd = function (a, b) { return a + Math.random() * (b - a); };
    letter.style.setProperty("--dx", rnd(-0.35, 0.35).toFixed(2) + "em");
    letter.style.setProperty("--dy", rnd(-0.45, 0.45).toFixed(2) + "em");
    letter.style.setProperty("--dr", rnd(-10, 10).toFixed(1) + "deg");
    letter.style.setProperty("--d", rnd(0, 0.35).toFixed(2) + "s");
  }

  function breakdownTo(index) {
    if (!wordmark || swapping || index === nameIndex) return;
    swapping = true;
    var letters = wordmark.querySelectorAll(".wordmark__letter");
    letters.forEach(scatter);
    wordmark.classList.add("is-breaking");                       // letters blur, drift, fade

    var outTime = reduceMotion ? 600 : 950;
    setTimeout(function () {
      nameIndex = index;
      setLetters(names[nameIndex], true);                        // new word, already broken apart
      void wordmark.offsetWidth;                                 // let the browser see that state
      wordmark.classList.remove("is-breaking");                  // ...then reassemble
      setTimeout(function () { swapping = false; }, 1000);
    }, outTime);
  }

  function swapTitle() { breakdownTo(nameIndex === 0 ? 1 : 0); }

  if (wordmark && wordmark.hasAttribute("data-swap")) {
    setLetters(names[0], false);

    if (swapCfg.onClick !== false) {
      wordmark.addEventListener("click", function (e) {
        e.preventDefault();                                      // stays put; just swaps
        swapTitle();
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
        if (doc.hidden || !wordmarkVisible) return;              // not while nobody is looking
        swapTitle();
      }, every * 1000);
    }
  }

  /* ---- 3b. animations ---------------------------------------------- */
  function reveal(node) { node.classList.add("is-in"); }

  // Blur-in: wordmark on load
  doc.querySelectorAll(".blur-in").forEach(function (n) {
    requestAnimationFrame(function () { requestAnimationFrame(function () { reveal(n); }); });
  });

  // Rise: hero lines straight away (staggered by --i); tiles when scrolled into view
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

  /* ---- 4. previews (silent loops) ---------------------------------- */
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
      // phones: play while the tile is on screen, pause when it scrolls away
      var prevObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) startPreview(e.target); else stopPreview(e.target);
        });
      }, { threshold: 0.5 });
      tiles.forEach(function (t) { if (previewOf(t)) prevObs.observe(t); });
    }
  }

  /* ---- 5. player --------------------------------------------------- */
  var player = doc.getElementById("player");
  var frame = doc.getElementById("player-frame");
  var caption = doc.getElementById("player-caption");
  var closeBtn = doc.getElementById("player-close");
  var lastFocus = null;

  function openPlayer(index) {
    var p = projects[index];
    if (!p || !player) return;
    stopAllPreviews();

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
    caption.textContent = label(p) + " · " + p.year + " · DIRECTED BY " + DIRECTOR;

    lastFocus = doc.activeElement;
    player.hidden = false;
    doc.body.classList.add("is-locked");
    closeBtn.focus();
  }

  function closePlayer() {
    if (!player || player.hidden) return;
    frame.innerHTML = "";                                   // stops the video and sound
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
  }

  if (grid) {
    grid.addEventListener("click", function (e) {
      var link = e.target.closest(".tile__link");
      if (!link) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;   // let "open in new tab" through
      e.preventDefault();
      openPlayer(Number(link.getAttribute("data-index")));
    });
  }

  if (player) {
    closeBtn.addEventListener("click", closePlayer);

    // clicking the black area (not the video or caption) closes
    player.addEventListener("click", function (e) {
      if (e.target === player || e.target === doc.getElementById("player-stage")) closePlayer();
    });

    // Esc closes
    doc.addEventListener("keydown", function (e) {
      if (player.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); closePlayer(); }
    });

    // Tab stays inside the player: two invisible stops at either end bounce
    // focus back to the other side (works even with a cross-site video frame).
    var startStop = doc.getElementById("player-sentinel-start");
    var endStop = doc.getElementById("player-sentinel-end");
    function lastFocusable() { return frame.querySelector("iframe") || closeBtn; }
    startStop.addEventListener("focus", function () { lastFocusable().focus(); });
    endStop.addEventListener("focus", function () { closeBtn.focus(); });
    doc.addEventListener("focusin", function (e) {
      if (player.hidden) return;
      if (!player.contains(e.target)) closeBtn.focus();
    });
  }

  // pause silent previews when the tab is hidden
  doc.addEventListener("visibilitychange", function () { if (doc.hidden) stopAllPreviews(); });
})();
