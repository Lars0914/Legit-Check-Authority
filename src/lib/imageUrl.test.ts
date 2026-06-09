import { API_BASE_URL } from "../config";
import {
  resolveArchiveImageUrl,
  resolveGuideImageUrl,
} from "./imageUrl";

const apiRoot = API_BASE_URL.replace(/\/$/, "");

describe("resolveGuideImageUrl", () => {
  it("adds w= to /media/ paths", () => {
    const url = `${apiRoot}/media/Brand/Model/photo.jpg`;
    expect(resolveGuideImageUrl(url)).toBe(
      `${apiRoot}/api?path=media/Brand/Model/photo.jpg&w=1400`,
    );
  });

  it("adds w= to production /api?path=media/ URLs", () => {
    const url = `${apiRoot}/api?path=media/Brand/Model/photo.jpg`;
    expect(resolveGuideImageUrl(url)).toBe(
      `${apiRoot}/api?path=media/Brand/Model/photo.jpg&w=1400`,
    );
  });

  it("replaces existing w= when resizing production URLs", () => {
    const url = `${apiRoot}/api?path=media/Brand/Model/photo.jpg&w=720`;
    expect(resolveGuideImageUrl(url)).toBe(
      `${apiRoot}/api?path=media/Brand/Model/photo.jpg&w=1400`,
    );
  });

  it("appends cache-bust on retry", () => {
    const url = `${apiRoot}/api?path=media/Brand/Model/photo.jpg`;
    const retried = resolveGuideImageUrl(url, true);
    expect(retried).toMatch(/&w=1400&t=\d+$/);
  });
});

describe("resolveArchiveImageUrl", () => {
  it("uses thumb width for list thumbnails", () => {
    const url = `${apiRoot}/api?path=media/Archive/Brand/photo.jpg`;
    expect(resolveArchiveImageUrl(url, "thumb")).toBe(
      `${apiRoot}/api?path=media/Archive/Brand/photo.jpg&w=720`,
    );
  });

  it("uses full width for lightbox / viewer", () => {
    const url = `${apiRoot}/api?path=media/Archive/Brand/photo.jpg`;
    expect(resolveArchiveImageUrl(url, "full")).toBe(
      `${apiRoot}/api?path=media/Archive/Brand/photo.jpg&w=1600`,
    );
  });
});
