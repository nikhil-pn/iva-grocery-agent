// Known cities (and their hunt coordinates) plus a friendly name for any location.
export const CITIES = {
  mumbai: [19.0662, 72.8697], bandra: [19.0596, 72.8295], andheri: [19.1136, 72.8697],
  pune: [18.5204, 73.8567], bengaluru: [12.9716, 77.5946], bangalore: [12.9716, 77.5946],
  delhi: [28.6139, 77.209], gurugram: [28.4595, 77.0266], hyderabad: [17.385, 78.4867],
  chennai: [13.0827, 80.2707], kochi: [10.0261, 76.3125], kolkata: [22.5726, 88.3639],
};

export function cityOf(u) {
  if (u.cityName) return u.cityName;
  if (u.lat == null) return 'Mumbai';
  let best = null, bestD = Infinity;
  for (const [name, [la, ln]] of Object.entries(CITIES)) {
    const d = Math.hypot(la - u.lat, (ln - u.lng) * Math.cos((u.lat * Math.PI) / 180));
    if (d < bestD) { bestD = d; best = name; }
  }
  return bestD < 0.25 ? best[0].toUpperCase() + best.slice(1) : 'your shared location';
}
