export const FARM_NAME = "Welcome Home Farm";

export const FARM_ADDRESS = "3203 NW Apple Harvest, Bentonville, AR";

/** The farm's Google Maps place ID, from Google's Place ID Finder. With it
    the map link opens the farm's business listing for certain; null falls back
    to searching the name and address. */
export const FARM_PLACE_ID: string | null = null;

/** Opens the farm in Google Maps, or the Maps app on a phone. */
export const FARM_MAP_URL =
  "https://www.google.com/maps/search/?api=1" +
  `&query=${encodeURIComponent(`${FARM_NAME}, ${FARM_ADDRESS}`)}` +
  (FARM_PLACE_ID ? `&query_place_id=${encodeURIComponent(FARM_PLACE_ID)}` : "");
