// src/lib/fleet.js
// ──────────────────────────────────────────────────────────────────────────────
// Single source of truth for the Slique fleet.
//
// Both the public landing page (FleetSection) and the admin command center
// (/manage) import from here, so vehicle names, types, and daily rates never
// drift between what a customer sees and what the admin schedule shows.
//
//   • CHAUFFEUR_VEHICLES — the original chauffeured line (hourly / by-trip).
//   • DAILY_RENTALS      — the self-drive performance line (priced per day).
//
// Edit a car's `rate` here and it updates everywhere at once.
// ──────────────────────────────────────────────────────────────────────────────

// ── Chauffeur fleet (the original business) ──────────────────────────────────
export const CHAUFFEUR_VEHICLES = [
  {
    name: "Cadillac Escalade SUV - Black",
    subtitle: "Executive Class",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695c5a13600f408b85ae7545/3a79fb852_sliqueescalade.png",
    passengers: "Up to 6",
    luggage: "6 Large Bags",
    features: ["Presidential Seats", "Drink Refrigerator", "Ambient Lighting", "Tinted Windows"],
    type: "escalade_suv",
  },
  {
    name: "Mercedes Benz Maybach - Black",
    subtitle: "Executive Class",
    image: "/slique_maybach.png",
    passengers: "Up to 2",
    luggage: "2 Large Bags",
    features: ["Presidential Seats", "Drink Refrigerator", "Ambient Lighting", "Tinted Windows"],
    type: "mercedes_amg",
  },
  {
    name: "Mercedes Benz Sprinter - Black",
    subtitle: "Executive Class",
    image: "/slique_van.png",
    passengers: "Up to 15",
    luggage: "15 Large Bags",
    features: ["VIP Lounge Interior", "Noise Insulation", "Ambient Lighting", "Tinted Windows"],
    type: "mercedes_sprinter",
  },
  {
    name: "Mercedes Benz Limousine - Black",
    subtitle: "Executive Class",
    image: "/slique_limo.png",
    passengers: "Up to 10",
    luggage: "10 Large Bags",
    features: ["VIP Lounge Interior", "Premium Bar", "Ambient Lighting", "Tinted Windows"],
    type: "mercedes_limo",
  },
];

// ── Rental cities ────────────────────────────────────────────────────────────
// Cars without a `city` field are Minneapolis ('msp'). Atlanta cars carry
// city: 'atl' and a distinct `type` so admin schedules never mix markets.
export const RENTAL_CITIES = [
  { id: 'msp', label: 'Minnesota' },
  { id: 'atl', label: 'Atlanta' },
  { id: 'phx', label: 'Arizona' },
];

// ── Daily rentals (the new self-drive performance line) ──────────────────────
// Specs are real-world figures; `rate` is the daily price — edit freely.
export const DAILY_RENTALS = [
  {
    name: "Mercedes-AMG GLS 63",
    tagline: "Performance SUV",
    image: "/slique_gls.png",
    hp: 603, zeroToSixty: "4.1s", topSpeed: "174", drive: "AWD",
    rate: 399,
    type: "amg_gls63",
    body: "suv", brand: "mercedes",
    inquiryOnly: true,
  },
  {
    name: "Corvette C8 Z06",
    tagline: "Track-Bred Supercar",
    image: "/slique_z06.png",
    hp: 670, zeroToSixty: "2.6s", topSpeed: "195", drive: "RWD",
    rate: 699,
    type: "corvette_c8_z06",
    body: "coupe", brand: "corvette",
    inquiryOnly: true,
  },
  {
    name: "Mercedes-AMG C43",
    tagline: "Sport Sedan",
    image: "/slique_amg.png",
    hp: 402, zeroToSixty: "4.6s", topSpeed: "155", drive: "AWD",
    rate: 149,
    type: "amg_c43",
    body: "sedan", brand: "mercedes",
  },
  {
    name: "Cadillac Escalade",
    tagline: "Full-Size Luxury SUV",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695c5a13600f408b85ae7545/3a79fb852_sliqueescalade.png",
    hp: 420, zeroToSixty: "5.8s", topSpeed: "112", drive: "AWD",
    rate: 249,
    type: "cadillac_escalade",
    body: "suv", brand: "cadillac",
  },
  {
    name: "Tesla Model Y",
    tagline: "Electric",
    image: "/slique_tesla.png",
    hp: 456, zeroToSixty: "3.5s", topSpeed: "155", drive: "AWD · EV",
    rate: 149,
    type: "tesla_model_y",
    body: "suv", brand: "tesla",
  },
  {
    name: "Mercedes-AMG CLE 53",
    tagline: "Sport Coupe",
    image: "/slique_cle.png",
    hp: 443, zeroToSixty: "4.2s", topSpeed: "155", drive: "AWD",
    rate: 499,
    type: "amg_cle53",
    body: "coupe", brand: "mercedes",
    inquiryOnly: true,
  },
  {
    name: "Mercedes-Benz G-Wagon",
    tagline: "Luxury SUV",
    image: "/slique_wagon.png",
    hp: 577, zeroToSixty: "4.5s", topSpeed: "149", drive: "AWD",
    rate: 649,
    type: "g_wagon",
    body: "suv", brand: "mercedes",
    inquiryOnly: true,
  },
  {
    name: "Corvette C8",
    tagline: "Mid-Engine Supercar",
    image: "/slique_corvette.png",
    hp: 495, zeroToSixty: "2.9s", topSpeed: "194", drive: "RWD",
    rate: 429,
    type: "corvette_c8",
    body: "coupe", brand: "corvette",
    inquiryOnly: true,
  },

  // ── Atlanta ────────────────────────────────────────────────────────────────
  {
    name: "Mercedes-Maybach GLS 600",
    tagline: "Ultra-Luxury SUV",
    image: "/slique_gls600.png",
    hp: 550, zeroToSixty: "4.8s", topSpeed: "155", drive: "AWD",
    rate: 1499,
    type: "maybach_gls600_atl",
    body: "suv", brand: "mercedes",
    inquiryOnly: true,
    city: "atl",
  },
  {
    name: "Corvette C8 Z06",
    tagline: "Track-Bred Supercar",
    image: "/slique_z06.png",
    hp: 670, zeroToSixty: "2.6s", topSpeed: "195", drive: "RWD",
    rate: 699,
    type: "corvette_c8_z06_atl",
    body: "coupe", brand: "corvette",
    inquiryOnly: true,
    city: "atl",
  },

  // ── Phoenix ────────────────────────────────────────────────────────────────
  {
    name: "Tesla Model Y",
    tagline: "Electric",
    image: "/slique_newtesla.png",
    hp: 456, zeroToSixty: "3.5s", topSpeed: "155", drive: "AWD · EV",
    rate: 149,
    type: "tesla_model_y_phx",
    body: "suv", brand: "tesla",
    inquiryOnly: true,
    city: "phx",
  },
];

// ── Combined views ───────────────────────────────────────────────────────────
// Every vehicle, tagged with its category and a short display name, in the
// order the admin schedule should list them: daily rentals first (the focus of
// the command center), chauffeur fleet after.
export const ALL_VEHICLES = [
  ...DAILY_RENTALS.map(v => ({
    type: v.type,
    name: v.name,
    // Tag non-Minneapolis cars so admin schedules distinguish the markets
    // (the ATL Z06 would otherwise be indistinguishable from the MSP one).
    shortName: v.city ? `${v.name} (${v.city.toUpperCase()})` : v.name,
    image: v.image,
    rate: v.rate,
    category: 'rental',
  })),
  ...CHAUFFEUR_VEHICLES.map(v => ({
    type: v.type,
    name: v.name,
    // Trim the trailing " - Black" / class for a tighter schedule label.
    shortName: v.name.replace(/\s*-\s*Black$/i, ''),
    image: v.image,
    rate: null,
    category: 'chauffeur',
  })),
];

// type → vehicle meta, for O(1) lookups in the admin + booking flows.
export const VEHICLE_BY_TYPE = ALL_VEHICLES.reduce((acc, v) => {
  acc[v.type] = v;
  return acc;
}, {});

// Human label for a vehicle_type string, with a graceful fallback.
export function vehicleLabel(type) {
  return VEHICLE_BY_TYPE[type]?.shortName || VEHICLE_BY_TYPE[type]?.name || type || '—';
}

// Daily rate for a vehicle_type (null for chauffeur vehicles / unknowns).
export function vehicleRate(type) {
  return VEHICLE_BY_TYPE[type]?.rate ?? null;
}
