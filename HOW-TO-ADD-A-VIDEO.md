# How to add a video (and a still) yourself

Everything below happens on github.com in your browser. Nothing goes live until
you merge a pull request, so you can always check the preview first.

This file is NOT part of the website. Only the `site/` folder is published.

---

## 1. Upload the still

1. Open the repo on GitHub and click the **site** folder, then the **images** folder.
2. Click **Add file** (top right) → **Upload files**.
3. Drag your still in. Use a simple filename with no spaces, for example
   `artist-song.jpg`. JPG, same shape as the video (1:1 or 4:3), about
   1600px wide, under 3MB.
4. Scroll down to the **Commit changes** box.
5. Choose **Create a new branch for this commit and start a pull request**.
   Give the branch a short name like `add-artist-song`.
6. Click **Propose changes**.
7. On the next screen click **Create pull request**.

You now have a branch and a pull request. Keep its page open.

## 2. Add the video to the list

1. Go back to the repo home page. At the top left there is a branch button
   that says **main**. Click it and choose the branch you just made.
2. Click the **site** folder, then click **projects.js**.
3. Click the **pencil icon** (top right of the file) to edit.
4. Find the last block that starts with `{` and ends with `},`. Copy it, paste
   it straight after, and fill in the details:

```
  {
    artist: "ARTIST NAME",
    title: "SONG TITLE",
    year: 2026,
    platform: "vimeo",
    link: "https://vimeo.com/blondvirgo/the-video",
    embedId: "123456789",
    aspect: "1:1",
    still: "artist-song.jpg",
    preview: "",
    featured: false,
    credits: [],
  },
```

   - `embedId` for Vimeo: open the video on vimeo.com → **Share** → **Embed**
     tab → copy the digits after `player.vimeo.com/video/`.
   - `embedId` for YouTube: the code after `v=` in the video's address. Also
     set `platform: "youtube"`.
   - `aspect` is `"1:1"` or `"4:3"`. The site never crops.
   - `still` must match the filename you uploaded exactly.
   - Keep the comma after the closing `}`.

5. Click **Commit changes** (top right). Make sure it says it will commit to
   your branch (not main). Click **Commit changes** again.

## 3. Check the preview, then publish

1. Open your pull request (click **Pull requests** at the top of the repo).
2. Wait a minute. Netlify adds a line that says **Deploy Preview** with a
   **Details** link. Click it to see the site with your new video. Check it on
   your phone too.
3. If something is wrong, edit the file again on the same branch. The preview
   updates by itself.
4. Happy? Click **Merge pull request**, then **Confirm merge**. The live site
   updates in about a minute.

## Tips

- If a video will not play in the player, open it on Vimeo → **Settings** →
  **Privacy** → make sure embedding is allowed **Anywhere**.
- To change the order, move the blocks. The one with `featured: true` always
  shows first.
- To switch the film grain off: in `projects.js` change `grain: true` to
  `grain: false`.
- Never upload a file over 3MB. Full videos stay on Vimeo or YouTube.
