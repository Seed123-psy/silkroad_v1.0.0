# 表 6 — 蒙元路线（Line）属性表设计

此文档描述“表 6”——蒙元路线（线要素）的属性字段设计（建议），并给出了在解析 shapefile 时可用的候选字段名，方便在代码中做容错匹配。

字段设计（字段名 / 类型 / 说明）：

- Nature / string / 性质：路线的性质或类型（例如“商道”“军事”“朝贡”等）。候选字段：`性质`, `nature`, `property`。
- Name / string / 路线名称（显示用）。候选字段：`Name`, `名称`, `name`, `NAME`, `RouteName`, `route_name`。
- Begin_Time / string|number / 开始时间（可为年份或区间）。候选字段：`Begin_Time`, `begin_time`, `BeginTime`, `StartYear`, `begin`, `start_year`。
- End_Time / string|number / 结束时间（可为年份或区间）。候选字段：`End_Time`, `end_time`, `EndTime`, `EndYear`, `end`, `finish_year`。
- Begin_Place / string / 路线起点（地点名或编码）。候选字段：`Begin_Place`, `begin_place`, `StartPlace`, `起点`, `from`, `start_place`。
- End_Place / string / 路线终点（地点名或编码）。候选字段：`End_Place`, `end_place`, `EndPlace`, `终点`, `to`, `end_place`。
- Tourist / string / 记录该路线来源的旅行家或来源文本（可为空）。候选字段：`Tourist`, `traveler`, `Traveler`, `旅行家`, `traveller`。
- Class / string / 分类：路线分类（例如“商道/军事/宗教/邮驿”）。候选字段：`Class`, `class`, `分类`, `TYPE`, `type`。
- Code / string / 唯一编码或 ID。候选字段：`Code`, `code`, `编码`, `ID`, `id`。
- Reference / string / 参考资料或来源说明（可包含书名/页码/URL）。候选字段：`Reference`, `reference`, `参考`, `参考资料`, `ref`, `source`。

备注：
- 字段应尽量统一编码为 UTF-8（或在数据导入阶段检测并转换编码），并在解析时对不同命名和字符集做容错处理。
- 时间字段（Begin_Time / End_Time）可为数字（例如年份 1218）或字符串（"约 13 世纪"），前端展示时按原样显示或做格式化。
- 为实现稳定的前端显示，建议在数据准备阶段将主要字段（至少 `Name` 和 `Code`）标准化到固定字段名，减少前端运行时的匹配成本。

示例（JSON 属性对象）：

{
  "Name": "长安—阿克苏商路",
  "Begin_Time": "13 世纪",
  "End_Time": "14 世纪",
  "Begin_Place": "长安",
  "End_Place": "阿克苏",
  "Tourist": "马可·波罗",
  "Class": "商道",
  "Code": "MENG-001218",
  "Reference": "《丝绸之路史》卷三"
}

---

下步：代码层面已在 `src/views/MengYuanRoutes.vue` 中增加了基于这些候选字段名的弹窗（悬浮面板）构建逻辑，当鼠标悬停在路线要素上时会在左上角显示上述信息。若需要我可以把候选字段扩展或调整为您数据中的确切字段名。