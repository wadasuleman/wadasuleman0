export interface AcademyLesson {
  id: string;
  number: string;
  title: string;
  topic: string;
  icon: string;
  summary: string;
  explanation: string[];
  scientificFact: string;
  interactiveActivity: {
    type: 'gravity_drop' | 'radiation_shield' | 'water_filter' | 'solar_angle' | 'led_farming' | 'comm_delay';
    title: string;
    instructions: string;
  };
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export const ACADEMY_LESSONS: AcademyLesson[] = [
  {
    id: 'lunar-gravity',
    number: '01',
    title: 'Gravity on the Moon',
    topic: 'Physics & Motion',
    icon: 'Feather',
    summary: 'Discover why astronauts can leap high in the air and how 1/6th gravity affects base design!',
    explanation: [
      'Earth is massive, so its gravity pulls us down with an acceleration of 9.8 meters per second squared (9.8 m/s²).',
      'The Moon is much smaller—only about 1/4 the width of Earth! Its gravitational pull is only 1.62 m/s², which is roughly one-sixth (1/6) of Earth.',
      'If you weigh 36 kg (about 80 lbs) on Earth, a scale on the Moon would show you weigh only 6 kg! You can jump almost 6 times higher, but things fall much slower.'
    ],
    scientificFact: 'Apollo astronauts found that running normally was tricky in 1/6th gravity, so they invented a "bunny hop" and "lunar lope" to travel efficiently across the powdery surface!',
    interactiveActivity: {
      type: 'gravity_drop',
      title: 'Galileo Lunar Drop Experiment',
      instructions: 'Drop a hammer and a feather together. In a vacuum with no air resistance, both hit the ground at the exact same instant at 1.62 m/s²!'
    },
    quiz: {
      question: 'How strong is the Moon’s gravity compared to Earth’s gravity?',
      options: ['Double Earth gravity', 'About 1/6th of Earth gravity', 'Zero gravity (floating forever)', 'Exactly the same'],
      correctIndex: 1,
      explanation: 'The Moon has 1/6th of Earth gravity (1.62 m/s²), which is why lunar landers and astronauts feel 6 times lighter!'
    }
  },
  {
    id: 'space-radiation',
    number: '02',
    title: 'Space Radiation & Regolith',
    topic: 'Space Medicine & Shielding',
    icon: 'Shield',
    summary: 'Learn how Moon dust (regolith) and underground lava tubes protect astronauts from cosmic rays.',
    explanation: [
      'Earth has a thick magnetic field and atmosphere that acts like a gigantic invisible blanket shielding us from deadly space radiation.',
      'The Moon has NO global magnetic field and NO thick air! Cosmic rays from distant exploded stars and solar storms shoot straight to the surface.',
      'Lunar engineers solve this using Moon dirt called "regolith". Piling 2.5 to 3 meters of regolith on top of inflatable habitat domes blocks more than 90% of harmful cosmic rays!'
    ],
    scientificFact: 'Moon dust is very abrasive because without wind or rain to erode it, the particles stay sharp like broken glass fragments. Habitat airlocks need vacuum brushing systems.',
    interactiveActivity: {
      type: 'radiation_shield',
      title: 'Regolith Shield Thickness Tester',
      instructions: 'Drag the slider to pile regolith over the habitat dome and watch the incoming radiation dose drop into the safe zone.'
    },
    quiz: {
      question: 'Why do lunar bases pile Moon dirt (regolith) over their habitat domes?',
      options: ['To paint the base grey', 'To shield astronauts from harsh cosmic radiation and micrometeorites', 'To make the base heavier so it does not blow away', 'To keep the base warm like a blanket only'],
      correctIndex: 1,
      explanation: 'Piling 2 to 3 meters of dense regolith absorbs energetic cosmic rays and solar particles, keeping astronauts healthy for months-long missions.'
    }
  },
  {
    id: 'closed-loop-water',
    number: '03',
    title: 'Water Recycling: Every Drop Counts',
    topic: 'Closed-Loop Life Support',
    icon: 'Droplets',
    summary: 'How NASA life support systems clean and recycle 98% of all water inside the outpost.',
    explanation: [
      'Lifting 1 liter of fresh water from Earth to the Moon costs thousands of dollars in rocket fuel! Outposts must recycle almost every single drop.',
      'In a closed-loop system called ECLSS, moisture from astronaut sweat, breathing, washing water, and even urine is captured by dehumidifiers and condensation pipes.',
      'Multi-stage filtration, catalytic oxidizers, and distillation clean the water until it is cleaner and purer than tap water on Earth!'
    ],
    scientificFact: 'Astronauts on the International Space Station often say: "Today’s coffee is tomorrow’s coffee!" because the ECLSS system recycles 98% of all water onboard.',
    interactiveActivity: {
      type: 'water_filter',
      title: 'ECLSS Multi-Stage Filter Visualizer',
      instructions: 'Adjust the filtration power to balance energy use with water recovery percentage.'
    },
    quiz: {
      question: 'What percentage of water can modern NASA life support systems recycle?',
      options: ['Only 10%', 'Around 50%', 'Up to 98%', '100% with zero energy needed'],
      correctIndex: 2,
      explanation: 'NASA’s latest ECLSS processors achieve up to 98% water recovery, drastically cutting the amount of water rockets must bring from Earth.'
    }
  },
  {
    id: 'lunar-day-night-power',
    number: '04',
    title: 'Sunlight & The 14-Day Night',
    topic: 'Energy & Power Grids',
    icon: 'Sun',
    summary: 'Surviving temperatures from +120°C in sunlight to -130°C in the freezing 2-week night.',
    explanation: [
      'The Moon rotates very slowly. One lunar day lasts about 29.5 Earth days! That means roughly 14 Earth days of blazing sunlight followed by 14 Earth days of freezing darkness at the equator.',
      'During the 14-day night, temperatures plummet to -130°C, and solar panels generate zero power! Habitats need massive regenerative fuel cells or batteries.',
      'At the Moon’s South Pole, mountains on crater rims like Shackleton Crater sit in near-continuous sunlight ("peaks of eternal light"), making them prime real estate for solar arrays!'
    ],
    scientificFact: 'Because the Moon’s axial tilt is only 1.5 degrees, deep crater floors near the poles never see sunlight. These permanently shadowed regions stay as cold as -240°C and preserve ancient water ice!',
    interactiveActivity: {
      type: 'solar_angle',
      title: 'Solar Angle & Battery Reserve Calculator',
      instructions: 'Rotate the lunar base relative to the Sun to see solar panel output and battery charge cycles.'
    },
    quiz: {
      question: 'Why are scientists so eager to build bases near the Moon’s South Pole?',
      options: ['It is warmer than the equator', 'Crater rims get near-constant sunlight and crater floors have water ice', 'There is oxygen in the atmosphere there', 'The Moon is closer to Earth at the poles'],
      correctIndex: 1,
      explanation: 'The South Pole features elevated crater rims with up to 86% sunlight for solar power, right next to permanently shadowed craters holding frozen water ice!'
    }
  },
  {
    id: 'space-farming',
    number: '05',
    title: 'Farming on the Moon',
    topic: 'Bioregenerative Systems',
    icon: 'Sprout',
    summary: 'Growing fresh veggies with aeroponics, red/blue LED lights, and zero soil.',
    explanation: [
      'Astronauts cannot live on packaged freeze-dried rations forever. Fresh vegetables provide vital vitamins, antioxidants, and a psychological boost.',
      'Space greenhouses do not use traditional garden soil. Instead, they use "hydroponics" (roots submerged in mineral water) or "aeroponics" (roots suspended in air misted with nutrients).',
      'Plants also act as natural oxygen factories! They absorb carbon dioxide exhaled by astronauts and produce fresh oxygen through photosynthesis.'
    ],
    scientificFact: 'Plants in space are grown under special pink-purple LED lights because chlorophyll absorbs blue and red wavelengths of light most efficiently for photosynthesis!',
    interactiveActivity: {
      type: 'led_farming',
      title: 'Hydroponic LED Spectrum Mixer Lab',
      instructions: 'Adjust red and blue light wavelength proportions to observe plant biomass growth rates, oxygen output, and electrical power demands.'
    },
    quiz: {
      question: 'Why are hydroponics and aeroponics better than normal soil for a Moon greenhouse?',
      options: ['Soil is too heavy to transport from Earth and Moon regolith lacks organic nutrients', 'Plants hate dirt in space', 'Water does not exist in soil', 'Moon gravity makes soil float away'],
      correctIndex: 0,
      explanation: 'Transporting soil is heavy and expensive, and raw lunar regolith contains sharp minerals and perchlorates that need chemical processing before plants can use it.'
    }
  },
  {
    id: 'comm-delay',
    number: '06',
    title: 'The 1.3-Second Communication Delay',
    topic: 'Space Telecommunications',
    icon: 'Radio',
    summary: 'Why radio messages to the Moon take time, and how crews practice autonomous problem-solving.',
    explanation: [
      'Radio waves travel at the speed of light: about 300,000 kilometers per second (186,000 miles per second).',
      'The Moon is approximately 384,400 km away from Earth. That means a radio signal takes about 1.28 to 1.3 seconds to travel from Earth to the Moon!',
      'When an astronaut asks Mission Control a question, it takes 1.3 seconds to reach Earth, time for flight controllers to think, and another 1.3 seconds for the reply to return. In rapid emergencies, crews must make smart decisions independently!'
    ],
    scientificFact: 'On Mars, the communication delay is much longer—between 4 minutes and 24 minutes one-way depending on orbits! Real-time voice calls to Mars are physically impossible.',
    interactiveActivity: {
      type: 'comm_delay',
      title: 'Moon-to-Earth Ping Latency Test',
      instructions: 'Click the transmitter button to send a message to Earth Mission Control. Watch the light packet travel across space and time the 2.6-second round trip!'
    },
    quiz: {
      question: 'Approximately how long does a radio signal take to travel one way between the Moon and Earth?',
      options: ['0.01 seconds (instant)', 'About 1.3 seconds', '10 minutes', '1 hour'],
      correctIndex: 1,
      explanation: 'At light speed (300,000 km/s), traversing the 384,400 km lunar distance takes approximately 1.3 seconds one way (2.6s round trip).'
    }
  }
];
