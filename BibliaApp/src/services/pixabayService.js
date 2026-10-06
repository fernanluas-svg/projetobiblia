const PIXABAY_KEY = process.env.EXPO_PUBLIC_PIXABAY_API_KEY || '';
const BASE_URL = 'https://pixabay.com/api/';

const INSPIRING_QUERIES = [
  'nature landscape',
  'sunset mountain',
  'peaceful sky',
  'forest light',
  'calm lake sunrise',
  'misty mountains',
];

// Imagens verticais/horizontais alta qualidade, seguras e neutras
export async function fetchPixabayImages({ query, page = 1, perPage = 20 } = {}) {
  if (!PIXABAY_KEY) {
    console.warn('[Pixabay] EXPO_PUBLIC_PIXABAY_API_KEY ausente no bundle — verifique env EAS/local .env');
    return [];
  }
  const q = query || INSPIRING_QUERIES[Math.floor(Math.random() * INSPIRING_QUERIES.length)];
  const params = new URLSearchParams({
    key: PIXABAY_KEY,
    q,
    image_type: 'photo',
    orientation: 'vertical',
    category: 'nature',
    safesearch: 'true',
    order: 'popular',
    per_page: String(perPage),
    page: String(page),
  });
  const url = `${BASE_URL}?${params.toString()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Pixabay HTTP ${res.status}`);
    const json = await res.json();
    const hits = Array.isArray(json.hits) ? json.hits : [];
    return hits.map((h) => ({
      id: h.id,
      previewURL: h.webformatURL,
      largeURL: h.largeImageURL || h.webformatURL,
      pageURL: h.pageURL,
      tags: h.tags,
      user: h.user,
    }));
  } catch (e) {
    console.warn('[Pixabay] fetch failed', e?.message || e);
    return [];
  }
}

export async function fetchInspiringBatch(perPage = 12) {
  if (!PIXABAY_KEY) {
    console.warn('[Pixabay] EXPO_PUBLIC_PIXABAY_API_KEY ausente no bundle — verifique env EAS/local .env');
    return [];
  }
  // pagina aleatoria traz variedade a cada "Novas imagens"
  const page = 1 + Math.floor(Math.random() * 5);
  let images = await fetchPixabayImages({ perPage, page });
  if (!images.length) {
    const url = `${BASE_URL}?key=${PIXABAY_KEY}&q=nature+landscape&image_type=photo&orientation=horizontal&category=nature&safesearch=true&order=popular&per_page=${perPage}`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      images = (json.hits || []).map((h) => ({
        id: h.id,
        previewURL: h.webformatURL,
        largeURL: h.largeImageURL || h.webformatURL,
        pageURL: h.pageURL,
        tags: h.tags,
        user: h.user,
      }));
    } catch (e) {
      return [];
    }
  }
  return images;
}
