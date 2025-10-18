
//const apiKey = process.env.LIBRARY_API_KEY!;
//const appCode = process.env.LIBRARY_APP_CODE!;

import { writeFileSync } from "fs";
const apiKey = "]&pYtmAwzu{yy^[~F;5fAXd-S<%MyJrU";
const appCode = "DEV-Joshua";
const baseUrl = "https://openweb.nlb.gov.sg/api/v1";
const endpoint = "/Library/GetBranches";


export async function fetchLibraries() {
    console.log("API Key:", apiKey);
    console.log("App Code:", appCode);
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "GET",
      headers: {
        "X-Api-Key": apiKey,
        "X-App-Code": appCode,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      


    const data = await response.json();
    const filteredData = data.branches.slice(3);
    //writeFileSync("libraries.txt", JSON.stringify(data, null, 2), "utf8");
    // ✅ Example 1: Filter by library type
      

    // console.log(data.branches[0].branchName);
    const branches = filteredData.map((branch: any) => ({
      name: branch.branchName,
      address: branch.address,
      coordinates: branch.coordinates,
    }));

    console.log(branches);

    return branches

  } catch (error) {
    console.error("❌ Error fetching libraries:", error);
    }

}

