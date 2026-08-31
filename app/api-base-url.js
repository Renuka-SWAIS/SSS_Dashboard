export function getApiBaseUrl() {
  const fallbackUrl =
    "https://staging.sss.swais.in/api/student";

  const rawUrl = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    fallbackUrl
  ).trim();

  return rawUrl.replace(/\/+$/, "");
}