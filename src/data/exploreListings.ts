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
  address?: string;
  category?: string;
  image?: string;
}

export const EXPLORE_CATEGORY_LISTINGS: Readonly<Record<string, readonly ExploreListing[]>> = {
  'Adventure & Outdoor Activities': [
    { name: 'Feraren Hills', address: '707 Ferraren Hills, Brgy. Lumangbayan, Calapan City, Oriental Mindoro 5200.', note: 'A nature destination where visitors can enjoy outdoor exploration, scenic surroundings, and a refreshing escape from the city.', image: ferarenHillsImage },
    { name: 'Calapan Cable Park (wakeboarding)', address: 'C43R+XJJ, Calapan City, Oriental Mindoro 5200 (barangay not confirmed).', note: 'An outdoor recreation destination associated with wakeboarding and water-based activities for adventure enthusiasts.', image: calapanCableParkImage },
    { name: 'Kayaking and River Cruise – Baruyan River', address: 'Brgy. Baruyan, Calapan City, Oriental Mindoro 5200.', note: 'Enjoy a relaxing river adventure while exploring the natural scenery of Baruyan River through kayaking or a river cruise.', image: baruyanRiverCruiseImage },
    { name: 'Caluangan Lake', address: 'Brgy. Tawagan, Calapan City, Oriental Mindoro 5200 (exact sitio not confirmed).', note: 'A peaceful natural destination surrounded by scenic landscapes, ideal for nature appreciation, sightseeing, and outdoor exploration.', image: caluanganLakeImage },
    { name: 'Snorkeling at Harka Piloto', address: 'Offshore, Brgy. Lazareto, Calapan City, Oriental Mindoro 5200.', image: harkaPilotoSnorkelingImage, note: 'Explore the coastal waters of Harka Piloto and discover the marine environment through snorkeling.' },
    { name: 'Balai Mindoro Pickleball Courts', address: 'Balai Mindoro Compound, Brgy. Bayanan I, Calapan City, Oriental Mindoro 5200.', image: balaiMindoroPickleballImage, note: 'A recreational sports facility where visitors can enjoy pickleball, stay active, and spend time with friends.' },
  ],
  'ATM Machines': [
    { name: 'BDO ATM – Calapan Branch', note: 'Calapan City, Oriental Mindoro. Provides convenient cash withdrawals and basic banking transactions for BDO customers.' },
    { name: 'BDO ATM – Puregold Calapan', note: 'Puregold Calapan, Calapan City, Oriental Mindoro. Provides ATM services for customers who need cash while shopping or visiting the area.' },
    { name: 'BPI ATM – Calapan Branch', note: 'Calapan City, Oriental Mindoro. Offers convenient cash withdrawals and other supported self-service banking transactions.' },
    { name: 'BPI ATM – Puregold Calapan', note: 'Puregold Calapan, Calapan City, Oriental Mindoro. Allows BPI customers to withdraw cash conveniently within the commercial area.' },
    { name: 'Metrobank ATM – Calapan', note: 'J.P. Rizal Street, Calapan City, Oriental Mindoro. Provides self-service banking facilities, including cash withdrawals and balance inquiries.' },
    { name: 'RCBC ATM – Calapan Branch', note: 'Homemark Commercial Building, Calapan City, Oriental Mindoro. Offers convenient ATM access for RCBC customers and other supported banking transactions.' },
    { name: 'RCBC ATM – Divine Word College of Calapan', note: 'Divine Word College of Calapan, Calapan City, Oriental Mindoro. Provides cash access in the school area for students, employees, and nearby residents.' },
    { name: 'DBP ATM – Calapan Branch', note: 'Calapan City, Oriental Mindoro. Provides ATM services for cash withdrawals and other supported banking transactions.' },
    { name: 'EastWest Bank ATM – Calapan', note: 'Calapan City, Oriental Mindoro. Provides convenient self-service banking access for EastWest customers.' },
    { name: 'Security Bank ATM – Calapan', note: 'Tawiran, Calapan City, Oriental Mindoro. Offers ATM services for cash withdrawals and other supported banking transactions.' },
    { name: 'Chinabank ATM – Calapan', note: 'Gliceria Concepcion Building, J.P. Rizal Street, San Vicente, Calapan City, Oriental Mindoro. Provides convenient cash withdrawal services and other supported ATM transactions.' },
    { name: 'PNB ATM – Gaisano Capital Calapan', note: 'Gaisano Capital, Tawiran, Calapan City, Oriental Mindoro. Provides convenient cash withdrawals for shoppers, employees, and nearby residents.' },
    { name: 'PNB ATM – ORMECO', note: 'ORMECO Compound, Simaron, Sta. Isabel, Calapan City, Oriental Mindoro. Provides ATM access for people visiting the ORMECO compound and surrounding areas.' },
    { name: 'UCPB ATM – Calapan', note: 'Baniway Building, J.P. Rizal Street, Calapan City, Oriental Mindoro. Previously listed as an ATM location. Current availability and operating status need verification.' },
    { name: 'LandBank ATM – Filipiniana Complex', note: 'Filipiniana Complex, Barangay Sto. Niño, Calapan City, Oriental Mindoro. Provides ATM services for cash withdrawals and other supported LandBank transactions.' },
  ],
  Beaches: [
    { name: 'Lazareto Beach', address: 'C6H2+XM8, Brgy. Lazareto, Calapan City, Oriental Mindoro 5200', image: lazaretoBeachImage, note: 'A coastal destination where visitors can enjoy the sea breeze, seaside views, and a relaxing beach atmosphere.' },
    { name: 'Parang Beach', address: 'C686+P85, Brgy. Parang, Calapan City, Oriental Mindoro 5200', image: parangBeachImage , note: 'A beach destination in Barangay Parang, offering a peaceful coastal setting for relaxation and seaside activities.' },
    { name: 'Pachoca–Balite Beach', address: 'Coastal area of Brgy. Pachoca and Brgy. Balite, Calapan City, Oriental Mindoro 5200', note: 'A coastal area where visitors can appreciate the shoreline, enjoy the fresh sea breeze, and spend time by the water.', image: pachocaBaliteBeachImage },
    { name: 'Suqui Beach', address: 'Coastal area, Brgy. Suqui, Calapan City, Oriental Mindoro 5200', image: suquiBeachImage , note: 'A local beach destination suitable for enjoying coastal scenery and a relaxing seaside atmosphere.' },
    { name: 'Lambingan Beach (San Antonio)', address: 'Brgy. San Antonio, Calapan City, Oriental Mindoro 5200 (exact map pin not confirmed)', image: lambinganBeachImage , note: 'A seaside destination in San Antonio where visitors can unwind and enjoy the coastal surroundings.' },
  ],
  'Cafés & Coffee Shops': CURATED_CAFE_LISTINGS,
  'Churches & Religious Sites': [
    { name: 'Sto. Niño Cathedral (Diocese of Calapan)', address: 'C57J+R52, Calapan City, Oriental Mindoro 5200', note: 'A significant Catholic place of worship in Calapan City where visitors can attend religious services, pray, and appreciate its spiritual and historical importance.' },
    { name: 'Divine Mercy Parish (Pachoca)', address: 'Brgy. Pachoca, Calapan City, Oriental Mindoro 5200', image: divineMercyParishImage, note: 'A Catholic parish in Pachoca that serves as a place for prayer, worship, reflection, and community gatherings.' },
    { name: 'Sts. Peter and Paul Chaplaincy (Roxas Dr.)', image: stsPeterPaulChaplaincyImage, note: 'A Christian place of worship where the faithful can participate in religious activities and moments of spiritual reflection.' },
    { name: 'Our Lady of Fatima Chapel (Roxas Dr.)', note: 'A chapel dedicated to Our Lady of Fatima, providing a quiet place for prayer and devotion.' },
    { name: 'St. Benedict Chaplaincy (near Tawiran)', address: 'Durian Street, Brgy. Lalud, Calapan City, Oriental Mindoro 5200', image: stBenedictChaplaincyImage, note: 'A religious place where visitors and members of the community can gather for worship and spiritual activities.' },
    { name: 'World Mission Society Church of God – Calapan (JP Rizal)', note: 'A place of worship in Calapan City.' },
  ],
  'Events & Venues': [
    { name: 'Balai Mindoro', address: 'Strong Republic Nautical Highway, Calapan City, Oriental Mindoro 5200', image: balaiMindoroImage, note: 'A cultural and community destination where visitors can experience local crafts, activities, and gatherings in a setting that highlights Mindoro\'s local identity.' },
    { name: 'Calapan Bay Hotel (Cafe Angela function venue)', address: 'Calapan City, Oriental Mindoro 5200', note: 'A hotel venue that offers accommodation and a function space suitable for gatherings, celebrations, and special occasions.' },
    { name: 'Czeascape Beach Resort', address: 'C576+XW3, Leuterio, Brgy. Balite, Calapan City, Oriental Mindoro 5200', note: 'A beach resort destination that provides a coastal setting for relaxation, private gatherings, and special events.' },
    { name: 'VillAgueda Events Place', address: 'Comunal, Calapan City, Oriental Mindoro 5200', note: 'An events venue suitable for celebrations, family gatherings, and other special occasions.' },
    { name: 'Villa Marina (Parang)', address: 'Brgy. Parang, Calapan City, Oriental Mindoro 5200', note: 'A venue in Parang offering a setting for relaxation and private gatherings.' },
    { name: 'Mahalta Resorts and Convention Center (Parang)', address: 'Brgy. Parang, Calapan City, Oriental Mindoro 5200', note: 'A resort and convention venue that can serve as a destination for leisure, group gatherings, and special events.', image: mahaltaResortImage },
    { name: 'Cuidad Garden Resort and Conference Center', address: 'C56C+XRR, Brgy. Tibag, Calapan City, Oriental Mindoro 5200', note: 'A resort and conference venue offering a setting for relaxation, meetings, and organized gatherings.', image: cuidadGardenResortImage },
    { name: 'Casa Estela Boutique Hotel & Cafe', image: casaEstelaImage, note: 'A boutique accommodation with a caf?, combining a relaxing place to stay with a convenient dining and coffee experience.' },
    { name: 'Parang Beach Resort (events area)', address: 'C677+M94, Brgy. Parang, Calapan City, Oriental Mindoro 5200', note: 'A coastal venue in Parang where visitors can enjoy the beach setting and arrange gatherings or special occasions.' },
  ],
  'Farm Tourism': [
    { name: 'Coco Farm Resort (Canubing I)', address: 'Brgy. Canubing I, Calapan City, Oriental Mindoro 5200', note: 'A farm-themed resort destination where visitors can enjoy a countryside atmosphere and spend time away from the busy city.', image: cocoFarmResortImage },
    { name: "Arsenia's Hapag Kainan sa Kabukiran (farm-to-table: fish pond and crab farm, view of Mt. Halcon)", address: '85MC+2WX, Strong Republic Nautical Highway, Calapan City, Oriental Mindoro 5200', note: 'A farm tourism destination in Calapan City.' },
    { name: 'Amaliso Farm & Resort (Sitio Bilolo)', address: 'Sitio Bilolo, Calapan City, Oriental Mindoro 5200', note: 'A farm and resort destination where visitors can experience a rural environment and enjoy a relaxing outdoor escape.' },
    { name: 'Il Lago FDJ Farm (Tawagan Rd.)', address: 'Tawagan Road, Brgy. Tawagan, Calapan City, Oriental Mindoro 5200', note: 'A farm destination where visitors can appreciate a countryside setting and explore its agricultural surroundings.' },
    { name: 'Sapul Orchard', address: 'Brgy. Sapul, Calapan City, Oriental Mindoro 5200', note: 'An orchard destination where visitors can appreciate fruit-growing areas and experience a refreshing farm environment.' },
    { name: 'Parang Coconut and Banana Plantations', address: 'Brgy. Parang, Calapan City, Oriental Mindoro 5200', note: 'Agricultural areas in Parang where visitors can appreciate local farming landscapes and learn about coconut and banana cultivation.' },
  ],
  'Historical Sites': [
    { name: 'Calapan City Plaza', note: 'One of the city\'s central public spaces, suitable for relaxing, meeting friends, and experiencing local community life.' },
    { name: 'Casa Real Ruins', address: 'Old Provincial Capitol Complex, Brgy. Ibaba East, Calapan City, Oriental Mindoro 5200', note: 'A historical site that preserves remnants of an important former government building and offers a glimpse into Calapan\'s past.', image: casaRealRuinsImage },
    { name: 'Old City Hall (now the Heritage, Culture, and Arts Building)', address: 'Brgy. Ibaba East, Calapan City, Oriental Mindoro 5200', note: 'A heritage structure that represents part of Calapan\'s civic history and serves as a place for cultural and artistic activities.', image: heritageCultureArtsBuildingImage },
    { name: 'Calapan Tamaraw Welcome Arch (city boundary)', address: 'Calapan City boundary along the Strong Republic Nautical Highway, Oriental Mindoro 5200', note: 'A landmark welcoming visitors to Calapan City, featuring the tamaraw as a symbol associated with Mindoro.' },
  ],
  'Hotels & Accommodations': [
    { name: 'Filipiniana Resort & Hotel (Sto. Niño)', image: filipinianaResortImage, note: 'A place to stay in Calapan City. Verify availability and rates before booking.' },
    { name: 'Casa Estela Boutique Hotel & Cafe', image: casaEstelaImage, note: 'A boutique accommodation with a caf?, combining a relaxing place to stay with a convenient dining and coffee experience.' },
    { name: 'Casa Alberto (Camilmil)', address: 'Calapan Town Center Complex, J.P. Rizal Street, 364 Gozar Street, Brgy. Camilmil, Calapan City, Oriental Mindoro 5200', note: 'An accommodation facility in Camilmil where guests can find a place to stay during their visit to Calapan.' },
    { name: 'Calapan Bay Hotel', address: 'Brgy. Salong, Calapan City, Oriental Mindoro 5200', note: 'A hotel in Calapan City offering accommodation for travelers, visitors, and guests.' },
    { name: 'Achimie Hotel', address: 'J.P. Rizal Street, Calapan City, Oriental Mindoro 5200. Plus Code: C56H+JQJ', image: achimieHotelImage, note: 'A local hotel providing accommodation for guests visiting or staying in Calapan City.' },
    { name: "Agua's Hotel", address: 'Calapan City, Oriental Mindoro 5200', note: 'Exact street and barangay address not confirmed.', image: aguasHotelImage },
    { name: "Destiny's Place Hotel/Inn (Lumangbayan)", address: 'Camia Street, Brgy. Lumangbayan, Calapan City, Oriental Mindoro 5200', note: 'A place to stay in Calapan City. Verify availability and rates before booking.' },
    { name: 'HuanYing Hotel (Juan Luna)', image: huanyingHotelImage, note: 'A hotel in the Juan Luna area offering lodging for visitors and travelers.' },
    { name: "Nikita's Place Hotel (Tawiran)", address: '348 National Highway, Brgy. Tawiran, Calapan City, Oriental Mindoro 5200', note: 'A place to stay in Calapan City. Verify availability and rates before booking.' },
    { name: 'Cuidad Garden Resort and Conference Center', address: 'Brgy. Tibag, Calapan City, Oriental Mindoro 5200. Plus Code: C56C+XRR', image: cuidadGardenResortImage, note: 'A resort and conference venue offering a setting for relaxation, meetings, and organized gatherings.' },
    { name: 'Bulalo Mangrove Inn', address: 'C544+MQR, Calapan City, Oriental Mindoro 5200', note: 'A local inn offering accommodation for visitors exploring Calapan and its nearby destinations.', image: bulaloMangroveInnImage },
    { name: "4C's Room Rental, Apartment, Hotel and Transient (Jasmin St.)", image: fourCRoomRentalImage, note: 'A place to stay in Calapan City. Verify availability and rates before booking.' },
    { name: 'Golden Paradise Inn', address: 'Calapan City, Oriental Mindoro 5200', note: 'A local inn providing a place to stay for travelers and visitors in Calapan City.', image: goldenParadiseInnImage },
    { name: 'Calapan Hotel House', address: 'Maple Village, Calapan City, Oriental Mindoro 5200', note: 'A house-style accommodation option for guests looking for a place to stay in the city.' },
    { name: 'Calapan City House Transient/Rental', address: 'Maple Village, Calapan City, Oriental Mindoro 5200', note: 'A transient rental property offering temporary accommodation for visitors and short-term guests.' },
    { name: 'Calapan City Transient House (Blk 52 Lot 41)', address: 'Blk. 52 Lot 41, Calapan City, Oriental Mindoro 5200', note: 'A residential-style transient accommodation intended for guests who need a temporary place to stay.' },
    { name: 'Calapan City Transient House/Staycation/Hotel', address: 'Calapan City, Oriental Mindoro 5200', note: 'A staycation and transient lodging option for visitors looking for temporary accommodation.' },
    { name: 'Calapan Mindoro Transient Apartments (Villa Arce)', address: 'Villa Arce, Calapan City, Oriental Mindoro 5200', note: 'An apartment-style accommodation offering temporary lodging for travelers, families, and guests.' },
    { name: 'Calapan Cheapest House Transient', address: 'Calapan City, Oriental Mindoro 5200', note: 'A budget-oriented transient lodging option for visitors seeking an affordable place to stay.' },
    { name: 'Burj Calapan (San Vicente)', address: 'San Vicente, Calapan City, Oriental Mindoro 5200', note: 'A local accommodation option in San Vicente for guests visiting or staying in Calapan City.', image: burjCalapanImage },
    { name: 'Domini Hotel', address: 'Calapan City, Oriental Mindoro 5200', note: 'A hotel accommodation option for travelers and visitors looking for a place to stay in Calapan.' },
    { name: 'Blue Harbor Inn', address: 'Brgy. San Antonio, Calapan City, Oriental Mindoro 5200', note: 'A local inn offering lodging for guests who need accommodation during their visit to the city.', image: blueHarborInnImage },
    { name: 'Bimas Inn', address: '95R8+G94, National Highway, Brgy. Tawiran, Calapan City, Oriental Mindoro 5200', note: 'An inn providing a place for travelers and visitors to rest during their stay in Calapan.' },
  ],
  'Islands & Islets': [
    { name: 'Silonay Island / Islet', address: 'Offshore, Brgy. Silonay, Calapan City, Oriental Mindoro 5200', note: 'A small island or islet destination associated with the coastal environment of Silonay, offering opportunities to appreciate the area\'s natural scenery.' },
    { name: 'Aganhao / Aganahaw Islet', address: 'Offshore, Brgy. Lazareto, Calapan City, Oriental Mindoro 5200', image: agahaoIsletImage, note: 'A coastal islet where visitors can appreciate the natural surroundings and marine landscape of Calapan.' },
    { name: 'Baco-Chico Islets', note: 'A group of small coastal landforms that contribute to the scenic island and marine environment near Calapan.', image: bacoChicoIsletsImage },
  ],
  'Marine Sanctuaries': [
    { name: 'Harka Piloto Fish Sanctuary', address: 'Offshore, Brgy. Lazareto, Calapan City, Oriental Mindoro 5200', note: 'A protected marine area in Silonay that supports local marine life and promotes awareness of coastal and aquatic conservation.' },
    { name: 'Mahal na Pangalan Marine Park', address: 'Coastal area, Brgy. Mahal na Pangalan, Calapan City, Oriental Mindoro 5200', note: 'A marine conservation area that highlights the importance of protecting coastal resources and preserving aquatic habitats.' },
  ],
  'Museums & Heritage': [
    { name: 'Oriental Mindoro Heritage Museum', address: 'Old Provincial Capitol Complex, Brgy. Ibaba East, Calapan City, Oriental Mindoro 5200', note: 'A museum where visitors can learn about the history, culture, heritage, and identity of Oriental Mindoro through its exhibits and collections.' },
    { name: 'Calapan City Heritage, Culture, and Arts Building', address: 'Brgy. Ibaba East, Calapan City, Oriental Mindoro 5200', note: 'A cultural and heritage facility that highlights the city\'s history, local identity, and artistic activities.' },
    { name: 'Mangyan Heritage Center (Calero and new location in Sto. Niño)', address: 'St. Augustine Building, Sto. Niño Street, Brgy. Ibaba East, Calapan City, Oriental Mindoro 5200', image: mangyanHeritageCenterImage, note: 'A heritage site in Calapan City.' },
    { name: 'Balai Mindoro (guided tour of crafts)', address: 'Strong Republic Nautical Highway, Calapan City, Oriental Mindoro 5200', image: balaiMindoroImage, note: 'A cultural destination where visitors can learn about local craftsmanship and appreciate traditional and contemporary products inspired by Mindoro\'s culture.' },
  ],
  'Nature & Eco-Tourism': [
    { name: 'Silonay Mangrove Conservation Ecopark', address: 'C62F+7XX, Barangay Silonay Road, Brgy. Silonay, Calapan City, Oriental Mindoro 5200', note: 'An eco-tourism destination where visitors can explore mangrove surroundings and learn about the importance of protecting coastal ecosystems.' },
    { name: 'Bulusan Park', address: 'Brgy. Bulusan, Calapan City, Oriental Mindoro 5200', note: 'A green outdoor destination where visitors can enjoy nature, relax, and spend time in a peaceful environment.' },
    { name: 'Baruyan River', address: 'Brgy. Baruyan, Calapan City, Oriental Mindoro 5200', note: 'A natural river destination surrounded by local landscapes, suitable for appreciating nature and exploring the area\'s waterways.' },
    { name: 'Caluangan Lake', address: 'Brgy. Tawagan, Calapan City, Oriental Mindoro 5200 (exact sitio not confirmed)', image: caluanganLakeImage, note: 'A peaceful natural destination surrounded by scenic landscapes, ideal for nature appreciation, sightseeing, and outdoor exploration.' },
    { name: 'Silonay–Navotas–Maidlang Marshes', address: 'Brgy. Silonay, Brgy. Navotas, and Brgy. Maidlang, Calapan City, Oriental Mindoro 5200', note: 'A nature destination in Calapan City for outdoor and eco-tourism visits.' },
  ],
  Pharmacies: [
    { name: 'Mercury Drug – Rizal Leuterio', note: '88 J.P. Rizal Street, San Vicente East, Calapan City, Oriental Mindoro. A well-known Philippine pharmacy chain offering prescription medicines, over-the-counter medications, vitamins, supplements, and personal healthcare products.' },
    { name: 'Mercury Drug – Mabini', note: 'Mabini Street, corner Rizal Street, Calapan City, Oriental Mindoro. A community pharmacy providing prescription medicines, generic and branded medications, vitamins, and other everyday healthcare essentials.' },
    { name: 'Mercury Drug – Puregold', note: 'Puregold, Rizal Street, Brgy. Camilmil, Calapan City, Oriental Mindoro. A convenient pharmacy branch where customers can purchase medicines, vitamins, personal care products, and basic healthcare essentials.' },
    { name: 'Mercury Drug – Xentro Mall', note: 'Xentro Mall, Roxas Drive, Calapan City, Oriental Mindoro. A mall-based pharmacy offering prescription medicines, over-the-counter medications, vitamins, and healthcare products.' },
    { name: 'Mercury Drug – Juan Luna', note: 'Public Market, Juan Luna Street, Calapan City, Oriental Mindoro. A conveniently located pharmacy serving customers around the public market with medicines and everyday health essentials.' },
    { name: 'Generika Drugstore – One Luna', note: 'Near Chowking, Calapan Public Market, Juan Luna, San Vicente Central, Calapan City. A community pharmacy known for affordable generic medicines, prescription drugs, vitamins, and healthcare essentials.' },
    { name: 'Generika Drugstore – San Vicente', note: 'Juan Luna Street, San Vicente, Calapan City, Oriental Mindoro. A neighborhood drugstore focusing on accessible and affordable generic medicines and basic healthcare products.' },
    { name: 'Southstar Drug – Neo Xevera', note: 'Calapan Town Center, Neo Xevera, Nautical Highway, Lumangbayan, Calapan City. A retail pharmacy offering prescription medicines, over-the-counter drugs, vitamins, supplements, and personal healthcare products.' },
    { name: 'Southstar Drug – Nuciti Central', note: 'Ground Floor, Nuciti Central, Brgy. Camilmil, Calapan City. A mall-based pharmacy providing medicines, vitamins, wellness products, and other healthcare essentials.' },
    { name: 'Southstar Drug – JP Rizal', note: 'J.P. Rizal Street, Calapan City, Oriental Mindoro. A community drugstore offering prescription medications, over-the-counter medicines, and everyday health products.' },
    { name: 'Rose Pharmacy', note: 'Ground Floor, Gaisano Capital Calapan, Tawiran, Calapan City. A retail pharmacy providing prescription medicines, vitamins, supplements, personal care products, and other health essentials.' },
    { name: 'Watsons City Mall', note: 'Ground Floor, CityMall Calapan, A. Bonifacio corner Roxas Drive. A health and beauty retail store offering personal care products, vitamins, selected medicines, skincare, and wellness essentials.' },
    { name: 'TGP – Xentro Mall', note: 'Ground Floor, Xentro Mall, Roxas Drive, Sto. Niño, Calapan City. A pharmacy specializing in affordable generic medicines, prescription drugs, and basic healthcare products.' },
    { name: 'TGP – San Vicente', note: 'Good Morning Trading Jr., J.P. Rizal Street, San Vicente, Calapan City. A community pharmacy providing affordable generic medication options and everyday healthcare essentials.' },
    { name: 'TGP – Lalud', note: 'Brgy. Lalud, Calapan City, Oriental Mindoro. A neighborhood pharmacy offering generic medicines and affordable healthcare options for local residents.' },
    { name: 'Pharmaplus Meds Inc.', note: 'J.P. Rizal Street, corner A. Bonifacio Street, Calapan City. A local pharmacy providing medicine and healthcare-related products for residents and customers in Calapan City.' },
    { name: 'Farmacia ni Dok', note: 'UNITOP, Roxas Drive, Calapan City. A local pharmacy listing that serves customers looking for medicines and basic healthcare supplies.' },
    { name: 'Farmacia Caballero', note: 'J. Luna Street, Calapan City. A local drugstore serving the community with access to medicines and common healthcare necessities.' },
    { name: 'Hillside Pharmacy', note: 'C5 Road, Calapan City. A community pharmacy providing access to medicines and everyday healthcare products.' },
    { name: 'Panopio Pharmacy', note: 'C5 Road, Calapan City. A local pharmacy listing intended to serve nearby residents looking for medicines and basic health essentials.' },
    { name: 'Justines Pharmacy', note: 'Serrano Street, Calapan City. A neighborhood drugstore providing access to common medicines and healthcare necessities.' },
    { name: 'GZ Drugstore', note: 'Strong Republic Nautical Highway, Calapan City. A privately operated local drugstore serving customers who need medicines and everyday healthcare products.' },
    { name: 'Docmed Pharmacy', note: 'Baruyan, Calapan City. A community pharmacy serving residents in Baruyan and nearby areas with access to medicines and healthcare essentials.' },
    { name: 'ExtremeXcience Incorporated', note: 'Nautical Highway, Libis, Calapan City. A pharmacy listing located along the Nautical Highway, serving customers looking for medicine and healthcare-related products.' },
    { name: 'LNC Pharmacy', note: '342 J.P. Rizal Street, corner Sampaga Street, Brgy. Tawiran, Calapan City. A privately owned local drugstore serving the community with access to pharmaceutical and healthcare products.' },
    { name: 'Checacio General Merchandise and Pharmacy', note: 'Bucayao, Calapan City. A local general merchandise and pharmacy establishment serving residents with retail goods and pharmacy-related products.' },
    { name: 'Oriental21 Pharmacy', note: '012 J.P. Rizal Street, Brgy. Tawiran, Calapan City. A registered drugstore in Calapan City providing pharmaceutical services and access to medicines.' },
    { name: 'Sandugo Mindoro Drug Corporation', note: 'Public Market, Juan Luna Street, Calapan City. A local pharmaceutical business located near the public market, serving customers looking for medicines and healthcare products.' },
    { name: 'Boticard Pharmacy', note: 'Calapan City, Oriental Mindoro. A local pharmacy listing that provides an additional option for residents seeking medicines and basic healthcare needs.' },
    { name: 'St. Mary Pharmacy', note: 'National Road, Poblacion, Calapan City. A neighborhood pharmacy listing intended to serve residents and customers in the Poblacion area.' },
    { name: 'Megalife Drugstore', note: '23 Leuterio Street, Calapan City, Oriental Mindoro. A local drugstore providing access to medicines and other pharmaceutical products for the community.' },
    { name: 'Botika ng Lalawigan Oriental Mindoro', note: 'Encarnacion Street, Calapan City. A local public-oriented pharmacy listing intended to support access to affordable medicines and healthcare necessities.' },
  ],
  'Colleges & Universities': [
    { name: 'City College of Calapan', note: 'Barangay Guinobatan, Calapan City, Oriental Mindoro, Philippines. A public, city-run higher education institution that provides college programs in education, hospitality management, tourism management, information systems, library and information science, and public administration.' },
    { name: 'Divine Word College of Calapan', note: 'Governor Infantado Street, Santa Maria Village, Calapan City, Oriental Mindoro, Philippines. A private Catholic educational institution offering undergraduate and graduate programs in fields such as business, education, engineering, hospitality and tourism, information technology, and other disciplines.' },
    { name: 'Mindoro State University – Calapan City Campus', note: 'Masipit, along Strong Republic Nautical Highway, Calapan City, Oriental Mindoro, Philippines. A public state university campus offering higher education programs in areas such as information technology, criminology, psychology, tourism management, and teacher education.' },
    { name: 'Southwestern College of Maritime, Business and Technology, Inc.', note: 'Quezon Drive, Barangay Calero, Calapan City, Oriental Mindoro, Philippines. A private educational institution offering maritime, business, technology, and hospitality-related education. It also provides skills-based and technical training programs.' },
    { name: 'St. Anthony College of Calapan City, Inc.', note: 'J.P. Rizal Street, Calapan City, Oriental Mindoro, Philippines. A private higher education institution that provides college and career-oriented educational programs.' },
    { name: 'Luna Goco Colleges, Inc.', note: 'J.P. Rizal Street, Barangay Lalud, Calapan City, Oriental Mindoro, Philippines. A private educational institution in Calapan City offering higher education and professional programs.' },
    { name: 'ACLC College of Calapan', note: 'RLA Building, Sitio Putol, Barangay Santa Isabel, Calapan City, Oriental Mindoro, Philippines. Part of the AMA Education System, offering college programs in fields such as information technology and business administration, with an emphasis on technology-based and career-oriented education.' },
    { name: 'Saint Augustine Seminary', note: 'Mahogany Road, Barangay Suqui, Calapan City, Oriental Mindoro, Philippines. A religious educational institution associated with the Diocese of Calapan, providing seminary formation and religious education.' },
  ],
  'Private Elementary School': [
    { name: 'Calapan Chu Eng School, Inc.', address: 'Araceli Luna Street area, Barangay Ilaya, Calapan City, Oriental Mindoro 5200. A private basic education school offering elementary learning, academic instruction, language enrichment, and values formation' },
    { name: 'Divine Word College of Calapan – Grade School Department', address: 'Governor Infantado Street, Calapan City, Oriental Mindoro 5200. The elementary department of a Catholic educational institution providing academic instruction, values formation, and holistic student development' },
    { name: 'Fruits of Faith School, Inc.', address: 'Calapan City, Oriental Mindoro 5200. A faith-based educational institution providing foundational education and values-oriented learning for children' },
    { name: "Heaven's Crown Christian School, Inc.", address: 'Calapan City, Oriental Mindoro 5200', note: 'Provides Christian-oriented education and academic learning in a values-centered environment.' },
    { name: 'Holy Infant Academy', address: 'A. Bonifacio Street, Barangay Ibaba East, Calapan City, Oriental Mindoro 5200. A Catholic educational institution offering basic education, academic development, and values formation' },
    { name: 'Jesus Is Lord Colleges Foundation, Inc.', address: 'Calapan City, Oriental Mindoro 5200', note: 'Provides faith-based education and academic learning opportunities for students. Confirm the current grade levels offered with the school.' },
    { name: "Little Angels of Mary Immaculate Children's House", address: 'Calapan City, Oriental Mindoro 5200', note: 'Provides a nurturing learning environment focused on early childhood development and foundational education.' },
    { name: 'Maranatha Christian Academy Foundation Calapan City, Inc.', address: 'M. Roxas Drive, Calapan City, Oriental Mindoro 5200. A private Christian school providing academic learning and values-based education for children' },
    { name: 'Mindoro Christian Montessori, Inc.', address: 'Calapan City, Oriental Mindoro 5200', note: 'Provides a Montessori-inspired learning environment that encourages independence, creativity, and active participation in learning.' },
    { name: 'Misericordia Dei Catholic School', address: 'Barangay Baruyan, Calapan City, Oriental Mindoro 5200. A Catholic educational institution providing basic education and values-centered learning for children' },
    { name: 'Nethsville Academy', address: 'Calapan City, Oriental Mindoro 5200', note: 'Provides private basic education and academic learning opportunities for children.' },
    { name: 'Rose of Sharon Learning Center', address: 'Calapan City, Oriental Mindoro 5200', note: 'Offers foundational learning and educational support for young learners.' },
    { name: 'San Lorenzo Ruiz Academy of Calapan City, Inc.', address: '226 Ubas Street, Barangay Lalud, Calapan City, Oriental Mindoro 5200. A private educational institution offering early childhood and elementary-level learning in a values-oriented environment' },
    { name: 'Southfields Educational Foundation Phils., Inc.', address: 'Calapan City, Oriental Mindoro 5200. A private educational institution offering basic education. Confirm the current elementary grade levels and campus address directly with the school' },
    { name: 'The Lovelace Academy', address: 'Calapan City, Oriental Mindoro 5200', note: 'Provides private basic education and academic learning opportunities for elementary and junior high school students.' },
    { name: 'Wood Dale Academy, Inc.', address: 'Calapan City, Oriental Mindoro 5200. A private educational institution offering basic education and learning opportunities for children' },
  ],
  'Private High School': [
    { name: 'Divine Word College of Calapan – Basic Education Department', address: 'Barangay Tibag, Calapan City, Oriental Mindoro 5200. A Catholic educational institution providing secondary education, academic development, values formation, and opportunities for holistic student growth' },
    { name: 'Holy Infant Academy', address: 'A. Bonifacio Street, Barangay Ibaba East, Calapan City, Oriental Mindoro 5200. A Catholic school offering secondary education and values-centered learning' },
    { name: 'Luna Goco Colleges, Inc.', address: 'J.P. Rizal Street, Barangay Lalud, Calapan City, Oriental Mindoro 5200. A private educational institution with a Basic Education Department offering secondary education, including senior high school academic and TVL tracks' },
    { name: 'Southfields Educational Philippines, Inc.', address: 'Calapan City, Oriental Mindoro 5200. A private educational institution offering senior high school programs that prepare students for college education, employment, and future career opportunities' },
    { name: 'ACLC College of Calapan', address: 'Sitio Putol, Barangay Sta. Isabel, Calapan City, Oriental Mindoro 5200', note: 'Provides senior high school education with academic and technical-vocational learning opportunities.' },
    { name: 'Southwestern College of Maritime, Business and Technology, Inc. (SCMBT)', address: 'Quezon Drive, Barangay Calero, Calapan City, Oriental Mindoro 5200', note: 'Offers senior high school programs and career-oriented education, with opportunities in maritime, business, technology, and technical-vocational fields.' },
    { name: 'Advanced Skills Training and Education Services, Inc.', address: 'Calapan City, Oriental Mindoro 5200', note: 'Provides technical-vocational education and skills training to help learners develop practical competencies for employment and career development.' },
    { name: 'St. Anthony College Calapan City, Inc.', address: 'Calapan City, Oriental Mindoro 5200. A private educational institution offering higher and secondary education programs, including academic and technical-vocational learning opportunities' },
  ],
  'Public Elementary School': [
    { name: 'Adriatico Memorial School', address: 'Leuterio Street, Barangay San Vicente South, Calapan City, Oriental Mindoro 5200. A public elementary school providing basic education, literacy, numeracy, and values formation for young learners' },
    { name: 'Balingayan Elementary School', address: 'Barangay Balingayan, Calapan City, Oriental Mindoro 5200', note: 'Provides elementary education and foundational learning for children in the Balingayan community.' },
    { name: 'Baruyan Elementary School', address: 'Barangay Baruyan, Calapan City, Oriental Mindoro 5200. A government elementary school serving children in Baruyan through basic academic instruction and learning activities' },
    { name: 'Batino Elementary School', address: 'Barangay Batino, Calapan City, Oriental Mindoro 5200', note: 'Provides basic elementary education and helps learners develop essential academic and social skills.' },
    { name: 'Bayanan I Elementary School', address: 'Barangay Bayanan I, Calapan City, Oriental Mindoro 5200', note: 'Offers elementary education and foundational learning for children in the Bayanan I community.' },
    { name: 'Bayanan II Elementary School', address: 'Barangay Bayanan II, Calapan City, Oriental Mindoro 5200', note: 'Provides basic education and learning opportunities for elementary pupils.' },
    { name: 'Biga Elementary School', address: 'Barangay Biga, Calapan City, Oriental Mindoro 5200', note: 'Offers elementary education focused on developing children’s reading, writing, mathematics, and other essential skills.' },
    { name: 'Bucayao Elementary School', address: 'Barangay Bucayao, Calapan City, Oriental Mindoro 5200', note: 'Provides basic education for children in Bucayao and supports their academic and personal development.' },
    { name: 'Buhuan Elementary School', address: 'Barangay Buhuan, Calapan City, Oriental Mindoro 5200. A community public school offering elementary education and foundational learning' },
    { name: 'Bulusan Elementary School', address: 'Barangay Bulusan, Calapan City, Oriental Mindoro 5200', note: 'Provides elementary education and learning activities that help children build essential knowledge and skills.' },
    { name: 'Caguisikan Elementary School', address: 'A. Bonifacio Street area, Barangay Gutad, Calapan City, Oriental Mindoro 5200', note: 'Offers basic education for elementary learners and supports their academic development.' },
    { name: 'Calapan Central School', address: 'M. Adriatico Street area, Calapan City, Oriental Mindoro 5200. A public central school providing elementary education and foundational academic instruction for children in Calapan City' },
    { name: 'Camansihan Elementary School', address: 'Barangay Camansihan, Calapan City, Oriental Mindoro 5200', note: 'Provides basic elementary education and learning opportunities for children in the community.' },
    { name: 'Camilmil Central School', address: 'Governor Ignacio Street, Barangay Camilmil, Calapan City, Oriental Mindoro 5200. A public central school offering elementary education and activities that support children’s academic and personal growth' },
    { name: 'Canubing I Elementary School', address: 'Barangay Canubing I, Calapan City, Oriental Mindoro 5200', note: 'Provides elementary education and foundational learning for children in Canubing I.' },
    { name: 'Canubing II Elementary School', address: 'Centro, Barangay Canubing II, Calapan City, Oriental Mindoro 5200', note: 'Offers basic education and academic learning opportunities for children in Canubing II.' },
    { name: 'Filemon Samaco Memorial School', address: 'Barangay Comunal, Calapan City, Oriental Mindoro 5200. A public school providing elementary education and foundational learning for children' },
    { name: 'Guinobatan Elementary School', address: 'Barangay Guinobatan, Calapan City, Oriental Mindoro 5200', note: 'Provides elementary education and supports children’s development through basic academic subjects and school activities.' },
    { name: 'Gutad Elementary School', address: 'Barangay Gutad, Calapan City, Oriental Mindoro 5200', note: 'Offers basic education and foundational learning for elementary pupils in the Gutad community.' },
    { name: 'Ibaba Elementary School', address: 'Barangay Ibaba West, Calapan City, Oriental Mindoro 5200. A government elementary school providing basic academic instruction and learning opportunities for children' },
    { name: 'Lalud Elementary School', address: 'Sunkist Street, Barangay Lalud, Calapan City, Oriental Mindoro 5200', note: 'Provides elementary education and helps children develop essential academic and social skills.' },
    { name: 'Lazareto Elementary School', address: 'Barangay Lazareto, Calapan City, Oriental Mindoro 5200', note: 'Offers basic education and foundational learning for children in the Lazareto community.' },
    { name: 'M. Kalaw Memorial School', address: 'Calapan City, Oriental Mindoro 5200', note: 'Provides elementary education and supports learners in developing their basic knowledge and skills.' },
    { name: 'M. Pesig Memorial Elementary School', address: 'Caimito Street, Barangay Gulod, Calapan City, Oriental Mindoro 5200. A public elementary school offering basic education and academic learning for children' },
    { name: 'Ma. Estrella PVG Tawiran Elementary School', address: 'Daisy Street, Barangay Tawiran, Calapan City, Oriental Mindoro 5200', note: 'Provides elementary education and foundational learning for children in the Tawiran community.' },
    { name: 'Maidlang Elementary School', address: 'Barangay Maidlang, Calapan City, Oriental Mindoro 5200', note: 'Offers basic education and learning opportunities for elementary pupils.' },
    { name: 'Malad Elementary School', address: 'Barangay Malad, Calapan City, Oriental Mindoro 5200', note: 'Provides elementary education and helps children develop their academic and personal skills.' },
    { name: 'Malamig Elementary School', address: 'Barangay Malamig, Calapan City, Oriental Mindoro 5200', note: 'Offers foundational education and basic academic instruction for children.' },
    { name: 'Managpi Elementary School', address: 'Barangay Managpi, Calapan City, Oriental Mindoro 5200', note: 'Provides basic education and learning opportunities for children in Managpi.' },
    { name: 'Masipit Elementary School', address: 'Barangay Masipit, Calapan City, Oriental Mindoro 5200', note: 'Offers elementary education and foundational learning for pupils in the Masipit community.' },
    { name: 'N. Aboboto Memorial School', address: 'Calapan City, Oriental Mindoro 5200', note: 'Provides basic education and academic learning opportunities for elementary pupils.' },
    { name: 'Nag-Iba Elementary School', address: 'Barangay Nag-Iba, Calapan City, Oriental Mindoro 5200', note: 'Offers elementary education and foundational learning for children in Nag-Iba.' },
    { name: 'Navotas Elementary School', address: 'Barangay Navotas, Calapan City, Oriental Mindoro 5200', note: 'Provides basic education and helps children develop their reading, writing, mathematics, and communication skills.' },
    { name: 'P. Tolentino Memorial School', address: 'Calapan City, Oriental Mindoro 5200', note: 'Offers elementary education and learning activities that support children’s academic development.' },
    { name: 'Parang Elementary School', address: 'Barangay Parang, Calapan City, Oriental Mindoro 5200', note: 'Provides basic education for children in Parang and supports their foundational learning.' },
    { name: 'Patas Elementary School', address: 'Barangay Patas, Calapan City, Oriental Mindoro 5200', note: 'Offers elementary education and academic learning opportunities for children in the community.' },
    { name: 'Personas Elementary School', address: 'F. del Rosario Street, Barangay Personas, Calapan City, Oriental Mindoro 5200. A public elementary school providing basic education and learning opportunities for children in Personas' },
    { name: 'Salong Elementary School', address: 'Quezon Drive, Barangay Salong, Calapan City, Oriental Mindoro 5200', note: 'Provides elementary education and foundational academic learning for children.' },
    { name: 'San Antonio Elementary School', address: 'Rizal Street area, Calapan City, Oriental Mindoro 5200', note: 'Offers basic education and learning activities for elementary pupils.' },
    { name: 'Silonay Elementary School', address: 'Barangay Silonay, Calapan City, Oriental Mindoro 5200', note: 'Provides elementary education for children in Silonay and supports their academic development.' },
    { name: 'Sta. Cruz Elementary School', address: 'Barangay Sta. Cruz, Calapan City, Oriental Mindoro 5200', note: 'Offers foundational education and basic academic learning for children in the community.' },
    { name: 'Sta. Isabel Elementary School', address: 'Barangay Sta. Isabel, Calapan City, Oriental Mindoro 5200', note: 'Provides elementary education and learning opportunities for children in Sta. Isabel.' },
    { name: 'Sta. Rita Elementary School', address: 'Barangay Sta. Rita, Calapan City, Oriental Mindoro 5200', note: 'Offers basic education and helps elementary pupils develop essential academic skills.' },
    { name: 'Sto. Niño Elementary School', address: 'Barangay Sto. Niño, Calapan City, Oriental Mindoro 5200', note: 'Provides elementary education and foundational learning for children in the Sto. Niño community.' },
    { name: 'Suqui Elementary School', address: 'Barangay Suqui, Calapan City, Oriental Mindoro 5200', note: 'Offers basic education and academic learning opportunities for elementary pupils.' },
    { name: 'Tawagan Elementary School', address: 'Barangay Tawagan, Calapan City, Oriental Mindoro 5200', note: 'Provides elementary education and foundational learning for children in Tawagan.' },
    { name: 'Teresa C. Montellano Memorial School', address: 'Leuterio Street, Calapan City, Oriental Mindoro 5200. A public elementary school providing basic education and academic development for young learners' },
    { name: 'Villa Antonio Elementary School', address: 'Villa Antonio, Calapan City, Oriental Mindoro 5200', note: 'Offers elementary education and foundational learning for children in the Villa Antonio community.' },
    { name: 'Wawa Elementary School', address: 'Barangay Wawa, Calapan City, Oriental Mindoro 5200', note: 'Provides basic education and learning opportunities for children in the Wawa community.' },
  ],
  'Public High School': [
    { name: 'Oriental Mindoro National High School (OMNHS)', address: 'J.P. Rizal Street, Barangay San Vicente East, Calapan City, Oriental Mindoro 5200. A public secondary school offering junior and senior high school education with academic and specialized learning opportunities' },
    { name: 'Canubing National High School', address: 'Barangay Canubing I, Calapan City, Oriental Mindoro 5200', note: 'Provides secondary education for students from Grades 7 to 12, with Academic and Technical-Vocational-Livelihood (TVL) learning tracks.' },
    { name: 'Bucayao National High School', address: 'Barangay Bucayao, Calapan City, Oriental Mindoro 5200', note: 'Offers junior and senior high school education, helping students develop academic knowledge and practical skills.' },
    { name: 'Ceriaco A. Abes Memorial National High School', address: 'Barangay Mahal na Pangalan, Calapan City, Oriental Mindoro 5200', note: 'Provides secondary education and learning opportunities that support students’ academic and personal development.' },
    { name: 'Community Vocational High School', address: 'Barangay Masipit, Calapan City, Oriental Mindoro 5200', note: 'Provides secondary education with emphasis on practical, technical, and vocational learning.' },
    { name: 'Managpi National High School', address: 'Barangay Managpi, Calapan City, Oriental Mindoro 5200', note: 'Offers secondary education and academic programs for students in Managpi and nearby communities.' },
    { name: 'Nag-Iba National High School', address: 'Barangay Nag-Iba II, Calapan City, Oriental Mindoro 5200', note: 'Provides junior and senior high school education and helps learners develop knowledge and skills for higher education and future careers.' },
    { name: 'Parang National High School', address: 'Barangay Parang, Calapan City, Oriental Mindoro 5200', note: 'Offers secondary education and academic learning opportunities for students in Parang and neighboring communities.' },
    { name: 'Pedro V. Panaligan Memorial National High School', address: 'Barangay Comunal, Calapan City, Oriental Mindoro 5200', note: 'Provides junior and senior high school education, supporting students through academic instruction and school-based learning activities.' },
    { name: 'Personas National High School', address: 'Barangay Personas, Calapan City, Oriental Mindoro 5200. A public secondary school providing junior high school education and foundational academic learning for students in the Personas community' },
    { name: 'Arturo Arce Ignacio Integrated School', address: 'Barangay Lazareto, Calapan City, Oriental Mindoro 5200. An integrated public school providing elementary and junior high school education' },
    { name: 'Mindoro State University Laboratory High School – Calapan City Campus', address: 'Masipit Highway, Barangay Masipit, Calapan City, Oriental Mindoro 5200. A laboratory high school under Mindoro State University providing junior and senior high school programs, including the Academic track' },
  ],
  'Parks & Recreation': [
    { name: 'Plaza del Gobernador / Liwasan ng Mamamayan (dancing fountain)', address: 'Brgy. Ibaba East, Calapan City, Oriental Mindoro 5200', note: 'A public recreational area where visitors can relax, enjoy the open space, and watch the dancing fountain when operating.' },
    { name: 'Calapan City Plaza', note: 'One of the city\'s central public spaces, suitable for relaxing, meeting friends, and experiencing local community life.' },
    { name: 'Kalap Civic Park', address: 'Calapan City, Oriental Mindoro 5200', note: 'A public recreational space intended for relaxation, outdoor activities, and community gatherings.' },
    { name: 'Bulusan Park', address: 'Brgy. Bulusan, Calapan City, Oriental Mindoro 5200', note: 'A green outdoor destination where visitors can enjoy nature, relax, and spend time in a peaceful environment.' },
    { name: 'MinSU Calapan Campus Manmade Lake and Development Park', address: 'Mindoro State University, Strong Republic Nautical Highway, Brgy. Masipit, Calapan City, Oriental Mindoro 5200', note: 'A campus destination featuring a manmade lake and landscaped surroundings where visitors can appreciate the outdoor environment.' },
  ],
  'Public Markets': [
    { name: 'Calapan City Public Market', address: 'C57H+GFF, Calapan City, Oriental Mindoro 5200', image: calapanCityPublicMarketImage, note: 'A major local marketplace where visitors can explore stalls selling fresh produce, seafood, meat, daily necessities, and other local goods.' },
    { name: 'Night market around Calapan City Plaza', address: 'Around Calapan City Plaza, Brgy. Ibaba East, Calapan City, Oriental Mindoro 5200', note: 'A nighttime marketplace where visitors can explore food stalls, local vendors, and available products while enjoying the city\'s evening atmosphere.', image: calapanNightMarketImage },
  ],
  'Restaurants & Eateries': CURATED_RESTAURANT_LISTINGS,
  Resorts: [
    { name: 'Anahaw Island View Resort (Balite)', address: 'Brgy. Balite, Calapan City, Oriental Mindoro 5200', note: 'A resort destination in Balite where guests can enjoy a relaxing stay and appreciate the surrounding coastal scenery.' },
    { name: 'Parang Beach Resort (Parang)', address: 'Brgy. Parang, Calapan City, Oriental Mindoro 5200', note: 'A beach resort in Parang offering a coastal setting for relaxation and seaside leisure.' },
    { name: 'Czeascape Beach Resort', address: 'C576+XW3, Leuterio, Brgy. Balite, Calapan City, Oriental Mindoro 5200', note: 'A beach resort destination that provides a coastal setting for relaxation, private gatherings, and special events.' },
    { name: 'Playa Ignacio Resort', address: 'Block 4, Brgy. Pachoca, Calapan City, Oriental Mindoro 5200', note: 'A resort destination in Calapan where guests can enjoy leisure time and a relaxing resort atmosphere.' },
    { name: 'El Pueblo Rhizort', address: 'C563+2J3, Brgy. Mahal na Pangalan, Calapan City, Oriental Mindoro 5200', note: 'A local resort destination offering a place for guests to unwind and enjoy recreational time.' },
    { name: 'Mahalta Resorts and Convention Center (Parang)', address: 'Brgy. Parang, Calapan City, Oriental Mindoro 5200', note: 'A resort and convention venue that can serve as a destination for leisure, group gatherings, and special events.', image: mahaltaResortImage },
    { name: "Eduardo's Resort (Bayanan II)", address: 'Strong Republic Nautical Highway, Brgy. Bayanan II, Calapan City, Oriental Mindoro 5200', note: 'A public market in Calapan City.' },
    { name: 'La Estancia Resort', address: 'Calapan City, Oriental Mindoro 5200', note: 'A resort destination offering guests a place to relax and enjoy a break from their daily routine.' },
    { name: 'El Huerto Private Resort (Malamig)', address: 'Brgy. Malamig, Calapan City, Oriental Mindoro 5200', note: 'A private resort in Malamig offering a setting for exclusive gatherings and leisure activities.' },
    { name: 'Coco Farm Resort (Canubing I)', address: 'Brgy. Canubing I, Calapan City, Oriental Mindoro 5200', note: 'A farm-themed resort destination where visitors can enjoy a countryside atmosphere and spend time away from the busy city.', image: cocoFarmResortImage },
    { name: 'EverLand Lake Resort (Baruyan)', address: 'Sitio Ibaba, Brgy. Baruyan, Calapan City, Oriental Mindoro 5200', note: 'A lake-oriented resort destination in Baruyan where guests can enjoy a relaxing outdoor environment.' },
    { name: 'Eden Lakeview Resort (Baruyan)', address: 'Sitio Centro, Brgy. Baruyan, Calapan City, Oriental Mindoro 5200', note: 'A resort in Baruyan offering a lakeview setting for visitors seeking a peaceful place to unwind.' },
    { name: "Inay's Place Resort (spring-water pools)", address: 'Mahabang Bakod, bago mag-Arko ng Comunal, Brgy. Biga, Calapan City, Oriental Mindoro 5200', note: 'A public market in Calapan City.' },
    { name: 'Casa Alberto (indoor pool)', note: 'An accommodation and leisure destination in Camilmil with an indoor pool facility.' },
    { name: 'Amaliso Farm & Resort', address: 'Sitio Bilolo, Calapan City, Oriental Mindoro 5200', note: 'A farm and resort destination where visitors can enjoy a rural atmosphere and outdoor relaxation.' },
    { name: 'VillAgueda Events Place', address: 'Comunal, Calapan City, Oriental Mindoro 5200', note: 'An events venue suitable for celebrations, family gatherings, and other special occasions.' },
    { name: 'Filipiniana Resort & Hotel', image: filipinianaResortImage, note: 'A resort and hotel destination offering accommodation and leisure facilities for visitors.' },
    { name: 'Aganhaw Beach Resort', address: 'Calapan City, Oriental Mindoro 5200', note: 'A beach resort destination where visitors can enjoy the coastal surroundings and a relaxing seaside atmosphere.' },
    { name: 'Calapan Bayside Resort', address: 'Calapan City, Oriental Mindoro 5200', note: 'A bayside resort destination where guests can appreciate coastal scenery and enjoy leisure time.' },
  ],
  'Shopping Malls': [
    { name: 'Nuciti Central Mall Calapan', address: 'J.P. Rizal Street, Brgy. Camilmil, Calapan City, Oriental Mindoro 5200', image: nucitiMallImage, note: 'A shopping destination where visitors can find retail stores, services, and convenient shopping options.' },
    { name: 'Citimart Island Mall', address: 'C57H+5VC, J.P. Rizal Street, Calapan City, Oriental Mindoro 5200', image: citimartIslandMallImage, note: 'A mall offering shopping and everyday essentials for residents and visitors in Calapan City.' },
    { name: 'CityMall Calapan', address: 'A. Bonifacio Street corner Roxas Drive, Brgy. Ilaya, Calapan City, Oriental Mindoro 5200', image: cityMallCalapanImage, note: 'A community shopping mall where visitors can explore retail shops, food options, and everyday services.' },
    { name: 'Xentro Mall Calapan', address: 'C53M+6QF, Roxas Drive, Brgy. Lumangbayan, Calapan City, Oriental Mindoro 5200', image: xentroMallCalapanImage, note: 'A shopping and lifestyle destination featuring retail stores, dining options, and entertainment establishments.' },
    { name: 'Gaisano Capital Calapan', address: '95V8+2RV, Strong Republic Nautical Highway, Brgy. Tawiran, Calapan City, Oriental Mindoro 5200', image: gaisanoCapitalCalapanImage, note: 'A shopping destination where customers can browse merchandise, purchase daily necessities, and enjoy convenient shopping.' },
  ],
  'Souvenir Shops': [
    { name: "Merl's Native Delicacies (Lumangbayan)", address: 'Roxas Drive, Brgy. Lumangbayan, Calapan City, Oriental Mindoro 5200', note: 'A shop in Calapan City offering souvenirs or local goods.' },
    { name: 'Small Creation Souvenirs by Bennett Dan Gamban', address: 'Aboboto Street corner Aguinaldo Street, Brgy. San Vicente East, Calapan City, Oriental Mindoro 5200', note: 'A souvenir shop featuring locally made creations and keepsakes that visitors can purchase as reminders of their trip.' },
    { name: 'AnikAnik (Paras Drive)', note: 'A local shop where visitors can browse small items, accessories, and possible souvenir finds.' },
    { name: 'Mindoro Souvenir', address: 'C5GV+WX6, Calapan City, Oriental Mindoro 5200', note: 'A souvenir destination where visitors can look for keepsakes and items inspired by Mindoro.', image: mindoroSouvenirShopImage },
  ],
  'Swimming Pools': [
    { name: "Eduardo's Resort", note: 'A resort or leisure destination in Calapan City.' },
    { name: 'Coco Farm Resort', note: 'A farm-themed resort with swimming facilities listed as an attraction for visitors seeking recreation and relaxation.' },
    { name: "Inay's Place Resort", note: 'A resort or leisure destination in Calapan City.' },
    { name: 'Casa Alberto (indoor pool, day pass)', note: 'A leisure destination offering an indoor pool option for guests, subject to the property\'s day-pass arrangements.' },
    { name: 'La Estancia Resort', note: 'A resort destination offering guests a place to relax and enjoy a break from their daily routine.' },
    { name: 'El Pueblo Rhizort', note: 'A local resort destination offering a place for guests to unwind and enjoy recreational time.' },
    { name: 'Playa Ignacio Resort', note: 'A resort destination in Calapan where guests can enjoy leisure time and a relaxing resort atmosphere.' },
    { name: 'Czeascape Beach Resort', note: 'A beach resort destination that provides a coastal setting for relaxation, private gatherings, and special events.' },
    { name: 'EverLand Lake Resort', note: 'A lake resort destination listed for swimming and outdoor leisure activities.' },
    { name: 'Eden Lakeview Resort', note: 'A resort destination listed for swimming and relaxation in a lakeview setting.' },
    { name: 'El Huerto Private Resort', note: 'A private resort listed for swimming and exclusive group or family gatherings.' },
    { name: 'VillAgueda Events Place', note: 'An events venue suitable for celebrations, family gatherings, and other special occasions.' },
    { name: 'Mahalta Resorts and Convention Center', note: 'A resort destination listed for swimming and leisure activities, subject to facility availability.' },
  ],
  'Tourist Spots': [
    { name: 'Oriental Mindoro Heritage Museum', note: 'A museum where visitors can learn about the history, culture, heritage, and identity of Oriental Mindoro through its exhibits and collections.' },
    { name: 'Plaza del Gobernador', note: 'A public landmark and gathering area where visitors can relax and enjoy the open space and nearby city surroundings.' },
    { name: 'Calapan City Plaza', note: 'One of the city\'s central public spaces, suitable for relaxing, meeting friends, and experiencing local community life.' },
    { name: 'Sto. Niño Cathedral', note: 'The cathedral church serving the Catholic community in Calapan City.' },
    { name: 'Bulusan Park', note: 'A green outdoor destination where visitors can enjoy nature, relax, and spend time in a peaceful environment.' },
    { name: 'Silonay Mangrove Conservation Ecopark', note: 'An eco-tourism destination where visitors can explore mangrove surroundings and learn about the importance of protecting coastal ecosystems.' },
    { name: 'Harka Piloto Fish Sanctuary', note: 'A protected marine area in Silonay that supports local marine life and promotes awareness of coastal and aquatic conservation.' },
    { name: 'Lazareto Beach', note: 'A coastal destination where visitors can enjoy the sea breeze, seaside views, and a relaxing beach atmosphere.' },
    { name: 'Jolly Waves Waterpark', note: 'A water recreation destination in Sapul where visitors can enjoy water-based activities and a fun day out.' },
    { name: 'Mangyan Heritage Center', image: mangyanHeritageCenterImage, note: 'A cultural destination where visitors can learn about the traditions, crafts, and heritage of Mindoro\'s Mangyan communities.' },
    { name: 'Calapan Tamaraw Welcome Arch', note: 'A recognizable city landmark that welcomes visitors and represents the tamaraw, an important symbol of Mindoro.' },
  ],
  Waterparks: [
    { name: 'Jolly Waves Waterpark and Resort (Sapul)', address: 'Brgy. Sapul, Calapan City, Oriental Mindoro 5200', note: 'A waterpark and resort destination in Sapul where visitors can enjoy water attractions, swimming, and recreational activities.' },
    { name: "Eduardo's Resort (slides and fountain play pool)", note: 'Strong Republic Nautical Highway, Brgy. Bayanan II, Calapan City, Oriental Mindoro 5200 (same location as Eduardo\'s Resort).' },
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
const barangayHintNames = [
  'San Vicente East', 'San Vicente', 'Bayanan I', 'Bayanan II', 'Canubing I', 'Sto. Niño',
  'San Antonio', 'Mahal na Pangalan', 'Lumangbayan', 'Camilmil', 'Tawiran', 'Silonay',
  'Pachoca', 'Parang', 'Suqui', 'Bulusan', 'Balite', 'Calero', 'Lalud', 'Ibaba East',
  'Ibaba West', 'Ilaya', 'Bayanan', 'Canubing', 'Baruyan', 'Malamig', 'Sapul', 'Gozar',
  'Del Pilar', 'Ubas',
].sort((a, b) => b.length - a.length);

const streetHintNames = [
  'Roxas Drive', 'Roxas Dr.', 'Bonifacio Street', 'Bonifacio St.', 'Quezon Drive', 'Quezon Dr.',
  'Tawagan Road', 'Tawagan Rd.', 'Ramirez Street', 'Ramirez St.', 'Jasmin Street', 'Jasmin St.',
  'Gov. Ignacio Street', 'Gov. Ignacio St.', 'Gov. Ignacio', 'Juan Luna Street', 'Juan Luna St.',
  'Juan Luna', 'JP Rizal Street', 'JP Rizal St.', 'JP Rizal', 'Paras Drive', 'C5 Road', 'C5 Rd.',
].sort((a, b) => b.length - a.length);

const areaHintNames = [
  'Calapan Town Center', 'Filipiniana Complex', 'Xentro Mall', 'Harka Piloto', 'Calapan City Plaza',
  'Nuciti', 'SMV', 'MND Bldg.', 'Sitio Bilolo', 'Villa Arce', ...streetHintNames, ...barangayHintNames,
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

function findHint(names: string[], ...values: string[]): string | null {
  for (const value of values) {
    for (const name of names) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = value.match(new RegExp(`(?:^|[^\\p{L}\\p{N}])(${escaped})(?=$|[^\\p{L}\\p{N}])`, 'iu'));
      if (match) return match[1];
    }
  }
  return null;
}

function findAreaHint(...values: string[]): string | null {
  return findHint(areaHintNames, ...values);
}

function hasStreetAddress(address: string): boolean {
  return /\b(?:street|st\.|road|rd\.|avenue|ave\.|drive|dr\.|highway|hwy\.|boulevard|blvd\.|lane|ln\.|block|blk\.|lot)\b/i.test(address);
}

function composeAddress(street: string | null, barangay: string | null, fallback: string | null): string | null {
  if (street && barangay && !street.toLocaleLowerCase().includes(barangay.toLocaleLowerCase())) {
    return formatFullAddress(`${street}, Brgy. ${barangay}`);
  }
  if (street) return formatFullAddress(street);
  if (barangay) return formatFullAddress(`Brgy. ${barangay}`);
  if (fallback) return formatFullAddress(fallback);
  return null;
}

function addressFromNote(note: string): string | null {
  const trimmed = note.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(/\s+(?=(?:Exact|Plus Code|Name also|Another listing|Barangay references|Subdivision|Street and|Building|Unit|Older listing|Verify)\b)/);
  return (parts[0] || trimmed).trim().replace(/[.]+$/, '');
}

export function getExploreListingLocation(
  listing: ExploreListing,
  category = listing.category ?? '',
  knownPlace?: RideDestination,
): ExploreListingLocation {
  const placeId = getExploreListingId(listing.name, category);
  const place = knownPlace ?? rideDestinations.find((candidate) => candidate.id === placeId);
  const noteAddress = listing.address?.trim() || (listing.note ? addressFromNote(listing.note) : null);
  const sourceTexts = [listing.name, listing.address ?? '', listing.note ?? '', place?.name ?? '', place?.address ?? ''];
  const barangay = findHint(barangayHintNames, ...sourceTexts);
  const street = findHint(streetHintNames, ...sourceTexts);
  const plusCode = /\b[A-Z0-9]{4}\+[A-Z0-9]{2,3}\b/.test(listing.address ?? listing.note ?? '') || /\b[A-Z0-9]{4}\+[A-Z0-9]{2,3}\b/.test(place?.address ?? '');

  if (noteAddress && !isGeneralCityAddress(noteAddress) && (/\b(?:brgy\.|barangay|street|st\.|road|rd\.|avenue|ave\.|drive|dr\.|highway|hwy\.|unit|floor|building|compound|complex|subdivision|village|sitio|plus code)\b/i.test(noteAddress) || plusCode || barangay || street)) {
    return { label: hasStreetAddress(noteAddress) || plusCode || barangay ? 'Address' : 'Area', value: formatFullAddress(noteAddress) };
  }

  if (place && place.address && !isGeneralCityAddress(place.address)) {
    const explicitStreet = hasStreetAddress(place.address) || street;
    const explicitBarangay = /\b(?:barangay|brgy\.)\b/i.test(place.address) || barangay;
    if (explicitStreet && explicitBarangay) {
      return { label: 'Address', value: formatFullAddress(place.address) };
    }
    if (explicitStreet || explicitBarangay) {
      return { label: 'Address', value: formatFullAddress(place.address) };
    }
    return { label: 'Area', value: formatFullAddress(place.address) };
  }

  const composed = composeAddress(street, barangay, findAreaHint(...sourceTexts));
  if (composed) return { label: barangay && street ? 'Address' : 'Area', value: composed };

  return { label: 'Area', value: 'Calapan City, Oriental Mindoro (verify exact address)' };
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
