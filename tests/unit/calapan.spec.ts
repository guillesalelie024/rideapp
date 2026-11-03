import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router';
import ExplorePage from '@/views/ExplorePage.vue';
import HomePage from '@/views/HomePage.vue';
import NearMePage from '@/views/NearMePage.vue';
import RestaurantListPage from '@/views/RestaurantListPage.vue';
import WeatherPage from '@/views/WeatherPage.vue';
import {
  CALAPAN_PLACES,
  getCalapanPlaces,
  getDistanceInKilometers,
  isInsideCalapan,
} from '@/data/calapan';
import {
  getRideDestination,
  normalizeDestinationId,
  RIDE_DESTINATIONS,
} from '@/data/destinations';
import {
  createEmptyItinerary,
  getItineraryStops,
  getUntrackedItineraryStops,
  loadItinerary,
  SAVED_ITINERARY_KEY,
  saveItinerary,
} from '@/data/itinerary';
import {
  EXPLORE_CATEGORY_LISTINGS,
  getExploreCategoryListings,
  getExploreListingId,
  getExploreListingLocation,
} from '@/data/exploreListings';
import { CURATED_CAFE_LISTINGS, CURATED_RESTAURANT_LISTINGS } from '@/data/curatedFoodPlaces';

const stubs = {
  IonContent: { template: '<div><slot /></div>' },
  IonIcon: { template: '<span aria-hidden="true"><slot /></span>' },
  IonPage: { template: '<div><slot /></div>' },
};

function calapanWeather() {
  return {
    source: 'Open-Meteo',
    location: 'Calapan City, Oriental Mindoro',
    temperatureC: 29,
    apparentTemperatureC: 33,
    humidityPercent: 75,
    weatherCode: 2,
    windSpeedKmh: 12,
    observedAt: '2026-11-03T08:00',
    rainChancePercent: 30,
    precipitationMm: 0,
  };
}

async function mountWithRouter(
  component: unknown,
  path: string,
  routes: RouteRecordRaw[],
) {
  const router = createRouter({ history: createMemoryHistory(), routes });
  await router.push(path);
  await router.isReady();
  const wrapper = mount(component as never, { global: { plugins: [router], stubs } });
  await flushPromises();
  return { router, wrapper };
}

function baseRoutes(): RouteRecordRaw[] {
  return [
    { path: '/home', name: 'Home', component: HomePage },
    { path: '/explore', name: 'Explore', component: ExplorePage },
    { path: '/near-me', name: 'NearMe', component: NearMePage },
    { path: '/surprise', name: 'SurpriseMe', component: { template: '<div>Surprise</div>' } },
    { path: '/commute', name: 'Commute', component: { template: '<div>Commute</div>' } },
    { path: '/restaurants', name: 'Restaurants', component: RestaurantListPage },
    { path: '/weather', name: 'Weather', component: WeatherPage },
    { path: '/itinerary', name: 'ItineraryPlanner', component: { template: '<div />' } },
    { path: '/trip-summary', name: 'TripSummary', component: { template: '<div />' } },
    { path: '/destinations/:id', name: 'DestinationDetails', component: { template: '<div />' } },
  ];
}

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Calapan guide data', () => {
  test('keeps every curated place inside the Calapan City boundary', () => {
    expect(getCalapanPlaces().map((place) => place.id)).toEqual(CALAPAN_PLACES.map((place) => place.id));
    expect(isInsideCalapan(13.4147715, 121.1803193)).toBe(true);
    expect(isInsideCalapan(13.301, 121.2)).toBe(true);
    expect(isInsideCalapan(13.299, 121.2)).toBe(false);
    expect(isInsideCalapan(13.5, 120.95)).toBe(false);
    expect(isInsideCalapan(Number.NaN, 121.18)).toBe(false);
    expect(getCalapanPlaces().every((place) => (
      place.city === 'Calapan City'
      && place.province === 'Oriental Mindoro'
      && place.country === 'Philippines'
    ))).toBe(true);
  });

  test('calculates straight-line distances in kilometers', () => {
    const [first, second] = CALAPAN_PLACES;
    expect(getDistanceInKilometers(first.latitude, first.longitude, second)).toBeGreaterThanOrEqual(0);
    expect(getDistanceInKilometers(first.latitude, first.longitude, first)).toBeCloseTo(0);
  });

  test('publishes a unique destination catalog with canonical IDs', () => {
    const ids = RIDE_DESTINATIONS.map((place) => place.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain('silonay-mangrove-eco-park');
    expect(getRideDestination('silonay-mangrove-eco-park')?.id).toBe('silonay-mangrove-ecopark');
    expect(normalizeDestinationId('silonay-mangrove-eco-park')).toBe('silonay-mangrove-ecopark');
    expect(normalizeDestinationId('calapan-cathedral')).toBe('calapan-cathedral');
    expect(RIDE_DESTINATIONS.every((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude))).toBe(true);
  });

  test('provides actual destination photos and attribution for recommended places', () => {
    const harkaPiloto = getRideDestination('harka-piloto-fish-sanctuary');
    const naturePark = getRideDestination('calapan-nature-park');

    expect(harkaPiloto?.image).toContain('harka-piloto-island');
    expect(harkaPiloto?.imageCredit).toBe('Patrickroque01');
    expect(harkaPiloto?.imageLicense).toBe('CC BY-SA 4.0');
    expect(harkaPiloto?.imageSourceUrl).toContain('commons.wikimedia.org');
    expect(naturePark?.image).toContain('calapan-nature-park.png');
    expect(naturePark?.imageCredit).toBeUndefined();
  });

  test('uses the supplied photos for the matching Calapan destinations', () => {
    expect(getRideDestination('calapan-nature-park')?.image).toContain('calapan-nature-park.png');
    expect(getRideDestination('bulusan-nature-park')?.image).toContain('calapan-nature-park.png');
    expect(getRideDestination('jolly-waves-waterpark')?.image).toContain('jolly-waves-waterpark.png');
    expect(getRideDestination('plaza-del-gobernador')?.image).toContain('plaza-del-gobernador.png');
    expect(getRideDestination('oriental-mindoro-heritage-museum')?.image).toContain('oriental-mindoro-heritage-museum-interior.png');
    expect(getRideDestination('mahal-na-pangalan-marine-park')?.image).toContain('mahal-na-pangalan-marine-park.png');
  });

  test('resolves the supplied-photo destinations from their Explore listing names', () => {
    expect(getExploreListingId('Jolly Waves Waterpark and Resort (Sapul)', 'Waterparks')).toBe('jolly-waves-waterpark');
    expect(getExploreListingId('Plaza del Gobernador / Liwasan ng Mamamayan (dancing fountain)', 'Parks & Recreation')).toBe('plaza-del-gobernador');
    expect(getExploreListingId('Mahal na Pangalan Marine Park', 'Tourist Spots')).toBe('mahal-na-pangalan-marine-park');
    expect(getExploreListingId('Bulusan Park', 'Parks & Recreation')).toBe('calapan-nature-park');
  });

  test('shows a verified address, an explicit area hint, or an unverified address', () => {
    expect(getExploreListingLocation({ name: 'Sto. Niño Cathedral' }, 'Churches & Religious Sites')).toEqual({
      label: 'Address',
      value: 'A. Bonifacio Street, Calero, Calapan City, Oriental Mindoro',
    });
    expect(getExploreListingLocation({ name: 'Bulusan Park' }, 'Parks & Recreation')).toEqual({
      label: 'Area',
      value: 'Bulusan, Calapan City, Oriental Mindoro',
    });
    expect(getExploreListingLocation({ name: 'Feraren Hills' }, 'Adventure & Outdoor Activities')).toEqual({
      label: 'Address',
      value: 'Address not verified',
    });
    expect(getExploreListingLocation({ name: 'Thela. Cafe (Lalud)' }, 'Cafés & Coffee Shops')).toEqual({
      label: 'Area',
      value: 'Lalud, Calapan City, Oriental Mindoro',
    });
  });

  test('normalizes itinerary aliases and identifies curated stops without map details', () => {
    const curatedId = getExploreListingId('Feraren Hills', 'Adventure & Outdoor Activities');
    const itinerary = {
      ...createEmptyItinerary(),
      stopIds: ['silonay-mangrove-eco-park', curatedId],
      curatedStops: {
        [curatedId]: { name: 'Feraren Hills', category: 'Adventure & Outdoor Activities' },
      },
      travelerCount: 1,
    };

    saveItinerary(SAVED_ITINERARY_KEY, itinerary);
    const loaded = loadItinerary(SAVED_ITINERARY_KEY);
    expect(loaded?.stopIds).toEqual(['silonay-mangrove-ecopark', curatedId]);
    expect(getItineraryStops(loaded!)[0].id).toBe('silonay-mangrove-ecopark');
    expect(getUntrackedItineraryStops(loaded!).map((stop) => stop.name)).toEqual(['Feraren Hills']);
  });

  test('exposes explore listings with resolvable IDs', () => {
    const groups = getExploreCategoryListings();
    expect(Object.keys(groups).length).toBeGreaterThan(5);
    const listing = groups['Adventure & Outdoor Activities']?.find((item) => item.name === 'Feraren Hills');
    expect(listing).toBeDefined();
    expect(getExploreListingId('Feraren Hills', 'Adventure & Outdoor Activities')).toContain('feraren-hills');
  });
});

describe('ExplorePage.vue', () => {
  test('shows verified photos on listings that previously had no photo', async () => {
    const expectedPhotos = [
      ['Churches & Religious Sites', 'Divine Mercy Parish (Pachoca)', 'divine-mercy-parish.jpg'],
      ['Churches & Religious Sites', 'Sts. Peter and Paul Chaplaincy (Roxas Dr.)', 'sts-peter-paul-chaplaincy.jpg'],
      ['Churches & Religious Sites', 'St. Benedict Chaplaincy (near Tawiran)', 'st-benedict-chaplaincy.jpg'],
      ['Events & Venues', 'Balai Mindoro', 'balai-mindoro.jpg'],
      ['Events & Venues', 'Mahalta Resorts and Convention Center (Parang)', 'mahalta-resort.jpg'],
      ['Events & Venues', 'Cuidad Garden Resort and Conference Center', 'cuidad-garden-resort.jpg'],
      ['Events & Venues', 'Casa Estela Boutique Hotel & Cafe', 'cafe-casa-estela.jpg'],
      ['Farm Tourism', 'Coco Farm Resort (Canubing I)', 'coco-farm-resort.jpg'],
      ['Historical Sites', 'Casa Real Ruins', 'casa-real-ruins.jpg'],
      ['Historical Sites', 'Old City Hall (now the Heritage, Culture, and Arts Building)', 'heritage-culture-arts-building.jpg'],
      ['Hotels & Accommodations', 'Filipiniana Resort & Hotel (Sto. Niño)', 'filipiniana-resort.jpg'],
      ['Hotels & Accommodations', 'Casa Estela Boutique Hotel & Cafe', 'cafe-casa-estela.jpg'],
      ['Hotels & Accommodations', 'Achimie Hotel', 'achimie-hotel.jpg'],
      ['Hotels & Accommodations', "Agua's Hotel", 'aguas-hotel.jpg'],
      ['Hotels & Accommodations', 'HuanYing Hotel (Juan Luna)', 'huanying-hotel.jpg'],
      ['Hotels & Accommodations', 'Cuidad Garden Resort and Conference Center', 'cuidad-garden-resort.jpg'],
      ['Hotels & Accommodations', 'Bulalo Mangrove Inn', 'bulalo-mangrove-inn.jpg'],
      ['Hotels & Accommodations', "4C's Room Rental, Apartment, Hotel and Transient (Jasmin St.)", 'four-c-room-rental.jpg'],
      ['Hotels & Accommodations', 'Golden Paradise Inn', 'golden-paradise-inn.jpg'],
      ['Hotels & Accommodations', 'Burj Calapan (San Vicente)', 'burj-calapan.jpg'],
      ['Hotels & Accommodations', 'Blue Harbor Inn', 'blue-harbor-inn.jpg'],
      ['Islands & Islets', 'Aganhao (Aganhaw) Islet', 'agahao-islet.jpg'],
      ['Islands & Islets', 'Baco-Chico Islets', 'baco-chico-islets.jpg'],
      ['Museums & Heritage', 'Mangyan Heritage Center (Calero and new location in Sto. Niño)', 'mangyan-heritage-center.jpg'],
      ['Museums & Heritage', 'Balai Mindoro (guided tour of crafts)', 'balai-mindoro.jpg'],
      ['Nature & Eco-Tourism', 'Baruyan River and Caluangan Lake', 'caluangan-lake.jpg'],
      ['Public Markets', 'Calapan City Public Market', 'calapan-city-public-market.jpg'],
      ['Public Markets', 'Night market around Calapan City Plaza', 'calapan-night-market.jpg'],
      ['Resorts', 'Mahalta Resorts and Convention Center (Parang)', 'mahalta-resort.jpg'],
      ['Resorts', 'Coco Farm Resort (Canubing I)', 'coco-farm-resort.jpg'],
      ['Resorts', 'Filipiniana Resort & Hotel', 'filipiniana-resort.jpg'],
      ['Shopping Malls', 'Nuciti Central Mall Calapan', 'nuciti-mall.jpg'],
      ['Shopping Malls', 'Citimart Island Mall', 'citimart-island-mall.jpg'],
      ['Shopping Malls', 'CityMall Calapan', 'citymall-calapan.jpg'],
      ['Shopping Malls', 'Xentro Mall Calapan', 'xentro-mall-calapan.jpg'],
      ['Shopping Malls', 'Gaisano Capital Calapan', 'gaisano-capital-calapan.jpg'],
      ['Souvenir Shops', 'Mindoro Souvenir', 'mindoro-souvenir-shop.jpg'],
      ['Tourist Spots', 'Mangyan Heritage Center', 'mangyan-heritage-center.jpg'],
    ] as const;
    const { wrapper } = await mountWithRouter(ExplorePage, '/explore', baseRoutes());

    for (const [category, name, filename] of expectedPhotos) {
      const listing = EXPLORE_CATEGORY_LISTINGS[category]?.find((item) => item.name === name);
      expect(listing?.image, `${name} should map to its verified photo`).toContain(filename);

      const card = wrapper.findAll('.exp-card').find((candidate) =>
        candidate.find('.exp-card-title').text() === name
        && candidate.find('.exp-card-badge').text() === category
      );
      if (!card) throw new Error(`${name} should have an Explore card in ${category}`);
      expect(card.find('img').attributes('src')).toBe(listing.image);
    }
  });

  test('shows a matching photo for every curated cafe listing', async () => {
    const { wrapper } = await mountWithRouter(ExplorePage, '/explore', baseRoutes());
    const cafeCategory = wrapper.findAll('.exp-cat-btn')
      .find((button) => button.text().includes('Cafés & Coffee Shops'));

    if (!cafeCategory) throw new Error('Cafés & Coffee Shops category button was not rendered');
    await cafeCategory.trigger('click');
    await flushPromises();

    for (const cafe of CURATED_CAFE_LISTINGS) {
      const card = wrapper.findAll('.exp-card')
        .find((candidate) => candidate.find('.exp-card-title').text() === cafe.name);
      if (!card) throw new Error(`${cafe.name} should have an Explore card`);
      const image = card.find('img');
      expect(image.exists(), `${cafe.name} should have a photo`).toBe(true);
      expect(image.attributes('src')).toBe(cafe.image);
    }
  });

  test('shows supplied destination photos in matching Explore cards', async () => {
    const { wrapper } = await mountWithRouter(ExplorePage, '/explore', baseRoutes());

    for (const name of [
      'Feraren Hills',
      'Calapan Cable Park (wakeboarding)',
      'Kayaking and river cruise at Baruyan River and Caluangan Lake',
      'Snorkeling at Harka Piloto (Silonay)',
      'Balai Mindoro pickleball courts (Bayanan I)',
      'Lazareto Beach',
      'Parang Beach',
      'Pachoca–Balite Beach',
      'Suqui Beach',
      'Lambingan Beach (San Antonio)',
    ]) {
      const image = wrapper.find(`.exp-card img[alt="${name}"]`);
      expect(image.exists(), `${name} should have its supplied photo`).toBe(true);
      expect(image.attributes('src')).toBeTruthy();
    }

    expect(wrapper.find('.exp-card img[alt="Pools and water slides at Jolly Waves Waterpark in Calapan"]').exists()).toBe(true);
    expect(wrapper.find('.exp-card img[alt="Plaza del Gobernador at sunset in Calapan"]').exists()).toBe(true);
    expect(wrapper.find('.exp-card img[alt="Welcome mural at Mahal na Pangalan Marine Park in Calapan"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Area: Bulusan, Calapan City, Oriental Mindoro');
    expect(wrapper.text()).toContain('Address: Address not verified');
  });

  test('renders real destination photos without photo-credit links', async () => {
    const { wrapper } = await mountWithRouter(ExplorePage, '/explore', baseRoutes());

    expect(wrapper.find('.exp-card-image-credit').exists()).toBe(false);
    expect(wrapper.find('.exp-card img[alt="Harka Piloto Island in Calapan, Oriental Mindoro"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Bulusan Park');
  });

  test('renders categories, search, and routes Near Me and Surprise actions', async () => {
    const { router, wrapper } = await mountWithRouter(ExplorePage, '/explore', baseRoutes());

    expect(wrapper.findAll('.exp-cat-btn').length).toBeGreaterThan(5);
    expect(wrapper.text()).toContain('Near Me');
    expect(wrapper.text()).toContain('Surprise Me');

    await wrapper.get('.exp-search input').setValue('Feraren Hills');
    expect(wrapper.text()).toContain('Feraren Hills');

    await wrapper.get('.exp-search input').setValue('no-such-place-anywhere');
    expect(wrapper.text()).toContain('No destinations found');

    await wrapper.findAll('.exp-quick-btn')[0].trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.name).toBe('NearMe');

    await router.push('/explore');
    await flushPromises();
    await wrapper.findAll('.exp-quick-btn')[1].trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.name).toBe('SurpriseMe');
  });
});

describe('HomePage.vue', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => calapanWeather(),
    }));
  });

  test('shows quick actions, recommendations, and a searchable listing catalog', async () => {
    const { wrapper } = await mountWithRouter(HomePage, '/home', baseRoutes());

    expect(wrapper.findAll('.app-quick-item').map((item) => item.text())).toEqual(
      expect.arrayContaining(['Commute', 'Explore', 'Near Me', 'Surprise']),
    );
    expect(wrapper.findAll('.app-list-card').length).toBeGreaterThan(0);
    expect(wrapper.text()).toContain('Calapan City Plaza');

    await wrapper.get('.app-search input').setValue('Feraren Hills');
    expect(wrapper.text()).toContain('Feraren Hills');
    expect(wrapper.text()).toContain('Address not verified');

    await wrapper.get('.app-search input').setValue('no-such-place-anywhere');
    expect(wrapper.text()).toContain('No results found');
  });

  test('shows real destination photos without photo-credit links in recommendations', async () => {
    const { wrapper } = await mountWithRouter(HomePage, '/home', baseRoutes());

    expect(wrapper.find('.list-image-credit').exists()).toBe(false);
    expect(wrapper.text()).toContain('Bulusan Park');
    expect(wrapper.find('.app-list-card img[alt="Harka Piloto Island in Calapan, Oriental Mindoro"]').exists()).toBe(true);
  });

  test('shows the supplied destination photos in recommendations', async () => {
    const { wrapper } = await mountWithRouter(HomePage, '/home', baseRoutes());

    expect(wrapper.find('.app-list-card img[alt="Pools and water slides at Jolly Waves Waterpark in Calapan"]').exists()).toBe(true);
    expect(wrapper.find('.app-list-card img[alt="Plaza del Gobernador at sunset in Calapan"]').exists()).toBe(true);
  });

  test('opens destination and guidance search results on the details route', async () => {
    const { router, wrapper } = await mountWithRouter(HomePage, '/home', baseRoutes());

    await wrapper.get('.app-search input').setValue('Calapan City Plaza');
    await wrapper.get('.app-search-results button').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.name).toBe('DestinationDetails');
    expect(router.currentRoute.value.params.id).toBeTruthy();

    await router.push('/home');
    await flushPromises();
    await wrapper.get('.app-search input').setValue('Feraren Hills');
    await wrapper.get('.app-search-results button').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.name).toBe('DestinationDetails');
    expect(router.currentRoute.value.query.name).toBe('Feraren Hills');
  });

  test('keeps the weather card visible with fallback data when live weather fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const { wrapper } = await mountWithRouter(HomePage, '/home', baseRoutes());

    const weather = wrapper.get('.app-weather');
    expect(weather.exists()).toBe(true);
    expect(weather.text()).toContain('29');
  });
});

describe('RestaurantListPage.vue', () => {
  test('lists curated food names without inventing menus, ratings, or prices', async () => {
    const { wrapper } = await mountWithRouter(RestaurantListPage, '/restaurants', baseRoutes());
    const first = CURATED_RESTAURANT_LISTINGS[0].name;

    expect(wrapper.text()).toContain(first);
    expect(wrapper.text()).toContain('does not confirm that a business is open');
    expect(wrapper.text()).not.toContain('No verified restaurant listings yet');
    expect(wrapper.text()).not.toContain('ratings, hours, and addresses are not available');

    await wrapper.get('.restaurant-search input').setValue('no-such-food-place');
    expect(wrapper.text()).toContain('No restaurant names match your search');
  });
});

describe('WeatherPage.vue', () => {
  test('shows live conditions and metrics when the API responds', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => calapanWeather(),
    }));
    const { wrapper } = await mountWithRouter(WeatherPage, '/weather', baseRoutes());

    expect(wrapper.text()).toContain('Live');
    expect(wrapper.text()).not.toContain('Sample Data');
    expect(wrapper.text()).toContain('Feels Like');
    expect(wrapper.text()).toContain('Rain Chance');
    expect(wrapper.text()).toContain('Humidity');
  });

  test('labels sample data when live weather fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const { wrapper } = await mountWithRouter(WeatherPage, '/weather', baseRoutes());

    expect(wrapper.text()).toContain('Sample Data');
    expect(wrapper.text()).toContain('Showing sample data');
  });
});

describe('NearMePage.vue', () => {
  test('lists every destination and explains when location is denied', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (_success: unknown, error: (value: { code: number; PERMISSION_DENIED: number }) => void) => {
          error({ code: 1, PERMISSION_DENIED: 1 });
        },
      },
    });

    const { wrapper } = await mountWithRouter(NearMePage, '/near-me', baseRoutes());
    expect(wrapper.findAll('.near-place').length).toBe(RIDE_DESTINATIONS.length);
    expect(wrapper.text()).toContain('Distance available after locating');

    await wrapper.get('.near-locate').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Location permission was denied');
  });
});
