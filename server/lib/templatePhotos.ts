/**
 * Curated Unsplash photo IDs for website generator.
 * Each ID is the part after "photo-" in the Unsplash URL.
 * Usage: `https://images.unsplash.com/photo-${id}?w=1400&h=900&fit=crop&q=85&auto=format`
 */

export function getTemplateHeroPhoto(template: string, niche: string): string {
  const t = template.toLowerCase();
  const n = niche.toLowerCase();

  // Template-specific hero photos first (take priority)
  if (t.includes('luxury') || t.includes('premium')) {
    return '1441986300917-64674bd600d8'; // luxury lifestyle, warm tones
  }
  if (t.includes('coastal') || t.includes('editorial')) {
    return '1507525428034-b723cf961d3e'; // beach/coastal lifestyle
  }
  if (t.includes('bloom') || t.includes('beauty') || t.includes('minimal')) {
    return '1596462502278-27bfdc403348'; // beauty/skincare flatlay
  }
  if (t.includes('tech') || t.includes('mono') || t.includes('saas')) {
    return '1518770660439-4636190af475'; // tech/dark aesthetic
  }
  if (t.includes('brutalist') || t.includes('dtc') || t.includes('bold')) {
    return '1534438327276-14e5300c3a48'; // bold fitness/action
  }

  // Niche-specific hero photos
  if (n.includes('gym') || n.includes('fitness') || n.includes('sport') || n.includes('active') || n.includes('workout')) {
    return '1534438327276-14e5300c3a48'; // gym/fitness
  }
  if (n.includes('creatine') || n.includes('supplement') || n.includes('protein') || n.includes('nutrition')) {
    return '1571019613454-1cb2f99b2d8b'; // supplements/health
  }
  if (n.includes('beauty') || n.includes('skin') || n.includes('cosmetic') || n.includes('glow') || n.includes('serum')) {
    return '1522335789203-aabd1fc54bc9'; // beauty/skincare
  }
  if (n.includes('pet') || n.includes('dog') || n.includes('cat')) {
    return '1587300003388-59208cc962cb'; // pets
  }
  if (n.includes('home') || n.includes('decor') || n.includes('furniture') || n.includes('kitchen')) {
    return '1555041469-a586c61ea9bc'; // home decor
  }
  if (n.includes('outdoor') || n.includes('camp') || n.includes('hiking') || n.includes('adventure')) {
    return '1533240332313-0db49b459ad6'; // outdoor/adventure
  }
  if (n.includes('tech') || n.includes('gadget') || n.includes('electronic') || n.includes('wireless')) {
    return '1518770660439-4636190af475'; // tech/electronics
  }
  if (n.includes('fashion') || n.includes('apparel') || n.includes('clothing') || n.includes('wear')) {
    return '1445205170230-053b83016050'; // fashion/clothing
  }
  if (n.includes('baby') || n.includes('kid') || n.includes('child') || n.includes('toy')) {
    return '1515488042361-ee00e0ddd4e4'; // kids/baby
  }
  if (n.includes('jewel') || n.includes('watch') || n.includes('accessories') || n.includes('ring')) {
    return '1515562141207-7a88fb7ce338'; // jewellery/accessories
  }
  if (n.includes('yoga') || n.includes('wellness') || n.includes('meditat') || n.includes('mindful')) {
    return '1506126613408-eca07ce68773'; // yoga/wellness
  }
  if (n.includes('hair') || n.includes('curl') || n.includes('scalp')) {
    return '1522337360788-8b13dee7a37e'; // hair care
  }
  if (n.includes('coffee') || n.includes('kitchen') || n.includes('brew')) {
    return '1495474472287-4d71bcdd2085'; // coffee/kitchen
  }
  if (n.includes('sleep') || n.includes('pillow') || n.includes('bedroom') || n.includes('mattress')) {
    return '1518780664697-55e3ad937233'; // bedroom/sleep
  }

  // Default lifestyle/premium
  return '1441986300917-64674bd600d8';
}

export function getProductPhoto(niche: string): string {
  const n = niche.toLowerCase();

  if (n.includes('gym') || n.includes('fitness') || n.includes('active') || n.includes('workout') || n.includes('sport')) {
    return '1517963628607-235ccdd5476c'; // fitness equipment
  }
  if (n.includes('creatine') || n.includes('supplement') || n.includes('protein') || n.includes('nutrition')) {
    return '1559757148-5c350d0d3c56'; // supplements
  }
  if (n.includes('beauty') || n.includes('skin') || n.includes('cosmetic') || n.includes('serum') || n.includes('glow')) {
    return '1620916566398-39f1143ab7be'; // skincare product
  }
  if (n.includes('hair')) {
    return '1522337360788-8b13dee7a37e'; // hair product
  }
  if (n.includes('tech') || n.includes('gadget') || n.includes('electronic') || n.includes('wireless')) {
    return '1586953208448-b462d3680a05'; // tech product
  }
  if (n.includes('home') || n.includes('decor') || n.includes('furniture')) {
    return '1493809842364-78817add7ffb'; // home product
  }
  if (n.includes('pet') || n.includes('dog') || n.includes('cat')) {
    return '1601758228041-f3b2795255f1'; // pet product
  }
  if (n.includes('fashion') || n.includes('apparel') || n.includes('clothing') || n.includes('wear')) {
    return '1490481651871-ab68de25d43d'; // fashion product
  }
  if (n.includes('outdoor') || n.includes('camp') || n.includes('hiking')) {
    return '1504280390367-361c6d9f38f4'; // outdoor gear
  }
  if (n.includes('jewel') || n.includes('watch') || n.includes('accessories')) {
    return '1573408301185-9521e7c5deab'; // jewellery
  }
  if (n.includes('yoga') || n.includes('wellness') || n.includes('mat')) {
    return '1544367567-0f2fcb009e0b'; // yoga mat
  }
  if (n.includes('coffee') || n.includes('kitchen')) {
    return '1495474472287-4d71bcdd2085'; // coffee/kitchen
  }
  if (n.includes('sleep') || n.includes('pillow')) {
    return '1587560699334-cc4ff634909a'; // pillow/sleep
  }
  if (n.includes('baby') || n.includes('kid') || n.includes('toy')) {
    return '1515488042361-ee00e0ddd4e4'; // kids
  }

  // Default product flatlay
  return '1526170375885-4d8ecf77b99f';
}

export function buildUnsplashUrl(photoId: string, width = 1400, height = 900): string {
  return `https://images.unsplash.com/photo-${photoId}?w=${width}&h=${height}&fit=crop&q=85&auto=format`;
}
