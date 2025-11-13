# 丝绸之路数据可视化项目 - 实现任务列表

本任务列表将设计文档转化为可执行的开发任务，每个任务都是增量式的，确保代码逐步集成。

## 任务列表

- [x] 1. 初始化项目并配置开发环境













  - 使用Vite创建Vue 3 + TypeScript项目
  - 配置ESLint和Prettier代码规范
  - 配置Sass预处理器
  - 安装核心依赖：Vue Router、Pinia、Three.js、ECharts、GSAP等
  - 创建基础目录结构
  - _需求: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. 创建TypeScript类型定义和数据模型





  - 创建types目录及类型文件（city.ts, event.ts, trade.ts, artifact.ts, display.ts）
  - 定义City、Route、Dynasty、HistoricalEvent等核心接口
  - 定义TradeRecord、CulturalSite、Artifact等数据接口
  - 定义ArtifactType、DisplayConfig、DisplayPreset等展示配置接口
  - _需求: 2.2, 3.2, 5.3, 7.1, 7.13, 7.15, 11.1_

- [x] 3. 准备静态数据和资源





  - 创建assets目录结构（data、geojson、images、models、styles）
  - 整合已提供的城市数据JSON文件
  - 创建朝代数据（dynasties.json）包含汉、唐、宋、元、明、清等朝代
  - 创建历史事件数据（events.json）至少20个重要事件
  - 创建贸易数据（trades.json）包含丝绸、瓷器、香料、茶叶、金属等商品
  - 创建文化遗址数据（sites.json）至少20个遗址，包含文物的type和displayConfig字段
  - 创建3D展示预设配置文件（displayPresets.json）
  - 准备占位图片资源
  - 整合已提供的地球纹理贴图
  - _需求: 2.2, 3.2, 5.3, 6.1, 6.2, 6.3, 7.1, 7.2, 7.13, 7.15, 7.17, 11.1, 11.2, 11.3_

- [x] 4. 创建全局样式系统




  - 创建variables.scss定义颜色、字体、间距等设计变量
  - 创建mixins.scss定义响应式断点和常用混合
  - 创建transitions.scss定义动画过渡效果
  - 创建全局样式文件main.scss
  - _需求: 1.5, 9.1, 9.2, 9.3, 12.5_

- [ ] 5. 实现工具函数库
- [x] 5.1 创建Three.js辅助函数（threeHelpers.ts）





  - 实现latLngToVector3经纬度转换函数
  - 实现createCityMarker城市标注创建函数
  - 实现createRoute路线创建函数
  - 实现createStarField星空背景创建函数
  - 实现createTextTexture文字纹理创建函数
  - _需求: 2.3, 2.4, 2.5, 2.6_

- [x] 5.2 创建坐标转换工具（coordinateUtils.ts）





  - 实现geoToScreen地理坐标转屏幕坐标函数
  - 实现greatCircleDistance大圆距离计算函数
  - 实现generateArcPoints弧线路径生成函数
  - _需求: 2.3, 2.4_

- [x] 5.3 创建数据处理工具（dataProcessor.ts）




  - 实现groupByPeriod按时期分组函数
  - 实现aggregateTradeData贸易数据聚合函数
  - 实现calculateStatistics统计计算函数
  - _需求: 3.3, 5.4, 8.5_


- [ ] 6. 实现服务层
- [x] 6.1 创建数据服务（dataService.ts）





  - 实现loadCities加载城市数据方法
  - 实现loadEvents加载历史事件方法
  - 实现loadTradeData加载贸易数据方法
  - 实现loadSites加载遗址数据方法
  - 实现loadGeoJSON加载地理数据方法
  - 实现filterByPeriod和filterByCity筛选方法
  - _需求: 2.2, 3.2, 5.3, 7.1, 11.4_

- [x] 6.2 创建导出服务（exportService.ts）





  - 实现exportToJSON导出JSON方法
  - 实现exportToCSV导出CSV方法
  - 实现exportChartAsImage导出图表图片方法
  - _需求: 5.6, 11.5_

- [x] 6.3 创建模型加载服务（modelLoaderService.ts）





  - 实现loadModel加载3D模型方法
  - 实现preloadModels预加载方法
  - 实现模型缓存机制
  - _需求: 7.8, 7.9_

- [-] 7. 实现Pinia状态管理

- [x] 7.1 创建Dynasty Store（dynastyStore.ts）




  - 定义dynasties、currentDynasty、loading状态
  - 实现loadDynasties加载朝代数据action
  - 实现setCurrentDynasty设置当前朝代action
  - 实现getDynastyByYear根据年份获取朝代getter
  - _需求: 3.1, 8.2_
-

- [x] 7.2 创建Period Store（periodStore.ts）




  - 定义selectedPeriod、timeRange、filteredEvents状态
  - 实现setPeriod设置时期action
  - 实现setTimeRange设置时间范围action
  - 实现filterEventsByRange筛选事件action
  - _需求: 3.3, 3.5, 8.3, 8.5_
-

- [x] 7.3 创建Chart Store（chartStore.ts）




  - 定义chartType、chartData、exportFormat状态
  - 实现setChartType设置图表类型action
  - 实现updateChartData更新图表数据action
  - 实现exportData导出数据action
  - _需求: 5.4, 5.5, 5.6, 8.4_

- [-] 8. 创建Globe3D
组件（3D地球核心组件）
- [x] 8.1 实现基础3D场景




  - 创建Globe3D.vue组件文件
  - 初始化Three.js场景、相机、渲染器
  - 创建地球几何体和材质
  - 加载并应用地球纹理贴图
  - 添加环境光和方向光
  - 实现渲染循环
  - _需求: 2.1, 2.17_

- [x] 8.2 实现星空背景





  - 使用createStarField工具函数创建星空
  - 添加星空到场景中
  - 实现星空缓慢旋转动画
  - _需求: 2.6_
-

- [x] 8.3 实现城市标注系统




  - 使用createCityMarker创建城市标注组
  - 将城市数据存储在marker的userData中
  - 根据城市importance调整标注大小和光效
  - 实现标签Billboard效果（始终面向相机）
  - 添加所有城市标注到场景
  - _需求: 2.2, 2.5, 2.8_

- [x] 8.4 实现贸易路线绘制






  - 使用createRoute工具函数创建路线
  - 根据路线类型（陆路/海路）使用不同颜色和样式
  - 添加路线到场景中
  - _需求: 2.4_

- [x] 8.5 实现鼠标交互检测










  - 初始化THREE.Raycaster
  - 监听mousemove事件实现悬停检测
  - 监听click事件实现单击交互
  - 监听dblclick事件实现双击交互
  - 通过userData识别被点击的城市
  - 发射对应的事件（city-hover、city-click、city-dblclick）
  - _需求: 2.7, 2.9, 2.10, 2.11, 2.12_

- [x] 8.6 实现相机控制和动画




  - 集成OrbitControls实现拖拽旋转和缩放
  - 实现空格键切换自动旋转功能
  - 使用GSAP实现双击城市时的相机聚焦动画
  - 确保动画可中断和重新开始
  - _需求: 2.12, 2.13, 2.14, 2.15, 2.16_

- [x] 8.7 实现组件Props和Emits





  - 定义Globe3DProps接口（cities、routes、selectedPeriod、autoRotate）
  - 定义Globe3DEmits接口（city-hover、city-click、city-dblclick）
  - 实现props响应式更新逻辑
  - 根据selectedPeriod筛选显示的城市和路线
  - _需求: 2.2, 2.9, 2.10, 2.11_

- [x] 8.8 实现性能优化






  - 实现LOD（Level of Detail）根据距离调整细节
  - 限制同时显示的标签数量
  - 优化渲染循环，避免不必要的重绘
  - 实现视锥体剔除
  - _需求: 9.5, 10.5_


- [x] 9. 创建CityInfoPanel组件（城市信息面板）





  - 创建CityInfoPanel.vue组件
  - 接收city prop显示城市详细信息
  - 显示城市名称、经纬度、描述、时期、重要性
  - 显示城市相关的贸易商品和文化特征
  - 添加关闭按钮
  - 实现面板显示/隐藏动画
  - _需求: 2.11_

- [x] 10. 创建TradeVolumeChart组件（贸易图表）




  - 创建TradeVolumeChart.vue组件
  - 集成vue-echarts
  - 实现柱状图配置
  - 实现折线图配置
  - 实现饼图配置
  - 根据chartType prop切换图表类型
  - 根据period和city prop筛选和更新数据
  - 实现图表响应式调整
  - _需求: 2.10, 5.1, 5.4, 5.5_

- [ ] 11. 创建TimeAxis组件（时间轴）




  - 在左侧组件栏添加，设计新页面，使用高德地图api显示地图
  - 创建TimeAxis.vue组件
  - 使用D3.js绘制时间轴
  - 显示朝代时间段（汉、唐、宋、元、明、清等）
  - 在时间轴上标注历史事件
  - 实现朝代点击事件，触发period-change
  - 实现事件点击事件，触发event-click
  - 使用GSAP实现平滑滚动和缩放动画
  - _需求: 3.1, 3.2, 3.3, 3.4, 3.6_

- [ ] 12. 创建TimelineSlider组件（时间范围滑块）
  - 创建TimelineSlider.vue组件
  - 实现双滑块范围选择器
  - 显示当前选中的时间范围
  - 触发range-change事件
  - 集成到TimeAxis组件中
  - _需求: 3.5_

- [ ] 13. 创建ArtifactViewer3D组件（3D文物查看器）
- [ ] 13.1 实现基础3D查看器
  - 创建ArtifactViewer3D.vue组件
  - 初始化Three.js场景、相机、渲染器
  - 使用GLTFLoader加载3D模型
  - 集成OrbitControls实现旋转和缩放
  - 添加环境光和方向光
  - 实现加载进度显示
  - 实现自动旋转功能
  - 处理模型加载错误，显示占位内容
  - _需求: 7.7, 7.8, 7.9, 7.10, 7.11, 7.12_

- [ ] 13.2 创建展示预设配置文件
  - 创建assets/data/displayPresets.json文件
  - 定义陶器、雕塑、织物、金属器、玉器、绘画等类型的预设配置
  - 为每个预设配置相机距离、角度、目标偏移、光照强度等参数
  - 添加自定义预设示例（如兵马俑专用配置）
  - _需求: 7.13, 7.15, 7.17_

- [ ] 13.3 实现展示预设加载和应用逻辑
  - 在dataService中添加loadDisplayPresets方法
  - 根据文物类型自动选择对应的展示预设
  - 实现预设配置到相机位置的转换逻辑
  - 使用GSAP实现相机平滑过渡到预设位置
  - 支持自定义displayConfig覆盖预设配置
  - _需求: 7.13, 7.14, 7.15, 7.16_

- [ ] 13.4 优化展示预设系统
  - 实现预设配置的验证和默认值处理
  - 添加预设切换功能（允许用户手动切换不同预设）
  - 实现预设配置的热重载（开发模式）
  - 添加预设效果预览功能
  - _需求: 7.14, 7.16, 7.17_

- [ ] 14. 创建NavigationMenu组件（导航菜单）
  - 创建NavigationMenu.vue组件
  - 显示所有页面的导航链接
  - 高亮当前活动页面
  - 实现响应式设计（移动端汉堡菜单）
  - 添加页面切换动画
  - _需求: 4.2, 4.5, 9.3_

- [ ] 15. 实现路由系统
  - 创建router/index.ts文件
  - 配置7个主要页面路由（Home、Dashboard、Trade、CulturalExchange、HistoricalEvents、Location、Sites）
  - 配置SiteDetail动态路由
  - 实现路由懒加载
  - 添加路由守卫更新页面标题
  - 实现页面切换过渡动画
  - _需求: 4.1, 4.3, 4.4, 4.5, 10.4_

- [ ] 16. 创建Home页面（首页）
  - 创建pages/Home.vue文件
  - 集成Globe3D组件作为主要展示
  - 添加欢迎文字和项目介绍
  - 集成CityInfoPanel组件
  - 集成TradeVolumeChart组件（悬停时显示）
  - 处理Globe3D的事件（city-hover、city-click、city-dblclick）
  - 实现响应式布局
  - _需求: 2.1-2.17, 9.1, 9.2, 9.3_

- [ ] 17. 创建MainDashboard页面（主仪表盘）
  - 创建pages/MainDashboard.vue文件
  - 显示项目概览统计数据
  - 集成TimeAxis组件
  - 显示当前选中时期的关键信息
  - 集成多个TradeVolumeChart组件展示不同维度数据
  - 实现数据联动（时期变化时更新所有图表）
  - _需求: 3.1-3.6, 5.1-5.6_

- [ ] 18. 创建Trade页面（贸易分析）
  - 创建pages/Trade.vue文件
  - 显示贸易路线地图
  - 集成多个TradeVolumeChart组件
  - 显示主要贸易商品列表
  - 实现按时期、城市、商品筛选
  - 添加数据导出功能
  - _需求: 5.1-5.6_

- [ ] 19. 创建CulturalExchange页面（文化交流）
  - 创建pages/CulturalExchange.vue文件
  - 显示文化交流地图
  - 展示宗教传播路线（佛教、伊斯兰教、基督教）
  - 展示艺术交流案例（至少10个）
  - 展示技术传播内容（至少5项）
  - 实现文化类别筛选，高亮相关路线
  - 为每个案例提供图文说明
  - _需求: 6.1-6.5_

- [ ] 20. 创建HistoricalEvents页面（历史事件）
  - 创建pages/HistoricalEvents.vue文件
  - 集成TimeAxis组件
  - 显示历史事件列表
  - 实现按朝代、类型筛选事件
  - 点击事件显示详细信息
  - 在地图上标注事件相关城市
  - _需求: 3.1-3.6_

- [ ] 21. 创建Location页面（位置页面）
  - 创建pages/Location.vue文件
  - 显示所有城市列表
  - 实现按地理位置、时期筛选
  - 点击城市显示详细信息
  - 集成地图展示城市位置
  - _需求: 2.2, 7.5_

- [ ] 22. 创建Site页面（遗址展示列表）
  - 创建pages/Site.vue文件
  - 显示所有文化遗址列表（至少20个）
  - 为每个遗址显示缩略图（使用占位图）
  - 显示遗址基本信息（名称、类型、时期）
  - 实现按地理位置、历史时期筛选
  - 点击遗址跳转到详情页
  - _需求: 7.1, 7.2, 7.5_

- [ ] 23. 创建SiteDetail页面（遗址详情）
  - 创建pages/SiteDetail.vue文件
  - 根据路由参数加载遗址数据
  - 显示遗址详细信息（地理位置、历史背景、考古发现）
  - 显示遗址图片画廊（至少3张，使用占位图）
  - 显示遗址相关文物列表
  - 集成ArtifactViewer3D组件展示3D文物模型
  - 如果有视频资料，提供视频播放功能
  - _需求: 7.1-7.12_


- [ ] 24. 创建App.vue根组件
  - 创建App.vue文件
  - 集成NavigationMenu组件
  - 添加router-view用于页面切换
  - 实现全局加载状态
  - 添加全局错误边界
  - 应用全局样式
  - _需求: 4.2, 4.5_

- [ ] 25. 创建应用入口文件
  - 创建main.ts文件
  - 初始化Vue应用
  - 注册Vue Router
  - 注册Pinia
  - 导入全局样式
  - 挂载应用到DOM
  - _需求: 1.1, 1.2_

- [ ] 26. 实现Web Workers
- [ ] 26.1 创建数据处理Worker（dataWorker.ts）
  - 实现FILTER_BY_PERIOD消息处理
  - 实现AGGREGATE_DATA消息处理
  - 实现CALCULATE_STATS消息处理
  - _需求: 10.2, 10.6_

- [ ] 26.2 创建贸易数据Worker（tradeWorker.ts）
  - 实现PROCESS_TRADE_DATA消息处理
  - 实现CALCULATE_TRADE_VOLUME消息处理
  - _需求: 10.2, 10.6_

- [ ] 26.3 在组件中集成Web Workers
  - 在需要处理大数据的组件中使用Workers
  - 实现Worker消息通信
  - 处理Worker返回结果
  - _需求: 10.2, 10.6_

- [ ] 27. 实现响应式设计优化
  - 为所有页面添加移动端适配样式
  - 实现移动端触摸手势支持
  - 优化3D地球在移动设备上的性能
  - 测试不同屏幕尺寸（320px-2560px）
  - _需求: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 28. 实现性能优化
  - 实现图片懒加载
  - 优化3D模型加载（压缩、缓存）
  - 实现路由组件懒加载
  - 配置Vite构建优化（代码分割、压缩）
  - 优化Three.js渲染性能（LOD、视锥体剔除）
  - 优化ECharts图表渲染（数据采样、按需更新）
  - _需求: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 29. 实现错误处理
  - 创建错误类型定义（ErrorType枚举）
  - 实现网络错误处理（自动重试、降级方案）
  - 实现数据加载错误处理
  - 实现3D渲染错误处理（WebGL兼容性检测）
  - 实现模型加载错误处理
  - 添加用户友好的错误提示
  - _需求: 2.1, 7.8_

- [ ] 30. 配置构建和部署
  - 配置vite.config.ts（构建目标、代码分割、优化）
  - 配置环境变量（开发、测试、生产）
  - 创建.env文件
  - 配置package.json脚本
  - 创建README.md文档
  - _需求: 1.2_

- [ ]* 31. 编写测试
- [ ]* 31.1 编写工具函数单元测试
  - 测试latLngToVector3坐标转换
  - 测试数据处理函数
  - 测试统计计算函数
  - _需求: 2.3, 5.4_

- [ ]* 31.2 编写组件测试
  - 测试Globe3D组件渲染
  - 测试TimeAxis组件交互
  - 测试TradeVolumeChart组件
  - 测试导航和路由
  - _需求: 2.1, 3.1, 5.1, 4.1_

- [ ]* 31.3 编写E2E测试
  - 测试首页加载和3D地球交互
  - 测试页面导航流程
  - 测试数据筛选和图表更新
  - 测试遗址详情页和3D模型加载
  - _需求: 2.1-2.17, 4.1-4.5, 7.1-7.12_

- [ ] 32. 最终集成和测试
  - 测试所有页面功能
  - 测试数据联动和状态管理
  - 测试响应式布局
  - 测试性能指标（首屏加载、渲染帧率）
  - 修复发现的bug
  - 优化用户体验
  - _需求: 所有需求_

## 任务说明

- 标记为 `*` 的任务为可选任务，主要是测试相关
- 每个任务都包含了对应的需求引用
- 任务按照依赖关系排序，建议按顺序执行
- 某些任务可以并行执行（如不同页面的创建）
- 所有任务完成后，项目应该是一个完整可运行的应用

## 数据说明

- 使用已提供的真实数据文件
- 创建基于历史事实的合理伪数据
- 图片使用单张占位图代替
- 3D模型使用简单几何体或占位模型
- 后续可以替换为真实的图片和Blender模型
