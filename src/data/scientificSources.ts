export interface ScientificReference {
  id: string;
  title: string;
  organization: string;
  officialUrl: string;
  accessedDate: string;
  applicationUsage: string;
  classification: 'Real NASA Data' | 'Published Scientific Information' | 'Simplified Educational Model' | 'Simulated Game Parameter';
  summary: string;
}

export const SCIENTIFIC_REFERENCES: ScientificReference[] = [
  {
    id: 'nasa-eclss',
    title: 'Environmental Control and Life Support System (ECLSS) Architecture',
    organization: 'NASA Marshall Space Flight Center',
    officialUrl: 'https://www.nasa.gov/centers-and-facilities/marshall/life-support-systems/',
    accessedDate: 'October 2026',
    applicationUsage: 'Basis for oxygen consumption (~0.84 kg/crew/day) and closed-loop water recovery rates up to 98% (potable water processor + brine filtration).',
    classification: 'Real NASA Data',
    summary: 'NASA ECLSS recycles astronaut exhaled breath and urine into ultra-pure breathable oxygen and drinkable water aboard the International Space Station and future Artemis habitats.'
  },
  {
    id: 'lunar-regolith-shielding',
    title: 'Radiation Shielding from Lunar Regolith (Lunar Habitats)',
    organization: 'NASA Technical Reports Server (NTRS) & ESA Space Exploration',
    officialUrl: 'https://ntrs.nasa.gov/citations/20050215611',
    accessedDate: 'October 2026',
    applicationUsage: 'Modeled radiation reduction: 2.5 to 3.0 meters of compacted lunar regolith absorbs up to 90%+ of Galactic Cosmic Rays (GCR) and Solar Energetic Particles (SEPs).',
    classification: 'Published Scientific Information',
    summary: 'Because the Moon lacks a global magnetosphere and thick atmosphere, astronauts need passive regolith berms or underground lava tubes to stay below cumulative radiation exposure safety thresholds.'
  },
  {
    id: 'lunar-south-pole-illumination',
    title: 'Lunar Reconnaissance Orbiter (LRO) South Pole Lighting Studies',
    organization: 'NASA Goddard Space Flight Center / LOLA Team',
    officialUrl: 'https://www.nasa.gov/missions/lro/',
    accessedDate: 'October 2026',
    applicationUsage: 'Design of the South Pole Shackleton Crater rim simulation, where elevated peaks experience up to 80-86% continuous solar illumination ("peaks of eternal light") compared to 14-day nights at the equator.',
    classification: 'Real NASA Data',
    summary: 'LRO camera and altimeter data showed that crater rims at the lunar south pole offer high solar power availability while nearby crater floors hold permanently shadowed regions (PSRs) rich in water ice.'
  },
  {
    id: 'nasa-space-crop-production',
    title: 'Vegetable Production System (Veggie) & Advanced Plant Habitat (APH)',
    organization: 'NASA Kennedy Space Center',
    officialUrl: 'https://www.nasa.gov/exploration/systems/ground/veggie.html',
    accessedDate: 'October 2026',
    applicationUsage: 'Modeled energy-to-biomass conversion for hydroponic/aeroponic trays and LED lighting spectrum allocations (red/blue photoperiods vs energy load).',
    classification: 'Real NASA Data',
    summary: 'Research demonstrating that astronauts can cultivate fresh leafy greens, radishes, and dwarf tomatoes in microgravity and lunar gravity to supplement shelf-stable rations and boost crew psychological wellbeing.'
  },
  {
    id: 'simplified-power-eclss-calc',
    title: 'Deterministic Junior Astronaut Resource Conservation Model',
    organization: 'LUNOPS Educational Engineering Team',
    officialUrl: 'https://lunops.simulation.internal/methodology',
    accessedDate: 'October 2026',
    applicationUsage: 'Simplified discrete mathematical models converting kilowatt-hours, liters, and kilograms into transparent, understandable feedback for learners aged 7-12.',
    classification: 'Simplified Educational Model',
    summary: 'Complex differential thermodynamics and chemical equilibria are abstracted into discrete hourly rates so children can easily grasp cause-and-effect relationships.'
  },
  {
    id: 'simulated-solar-storm-event',
    title: 'Coronal Mass Ejection & Solar Energetic Particle Event Scenario',
    organization: 'LUNOPS Space Weather Simulation Sandbox',
    officialUrl: 'https://lunops.simulation.internal/space-weather',
    accessedDate: 'October 2026',
    applicationUsage: 'Educational emergency scenario demonstrating solar proton flux, sensor alarms, magnetic deflection, and crew bunker sheltering protocols.',
    classification: 'Simulated Game Parameter',
    summary: 'A simulated dynamic space weather incident based on historic solar events (e.g. August 1972 event) designed to teach risk mitigation and calm scientific decision-making.'
  }
];

export const NASA_DISCLAIMER = {
  text: "LUNOPS is an independent educational simulation created for the NASA Space Apps Challenge 2026. It is not an official NASA product and is not endorsed or operated by NASA.",
  brandingPolicy: "No official NASA logos, seals, or protected insignias are used. All logos, UI elements, and educational graphics are original LUNOPS creations.",
  privacyPolicy: "LUNOPS does not collect any personal data, accounts, or location telemetry from children. All progress is safely stored locally in your browser."
};
