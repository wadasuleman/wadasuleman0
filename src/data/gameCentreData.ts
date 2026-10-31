import { GameDefinition, GameCentreBadge } from '../types/gameCentre';

export const GAME_DEFINITIONS: GameDefinition[] = [
  {
    id: 'moon_rover',
    title: 'Moon Rover Explorer',
    tagline: 'Guide a lunar rover across crater rims, avoid boulders, and gather rare ice core samples!',
    category: 'Exploration',
    icon: 'Compass',
    accentColor: 'cyan',
    estimatedMinutes: '2–3 min',
    scienceFocus: 'Lunar polar terrain navigation, obstacle avoidance & ice volatile prospecting',
    instructions: {
      objective: 'Drive your pressurized lunar rover across Shackleton Ridge to retrieve required scientific ice samples and reach all exploration checkpoints before battery depletion.',
      howToPlay: [
        'Use on-screen direction controls on mobile or Arrow Keys / WASD on keyboard to navigate.',
        'Smooth lunar regolith provides fast cruising with minimal motor battery drain.',
        'Crater slopes and boulder fields slow you down and cause heavy suspension power draw.',
        'Permanently shadowed cold traps contain valuable ice cores, but freeze batteries rapidly.',
        'High sunlit ridges recharge auxiliary solar batteries while driving.'
      ],
      proTip: 'Plan your route along illuminated ridges to recharge your battery while heading towards ice traps!',
      scienceFact: 'Because the Moon has no atmosphere to scatter light, shadows at the lunar South Pole are pitch-black and reach -240°C (-400°F), preserving water ice for billions of years.'
    }
  },
  {
    id: 'power_grid',
    title: 'Power Grid Master',
    tagline: 'Connect solar towers to battery banks and supply clean electricity to habitat modules!',
    category: 'Engineering',
    icon: 'Zap',
    accentColor: 'amber',
    estimatedMinutes: '2–3 min',
    scienceFocus: 'Photovoltaic tracking, battery depth of discharge & electrical load balancing',
    instructions: {
      objective: 'Solve progressively harder electrical puzzle levels by connecting generators, battery banks, and vital life support systems before the power grid blacks out!',
      howToPlay: [
        'Connect solar arrays and fuel cells to the central battery storage bus.',
        'Toggle switches to supply power to modules: Life Support, Greenhouse, Comms, Lab, and Floodlights.',
        'Watch your Net Power meter: Green means charging battery; Red means draining reserves.',
        'In Level 2 (Dust Event), deploy wiper shields to restore solar efficiency.',
        'In Level 3 (Polar Sunset), shed non-essential loads immediately to protect Life Support!'
      ],
      proTip: 'Never disconnect Life Support! When solar power drops, switch off Floodlights and Science Labs first to conserve energy.',
      scienceFact: 'At the lunar South Pole, solar towers placed on elevated crater peaks can capture nearly continuous sunlight throughout the 708-hour lunar day.'
    }
  },
  {
    id: 'moon_base',
    title: 'Build Your Moon Base',
    tagline: 'Place habitat domes, solar panels, and laboratories to construct a thriving lunar settlement!',
    category: 'Engineering',
    icon: 'Layers',
    accentColor: 'indigo',
    estimatedMinutes: '3–4 min',
    scienceFocus: 'Extraterrestrial habitat architecture, modular ECLSS & in-situ resource utilization',
    instructions: {
      objective: 'Arrange habitat domes, greenhouses, solar arrays, ice drills, and research labs on the lunar grid to meet crew, energy, and radiation shielding goals!',
      howToPlay: [
        'Select modules from the blueprint toolbar and click tiles on the grid to construct.',
        'Connect facilities using pressurized transit corridors for astronaut mobility.',
        'Keep net power in the positive zone by adding sufficient Solar Power Towers.',
        'Add Greenhouses for fresh food/oxygen and Ice Drills for water self-sufficiency.',
        'Build Regolith Shield Berms around living quarters to protect against cosmic rays.',
        'When all settlement criteria are satisfied, tap "Certify Base Layout" for your commander score!'
      ],
      proTip: 'Group living quarters near greenhouses and place heavy solar arrays along the southern ridge for maximum sunlight!',
      scienceFact: 'Real lunar bases will be constructed using In-Situ Resource Utilization (ISRU): mixing lunar regolith into concrete to 3D-print thick protective shells over lightweight inflatable habitats.'
    }
  },
  {
    id: 'water_rescue',
    title: 'Water Rescue',
    tagline: 'Assemble the multi-stage ECLSS water recycling pipeline in the correct scientific sequence!',
    category: 'Science and Survival',
    icon: 'Droplets',
    accentColor: 'blue',
    estimatedMinutes: '2–3 min',
    scienceFocus: 'Closed-loop environmental control, reverse osmosis & water mineral balance',
    instructions: {
      objective: 'Arrange the 4 filtration stages in the correct order, balance pump pressure, and achieve 95%+ recovery to provide pure drinking water for the crew!',
      howToPlay: [
        'Examine the 4 filtration stages: Regolith Solids Trap, Reverse Osmosis Bed, Catalytic UV Oxidizer, and Potable Mineralizer.',
        'Click / tap to swap and arrange the stages in the proper scientific sequence.',
        'Press "Test Water Flow" to see water travel through your pipeline.',
        'If ordered incorrectly, read the scientific diagnostic to learn why that sequence failed!',
        'Once properly sequenced, tune the pump pressure near 15 PSI to maximize pure water recovery.'
      ],
      proTip: 'Always filter heavy dust and regolith solids first! If coarse particles hit the delicate reverse osmosis membrane or UV reactor, they cause instant damage.',
      scienceFact: 'Aboard the International Space Station, the ECLSS Water Recovery System recycles up to 98% of all moisture (including breath humidity and sweat) into water that is cleaner than municipal tap water on Earth.'
    }
  },
  {
    id: 'space_farmer',
    title: 'Space Farmer',
    tagline: 'Plant lunar crops, dial in custom LED light recipes, and harvest crisp space vegetables!',
    category: 'Science and Survival',
    icon: 'Sprout',
    accentColor: 'emerald',
    estimatedMinutes: '2–3 min',
    scienceFocus: 'Controlled Environment Agriculture (CEA), photobiology & aeroponics',
    instructions: {
      objective: 'Cultivate 3 diverse crop bays (Red Romaine Lettuce, Dwarf Super-Wheat, Moon Radishes) by dialing in optimal LED red/blue light ratios and nutrient misting to harvest maximum yields.',
      howToPlay: [
        'Select a Crop Bay to inspect current growth, moisture, and light requirements.',
        'Adjust the LED Spectrum Slider: Red light (660nm) drives photosynthesis; Blue light (450nm) builds thick leaves and sturdy stems.',
        'Set Photoperiod hours (light cycle duration per 24 hours).',
        'Pulse the "Aeroponic Mist" button when root moisture drops below 40%.',
        'When crop maturity reaches 100%, tap "Harvest Crop" to store fresh food for the crew!'
      ],
      proTip: 'Leafy greens like lettuce thrive with equal red and blue light (50/50), whereas wheat and fruiting crops demand high red ratios (80%+) for maximum biomass.',
      scienceFact: 'NASA’s Veggie and Advanced Plant Habitat (APH) experiments proved that fresh vegetables grown in microgravity boost astronaut immune health and provide essential vitamins that degrade in packaged rations.'
    }
  },
  {
    id: 'solar_storm',
    title: 'Solar Storm Survival',
    tagline: 'An energetic solar flare is inbound! Deploy magnetic coils and shelter the crew in time!',
    category: 'Science and Survival',
    icon: 'Shield',
    accentColor: 'rose',
    estimatedMinutes: '2 min',
    scienceFocus: 'Solar energetic particles (SEPs), magnetic deflection & subterranean regolith shielding',
    instructions: {
      objective: 'Track the Coronal Mass Ejection countdown, charge active magnetic coils, match shield polarity, lower regolith blast shutters, and evacuate all 4 astronauts into the lava tube bunker!',
      howToPlay: [
        'Monitor the incoming CME shockwave clock and radiation sensor.',
        'Tap "Charge Deflector Coils" to build an active artificial magnetic bubble.',
        'Check the solar wind sensor and align coil polarity (+ or -) to repel incoming charged protons.',
        'Press "Close Regolith Shutters" to protect the habitat dome viewports from secondary radiation.',
        'Evacuate each astronaut (or tap "Shelter All Crew") into the underground volcanic lava tube shelter.',
        'Hold the line during the shockwave impact to achieve 0.0 mSv radiation absorbed!'
      ],
      proTip: 'Evacuate your crew first, then charge the magnetic coils so energy is used efficiently right before the shockwave arrives!',
      scienceFact: 'Unlike Earth, the Moon has no global magnetic field or atmosphere to block cosmic rays. Underground volcanic lava tubes provide natural shelter equivalent to meters of solid lead.'
    }
  }
];

export const INITIAL_GAME_BADGES: GameCentreBadge[] = [
  {
    id: 'badge_rover_explorer',
    title: 'Lunar Surface Navigator',
    description: 'Safely pilot the lunar rover across treacherous craters and retrieve all ice core samples.',
    icon: 'Compass',
    gameId: 'moon_rover',
    unlocked: false
  },
  {
    id: 'badge_power_grid_master',
    title: 'Power Grid Master',
    description: 'Balance the lunar power grid through solar drops and keep vital life support online.',
    icon: 'Zap',
    gameId: 'power_grid',
    unlocked: false
  },
  {
    id: 'badge_water_rescue_hero',
    title: 'ECLSS Water Hero',
    description: 'Assemble the 4-stage water filtration loop in correct order and hit 95%+ recovery.',
    icon: 'Droplets',
    gameId: 'water_rescue',
    unlocked: false
  },
  {
    id: 'badge_space_farmer_green',
    title: 'Master Astrobiologist',
    description: 'Successfully harvest all 3 space crop bays by calibrating optimal LED spectrum recipes.',
    icon: 'Sprout',
    gameId: 'space_farmer',
    unlocked: false
  },
  {
    id: 'badge_solar_storm_shield',
    title: 'Solar Storm Guardian',
    description: 'Safely evacuate the crew and deflect a Coronal Mass Ejection with 0.0 mSv radiation dose.',
    icon: 'Shield',
    gameId: 'solar_storm',
    unlocked: false
  },
  {
    id: 'badge_moon_base_architect',
    title: 'Lunar Architect',
    description: 'Construct and certify a self-sufficient moon base supporting 4+ crew with clean power.',
    icon: 'Layers',
    gameId: 'moon_base',
    unlocked: false
  },
  {
    id: 'badge_galaxy_cadet',
    title: 'Galaxy Arcade Pioneer',
    description: 'Earn at least 6 stars across the LUNOPS Galaxy Arcade games.',
    icon: 'Sparkles',
    unlocked: false
  },
  {
    id: 'badge_grand_galaxy_commander',
    title: 'Grand Galaxy Commander',
    description: 'Achieve perfection by collecting all 18 stars across all 6 Galaxy Arcade games!',
    icon: 'Award',
    unlocked: false
  }
];
