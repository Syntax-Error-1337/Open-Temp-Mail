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
        credentials: 'include',
        ...options,
        headers,
    });

    const text = await response.text();
    let data: any;
    try {
        data = JSON.parse(text);
    } catch {
        // If not JSON, use text as message
        data = { message: text };
    }

    if (!response.ok) {
        const error: any = new Error(data.message || response.statusText || `API Error: ${response.status}`);
        error.status = response.status;
        error.statusText = response.statusText;
        throw error;
    }

    return data as T;
}
