export type NearbyFoodKind = 'Restaurant' | 'Cafe';

export interface NearbyFoodListing {
  name: string;
  kind: NearbyFoodKind;
  distance: string;
}

type NearbyLists = {
  restaurants: readonly string[];
  cafes: readonly string[];
};

function parseNearbyList(entries: readonly string[], kind: NearbyFoodKind): NearbyFoodListing[] {
  return entries.map((entry) => {
    const [name, distance = ''] = entry.split('|');
    return { name, kind, distance };
  });
}

function nearby(restaurants: readonly string[], cafes: readonly string[]): NearbyFoodListing[] {
  return [
    ...parseNearbyList(restaurants, 'Restaurant'),
    ...parseNearbyList(cafes, 'Cafe'),
  ];
}

const nearbyByPlace: Record<string, NearbyLists> = {
  'feraren hills': {
    restaurants: ['Sutoru Ramen|180 m', 'Red Tomato Modern Italian|230 m', 'Juancios Burgers House|320 m'],
    cafes: ['Cafe Eros|210 m', '2N1 Cafe|230 m', 'Coffee & Bar|370 m'],
  },
  'calapan cable park': {
    restaurants: ['Ambagan Restobar|2.4 km', 'Anahaw Island View Resort restaurant|2.5 km', 'STARBOX KTV Bar & Restaurant|3.1 km'],
    cafes: ['Continentea Cafe|2.9 km', "Sister's Tea & Beverage Bar|3.4 km", 'Thela. Cafe|3.6 km'],
  },
  'baruyan river caluangan lake': {
    restaurants: ['STARBOX KTV|2.5 km', 'Fuxion Restaurant|2.6 km', "Tiger Joe's Cafe|2.7 km"],
    cafes: ['Continentea Cafe|2.4 km', 'Bungkos Bistro|3.2 km', "Sister's Tea & Beverage Bar|3.5 km"],
  },
  '2n1 cafe nag iba ii branch': {
    restaurants: ["Siokoy's Grill|8.1 km", "Arsenia's Hapag Kainan|8.4 km", 'Spice Plates|8.5 km'],
    cafes: ['Delez Cafe|8.3 km', "Clayanna's Cafe|8.6 km", 'Bungkos Bistro|9.3 km'],
  },
  'harka piloto': {
    restaurants: ["Chipping's Express San Antonio|2.8 km", "Siokoy's Grill|3.0 km", 'Bham Sea Foods|3.6 km'],
    cafes: ['Casa Estela Cafe|4.5 km', 'Cafe Meow|4.8 km', "Kamil's Bakeshop|4.9 km"],
  },
  'balai mindoro': {
    restaurants: ["Chipping's Bayanan|390 m", 'Emilyo Steak|940 m', 'Fuxion Restaurant|1.9 km'],
    cafes: ['Bungkos Bistro|inside this place', 'Delez Cafe|1.3 km', 'Continentea Cafe|2.0 km'],
  },
  'lazareto beach': {
    restaurants: ["Chipping's Express San Antonio|920 m", 'Bham Sea Foods|1.6 km', "Siokoy's Grill|2.5 km"],
    cafes: ['Casa Estela Cafe|2.6 km', 'Cafe Meow|2.9 km', "Kamil's Bakeshop|2.9 km"],
  },
  'parang beach': {
    restaurants: ["Siokoy's Grill|390 m", "Chipping's Express San Antonio|1.9 km", 'Bham Sea Foods|2.7 km'],
    cafes: ['Casa Estela Cafe|3.2 km', 'Peaches N Cream Bakeshop|3.4 km', 'Dutch Cafe|3.4 km'],
  },
  'pachoca balite beach': {
    restaurants: ['Anahaw Island View Resort restaurant|330 m', 'Ambagan Restobar|380 m', "Liana's Kitchenette|950 m"],
    cafes: ['Pastel Coffee|1.4 km', 'Auguri|1.6 km', 'add+ coffee|1.7 km'],
  },
  'suqui beach': {
    restaurants: ["Siokoy's Grill|180 m", "Chipping's Express San Antonio|2.1 km", 'Bham Sea Foods|2.9 km'],
    cafes: ['Casa Estela Cafe|3.4 km', 'Peaches N Cream Bakeshop|3.5 km', 'Dutch Cafe|3.6 km'],
  },
  'lambingan beach': {
    restaurants: ["Chipping's Express San Antonio|1.2 km", 'Bham Sea Foods|1.5 km', 'Tubo Kitchenette|2.4 km'],
    cafes: ['Casa Estela Cafe|2.5 km', 'Cafe Meow|2.7 km', "Kamil's Bakeshop|2.7 km"],
  },
  'crystal beach resort': {
    restaurants: ['Anahaw Island View Resort restaurant|360 m', 'Ambagan Restobar|410 m', "Liana's Kitchenette|920 m"],
    cafes: ['Pastel Coffee|1.4 km', 'Auguri|1.6 km', 'add+ coffee|1.6 km'],
  },
  'sto nino cathedral': {
    restaurants: ["Calda Pizza|50 m", "Popoy's Grill House|70 m", "Chipping's JP Rizal|180 m"],
    cafes: ["Kamil's Bakeshop|60 m", 'Cafe Meow|70 m', 'Casa Estela Cafe|370 m'],
  },
  'divine mercy parish': {
    restaurants: ["Liana's Kitchenette|290 m", 'JapChi|810 m', 'Kimchi Food House|860 m'],
    cafes: ['Pastel Coffee|820 m', 'Auguri|1.0 km', 'add+ coffee|1.0 km'],
  },
  'sts peter and paul chaplaincy': {
    restaurants: ['Sutoru Ramen|80 m', 'Red Tomato Modern Italian|150 m', "Dulce's Kitchen|200 m"],
    cafes: ['Cafe Eros|100 m', '2N1 Cafe|140 m', 'Coffee & Bar|240 m'],
  },
  'our lady of fatima chapel': {
    restaurants: ['Spice Plates|940 m', 'Sutoru Ramen|970 m', 'Red Tomato Modern Italian|990 m'],
    cafes: ["Clayanna's Cafe|800 m", 'Thela. Cafe|830 m', "Sister's Tea & Beverage Bar|980 m"],
  },
  'st benedict chaplaincy': {
    restaurants: ["Tiger Joe's Cafe|60 m", 'Fuxion Restaurant|140 m', 'STARBOX KTV|140 m'],
    cafes: ['Continentea Cafe|230 m', "Sister's Tea & Beverage Bar|1.2 km", 'Thela. Cafe|1.3 km'],
  },
  'world mission society church of god': {
    restaurants: ['L & V Restaurant|110 m', 'Mabuhay Panciteria|130 m', "Chipping's JP Rizal|260 m"],
    cafes: ['Cakes By Leen|50 m', 'La Aroma Cafe|100 m', "Kamil's Bakeshop|390 m"],
  },
  'calapan bay hotel': {
    restaurants: ["Chipping's Express San Antonio|470 m", 'Bham Sea Foods|560 m', 'Tubo Kitchenette|1.5 km'],
    cafes: ['Casa Estela Cafe|1.5 km', 'Cafe Meow|1.8 km', "Kamil's Bakeshop|1.8 km"],
  },
  'czeascape beach resort': {
    restaurants: ['Anahaw Island View Resort restaurant|210 m', 'Ambagan Restobar|250 m', "Liana's Kitchenette|1.0 km"],
    cafes: ['Pastel Coffee|1.6 km', 'Auguri|1.8 km', 'add+ coffee|1.8 km'],
  },
  'villagueda events place': {
    restaurants: ["Arsenia's Hapag Kainan|3.5 km", 'Emilyo Steak|6.5 km', "Chipping's Bayanan|7.6 km"],
    cafes: ['Bungkos Bistro|7.3 km', 'Delez Cafe|8.0 km', 'Continentea Cafe|9.2 km'],
  },
  'villa marina': {
    restaurants: ["Siokoy's Grill|850 m", "Chipping's Express San Antonio|2.9 km", 'Liblib sa Bundok|3.3 km'],
    cafes: ['Peaches N Cream Bakeshop|3.7 km', 'Dutch Cafe|3.7 km', 'Coffee & Bar|3.8 km'],
  },
  'mahalta resorts and convention center': {
    restaurants: ["Siokoy's Grill|610 m", "Chipping's Express San Antonio|1.6 km", 'Bham Sea Foods|2.5 km'],
    cafes: ['Casa Estela Cafe|3.1 km', 'Peaches N Cream Bakeshop|3.3 km', 'Dutch Cafe|3.3 km'],
  },
  'cuidad garden resort and conference center': {
    restaurants: ["Liana's Kitchenette|350 m", 'Kimchi Food House|470 m', 'JapChi|500 m'],
    cafes: ['Pastel Coffee|550 m', 'Auguri|790 m', 'add+ coffee|810 m'],
  },
  'casa estela boutique hotel cafe': {
    restaurants: ['Tubo Kitchenette|80 m', "Popoy's Grill House|330 m", 'Calda Pizza|330 m'],
    cafes: ['Cafe Meow|330 m', "Kamil's Bakeshop|360 m", 'La Aroma Cafe|540 m'],
  },
  'coco farm resort': {
    restaurants: ['Emilyo Steak|3.2 km', "Chipping's Bayanan|3.4 km", "Arsenia's Hapag Kainan|4.5 km"],
    cafes: ['Bungkos Bistro|3.4 km', 'Continentea Cafe|4.5 km', 'Delez Cafe|4.6 km'],
  },
  'arsenias hapag kainan sa kabukiran': {
    restaurants: ['Emilyo Steak|3.5 km', "Chipping's Bayanan|4.8 km", 'Spice Plates|6.0 km'],
    cafes: ['Bungkos Bistro|4.4 km', 'Delez Cafe|4.8 km', "Clayanna's Cafe|6.1 km"],
  },
  'amaliso farm resort': {
    restaurants: ["Arsenia's Hapag Kainan|3.1 km", 'Emilyo Steak|4.8 km', "Chipping's Bayanan|5.9 km"],
    cafes: ['Delez Cafe|5.2 km', '2n1 Cafe Nag-iba II|5.3 km', 'Bungkos Bistro|5.6 km'],
  },
  'il lago fdj farm': {
    restaurants: ["Chipping's Bayanan|2.5 km", 'STARBOX KTV|3.0 km', 'Fuxion Restaurant|3.1 km'],
    cafes: ['Bungkos Bistro|2.7 km', 'Continentea Cafe|3.0 km', 'Delez Cafe|3.9 km'],
  },
  'calapan city plaza': {
    restaurants: ['Theddis Burger|100 m', 'Calda Pizza|190 m', "Popoy's Grill House|210 m"],
    cafes: ["Kamil's Bakeshop|180 m", 'Cafe Meow|210 m', 'Cakes By Leen|410 m'],
  },
  'casa real ruins': {
    restaurants: ['Calda Pizza|70 m', "Popoy's Grill House|120 m", 'Theddis Burger|160 m'],
    cafes: ["Kamil's Bakeshop|110 m", 'Cafe Meow|120 m', 'Casa Estela Cafe|400 m'],
  },
  'old city hall': {
    restaurants: ['Theddis Burger|160 m', "Chipping's JP Rizal|170 m", "Popoy's Grill House|180 m"],
    cafes: ["Kamil's Bakeshop|150 m", 'Cafe Meow|180 m', 'Cakes By Leen|350 m'],
  },
  'calapan tamaraw welcome arch': {
    restaurants: ["Arsenia's Hapag Kainan|4.9 km", 'Emilyo Steak|8.0 km', "Chipping's Bayanan|9.3 km"],
    cafes: ['2n1 Cafe Nag-iba II|7.3 km', 'Delez Cafe|8.9 km', 'Bungkos Bistro|8.9 km'],
  },
  'filipiniana resort hotel': {
    restaurants: ["Monkey's Resto|60 m", 'Daisuke Na Aji|80 m', "Auntie Lola's|90 m"],
    cafes: ['Peaches N Cream Bakeshop|30 m', 'Dutch Cafe|80 m', 'Coffee & Bar|100 m'],
  },
  'casa alberto': {
    restaurants: ["Angel's Pizza|60 m", 'JapChi|270 m', 'Kimchi Food House|490 m'],
    cafes: ['Auguri|70 m', 'sip coffee|100 m', 'add+ coffee|110 m'],
  },
  'blue harbor hotel': {
    restaurants: ["Chipping's Express San Antonio|500 m", 'Bham Sea Foods|570 m', 'Tubo Kitchenette|1.5 km'],
    cafes: ['Casa Estela Cafe|1.5 km', 'Cafe Meow|1.8 km', "Kamil's Bakeshop|1.8 km"],
  },
  'achimie hotel': {
    restaurants: ['L & V Restaurant|60 m', 'Mabuhay Panciteria|70 m', "Chipping's JP Rizal|160 m"],
    cafes: ['Cakes By Leen|60 m', 'La Aroma Cafe|100 m', "Kamil's Bakeshop|290 m"],
  },
  'destinys place hotel inn': {
    restaurants: ["Dulce's Kitchen|100 m", 'Sutoru Ramen|120 m', 'Greenwich Xentro|120 m'],
    cafes: ['Cafe Eros|110 m', 'Coffee & Bar|140 m', '2N1 Cafe|150 m'],
  },
  'huanying hotel': {
    restaurants: ['Ichiban Calapan|80 m', 'Mabuhay Panciteria|190 m', 'Kimchi Food House|220 m'],
    cafes: ['Cakes By Leen|280 m', "Kamil's Bakeshop|310 m", 'La Aroma Cafe|340 m'],
  },
  'nikitas place hotel': {
    restaurants: ["Tiger Joe's Cafe|50 m", 'Fuxion Restaurant|140 m', 'STARBOX KTV|150 m'],
    cafes: ['Continentea Cafe|230 m', "Sister's Tea & Beverage Bar|1.2 km", 'Thela. Cafe|1.3 km'],
  },
  'bulalo mangrove inn': {
    restaurants: ['Ambagan Restobar|1.2 km', 'Anahaw Island View Resort restaurant|1.2 km', "Liana's Kitchenette|1.5 km"],
    cafes: ["Sister's Tea & Beverage Bar|1.8 km", 'Continentea Cafe|2.0 km', 'Thela. Cafe|2.0 km'],
  },
  '4cs room rental apartment hotel and transient': {
    restaurants: ['STARBOX KTV|40 m', 'Fuxion Restaurant|90 m', "Tiger Joe's Cafe|210 m"],
    cafes: ['Continentea Cafe|120 m', "Sister's Tea & Beverage Bar|1.4 km", 'Thela. Cafe|1.5 km'],
  },
  'golden paradise inn': {
    restaurants: ["Liana's Kitchenette|450 m", 'Kimchi Food House|680 m', 'Ichiban Calapan|720 m'],
    cafes: ['Pastel Coffee|780 m', 'Auguri|1.0 km', 'Cakes By Leen|1.0 km'],
  },
  'calapan hotel house': {
    restaurants: ['Ten 2 One Restobar|200 m', "Uncle Jov's|240 m", 'Greenwich Xentro|300 m'],
    cafes: ['Peaches N Cream Bakeshop|370 m', 'Coffee & Bar|380 m', 'Dutch Cafe|450 m'],
  },
  'calapan city house transient rental': {
    restaurants: ['Ten 2 One Restobar|510 m', "Uncle Jov's|550 m", 'Greenwich Xentro|590 m'],
    cafes: ['Coffee & Bar|670 m', 'Peaches N Cream Bakeshop|690 m', 'Cafe Eros|710 m'],
  },
  'calapan city transient house blk 52 lot 41': {
    restaurants: ['Ten 2 One Restobar|190 m', "Uncle Jov's|230 m", 'Greenwich Xentro|290 m'],
    cafes: ['Peaches N Cream Bakeshop|360 m', 'Coffee & Bar|370 m', 'Dutch Cafe|440 m'],
  },
  'calapan city transient house staycation hotel': {
    restaurants: ['Ten 2 One Restobar|560 m', "Uncle Jov's|600 m", 'Greenwich Xentro|650 m'],
    cafes: ['Coffee & Bar|730 m', 'Peaches N Cream Bakeshop|730 m', 'Cafe Eros|770 m'],
  },
  'calapan mindoro transient apartments villa arce': {
    restaurants: ["Chipping's Express San Antonio|1.1 km", "Siokoy's Grill|1.2 km", 'Bham Sea Foods|1.9 km'],
    cafes: ['Casa Estela Cafe|2.5 km', 'Cafe Meow|2.9 km', 'Peaches N Cream Bakeshop|2.9 km'],
  },
  'calapan cheapest house transient': {
    restaurants: ['Ten 2 One Restobar|310 m', "Uncle Jov's|340 m", 'Greenwich Xentro|390 m'],
    cafes: ['Coffee & Bar|470 m', 'Peaches N Cream Bakeshop|480 m', 'Cafe Eros|530 m'],
  },
  'burj calapan': {
    restaurants: ['L & V Restaurant|80 m', 'Mabuhay Panciteria|200 m', "Chipping's JP Rizal|220 m"],
    cafes: ['La Aroma Cafe|50 m', 'Cakes By Leen|120 m', "Kamil's Bakeshop|320 m"],
  },
  'silonay island islet': {
    restaurants: ["Siokoy's Grill|1.6 km", "Chipping's Express San Antonio|3.7 km", 'Liblib sa Bundok|4.1 km'],
    cafes: ['Peaches N Cream Bakeshop|4.4 km', 'Dutch Cafe|4.5 km', 'Coffee & Bar|4.5 km'],
  },
  'aganhao islet': {
    restaurants: ["Siokoy's Grill|1.6 km", "Chipping's Express San Antonio|3.7 km", 'Liblib sa Bundok|4.1 km'],
    cafes: ['Peaches N Cream Bakeshop|4.4 km', 'Dutch Cafe|4.5 km', 'Coffee & Bar|4.5 km'],
  },
  'baco chico islets': {
    restaurants: ["Chipping's Express San Antonio|500 m", 'Bham Sea Foods|570 m', 'Tubo Kitchenette|1.5 km'],
    cafes: ['Casa Estela Cafe|1.5 km', 'Cafe Meow|1.8 km', "Kamil's Bakeshop|1.8 km"],
  },
  'harka piloto fish sanctuary': {
    restaurants: ["Chipping's Express San Antonio|2.8 km", 'Siokoy’s Grill|3.0 km', 'Bham Sea Foods|3.6 km'],
    cafes: ['Casa Estela Cafe|4.5 km', 'Cafe Meow|4.8 km', "Kamil's Bakeshop|4.9 km"],
  },
  'oriental mindoro heritage museum': {
    restaurants: ['Calda Pizza|70 m', "Popoy's Grill House|120 m", 'Theddis Burger|160 m'],
    cafes: ["Kamil's Bakeshop|110 m", 'Cafe Meow|120 m', 'Casa Estela Cafe|400 m'],
  },
  'calapan city heritage culture arts building': {
    restaurants: ['Theddis Burger|160 m', "Chipping's JP Rizal|170 m", "Popoy's Grill House|180 m"],
    cafes: ["Kamil's Bakeshop|150 m", 'Cafe Meow|180 m', 'Cakes By Leen|350 m'],
  },
  'mangyan heritage center': {
    restaurants: ['Theddis Burger|90 m', 'Calda Pizza|220 m', "Popoy's Grill House|240 m"],
    cafes: ["Kamil's Bakeshop|210 m", 'Cafe Meow|240 m', 'Cakes By Leen|420 m'],
  },
  'silonay mangrove conservation ecopark': {
    restaurants: ["Siokoy's Grill|1.6 km", "Chipping's Express San Antonio|3.7 km", 'Liblib sa Bundok|4.1 km'],
    cafes: ['Peaches N Cream Bakeshop|4.4 km', 'Dutch Cafe|4.5 km', 'Coffee & Bar|4.5 km'],
  },
  'calapan nature park': {
    restaurants: ['Liblib sa Bundok|1.4 km', 'Ten 2 One Restobar|1.6 km', "Uncle Jov's|1.6 km"],
    cafes: ['Peaches N Cream Bakeshop|1.7 km', 'Dutch Cafe|1.8 km', 'Coffee & Bar|1.8 km'],
  },
  'silonay navotas maidlang marshes': {
    restaurants: ["Siokoy's Grill|1.6 km", "Chipping's Express San Antonio|3.7 km", 'Liblib sa Bundok|4.1 km'],
    cafes: ['Peaches N Cream Bakeshop|4.4 km', 'Dutch Cafe|4.5 km', 'Coffee & Bar|4.5 km'],
  },
  'plaza del gobernador liwasan ng mamamayan': {
    restaurants: ["Angel's Pizza|190 m", 'Juancios Burgers House|460 m', 'JapChi|520 m'],
    cafes: ['sip coffee|160 m', 'add+ coffee|170 m', 'Auguri|190 m'],
  },
  'kalap civic park': {
    restaurants: ['Spice Plates|810 m', "Chipping's Bayanan|2.1 km", 'Fuxion Restaurant|2.3 km'],
    cafes: ['Delez Cafe|700 m', "Clayanna's Cafe|960 m", 'Bungkos Bistro|2.0 km'],
  },
  'minsu calapan campus manmade lake and development park': {
    restaurants: ['STARBOX KTV|410 m', 'Fuxion Restaurant|430 m', "Tiger Joe's Cafe|590 m"],
    cafes: ['Continentea Cafe|340 m', "Sister's Tea & Beverage Bar|1.8 km", 'Bungkos Bistro|1.8 km'],
  },
  'calapan city public market': {
    restaurants: ["Chipping's JP Rizal|100 m", 'Mabuhay Panciteria|190 m', "Popoy's Grill House|200 m"],
    cafes: ["Kamil's Bakeshop|160 m", 'Cafe Meow|200 m', 'Cakes By Leen|250 m'],
  },
  'night market calapan city plaza': {
    restaurants: ['Theddis Burger|100 m', 'Calda Pizza|190 m', "Popoy's Grill House|210 m"],
    cafes: ["Kamil's Bakeshop|180 m", 'Cafe Meow|210 m', 'Cakes By Leen|410 m'],
  },
  'anahaw island view resort': {
    restaurants: ['Ambagan Restobar|50 m', "Liana's Kitchenette|1.2 km", 'Kimchi Food House|1.7 km'],
    cafes: ['Pastel Coffee|1.8 km', 'Auguri|2.0 km', 'add+ coffee|2.0 km'],
  },
  'playa ignacio resort': {
    restaurants: ["Liana's Kitchenette|530 m", 'Kimchi Food House|770 m', 'Ichiban Calapan|790 m'],
    cafes: ['Pastel Coffee|880 m', 'Cakes By Leen|1.1 km', 'Auguri|1.1 km'],
  },
  'el pueblo rhizort': {
    restaurants: ['Ambagan Restobar|1.0 km', 'Anahaw Island View Resort restaurant|1.0 km', "Liana's Kitchenette|1.8 km"],
    cafes: ["Sister's Tea & Beverage Bar|2.2 km", 'Pastel Coffee|2.3 km', 'add+ coffee|2.4 km'],
  },
  'eduardos resort': {
    restaurants: ['Emilyo Steak|640 m', "Chipping's Bayanan|1.9 km", "Arsenia's Hapag Kainan|2.8 km"],
    cafes: ['Bungkos Bistro|1.6 km', 'Delez Cafe|2.2 km', "Clayanna's Cafe|3.4 km"],
  },
  'la estancia resort': {
    restaurants: ['Emilyo Steak|1.0 km', "Chipping's Bayanan|2.3 km", "Arsenia's Hapag Kainan|2.4 km"],
    cafes: ['Bungkos Bistro|2.0 km', 'Delez Cafe|2.5 km', "Clayanna's Cafe|3.8 km"],
  },
  'el huerto private resort': {
    restaurants: ["Arsenia's Hapag Kainan|2.9 km", 'Emilyo Steak|3.7 km', "Chipping's Bayanan|4.5 km"],
    cafes: ['Bungkos Bistro|4.3 km', 'Delez Cafe|5.3 km', 'Continentea Cafe|6.0 km'],
  },
  'everland lake resort': {
    restaurants: ['STARBOX KTV|2.4 km', 'Fuxion Restaurant|2.5 km', "Tiger Joe's Cafe|2.5 km"],
    cafes: ['Continentea Cafe|2.3 km', "Sister's Tea & Beverage Bar|3.3 km", 'Bungkos Bistro|3.4 km'],
  },
  'eden lakeview resort': {
    restaurants: ['STARBOX KTV|2.8 km', 'Fuxion Restaurant|2.8 km', "Chipping's Bayanan|2.8 km"],
    cafes: ['Continentea Cafe|2.6 km', 'Bungkos Bistro|3.1 km', "Sister's Tea & Beverage Bar|3.9 km"],
  },
  'inays place resort': {
    restaurants: ["Arsenia's Hapag Kainan|2.2 km", 'Emilyo Steak|5.6 km', "Chipping's Bayanan|6.8 km"],
    cafes: ['Bungkos Bistro|6.5 km', 'Delez Cafe|7.0 km', "Clayanna's Cafe|8.3 km"],
  },
  'calapan bayside resort': {
    restaurants: ["Siokoy's Grill|530 m", "Chipping's Express San Antonio|1.7 km", 'Bham Sea Foods|2.6 km'],
    cafes: ['Casa Estela Cafe|3.1 km', 'Peaches N Cream Bakeshop|3.3 km', 'Dutch Cafe|3.3 km'],
  },
  'jolly waves waterpark and resort': {
    restaurants: ['Emilyo Steak|2.6 km', 'Spice Plates|2.9 km', "Chipping's Bayanan|3.3 km"],
    cafes: ['Delez Cafe|2.2 km', 'Bungkos Bistro|3.0 km', "Clayanna's Cafe|3.1 km"],
  },
  'nuciti central mall': {
    restaurants: ["Angel's Pizza|inside this place", 'JapChi|330 m', 'Kimchi Food House|540 m'],
    cafes: ['sip coffee|40 m', 'Auguri|40 m', 'add+ coffee|70 m'],
  },
  'citimart island mall': {
    restaurants: ["Chipping's JP Rizal|30 m", 'Mabuhay Panciteria|170 m', 'L & V Restaurant|170 m'],
    cafes: ["Kamil's Bakeshop|140 m", 'Cafe Meow|170 m', 'Cakes By Leen|210 m'],
  },
  'citymall calapan': {
    restaurants: ['Tubo Kitchenette|90 m', "Chipping's Sto. Niño|390 m", "Popoy's Grill House|400 m"],
    cafes: ['Casa Estela Cafe|130 m', 'Cafe Meow|400 m', "Kamil's Bakeshop|430 m"],
  },
  'xentro mall calapan': {
    restaurants: ["Uncle Jov's|30 m", 'Greenwich|inside this place', 'Ten 2 One Restobar|70 m'],
    cafes: ['Coffee & Bar|120 m', 'Peaches N Cream Bakeshop|150 m', 'Dutch Cafe|210 m'],
  },
  'gaisano capital calapan': {
    restaurants: ["Tiger Joe's Cafe|200 m", 'Fuxion Restaurant|380 m', 'STARBOX KTV|380 m'],
    cafes: ['Continentea Cafe|430 m', "Sister's Tea & Beverage Bar|1.0 km", 'Thela. Cafe|1.1 km'],
  },
  'merls native delicacies': {
    restaurants: ["Auntie Lola's|10 m", "Dulce's Kitchen|50 m", 'Greenwich Xentro|70 m'],
    cafes: ['Coffee & Bar|10 m', 'Peaches N Cream Bakeshop|130 m', 'Dutch Cafe|160 m'],
  },
  'small creation souvenirs': {
    restaurants: ['L & V Restaurant|160 m', 'Mabuhay Panciteria|200 m', "Chipping's JP Rizal|320 m"],
    cafes: ['Cakes By Leen|120 m', 'La Aroma Cafe|130 m', "Kamil's Bakeshop|440 m"],
  },
  anikanik: {
    restaurants: ['JapChi|250 m', 'Mabuhay Panciteria|250 m', 'Kimchi Food House|290 m'],
    cafes: ['Cakes By Leen|240 m', 'Pastel Coffee|270 m', 'La Aroma Cafe|290 m'],
  },
  'mindoro souvenir': {
    restaurants: ["Chipping's Express San Antonio|690 m", 'Bham Sea Foods|900 m', 'Tubo Kitchenette|1.9 km'],
    cafes: ['Casa Estela Cafe|1.9 km', 'Cafe Meow|2.1 km', "Kamil's Bakeshop|2.2 km"],
  },
  'sip coffee': {
    restaurants: ["Angel's Pizza|40 m", 'JapChi|360 m', 'Kimchi Food House|580 m'],
    cafes: ['Auguri|40 m', 'add+ coffee|40 m', 'Pastel Coffee|290 m'],
  },
  'pastel coffee': {
    restaurants: ['JapChi|80 m', "Angel's Pizza|260 m", 'Kimchi Food House|320 m'],
    cafes: ['Auguri|260 m', 'sip coffee|290 m', 'add+ coffee|290 m'],
  },
  'clayannas cafe': {
    restaurants: ['Spice Plates|190 m', "Tiger Joe's Cafe|1.6 km", 'Fuxion Restaurant|1.6 km'],
    cafes: ['Delez Cafe|1.3 km', 'Thela. Cafe|1.6 km', 'Cafe Eros|1.7 km'],
  },
  'thela cafe': {
    restaurants: ['Bashiru Japanese Restaurant|350 m', "Chipping's Lechon|380 m", 'Juancios Burgers House|780 m'],
    cafes: ["Sister's Tea & Beverage Bar|200 m", 'add+ coffee|750 m', 'sip coffee|770 m'],
  },
  'cafe eros': {
    restaurants: ['Sutoru Ramen|30 m', 'Red Tomato Modern Italian|60 m', "Dulce's Kitchen|140 m"],
    cafes: ['2N1 Cafe|40 m', 'Coffee & Bar|180 m', 'Quatro Bella Cafe|190 m'],
  },
  'dutch cafe': {
    restaurants: ['Daisuke Na Aji|next door', "Monkey's Resto|120 m", "Auntie Lola's|140 m"],
    cafes: ['Peaches N Cream Bakeshop|70 m', 'Coffee & Bar|160 m', 'Quatro Bella Cafe|270 m'],
  },
  auguri: {
    restaurants: ["Angel's Pizza|40 m", 'JapChi|340 m', 'Kimchi Food House|560 m'],
    cafes: ['add+ coffee|30 m', 'sip coffee|40 m', 'Pastel Coffee|260 m'],
  },
  'casa estela cafe': {
    restaurants: ['Tubo Kitchenette|80 m', "Popoy's Grill House|330 m", 'Calda Pizza|330 m'],
    cafes: ['Cafe Meow|330 m', "Kamil's Bakeshop|360 m", 'La Aroma Cafe|540 m'],
  },
  'bungkos bistro': {
    restaurants: ["Chipping's Bayanan|370 m", 'Emilyo Steak|960 m', 'Fuxion Restaurant|1.9 km'],
    cafes: ['Delez Cafe|1.3 km', 'Continentea Cafe|2.0 km', "Clayanna's Cafe|2.2 km"],
  },
  '2n1 cafe': {
    restaurants: ['Red Tomato Modern Italian|30 m', 'Sutoru Ramen|70 m', "Dulce's Kitchen|150 m"],
    cafes: ['Cafe Eros|40 m', 'Quatro Bella Cafe|150 m', 'Coffee & Bar|190 m'],
  },
  'add coffee': {
    restaurants: ["Angel's Pizza|70 m", 'JapChi|370 m', 'Bashiru Japanese Restaurant|560 m'],
    cafes: ['Auguri|30 m', 'sip coffee|40 m', 'Pastel Coffee|290 m'],
  },
  'la aroma cafe and restaurant': {
    restaurants: ['L & V Restaurant|50 m', 'Mabuhay Panciteria|160 m', "Chipping's JP Rizal|200 m"],
    cafes: ['Cakes By Leen|70 m', "Kamil's Bakeshop|320 m", 'Cafe Meow|330 m'],
  },
  'delez cafe': {
    restaurants: ['Spice Plates|1.2 km', "Chipping's Bayanan|1.4 km", 'Emilyo Steak|1.7 km'],
    cafes: ["Clayanna's Cafe|1.3 km", 'Bungkos Bistro|1.3 km', 'Continentea Cafe|2.2 km'],
  },
  'continentea cafe': {
    restaurants: ['STARBOX KTV|160 m', 'Fuxion Restaurant|210 m', "Tiger Joe's Cafe|290 m"],
    cafes: ["Sister's Tea & Beverage Bar|1.4 km", 'Thela. Cafe|1.5 km', "Clayanna's Cafe|1.8 km"],
  },
  'coffee and bar': {
    restaurants: ["Auntie Lola's|20 m", "Dulce's Kitchen|50 m", 'Greenwich Xentro|80 m'],
    cafes: ['Peaches N Cream Bakeshop|140 m', 'Dutch Cafe|160 m', 'Cafe Eros|180 m'],
  },
  'cafe meow': {
    restaurants: ["Popoy's Grill House|next door", 'Calda Pizza|80 m', "Chipping's JP Rizal|150 m"],
    cafes: ["Kamil's Bakeshop|40 m", 'Casa Estela Cafe|330 m', 'La Aroma Cafe|330 m'],
  },
  'sisters tea beverage bar': {
    restaurants: ['Bashiru Japanese Restaurant|280 m', "Chipping's Lechon|290 m", "Angel's Pizza|870 m"],
    cafes: ['Thela. Cafe|200 m', 'add+ coffee|810 m', 'sip coffee|830 m'],
  },
  'quatro bella cafe': {
    restaurants: ['Juancios Burgers House|130 m', 'Red Tomato Modern Italian|150 m', "Dulce's Kitchen|200 m"],
    cafes: ['2N1 Cafe|150 m', 'Cafe Eros|190 m', 'Coffee & Bar|220 m'],
  },
  'peaches n cream bakeshop': {
    restaurants: ["Monkey's Resto|50 m", 'Daisuke Na Aji|70 m', "Auntie Lola's|120 m"],
    cafes: ['Dutch Cafe|70 m', 'Coffee & Bar|140 m', 'Quatro Bella Cafe|310 m'],
  },
  'kamils food bakeshop': {
    restaurants: ["Popoy's Grill House|40 m", 'Calda Pizza|90 m', "Chipping's JP Rizal|130 m"],
    cafes: ['Cafe Meow|40 m', 'La Aroma Cafe|320 m', 'Cakes By Leen|340 m'],
  },
  'cakes by leen': {
    restaurants: ['L & V Restaurant|60 m', 'Mabuhay Panciteria|100 m', "Chipping's JP Rizal|210 m"],
    cafes: ['La Aroma Cafe|70 m', "Kamil's Bakeshop|340 m", 'Cafe Meow|360 m'],
  },
  'monkeys resto': {
    restaurants: ["Uncle Jov's|100 m", 'Daisuke Na Aji|120 m', 'Ten 2 One Restobar|130 m'],
    cafes: ['Peaches N Cream Bakeshop|50 m', 'Dutch Cafe|120 m', 'Coffee & Bar|150 m'],
  },
  'auntie lolas restaurant': {
    restaurants: ["Dulce's Kitchen|60 m", 'Greenwich Xentro|80 m', "Monkey's Resto|130 m"],
    cafes: ['Coffee & Bar|20 m', 'Peaches N Cream Bakeshop|120 m', 'Dutch Cafe|140 m'],
  },
  'fuxion restaurant': {
    restaurants: ['STARBOX KTV|50 m', "Tiger Joe's Cafe|180 m", "Chipping's Bayanan|1.6 km"],
    cafes: ['Continentea Cafe|210 m', "Sister's Tea & Beverage Bar|1.4 km", 'Thela. Cafe|1.5 km'],
  },
  'l and v restaurant': {
    restaurants: ['Mabuhay Panciteria|120 m', "Chipping's JP Rizal|170 m", "Popoy's Grill House|300 m"],
    cafes: ['La Aroma Cafe|50 m', 'Cakes By Leen|60 m', "Kamil's Bakeshop|290 m"],
  },
  'perks seafoods house': {
    restaurants: ['Daisuke Na Aji|150 m', "Monkey's Resto|200 m", "Auntie Lola's|280 m"],
    cafes: ['Dutch Cafe|150 m', 'Peaches N Cream Bakeshop|170 m', 'Coffee & Bar|300 m'],
  },
  'bham sea foods': {
    restaurants: ["Chipping's Express San Antonio|950 m", 'Tubo Kitchenette|960 m', 'Calda Pizza|1.2 km'],
    cafes: ['Casa Estela Cafe|980 m', 'Cafe Meow|1.2 km', "Kamil's Bakeshop|1.3 km"],
  },
  'siokoys grill and restaurant': {
    restaurants: ["Chipping's Express San Antonio|2.2 km", 'Bham Sea Foods|3.0 km', 'Liblib sa Bundok|3.2 km'],
    cafes: ['Casa Estela Cafe|3.5 km', 'Peaches N Cream Bakeshop|3.6 km', 'Dutch Cafe|3.7 km'],
  },
  'popoys grill house': {
    restaurants: ['Calda Pizza|80 m', "Chipping's JP Rizal|150 m", 'Theddis Burger|270 m'],
    cafes: ['Cafe Meow|next door', "Kamil's Bakeshop|40 m", 'Casa Estela Cafe|330 m'],
  },
  'chippings sto nino': {
    restaurants: ['Xeon Winghouse|80 m', 'L & V Restaurant|400 m', 'Perks Seafoods House|470 m'],
    cafes: ['La Aroma Cafe|360 m', 'Cakes By Leen|440 m', 'Casa Estela Cafe|500 m'],
  },
  'chippings bayanan': {
    restaurants: ['Emilyo Steak|1.3 km', 'Fuxion Restaurant|1.6 km', 'STARBOX KTV|1.6 km'],
    cafes: ['Bungkos Bistro|370 m', 'Delez Cafe|1.4 km', 'Continentea Cafe|1.7 km'],
  },
  'chippings jp rizal': {
    restaurants: ["Popoy's Grill House|150 m", 'L & V Restaurant|170 m', 'Mabuhay Panciteria|180 m'],
    cafes: ["Kamil's Bakeshop|130 m", 'Cafe Meow|150 m', 'La Aroma Cafe|200 m'],
  },
  'chippings express san antonio': {
    restaurants: ['Bham Sea Foods|950 m', 'Tubo Kitchenette|1.8 km', 'Calda Pizza|2.1 km'],
    cafes: ['Casa Estela Cafe|1.8 km', 'Cafe Meow|2.1 km', "Kamil's Bakeshop|2.2 km"],
  },
  'chippings lechon': {
    restaurants: ['Bashiru Japanese Restaurant|50 m', "Angel's Pizza|660 m", "Liana's Kitchenette|800 m"],
    cafes: ["Sister's Tea & Beverage Bar|290 m", 'Thela. Cafe|380 m', 'add+ coffee|590 m'],
  },
  'mabuhay panciteria': {
    restaurants: ['L & V Restaurant|120 m', "Chipping's JP Rizal|180 m", 'Ichiban Calapan|260 m'],
    cafes: ['Cakes By Leen|100 m', 'La Aroma Cafe|160 m', "Kamil's Bakeshop|310 m"],
  },
  'dulces kitchen': {
    restaurants: ["Auntie Lola's|60 m", 'Greenwich Xentro|100 m', 'Sutoru Ramen|160 m'],
    cafes: ['Coffee & Bar|50 m', 'Cafe Eros|140 m', '2N1 Cafe|150 m'],
  },
  'emilyo steak': {
    restaurants: ["Chipping's Bayanan|1.3 km", 'Spice Plates|2.8 km', 'Fuxion Restaurant|2.9 km'],
    cafes: ['Bungkos Bistro|960 m', 'Delez Cafe|1.7 km', "Clayanna's Cafe|2.9 km"],
  },
  'uncle jovs': {
    restaurants: ['Ten 2 One Restobar|40 m', 'Greenwich Xentro|80 m', "Monkey's Resto|100 m"],
    cafes: ['Peaches N Cream Bakeshop|150 m', 'Coffee & Bar|150 m', 'Dutch Cafe|220 m'],
  },
  'spice plates': {
    restaurants: ["Tiger Joe's Cafe|1.7 km", 'Sutoru Ramen|1.8 km', 'Fuxion Restaurant|1.8 km'],
    cafes: ["Clayanna's Cafe|190 m", 'Delez Cafe|1.2 km', 'Thela. Cafe|1.8 km'],
  },
  'lianas kitchenette': {
    restaurants: ['JapChi|550 m', 'Kimchi Food House|660 m', "Angel's Pizza|730 m"],
    cafes: ['Pastel Coffee|550 m', 'Auguri|700 m', 'add+ coffee|710 m'],
  },
  'tubo kitchenette': {
    restaurants: ["Popoy's Grill House|400 m", 'Calda Pizza|410 m', "Chipping's Sto. Niño|480 m"],
    cafes: ['Casa Estela Cafe|80 m', 'Cafe Meow|400 m', "Kamil's Bakeshop|440 m"],
  },
  'daisuke na aji': {
    restaurants: ["Monkey's Resto|120 m", "Auntie Lola's|140 m", 'Perks Seafoods House|150 m'],
    cafes: ['Dutch Cafe|next door', 'Peaches N Cream Bakeshop|70 m', 'Coffee & Bar|150 m'],
  },
  'red tomato modern italian': {
    restaurants: ['Sutoru Ramen|80 m', 'Juancios Burgers House|130 m', "Dulce's Kitchen|180 m"],
    cafes: ['2N1 Cafe|30 m', 'Cafe Eros|60 m', 'Quatro Bella Cafe|150 m'],
  },
  'liblib sa bundok resto bar': {
    restaurants: ['Perks Seafoods House|330 m', "Monkey's Resto|370 m", 'Ten 2 One Restobar|400 m'],
    cafes: ['Peaches N Cream Bakeshop|390 m', 'Dutch Cafe|430 m', 'Coffee & Bar|520 m'],
  },
  'xeon winghouse': {
    restaurants: ["Chipping's Sto. Niño|80 m", 'Perks Seafoods House|390 m', 'L & V Restaurant|460 m'],
    cafes: ['La Aroma Cafe|420 m', 'Cakes By Leen|480 m', 'Dutch Cafe|500 m'],
  },
  'calda pizza': {
    restaurants: ["Popoy's Grill House|80 m", "Chipping's JP Rizal|220 m", 'Theddis Burger|230 m'],
    cafes: ['Cafe Meow|80 m', "Kamil's Bakeshop|90 m", 'Casa Estela Cafe|330 m'],
  },
  'greenwich xentro': {
    restaurants: ["Auntie Lola's|80 m", "Uncle Jov's|80 m", "Dulce's Kitchen|100 m"],
    cafes: ['Coffee & Bar|80 m', 'Peaches N Cream Bakeshop|150 m', 'Dutch Cafe|200 m'],
  },
  'juancios burgers house': {
    restaurants: ['Red Tomato Modern Italian|130 m', 'Sutoru Ramen|210 m', "Dulce's Kitchen|280 m"],
    cafes: ['Quatro Bella Cafe|130 m', '2N1 Cafe|160 m', 'Cafe Eros|200 m'],
  },
  'angels pizza nuciti': {
    restaurants: ['JapChi|330 m', 'Kimchi Food House|540 m', 'Mabuhay Panciteria|600 m'],
    cafes: ['Auguri|40 m', 'sip coffee|40 m', 'add+ coffee|70 m'],
  },
  'theddis burger': {
    restaurants: ['Calda Pizza|230 m', "Popoy's Grill House|270 m", "Chipping's JP Rizal|320 m"],
    cafes: ["Kamil's Bakeshop|250 m", 'Cafe Meow|270 m', 'Cakes By Leen|510 m'],
  },
  'ten 2 one restobar': {
    restaurants: ["Uncle Jov's|40 m", 'Greenwich Xentro|110 m', "Monkey's Resto|130 m"],
    cafes: ['Peaches N Cream Bakeshop|170 m', 'Coffee & Bar|190 m', 'Dutch Cafe|250 m'],
  },
  japchi: {
    restaurants: ['Kimchi Food House|240 m', "Angel's Pizza|330 m", 'Mabuhay Panciteria|420 m'],
    cafes: ['Pastel Coffee|80 m', 'Auguri|340 m', 'sip coffee|360 m'],
  },
  'ichiban calapan': {
    restaurants: ['Kimchi Food House|190 m', 'Mabuhay Panciteria|260 m', "Chipping's JP Rizal|320 m"],
    cafes: ['Cakes By Leen|360 m', "Kamil's Bakeshop|380 m", 'La Aroma Cafe|420 m'],
  },
  'bashiru japanese restaurant': {
    restaurants: ["Chipping's Lechon|50 m", "Angel's Pizza|630 m", "Liana's Kitchenette|820 m"],
    cafes: ["Sister's Tea & Beverage Bar|280 m", 'Thela. Cafe|350 m', 'add+ coffee|560 m'],
  },
  'sutoru ramen': {
    restaurants: ['Red Tomato Modern Italian|80 m', "Dulce's Kitchen|160 m", 'Juancios Burgers House|210 m'],
    cafes: ['Cafe Eros|30 m', '2N1 Cafe|70 m', 'Coffee & Bar|200 m'],
  },
  'kimchi food house': {
    restaurants: ['Ichiban Calapan|190 m', 'JapChi|240 m', 'Mabuhay Panciteria|280 m'],
    cafes: ['Pastel Coffee|320 m', 'Cakes By Leen|350 m', 'La Aroma Cafe|420 m'],
  },
  'tiger joes cafe': {
    restaurants: ['Fuxion Restaurant|180 m', 'STARBOX KTV|190 m', "Chipping's Lechon|1.4 km"],
    cafes: ['Continentea Cafe|290 m', "Sister's Tea & Beverage Bar|1.2 km", 'Thela. Cafe|1.3 km'],
  },
  'starbox ktv bar restaurant': {
    restaurants: ['Fuxion Restaurant|50 m', "Tiger Joe's Cafe|190 m", "Chipping's Lechon|1.6 km"],
    cafes: ['Continentea Cafe|160 m', "Sister's Tea & Beverage Bar|1.4 km", 'Thela. Cafe|1.5 km'],
  },
  'ambagan restobar': {
    restaurants: ['Anahaw Island View Resort restaurant|50 m', "Liana's Kitchenette|1.3 km", 'Kimchi Food House|1.8 km'],
    cafes: ['Pastel Coffee|1.8 km', 'Auguri|2.0 km', 'add+ coffee|2.0 km'],
  },
};

function normalizePlaceName(name: string, stripParenthetical = true): string {
  return (stripParenthetical ? name.replace(/\s*\([^)]*\)/g, '') : name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const placeAliases: Record<string, string> = {
  'calapan cable park wakeboarding': 'calapan cable park',
  'kayaking and river cruise at baruyan river and caluangan lake': 'baruyan river caluangan lake',
  'baruyan river and caluangan lake': 'baruyan river caluangan lake',
  'snorkeling at harka piloto': 'harka piloto',
  'snorkeling at harka piloto silonay': 'harka piloto',
  'sto nino cathedral diocese of calapan': 'sto nino cathedral',
  'sts peter and paul chaplaincy roxas dr': 'sts peter and paul chaplaincy',
  'our lady of fatima chapel roxas dr': 'our lady of fatima chapel',
  'st benedict chaplaincy near tawiran': 'st benedict chaplaincy',
  'world mission society church of god calapan': 'world mission society church of god',
  'world mission society church of god jp rizal': 'world mission society church of god',
  'casa real ruins heritage museum site': 'casa real ruins',
  'old city hall now the heritage culture and arts building': 'old city hall',
  'plaza del gobernador liwasan ng mamamayan dancing fountain': 'plaza del gobernador liwasan ng mamamayan',
  'night market around calapan city plaza': 'night market calapan city plaza',
  'harka piloto fish sanctuary silonay': 'harka piloto fish sanctuary',
  'calapan city heritage culture and arts building': 'calapan city heritage culture arts building',
  'baruyan river at caluangan lake': 'baruyan river caluangan lake',
  'plaza del gobernador': 'plaza del gobernador liwasan ng mamamayan',
  'jolly waves waterpark': 'jolly waves waterpark and resort',
  'jolly waves waterpark and resort sapul': 'jolly waves waterpark and resort',
  'silonay island islet': 'silonay island islet',
  'aganhao aganhaw islet': 'aganhao islet',
  'calapan nature park bulusan park': 'calapan nature park',
  'parang beach resort events area': 'parang beach',
  'parang beach resort': 'parang beach',
  'parang beach resort parang': 'parang beach',
  'casa estela boutique hotel cafe': 'casa estela boutique hotel cafe',
  'casa estela boutique hotel and cafe': 'casa estela boutique hotel cafe',
  'filipiniana resort hotel sto nino': 'filipiniana resort hotel',
  'cuidad garden resort and conference center': 'cuidad garden resort and conference center',
  'blue harbor inn': 'blue harbor hotel',
  'blue harbor inn san antonio': 'blue harbor hotel',
  'chippings express san antonio': 'chippings express san antonio',
  'chippings express san antonio branch': 'chippings express san antonio',
  'chippings bayanan branches': 'chippings bayanan',
  'chippings bayanan camilmil sto nino branches': 'chippings bayanan',
  'calapan city transient house blk 52 lot 41': 'calapan city transient house blk 52 lot 41',
  'calapan nature park bulusan': 'calapan nature park',
  'el huerto private resort malamig': 'el huerto private resort',
  'everland lake resort baruyan': 'everland lake resort',
  'eden lakeview resort baruyan': 'eden lakeview resort',
  'inays place resort spring water pools': 'inays place resort',
  'coco farm resort canubing i': 'coco farm resort',
  'amaliso farm resort sitio bilolo': 'amaliso farm resort',
  'il lago fdj farm tawagan rd': 'il lago fdj farm',
  'czeascape beach resort': 'czeascape beach resort',
  'lambingan beach san antonio': 'lambingan beach',
  'pachoca balite beach': 'pachoca balite beach',
  'feraren hills': 'feraren hills',
  'balai mindoro pickleball courts bayanan i': 'balai mindoro',
  'balai mindoro pickleball courts': 'balai mindoro',
  'harka piloto snorkeling': 'harka piloto',
  'monkeys resto calapan roxas dr': 'monkeys resto',
  'auntie lolas restaurant': 'auntie lolas restaurant',
  'la aroma cafe and restaurant san vicente east': 'la aroma cafe and restaurant',
  'clayannas cafe roxas dr': 'clayannas cafe',
  'pastel coffee smv': 'pastel coffee',
  'thela cafe lalud': 'thela cafe',
  'coffee bar mnd bldg': 'coffee and bar',
  'sisters tea beverage bar ubas': 'sisters tea beverage bar',
  'kamils food bakeshop': 'kamils food bakeshop',
  'kamils bakeshop': 'kamils food bakeshop',
  '2n1 cafe nag iba ii branch': '2n1 cafe nag iba ii branch',
  '2n1 cafe nag iba ii': '2n1 cafe nag iba ii branch',
  'red tomato modern italian': 'red tomato modern italian',
  'chippings sto nino': 'chippings sto nino',
  'chippings jp rizal': 'chippings jp rizal',
  'chippings lechon': 'chippings lechon',
  'greenwich xentro mall': 'greenwich xentro',
  'angels pizza nuciti': 'angels pizza nuciti',
  'angel pizza nuciti': 'angels pizza nuciti',
  'daisuki na aji': 'daisuke na aji',
  'daisuke na aji': 'daisuke na aji',
  'tiger joes cafe bar': 'tiger joes cafe',
  'starbox ktv': 'starbox ktv bar restaurant',
  'starbox ktv bar restaurant': 'starbox ktv bar restaurant',
  'calda pizza': 'calda pizza',
  'xentro mall calapan': 'xentro mall calapan',
  'nuciti central mall calapan': 'nuciti central mall',
  'citimart island mall': 'citimart island mall',
  'citymall calapan': 'citymall calapan',
  'gaisano capital calapan': 'gaisano capital calapan',
  'mindoro souvenir verify': 'mindoro souvenir',
  'small creation souvenirs by bennett dan gamban': 'small creation souvenirs',
  'merls native delicacies lumangbayan': 'merls native delicacies',
  'anik anik paras drive': 'anikanik',
  'auguri auguri miltea house': 'auguri',
  'la aroma cafe': 'la aroma cafe and restaurant',
  'cafe eros gov ignacio': 'cafe eros',
  'cafe meow bonifacio st': 'cafe meow',
  'silonay mangrove conservation ecopark': 'silonay mangrove conservation ecopark',
};

export function getCuratedNearbyFood(placeName: string): NearbyFoodListing[] {
  const fullName = normalizePlaceName(placeName, false);
  const normalizedName = normalizePlaceName(placeName);
  const key = placeAliases[fullName] ?? placeAliases[normalizedName] ?? normalizedName;
  const lists = nearbyByPlace[key];
  if (!lists) return [];
  return nearby(lists.restaurants, lists.cafes);
}
