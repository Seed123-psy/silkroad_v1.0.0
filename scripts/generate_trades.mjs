import fs from 'fs/promises';
import path from 'path';

const ROOT = process.cwd();
const tradesPath = path.join(ROOT, 'src', 'assets', 'data', 'trades.json');
const outPath = path.join(ROOT, 'src', 'assets', 'data', 'trades.generated.json');

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pad(n) {
  return String(n).padStart(3, '0');
}

async function main() {
  try {
    const src = await fs.readFile(tradesPath, 'utf8');
    const data = JSON.parse(src);

    const goodsList = (data.tradeGoods || []).map(g => g.id);
    if (!goodsList.length) {
      console.error('tradeGoods 为空，无法生成记录。');
      process.exit(1);
    }

    // 固定的 8 个城市（按你的要求）
    const cities = ['西安','敦煌','撒马尔罕','巴格达','君士坦丁堡','喀什','布哈拉','梅尔夫'];

    // 可选时期
    const periods = ['han','tang','song','yuan','ming','qing'];

    const existing = Array.isArray(data.tradeRecords) ? data.tradeRecords.slice() : [];

    // 计算当前已有最大编号（解析 trade_XXX 中的数字）
    let maxIdx = 0;
    for (const r of existing) {
      const m = String(r.id || '').match(/trade_(\d+)/);
      if (m) {
        const v = parseInt(m[1], 10);
        if (!Number.isNaN(v) && v > maxIdx) maxIdx = v;
      }
    }

    const TARGET = 1000;
    if (maxIdx >= TARGET) {
      console.log(`已有记录最大编号为 ${maxIdx}，不需要追加。若要重新生成请先备份并删除旧记录。`);
      return;
    }

    const priceMap = {
      silk: 20,
      porcelain: 15,
      tea: 5,
      spice: 30,
      jade: 200,
      horse: 150,
      carpet: 90,
      glass: 35,
      leather: 40,
      gem: 120,
      instrument: 25,
      painting: 80,
      ivory: 180,
      medicine: 60,
      jewelry: 200,
      weapon: 100,
      bullion: 250,
      cotton: 10,
      felt: 12,
      wool: 8,
      dried_fruits: 6,
      lacquer: 40,
      copperware: 30,
      metal_goods: 70,
      luxury: 150,
      gold: 300,
      silver: 80
    };

    const outRecords = existing.slice();

    for (let idx = maxIdx + 1; idx <= TARGET; idx++) {
      // 随机选择不同的城市
      let from = pick(cities);
      let to = pick(cities);
      while (to === from) {
        to = pick(cities);
      }

      const goods = pick(goodsList);
      // 随机 volume 根据商品类型做简单分级
      const vol = randInt( (goods === 'silk' ? 1000 :  (goods === 'porcelain' ? 500 :  (goods === 'tea' ? 2000 :  (goods === 'horse' ? 10 :  randInt(50,200) ) ) ) ),  Math.max( (goods === 'silk' ? 5000 : 1000), randInt(200,8000) ) );

      const basePrice = priceMap[goods] || 50;
      const value = Math.round(vol * basePrice * (0.7 + Math.random() * 0.8));

      const rec = {
        id: `trade_${pad(idx)}`,
        period: pick(periods),
        fromCity: from,
        toCity: to,
        goods: goods,
        volume: vol,
        value: value,
        route: '陆上丝绸之路'
      };

      outRecords.push(rec);
    }

    const out = {
      tradeGoods: data.tradeGoods || [],
      tradeRecords: outRecords
    };

    await fs.writeFile(outPath, JSON.stringify(out, null, 2), 'utf8');
    console.log(`已生成到 ${TARGET} 条记录，输出文件：${outPath}`);
  } catch (err) {
    console.error('生成失败：', err);
    process.exit(2);
  }
}

main();
