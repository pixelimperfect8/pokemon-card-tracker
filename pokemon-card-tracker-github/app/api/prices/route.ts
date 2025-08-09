import { NextResponse } from "next/server";

async function lastSoldMedian(query: string): Promise<number|null> {
  const key = process.env.COUNTDOWN_API_KEY;
  if (!key) return null;
  const params = new URLSearchParams({
    api_key: key,
    type: "search",
    ebay_domain: "ebay.com",
    search_term: query,
    sold_items: "true",
    completed_items: "true",
    sort_by: "ending_soonest",
    num: "60"
  });

  const res = await fetch(`https://api.countdownapi.com/request?${params.toString()}`);
  if (!res.ok) return null;
  const data = await res.json();
  const items = data?.search_results || [];
  const nums = items
    .map((it: any) => it?.price?.value ?? it?.buy_now_price?.value ?? it?.raw_price)
    .filter((v: any) => typeof v === "number")
    .sort((a: number, b: number) => a - b);
  if (!nums.length) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

    const [ungraded, g8, g9, g10] = await Promise.all([
      lastSoldMedian(`${name} -psa -bgs -cgc -sgc`),
      lastSoldMedian(`${name} PSA 8`),
      lastSoldMedian(`${name} PSA 9`),
      lastSoldMedian(`${name} PSA 10`)
    ]);

    return NextResponse.json({ ungradedMint: ungraded, psa8: g8, psa9: g9, psa10: g10 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}