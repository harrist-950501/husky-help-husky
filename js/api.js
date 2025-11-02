/* api.js (frontend-only minimal)
 * You can ignore this for now. It's here if you later hook up a mock server.
 * No auth, no localStorage.
 */
"use strict";

(function() {
  function statusCheck(res) {
    if (!res.ok) {
      throw new Error("Request failed: " + res.status + " " + res.statusText);
    }
    return res;
  }

  async function getJSON(url) {
    const res = await fetch(url);
    statusCheck(res);
    return res.json();
  }

  window.api = { statusCheck, getJSON };
})();
