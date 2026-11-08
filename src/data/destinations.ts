import calapanBeachPhoto from '../assets/calapan-beach.jpg';
import calapanCathedralPhoto from '../assets/calapan-cathedral.jpg';
import calapanCityPlazaPhoto from '../assets/calapan-city-plaza.jpg';
import calapanNatureParkPhoto from '../assets/calapan-nature-park.png';
import harkaPilotoPhoto from '../assets/harka-piloto-island.jpg';
import jollyWavesPhoto from '../assets/jolly-waves-waterpark.png';
import mahalNaPangalanPhoto from '../assets/mahal-na-pangalan-marine-park.png';
import orientalMindoroHeritageMuseumPhoto from '../assets/oriental-mindoro-heritage-museum-interior.png';
import plazaDelGobernadorPhoto from '../assets/plaza-del-gobernador.png';
import silonayMangrovePhoto from '../assets/silonay-mangrove-eco-park.webp';
import { CALAPAN_PLACES } from './calapan';

export type RideDestinationCategory = string;

export interface RideDestination {
  id: string;
  name: string;
  category: RideDestinationCategory;
  description: string;
  address: string;
  city: string;
  province: string;
  country: 'Philippines';
  latitude: number;
  longitude: number;
  osmUrl: string;
  image?: string;
  imageFallback?: string;
  imageAlt?: string;
  imageCredit?: string;
  imageLicense?: string;
  imageSourceUrl?: string;
  budget?: number;
  budgetNote?: string;
  activities?: string[];
  openingInformation?: string;
  nearbyAttractions?: string[];
  tags?: string[];
}

const calapanDetails: Record<string, Partial<RideDestination>> = {
  'calapan-cathedral': {
    image: calapanCathedralPhoto,
    imageAlt: 'Facade of Santo Niño Cathedral in Calapan',
    imageCredit: 'Elmer B. Domingo',
    imageLicense: 'CC BY-SA 4.0',
    imageSourceUrl: 'https://commons.wikimedia.org/wiki/File:Sto_Nino_Church_Calapan.jpg',
    budget: 150,
    budgetNote: 'Sample budget for local transport and snacks.',
    activities: ['Visit the cathedral', 'Walk around the city center', 'Try local food nearby'],
    openingInformation: 'Sample guide: usually open daily. Confirm schedules before visiting.',
    nearbyAttractions: ['Calapan City Plaza', 'Oriental Mindoro Heritage Museum'],
    tags: ['church', 'history', 'city center'],
  },
  'calapan-city-plaza': {
    image: calapanCityPlazaPhoto,
    imageAlt: 'Monument in Calapan City Plaza',
    imageCredit: 'Isolatedpawn',
    imageLicense: 'CC BY-SA 3.0',
    imageSourceUrl: 'https://commons.wikimedia.org/wiki/File:Calapan_City_Plaza,_Calapan_City,_Oriental_Mindoro,_Philippines.jpg',
    budget: 100,
    budgetNote: 'Sample budget for snacks and a short city ride.',
    activities: ['Relax in the plaza', 'Take a city-center walk', 'Visit nearby heritage sites'],
    openingInformation: 'Sample guide: public plaza, generally open daily. Confirm local rules before visiting.',
    nearbyAttractions: ['Calapan Cathedral', 'Oriental Mindoro Heritage Museum'],
    tags: ['park', 'public space', 'city center'],
  },
  'bulusan-nature-park': {
    image: calapanNatureParkPhoto,
    imageFallback: calapanNatureParkPhoto,
    imageAlt: 'Shaded footbridge at Bulusan Nature Park in Calapan',
    budget: 300,
    budgetNote: 'Sample budget for transport and a short nature stop.',
    activities: ['Nature walk', 'Forest viewing', 'Photography'],
    openingInformation: 'Sample guide: daytime visits are typical. Confirm access before traveling.',
    nearbyAttractions: ['Parang Beach Resort', 'Silonay Mangrove Conservation Ecopark'],
    tags: ['nature', 'forest', 'park'],
  },
  'parang-beach-resort': {
    image: calapanBeachPhoto,
    imageAlt: 'Seashore along the Calapan coast',
    imageCredit: 'Jdcgumpal',
    imageLicense: 'CC BY-SA 3.0',
    imageSourceUrl: 'https://commons.wikimedia.org/wiki/File:Calapan_Beach.JPG',
    budget: 500,
    budgetNote: 'Sample budget for transport and beach expenses.',
    activities: ['Beach walk', 'Coastal views', 'Local food'],
    openingInformation: 'Sample guide: resort hours vary. Confirm current access and fees before visiting.',
    nearbyAttractions: ['Bulusan Nature Park', 'Silonay Mangrove Conservation Ecopark'],
    tags: ['beach', 'coast', 'resort'],
  },
  'oriental-mindoro-heritage-museum': {
    image: orientalMindoroHeritageMuseumPhoto,
    imageAlt: 'Interior entrance of the Oriental Mindoro Heritage Museum',
    budget: 200,
    budgetNote: 'Sample budget for transport and a museum stop.',
    activities: ['Learn local history', 'View heritage displays', 'Walk around the city center'],
    openingInformation: 'Sample guide: museum hours may change. Confirm before visiting.',
    nearbyAttractions: ['Calapan Cathedral', 'Calapan City Plaza'],
    tags: ['museum', 'history', 'culture'],
  },
  'silonay-mangrove-ecopark': {
    image: silonayMangrovePhoto,
    imageAlt: 'Wooden walkway through Silonay mangroves',
    budget: 350,
    budgetNote: 'Sample budget for transport and community ecopark fees.',
    activities: ['Mangrove walk', 'Boardwalk walk', 'Kayaking', 'Coastal habitat viewing', 'Community ecotourism'],
    openingInformation: 'Sample guide: access is coordinated locally. Confirm before traveling.',
    nearbyAttractions: ['Parang Beach Resort', 'Bulusan Nature Park'],
    tags: ['mangrove', 'nature', 'ecopark', 'coast', 'kayaking'],
  },
};

const harkaPilotoPhotoDetails: Partial<RideDestination> = {
  image: harkaPilotoPhoto,
  imageAlt: 'Harka Piloto Island in Calapan, Oriental Mindoro',
  imageCredit: 'Patrickroque01',
  imageLicense: 'CC BY-SA 4.0',
  imageSourceUrl: 'https://commons.wikimedia.org/wiki/File:Harka_Piloto_Island_(Calapan,_Oriental_Mindoro;_12-05-2023).jpg',
};

const calapanDestinations: RideDestination[] = CALAPAN_PLACES.map((place) => ({
  ...place,
  ...calapanDetails[place.id],
  budgetNote: calapanDetails[place.id]?.budgetNote ?? 'Sample budget estimate.',
}));

export const RIDE_DESTINATIONS: readonly RideDestination[] = [
  ...calapanDestinations,
  {
    id: 'calapan-nature-park',
    name: 'Bulusan Park',
    category: 'Parks and Nature',
    description: 'A recreational park with green surroundings and open spaces for relaxation, outdoor activities, and family outings.',
    address: 'Bulusan, Calapan City',
    city: 'Calapan',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.411,
    longitude: 121.18,
    osmUrl: 'https://www.openstreetmap.org/search?query=Calapan%20Nature%20Park',
    image: calapanNatureParkPhoto,
    imageAlt: 'Shaded footbridge at Bulusan Nature Park in Calapan',
    tags: ['park', 'nature', 'family'],
    activities: ['Picnic', 'Walk', 'Relaxation'],
  },
  {
    id: 'bulusan-suqui-eco-trail',
    name: 'Bulusan–Suqui Eco Trail',
    category: 'Parks and Nature',
    description: 'An eco-trail for nature walks and outdoor exploration, starting near Bulusan Nature Park and leading toward the coastal side of Calapan.',
    address: 'Calapan Nature Park, Brgy. Bulusan, Calapan City',
    city: 'Calapan',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.405,
    longitude: 121.175,
    osmUrl: 'https://www.openstreetmap.org/search?query=Bulusan%20Suqui%20Eco%20Trail',
    tags: ['trail', 'eco', 'nature'],
    activities: ['Hiking', 'Birdwatching'],
  },
  {
    id: 'guinobatan-falls',
    name: 'Guinobatan Falls',
    category: 'Nature & Eco-Tourism',
    description: 'A local natural attraction in the Guinobatan area of Calapan. Check local access and conditions before visiting.',
    address: 'Brgy. Guinobatan, Calapan City',
    city: 'Calapan',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.42,
    longitude: 121.15,
    osmUrl: 'https://www.openstreetmap.org/search?query=Guinobatan%20Falls%20Calapan',
    tags: ['falls', 'nature'],
  },
  {
    id: 'mahal-na-pangalan-marine-park',
    name: 'Mahal na Pangalan Marine Park / MNP Mangrove Park',
    category: 'Parks and Nature',
    description: 'A coastal conservation area associated with mangroves and marine ecosystems for environmental learning and nature activities.',
    address: 'Barangay Mahal na Pangalan, Calapan City',
    city: 'Calapan',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.408,
    longitude: 121.2,
    osmUrl: 'https://www.openstreetmap.org/search?query=Mahal%20na%20Pangalan%20Marine%20Park',
    image: mahalNaPangalanPhoto,
    imageAlt: 'Welcome mural at Mahal na Pangalan Marine Park in Calapan',
    tags: ['mangrove', 'marine', 'conservation'],
  },
  {
    id: 'suqui-beach',
    name: 'Suqui Beach',
    category: 'Beaches',
    description: 'A coastal destination with sea breeze, coastal scenery, and relaxation by the shore.',
    address: 'Suqui, Calapan City',
    city: 'Calapan',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.4,
    longitude: 121.17,
    osmUrl: 'https://www.openstreetmap.org/search?query=Suqui%20Beach%20Calapan',
    tags: ['beach', 'coast'],
  },
  {
    id: 'balite-beach',
    name: 'Balite Beach',
    category: 'Beaches',
    description: 'A beach area in Calapan. Check accessibility and facilities before visiting.',
    address: 'Balite, Calapan City',
    city: 'Calapan',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.39,
    longitude: 121.21,
    osmUrl: 'https://www.openstreetmap.org/search?query=Balite%20Beach%20Calapan',
    tags: ['beach'],
  },
  {
    id: 'la-aroma-cafe',
    name: 'La Aroma Cafe and Restaurant',
    category: 'Cafés & Coffee Shops',
    description: 'Cafe and restaurant in Calapan City.',
    address: 'Calapan City',
    city: 'Calapan',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.4115,
    longitude: 121.1815,
    osmUrl: 'https://www.openstreetmap.org/search?query=La%20Aroma%20Cafe%20Calapan',
    tags: ['cafe', 'restaurant'],
    activities: ['Coffee', 'Meals'],
  },
  {
    id: 'lazareto-beach',
    name: 'Lazareto Beach',
    category: 'Beaches',
    description: 'Coastal destination for sightseeing and exploring the shoreline.',
    address: 'Calapan City',
    city: 'Calapan',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.395,
    longitude: 121.205,
    osmUrl: 'https://www.openstreetmap.org/search?query=Lazareto%20Beach%20Calapan',
    tags: ['beach'],
  },
  {
    id: 'santa-cruz-beach',
    name: 'Santa Cruz Beach',
    category: 'Beaches',
    description: 'Beach area in Calapan City.',
    address: 'Santa Cruz, Calapan City',
    city: 'Calapan',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.4,
    longitude: 121.19,
    osmUrl: 'https://www.openstreetmap.org/search?query=Santa%20Cruz%20Beach%20Calapan',
    tags: ['beach'],
  },
  {
    id: 'baco-islands',
    name: 'Baco Islands',
    category: 'Islands & Islets',
    description: 'Island destination near Calapan City.',
    address: 'Offshore Calapan City',
    city: 'Calapan',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.36,
    longitude: 121.19,
    osmUrl: 'https://www.openstreetmap.org/search?query=Baco%20Islands%20Calapan',
    tags: ['island', 'beach'],
  },
  {
    id: 'harka-piloto-islet',
    name: 'Harka Piloto Islet',
    category: 'Beaches',
    description: 'Small islet associated with the Harka Piloto marine sanctuary area.',
    address: 'Harka Piloto, Calapan City',
    city: 'Calapan',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.36,
    longitude: 121.24,
    osmUrl: 'https://www.openstreetmap.org/search?query=Harka%20Piloto%20Islet',
    ...harkaPilotoPhotoDetails,
    tags: ['islet', 'marine'],
  },
  {
    id: 'aganahaw-islet',
    name: 'Aganahaw Islet',
    category: 'Beaches',
    description: 'Small island mentioned in tourism references. Verify location and accessibility.',
    address: 'Calapan City',
    city: 'Calapan',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.355,
    longitude: 121.245,
    osmUrl: 'https://www.openstreetmap.org/search?query=Aganahaw%20Islet%20Calapan',
    tags: ['islet'],
  },
  {
    id: 'baco-chico-islets',
    name: 'Baco-Chico Islets',
    category: 'Beaches',
    description: 'Group of small islets for boat sightseeing, subject to sea conditions.',
    address: 'Calapan City',
    city: 'Calapan',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.35,
    longitude: 121.25,
    osmUrl: 'https://www.openstreetmap.org/search?query=Baco%20Chico%20Islets',
    tags: ['islets', 'boat'],
  },
  {
    id: 'harka-piloto-fish-sanctuary',
    name: 'Harka Piloto Fish Sanctuary',
    category: 'Parks and Nature',
    description: 'Marine protected area for fish and coral ecosystems. Snorkeling possible where permitted.',
    address: 'Silonay, Calapan City',
    city: 'Calapan',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.358,
    longitude: 121.242,
    osmUrl: 'https://www.openstreetmap.org/search?query=Harka%20Piloto%20Fish%20Sanctuary',
    ...harkaPilotoPhotoDetails,
    tags: ['sanctuary', 'marine'],
  },
  {
    id: 'sinag-coffee-roastery',
    name: 'Sinag Coffee Roastery and Cafe',
    category: 'Cafés & Coffee Shops',
    description: 'Coffee shop and cafe in Calapan City.',
    address: 'Calapan City',
    city: 'Calapan',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.412,
    longitude: 121.182,
    osmUrl: 'https://www.openstreetmap.org/search?query=Sinag%20Coffee%20Roastery%20Calapan',
    tags: ['cafe', 'coffee'],
    activities: ['Coffee', 'Pastries', 'Dine-in'],
  },
  {
    id: 'bashiru-japanese-restaurant',
    name: 'Bashiru Japanese Restaurant',
    category: 'Restaurants & Eateries',
    description: 'Japanese restaurant in Calapan City.',
    address: 'Calapan City',
    city: 'Calapan',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.412,
    longitude: 121.181,
    osmUrl: 'https://www.openstreetmap.org/search?query=Bashiru%20Japanese%20Restaurant%20Calapan',
    tags: ['restaurant', 'japanese'],
    activities: ['Japanese Food'],
  },
  {
    id: 'plaza-del-gobernador',
    name: 'Plaza del Gobernador – Ang Liwasan ng Mamamayan',
    category: 'Parks and Nature',
    description: 'Public plaza for relaxation, walking, community gatherings, and local events.',
    address: 'Calapan City Plaza, Calapan City',
    city: 'Calapan',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.411,
    longitude: 121.1805,
    osmUrl: 'https://www.openstreetmap.org/search?query=Plaza%20del%20Gobernador%20Calapan',
    image: plazaDelGobernadorPhoto,
    imageAlt: 'Plaza del Gobernador at sunset in Calapan',
    tags: ['plaza', 'park'],
  },
  {
    id: 'calapan-city-hall',
    name: 'Calapan City Hall',
    category: 'Cultural Sites',
    description: "The city's government center, may be included in civic tours.",
    address: 'Calapan City',
    city: 'Calapan',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.412,
    longitude: 121.181,
    osmUrl: 'https://www.openstreetmap.org/search?query=Calapan%20City%20Hall',
    tags: ['government'],
  },
  {
    id: 'jolly-waves-waterpark',
    name: 'Jolly Waves Waterpark & Resort',
    category: 'Parks and Nature',
    description: 'Waterpark with pools and water activities for families and groups. Check current hours and fees.',
    address: 'Sapul, Calapan City',
    city: 'Calapan',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.42,
    longitude: 121.19,
    osmUrl: 'https://www.openstreetmap.org/search?query=Jolly%20Waves%20Waterpark%20Calapan',
    image: jollyWavesPhoto,
    imageAlt: 'Pools and water slides at Jolly Waves Waterpark in Calapan',
    tags: ['waterpark', 'resort', 'family', 'swimming pool'],
    activities: ['Swimming', 'Water slides', 'Water activities'],
  },
  {
    id: 'parang-coconut-banana-plantations',
    name: 'Parang Coconut and Banana Plantations',
    category: 'Parks and Nature',
    description: 'Agricultural areas showcasing coconut and banana farming. Get permission before entering private properties.',
    address: 'Parang, Calapan City',
    city: 'Calapan',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.379,
    longitude: 121.221,
    osmUrl: 'https://www.openstreetmap.org/search?query=Parang%20Plantations%20Calapan',
    tags: ['agriculture', 'rural'],
  },
  {
    id: 'sapul-orchard',
    name: 'Sapul Orchard',
    category: 'Parks and Nature',
    description: 'Orchard for fruit farming and agricultural tourism. Confirm if visits are permitted.',
    address: 'Calapan City',
    city: 'Calapan',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.4,
    longitude: 121.19,
    osmUrl: 'https://www.openstreetmap.org/search?query=Sapul%20Orchard%20Calapan',
    tags: ['orchard', 'agriculture'],
  },
  {
    id: 'halhal-cave',
    name: 'Halhal Cave',
    category: 'Parks and Nature',
    description: 'Cave mentioned in tourism references. Verify location, access, and guided visits.',
    address: 'Calapan City',
    city: 'Calapan',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.403,
    longitude: 121.173,
    osmUrl: 'https://www.openstreetmap.org/search?query=Halhal%20Cave%20Calapan',
    tags: ['cave'],
  },
  {
    id: 'caluwangan-cave',
    name: 'Caluwangan Cave',
    category: 'Parks and Nature',
    description: 'Cave mentioned in tourism references. Verify location and access before visiting.',
    address: 'Calapan City',
    city: 'Calapan',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.402,
    longitude: 121.172,
    osmUrl: 'https://www.openstreetmap.org/search?query=Caluwangan%20Cave%20Calapan',
    tags: ['cave'],
  },
];

export function getRideDestinations(): RideDestination[] {
  return [...RIDE_DESTINATIONS];
}

const destinationIdAliases: Record<string, string> = {
  'silonay-mangrove-eco-park': 'silonay-mangrove-ecopark',
};

export function normalizeDestinationId(id: string): string {
  return destinationIdAliases[id] ?? id;
}

export function getRideDestination(id: string): RideDestination | undefined {
  const normalizedId = normalizeDestinationId(id);
  return RIDE_DESTINATIONS.find((destination) => destination.id === normalizedId);
}

export function destinationSearchText(destination: RideDestination): string {
  return [
    destination.name,
    destination.category,
    destination.description,
    destination.address,
    destination.city,
    destination.province,
    destination.country,
    ...(destination.tags ?? []),
  ].join(' ').toLocaleLowerCase();
}
