export function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function getBreadcrumb(url) {
  try {
    const u = new URL(url);
    const parts = [u.hostname.replace(/^www\./, "")];
    const path = u.pathname.replace(/\/$/, "");
    if (path && path !== "/") {
      const segs = path.split("/").filter(Boolean);
      if (segs.length <= 3) parts.push(...segs);
      else parts.push(segs[0], "…", segs[segs.length - 1]);
    }
    return parts.join(" › ");
  } catch {
    return url;
  }
}

export function updateUrl(query, tab) {
  const url = new URL(window.location.href);
  if (query) url.searchParams.set("q", query);
  else url.searchParams.delete("q");
  if (tab && tab !== "all") url.searchParams.set("tab", tab);
  else url.searchParams.delete("tab");
  window.history.pushState({ q: query, tab }, "", url);
}

export function proxyImg(url, displayWidth) {
  if (!url) return null;
  if (!displayWidth) return `/api/proxy/image?url=${encodeURIComponent(url)}`;
  const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
  const size = Math.round(displayWidth * dpr);
  return `/api/proxy/image?url=${encodeURIComponent(url)}&size=${size}`;
}

export function proxyFavicon(domain, size = 32) {
  if (!domain) return null;
  return `/api/proxy/favicon?domain=${encodeURIComponent(domain)}&sz=${size}`;
}

export function estimateImageHeight(result, index, baseWidth = 240) {
  if (result?.resolution) {
    const m = String(result.resolution).match(/(\d+)\s*[×x*]\s*(\d+)/);
    if (m) {
      const w = parseInt(m[1], 10);
      const h = parseInt(m[2], 10);
      if (w > 0 && h > 0) {
        return Math.max(140, Math.min(420, Math.round((h / w) * baseWidth)));
      }
    }
  }
  const key =
    (result?.thumbnail || result?.img_src || result?.url || "") + ":" + index;
  let hash = 0;
  for (let i = 0; i < key.length; i++)
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  const r = (Math.abs(hash) % 1000) / 1000;
  return Math.round(170 + r * 180); // 170..350
}

export function distributeToColumns(items, columnCount) {
  if (!items.length) return Array.from({ length: columnCount }, () => []);
  const cols = Array.from({ length: columnCount }, () => []);
  const heights = new Array(columnCount).fill(0);
  for (const item of items) {
    let minIdx = 0;
    for (let i = 1; i < columnCount; i++)
      if (heights[i] < heights[minIdx]) minIdx = i;
    cols[minIdx].push(item);
    heights[minIdx] += (item.height || 200) + 6;
  }
  return cols;
}
