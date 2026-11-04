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


/* =====================================================================
   The tumblr page's extra texts. All decorative, all editable.
   ===================================================================== */
const FRIED = {
  // error-dialog messages that pop up now and then (close with ok or Esc)
  dialogs: [
    "are you still watching?",
    "it is later than you think.",
    "the hum is not the lights.",
    "you have unread memories.",
    "this page is best viewed in 2016.",
    "do not look behind the monitor.",
    "sign the guestbook before you go.",
    "noclip detected. stay on the carpet.",
    "your session has been saved to vhs.",
    "wrong floor.",
  ],
  // hopecore.txt
  hopecore: [
    "you are not late.",
    "the city is still there in the morning.",
    "keep shooting.",
    "nobody is coming to tell you it is good. do it anyway.",
    "the grain is the point.",
    "rest. then again.",
  ],
  // emergency alert strip (facts only)
  eas: "THIS IS A TEST OF THE BLONDVIRGO BROADCAST SYSTEM · THERE IS NO EMERGENCY · MUSIC VIDEO DIRECTOR · BRISTOL, UK · NO EMAIL · DM ONLY · THIS CONCLUDES THE TEST",
  // the paperclip
  clippy: "it looks like you are trying to book a music video.",
  // desktop icons (left column)
  icons: [
    { name: "my videos",      icon: "work",     action: "work" },
    { name: "hopecore.txt",   icon: "notes",    action: "hopecore" },
    { name: "block 9",        icon: "phone",    action: "block" },
    { name: "2016.exe",       icon: "video",    action: "tlop" },
    { name: "paparazzi",      icon: "camera",   action: "pap" },
    { name: "guestbook",      icon: "chat",     action: "guestbook" },
    { name: "recycle bin",    icon: "settings", action: "restore" },
    { name: "DO NOT OPEN.exe", icon: "text",    action: "bsod" },
  ],
  // sticker words (facts, emoji, gen z)
  stickers: ["🚬", "💿", "📼", "🔥", "🖤", "☆", "💀", "🗿", "🧍", "👁", "2026", "bristol", "1:1", "4:3", "grain", "underground", "dm only", "no email", "real", "fr", "it's giving", "core", "БЛОНДВИРГО", "ждём", "level 0", "noclip", "100%", "ok", "brb", "☠", "✦", "🎞", "📟", "💾"],
};
