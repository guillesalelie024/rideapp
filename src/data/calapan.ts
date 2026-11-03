export type CalapanPlaceCategory = 'Heritage' | 'Parks' | 'Beaches';

export interface CalapanPlace {
  id: string;
  name: string;
  category: CalapanPlaceCategory;
  description: string;
  address: string;
  city: 'Calapan City';
  province: 'Oriental Mindoro';
  country: 'Philippines';
  latitude: number;
  longitude: number;
  osmUrl: string;
}

type Coordinate = readonly [longitude: number, latitude: number];

export const CALAPAN_CITY = 'Calapan City, Oriental Mindoro';

// OSM relation 15077332; Nominatim polygon_threshold=0.0005 simplification.
const calapanBoundary: readonly Coordinate[] = [
  [121.0978057, 13.4749598],
  [121.1200966, 13.450897],
  [121.1424017, 13.4387278],
  [121.1415756, 13.409037],
  [121.1405636, 13.4064861],
  [121.1362191, 13.4042759],
  [121.1363851, 13.3999715],
  [121.1336037, 13.3975603],
  [121.133256, 13.3962565],
  [121.129237, 13.3962441],
  [121.1284816, 13.3940065],
  [121.1256802, 13.3926774],
  [121.1266412, 13.3903694],
  [121.117022, 13.3890462],
  [121.1181147, 13.3846814],
  [121.1177703, 13.37864],
  [121.1164594, 13.3742032],
  [121.1171246, 13.3713763],
  [121.1193949, 13.3680228],
  [121.1201369, 13.3646051],
  [121.1231805, 13.3616389],
  [121.1249699, 13.3580442],
  [121.1203462, 13.3575752],
  [121.1203576, 13.3539425],
  [121.1161162, 13.3525759],
  [121.1159572, 13.3498552],
  [121.1128708, 13.3516984],
  [121.1113841, 13.3510863],
  [121.1131653, 13.3482465],
  [121.1119449, 13.3471482],
  [121.114271, 13.3457567],
  [121.1144673, 13.3433772],
  [121.1156748, 13.3425028],
  [121.1155779, 13.3401641],
  [121.1165365, 13.3392304],
  [121.1163288, 13.3378943],
  [121.1145856, 13.3370379],
  [121.114296, 13.3360618],
  [121.1156588, 13.3308461],
  [121.1098856, 13.3276558],
  [121.1100535, 13.3262832],
  [121.1128902, 13.3244891],
  [121.1123717, 13.3228021],
  [121.1102393, 13.3234813],
  [121.1084063, 13.3226999],
  [121.10864, 13.3175003],
  [121.1074861, 13.3167846],
  [121.1053464, 13.317807],
  [121.1042072, 13.3168577],
  [121.1047038, 13.3158499],
  [121.103937, 13.3151342],
  [121.1020383, 13.3152291],
  [121.1013518, 13.3144697],
  [121.1028562, 13.3112857],
  [121.1004097, 13.3086201],
  [121.1009721, 13.3067433],
  [121.1004298, 13.3020939],
  [121.1015828, 13.3011326],
  [121.1028622, 13.3014981],
  [121.1041207, 13.3037418],
  [121.1049995, 13.3035059],
  [121.1055601, 13.3020007],
  [121.1052515, 13.3011129],
  [121.1025855, 13.299742],
  [121.2149286, 13.3000919],
  [121.2763103, 13.3371713],
  [121.2774992, 13.3401406],
  [121.28162, 13.345519],
  [121.3016581, 13.3455027],
  [121.3829906, 13.4549612],
  [121.3697389, 13.463521],
  [121.3586782, 13.4704401],
  [121.3566334, 13.4796533],
  [121.3189245, 13.4969299],
  [121.2634782, 13.5166518],
  [121.2605961, 13.5188996],
  [121.2061131, 13.5541532],
  [121.1756494, 13.5627264],
  [121.1693268, 13.5619914],
  [121.1392686, 13.5153686],
  [121.0978057, 13.4749598],
];

export const CALAPAN_PLACES: readonly CalapanPlace[] = [
  {
    id: 'calapan-cathedral',
    name: 'Calapan Cathedral',
    category: 'Heritage',
    description: 'A historic cathedral in Calapan’s city center.',
    address: 'A. Bonifacio Street, Calero, Calapan',
    city: 'Calapan City',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.4147715,
    longitude: 121.1803193,
    osmUrl: 'https://www.openstreetmap.org/way/464536416',
  },
  {
    id: 'calapan-city-plaza',
    name: 'Calapan City Plaza',
    category: 'Parks',
    description: 'A public park on A. Bonifacio Street in central Calapan.',
    address: 'A. Bonifacio Street, Calero, Calapan',
    city: 'Calapan City',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.4146079,
    longitude: 121.1793009,
    osmUrl: 'https://www.openstreetmap.org/way/654388807',
  },
  {
    id: 'bulusan-nature-park',
    name: 'Bulusan Nature Park',
    category: 'Parks',
    description: 'A wooded nature park in Barangay Bulusan, Calapan City.',
    address: 'Bulusan, Calapan City',
    city: 'Calapan City',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.4019902,
    longitude: 121.1995375,
    osmUrl: 'https://www.openstreetmap.org/way/493823918',
  },
  {
    id: 'parang-beach-resort',
    name: 'Parang Beach Resort',
    category: 'Beaches',
    description: 'A beach resort in Parang, Calapan City.',
    address: 'Parang-Suqui Road, Parang, Calapan',
    city: 'Calapan City',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.4136546,
    longitude: 121.2145747,
    osmUrl: 'https://www.openstreetmap.org/node/1806817413',
  },
  {
    id: 'oriental-mindoro-heritage-museum',
    name: 'Oriental Mindoro Heritage Museum',
    category: 'Heritage',
    description:
      'A museum and cultural stop for learning about the history and heritage of Oriental Mindoro. Confirm visiting hours before going.',
    address: 'Calapan City, Oriental Mindoro',
    city: 'Calapan City',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.4165,
    longitude: 121.1802,
    osmUrl:
      'https://www.openstreetmap.org/search?query=Oriental%20Mindoro%20Heritage%20Museum',
  },
  {
    id: 'silonay-mangrove-ecopark',
    name: 'Silonay Mangrove Conservation Ecopark',
    category: 'Parks',
    description:
      'A community mangrove ecopark in Barangay Silonay focused on coastal habitat and environmental conservation. Confirm access before visiting.',
    address: 'Barangay Silonay, Calapan City',
    city: 'Calapan City',
    province: 'Oriental Mindoro',
    country: 'Philippines',
    latitude: 13.4020,
    longitude: 121.2248,
    osmUrl:
      'https://www.openstreetmap.org/search?query=Silonay%20Mangrove%20Conservation%20Ecopark',
  },
];

function isInsideCityBoundary(latitude: number, longitude: number): boolean {
  let isInside = false;

  for (
    let current = 0, previous = calapanBoundary.length - 1;
    current < calapanBoundary.length;
    previous = current, current += 1
  ) {
    const [currentLongitude, currentLatitude] = calapanBoundary[current];
    const [previousLongitude, previousLatitude] = calapanBoundary[previous];
    const crossesLatitude =
      (currentLatitude > latitude) !== (previousLatitude > latitude);
    const crossingLongitude =
      ((previousLongitude - currentLongitude) * (latitude - currentLatitude)) /
        (previousLatitude - currentLatitude) +
      currentLongitude;

    if (crossesLatitude && longitude < crossingLongitude) isInside = !isInside;
  }

  return isInside;
}

export function isInsideCalapan(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    isInsideCityBoundary(latitude, longitude)
  );
}

export function getCalapanPlaces(): CalapanPlace[] {
  return CALAPAN_PLACES.filter((place) =>
    isInsideCalapan(place.latitude, place.longitude),
  );
}

export function getDistanceInKilometers(
  fromLatitude: number,
  fromLongitude: number,
  place: Pick<CalapanPlace, 'latitude' | 'longitude'>,
): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDifference = radians(place.latitude - fromLatitude);
  const longitudeDifference = radians(place.longitude - fromLongitude);
  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(radians(fromLatitude)) *
      Math.cos(radians(place.latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return (
    earthRadiusKm *
    2 *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}
