import { CURATED_CAFE_LISTINGS, CURATED_RESTAURANT_LISTINGS } from './curatedFoodPlaces';
import { getRideDestinations, type RideDestination } from './destinations';
import ferarenHillsImage from '../assets/feraren-hills.png';
import calapanCableParkImage from '../assets/calapan-cable-park.png';
import baruyanRiverCruiseImage from '../assets/baruyan-river-cruise.png';
import harkaPilotoSnorkelingImage from '../assets/harka-piloto-snorkeling.png';
import balaiMindoroPickleballImage from '../assets/balai-mindoro-pickleball.png';
import lazaretoBeachImage from '../assets/lazareto-beach.png';
import parangBeachImage from '../assets/parang-beach.png';
import pachocaBaliteBeachImage from '../assets/pachoca-balite-beach.png';
import suquiBeachImage from '../assets/suqui-beach.png';
import lambinganBeachImage from '../assets/lambingan-beach.png';
import divineMercyParishImage from '../assets/divine-mercy-parish.jpg';
import stsPeterPaulChaplaincyImage from '../assets/sts-peter-paul-chaplaincy.jpg';
import stBenedictChaplaincyImage from '../assets/st-benedict-chaplaincy.jpg';
import balaiMindoroImage from '../assets/balai-mindoro.jpg';
import mahaltaResortImage from '../assets/mahalta-resort.jpg';
import cuidadGardenResortImage from '../assets/cuidad-garden-resort.jpg';
import casaEstelaImage from '../assets/cafe-casa-estela.jpg';
import cocoFarmResortImage from '../assets/coco-farm-resort.jpg';
import casaRealRuinsImage from '../assets/casa-real-ruins.jpg';
import heritageCultureArtsBuildingImage from '../assets/heritage-culture-arts-building.jpg';
import filipinianaResortImage from '../assets/filipiniana-resort.jpg';
import achimieHotelImage from '../assets/achimie-hotel.jpg';
import aguasHotelImage from '../assets/aguas-hotel.jpg';
import huanyingHotelImage from '../assets/huanying-hotel.jpg';
import bulaloMangroveInnImage from '../assets/bulalo-mangrove-inn.jpg';
import fourCRoomRentalImage from '../assets/four-c-room-rental.jpg';
import goldenParadiseInnImage from '../assets/golden-paradise-inn.jpg';
import burjCalapanImage from '../assets/burj-calapan.jpg';
import blueHarborInnImage from '../assets/blue-harbor-inn.jpg';
import agahaoIsletImage from '../assets/agahao-islet.jpg';
import bacoChicoIsletsImage from '../assets/baco-chico-islets.jpg';
import mangyanHeritageCenterImage from '../assets/mangyan-heritage-center.jpg';
import caluanganLakeImage from '../assets/caluangan-lake.jpg';
import calapanCityPublicMarketImage from '../assets/calapan-city-public-market.jpg';
import calapanNightMarketImage from '../assets/calapan-night-market.jpg';
import mindoroSouvenirShopImage from '../assets/mindoro-souvenir-shop.jpg';
import nucitiMallImage from '../assets/nuciti-mall.jpg';
import citimartIslandMallImage from '../assets/citimart-island-mall.jpg';
import cityMallCalapanImage from '../assets/citymall-calapan.jpg';
import xentroMallCalapanImage from '../assets/xentro-mall-calapan.jpg';
import gaisanoCapitalCalapanImage from '../assets/gaisano-capital-calapan.jpg';

export interface ExploreListing {
  name: string;
  note?: string;
  category?: string;
  image?: string;
}

export const EXPLORE_CATEGORY_LISTINGS: Readonly<Record<string, readonly ExploreListing[]>> = {
  'Adventure & Outdoor Activities': [
    { name: 'Feraren Hills', image: ferarenHillsImage },
    { name: 'Calapan Cable Park (wakeboarding)', note: 'Operating status unconfirmed; verify before visiting.', image: calapanCableParkImage },
    { name: 'Kayaking and river cruise at Baruyan River and Caluangan Lake', image: baruyanRiverCruiseImage },
    { name: 'Snorkeling at Harka Piloto (Silonay)', image: harkaPilotoSnorkelingImage },
    { name: 'Balai Mindoro pickleball courts (Bayanan I)', image: balaiMindoroPickleballImage },
  ],
  Beaches: [
    { name: 'Lazareto Beach', image: lazaretoBeachImage },
    { name: 'Parang Beach', image: parangBeachImage },
    { name: 'Pachoca–Balite Beach', image: pachocaBaliteBeachImage },
    { name: 'Suqui Beach', image: suquiBeachImage },
    { name: 'Lambingan Beach (San Antonio)', image: lambinganBeachImage },
  ],
  'Cafés & Coffee Shops': CURATED_CAFE_LISTINGS,
  'Churches & Religious Sites': [
    { name: 'Sto. Niño Cathedral (Diocese of Calapan)' },
    { name: 'Divine Mercy Parish (Pachoca)', image: divineMercyParishImage },
    { name: 'Sts. Peter and Paul Chaplaincy (Roxas Dr.)', image: stsPeterPaulChaplaincyImage },
    { name: 'Our Lady of Fatima Chapel (Roxas Dr.)' },
    { name: 'St. Benedict Chaplaincy (near Tawiran)', image: stBenedictChaplaincyImage },
    { name: 'World Mission Society Church of God – Calapan (JP Rizal)' },
  ],
  'Events & Venues': [
    { name: 'Balai Mindoro', image: balaiMindoroImage },
    { name: 'Calapan Bay Hotel (Cafe Angela function venue)' },
    { name: 'Czeascape Beach Resort' },
    { name: 'VillAgueda Events Place' },
    { name: 'Villa Marina (Parang)' },
    { name: 'Mahalta Resorts and Convention Center (Parang)', image: mahaltaResortImage },
    { name: 'Cuidad Garden Resort and Conference Center', image: cuidadGardenResortImage },
    { name: 'Casa Estela Boutique Hotel & Cafe', image: casaEstelaImage },
    { name: 'Parang Beach Resort (events area)' },
  ],
  'Farm Tourism': [
    { name: 'Coco Farm Resort (Canubing I)', image: cocoFarmResortImage },
    { name: "Arsenia's Hapag Kainan sa Kabukiran (farm-to-table: fish pond and crab farm, view of Mt. Halcon)" },
    { name: 'Amaliso Farm & Resort (Sitio Bilolo)' },
    { name: 'Il Lago FDJ Farm (Tawagan Rd.)', note: 'Verify this listing before visiting.' },
  ],
  'Historical Sites': [
    { name: 'Calapan City Plaza' },
    { name: 'Casa Real Ruins', image: casaRealRuinsImage },
    { name: 'Old City Hall (now the Heritage, Culture, and Arts Building)', image: heritageCultureArtsBuildingImage },
    { name: 'Calapan Tamaraw Welcome Arch (city boundary)' },
  ],
  'Hotels & Accommodations': [
    { name: 'Filipiniana Resort & Hotel (Sto. Niño)', image: filipinianaResortImage },
    { name: 'Casa Estela Boutique Hotel & Cafe', image: casaEstelaImage },
    { name: 'Casa Alberto (Camilmil)' },
    { name: 'Calapan Bay Hotel' },
    { name: 'Achimie Hotel', image: achimieHotelImage },
    { name: "Agua's Hotel", image: aguasHotelImage },
    { name: "Destiny's Place Hotel/Inn (Lumangbayan)" },
    { name: 'HuanYing Hotel (Juan Luna)', image: huanyingHotelImage },
    { name: "Nikita's Place Hotel (Tawiran)" },
    { name: 'Cuidad Garden Resort and Conference Center', image: cuidadGardenResortImage },
    { name: 'Bulalo Mangrove Inn', image: bulaloMangroveInnImage },
    { name: "4C's Room Rental, Apartment, Hotel and Transient (Jasmin St.)", image: fourCRoomRentalImage },
    { name: 'Golden Paradise Inn', image: goldenParadiseInnImage },
    { name: 'Calapan Hotel House' },
    { name: 'Calapan City House Transient/Rental' },
    { name: 'Calapan City Transient House (Blk 52 Lot 41)' },
    { name: 'Calapan City Transient House/Staycation/Hotel' },
    { name: 'Calapan Mindoro Transient Apartments (Villa Arce)' },
    { name: 'Calapan Cheapest House Transient' },
    { name: 'Burj Calapan (San Vicente)', image: burjCalapanImage },
    { name: 'Domini Hotel', note: 'Older listing; verify before booking.' },
    { name: 'Blue Harbor Inn', note: 'Older listing; verify before booking.', image: blueHarborInnImage },
    { name: 'Bimas Inn', note: 'Older listing; verify before booking.' },
  ],
  'Islands & Islets': [
    { name: 'Silonay Island/Islet' },
    { name: 'Aganhao (Aganhaw) Islet', image: agahaoIsletImage },
    { name: 'Baco-Chico Islets', image: bacoChicoIsletsImage },
  ],
  'Marine Sanctuaries': [
    { name: 'Harka Piloto Fish Sanctuary (Silonay)' },
    { name: 'Mahal na Pangalan Marine Park / MNP Mangrove Park' },
  ],
  'Museums & Heritage': [
    { name: 'Oriental Mindoro Heritage Museum' },
    { name: 'Calapan City Heritage, Culture, and Arts Building' },
    { name: 'Mangyan Heritage Center (Calero and new location in Sto. Niño)', image: mangyanHeritageCenterImage },
    { name: 'Balai Mindoro (guided tour of crafts)', image: balaiMindoroImage },
  ],
  'Nature & Eco-Tourism': [
    { name: 'Silonay Mangrove Conservation Ecopark' },
    { name: 'Bulusan Park' },
    { name: 'Baruyan River and Caluangan Lake', image: caluanganLakeImage },
    { name: 'Silonay–Navotas–Maidlang marshes' },
  ],
  'Parks & Recreation': [
    { name: 'Plaza del Gobernador / Liwasan ng Mamamayan (dancing fountain)' },
    { name: 'Calapan City Plaza' },
    { name: 'Kalap Civic Park' },
    { name: 'Bulusan Park' },
    { name: 'MinSU Calapan Campus Manmade Lake and Development Park' },
  ],
  'Public Markets': [
    { name: 'Calapan City Public Market', image: calapanCityPublicMarketImage },
    { name: 'Night market around Calapan City Plaza', image: calapanNightMarketImage },
  ],
  'Restaurants & Eateries': CURATED_RESTAURANT_LISTINGS,
  Resorts: [
    { name: 'Anahaw Island View Resort (Balite)' },
    { name: 'Parang Beach Resort (Parang)' },
    { name: 'Czeascape Beach Resort' },
    { name: 'Playa Ignacio Resort' },
    { name: 'El Pueblo Rhizort' },
    { name: 'Mahalta Resorts and Convention Center (Parang)', image: mahaltaResortImage },
    { name: "Eduardo's Resort (Bayanan II)" },
    { name: 'La Estancia Resort' },
    { name: 'El Huerto Private Resort (Malamig)' },
    { name: 'Coco Farm Resort (Canubing I)', image: cocoFarmResortImage },
    { name: 'EverLand Lake Resort (Baruyan)' },
    { name: 'Eden Lakeview Resort (Baruyan)' },
    { name: "Inay's Place Resort (spring-water pools)" },
    { name: 'Casa Alberto (indoor pool)' },
    { name: 'Amaliso Farm & Resort' },
    { name: 'VillAgueda Events Place' },
    { name: 'Filipiniana Resort & Hotel', image: filipinianaResortImage },
    { name: 'Aganhaw Beach Resort', note: 'Older listing; verify before visiting.' },
    { name: 'Calapan Bayside Resort', note: 'Older listing; verify before visiting.' },
  ],
  'Shopping Malls': [
    { name: 'Nuciti Central Mall Calapan', image: nucitiMallImage },
    { name: 'Citimart Island Mall', image: citimartIslandMallImage },
    { name: 'CityMall Calapan', image: cityMallCalapanImage },
    { name: 'Xentro Mall Calapan', image: xentroMallCalapanImage },
    { name: 'Gaisano Capital Calapan', image: gaisanoCapitalCalapanImage },
  ],
  'Souvenir Shops': [
    { name: "Merl's Native Delicacies (Lumangbayan)" },
    { name: 'Small Creation Souvenirs by Bennett Dan Gamban' },
    { name: 'AnikAnik (Paras Drive)' },
    { name: 'Mindoro Souvenir', note: 'Verify this listing before visiting.', image: mindoroSouvenirShopImage },
  ],
  'Swimming Pools': [
    { name: "Eduardo's Resort" },
    { name: 'Coco Farm Resort' },
    { name: "Inay's Place Resort" },
    { name: 'Casa Alberto (indoor pool, day pass)' },
    { name: 'La Estancia Resort' },
    { name: 'El Pueblo Rhizort' },
    { name: 'Playa Ignacio Resort' },
    { name: 'Czeascape Beach Resort' },
    { name: 'EverLand Lake Resort' },
    { name: 'Eden Lakeview Resort' },
    { name: 'El Huerto Private Resort' },
    { name: 'VillAgueda Events Place' },
    { name: 'Mahalta Resorts and Convention Center' },
  ],
  'Tourist Spots': [
    { name: 'Oriental Mindoro Heritage Museum' },
    { name: 'Plaza del Gobernador' },
    { name: 'Calapan City Plaza' },
    { name: 'Sto. Niño Cathedral' },
    { name: 'Bulusan Park' },
    { name: 'Silonay Mangrove Conservation Ecopark' },
    { name: 'Harka Piloto Fish Sanctuary' },
    { name: 'Lazareto Beach' },
    { name: 'Jolly Waves Waterpark' },
    { name: 'Mangyan Heritage Center', image: mangyanHeritageCenterImage },
    { name: 'Calapan Tamaraw Welcome Arch' },
  ],
  Waterparks: [
    { name: 'Jolly Waves Waterpark and Resort (Sapul)' },
    { name: "Eduardo's Resort (slides and fountain play pool)" },
  ],
};

function normalizeListingName(name: string, stripParenthetical = true): string {
  return (stripParenthetical ? name.replace(/\s*\([^)]*\)/g, '') : name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const rideDestinations = getRideDestinations();
const areaHintNames = [
  'Calapan Town Center',
  'Filipiniana Complex',
  'San Vicente East',
  'San Vicente',
  'Bayanan I',
  'Bayanan II',
  'Canubing I',
  'Sto. Niño',
  'San Antonio',
  'Calapan City Plaza',
  'Mahal na Pangalan',
  'Harka Piloto',
  'Xentro Mall',
  'Paras Drive',
  'C5 Road',
  'C5 Rd.',
  'Roxas Drive',
  'Roxas Dr.',
  'Bonifacio Street',
  'Bonifacio St.',
  'Quezon Drive',
  'Quezon Dr.',
  'Tawagan Road',
  'Tawagan Rd.',
  'Ramirez Street',
  'Ramirez St.',
  'Jasmin Street',
  'Jasmin St.',
  'Gov. Ignacio',
  'Juan Luna',
  'Lumangbayan',
  'Camilmil',
  'Tawiran',
  'Silonay',
  'Pachoca',
  'Parang',
  'Suqui',
  'Bulusan',
  'Balite',
  'Calero',
  'Lalud',
  'Ubas',
  'Sapul',
  'Gozar',
  'Baruyan',
  'Malamig',
  'Bayanan',
  'Canubing',
  'Bilolo',
  'Del Pilar',
  'Nuciti',
  'SMV',
  'MND Bldg.',
].sort((a, b) => b.length - a.length);

export interface ExploreListingLocation {
  label: 'Address' | 'Area';
  value: string;
}

function isGeneralCityAddress(address: string): boolean {
  return /^(?:offshore\s+)?calapan city(?:, oriental mindoro)?$/i.test(address.trim());
}

function formatFullAddress(address: string): string {
  const normalized = address.trim().replace(/,\s*Calapan$/i, ', Calapan City');
  if (/oriental mindoro/i.test(normalized)) return normalized;
  if (/calapan(?: city)?$/i.test(normalized)) return `${normalized}, Oriental Mindoro`;
  return `${normalized}, Calapan City, Oriental Mindoro`;
}

function findAreaHint(...values: string[]): string | null {
  for (const value of values) {
    for (const area of areaHintNames) {
      const escapedArea = area.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = value.match(new RegExp(`(?:^|[^\\p{L}\\p{N}])(${escapedArea})(?=$|[^\\p{L}\\p{N}])`, 'iu'));
      if (match) return match[1];
    }
  }
  return null;
}

export function getExploreListingLocation(
  listing: ExploreListing,
  category = listing.category ?? '',
  knownPlace?: RideDestination,
): ExploreListingLocation {
  const placeId = getExploreListingId(listing.name, category);
  const place = knownPlace ?? rideDestinations.find((candidate) => candidate.id === placeId);

  if (place && place.address && !isGeneralCityAddress(place.address)) {
    const hasStreetAddress = /\b(?:street|st\.|road|rd\.|avenue|ave\.|highway|hwy\.|barangay|brgy\.|sitio|purok|zone)\b/i.test(place.address);
    if (hasStreetAddress) return { label: 'Address', value: formatFullAddress(place.address) };
    return { label: 'Area', value: formatFullAddress(place.address) };
  }

  const area = findAreaHint(listing.name, place?.name ?? '');
  if (area) return { label: 'Area', value: `${area}, Calapan City, Oriental Mindoro` };

  return { label: 'Address', value: 'Address not verified' };
}

export function getExploreCategoryListings(): Readonly<Record<string, readonly ExploreListing[]>> {
  const groups: Record<string, ExploreListing[]> = Object.fromEntries(
    Object.entries(EXPLORE_CATEGORY_LISTINGS).map(([category, listings]) => [category, [...listings]])
  );
  const existingIds = new Set(Object.entries(EXPLORE_CATEGORY_LISTINGS)
    .flatMap(([category, listings]) => listings.map((listing) => getExploreListingId(listing.name, category))));

  for (const place of rideDestinations) {
    if (existingIds.has(place.id)) continue;
    groups[place.category] ??= [];
    groups[place.category].push({ name: place.name });
    existingIds.add(place.id);
  }
  return groups;
}

export function getExploreListingId(name: string, category: string): string {
  const placeName = normalizeListingName(name);
  const knownPlace = rideDestinations.find((place) => {
    const knownName = normalizeListingName(place.name, false);
    return knownName === placeName
      || (placeName.includes('cathedral') && knownName === 'calapan cathedral')
      || (placeName.includes('harka piloto fish sanctuary') && knownName.includes('harka piloto fish sanctuary'))
      || (placeName.startsWith('jolly waves waterpark') && knownName.startsWith('jolly waves waterpark'))
      || (placeName.startsWith('mahal na pangalan marine park') && knownName.startsWith('mahal na pangalan marine park'))
      || (placeName.startsWith('plaza del gobernador') && knownName.startsWith('plaza del gobernador'))
      || (placeName === 'calapan nature park' && knownName === 'bulusan park');
  });
  if (knownPlace) return knownPlace.id;
  const slugSource = `${category}-${name}`
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slugSource;
}

const exploreListingIds = new Set(
  Object.entries(EXPLORE_CATEGORY_LISTINGS)
    .flatMap(([category, listings]) => listings.map((listing) => getExploreListingId(listing.name, category)))
    .concat(rideDestinations.map((place) => place.id))
);

export function isExploreListingId(id: string): boolean {
  return exploreListingIds.has(id);
}
