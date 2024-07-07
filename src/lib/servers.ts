const searchParams = new URLSearchParams(location.search);

const removeSlash = (s: string | null) =>
  !s ? s : s.endsWith("/") ? s.slice(0, -1) : s;

export const api =
  removeSlash(searchParams.get("api")) ?? "https://api.meower.org";
export const cl =
  removeSlash(searchParams.get("cl")) ?? "https://server.meower.org";
export const uploads =
  removeSlash(searchParams.get("uploads")) ?? "https://uploads.meower.org";
