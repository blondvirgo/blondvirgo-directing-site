/* =====================================================================
   BLONDVIRGO – projects.js
   This is the ONLY file you edit to add or change a video.
   The homepage, the player and the search-engine labels are all built
   from this list automatically.

   HOW TO ADD A VIDEO
   1. Upload ONE still image into  site/images/  (JPG, 1:1 or 4:3,
      ideally 1600px wide, under 3MB). Note its exact filename.
   2. Copy one of the blocks below (from "{" to "},"), paste it under
      the last one, and fill in the details.
   3. Save to a NEW branch and open a pull request. See
      HOW-TO-ADD-A-VIDEO.md in the repo root for the exact clicks.

   FIELDS
   artist    – as it should appear, in caps.                  (required)
   title     – song title, in caps.                           (required)
   year      – four digits.                                   (required)
   platform  – "vimeo" or "youtube".                          (required)
   link      – the public page of the video.                  (required)
   embedId   – Vimeo: the number from Share > Embed.
               YouTube: the code after "v=" in the link.      (required)
   embedHash – Vimeo ONLY, for videos set to "Private link" / "Hide from
               Vimeo": the code after "?h=" in the Share > Embed code,
               or after the second slash in the share link
               (vimeo.com/123456789/THISPART). Leave "" if public.
   published – false hides the video from the site until it is ready.
   aspect    – "1:1" (default) or "4:3". Never cropped.
   still     – filename inside site/images/.                  (required)
   stillSizes– leave out unless your developer has made
               -800 / -1600 web copies of the still.
   preview   – optional silent loop in site/previews/ (MP4, 4–6s, <3MB).
   featured  – true for the main video (shown first, heavier title).
   credits   – list of { role, name } for later. Leave [] for now.
   ===================================================================== */

const SETTINGS = {
  // The menu, in order. Shown on every page.
  nav: [
    { label: "blondvirgo", href: "/",      page: "work" },
    { label: "iphone 5",   href: "/phone", page: "phone" },
    { label: "tumblr",     href: "/blog",  page: "blog" },
  ],
  // the scrolling line at the top of the tumblr page (facts only)
  marquee: "welcome to blondvirgo's page ★ music video director ★ bristol, uk ★ est. 2026 ★ 1:1 and 4:3 ★ grainy ★ no email, dm only ★",
  // decorative stickers scattered over the tumblr page
  stickers: ["🚬", "💿", "📼", "🔥", "🖤", "☆", "2026", "bristol", "1:1", "4:3", "grain", "underground", "dm only", "no email", "🎞", "☠", "✦", "100%", "ok", "brb"],
  // The only contact routes. Order = order on the page.
  socials: [
    { id: "instagram", label: "BLONDVIRGO on Instagram", url: "https://www.instagram.com/arussuuuu/" },
    { id: "youtube",   label: "BLONDVIRGO on YouTube",   url: "https://www.youtube.com/@blondvirgo" },
    { id: "vimeo",     label: "BLONDVIRGO on Vimeo",     url: "https://vimeo.com/blondvirgo" },
    { id: "linkedin",  label: "Alex Rusu on LinkedIn",   url: "https://www.linkedin.com/in/alex-c-rusu" },
  ],
  blogDescription: "music video director · bristol, uk",   // [CHECK: shown in the blog sidebar]
  phone: {
    spin: true,           // the phone turns by itself until someone uses it
  },

  grain: true,            // film grain over the page. false = off
  scanlines: true,        // faint VHS lines over the page. false = off
  director: "ALEX RUSU",
  wordmark: "BLONDVIRGO",

  // The big title switches between the wordmark and the director's name
  // with a different effect each time: breakdown, rgb, vhs, flicker, crush,
  // static, slide, collage (letters fill with your footage), flip (3D).
  titleSwap: {
    onClick: true,        // clicking the title: effect + swap + negative toggle
    everySeconds: 60,     // automatic swap; 0 = timer off
    negativeOnClick: true // every click flips the whole site to negative and back
  },
  fxOnLoad: true,         // one short rgb-split hit when the page opens
  fxOnTiles: true,        // glitch when a tile is opened
  colourFringe: true,     // red/cyan fringes in the glitch effects. false = white only
  pageGlitch: {
    enabled: true,        // rare glitch of the whole page (never blocks clicks)
    averageSeconds: 75    // how often on average; it is random
  },
  cursor: {
    enabled: true,        // liquid cursor on desktop
    colourWithSpeed: true // shifts from white to red/cyan the faster you move
  },
};

const PROJECTS = [
  {
    artist: "ANTZZ FEAT. VIRIDIAN",
    title: "GIVENCHY SLIDES",
    year: 2026,
    platform: "vimeo",
    link: "https://vimeo.com/blondvirgo/givenchy-slides",
    embedId: "1238961800", // [PLACEHOLDER: still needed] – one of your four Vimeo IDs; confirm which one is GIVENCHY SLIDES
    embedHash: "",         // [PLACEHOLDER: still needed] – see "embedHash" above if the video is a private link
    aspect: "1:1",
    published: true,
    // STAND-IN: this still is from your "I Spy" footage, used until a
    // GIVENCHY SLIDES still is uploaded. Replace the filename when ready.
    still: "i-spy-003.jpg",
    stillSizes: [800, 1600],
    preview: "",
    featured: true,
    credits: [],
  },

  /* ---- Your other three Vimeo videos. They stay OFF the site until you
          fill in artist + title + a still and set published: true. ---- */
  {
    artist: "[PLACEHOLDER: still needed]",
    title: "[PLACEHOLDER: still needed]",
    year: 2026,
    platform: "vimeo",
    link: "https://vimeo.com/1238971039",
    embedId: "1238971039",
    embedHash: "",
    aspect: "1:1",
    still: "",             // upload a still to site/images/ and put its filename here
    preview: "",
    featured: false,
    published: false,
    credits: [],
  },
  {
    artist: "[PLACEHOLDER: still needed]",
    title: "[PLACEHOLDER: still needed]",
    year: 2026,
    platform: "vimeo",
    link: "https://vimeo.com/1238970905",
    embedId: "1238970905",
    embedHash: "",
    aspect: "1:1",
    still: "",
    preview: "",
    featured: false,
    published: false,
    credits: [],
  },
  {
    artist: "[PLACEHOLDER: still needed]",
    title: "[PLACEHOLDER: still needed]",
    year: 2026,
    platform: "vimeo",
    link: "https://vimeo.com/1238956867",
    embedId: "1238956867",
    embedHash: "",
    aspect: "1:1",
    still: "",
    preview: "",
    featured: false,
    published: false,
    credits: [],
  },
];
