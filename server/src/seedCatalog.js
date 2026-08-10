import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pool } from './src/config/db.js';

const UPLOADS = 'E:/ecom/server/uploads';
const BASE = 'https://images.unsplash.com';

const newCategories = [
  { name: 'Footwear', slug: 'footwear', featured: 1, featured_order: 4, img: 'photo-1449505278894-297fdb3edbc1' },
  { name: 'Sports & Outdoors', slug: 'sports-outdoors', featured: 1, featured_order: 5, img: 'photo-1461896836934-ffe607ba8211' },
  { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', featured: 1, featured_order: 6, img: 'photo-1596462502278-27bfdc403348' },
  { name: 'Toys & Games', slug: 'toys-games', featured: 0, featured_order: 0, img: 'photo-1558060370-d644479cb6f7' },
  { name: 'Furniture', slug: 'furniture', featured: 0, featured_order: 0, img: 'photo-1493663284031-b7e3aefcae8e' },
  { name: 'Accessories', slug: 'accessories', featured: 1, featured_order: 7, img: 'photo-1553062407-98eeb64c6a62' },
];

const newBrands = [
  'Apple', 'Dell', 'HP', 'LG', 'OnePlus', 'boAt', 'Canon', 'Anker', 'Logitech',
  'Amazon', 'H&M', 'Zara', "Levi's", 'Timberland', 'Fossil', 'Ray-Ban', 'Puma',
  'Philips', 'Prestige', 'Nivea', "L'Oreal", 'Decathlon', 'Yonex', 'LEGO',
  'Hasbro', 'IKEA', 'Reebok',
];

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const P = (name, cat, brand, price, stock, sold, return_days, desc, imgs) => ({
  name, slug: slugify(name), cat, brand, price, stock, sold, return_days, desc, imgs,
});

const products = [
  P('Samsung Galaxy Smartphone', 'electronics', 'Samsung', 699.99, 30, 120, 14, '6.7-inch AMOLED display with 108MP triple camera and 5000mAh battery.',
    ['photo-1511707171634-5f897ff02aa9', 'photo-1592750475338-74b7b21085ab', 'photo-1598327105666-5b89351aff97']),
  P('Ultrabook Laptop 14"', 'electronics', 'Dell', 1099.99, 18, 45, 30, 'Featherlight 14-inch ultrabook with 16GB RAM, 512GB SSD and all-day battery.',
    ['photo-1496181133206-80ce9b88a853', 'photo-1517336714731-489689fd1ca8', 'photo-1593642632823-8f785ba67e45']),
  P('10.9-inch Tablet', 'electronics', 'Apple', 449.99, 22, 60, 14, 'Retina display tablet with fast processor and 10-hour battery.',
    ['photo-1544244015-0df4b3ffc6b0', 'photo-1561154464-82e9adf32764', 'photo-1587033411391-5d9e51cce126']),
  P('Wireless Earbuds Pro', 'electronics', 'boAt', 59.99, 55, 200, 14, 'True wireless earbuds with active noise cancellation and 30h playback.',
    ['photo-1590658268037-6bf12165a8df', 'photo-1574944985070-8f3ebc6b79d2', 'photo-1606220945770-b5b6c2c55bf1']),
  P('55-inch 4K Smart TV', 'electronics', 'LG', 649.99, 12, 30, 30, '4K UHD smart TV with HDR10+, built-in streaming and voice control.',
    ['photo-1593359677879-a4bb92f829d1', 'photo-1461151304267-38535e780c79', 'photo-1601944177325-f8867652837f']),
  P('Gaming Console', 'electronics', 'Sony', 499.99, 10, 55, 14, 'Next-gen gaming console with ray tracing, 4K@120fps and SSD storage.',
    ['photo-1606813907291-d86efa9b94db', 'photo-1552820728-8b83bb6b773f', 'photo-1598550476439-6847785fcea6']),
  P('DSLR Camera Body', 'electronics', 'Canon', 749.99, 8, 25, 30, '24MP DSLR with 4K video, articulating touchscreen and Wi-Fi.',
    ['photo-1516035069371-29a1b244cc32', 'photo-1526170375885-4d8ecf77b99f', 'photo-1502920917128-1aa500764cbd']),
  P('20000mAh Power Bank', 'electronics', 'Anker', 29.99, 80, 150, 14, 'Fast-charging 20000mAh power bank with dual USB-C ports.',
    ['photo-1615529182904-14819c35db37', 'photo-1609091839311-d5365f9ff1c5', 'photo-1618414074975-38db3a3a8a72']),
  P('RGB Mechanical Keyboard', 'electronics', 'Logitech', 89.99, 35, 90, 30, 'Hot-swappable mechanical keyboard with per-key RGB and aluminum frame.',
    ['photo-1587829741301-dc798b83add3', 'photo-1618384887929-16ec33fab9ef', 'photo-1595044426077-d36d9236d54a']),
  P('Wireless Mouse', 'electronics', 'Logitech', 29.99, 70, 130, 14, 'Silent click wireless mouse with 2.4GHz and Bluetooth.',
    ['photo-1527864550417-7fd91fc51a46', 'photo-1593580946534-8cfbfb8a5352', 'photo-1600269452121-4f2416e55c28']),
  P('27-inch QHD Monitor', 'electronics', 'LG', 199.99, 15, 40, 30, '27-inch QHD IPS monitor with 99% sRGB and height-adjustable stand.',
    ['photo-1527443224154-c4a3942d3acf', 'photo-1549490349-8643362247b5', 'photo-1616763355603-9755a640a287']),
  P('Smart Home Speaker', 'electronics', 'Amazon', 99.99, 25, 70, 14, 'Smart speaker with voice assistant, room-filling sound and Zigbee hub.',
    ['photo-1589492477829-5e65395b66cc', 'photo-1545454675-3531b543be5d', 'photo-1558089687-f282ffcbc126']),

  P('Pullover Hoodie', 'clothing', 'H&M', 39.99, 45, 85, 30, 'Comfy brushed-back fleece hoodie with drawstring hood and kangaroo pocket.',
    ['photo-1556821840-3a63f95609a7', 'photo-1620799140408-edc6dcb6d633', 'photo-1556821833-5d97f74a44e8']),
  P("Slim Fit Denim Jeans", 'clothing', "Levi's", 49.99, 40, 75, 30, 'Classic slim-fit jeans in stretch denim with 5-pocket styling.',
    ['photo-1542272604-787c3835535d', 'photo-1576995853123-5a10305d93c0', 'photo-1604176354204-9268737828e4']),
  P('Formal Shirt', 'clothing', 'Zara', 34.99, 50, 95, 30, 'Crisp slim-fit formal shirt in breathable cotton for office and events.',
    ['photo-1596755094514-f87e34085b2c', 'photo-1602810318383-e386cc2a3ccf', 'photo-1594938298603-c8148c4dae35']),
  P('Winter Parka Coat', 'clothing', 'Timberland', 129.99, 12, 20, 45, 'Insulated parka coat with faux-fur hood, water-resistant shell.',
    ['photo-1539533018447-63fcce2678e3', 'photo-1544022613-e87ca75a784a', 'photo-1539533158780-8d8a8d5c8d8c']),
  P('Baseball Cap', 'clothing', 'Nike', 14.99, 90, 180, 14, 'Classic 6-panel baseball cap with embroidered logo and adjustable strap.',
    ['photo-1521369909029-2afed882baee', 'photo-1588850561407-ed78c282e89b', 'photo-1534215754734-18e55d13e346']),
  P('Wool Blend Scarf', 'clothing', 'H&M', 19.99, 60, 60, 30, 'Soft wool-blend scarf with fringe trim to keep you warm in style.',
    ['photo-1520903920243-00d872a2d1c9', 'photo-1601924994987-69e26d50dc26', 'photo-1519869325930-281384150729']),
  P('Chronograph Wrist Watch', 'clothing', 'Fossil', 199.99, 10, 18, 30, 'Stainless steel chronograph watch with leather strap and 100m water resistance.',
    ['photo-1524805444758-089113d48a6d', 'photo-1548171915-e79f38d76d7e', 'photo-1522312346375-d1a52e2b99b3']),
  P('Aviator Sunglasses', 'clothing', 'Ray-Ban', 89.99, 20, 40, 30, 'Classic aviator sunglasses with polarized lenses and UV400 protection.',
    ['photo-1511499767150-a48a237f0083', 'photo-1572635196237-14b3f281503f', 'photo-1512343879784-a960bf40e7f9']),

  P('Clean Code Handbook', 'books', 'Generic', 39.99, 25, 40, 7, 'A handbook of agile software craftsmanship — write maintainable code.',
    ['photo-1544716278-ca5e3f4abd8c', 'photo-1512820790803-83ca734da794', 'photo-1495446815901-a7297e633e8d']),
  P('Deep Work: Rules for Focused Success', 'books', 'Generic', 24.99, 30, 35, 7, 'How to succeed in a distracted world by cultivating deep focus.',
    ['photo-1495446815901-a7297e633e8d', 'photo-1544716278-ca5e3f4abd8c', 'photo-1524995997946-a1c2e315a42f']),
  P('The Lean Startup', 'books', 'Generic', 27.99, 20, 50, 7, 'How today\'s entrepreneurs use continuous innovation to create radically successful businesses.',
    ['photo-1507842217343-583bb7270b66', 'photo-1544716278-ca5e3f4abd8c', 'photo-1512820790803-83ca734da794']),
  P('Harry Potter and the Sorcerer\'s Stone', 'books', 'Generic', 19.99, 40, 210, 7, 'The beloved fantasy classic that started it all — a boy wizard\'s first year at Hogwarts.',
    ['photo-1550399105-c4db5fb85c18', 'photo-1587876931567-564ce588bfbd', 'photo-1512820790803-83ca734da794']),

  P('500W Mixer Blender', 'home-kitchen', 'Philips', 49.99, 28, 55, 45, '500W blender with 1.5L jar, 4 stainless blades and smoothie program.',
    ['photo-1570222094114-d054a817e56b', 'photo-1604605802922-f98ff19e6b20', 'photo-1556912173-3bb406ef7e77']),
  P('2-Slice Toaster', 'home-kitchen', 'Philips', 29.99, 35, 48, 45, 'Stainless 2-slice toaster with 7 browning settings and removable crumb tray.',
    ['photo-1516750105099-4b3a5af03d64', 'photo-1607613009820-a29f7bb81c04', 'photo-1495474472287-4d71bcdd2085']),
  P('Automatic Rice Cooker', 'home-kitchen', 'Prestige', 39.99, 25, 65, 45, '5-cup non-stick rice cooker with keep-warm function and steamer basket.',
    ['photo-1590794056226-79ef3a8147e1', 'photo-1586201375761-83865001e8ac', 'photo-1607478900766-efe13248b125']),
  P('Electric Kettle', 'home-kitchen', 'Prestige', 24.99, 40, 88, 45, '1.7L stainless electric kettle with auto shut-off and boil-dry protection.',
    ['photo-1594385208974-2e75f8d7bb48', 'photo-1553259400-4ab595ac83f6', 'photo-1495474472287-4d71bcdd2085']),
  P('Digital Air Fryer 5L', 'home-kitchen', 'Philips', 119.99, 15, 32, 45, '5L digital air fryer with 8 presets, rapid air circulation and 90% less oil.',
    ['photo-1603054635582-443af5e2b4c5', 'photo-1585515320310-259814833e62', 'photo-1590301157890-4810ed352733']),
  P('Stainless Cutlery Set (24 pc)', 'home-kitchen', 'Generic', 34.99, 30, 42, 45, '24-piece mirror-polished stainless steel cutlery set with storage tray.',
    ['photo-1585032226651-759b368d7246', 'photo-1603283638221-ef8f7d6090db', 'photo-1545833651-1e3a7a6b6c1a']),
  P('Dinnerware Set (16 pc)', 'home-kitchen', 'Generic', 59.99, 18, 28, 45, '16-piece porcelain dinnerware set for 4 — plates, bowls, cups and saucers.',
    ['photo-1577803645773-f96470509666', 'photo-1605244863941-3a3a9212c2d8', 'photo-1600080972464-8e5f35f63d08']),
  P('Microwave Oven 28L', 'home-kitchen', 'LG', 89.99, 14, 36, 45, '28L convection microwave oven with grill, auto-cook menus and child lock.',
    ['photo-1556911220-bff31c812dba', 'photo-1586271851240-8689a55e528b', 'photo-1504674900247-0877df9cc836']),

  P('Daily Face Moisturizer', 'beauty-personal-care', 'Nivea', 19.99, 60, 110, 14, 'Lightweight daily moisturizer with SPF 15 for all skin types.',
    ['photo-1556228720-195a672e8a03', 'photo-1620916566398-39f1143ab7be', 'photo-1556229014-6c3f2c9bb8f7']),
  P('Eau de Parfum 100ml', 'beauty-personal-care', "L'Oreal", 59.99, 22, 55, 30, 'Long-lasting floral-woody fragrance with notes of jasmine and sandalwood.',
    ['photo-1541643600914-78b084683601', 'photo-1523293182086-7651a899d37f', 'photo-1594035910387-fea47794261f']),
  P('Electric Hair Trimmer', 'beauty-personal-care', 'Philips', 49.99, 25, 70, 14, 'Cordless trimmer with 20 length settings, washable heads and 90min runtime.',
    ['photo-1621607512214-68297480165e', 'photo-1585747860715-2ba37e788b70', 'photo-1600289031464-74d657b5ae45']),
  P('Nourishing Shampoo 500ml', 'beauty-personal-care', "L'Oreal", 12.99, 100, 160, 14, 'Sulfate-free nourishing shampoo for smooth, shiny and frizz-free hair.',
    ['photo-1556228578-8c89e6adf883', 'photo-1607006166039-2d70ee44ecf5', 'photo-1620916566398-39f1143ab7be']),
  P('Matte Lipstick', 'beauty-personal-care', "L'Oreal", 15.99, 70, 95, 14, 'Rich matte lipstick with intense color payoff and all-day wear.',
    ['photo-1586495777744-4413f21062fa', 'photo-1599736493126-0d6c9c69f9e0', 'photo-1586941754895-2e1f8c6e8f8c']),
  P('Sunscreen Lotion SPF 50', 'beauty-personal-care', 'Nivea', 14.99, 80, 130, 14, 'Broad-spectrum SPF 50 sunscreen with 48h hydration, water resistant.',
    ['photo-1607604276583-eef5d076aa5f', 'photo-1556228720-195a672e8a03', 'photo-1616683693504-3ea7e9ad6fec']),

  P('Anti-Slip Yoga Mat', 'sports-outdoors', 'Decathlon', 29.99, 50, 100, 14, 'Extra-thick non-slip yoga mat with carrying strap and alignment lines.',
    ['photo-1592432678016-e910b452f9a2', 'photo-1544367567-0f2fcb009e0b', 'photo-1506126613408-eca07ce68773']),
  P('Adjustable Dumbbell Set', 'sports-outdoors', 'Yonex', 59.99, 20, 38, 30, 'Space-saving adjustable dumbbells from 5kg to 25kg with locking base.',
    ['photo-1638536532686-d610adfc8e5c', 'photo-1583454110551-21f2fa2afe61', 'photo-1541534741688-6078c6bfb5c5']),
  P('Folding Treadmill', 'sports-outdoors', 'Decathlon', 899.99, 5, 12, 30, 'Foldable treadmill with incline, shock absorption and Bluetooth speakers.',
    ['photo-1571019613454-1cb2f99b2d8b', 'photo-1554147090-e1221a04a025', 'photo-1574680096145-d05b474e2155']),
  P('Mountain Bike 26"', 'sports-outdoors', 'Decathlon', 349.99, 7, 22, 30, 'Dual-suspension mountain bike with 21-speed gear and disc brakes.',
    ['photo-1485965120184-e220f721d03e', 'photo-1505705694340-019e1e335916', 'photo-1532298229144-0ec0c57515c7']),
  P('Camping Tent 4-Person', 'sports-outdoors', 'Decathlon', 89.99, 15, 26, 30, 'Waterproof 4-person camping tent with built-in LED lighting and carry bag.',
    ['photo-1478131143081-80f7f84ca84d', 'photo-1504280390367-361c6d9f38f4', 'photo-1537565266759-34bbc16be345']),
  P('Insulated Steel Water Bottle', 'sports-outdoors', 'Nike', 24.99, 65, 140, 14, '750ml double-wall vacuum bottle keeps drinks cold 24h or hot 12h.',
    ['photo-1602143407151-7111542de6e8', 'photo-1571008887538-b36bb32f4571', 'photo-1602143407151-7111542de6e8']),

  P('LEGO City Police Station', 'toys-games', 'LEGO', 79.99, 14, 45, 14, 'Buildable police station playset with 5 minifigures and 862 pieces.',
    ['photo-1587654780291-39c9404d746b', 'photo-1596461404969-9ae70f2830c1', 'photo-1584824486509-112e4181ff6b']),
  P('Monopoly Board Game', 'toys-games', 'Hasbro', 29.99, 30, 80, 14, 'The classic property trading game — family favorite for ages 8+.',
    ['photo-1610890716171-6b1bb98ffd09', 'photo-1614608682850-e0d6ed316d47', 'photo-1606167668584-78701c57f13d']),
  P('1000-Piece Jigsaw Puzzle', 'toys-games', 'Generic', 14.99, 40, 55, 14, 'Beautiful 1000-piece landscape jigsaw puzzle with poster guide.',
    ['photo-1589656966895-2f33e7653819', 'photo-1594565808171-2b3a8a4c4a14', 'photo-1558919751-b1c3dbdf7f8d']),
  P('Remote Control Race Car', 'toys-games', 'Generic', 39.99, 22, 60, 14, 'High-speed 1:16 RC race car with 2.4GHz controller and 30min runtime.',
    ['photo-1594787318286-3d835c1d207f', 'photo-1591696331111-ef9586a5b17a', 'photo-1518049362265-d5b2a6467637']),
  P('Wooden Chess Set', 'toys-games', 'Generic', 24.99, 18, 33, 14, 'Handcrafted wooden chess set with felt-lined box and 15-inch board.',
    ['photo-1586165369502-1a245eac42c8', 'photo-1595981267035-7b04ca84a82d', 'photo-1543155937-01b39f5e42c7']),

  P('Ergonomic Office Chair', 'furniture', 'IKEA', 189.99, 10, 15, 30, 'Mesh-back ergonomic chair with lumbar support, headrest and 4D armrests.',
    ['photo-1580480055273-228ff5388ef8', 'photo-1592078615290-033ee584e267', 'photo-1592840496694-26d035b52b48']),
  P('Wooden Bookshelf 5-Tier', 'furniture', 'IKEA', 129.99, 8, 20, 30, 'Solid pine 5-tier bookshelf with ample storage for books and decor.',
    ['photo-1594620302200-9a762244a156', 'photo-1507842217343-583bb7270b66', 'photo-1567016432779-094069958ea5']),
  P('LED Desk Lamp', 'furniture', 'Philips', 39.99, 30, 50, 14, 'Dimmable LED desk lamp with 3 color modes and USB charging port.',
    ['photo-1507473885765-e6ed057f782c', 'photo-1513506003901-1e6a229e2d15', 'photo-1527689363764-4116d1f8dc0d']),
  P('3-Seater Fabric Sofa', 'furniture', 'IKEA', 699.99, 4, 8, 45, 'Comfortable 3-seater fabric sofa with washable covers and steel legs.',
    ['photo-1555041469-a586c61ea9bc', 'photo-1493663284031-b7e3aefcae8e', 'photo-1540574163026-643ea20ade25']),

  P('Travel Backpack 40L', 'accessories', 'Puma', 49.99, 35, 75, 14, 'Water-resistant 40L travel backpack with laptop sleeve and USB port.',
    ['photo-1553062407-98eeb64c6a62', 'photo-1622560480605-d83c853bc5c3', 'photo-1581605405669-fcdf81165afa']),
  P('Genuine Leather Wallet', 'accessories', 'Fossil', 34.99, 28, 62, 30, 'Full-grain leather bifold wallet with RFID blocking and 8 card slots.',
    ['photo-1627123424574-724758594e93', 'photo-1606503159155-4cad0dcd7528', 'photo-1556821840-3a63f95609a7']),
  P('Wayfarer Sunglasses', 'accessories', 'Ray-Ban', 99.99, 16, 34, 30, 'Iconic wayfarer sunglasses with premium acetate frame and polarized lenses.',
    ['photo-1511499767150-a48a237f0083', 'photo-1572635196237-14b3f281503f', 'photo-1584030373081-f37b7bb4fa8e']),
  P('Full-Grain Leather Belt', 'accessories', 'Timberland', 24.99, 32, 44, 30, 'Classic reversible leather belt with brushed steel buckle.',
    ['photo-1624222247344-550fb60583dc', 'photo-1602810318383-e386cc2a3ccf', 'photo-1624222247344-550fb60583dc']),
];

async function download(id, out) {
  const url = `${BASE}/${id}?w=900&h=900&fit=crop&q=80`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 3000) return false;
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
  if (!isJpeg) return false;
  await writeFile(out, buf);
  return true;
}

async function pickImages(slug, candidates) {
  const urls = [];
  for (let slot = 0; slot < candidates.length; slot++) {
    const id = candidates[slot];
    const file = join(UPLOADS, `product-${slug}-${slot + 1}.jpg`);
    if (await download(id, file)) urls.push(`/uploads/product-${slug}-${slot + 1}.jpg`);
    else console.log(`  !! ${slug} slot ${slot + 1} failed (${id})`);
  }
  return urls;
}

await mkdir(UPLOADS, { recursive: true });

const catIds = {};
for (const c of [...[{ name: 'Electronics', slug: 'electronics' }, { name: 'Clothing', slug: 'clothing' }, { name: 'Books', slug: 'books' }, { name: 'Home & Kitchen', slug: 'home-kitchen' }], ...newCategories]) {
  const img = c.img ? `/uploads/cat-${c.slug}.jpg` : undefined;
  if (c.img) {
    const file = join(UPLOADS, `cat-${c.slug}.jpg`);
    if (await download(c.img, file)) console.log(`cat ${c.slug} image OK`);
    else console.log(`cat ${c.slug} image FAILED`);
  }
  await pool.query(
    `INSERT INTO categories (name, slug, image, featured, featured_order) VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), image = COALESCE(VALUES(image), image),
       featured = VALUES(featured), featured_order = VALUES(featured_order)`,
    [c.name, c.slug, img ?? null, c.featured || 0, c.featured_order || 0]
  );
}
const [catRows] = await pool.query('SELECT id, slug FROM categories');
for (const r of catRows) catIds[r.slug] = r.id;

const brandIds = {};
for (const b of newBrands) {
  await pool.query(
    'INSERT INTO brands (name, slug) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
    [b, slugify(b)]
  );
}
const [brandRows] = await pool.query('SELECT id, slug FROM brands');
for (const r of brandRows) brandIds[r.slug] = r.id;

let inserted = 0;
for (const p of products) {
  const slugs = p.imgs.map((ids) => ids[0]);
  const candidates = p.imgs;
  const urls = await pickImages(p.slug, candidates);
  const main = urls[0];
  const catId = catIds[p.cat];
  const brandId = brandIds[p.brand] || null;
  const [res] = await pool.query(
    `INSERT INTO products (name, slug, description, price, stock, sold, image, category_id, brand_id, active, return_days)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
     ON DUPLICATE KEY UPDATE
       description = VALUES(description), price = VALUES(price), stock = VALUES(stock),
       sold = VALUES(sold), image = VALUES(image), category_id = VALUES(category_id),
       brand_id = VALUES(brand_id), return_days = VALUES(return_days), active = 1`,
    [p.name, p.slug, p.desc, p.price, p.stock, p.sold, main, catId, brandId, p.return_days]
  );
  const [[row]] = await pool.query('SELECT id FROM products WHERE slug = ?', [p.slug]);
  if (!row) continue;
  await pool.query('DELETE FROM product_media WHERE product_id = ?', [row.id]);
  for (let i = 0; i < urls.length; i++) {
    await pool.query(
      'INSERT INTO product_media (product_id, type, url, sort_order) VALUES (?, ?, ?, ?)',
      [row.id, 'image', urls[i], i]
    );
  }
  inserted++;
  console.log(`OK ${p.slug} (id ${row.id}) ${urls.length} imgs`);
}

const [[count]] = await pool.query('SELECT COUNT(*) c FROM products WHERE deleted_at IS NULL');
console.log(`TOTAL ACTIVE PRODUCTS: ${count.c}`);
await pool.end();
console.log('DONE');
