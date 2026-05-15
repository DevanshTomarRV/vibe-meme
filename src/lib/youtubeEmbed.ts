/**
 * Ensures YouTube iframe URLs autoplay with sound (mute=0).
 * Preserves existing query params (e.g. start=) where possible. Non-YouTube URLs unchanged.
 */
export function normalizeYouTubePlaybackUrl(url: string): string {
  if (!url || typeof url !== "string") return url;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "");
      if (!id) return url;
      const embed = new URL(`https://www.youtube.com/embed/${id}`);
      u.searchParams.forEach((val, key) => {
        embed.searchParams.set(key, val);
      });
      embed.searchParams.set("autoplay", "1");
      embed.searchParams.set("mute", "0");
      return embed.toString();
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname.includes("/embed/")) {
        u.searchParams.set("autoplay", "1");
        u.searchParams.set("mute", "0");
        return u.toString();
      }
      const v = u.searchParams.get("v");
      if (v) {
        const embed = new URL(`https://www.youtube.com/embed/${v}`);
        const start = u.searchParams.get("start") ?? u.searchParams.get("t");
        if (start) embed.searchParams.set("start", start);
        embed.searchParams.set("autoplay", "1");
        embed.searchParams.set("mute", "0");
        return embed.toString();
      }
    }
  } catch {
    return url;
  }
  return url;
}

/**
 * Stable key for "same video" checks (ignores mute/autoplay query noise on YouTube).
 * Used so the last N submissions never repeat the same clip across categories.
 */
export function canonicalMemeKey(url: string): string {
  if (!url || typeof url !== "string") return "";
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id ? `yt:${id}` : url;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname.includes("/embed/")) {
        const seg = u.pathname.split("/embed/")[1] ?? "";
        const id = seg.split("/")[0]?.split("?")[0];
        if (id) return `yt:${id}`;
      }
      const v = u.searchParams.get("v");
      if (v) return `yt:${v}`;
    }
    return `url:${u.origin}${u.pathname}`;
  } catch {
    return url;
  }
}
