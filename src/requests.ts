export function fetchUrl(absolutePath: string, params?: Record<string, string>,
                         init?: RequestInit | undefined): Promise<Response> {
    let headers: HeadersInit = init?.method == 'POST' ? {
        'Content-Type': 'application/json'
    } : {}

    let urlParams = new URLSearchParams(params)

    let paramString = urlParams.toString()
    if (paramString.length > 0) {
        paramString = `?${paramString}`
    }

    return fetch(`${absolutePath}${paramString}`, appendHeaders(headers, init))
}

export function params(array: string[][]): URLSearchParams {
    return new URLSearchParams(array)
}

/**
 * Appends headers to the given RequestInit
 * @param headers The headers to append
 * @param init Existing request information
 * @returns The resulting RequestInit
 */
function appendHeaders(headers: HeadersInit, init?: RequestInit | undefined): RequestInit {
    if (init == undefined) {
        return {
            headers: headers
        }
    }

    return {
        ...init,
        headers: {
            ...headers,
            ...init?.headers
        }
    }
}

/**
 * Checks if the given status number is within [500, 599]
 * @param status The status code
 * @returns If the status is an Internal Server Error
 */
export function isISE(status: number): boolean {
    return status >= 500 && status < 600
}
