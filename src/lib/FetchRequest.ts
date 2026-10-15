import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { env } from '$env/dynamic/public';

export async function fetchRequest(
  method: 'GET' | 'POST',
  api: string,
  data: any = null,
  needs_authorization = true,
  needs_json = true
) {
  if (method === 'GET' && data !== null)
    console.error(
      "Method 'GET' does not take any data, use query parameters instead. For example: /api?id=5"
    );

  const headers: any = {};

  if (!browser) return { res: { ok: false }, json: {} };

  if (needs_authorization) {
    const token = localStorage.getItem('token');
    const relativePath = new URL(location.href).pathname;

    if (token !== null) headers.Authorization = 'Token ' + (localStorage.getItem('token') || '');
    else if (!relativePath.includes('/login')) goto('/login');
  }

  if (needs_json) {
    headers.Accept = 'application/json';
    headers['Content-Type'] = 'application/json';
    data = JSON.stringify(data);
  }

  const toSend: RequestInit = { method, headers };

  if (method !== 'GET') toSend.body = data;

  // Pagination URLs returned by the API are absolute URLs. Keep them intact;
  // otherwise they get prefixed with PUBLIC_API_URL a second time.
  const requestUrl = /^https?:\/\//i.test(api)
    ? api
    : `${env.PUBLIC_API_URL}/${api}`;

  const res = await fetch(requestUrl, toSend);

  const relativePath = new URL(location.href).pathname;
  if (res.status === 401 && !relativePath.includes('/login')) {
    localStorage.clear();
    goto('/login')
  }

  try {
    const json = await res.json();
    return { res, json };
  } catch {

    return { res };
  }
}


// The most rows the backend lets a page have
const PAGE_SIZE = 50;

// Fetches every page of a paginated list. The first page tells how many rows there are,
// so the rest of the pages are fetched at the same time. Rows on pages past maxPages, or on pages
// that failed, are left out and `truncated` is set, instead of being dropped without telling
export async function fetchAllPages<T = any>(api: string, maxPages = 20) {
  const separator = api.includes('?') ? '&' : '?';
  const fetchPage = (offset: number, limit: number) =>
    fetchRequest('GET', `${api}${separator}limit=${limit}&offset=${offset}`);

  const { res, json } = await fetchPage(0, PAGE_SIZE);
  if (!res.ok) return { ok: false, results: [] as T[], truncated: false };

  const results: T[] = json.results ?? [];
  // The backend decides the page size, which might be less than what was asked for
  const limit: number = json.limit || results.length;
  if (!limit) return { ok: true, results, truncated: false };

  const pages = Math.ceil(json.count / limit);
  const others = await Promise.all(
    Array.from({ length: Math.min(pages, maxPages) - 1 }, (_, i) => fetchPage((i + 1) * limit, limit))
  );

  let truncated = pages > maxPages;
  for (const { res, json } of others) {
    if (res.ok) results.push(...(json.results ?? []));
    else truncated = true;
  }

  return { ok: true, results, truncated };
}
