// Small helpers shared by pages and components.

/** Relative prefix back to the site root for a page, so the site works from any folder ("" or "../"). */
export function rootOf(pathname: string): string {
  const depth = pathname.replace(/^\/+/, "").split("/").length - 1;
  return depth > 0 ? "../".repeat(depth) : "";
}

/** Page URLs, relative to the site root. */
export const pages = {
  home: "index.html",
  atlas: "atlas.html",
  path: (key: string) => `path/${key}.html`,
  island: (id: string) => `island/${id}.html`,
  library: "island-art/library.html",
};

export const CREDITS =
  "Paintings, engravings and objects: The Metropolitan Museum of Art, Open Access (CC0). Depth maps: Depth Anything V2 Small (Apache-2.0). Cut-outs: IS-Net via rembg (Apache-2.0).";
