import { ResourceState, EngineeringSettings } from '../types/simulation';

export interface AdvisorResponse {
  answer: string;
  suggestedAction?: string;
  source: 'rule-based' | 'gemini-ai';
  funFact?: string;
}

interface QAItem {
  keywords: string[];
  question: string;
  answer: string;
  funFact?: string;
}

const SPACE_SCIENCE_KNOWLEDGE_BASE: QAItem[] = [
  {
    keywords: ['oxygen', 'air', 'breathe', 'sabatier', 'electrolysis'],
    question: 'How do astronauts make oxygen on the Moon?',
    answer: 'Moon bases make oxygen using a process called water electrolysis! An electrical current splits water molecules (H₂O) into hydrogen and breathable oxygen. NASA also uses a "Sabatier reactor" which takes carbon dioxide exhaled by astronauts and converts it back into water with hydrogen!',
    funFact: 'Lunar soil (regolith) is actually about 40-45% oxygen bound to iron, silicon, and aluminum minerals. Future lunar refineries could bake regolith at 1,000°C to extract pure oxygen gas!'
  },
  {
    keywords: ['water', 'recycle', 'drink', 'eclss', 'shackleton', 'ice'],
    question: 'Where does drinking water come from on the Moon?',
    answer: 'Water is precious! First, the base uses a closed-loop ECLSS system to purify 95%+ of all water from sweat, breath moisture, and washing. Second, robots mine frozen water ice hidden in deep, permanently shadowed craters at the Moon’s South Pole, like Shackleton Crater!',
    funFact: 'Water ice on the Moon has remained frozen for billions of years because deep polar crater floors stay at a frigid -240°C (-400°F)—colder than Pluto!'
  },
  {
    keywords: ['power', 'solar', 'battery', 'electricity', 'energy', 'night'],
    question: 'How does the base stay powered during the 14-day lunar night?',
    answer: 'The Moon rotates slowly, creating 14 Earth days of blazing sunlight followed by 14 Earth days of freezing darkness. Outposts use tall vertical solar towers placed on high crater rims (peaks of eternal light), combined with regenerative fuel cells and massive lithium-iron phosphate battery banks.',
    funFact: 'A solar tower on a lunar peak can reach above the shadow horizon and catch sunlight almost 86% of the entire year!'
  },
  {
    keywords: ['radiation', 'storm', 'sun', 'solar flare', 'cme', 'shield', 'regolith'],
    question: 'How do astronauts protect themselves from space radiation?',
    answer: 'Because the Moon has no atmosphere or global magnetic field, solar storms and cosmic rays pass straight through. Engineers cover habitat domes with 2.5 to 3 meters of Moon soil (regolith). Underground lava tubes formed by ancient lunar volcanoes also make ready-made bomb shelters!',
    funFact: 'Lunar basalt lava tubes can be hundreds of meters wide—large enough to fit an entire Earth city inside, completely shielded from radiation and meteorites!'
  },
  {
    keywords: ['food', 'plants', 'greenhouse', 'grow', 'eat', 'hydroponic', 'aeroponic'],
    question: 'Can plants grow on the Moon without soil?',
    answer: 'Yes! Lunar greenhouses use hydroponics (roots sitting in mineral water) and aeroponics (roots hanging in air, sprayed with nutrient mist). We use special pink-purple LED lights because plants absorb red and blue light wavelengths most effectively for photosynthesis.',
    funFact: 'NASA has already grown red romaine lettuce, radishes, and chili peppers aboard the International Space Station, and astronauts got to eat space tacos!'
  },
  {
    keywords: ['gravity', 'jump', 'float', 'weight', 'fall', 'apollo'],
    question: 'What does Moon gravity feel like?',
    answer: 'The Moon has 1/6th of Earth’s gravity (1.62 m/s²). If you weigh 30 kg on Earth, you only weigh 5 kg on the Moon! Apollo astronauts had to hop like kangaroos because walking normally made their feet slip on the loose dust.',
    funFact: 'On the Moon, a world-class high jumper who clears 2.45 meters on Earth could leap over a two-story school building (over 14 meters high)!'
  },
  {
    keywords: ['dust', 'regolith', 'abrasive', 'dirt', 'glass'],
    question: 'Why is Moon dust so dangerous to equipment?',
    answer: 'On Earth, wind and water smooth out sand and rocks into rounded pebbles. On the Moon, with no air or weather, Moon dust (regolith) is made of tiny, razor-sharp shattered glass and basalt crystals that never erode. It jams rotating solar panel joints and scratches spacesuit fabrics!',
    funFact: 'Apollo 17 astronaut Gene Cernan famously said: "I think dust is probably one of our greatest inhibitors to a nominal operation on the Moon."'
  },
  {
    keywords: ['delay', 'communication', 'radio', 'earth', 'ping', 'light'],
    question: 'Why is there a delay when talking to Mission Control on Earth?',
    answer: 'Radio signals travel at the speed of light (300,000 km per second). Because the Moon is about 384,400 km away, it takes about 1.3 seconds for your voice to reach Earth, and 1.3 seconds for Mission Control’s reply to come back. That is why lunar commanders must learn to think calmly and solve problems independently!',
    funFact: 'If you were on Mars, the radio delay would be between 4 and 24 minutes each way—making real-time telephone calls impossible!'
  }
];

/**
 * Generates dynamic diagnostic suggestions based on the active state.
 */
export function getDiagnosticTips(
  state: ResourceState,
  settings: EngineeringSettings
): string[] {
  const tips: string[] = [];

  // Power check
  const netPower = state.powerKwGenerated - state.powerKwConsumed;
  if (state.batteryStorageKwh < state.batteryCapacityKwh * 0.25) {
    tips.push('Battery reserve is below 25%! Switch Power Priority to "Life Support" and consider setting greenhouse lights to "Eco Pulse".');
  } else if (netPower < 0 && state.lunarPhase !== 'deep_night') {
    tips.push('Power generation is lower than consumption. Ensure solar tracking is set to "Auto" and activate acoustic dust wipers.');
  }

  // Water check
  if (state.waterRecyclingEfficiencyPercent < 85) {
    tips.push('Water recycling is running at lower efficiency. Set Water Recycling to "High Yield" in the Engineering Lab to protect drinking reserves.');
  }

  // Radiation check
  if (state.radiationStatus === 'critical' || state.radiationStatus === 'elevated') {
    tips.push('Elevated radiation detected! Activate the Electromagnetic Deflector or move crew to the Subterranean Lava Tube.');
  }

  // Temperature / night check
  if (state.surfaceTemperatureCelsius < -100 && settings.thermalRadiatorsMode !== 'night_insulation') {
    tips.push('Freezing lunar night (-130°C)! Switch Thermal Radiators to "Night Insulation Mode" to conserve habitat internal heat.');
  }

  // Crew wellbeing check
  if (state.crewMoralePercent < 70) {
    tips.push('Crew morale is slipping. Switch crew work schedule to "Rest & Recovery" for a few hours to let the astronauts sleep and exercise.');
  }

  if (tips.length === 0) {
    tips.push('All habitat systems are nominal, Commander! Solar collection is balanced and closed-loop recycling is holding steady.');
    tips.push('Keep an eye on the solar horizon—prepare for orbital day/night transitions in advance.');
  }

  return tips;
}

/**
 * Responds to a player question using either local knowledge base or backend proxy.
 */
export async function queryMissionAdvisor(
  question: string,
  state: ResourceState,
  settings: EngineeringSettings
): Promise<AdvisorResponse> {
  // First try backend proxy if available
  try {
    const res = await fetch('/api/advisor/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, state, settings })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.answer) {
        return {
          answer: data.answer,
          suggestedAction: data.suggestedAction,
          source: 'gemini-ai',
          funFact: data.funFact
        };
      }
    }
  } catch {
    // Graceful fallback to rule-based engine
  }

  // Rule-based fallback search
  const lowerQ = question.toLowerCase();

  for (const item of SPACE_SCIENCE_KNOWLEDGE_BASE) {
    if (item.keywords.some(k => lowerQ.includes(k))) {
      return {
        answer: item.answer,
        source: 'rule-based',
        funFact: item.funFact
      };
    }
  }

  // Default encouraging response with active context
  const tips = getDiagnosticTips(state, settings);
  return {
    answer: `Commander Luna here! That's a great question about lunar outpost operations. In our current simulation at Sol ${state.missionSol}, Hour ${state.missionHour}:00, the best operational advice is: ${tips[0]}`,
    suggestedAction: 'Check the Engineering Lab to fine-tune power allocation and closed-loop recycling.',
    source: 'rule-based',
    funFact: 'Every astronaut trains for hundreds of hours in mock simulators to master resource management before ever launching to the Moon!'
  };
}
