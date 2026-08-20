const OPENSKY_URL = "https://opensky-network.org/api/states/all?lamin=4&lomin=2&lamax=14&lomax=15";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const response = await fetch(OPENSKY_URL, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.error(`OpenSky API responded with ${response.status}`);
      res.status(502).json({ error: "Failed to fetch flights from OpenSky" });
      return;
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("OpenSky API error:", error);
    res.status(500).json({ error: "Failed to fetch flights from OpenSky" });
  }
}
