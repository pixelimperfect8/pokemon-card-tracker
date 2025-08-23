"use client";

import { useEffect, useMemo, useState } from "react";

type Prices = { ungradedMint?: number|null; psa8?: number|null; psa9?: number|null; psa10?: number|null; };
type Card = { id: string; name: string; imageUrl?: string; sourceUrl?: string; lastChecked?: string; prices: Prices };

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const a = [...nums].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

export default function Page() {
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<{ title?: string; image?: string } | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("cards.v1.web"); 
    setCards(raw ? JSON.parse(raw) : []);
  }, []);

  const saveAll = (arr: Card[]) => localStorage.setItem("cards.v1.web", JSON.stringify(arr));

  async function previewUrl() {
    if (!url) return;
    setLoading(true);
    setPreview(null);
    try {
      const res = await fetch("/api/og", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPreview({ title: data.title, image: data.image });
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function saveCard() {
    if (!preview?.title) return alert("Click Preview first.");
    setFetching(true);
    try {
      const pr = await fetch("/api/prices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: preview.title }) });
      const prices: Prices = pr.ok ? await pr.json() : { ungradedMint: null, psa8: null, psa9: null, psa10: null };
      const id = crypto.randomUUID();
      const record: Card = { id, name: preview.title!, imageUrl: preview.image, sourceUrl: url, prices, lastChecked: new Date().toISOString() };
      const next = [record, ...cards];
      setCards(next); 
      saveAll(next);
      setUrl(""); setPreview(null);
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setFetching(false);
    }
  }

  async function refreshCard(id: string) {
    const current = cards.find(c => c.id === id); if (!current) return;
    setRefreshingId(id);
    setError(null);
    try {
      let response: Response | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          response = await fetch("/api/prices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: current.name })
          });
          if (response.ok) break;
        } catch (_) {
          // retry on network failure
        }
      }
      if (!response || !response.ok) {
        const msg = response ? await response.text() : "Network error. Please try again.";
        setError(msg || "Failed to refresh card.");
        return;
      }
      const prices: Prices = await response.json();
      const updated: Card = { ...current, prices, lastChecked: new Date().toISOString() };
      const next = cards.map(c => c.id === id ? updated : c);
      setCards(next); saveAll(next);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setRefreshingId(null);
    }
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
      <h1>Pokémon Card Tracker (Web)</h1>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr auto auto" }}>
        <input placeholder="Paste eBay URL" value={url} onChange={e => setUrl(e.target.value)} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }} />
        <button onClick={previewUrl} disabled={loading} style={{ padding: "12px 16px", borderRadius: 8 }}>
          {loading ? "Loading…" : "Preview"}
        </button>
        <button onClick={saveCard} disabled={fetching || !preview?.title} style={{ padding: "12px 16px", borderRadius: 8 }}>
          {fetching ? "Saving…" : "+ Save"}
        </button>
      </div>

      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}

      {preview && (
        <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
          {preview.image ? <img src={preview.image} alt="card" style={{ width: 160, height: 160, objectFit: "contain", background: "#f6f6f6", borderRadius: 8 }} /> : null}
          <div style={{ fontWeight: 600 }}>{preview.title}</div>
        </div>
      )}

      <hr style={{ margin: "16px 0" }} />

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
        {cards.map(c => (
          <li key={c.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr auto", gap: 12, alignItems: "center", border: "1px solid #eee", padding: 10, borderRadius: 10 }}>
            {c.imageUrl ? <img src={c.imageUrl} alt="card" style={{ width: 80, height: 80, objectFit: "contain", background: "#f6f6f6", borderRadius: 8 }} /> : <div style={{ width: 80, height: 80, background: "#f6f6f6", borderRadius: 8 }} />}
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{c.name}</div>
              <div style={{ color: "#666", fontSize: 14 }}>Last checked: {new Date(c.lastChecked || Date.now()).toLocaleString()}</div>
              <div style={{ marginTop: 6, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <span>Ungraded: ${c.prices.ungradedMint ?? "—"}</span>
                <span>PSA 8: ${c.prices.psa8 ?? "—"}</span>
                <span>PSA 9: ${c.prices.psa9 ?? "—"}</span>
                <span>PSA 10: ${c.prices.psa10 ?? "—"}</span>
              </div>
            </div>
            <button onClick={() => refreshCard(c.id)} disabled={refreshingId === c.id} style={{ padding: "8px 12px", borderRadius: 8 }}>
              {refreshingId === c.id ? "Refreshing…" : "Refresh"}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}