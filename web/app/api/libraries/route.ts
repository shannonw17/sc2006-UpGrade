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


  const rawLibraries = Array.isArray(data.branches)
    ? data.branches.slice(3).map((branch: any) => ({
        name: branch.branchName,
        address: branch.address,
        coordinates: branch.coordinates,
      }))
    : [];


  const validLibraries = rawLibraries.filter((lib) => {
    const hasCoords =
      lib.coordinates &&
      lib.coordinates.geoLatitude &&
      lib.coordinates.geoLongitude &&
      !isNaN(parseFloat(lib.coordinates.geoLatitude)) &&
      !isNaN(parseFloat(lib.coordinates.geoLongitude));

    const hasAddress =
      lib.address &&
      (lib.address.block ||
        lib.address.streetName ||
        lib.address.buildingName ||
        lib.address.postalCode);

    return hasCoords && hasAddress;
  });


  const seen = new Set<string>();
  const uniqueLibraries = validLibraries.filter((lib) => {
    const lat = lib.coordinates.geoLatitude;
    const lng = lib.coordinates.geoLongitude;
    const key = `${lat},${lng}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(
    `✅ Returning ${uniqueLibraries.length} libraries (filtered out ${
      rawLibraries.length - uniqueLibraries.length
    } invalid/duplicate entries)`
  );

  return NextResponse.json(uniqueLibraries);
}