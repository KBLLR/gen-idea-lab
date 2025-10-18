# 🪛 Integration with the LP

**Owner:** Robert Scheller  
**Tags:** Department  

---

## Authorization

Authorization of API calls against the LP backends is done via a **JWT (JSON Web Token)** sent with each call using the standard HTTP `Authorization` header.

Example:
```bash
curl -H "Authorization: Bearer <your_session_token>"      -H "Content-Type: application/json"      https://api.app.code.berlin/graphql
```

Tokens expire within **10 minutes**, but can be **refreshed** before they expire for security reasons.

---

## Acquiring the Session Token

To acquire a session token programmatically (instead of copying it manually from the browser’s network tab), authenticate yourself against the LP backend using the **Google Identity Service**.

### Steps

1. **Use any Google library** to acquire a Google **ID token**.
2. **Google Client ID:**
   ```
   358660676559-02rrefr671bdi1chqtd3l0c44mc8jt9p.apps.googleusercontent.com
   ```
3. **Send a sign-in request** to the LP backend with your Google ID token as the variable `code`.

Example:
```bash
curl -X POST -v   -H "Content-Type: application/json"   -d '{"variables":{"code":"<your_ID_token>"},"operationName":"googleSignin"}'   https://api.app.code.berlin/graphql
```

**Response:**
```json
{
  "data": {
    "googleSignin": {
      "token": "<your_new_session_token>"
    }
  }
}
```

**References:**
- [JSON Web Token — Wikipedia](https://en.wikipedia.org/wiki/JSON_Web_Token)
- [Google Identity OAuth 2.0 — Developers Guide](https://developers.google.com/identity/protocols/oauth2#libraries)

---

## Refreshing the Session Token

A separate **refresh token** can be used to request a new session token without repeating the Google sign-in process.

### Steps

1. The LP server uses the response header `Set-Cookie` to send the refresh token as a **secure, HTTP-only cookie**.
   - Cookie name: `cid`
   - Header is set in both:
     - The `googleSignin` GraphQL operation (above)
     - The `/cid_refresh` endpoint

2. Add logic in your app/script to check the token’s `exp` (expiry) field as defined in the JWT standard.

3. Before the session token expires, send a request to refresh it using the `cid` cookie.

Example:
```bash
curl -X POST -v   --cookie "cid=<your_refresh_token>"   https://api.app.code.berlin/cid_refresh
```

**Response:**
```json
{
  "ok": true,
  "token": "<your_new_session_token>"
}
```

**References:**
- [MDN Web Docs: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)

---

## GraphQL API Access

Most LP backend endpoints are **GraphQL operations**.  
You can use the GraphQL **introspection query** `__schema` to obtain API documentation dynamically.

Example:
```bash
curl   -H "Content-Type: application/json"   -d '{"query":"{ __schema { queryType { fields { name description } } } }"}'   https://api.app.code.berlin/graphql
```

**References:**
- [GraphQL Introspection — Official Docs](https://graphql.org/learn/introspection/)
