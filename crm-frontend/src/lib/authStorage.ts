const ACCESS_KEY = "accessToken";

export function getAccessToken(): string | null {
  return (
    localStorage.getItem(ACCESS_KEY) ??
    sessionStorage.getItem(ACCESS_KEY) ??
    null
  );
}
