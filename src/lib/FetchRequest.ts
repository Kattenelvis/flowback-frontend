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
