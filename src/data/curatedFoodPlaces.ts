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
  note?: string;
  address?: string;
  image?: string;
}

export const CURATED_CAFE_LISTINGS: readonly CuratedFoodPlace[] = [
  { name: 'sip coffee (Calapan Town Center)', category: 'Cafés & Coffee Shops', address: 'Unit 1A, Calapan Town Center, J.P. Rizal Street, Brgy. Camilmil, Calapan City, Oriental Mindoro 5200', image: sipCoffeeImage, note: 'A cozy coffee shop where customers can enjoy coffee and refreshing drinks in a comfortable setting.' },
  { name: 'add+ coffee (Gozar)', category: 'Cafés & Coffee Shops', address: '2nd Floor, Beatitudes Building, Gozar Street, Brgy. Camilmil, Calapan City, Oriental Mindoro 5200', image: addPlusCoffeeImage, note: 'A caf? offering coffee and beverages, suitable for casual meetups, quick breaks, and coffee lovers.' },
  { name: 'Pastel Coffee (SMV)', category: 'Cafés & Coffee Shops', address: '065 Mangga Street, Block 3, Sta. Maria Village, Calapan City, Oriental Mindoro 5200', image: pastelCoffeeImage, note: 'A neighborhood caf? where visitors can enjoy coffee and other drinks in a relaxed atmosphere.' },
  { name: "Clayanna's Cafe (Roxas Dr.)", category: 'Cafés & Coffee Shops', image: clayannasImage, note: 'A caf? in Calapan City offering coffee, drinks, or light bites.' },
  { name: 'La Aroma Cafe and Restaurant (San Vicente East)', category: 'Cafés & Coffee Shops', address: 'Aboboto Street, Brgy. San Vicente East, Calapan City, Oriental Mindoro 5200', image: laAromaImage, note: 'A caf? and dining spot offering a place to enjoy meals, drinks, and casual gatherings.' },
  { name: 'Delez Cafe (Coffee & Tea) (C5 Rd.)', category: 'Cafés & Coffee Shops', image: delezImage, note: 'A coffee and tea shop where visitors can enjoy refreshing beverages and take a relaxing break.' },
  { name: 'Cafe Meow (Bonifacio St.)', category: 'Cafés & Coffee Shops', image: cafeMeowImage, note: 'A local caf? where customers can enjoy drinks and spend time in a casual and welcoming setting.' },
  { name: 'Cafe Eros (Gov. Ignacio)', category: 'Cafés & Coffee Shops', image: cafeErosImage, note: 'A neighborhood caf? offering a comfortable place for coffee, refreshments, and casual conversations.' },
  { name: 'Thela. Cafe (Lalud)', category: 'Cafés & Coffee Shops', address: 'Reyes Building, Unit 1A, Atis Street, Brgy. Lalud, Calapan City, Oriental Mindoro 5200', image: thelaImage, note: 'A local caf? where visitors can enjoy coffee and other beverages in a cozy setting.' },
  { name: 'Coffee & Bar (MND Bldg.)', category: 'Cafés & Coffee Shops', image: mndCoffeeBarImage, note: 'A beverage spot offering a place to enjoy coffee and drinks while taking a break from daily activities.' },
  { name: 'Continentea Cafe (Tawiran)', category: 'Cafés & Coffee Shops', address: '217 Yasmin Street, Morning Breeze Subdivision, Brgy. Tawiran, Calapan City, Oriental Mindoro 5200', image: continenteaImage, note: 'A caf? offering tea, coffee, and refreshing beverages for customers looking for a quick drink or casual hangout.' },
  { name: 'Dutch Cafe (Filipiniana Complex)', category: 'Cafés & Coffee Shops', address: 'Unit 11, Filipiniana Complex, Brgy. Sto. Niño, Calapan City, Oriental Mindoro 5200', image: dutchCafeImage, note: 'A caf? where customers can enjoy coffee and refreshments in a convenient location.' },
  { name: 'Auguri / Auguri Miltea House', category: 'Cafés & Coffee Shops', address: '2nd Floor, Calapan Town Center, J.P. Rizal Street, Brgy. Camilmil, Calapan City, Oriental Mindoro 5200', image: auguriImage, note: 'A beverage shop offering milk tea and other refreshing drinks, ideal for a quick refreshment stop.' },
  { name: 'Casa Estela Boutique Hotel & Cafe', category: 'Cafés & Coffee Shops', address: 'Governor B. Marasigan Street, Brgy. Libis, Calapan City, Oriental Mindoro 5200', image: casaEstelaImage, note: 'A boutique accommodation with a caf?, combining a relaxing place to stay with a convenient dining and coffee experience.' },
  { name: 'Bungkos Bistro (Balai Mindoro)', category: 'Cafés & Coffee Shops', address: 'Balai Mindoro Compound, Brgy. Bayanan I, Calapan City, Oriental Mindoro 5200', image: bungkosBistroImage, note: 'A dining and beverage destination within Balai Mindoro, offering visitors a place to relax and enjoy food.' },
  { name: 'Quatro Bella Cafe (Xentro Mall)', category: 'Cafés & Coffee Shops', address: 'C53J+FG5, Xentro Mall, Calapan City, Oriental Mindoro 5200', note: 'A mall-based caf? where shoppers can enjoy coffee, drinks, and a convenient place to take a break.', image: quatroBellaImage },
  { name: "Sister's Tea & Beverage Bar (Ubas)", category: 'Cafés & Coffee Shops', address: 'C52C+3V3, Ubas, Calapan City, Oriental Mindoro 5200', note: 'Plus Code only; exact street and barangay not confirmed.', image: sistersTeaImage },
  { name: '2n1 Cafe', category: 'Cafés & Coffee Shops', address: 'Ignacio Street, Brgy. Lumangbayan, Calapan City, Oriental Mindoro 5200', image: cafe2n1Image, note: 'A neighborhood caf? where visitors can enjoy coffee, beverages, and a relaxing break.' },
  { name: 'Nomu Nomu Cafe – Masipit', category: 'Cafés & Coffee Shops', address: '95Q7+3P4, Brgy. Masipit, Calapan City, Oriental Mindoro 5200', note: 'Plus Code only; exact street and building not confirmed.' },
  { name: 'Purple Blend by Garen', category: 'Cafés & Coffee Shops', address: 'PCC Village, Brgy. Masipit, Calapan City, Oriental Mindoro 5200', note: 'A beverage shop where customers can enjoy blended drinks and refreshments.' },
  { name: 'Kkopi.Tea – Masipit', category: 'Cafés & Coffee Shops', address: 'Strong Republic Nautical Highway, Brgy. Masipit, Calapan City, Oriental Mindoro 5200', note: 'Exact building or unit not confirmed.' },
  { name: 'BigBrew – Masipit', category: 'Cafés & Coffee Shops', address: '95Q7+6MX, Strong Republic Nautical Highway, Brgy. Masipit, Calapan City, Oriental Mindoro 5200', note: 'A listed destination in Calapan City, Oriental Mindoro.' },
];

export const CURATED_RESTAURANT_LISTINGS: readonly CuratedFoodPlace[] = [
  { name: "Monkey's Resto Calapan (Roxas Dr.)", category: 'Restaurants & Eateries', note: 'A dining spot in Calapan City offering food and refreshments.' },
  { name: "Auntie Lola's Restaurant", category: 'Restaurants & Eateries', address: 'Lumangbayan, Calapan City, Oriental Mindoro 5200', note: 'Another listing references Roxas Drive, Brgy. Sto. Niño; confirm the exact branch location.' },
  { name: "Arsenia's Hapag Kainan sa Kabukiran", category: 'Restaurants & Eateries', address: '85MC+2WX, Strong Republic Nautical Highway, Calapan City, Oriental Mindoro 5200', note: 'A dining spot in Calapan City offering food and refreshments.' },
  { name: 'Fuxion Restaurant (Filipino-Chinese)', category: 'Restaurants & Eateries', address: 'Unit 6, 2nd Floor, AM Cacha Building, Strong Republic Nautical Highway, Brgy. Tawiran, Calapan City, Oriental Mindoro 5200', note: 'A restaurant offering Filipino-Chinese dining options for customers who enjoy a combination of local and Chinese-inspired flavors.' },
  { name: 'L & V Restaurant (del Pilar)', category: 'Restaurants & Eateries', address: 'C56H+HXC, Del Pilar Street, Calapan City, Oriental Mindoro 5200', note: 'A local dining establishment where visitors can enjoy meals in a casual restaurant environment.' },
  { name: 'Perks Seafoods House', category: 'Restaurants & Eateries', address: 'Calapan City, Oriental Mindoro 5200', note: 'A seafood restaurant for customers looking to enjoy seafood dishes and a casual dining experience.' },
  { name: 'Bham Sea Foods (Quezon Dr.)', category: 'Restaurants & Eateries', note: 'A seafood dining spot along Quezon Drive where customers can enjoy seafood-based meals.' },
  { name: "Siokoy's Grill and Restaurant (beachfront)", category: 'Restaurants & Eateries', address: 'Calapan City, Oriental Mindoro 5200', note: 'Exact street address and barangay not confirmed.' },
  { name: "Popoy's Grill House", category: 'Restaurants & Eateries', address: 'Calapan City, Oriental Mindoro 5200', note: 'Exact street address and barangay not confirmed.' },
  { name: 'Anthos Grill House', category: 'Restaurants & Eateries', address: 'Calapan City, Oriental Mindoro 5200', note: 'A local grill house where visitors can enjoy a casual dining experience and grilled food.' },
  { name: "Chipping's – Bayanan Branch", category: 'Restaurants & Eateries', address: 'Brgy. Bayanan, Calapan City, Oriental Mindoro 5200', note: 'Exact street address not confirmed.' },
  { name: "Chipping's – Camilmil Branch", category: 'Restaurants & Eateries', address: 'Brgy. Camilmil, Calapan City, Oriental Mindoro 5200', note: 'Exact street address not confirmed.' },
  { name: "Chipping's – Sto. Niño Branch", category: 'Restaurants & Eateries', address: 'Brgy. Sto. Niño, Calapan City, Oriental Mindoro 5200', note: 'Exact street address not confirmed.' },
  { name: 'Mabuhay Panciteria (Ramirez St.)', category: 'Restaurants & Eateries', note: 'A local panciteria where customers can enjoy noodle dishes and other Filipino-style meals.' },
  { name: 'AJ Bradz Restaurant', category: 'Restaurants & Eateries', address: 'Puting Tubig, Calapan City, Oriental Mindoro 5200', note: 'A local restaurant offering a place for customers to enjoy meals and casual dining.' },
  { name: 'Bolus Kitchenette', category: 'Restaurants & Eateries', address: 'Calapan City, Oriental Mindoro 5200', note: 'A small dining establishment where customers can enjoy convenient meals and food offerings.' },
  { name: "Dulce's Kitchen", category: 'Restaurants & Eateries', address: 'C53M+66G, Roxas Drive, Calapan City, Oriental Mindoro 5200', note: 'A dining spot in Calapan City offering food and refreshments.' },
  { name: 'Emilyo Restaurant', category: 'Restaurants & Eateries', address: 'Brgy. Bayanan I, Calapan City, Oriental Mindoro 5200', note: 'A neighborhood restaurant where visitors can enjoy food and casual dining.' },
  { name: 'Red Tomato Modern Italian', category: 'Restaurants & Eateries', address: 'Calapan City, Oriental Mindoro 5200', note: 'A restaurant offering Italian-inspired cuisine for customers looking for a different dining experience.' },
  { name: 'Calda Pizza', category: 'Restaurants & Eateries', address: 'Osmeña Street, Calapan City, Oriental Mindoro 5200', note: 'A pizza restaurant where customers can enjoy pizza and other available food offerings.' },
  { name: "Angel's Pizza (Nuciti)", category: 'Restaurants & Eateries', note: 'A dining spot in Calapan City offering food and refreshments.' },
  { name: 'Greenwich (Xentro Mall)', category: 'Restaurants & Eateries', note: 'A popular pizza and pasta restaurant inside Xentro Mall, suitable for casual meals and group dining.' },
  { name: 'Juancios Burgers House (Lumangbayan)', category: 'Restaurants & Eateries', note: 'A burger restaurant in Lumangbayan where customers can enjoy burgers and casual fast-food meals.' },
  { name: 'Theddis Burger', category: 'Restaurants & Eateries', address: 'Calapan City, Oriental Mindoro 5200', note: 'A local burger stop offering a convenient option for customers craving burgers and quick meals.' },
  { name: 'Xeon Winghouse (Sto. Niño)', category: 'Restaurants & Eateries', note: 'A dining spot in Calapan City offering food and refreshments.' },
  { name: 'Bashiru Japanese Restaurant', category: 'Restaurants & Eateries', address: '2nd Floor, JABT2 Building, J.P. Rizal Street, Brgy. Lalud, Calapan City, Oriental Mindoro 5200', note: 'A Japanese-style restaurant where customers can explore Japanese-inspired dishes in a casual dining setting.' },
  { name: 'Ichiban Calapan', category: 'Restaurants & Eateries', address: 'Calapan City, Oriental Mindoro 5200', note: 'A local dining destination offering Japanese-inspired food options for customers in Calapan.' },
  { name: 'Sutoru Ramen', category: 'Restaurants & Eateries', address: 'Calapan City, Oriental Mindoro 5200', note: 'A ramen restaurant where customers can enjoy Japanese-style noodle soup and a warm meal.' },
  { name: 'JapChi', category: 'Restaurants & Eateries', address: 'Calapan City, Oriental Mindoro 5200', note: 'A dining spot offering Japanese- and Chinese-inspired food choices for customers looking for Asian-style meals.' },
  { name: 'Daisuki Na Aji', category: 'Restaurants & Eateries', address: 'Filipiniana Complex, Brgy. Sto. Niño, Calapan City, Oriental Mindoro 5200', note: 'A local restaurant offering Japanese-inspired food and a casual dining experience.' },
  { name: 'Kimchi Food House', category: 'Restaurants & Eateries', address: '222 Leuterio Street, Calapan City, Oriental Mindoro 5200', note: 'A food destination where customers can enjoy Korean-inspired dishes and flavors.' },
  { name: 'Liblib sa Bundok Resto Bar (Sto. Niño)', category: 'Restaurants & Eateries', address: 'Brgy. Sto. Niño, Calapan City, Oriental Mindoro 5200', note: 'Exact street address not confirmed.' },
  { name: 'Ten 2 One Restobar (Xentro Mall)', category: 'Restaurants & Eateries', address: 'Xentro Mall, Roxas Drive, Calapan City, Oriental Mindoro 5200', note: 'A restobar inside Xentro Mall where customers can enjoy food and drinks in a casual social setting.' },
  { name: "Tiger Joe's Cafe", category: 'Restaurants & Eateries', address: 'Calapan City, Oriental Mindoro 5200', note: 'Exact street address and barangay not confirmed.' },
  { name: 'STARBOX KTV Bar & Restaurant', category: 'Restaurants & Eateries', address: '2nd Floor, AM Cacha Building, Strong Republic Nautical Highway, Brgy. Tawiran, Calapan City, Oriental Mindoro 5200', note: 'A dining and entertainment venue where guests can enjoy food, drinks, and karaoke.' },
  { name: 'Ambagan Restobar (Balite)', category: 'Restaurants & Eateries', address: 'Balite Bay, Brgy. Balite, Calapan City, Oriental Mindoro 5200', note: 'A restobar in Balite offering a casual place for dining, drinks, and social gatherings.' },
  { name: "Kamil's Food & Bakeshop", category: 'Restaurants & Eateries', address: 'Calapan City, Oriental Mindoro 5200', note: 'Exact street address and barangay not confirmed.' },
  { name: 'Cakes By Leen', category: 'Restaurants & Eateries', address: 'Calapan City, Oriental Mindoro 5200', note: 'A cake and dessert shop offering sweet treats for celebrations, special occasions, and everyday cravings.' },
  { name: 'Peaches N Cream Bakeshop', category: 'Restaurants & Eateries', address: 'Calapan City, Oriental Mindoro 5200', note: 'A bakery where customers can find baked goods and sweet treats.' },
  { name: 'Sinapot sa Dawon Food Stall', category: 'Restaurants & Eateries', address: '95Q6+3Q7, Mindoro State University area, Brgy. Masipit, Calapan City, Oriental Mindoro 5200', note: 'A local food stall near the MinSU area where customers can try available street food and quick bites.' },
  { name: 'DurYum Bites', category: 'Restaurants & Eateries', address: 'Mindoro State University area, Brgy. Masipit, Calapan City, Oriental Mindoro 5200', note: 'A food stop near the MinSU area offering convenient bites and quick food options.' },
  { name: 'Marrow Restobar', category: 'Restaurants & Eateries', address: '95J7+55J, Strong Republic Nautical Highway, Brgy. Masipit, Calapan City, Oriental Mindoro 5200', note: 'A local restobar where customers can enjoy food and drinks in a casual dining atmosphere.' },
  { name: 'Streamaker Cafe', category: 'Restaurants & Eateries', address: 'Sitio Centro, Brgy. Masipit, Calapan City, Oriental Mindoro 5200', note: 'A caf? in the Masipit area where visitors can enjoy refreshments and take a break.' },
];

export const CURATED_NEARBY_FOOD_PLACES: readonly CuratedFoodPlace[] = [
  ...CURATED_CAFE_LISTINGS,
  ...CURATED_RESTAURANT_LISTINGS,
];
