(() => {
  "use strict";

  const form = document.getElementById("loop-form");
  const input = document.getElementById("youtube-url");
  const inputWrap = document.getElementById("input-wrap");
  const hint = document.getElementById("hint");
  const home = document.getElementById("home");
  const player = document.getElementById("player");
  const video = document.getElementById("video");
  const newLink = document.getElementById("new-link");

  const DEFAULT_HINT = "One link, or a few. They’ll play on repeat.";
  const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
  const PLAYLIST_ID = /^[A-Za-z0-9_-]{12,100}$/;
  const PATH_VIDEO_ROUTES = new Set(["shorts", "embed", "live", "v", "e"]);

  function setHint(message, isError = false) {
    hint.textContent = message;
    hint.classList.toggle("is-error", isError);
  }

  function fail(message) {
    setHint(message, true);
    inputWrap.classList.remove("shake");
    void inputWrap.offsetWidth;
    inputWrap.classList.add("shake");
    input.focus();
  }

  function cleanToken(value) {
    return value
      .replace(/^[<("'[{\]]+/, "")
      .replace(/[>"')\]},.;!?]+$/, "");
  }

  function asUrl(value) {
    const hasScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(value);
    const candidate = hasScheme
      ? value
      : value.startsWith("//")
        ? `https:${value}`
        : `https://${value}`;

    return new URL(candidate);
  }

  function isYouTubeHost(host) {
    return (
      host === "youtube.com" ||
      host.endsWith(".youtube.com") ||
      host === "youtu.be" ||
      host === "www.youtu.be"
    );
  }

  function getVideoId(url) {
    const host = url.hostname.toLowerCase();

    if (host === "youtu.be" || host === "www.youtu.be") {
      const shortId = url.pathname.split("/").filter(Boolean)[0] || "";
      return VIDEO_ID.test(shortId) ? shortId : "";
    }

    if (host !== "youtube.com" && !host.endsWith(".youtube.com")) {
      return "";
    }

    const parts = url.pathname.split("/").filter(Boolean);
    const route = (parts[0] || "").toLowerCase();
    let id = "";

    if (route === "watch") {
      id = url.searchParams.get("v") || "";
    } else if (PATH_VIDEO_ROUTES.has(route)) {
      id = parts[1] || "";
    }

    return VIDEO_ID.test(id) ? id : "";
  }

  function parseInput(raw) {
    const tokens = raw.trim().split(/[\s,]+/).filter(Boolean);
    const ids = [];
    const playlists = [];

    for (const rawToken of tokens) {
      const token = cleanToken(rawToken);

      if (!token) continue;

      // Also accept a bare video ID.
      if (VIDEO_ID.test(token)) {
        ids.push(token);
        continue;
      }

      let url;
      try {
        url = asUrl(token);
      } catch {
        continue;
      }

      if (!isYouTubeHost(url.hostname.toLowerCase())) continue;

      const id = getVideoId(url);
      if (id) ids.push(id);

      const playlistId = url.searchParams.get("list");
      if (playlistId && PLAYLIST_ID.test(playlistId)) {
        playlists.push(playlistId);
      }
    }

    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length) {
      return { kind: "videos", ids: uniqueIds };
    }

    if (playlists.length) {
      return { kind: "playlist", id: playlists[0] };
    }

    return null;
  }

  function buildEmbed(parsed) {
    const params = new URLSearchParams({
      autoplay: "1",
      loop: "1",
      rel: "0",
      playsinline: "1",
    });

    if (parsed.kind === "playlist") {
      params.set("listType", "playlist");
      params.set("list", parsed.id);
      return `https://www.youtube-nocookie.com/embed?${params}`;
    }

    params.set("playlist", parsed.ids.join(","));
    return `https://www.youtube-nocookie.com/embed/${parsed.ids[0]}?${params}`;
  }

  function openPlayer(src) {
    home.hidden = true;
    player.hidden = false;
    video.src = src;
    video.focus({ preventScroll: true });
  }

  function showHome() {
    player.hidden = true;
    video.src = "about:blank";
    home.hidden = false;
    input.focus({ preventScroll: true });
    input.select();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (location.protocol === "file:") {
      fail("YouTube can’t play from a file:// page. Serve the site over HTTP instead.");
      return;
    }

    const value = input.value;
    if (!value.trim()) {
      fail("Paste a YouTube link first.");
      return;
    }

    const parsed = parseInput(value);
    if (!parsed) {
      fail("That doesn’t look like a playable YouTube link.");
      return;
    }

    inputWrap.classList.remove("is-error", "shake");
    setHint(DEFAULT_HINT);
    openPlayer(buildEmbed(parsed));
  });

  input.addEventListener("input", () => {
    inputWrap.classList.remove("is-error", "shake");
    if (hint.classList.contains("is-error")) {
      setHint(DEFAULT_HINT);
    }
  });

  inputWrap.addEventListener("animationend", () => {
    inputWrap.classList.remove("shake");
  });

  newLink.addEventListener("click", showHome);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !player.hidden) {
      showHome();
    }
  });
})();
