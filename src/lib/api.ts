export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    [key: string]: unknown;
}

export async function apiFetch<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const response = await fetch(endpoint, {
        ...options,
        headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || response.statusText || 'API Error');
    }

    return data as T;
}
