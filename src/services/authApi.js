async function readResponse(response) {
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Authentication request failed.');
  return data;
}

export async function fetchCurrentUser() {
  const response = await fetch('/api/auth/me', { credentials: 'same-origin' });
  if (response.status === 401) return null;
  const data = await readResponse(response);
  return data.user;
}

export async function authenticate(email, password, mode) {
  const response = await fetch(`/api/auth/${mode}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await readResponse(response);
  return data.user;
}

export async function signOut() {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'same-origin',
  });
  return readResponse(response);
}
