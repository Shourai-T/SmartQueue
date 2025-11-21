const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiOptions extends RequestInit {
	auth?: boolean;
}

export async function apiFetch<T>(
	path: string,
	method: HttpMethod = 'GET',
	body?: unknown,
	options: ApiOptions = {}
): Promise<T> {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		'Accept': 'application/json',
		...(options.headers as Record<string, string> | undefined),
	};

	const token = localStorage.getItem('access_token');
	if (options.auth !== false && token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	const res = await fetch(`${API_BASE_URL}${path}`, {
		method,
		headers,
		body: body !== undefined ? JSON.stringify(body) : undefined,
		mode: 'cors',
		credentials: 'omit',
		...options,
	});

	const contentType = res.headers.get('content-type') || '';

	if (!res.ok) {
		let message = `HTTP ${res.status}`;
		if (contentType.includes('application/json')) {
			try {
				const errData = await res.json();
				message = (errData?.message as string) || message;
			} catch {
				// ignore
			}
		} else {
			try {
				const text = await res.text();
				if (text) message = text;
			} catch {
				/* ignore */
			}
		}
		throw new Error(message);
	}

	// No content
	if (res.status === 204) return undefined as unknown as T;

	if (contentType.includes('application/json')) {
		return (await res.json()) as T;
	}

	// For DELETE/PATCH stubs, allow non-JSON success response
	if (method === 'DELETE' || method === 'PATCH') {
		return undefined as unknown as T;
	}

	const text = await res.text();
	throw new Error(
		`Expected JSON but got non-JSON response from ${path}. Body: ${text.slice(0, 120)}`
	);
}

export { API_BASE_URL };

