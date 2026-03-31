const API_URL = import.meta.env.VITE_API_URL || 'https://audio-based-intent-predection.vercel.app'

function formatErrorDetail(detail) {
  if (detail == null) return null
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((x) => (typeof x === 'object' && x != null && 'msg' in x ? x.msg : String(x)))
      .filter(Boolean)
      .join('; ')
  }
  if (typeof detail === 'object' && detail.msg) return String(detail.msg)
  try {
    return JSON.stringify(detail)
  } catch {
    return String(detail)
  }
}

export async function apiFetch(path, { token, body, headers = {}, ...rest } = {}) {
  const isForm = body instanceof FormData
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      body,
      headers: {
        ...(isForm ? {} : body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === 'Failed to fetch' || msg.includes('NetworkError')) {
      throw new Error(
        'Cannot reach the API. Ensure the backend is running and VITE_API_URL matches the server URL.',
      )
    }
    throw new Error(msg)
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    const detail = payload.detail ?? payload.message
    const msg = formatErrorDetail(detail) || `Request failed (${response.status})`
    throw new Error(msg)
  }
  return response.json()
}

export { API_URL }
