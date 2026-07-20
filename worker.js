// 다나와 IT 카테고리 상품명 스크래핑 테스트
// GET / 호출 시 아래 IT_CATEGORIES 목록을 순회하며 상품명만 수집

const IT_CATEGORIES = [
  { name: '노트북', cate: 'cate=112758' },
  { name: '모니터', cate: 'cate=112757' },
  { name: '스마트폰', cate: 'cate=122515' },
  { name: '태블릿', cate: 'cate=12210596' },
  { name: 'SSD', cate: 'cate=112760' },
  { name: 'CPU', cate: 'cate=112747' },
  { name: '메인보드', cate: 'cate=112751' },
  { name: '그래픽카드', cate: 'cate=112753' },
  { name: '키보드', cate: 'cate=112782' },
  { name: '이어폰/헤드폰', cate: 'cate=11252453' },
  { name: '웹캠', cate: 'cate=11253489' },
  { name: '공유기', cate: 'cate=112804' }
];

export default {
  async fetch() {
    const tasks = IT_CATEGORIES.map(async (category) => {
      const targetUrl = `https://prod.danawa.com/list/?${category.cate}`;

      try {
        const res = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
            'Accept-Language': 'ko-KR,ko;q=0.9'
          }
        });

        if (!res.ok) {
          return { category: category.name, error: `status ${res.status}` };
        }

        const html = await res.text();
        const names = extractProductNames(html);

        return {
          category: category.name,
          url: targetUrl,
          count: names.length,
          names
        };
      } catch (e) {
        return { category: category.name, error: String(e) };
      }
    });

    const results = await Promise.all(tasks);

    return new Response(JSON.stringify(results, null, 2), {
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }
};

function extractProductNames(html) {
  const names = [];
  const regex = /class="prod_name"[\s\S]*?<a[^>]*name="productName"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const clean = m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (clean) names.push(clean);
  }
  return names;
}
