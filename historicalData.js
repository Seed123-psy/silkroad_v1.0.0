// historicalData.js
export const historicalData = {
  // 西安数据
  xian: {
    economic: {
      tradeRatio: [
        { year: -202, value: 20, name: '西汉建都' },
        { year: 100, value: 45, name: '东汉丝路' },
        { year: 618, value: 15, name: '唐初建立' },
        { year: 713, value: 45, name: '开元盛世' },
        { year: 755, value: 30, name: '安史之乱前' },
        { year: 880, value: 10, name: '黄巢起义' },
        { year: 1368, value: 25, name: '明朝初期' },
      ],
      caravans: [
        { year: -138, count: 50, name: '张骞出使' },
        { year: 100, count: 180, name: '班超时期' },
        { year: 618, count: 80, name: '唐初商队' },
        { year: 713, count: 300, name: '丝路鼎盛' },
        { year: 1405, count: 150, name: '郑和时期' },
      ],
      agriculture: [
        { name: '粮食作物', value: 55 },
        { name: '经济作物', value: 30 },
        { name: '果蔬种植', value: 10 },
        { name: '其他农产', value: 5 },
      ],
      revenue: [
        { year: 713, value: 500, name: '开元盛世' },
        { year: 755, value: 350, name: '安史之乱前' },
        { year: 880, value: 80, name: '唐末时期' },
        { year: 1398, value: 200, name: '明朝重建' },
      ],
    },
    population: {
      total: [
        { year: -200, value: 246, name: '西汉鼎盛' },
        { year: 742, value: 196, name: '盛唐时期' },
        { year: 880, value: 100, name: '唐末时期' },
        { year: 1393, value: 150, name: '明朝初期' },
      ],
      distribution: [
        { name: '城内居民', value: 35 },
        { name: '近郊居民', value: 30 },
        { name: '远郊农民', value: 25 },
        { name: '流动人口', value: 10 },
      ],
      urbanRatio: [
        { year: 742, value: 38, name: '盛唐城市化' },
        { year: 800, value: 32, name: '中唐时期' },
        { year: 1400, value: 28, name: '明朝时期' },
      ],
      density: [
        { year: 742, count: 320, name: '盛唐密度' },
        { year: 800, count: 280, name: '中唐时期' },
        { year: 1400, count: 200, name: '明朝时期' },
      ],
    },
    military: {
      armySize: [
        { year: -100, value: 120, name: '西汉驻军' },
        { year: 713, value: 150, name: '府兵制时期' },
        { year: 755, value: 200, name: '安史之乱前' },
        { year: 1400, value: 100, name: '明朝卫所' },
      ],
      composition: [
        { name: '步兵', value: 55 },
        { name: '骑兵', value: 30 },
        { name: '弓箭手', value: 10 },
        { name: '工程兵', value: 5 },
      ],
      battles: [
        { year: 23, name: '赤眉军攻长安', result: '陷落' },
        { year: 755, name: '安史之乱', result: '惨胜' },
        { year: 881, name: '黄巢入长安', result: '陷落' },
        { year: 1369, name: '明军收复', result: '胜利' },
      ],
      weapons: [
        { year: -100, count: 20000, name: '汉环首刀' },
        { year: 700, count: 15000, name: '唐横刀' },
        { year: 1400, count: 10000, name: '明火铳' },
      ],
    },
    culture: {
      literature: [
        { year: -100, count: 50, name: '司马迁时期' },
        { year: 713, count: 400, name: '盛唐诗人' },
        { year: 1400, count: 200, name: '明朝文学' },
      ],
      inventions: [
        { year: 105, impact: 95, name: '蔡伦造纸' },
        { year: 750, impact: 90, name: '雕版印刷' },
        { year: 1400, impact: 85, name: '活字印刷' },
      ],
      education: [
        { year: 713, literacyRate: 20, name: '科举鼎盛' },
        { year: 800, literacyRate: 18, name: '中唐时期' },
        { year: 1400, literacyRate: 15, name: '明朝教育' },
      ],
      religion: [
        { name: '佛教', followers: 50 },
        { name: '道教', followers: 30 },
        { name: '景教', followers: 15 },
        { name: '其他', followers: 5 },
      ],
    },
  },

  // 敦煌数据
  dunhuang: {
    economic: {
      tradeRatio: [
        { year: -111, value: 35, name: '汉设敦煌郡' },
        { year: 400, value: 40, name: '北魏时期' },
        { year: 700, value: 60, name: '盛唐时期' },
        { year: 850, value: 45, name: '归义军时期' },
        { year: 1200, value: 30, name: '西夏时期' },
        { year: 1400, value: 25, name: '明朝关闭嘉峪关' },
      ],
      caravans: [
        { year: -100, count: 150, name: '东汉时期' },
        { year: 500, count: 250, name: '北魏商队' },
        { year: 700, count: 350, name: '盛唐时期' },
        { year: 1000, count: 200, name: '归义军后期' },
        { year: 1200, count: 100, name: '西夏商队' },
      ],
      agriculture: [
        { name: '粮食作物', value: 30 },
        { name: '棉花种植', value: 25 },
        { name: '葡萄种植', value: 20 },
        { name: '其他作物', value: 25 },
      ],
      revenue: [
        { year: 200, value: 80, name: '东汉时期' },
        { year: 700, value: 180, name: '盛唐时期' },
        { year: 850, value: 120, name: '归义军' },
        { year: 1000, value: 80, name: '西夏初期' },
        { year: 1400, value: 50, name: '明朝时期' },
      ],
    },
    population: {
      total: [
        { year: -100, value: 18, name: '东汉时期' },
        { year: 500, value: 25, name: '北魏时期' },
        { year: 700, value: 40, name: '盛唐时期' },
        { year: 850, value: 30, name: '归义军' },
        { year: 1200, value: 25, name: '西夏时期' },
        { year: 1400, value: 20, name: '明朝时期' },
      ],
      distribution: [
        { name: '城内居民', value: 30 },
        { name: '绿洲农民', value: 40 },
        { name: '僧侣', value: 20 },
        { name: '商旅', value: 10 },
      ],
      urbanRatio: [
        { year: 700, value: 35, name: '盛唐时期' },
        { year: 850, value: 30, name: '归义军' },
        { year: 1200, value: 25, name: '西夏时期' },
      ],
      density: [
        { year: 700, count: 120, name: '盛唐时期' },
        { year: 850, count: 90, name: '归义军' },
        { year: 1200, count: 70, name: '西夏时期' },
        { year: 1400, count: 50, name: '明朝时期' },
      ],
    },
    military: {
      armySize: [
        { year: -100, value: 5, name: '东汉驻军' },
        { year: 500, value: 8, name: '北魏驻军' },
        { year: 700, value: 15, name: '唐驻军' },
        { year: 850, value: 10, name: '归义军' },
        { year: 1200, value: 8, name: '西夏驻军' },
      ],
      composition: [
        { name: '步兵', value: 60 },
        { name: '骑兵', value: 30 },
        { name: '弓箭手', value: 10 },
      ],
      battles: [
        { year: 400, name: '北魏灭北凉', result: '陷落' },
        { year: 786, name: '吐蕃占领', result: '陷落' },
        { year: 848, name: '张议潮起义', result: '胜利' },
        { year: 1036, name: '西夏征服', result: '陷落' },
        { year: 1372, name: '明军收复', result: '胜利' },
      ],
      weapons: [
        { year: 200, count: 3000, name: '汉弩' },
        { year: 700, count: 5000, name: '唐刀' },
        { year: 1200, count: 4000, name: '西夏弓' },
      ],
    },
    culture: {
      literature: [
        { year: 366, count: 50, name: '莫高窟开凿' },
        { year: 700, count: 150, name: '藏经洞文献' },
        { year: 1000, count: 100, name: '西夏文经卷' },
        { year: 1400, count: 80, name: '明朝典籍' },
      ],
      inventions: [
        { year: 500, impact: 95, name: '壁画技术' },
        { year: 800, impact: 90, name: '变文艺术' },
        { year: 1000, impact: 85, name: '西夏印刷' },
        { year: 1400, impact: 80, name: '彩塑工艺' },
      ],
      education: [
        { year: 700, literacyRate: 15, name: '佛教教育' },
        { year: 850, literacyRate: 12, name: '归义军' },
        { year: 1200, literacyRate: 10, name: '西夏时期' },
      ],
      religion: [
        { name: '佛教', followers: 80 },
        { name: '摩尼教', followers: 15 },
        { name: '其他', followers: 5 },
      ],
    },
  },

  // 喀什数据
  kashgar: {
    economic: {
      tradeRatio: [
        { year: -128, value: 25, name: '疏勒国时期' },
        { year: 73, value: 40, name: '班超经营' },
        { year: 648, value: 50, name: '唐安西四镇' },
        { year: 1000, value: 35, name: '喀喇汗王朝' },
        { year: 1500, value: 40, name: '叶尔羌汗国' },
        { year: 1600, value: 45, name: '汗国鼎盛' },
      ],
      caravans: [
        { year: -100, count: 120, name: '东汉时期' },
        { year: 500, count: 200, name: '突厥时期' },
        { year: 700, count: 280, name: '盛唐时期' },
        { year: 1200, count: 200, name: '蒙古时期' },
        { year: 1500, count: 250, name: '叶尔羌' },
      ],
      agriculture: [
        { name: '粮食作物', value: 40 },
        { name: '棉花种植', value: 30 },
        { name: '瓜果种植', value: 25 },
        { name: '其他作物', value: 5 },
      ],
      revenue: [
        { year: 100, value: 60, name: '东汉时期' },
        { year: 700, value: 150, name: '唐代' },
        { year: 1000, value: 120, name: '喀喇汗' },
        { year: 1500, value: 100, name: '叶尔羌' },
        { year: 1600, value: 120, name: '汗国鼎盛' },
      ],
    },
    population: {
      total: [
        { year: -100, value: 20, name: '东汉时期' },
        { year: 500, value: 25, name: '突厥时期' },
        { year: 700, value: 35, name: '唐代' },
        { year: 1000, value: 50, name: '喀喇汗' },
        { year: 1500, value: 60, name: '叶尔羌' },
        { year: 1600, value: 70, name: '汗国鼎盛' },
      ],
      distribution: [
        { name: '城内居民', value: 40 },
        { name: '农村居民', value: 45 },
        { name: '商队人员', value: 15 },
      ],
      urbanRatio: [
        { year: 700, value: 35, name: '唐代' },
        { year: 1000, value: 40, name: '喀喇汗' },
        { year: 1500, value: 45, name: '叶尔羌' },
      ],
      density: [
        { year: 700, count: 100, name: '唐代' },
        { year: 1000, count: 120, name: '喀喇汗' },
        { year: 1500, count: 150, name: '叶尔羌' },
      ],
    },
    military: {
      armySize: [
        { year: -100, value: 3, name: '疏勒国' },
        { year: 500, value: 5, name: '突厥时期' },
        { year: 700, value: 12, name: '唐驻军' },
        { year: 1000, value: 15, name: '喀喇汗' },
        { year: 1500, value: 18, name: '叶尔羌' },
      ],
      composition: [
        { name: '骑兵', value: 60 },
        { name: '步兵', value: 30 },
        { name: '弓箭手', value: 10 },
      ],
      battles: [
        { year: 73, name: '班超攻疏勒', result: '归汉' },
        { year: 751, name: '怛罗斯之战', result: '撤退' },
        { year: 1006, name: '灭于阗佛教国', result: '胜利' },
        { year: 1514, name: '对抗察合台', result: '胜利' },
        { year: 1600, name: '平定叛乱', result: '胜利' },
      ],
      weapons: [
        { year: 100, count: 2000, name: '汉式武器' },
        { year: 700, count: 5000, name: '唐式装备' },
        { year: 1500, count: 8000, name: '火器部队' },
      ],
    },
    culture: {
      literature: [
        { year: 500, count: 30, name: '突厥时期' },
        { year: 1000, count: 80, name: '《福乐智慧》' },
        { year: 1500, count: 120, name: '叶尔羌文学' },
        { year: 1600, count: 150, name: '汗国鼎盛' },
      ],
      inventions: [
        { year: 800, impact: 85, name: '灌溉技术' },
        { year: 1100, impact: 85, name: '天文历法' },
        { year: 1500, impact: 80, name: '音乐木卡姆' },
        { year: 1600, impact: 75, name: '建筑工艺' },
      ],
      education: [
        { year: 1000, literacyRate: 15, name: '经院教育' },
        { year: 1500, literacyRate: 20, name: '叶尔羌' },
        { year: 1600, literacyRate: 25, name: '汗国鼎盛' },
      ],
      religion: [
        { name: '佛教', followers: 60 }, // 10世纪前
        { name: '伊斯兰教', followers: 90 }, // 10世纪后
        { name: '其他', followers: 5 },
      ],
    },
  },

  // 撒马尔罕
  samarkand: {
    economic: {
      tradeRatio: [
        { year: -329, value: 35, name: '亚历山大征服' },
        { year: 100, value: 45, name: '贵霜时期' },
        { year: 500, value: 40, name: '嚈哒统治' },
        { year: 712, value: 60, name: '阿拉伯征服' },
        { year: 1370, value: 70, name: '帖木儿复兴' },
        { year: 1500, value: 65, name: '乌兹别克时期' },
      ],
      caravans: [
        { year: -200, count: 200, name: '粟特商队' },
        { year: 500, count: 250, name: '白匈奴时期' },
        { year: 1200, count: 300, name: '花剌子模' },
        { year: 1400, count: 400, name: '帖木儿时期' },
        { year: 1500, count: 350, name: '乌兹别克' },
      ],
      agriculture: [
        { name: '粮食作物', value: 35 },
        { name: '棉花种植', value: 30 },
        { name: '水果种植', value: 25 },
        { name: '其他作物', value: 10 },
      ],
      revenue: [
        { year: 100, value: 120, name: '贵霜时期' },
        { year: 700, value: 200, name: '阿拉伯时期' },
        { year: 1400, value: 500, name: '帖木儿' },
        { year: 1500, value: 450, name: '乌兹别克' },
      ],
    },
    population: {
      total: [
        { year: -300, value: 30, name: '希腊化时期' },
        { year: 100, value: 40, name: '贵霜时期' },
        { year: 600, value: 50, name: '西突厥' },
        { year: 1400, value: 150, name: '帖木儿' },
        { year: 1500, value: 130, name: '乌兹别克' },
      ],
      distribution: [
        { name: '城内居民', value: 45 },
        { name: '农村居民', value: 40 },
        { name: '商队人员', value: 15 },
      ],
      urbanRatio: [
        { year: 100, value: 40, name: '贵霜时期' },
        { year: 700, value: 50, name: '阿拉伯时期' },
        { year: 1400, value: 60, name: '帖木儿' },
      ],
      density: [
        { year: 100, count: 150, name: '贵霜时期' },
        { year: 700, count: 200, name: '阿拉伯时期' },
        { year: 1400, count: 300, name: '帖木儿' },
      ],
    },
    military: {
      armySize: [
        { year: -329, value: 8, name: '抵抗亚历山大' },
        { year: 500, value: 10, name: '白匈奴' },
        { year: 712, value: 10, name: '抵抗阿拉伯' },
        { year: 1400, value: 25, name: '帖木儿' },
        { year: 1500, value: 20, name: '乌兹别克' },
      ],
      composition: [
        { name: '骑兵', value: 60 },
        { name: '步兵', value: 30 },
        { name: '弓箭手', value: 10 },
      ],
      battles: [
        { year: -329, name: '粟特岩堡之战', result: '失败' },
        { year: 712, name: '阿拉伯征服', result: '陷落' },
        { year: 1220, name: '蒙古攻城', result: '屠城' },
        { year: 1405, name: '帖木儿东征', result: '出发地' },
        { year: 1501, name: '乌兹别克征服', result: '陷落' },
      ],
      weapons: [
        { year: -300, count: 5000, name: '希腊式装备' },
        { year: 700, count: 10000, name: '阿拉伯武器' },
        { year: 1400, count: 20000, name: '帖木儿火器' },
      ],
    },
    culture: {
      literature: [
        { year: 100, count: 50, name: '贵霜时期' },
        { year: 800, count: 100, name: '阿拉伯学术' },
        { year: 1400, count: 200, name: '波斯文学' },
        { year: 1500, count: 180, name: '乌兹别克' },
      ],
      inventions: [
        { year: 500, impact: 85, name: '玻璃制造' },
        { year: 800, impact: 90, name: '造纸术西传' },
        { year: 1400, impact: 95, name: '伊斯兰建筑' },
        { year: 1500, impact: 85, name: '天文学' },
      ],
      education: [
        { year: 800, literacyRate: 25, name: '阿拉伯学校' },
        { year: 1400, literacyRate: 30, name: '帖木儿' },
        { year: 1500, literacyRate: 28, name: '乌兹别克' },
      ],
      religion: [
        { name: '祆教', followers: 70 }, // 9世纪前
        { name: '伊斯兰教', followers: 90 }, // 9世纪后
        { name: '其他', followers: 5 },
      ],
    },
  },

  // 布拉哈
  balkh: {
    economic: {
      tradeRatio: [
        { year: 500, value: 35, name: '粟特时期' },
        { year: 850, value: 55, name: '萨曼王朝' },
        { year: 1000, value: 50, name: '喀喇汗' },
        { year: 1220, value: 10, name: '蒙古破坏' },
        { year: 1500, value: 40, name: '乌兹别克' },
        { year: 1600, value: 45, name: '布哈拉汗国' },
      ],
      caravans: [
        { year: -200, count: 200, name: '粟特商队' },
        { year: 500, count: 250, name: '白匈奴时期' },
        { year: 1200, count: 300, name: '花剌子模' },
        { year: 1400, count: 400, name: '帖木儿时期' },
        { year: 1500, count: 350, name: '乌兹别克' },
      ],
      agriculture: [
        { name: '粮食作物', value: 35 },
        { name: '棉花种植', value: 30 },
        { name: '水果种植', value: 25 },
        { name: '其他作物', value: 10 },
      ],
      revenue: [
        { year: 900, value: 220, name: '萨曼王朝' },
        { year: 1000, value: 200, name: '喀喇汗' },
        { year: 1500, value: 180, name: '乌兹别克' },
        { year: 1600, value: 200, name: '汗国时期' },
      ],
    },
    population: {
      total: [
        { year: 500, value: 25, name: '嚈哒时期' },
        { year: 800, value: 50, name: '阿拉伯时期' },
        { year: 1000, value: 70, name: '萨曼王朝' },
        { year: 1500, value: 50, name: '昔班尼' },
        { year: 1600, value: 60, name: '汗国时期' },
      ],
      distribution: [
        { name: '城内居民', value: 45 },
        { name: '农村居民', value: 40 },
        { name: '商旅', value: 15 },
      ],
      urbanRatio: [
        { year: 800, value: 40, name: '阿拉伯时期' },
        { year: 1000, value: 50, name: '萨曼王朝' },
        { year: 1500, value: 45, name: '乌兹别克' },
      ],
      density: [
        { year: 800, count: 120, name: '阿拉伯时期' },
        { year: 1000, count: 180, name: '萨曼王朝' },
        { year: 1500, count: 150, name: '乌兹别克' },
      ],
    },
    military: {
      armySize: [
        { year: 700, value: 8, name: '阿拉伯驻军' },
        { year: 900, value: 15, name: '萨曼王朝' },
        { year: 1000, value: 12, name: '喀喇汗' },
        { year: 1500, value: 15, name: '乌兹别克' },
      ],
      composition: [
        { name: '骑兵', value: 55 },
        { name: '步兵', value: 35 },
        { name: '弓箭手', value: 10 },
      ],
      battles: [
        { year: 709, name: '阿拉伯征服', result: '陷落' },
        { year: 999, name: '喀喇汗占领', result: '陷落' },
        { year: 1220, name: '蒙古攻城', result: '屠城' },
        { year: 1506, name: '乌兹别克占领', result: '陷落' },
      ],
      weapons: [
        { year: 800, count: 8000, name: '阿拉伯装备' },
        { year: 1000, count: 12000, name: '萨曼武器' },
        { year: 1500, count: 15000, name: '乌兹别克火器' },
      ],
    },
    culture: {
      literature: [
        { year: 800, count: 100, name: '阿拉伯时期' },
        { year: 900, count: 150, name: '波斯文学' },
        { year: 1000, count: 200, name: '伊本·西那' },
        { year: 1500, count: 180, name: '乌兹别克' },
      ],
      inventions: [
        { year: 850, impact: 90, name: '数学发展' },
        { year: 980, impact: 95, name: '医学研究' },
        { year: 1500, impact: 85, name: '细密画' },
      ],
      education: [
        { year: 900, literacyRate: 30, name: '萨曼王朝' },
        { year: 1000, literacyRate: 35, name: '学术黄金期' },
        { year: 1500, literacyRate: 25, name: '乌兹别克' },
      ],
      religion: [
        { name: '祆教', followers: 60 }, // 7世纪前
        { name: '伊斯兰教', followers: 95 }, // 学术中心
        { name: '其他', followers: 5 },
      ],
    },
  },

  // 梅尔夫
  merv: {
    economic: {
      tradeRatio: [
        { year: -250, value: 30, name: '塞琉古时期' },
        { year: 224, value: 40, name: '萨珊波斯' },
        { year: 500, value: 45, name: '萨珊波斯' },
        { year: 1000, value: 60, name: '塞尔柱' },
        { year: 1221, value: 5, name: '蒙古屠城' },
        { year: 1400, value: 20, name: '帖木儿重建' },
      ],
      caravans: [
        { year: -200, count: 150, name: '帕提亚' },
        { year: 500, count: 200, name: '萨珊时期' },
        { year: 1000, count: 300, name: '塞尔柱' },
        { year: 1400, count: 150, name: '帖木儿' },
      ],
      agriculture: [
        { name: '粮食作物', value: 40 },
        { name: '棉花种植', value: 35 },
        { name: '瓜果种植', value: 20 },
        { name: '其他作物', value: 5 },
      ],
      revenue: [
        { year: 500, value: 180, name: '萨珊时期' },
        { year: 1000, value: 250, name: '塞尔柱' },
        { year: 1400, value: 100, name: '帖木儿' },
      ],
    },
    population: {
      total: [
        { year: -200, value: 40, name: '安息帝国' },
        { year: 500, value: 60, name: '萨珊时期' },
        { year: 1000, value: 200, name: '塞尔柱' },
        { year: 1300, value: 20, name: '蒙古后' },
        { year: 1400, value: 50, name: '帖木儿' },
      ],
      distribution: [
        { name: '城内居民', value: 50 },
        { name: '农村居民', value: 40 },
        { name: '商旅', value: 10 },
      ],
      urbanRatio: [
        { year: 500, value: 45, name: '萨珊时期' },
        { year: 1000, value: 55, name: '塞尔柱' },
        { year: 1400, value: 40, name: '帖木儿' },
      ],
      density: [
        { year: 500, count: 100, name: '萨珊时期' },
        { year: 1000, count: 180, name: '塞尔柱' },
        { year: 1400, count: 60, name: '帖木儿' },
      ],
    },
    military: {
      armySize: [
        { year: -200, value: 12, name: '安息军队' },
        { year: 500, value: 15, name: '萨珊时期' },
        { year: 651, value: 10, name: '抵抗阿拉伯' },
        { year: 1040, value: 20, name: '塞尔柱' },
        { year: 1400, value: 15, name: '帖木儿' },
      ],
      composition: [
        { name: '骑兵', value: 60 },
        { name: '步兵', value: 30 },
        { name: '弓箭手', value: 10 },
      ],
      battles: [
        { year: 651, name: '萨珊末代抵抗', result: '陷落' },
        { year: 1040, name: '塞尔柱崛起', result: '胜利' },
        { year: 1221, name: '蒙古攻城', result: '屠城' },
        { year: 1400, name: '帖木儿征服', result: '胜利' },
      ],
      weapons: [
        { year: -200, count: 8000, name: '安息弓箭' },
        { year: 500, count: 15000, name: '萨珊装备' },
        { year: 1400, count: 18000, name: '帖木儿火器' },
      ],
    },
    culture: {
      literature: [
        { year: 500, count: 80, name: '萨珊时期' },
        { year: 1000, count: 180, name: '塞尔柱学术' },
        { year: 1400, count: 100, name: '帖木儿复兴' },
      ],
      inventions: [
        { year: 500, impact: 85, name: '水利工程' },
        { year: 1000, impact: 90, name: '天文仪器' },
        { year: 1400, impact: 85, name: '水利技术' },
      ],
      education: [
        { year: 1000, literacyRate: 30, name: '塞尔柱' },
        { year: 1400, literacyRate: 25, name: '帖木儿' },
      ],
      religion: [
        { name: '祆教', followers: 50 }, // 7世纪前
        { name: '伊斯兰教', followers: 90 }, // 7世纪后
        { name: '其他', followers: 5 },
      ],
    },
  },

  // 巴格达
  baghdad: {
    economic: {
      tradeRatio: [
        { year: 762, value: 80, name: '建都初期' },
        { year: 800, value: 95, name: '哈伦时期' },
        { year: 1000, value: 90, name: '布韦希王朝' },
        { year: 1258, value: 5, name: '蒙古劫掠后' },
        { year: 1500, value: 40, name: '奥斯曼时期' },
      ],
      caravans: [
        { year: 800, count: 500, name: '阿拔斯鼎盛' },
        { year: 1000, count: 400, name: '布韦希' },
        { year: 1200, count: 300, name: '塞尔柱' },
        { year: 1500, count: 200, name: '奥斯曼' },
      ],
      agriculture: [
        { name: '粮食作物', value: 40 },
        { name: '经济作物', value: 35 },
        { name: '果蔬种植', value: 20 },
        { name: '其他作物', value: 5 },
      ],
      revenue: [
        { year: 800, value: 800, name: '哈伦时期' },
        { year: 1000, value: 600, name: '布韦希' },
        { year: 1200, value: 400, name: '塞尔柱' },
        { year: 1500, value: 250, name: '奥斯曼' },
      ],
    },
    population: {
      total: [
        { year: 762, value: 200, name: '建都初期' },
        { year: 800, value: 1200, name: '世界最大城市' },
        { year: 1000, value: 900, name: '布韦希' },
        { year: 1300, value: 150, name: '蒙古统治' },
        { year: 1500, value: 300, name: '奥斯曼' },
      ],
      distribution: [
        { name: '城内居民', value: 50 },
        { name: '郊区居民', value: 30 },
        { name: '农村居民', value: 20 },
      ],
      urbanRatio: [
        { year: 800, value: 60, name: '阿拔斯鼎盛' },
        { year: 1000, value: 55, name: '布韦希' },
        { year: 1500, value: 45, name: '奥斯曼' },
      ],
      density: [
        { year: 800, count: 350, name: '阿拔斯鼎盛' },
        { year: 1000, count: 300, name: '布韦希' },
        { year: 1500, count: 200, name: '奥斯曼' },
      ],
    },
    military: {
      armySize: [
        { year: 800, value: 100, name: '阿拔斯' },
        { year: 1000, value: 80, name: '布韦希' },
        { year: 1258, value: 30, name: '末代哈里发' },
        { year: 1500, value: 50, name: '奥斯曼' },
      ],
      composition: [
        { name: '骑兵', value: 50 },
        { name: '步兵', value: 40 },
        { name: '弓箭手', value: 10 },
      ],
      battles: [
        { year: 1258, name: '蒙古攻城', result: '屠城' },
        { year: 1401, name: '帖木儿占领', result: '陷落' },
        { year: 1534, name: '奥斯曼征服', result: '胜利' },
      ],
      weapons: [
        { year: 800, count: 30000, name: '阿拔斯装备' },
        { year: 1258, count: 15000, name: '蒙古入侵前' },
        { year: 1500, count: 20000, name: '奥斯曼火器' },
      ],
    },
    culture: {
      literature: [
        { year: 800, count: 300, name: '百年翻译运动' },
        { year: 1000, count: 400, name: '阿拉伯文学' },
        { year: 1500, count: 200, name: '奥斯曼' },
      ],
      inventions: [
        { year: 800, impact: 95, name: '代数发明' },
        { year: 900, impact: 90, name: '医院体系' },
        { year: 1000, impact: 85, name: '光学研究' },
        { year: 1500, impact: 85, name: '奥斯曼建筑' },
      ],
      education: [
        { year: 800, literacyRate: 35, name: '翻译运动' },
        { year: 1000, literacyRate: 30, name: '学术黄金期' },
        { year: 1500, literacyRate: 25, name: '奥斯曼' },
      ],
      religion: [
        { name: '伊斯兰教', followers: 90 },
        { name: '基督教', followers: 5 },
        { name: '犹太教', followers: 5 },
      ],
    },
  },

  // 君士坦丁堡
  constantinople: {
    economic: {
      tradeRatio: [
        { year: 330, value: 70, name: '建都初期' },
        { year: 550, value: 85, name: '查士丁尼' },
        { year: 800, value: 75, name: '破坏圣像时期' },
        { year: 1204, value: 30, name: '十字军劫掠' },
        { year: 1453, value: 20, name: '陷落前夕' },
        { year: 1500, value: 60, name: '奥斯曼复兴' },
      ],
      caravans: [
        { year: 550, count: 400, name: '拜占庭鼎盛' },
        { year: 800, count: 300, name: '阿拉伯战争' },
        { year: 1000, count: 250, name: '马其顿王朝' },
        { year: 1500, count: 350, name: '奥斯曼' },
      ],
      agriculture: [
        { name: '粮食作物', value: 30 },
        { name: '经济作物', value: 40 },
        { name: '果蔬种植', value: 25 },
        { name: '其他作物', value: 5 },
      ],
      revenue: [
        { year: 550, value: 600, name: '查士丁尼' },
        { year: 800, value: 400, name: '破坏圣像' },
        { year: 1025, value: 400, name: '巴西尔二世' },
        { year: 1500, value: 500, name: '奥斯曼' },
      ],
    },
    population: {
      total: [
        { year: 330, value: 100, name: '建都初期' },
        { year: 550, value: 500, name: '查士丁尼' },
        { year: 800, value: 300, name: '阿拉伯战争' },
        { year: 1025, value: 400, name: '马其顿王朝' },
        { year: 1453, value: 50, name: '陷落前夕' },
        { year: 1500, value: 200, name: '奥斯曼' },
      ],
      distribution: [
        { name: '城内居民', value: 60 },
        { name: '郊区居民', value: 30 },
        { name: '农村居民', value: 10 },
      ],
      urbanRatio: [
        { year: 550, value: 55, name: '查士丁尼' },
        { year: 1025, value: 50, name: '马其顿王朝' },
        { year: 1500, value: 45, name: '奥斯曼' },
      ],
      density: [
        { year: 550, count: 400, name: '查士丁尼' },
        { year: 1025, count: 350, name: '马其顿王朝' },
        { year: 1500, count: 250, name: '奥斯曼' },
      ],
    },
    military: {
      armySize: [
        { year: 550, value: 50, name: '贝利撒留' },
        { year: 800, value: 30, name: '破坏圣像' },
        { year: 1025, value: 40, name: '巴西尔二世' },
        { year: 1453, value: 8, name: '末代皇帝' },
        { year: 1500, value: 40, name: '奥斯曼' },
      ],
      composition: [
        { name: '重骑兵', value: 40 },
        { name: '步兵', value: 45 },
        { name: '海军', value: 15 },
      ],
      battles: [
        { year: 717, name: '阿拉伯围攻', result: '胜利' },
        { year: 1071, name: '曼齐克特', result: '惨败' },
        { year: 1204, name: '第四次十字军', result: '陷落' },
        { year: 1453, name: '奥斯曼征服', result: '陷落' },
        { year: 1500, name: '巩固统治', result: '稳定' },
      ],
      weapons: [
        { year: 550, count: 25000, name: '拜占庭装备' },
        { year: 1025, count: 30000, name: '瓦兰吉卫队' },
        { year: 1500, count: 35000, name: '奥斯曼火器' },
      ],
    },
    culture: {
      literature: [
        { year: 550, count: 200, name: '希腊学术' },
        { year: 800, count: 150, name: '破坏圣像' },
        { year: 1000, count: 150, name: '拜占庭复兴' },
        { year: 1500, count: 180, name: '奥斯曼' },
      ],
      inventions: [
        { year: 672, impact: 95, name: '希腊火' },
        { year: 800, impact: 85, name: '圣像艺术' },
        { year: 1000, impact: 90, name: '拜占庭建筑' },
        { year: 1500, impact: 85, name: '奥斯曼艺术' },
      ],
      education: [
        { year: 550, literacyRate: 30, name: '查士丁尼' },
        { year: 1000, literacyRate: 25, name: '马其顿王朝' },
        { year: 1500, literacyRate: 20, name: '奥斯曼' },
      ],
      religion: [
        { name: '东正教', followers: 95 },
        { name: '其他基督教', followers: 5 },
      ],
    },
  },
}
