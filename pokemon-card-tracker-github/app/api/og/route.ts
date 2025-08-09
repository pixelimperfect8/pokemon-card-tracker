import { NextResponse } from "next/server";

function meta(content: string, prop: string) {
  const re = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i");
  return re.exec(content)?.[1] ?? null;
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });
    const res = await fetch(url, { next: { revalidate: 0 } });
    const html = await res.text();

    const title = meta(html, "og:title") || (/<title>([^<]+)<\/title>/i.exec(html)?.[1] ?? "Unknown eBay Item");
    const image = meta(html, "og:image") || undefined;

    return NextResponse.json({ title, image });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}