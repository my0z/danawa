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
  { name: '공유기', cate: 'cate=112804' },
  { name: '액션캠', cate: 'cate=12237508' },
  { name: '블루투스스피커', cate: 'cate=12237379' },
  { name: '드론', cate: 'cate=21350390' },
  { name: '미니게임기', cate: 'cate=11338109' },
  { name: '휴대용PC게임기', cate: 'cate=11341228' },
  { name: '휴대미니프로젝터', cate: 'cate=1032820' },
  { name: '삼각대셀카봉짐벌', cate: 'cate=12337581' },
  { name: '홈IP카메라(베이비캠)', cate: 'cate=19327720' },
  { name: '스마트워치', cate: 'cate=12215657' },
  { name: '학습/과학완구', cate: 'cate=16322482' }
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pickCount = Number(url.searchParams.get('n')) || 5;

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

        return { category: category.name, url: targetUrl, count: names.length, names };
      } catch (e) {
        return { category: category.name, error: String(e) };
      }
    });

    const results = await Promise.all(tasks);

    // 전체 상품명 하나로 합치기 (카테고리 태그 포함)
    const allItems = [];
    for (const r of results) {
      if (r.names) {
        for (const name of r.names) {
          allItems.push({ category: r.category, name });
        }
      }
    }

    // KV에서 이미 사용한 상품명 목록 불러오기 (없으면 빈 배열)
    let seen = [];
    if (env.SEEN_ITEMS) {
      const stored = await env.SEEN_ITEMS.get('seen-list');
      seen = stored ? JSON.parse(stored) : [];
    }

    const seenSet = new Set(seen);
    const unseen = allItems.filter(item => !seenSet.has(item.name));

    // 랜덤 셔플 후 n개 선택
    const shuffled = unseen.sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, pickCount);

    // 선택된 항목 사용 이력에 추가 (KV 바인딩 있을 때만)
    if (env.SEEN_ITEMS && picked.length > 0) {
      const updatedSeen = [...seen, ...picked.map(p => p.name)];
      // 이력이 너무 커지지 않도록 최근 2000개만 유지
      const trimmed = updatedSeen.slice(-2000);
      await env.SEEN_ITEMS.put('seen-list', JSON.stringify(trimmed));
    }

    return new Response(JSON.stringify({
      totalScraped: allItems.length,
      totalUnseen: unseen.length,
      picked,
      raw: results
    }, null, 2), {
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
