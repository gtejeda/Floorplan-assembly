/**
 * Dominican Republic Provinces and Landmark Data
 * Total: 31 provinces + 1 national district
 */

import type { DominicanProvince, ProvinceLandmark } from '@/models/types';

/**
 * All 31 provinces of Dominican Republic plus Distrito Nacional
 */
export const DOMINICAN_PROVINCES: readonly DominicanProvince[] = [
  'Azua',
  'Baoruco',
  'Barahona',
  'Dajabón',
  'Duarte',
  'El Seibo',
  'Elías Piña',
  'Espaillat',
  'Hato Mayor',
  'Hermanas Mirabal',
  'Independencia',
  'La Altagracia',
  'La Romana',
  'La Vega',
  'María Trinidad Sánchez',
  'Monseñor Nouel',
  'Monte Cristi',
  'Monte Plata',
  'Pedernales',
  'Peravia',
  'Puerto Plata',
  'Samaná',
  'San Cristóbal',
  'San José de Ocoa',
  'San Juan',
  'San Pedro de Macorís',
  'Sánchez Ramírez',
  'Santiago',
  'Santiago Rodríguez',
  'Santo Domingo',
  'Valverde',
  'Distrito Nacional',
] as const;

/**
 * Province landmarks, airports, beaches, and attractions
 * Data sourced from Dominican Republic tourism statistics
 */
export const PROVINCE_LANDMARKS: ProvinceLandmark[] = [
  {
    province: 'La Altagracia',
    capital: 'Higüey',
    airports: [
      { name: 'Punta Cana International Airport', code: 'PUJ' },
    ],
    beaches: ['Bávaro', 'Punta Cana', 'Macao', 'Cap Cana', 'Uvero Alto', 'Arena Gorda'],
    attractions: ['Basílica de Higüey', 'Saona Island', 'Hoyo Azul', 'Indigenous Eyes Ecological Park'],
    description: 'Premier tourist destination with world-class beaches and resorts. Home to Punta Cana, the most visited destination in the Caribbean.',
  },
  {
    province: 'Puerto Plata',
    capital: 'Puerto Plata',
    airports: [
      { name: 'Gregorio Luperón International Airport', code: 'POP' },
    ],
    beaches: ['Playa Dorada', 'Sosúa', 'Cabarete', 'Cofresí', 'Playa Grande'],
    attractions: ['Teleférico Cable Car', '27 Waterfalls of Damajagua', 'Fortaleza San Felipe', 'Ocean World Adventure Park'],
    description: 'North coast paradise known for adventure tourism, water sports, and colonial architecture.',
  },
  {
    province: 'Samaná',
    capital: 'Santa Bárbara de Samaná',
    airports: [
      { name: 'El Catey International Airport', code: 'AZS' },
    ],
    beaches: ['Las Terrenas', 'Playa Rincón', 'Playa Fronton', 'Playa Cosón', 'Playa Madama'],
    attractions: ['Los Haitises National Park', 'Whale Watching (Jan-Mar)', 'El Limón Waterfall', 'Cayo Levantado'],
    description: 'Eco-tourism hub with pristine beaches, lush landscapes, and seasonal humpback whale watching.',
  },
  {
    province: 'La Romana',
    capital: 'La Romana',
    airports: [
      { name: 'La Romana International Airport', code: 'LRM' },
    ],
    beaches: ['Bayahibe', 'Saona Island', 'Catalina Island', 'Dominicus'],
    attractions: ['Casa de Campo Resort', 'Altos de Chavón', 'Teeth of the Dog Golf Course', 'Cueva de las Maravillas'],
    description: 'Luxury destination featuring world-class golf, diving, and the artistic village of Altos de Chavón.',
  },
  {
    province: 'Santo Domingo',
    capital: 'Santo Domingo de Guzmán',
    airports: [
      { name: 'Las Américas International Airport', code: 'SDQ' },
    ],
    beaches: ['Boca Chica', 'Juan Dolio', 'Guayacanes'],
    attractions: ['Colonial Zone (UNESCO)', 'Alcázar de Colón', 'Los Tres Ojos', 'Malecón'],
    description: 'Capital province with rich colonial history, vibrant culture, and modern amenities.',
  },
  {
    province: 'Distrito Nacional',
    capital: 'Santo Domingo',
    airports: [
      { name: 'Las Américas International Airport', code: 'SDQ' },
    ],
    beaches: ['Malecón'],
    attractions: ['Colonial Zone', 'National Palace', 'Columbus Lighthouse', 'National Botanical Garden'],
    description: 'The national district and capital city, first European settlement in the Americas (1496).',
  },
  {
    province: 'Santiago',
    capital: 'Santiago de los Caballeros',
    airports: [
      { name: 'Cibao International Airport', code: 'STI' },
    ],
    beaches: [],
    attractions: ['Monumento a los Héroes', 'Centro León', 'Fortaleza San Luis', 'Tobacco plantations'],
    description: 'Second largest city, known as the "Heartland of the Dominican Republic" and center of agriculture.',
  },
  {
    province: 'Barahona',
    capital: 'Santa Cruz de Barahona',
    airports: [],
    beaches: ['Bahía de las Águilas', 'San Rafael', 'Los Patos', 'Bahoruco'],
    attractions: ['Jaragua National Park', 'Lake Enriquillo', 'Larimar mines', 'Polo Magnético'],
    description: 'Unspoiled natural beauty with the most pristine beach in the Caribbean (Bahía de las Águilas).',
  },
  {
    province: 'Azua',
    capital: 'Azua de Compostela',
    airports: [],
    beaches: ['Monte Río', 'Caracoles'],
    attractions: ['Padre Nuestro Beach', 'Prehistoric caves', 'Salt mines'],
    description: 'Agricultural province with historical significance and coastal access.',
  },
  {
    province: 'Baoruco',
    capital: 'Neiba',
    airports: [],
    beaches: [],
    attractions: ['Sierra de Bahoruco National Park', 'Lake Enriquillo', 'Cachón de la Rubia'],
    description: 'Mountainous province with unique biodiversity and natural reserves.',
  },
  {
    province: 'Dajabón',
    capital: 'Dajabón',
    airports: [],
    beaches: [],
    attractions: ['Binational Market (Haiti border)', 'Massacre River', 'Historical battlegrounds'],
    description: 'Northwestern border province known for cross-border trade and historical sites.',
  },
  {
    province: 'Duarte',
    capital: 'San Francisco de Macorís',
    airports: [],
    beaches: [],
    attractions: ['Cacao plantations', 'Coffee farms', 'Central mountain range'],
    description: 'Agricultural heartland famous for cacao production and lush landscapes.',
  },
  {
    province: 'El Seibo',
    capital: 'Santa Cruz de El Seibo',
    airports: [],
    beaches: ['Miches', 'Playa Esmeralda'],
    attractions: ['Miches', 'Redonda Mountain', 'Santa Cruz Basilica'],
    description: 'Emerging eco-tourism destination with pristine beaches and rural charm.',
  },
  {
    province: 'Elías Piña',
    capital: 'Comendador',
    airports: [],
    beaches: [],
    attractions: ['International Lake', 'Border markets', 'Mountain scenery'],
    description: 'Remote western province bordering Haiti with rugged mountain terrain.',
  },
  {
    province: 'Espaillat',
    capital: 'Moca',
    airports: [],
    beaches: [],
    attractions: ['Moca', 'Coffee plantations', 'Colonial architecture'],
    description: 'Central Cibao region province known for agriculture and traditional crafts.',
  },
  {
    province: 'Hato Mayor',
    capital: 'Hato Mayor del Rey',
    airports: [],
    beaches: [],
    attractions: ['Los Haitises National Park (partial)', 'Cacao routes', 'Yerba Buena'],
    description: 'Rural province with access to national parks and agricultural tourism.',
  },
  {
    province: 'Hermanas Mirabal',
    capital: 'Salcedo',
    airports: [],
    beaches: [],
    attractions: ['Mirabal Sisters Museum', 'Salcedo', 'Mountain vistas'],
    description: 'Named after the Mirabal sisters, national heroines of the Dominican resistance.',
  },
  {
    province: 'Independencia',
    capital: 'Jimaní',
    airports: [],
    beaches: [],
    attractions: ['Lake Enriquillo', 'Isla Cabritos National Park', 'Border crossing to Haiti'],
    description: 'Southwestern province featuring the lowest point in the Caribbean (Lake Enriquillo).',
  },
  {
    province: 'La Vega',
    capital: 'Concepción de La Vega',
    airports: [],
    beaches: [],
    attractions: ['Carnival celebrations', 'Santo Cerro', 'Jarabacoa (mountain town)', 'Constanza valley'],
    description: 'Central province famous for the most vibrant Carnival in the country and mountain tourism.',
  },
  {
    province: 'María Trinidad Sánchez',
    capital: 'Nagua',
    airports: [],
    beaches: ['Playa Grande', 'Cabrera'],
    attractions: ['Cabo Francés Viejo', 'Dudú Lagoon', 'Gri-Gri Lagoon'],
    description: 'North coast province with spectacular beaches and natural lagoons.',
  },
  {
    province: 'Monseñor Nouel',
    capital: 'Bonao',
    airports: [],
    beaches: [],
    attractions: ['Falconbridge Nickel Mines', 'Blanco River', 'Mountain resorts'],
    description: 'Central region province known for mining and agriculture.',
  },
  {
    province: 'Monte Cristi',
    capital: 'San Fernando de Monte Cristi',
    airports: [],
    beaches: ['Punta Rucia', 'Cayo Arena', 'El Morro'],
    attractions: ['El Morro National Park', 'Cayo Paraíso', 'Salt flats', 'Victorian architecture'],
    description: 'Northwestern coastal province with unique desert-like climate and pristine cays.',
  },
  {
    province: 'Monte Plata',
    capital: 'Monte Plata',
    airports: [],
    beaches: [],
    attractions: ['Los Haitises National Park (access)', 'Sugar cane plantations', 'Rural tourism'],
    description: 'Eastern interior province with access to ecological reserves.',
  },
  {
    province: 'Pedernales',
    capital: 'Pedernales',
    airports: [],
    beaches: ['Bahía de las Águilas', 'Cabo Rojo'],
    attractions: ['Jaragua National Park', 'Bahía de las Águilas (most pristine Caribbean beach)', 'Hoyo de Pelempito'],
    description: 'Remote southwestern province with untouched natural beauty and biodiversity.',
  },
  {
    province: 'Peravia',
    capital: 'Baní',
    airports: [],
    beaches: ['Las Salinas', 'Paya'],
    attractions: ['Sand dunes', 'Máximo Gómez birthplace', 'Mangrove forests'],
    description: 'Southern coastal province known for coffee, mangoes, and salt production.',
  },
  {
    province: 'San Cristóbal',
    capital: 'San Cristóbal',
    airports: [],
    beaches: ['Najayo', 'Palenque'],
    attractions: ['Constitutional House', 'Pomier Caves (Taino petroglyphs)', 'Nigua'],
    description: 'Historical province birthplace of dictator Trujillo, near Santo Domingo.',
  },
  {
    province: 'San José de Ocoa',
    capital: 'San José de Ocoa',
    airports: [],
    beaches: [],
    attractions: ['Mountain scenery', 'Coffee plantations', 'Eco-lodges'],
    description: 'Mountainous southern province known for cool climate and agriculture.',
  },
  {
    province: 'San Juan',
    capital: 'San Juan de la Maguana',
    airports: [],
    beaches: [],
    attractions: ['Maguana Valley', 'Corral de los Indios', 'Agricultural landscapes'],
    description: 'Western interior province with fertile valleys and Taino archaeological sites.',
  },
  {
    province: 'San Pedro de Macorís',
    capital: 'San Pedro de Macorís',
    airports: [],
    beaches: ['Juan Dolio', 'Guayacanes'],
    attractions: ['Cueva de las Maravillas', 'Baseball history', 'Sugar cane heritage'],
    description: 'Southeastern coastal province famous for baseball legends and beach resorts.',
  },
  {
    province: 'Sánchez Ramírez',
    capital: 'Cotuí',
    airports: [],
    beaches: [],
    attractions: ['La Loma Quita Espuela Scientific Reserve', 'Gold mines', 'Rural landscapes'],
    description: 'Central interior province with mining and agricultural activities.',
  },
  {
    province: 'Santiago Rodríguez',
    capital: 'San Ignacio de Sabaneta',
    airports: [],
    beaches: [],
    attractions: ['Mountain scenery', 'Coffee farms', 'Rural tourism'],
    description: 'Northwestern mountainous province with agricultural focus.',
  },
  {
    province: 'Valverde',
    capital: 'Mao',
    airports: [],
    beaches: [],
    attractions: ['Mao', 'Rice fields', 'Agricultural heritage'],
    description: 'Northwestern province known as a major rice production center.',
  },
];

/**
 * Get landmark data for a specific province
 */
export function getProvinceLandmarks(province: DominicanProvince): ProvinceLandmark | undefined {
  return PROVINCE_LANDMARKS.find(p => p.province === province);
}

/**
 * Get all provinces with international airports
 */
export function getProvincesWithAirports(): ProvinceLandmark[] {
  return PROVINCE_LANDMARKS.filter(p => p.airports.length > 0);
}

/**
 * Get all provinces with beaches
 */
export function getProvincesWithBeaches(): ProvinceLandmark[] {
  return PROVINCE_LANDMARKS.filter(p => p.beaches.length > 0);
}
