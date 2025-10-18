// /app/api/libraries/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch(
    "https://openweb.nlb.gov.sg/api/v1/Library/GetBranches",
    {
      headers: {
        "X-Api-Key": process.env.LIBRARY_API_KEY!,
        "X-App-Code": process.env.LIBRARY_APP_CODE!,
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch libraries" },
      { status: res.status }
    );
  }

  const data = await res.json();

  // ✅ Ensure `data.branches` exists and is an array
  const libraries = Array.isArray(data.branches)
    ? data.branches.slice(3).map((branch: any) => ({
        name: branch.branchName,
        address: branch.address,
        coordinates: branch.coordinates,
      }))
    : [];

  return NextResponse.json(libraries); // ✅ Returns clean array
}
