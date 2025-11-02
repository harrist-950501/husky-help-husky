/* 
 * api.js (frontend-only minimal)
 * Small fetch helpers used by the frontend. Keep this file minimal — it
 * centralizes basic response checking and a convenience JSON GET helper.
 *
 * This file attaches a tiny API surface to `window.api` so other scripts
 * can call `window.api.getJSON(url)` and `window.api.statusCheck(response)`.
 */

"use strict";

(function() {
  /**
   * Check a fetch Response and throw for non-OK HTTP statuses.
   *
   * @param {Response} res - The Response object returned by fetch().
   * @throws {Error} When the response status is not OK (res.ok === false).
   * @returns {Response} The same Response object when status is OK.
   *
   * Example:
   *   fetch('/api/data')
   *     .then(window.api.statusCheck)
   *     .then(res => res.json())
   *     .catch(err => console.error(err));
   */
  function statusCheck(res) {
    if (!res.ok) {
      throw new Error("Request failed: " + res.status + " " + res.statusText);
    }
    return res;
  }

  /**
   * Perform a GET request and parse the response as JSON.
   *
   * This is a minimal helper that runs the response through {@link statusCheck}
   * before calling `res.json()`. It will reject the returned promise when the
   * HTTP status is not OK or when JSON parsing fails.
   *
   * @param {string} url - The URL to fetch.
   * @returns {Promise<any>} A promise that resolves to the parsed JSON body.
   * @throws {Error} If the fetch response is not OK (statusCheck) or JSON parsing fails.
   *
   * Example:
   *   window.api.getJSON('/data.json')
   *     .then(data => console.log(data))
   *     .catch(err => console.error('Failed to load JSON:', err));
   */
  async function getJSON(url) {
    const res = await fetch(url);
    statusCheck(res);
    return res.json();
  }

  window.api = {statusCheck, getJSON};
})();
