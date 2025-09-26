/*
export async function fetchJSON(url, opts) {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }
*/


// src/lib/fetchJSON.js
export async function fetchJSON(url, opts = {}) {
    try {
        
      const res = await fetch(url, opts);
      if (res.status === 204) return null; // No Content
      if (!res.ok) {
        // zkusíme načíst text těla kvůli diagnostice
        let body = '';
        try { body = await res.text(); } catch {}
        const err = new Error(`HTTP ${res.status} ${res.statusText} @ ${url}${body ? ` — ${body}` : ''}`);
        err.status = res.status;
        err.url = url;
        err.body = body;
        throw err;
      }
      return await res.json();
    } catch (e) {
      console.error('fetchJSON error:', e?.message || e, 'URL:', url, 'opts:', opts);
      throw e;
    }
  }
  