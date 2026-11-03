import sipCoffeeImage from '../assets/cafe-sip-coffee.jpg';
import addPlusCoffeeImage from '../assets/cafe-add-plus-coffee.jpg';
import pastelCoffeeImage from '../assets/cafe-pastel-coffee.jpg';
import clayannasImage from '../assets/cafe-clayannas.jpg';
import laAromaImage from '../assets/cafe-la-aroma.jpg';
import delezImage from '../assets/cafe-delez.jpg';
import cafeMeowImage from '../assets/cafe-meow.jpg';
import cafeErosImage from '../assets/cafe-eros.jpg';
import thelaImage from '../assets/cafe-thela.jpg';
import mndCoffeeBarImage from '../assets/cafe-mnd-coffee-bar.jpg';
import continenteaImage from '../assets/cafe-continentea.jpg';
import dutchCafeImage from '../assets/cafe-dutch.jpg';
import auguriImage from '../assets/cafe-auguri-miltea.jpg';
import casaEstelaImage from '../assets/cafe-casa-estela.jpg';
import bungkosBistroImage from '../assets/cafe-bungkos-bistro.jpg';
import quatroBellaImage from '../assets/cafe-quatro-bella.jpg';
import sistersTeaImage from '../assets/cafe-sisters-tea.jpg';
import cafe2n1Image from '../assets/cafe-2n1.jpg';

export type CuratedFoodCategory = 'Cafés & Coffee Shops' | 'Restaurants & Eateries';

export interface CuratedFoodPlace {
  name: string;
  category: CuratedFoodCategory;
  image?: string;
}

export const CURATED_CAFE_LISTINGS: readonly CuratedFoodPlace[] = [
  { name: 'sip coffee (Calapan Town Center)', category: 'Cafés & Coffee Shops', image: sipCoffeeImage },
  { name: 'add+ coffee (Gozar)', category: 'Cafés & Coffee Shops', image: addPlusCoffeeImage },
  { name: 'Pastel Coffee (SMV)', category: 'Cafés & Coffee Shops', image: pastelCoffeeImage },
  { name: "Clayanna's Cafe (Roxas Dr.)", category: 'Cafés & Coffee Shops', image: clayannasImage },
  { name: 'La Aroma Cafe and Restaurant (San Vicente East)', category: 'Cafés & Coffee Shops', image: laAromaImage },
  { name: 'Delez Cafe (Coffee & Tea) (C5 Rd.)', category: 'Cafés & Coffee Shops', image: delezImage },
  { name: 'Cafe Meow (Bonifacio St.)', category: 'Cafés & Coffee Shops', image: cafeMeowImage },
  { name: 'Cafe Eros (Gov. Ignacio)', category: 'Cafés & Coffee Shops', image: cafeErosImage },
  { name: 'Thela. Cafe (Lalud)', category: 'Cafés & Coffee Shops', image: thelaImage },
  { name: 'Coffee & Bar (MND Bldg.)', category: 'Cafés & Coffee Shops', image: mndCoffeeBarImage },
  { name: 'Continentea Cafe (Tawiran)', category: 'Cafés & Coffee Shops', image: continenteaImage },
  { name: 'Dutch Cafe (Filipiniana Complex)', category: 'Cafés & Coffee Shops', image: dutchCafeImage },
  { name: 'Auguri / Auguri Miltea House', category: 'Cafés & Coffee Shops', image: auguriImage },
  { name: 'Casa Estela Boutique Hotel & Cafe', category: 'Cafés & Coffee Shops', image: casaEstelaImage },
  { name: 'Bungkos Bistro (Balai Mindoro)', category: 'Cafés & Coffee Shops', image: bungkosBistroImage },
  { name: 'Quatro Bella Cafe (Xentro Mall)', category: 'Cafés & Coffee Shops', image: quatroBellaImage },
  { name: "Sister's Tea & Beverage Bar (Ubas)", category: 'Cafés & Coffee Shops', image: sistersTeaImage },
  { name: '2n1 Cafe', category: 'Cafés & Coffee Shops', image: cafe2n1Image },
];

export const CURATED_RESTAURANT_LISTINGS: readonly CuratedFoodPlace[] = [
  { name: "Monkey's Resto Calapan (Roxas Dr.)", category: 'Restaurants & Eateries' },
  { name: "Auntie Lola's Restaurant", category: 'Restaurants & Eateries' },
  { name: "Arsenia's Hapag Kainan sa Kabukiran", category: 'Restaurants & Eateries' },
  { name: 'Fuxion Restaurant (Filipino-Chinese)', category: 'Restaurants & Eateries' },
  { name: 'L & V Restaurant (del Pilar)', category: 'Restaurants & Eateries' },
  { name: 'Perks Seafoods House', category: 'Restaurants & Eateries' },
  { name: 'Bham Sea Foods (Quezon Dr.)', category: 'Restaurants & Eateries' },
  { name: "Siokoy's Grill and Restaurant (beachfront)", category: 'Restaurants & Eateries' },
  { name: "Popoy's Grill House", category: 'Restaurants & Eateries' },
  { name: 'Anthos Grill House', category: 'Restaurants & Eateries' },
  { name: "Chipping's (Bayanan, Camilmil, Sto. Niño branches)", category: 'Restaurants & Eateries' },
  { name: 'Mabuhay Panciteria (Ramirez St.)', category: 'Restaurants & Eateries' },
  { name: 'AJ Bradz Restaurant', category: 'Restaurants & Eateries' },
  { name: 'Bolus Kitchenette', category: 'Restaurants & Eateries' },
  { name: "Dulce's Kitchen", category: 'Restaurants & Eateries' },
  { name: 'Emilyo Restaurant', category: 'Restaurants & Eateries' },
  { name: 'Red Tomato Modern Italian', category: 'Restaurants & Eateries' },
  { name: 'Calda Pizza', category: 'Restaurants & Eateries' },
  { name: "Angel's Pizza (Nuciti)", category: 'Restaurants & Eateries' },
  { name: 'Greenwich (Xentro Mall)', category: 'Restaurants & Eateries' },
  { name: 'Juancios Burgers House (Lumangbayan)', category: 'Restaurants & Eateries' },
  { name: 'Theddis Burger', category: 'Restaurants & Eateries' },
  { name: 'Xeon Winghouse (Sto. Niño)', category: 'Restaurants & Eateries' },
  { name: 'Bashiru Japanese Restaurant', category: 'Restaurants & Eateries' },
  { name: 'Ichiban Calapan', category: 'Restaurants & Eateries' },
  { name: 'Sutoru Ramen', category: 'Restaurants & Eateries' },
  { name: 'JapChi', category: 'Restaurants & Eateries' },
  { name: 'Daisuki Na Aji', category: 'Restaurants & Eateries' },
  { name: 'Kimchi Food House', category: 'Restaurants & Eateries' },
  { name: 'Liblib sa Bundok Resto Bar (Sto. Niño)', category: 'Restaurants & Eateries' },
  { name: 'Ten 2 One Restobar (Xentro Mall)', category: 'Restaurants & Eateries' },
  { name: "Tiger Joe's Cafe", category: 'Restaurants & Eateries' },
  { name: 'STARBOX KTV Bar & Restaurant', category: 'Restaurants & Eateries' },
  { name: 'Ambagan Restobar (Balite)', category: 'Restaurants & Eateries' },
  { name: "Kamil's Food & Bakeshop", category: 'Restaurants & Eateries' },
  { name: 'Cakes By Leen', category: 'Restaurants & Eateries' },
  { name: 'Peaches N Cream Bakeshop', category: 'Restaurants & Eateries' },
];

export const CURATED_NEARBY_FOOD_PLACES: readonly CuratedFoodPlace[] = [
  ...CURATED_CAFE_LISTINGS,
  ...CURATED_RESTAURANT_LISTINGS,
];
