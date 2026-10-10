import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const version =
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.APP_VERSION ||
    "local";

  return NextResponse.json(
    { version },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
  );
}
