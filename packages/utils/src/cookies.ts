// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie
export type CookieOptions = {
  expires?: Date
  maxAge?: number
  domain?: string
  path?: string
  secure?: boolean
  httpOnly?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
}

export function createCookie(
  name: string,
  value: string,
  {
    expires,
    maxAge,
    domain,
    path,
    secure,
    httpOnly,
    sameSite
  }: CookieOptions = {}
) {
  if (sameSite === 'None') secure = true
  let cookie = `${name}=${value};`
  if (domain  ) cookie = cookie.concat(` Domain=${domain};`                ) //prettier-ignore
  if (expires ) cookie = cookie.concat(` Expires=${expires.toUTCString()};`) //prettier-ignore
  if (httpOnly) cookie = cookie.concat(` HttpOnly;`                        ) //prettier-ignore
  if (maxAge  ) cookie = cookie.concat(` Max-Age=${maxAge};`               ) //prettier-ignore
  if (path    ) cookie = cookie.concat(` Path=${path};`                    ) //prettier-ignore
  if (sameSite) cookie = cookie.concat(` SameSite=${sameSite};`            ) //prettier-ignore
  if (secure  ) cookie = cookie.concat(` Secure;`                          ) //prettier-ignore
  return cookie
}
