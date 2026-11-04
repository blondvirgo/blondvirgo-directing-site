/* =====================================================================
   BLONDVIRGO – posts.js
   The blog ("/blog"). Newest post goes at the TOP of the list.
   Nothing here is invented: only your own stills, videos and links.
   Add your own words whenever you like.

   POST TYPES (Tumblr style)
   text   – { type:"text", date, title, body }           body is plain text, blank line = new paragraph
   photo  – { type:"photo", date, caption, photos:[ "file.jpg", ... ] }   files live in site/images/
   video  – { type:"video", date, caption, project:"GIVENCHY SLIDES" }   opens the site player
   audio  – { type:"audio", date, caption, file:"track.mp3" }           files live in site/audio/ (under 3MB)
   quote  – { type:"quote", date, quote, source }
   link   – { type:"link", date, title, url, description }
   chat   – { type:"chat", date, title, lines:[ "name: text", ... ] }

   Every post can also have:  tags: ["bts", "bristol"]   and   published: false
   Dates are "YYYY-MM-DD".
   ===================================================================== */

const POSTS = [
  {
    type: "video",
    date: "2026-11-04",
    caption: "givenchy slides – antzz feat. viridian",
    project: "GIVENCHY SLIDES",
    tags: ["music video", "2026"],
    published: true,
  },
  {
    type: "photo",
    date: "2026-11-04",
    caption: "stills from the i spy shoot",   // [CHECK: caption taken from your still filenames]
    photos: ["i-spy-003.jpg", "i-spy-004.jpg", "i-spy-005.jpg", "i-spy-006.jpg"],
    tags: ["stills", "bts"],
    published: true,
  },
  {
    type: "link",
    date: "2026-11-04",
    title: "blondvirgo on vimeo",
    url: "https://vimeo.com/blondvirgo",
    description: "all the videos, in one place.",
    tags: ["vimeo"],
    published: true,
  },
];
