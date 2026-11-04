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
   aspect    – "1:1" (default) or "4:3". Never cropped.
   still     – filename inside site/images/.                  (required)
   stillSizes– leave out unless your developer has made
               -800 / -1600 web copies of the still.
   preview   – optional silent loop in site/previews/ (MP4, 4–6s, <3MB).
   featured  – true for the main video (shown first, heavier title).
   credits   – list of { role, name } for later. Leave [] for now.
   ===================================================================== */

const SETTINGS = {
  grain: true,            // set to false to switch the film grain off
  director: "ALEX RUSU",
  wordmark: "BLONDVIRGO",
};

const PROJECTS = [
  {
    artist: "ANTZZ FEAT. VIRIDIAN",
    title: "GIVENCHY SLIDES",
    year: 2026,
    platform: "vimeo",
    link: "https://vimeo.com/blondvirgo/givenchy-slides",
    embedId: "1238961800", // [PLACEHOLDER: still needed] – one of your four Vimeo IDs; confirm which one is GIVENCHY SLIDES
    aspect: "1:1",
    // STAND-IN: this still is from your "I Spy" footage, used until a
    // GIVENCHY SLIDES still is uploaded. Replace the filename when ready.
    still: "i-spy-003.jpg",
    stillSizes: [800, 1600],
    preview: "",
    featured: true,
    credits: [],
  },
];
