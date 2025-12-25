const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
// 支持通过环境变量配置请求体大小限制，默认 10mb
const BODY_PARSER_LIMIT = process.env.BODY_PARSER_LIMIT || '10mb';
app.use(bodyParser.json({ limit: BODY_PARSER_LIMIT }));
app.use(bodyParser.urlencoded({ limit: BODY_PARSER_LIMIT, extended: true }));

const SILICON_API_KEY = process.env.SILICONFLOW_API_KEY;
const SILICON_BASE = process.env.SILICONFLOW_API_URL || 'https://api.siliconflow.cn/v1';
// 思考模式使用的模型（支持深度推理）
const THINKING_MODEL_ID = process.env.THINKING_MODEL_ID || process.env.MODEL_ID || 'zai-org/GLM-4.6V';
// 快速模式使用的模型（直接回答，不思考）
const FAST_MODEL_ID = process.env.FAST_MODEL_ID || 'Qwen/Qwen3-VL-235B-A22B-Instruct';

app.post('/api/chat', async (req, res) => {
  const { message, images, mode } = req.body;
  // mode: 'fast' (快速回答) | 'thinking' (深度思考) | 'route' (路线生成)
  const isRouteMode = mode === 'route';
  const thinkingMode = mode !== 'fast' || isRouteMode;
  // 根据模式选择模型
  const selectedModel = thinkingMode ? THINKING_MODEL_ID : FAST_MODEL_ID;
  
  console.log('Received message:', message);
  console.log('Images count:', images?.length || 0);
  console.log('Mode:', mode);
  console.log('isRouteMode:', isRouteMode);
  console.log('Using model:', selectedModel);

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!SILICON_API_KEY) {
    console.warn('SILICONFLOW_API_KEY is not set in environment');
    res.write(`data: ${JSON.stringify({ error: 'API Key not configured' })}\n\n`);
    res.end();
    return;
  }

  try {
    // Forward request to Siliconflow chat completion endpoint
    const endpoint = `${SILICON_BASE.replace(/\/$/, '')}/chat/completions`;

    // 构建用户消息内容
    let userContent = [];

    // 如果有图片，先添加图片
    if (images && Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        userContent.push({
          type: 'image_url',
          image_url: { url: img }
        });
      }
    }

    // 添加文本内容（如果没有文字，提供默认提示）
    const textContent = message || '请分析这张图片，并说明其与丝绸之路的关联。';
    userContent.push({
      type: 'text',
      text: textContent
    });

    // 根据模式调整系统提示词
    let systemPrompt;
    if (isRouteMode) {
      // 路线模式：基于真实历史地理数据生成路线
      systemPrompt = `你是丝绸之路历史地理专家，负责生成真实的历史路线坐标。

## 核心规则
1. 必须基于真实的历史地理位置生成坐标
2. 只能选择真实存在的城市、驿站、关隘作为途经点
3. 路线必须符合历史事实和地理逻辑
4. 绝对禁止编造虚假坐标

## 输出格式
仅输出经纬度坐标，每行一个，格式：经度,纬度
禁止输出任何文字、地名、标题、序号、注释或解释。

## 重要历史地点参考（必须使用真实坐标）

### 主要城市
- 长安/西安: 108.94, 34.34
- 洛阳: 112.45, 34.62
- 敦煌: 94.66, 40.14
- 撒马尔罕: 66.97, 39.63
- 喀什: 75.99, 39.47
- 布哈拉: 64.42, 39.77
- 梅尔夫: 62.18, 37.66
- 巴格达: 44.36, 33.31
- 君士坦丁堡/伊斯坦布尔: 28.98, 41.01

### 河西走廊城镇
- 武威/凉州: 102.64, 37.93
- 张掖/甘州: 100.45, 38.93
- 酒泉/肃州: 98.49, 39.74
- 嘉峪关: 98.29, 39.77

### 西域重镇
- 哈密: 93.51, 42.83
- 吐鲁番/高昌: 89.18, 42.95
- 库车/龟兹: 82.97, 41.72
- 和田/于阗: 79.92, 37.11

### 中亚节点
- 费尔干纳/大宛: 71.77, 40.38
- 塔什干: 69.24, 41.27
- 赫拉特: 62.20, 34.35

### 其他重要地点
- 霍尔木兹: 56.15, 27.18
- 亚历山大港: 29.92, 31.20
- 泉州: 118.68, 24.88
- 广州: 113.26, 23.13

## 生成步骤
1. 识别用户询问的起点和终点
2. 查找历史上该路线途经的真实地点
3. 按地理顺序排列途经点
4. 根据路线长度，输出5-15个关键节点
5. 确保每个坐标对应真实地点

## 输出示例
用户问："从长安到敦煌"
你的回复（仅坐标）：
108.94,34.34
110.47,34.27
112.45,34.62
114.30,34.76
116.00,35.50
102.64,37.93
100.45,38.93
98.49,39.74
94.66,40.14

严格遵守：绝不编造坐标，绝不输出任何文字！`;
    } else if (thinkingMode) {
      systemPrompt = '你是丝绸之路智能助手，精通丝绸之路的历史、地理、文化和贸易。请用中文回答用户问题，回答要清晰、专业且有深度。支持使用 Markdown 格式（如标题、列表、粗体等）来组织回答。当用户上传图片时，请仔细分析图片内容，并说明其与丝绸之路的关联。';
    } else {
      systemPrompt = '你是丝绸之路智能助手，精通丝绸之路的历史、地理、文化和贸易。请直接回答用户问题，回答要清晰简洁。可以使用 Markdown 格式。当用户上传图片时，直接说明其与丝绸之路的关联。';
    }

    console.log('System prompt preview:', systemPrompt.substring(0, 100) + '...');
    console.log('Is route mode?', isRouteMode);

    const payload = {
      model: selectedModel,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userContent
        }
      ],
      max_tokens: thinkingMode ? 4096 : 1024,
      temperature: thinkingMode ? 0.7 : 0.5,
      top_p: 0.9,
      stream: true
    };

    // 快速模式：尝试禁用思考能力，但只有在上游模型/代理支持该参数时才添加
    if (!thinkingMode) {
      const modelKey = String(selectedModel || '').toLowerCase();
      // 常见不支持该参数的模型（例如 Qwen 系列）会导致 400 错误
      const knownUnsupported = ['qwen/'];
      const isUnsupported = knownUnsupported.some(k => modelKey.includes(k));

      if (!isUnsupported) {
        payload.enable_thinking = false;
        payload.thinking_budget = 0;
        payload.reasoning_effort = 'none';
      } else {
        // 如果模型不支持该参数，则仅通过系统提示、temperature 等控制行为
        console.log('Selected model likely does not support enable_thinking param; skipping that parameter.');
      }
    }

    console.log('Sending stream request to API, mode:', thinkingMode ? 'thinking' : 'fast');

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(SILICON_API_KEY ? { Authorization: `Bearer ${SILICON_API_KEY}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('Siliconflow returned error:', resp.status, text);

      // 尝试降级：向上游再次请求非流式响应以获取完整错误信息（如果上游支持），用于调试
      try {
        const fallbackPayload = Object.assign({}, payload, { stream: false });
        const fbResp = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(SILICON_API_KEY ? { Authorization: `Bearer ${SILICON_API_KEY}` } : {}),
          },
          body: JSON.stringify(fallbackPayload),
        });

        const fbText = await fbResp.text();
        console.error('Fallback response:', fbResp.status, fbText);

        // 将错误信息通过 SSE 返回（截断以避免发送过大内容）
        res.write(`data: ${JSON.stringify({ error: 'Upstream API error', status: fbResp.status, detail: fbText ? fbText.substring(0, 2000) : null })}\n\n`);
      } catch (fallbackErr) {
        console.error('Fallback request failed:', fallbackErr);
        res.write(`data: ${JSON.stringify({ error: 'Upstream API error', status: resp.status, detail: text ? text.substring(0, 1000) : null })}\n\n`);
      }

      res.end();
      return;
    }

    // 处理流式响应
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const dataStr = trimmed.slice(6);
        if (dataStr === '[DONE]') {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          continue;
        }

        try {
          const data = JSON.parse(dataStr);
          // 打印原始数据以便调试
          console.log('Stream data:', JSON.stringify(data).substring(0, 300));

          // 区分思考过程 (reasoning_content) 和正式回复 (content)
          let reasoning = '';
          let content = '';

          // 方式1: 提取 reasoning_content 字段（某些模型原生支持）
          if (data.choices?.[0]?.delta?.reasoning_content) {
            reasoning = data.choices[0].delta.reasoning_content;
          }

          // 方式2: 提取 content 字段
          if (data.choices?.[0]?.delta?.content) {
            content = data.choices[0].delta.content;
          } else if (data.output?.[0]?.content) {
            content = data.output[0].content;
          } else if (data.content) {
            content = data.content;
          } else if (typeof data === 'string') {
            content = data;
          }

          // 发送数据到前端，分别传递 reasoning 和 content
          if (reasoning || content) {
            const payload = {};
            if (reasoning) payload.reasoning = reasoning;
            if (content) payload.content = content;
            console.log('Sending:', JSON.stringify(payload).substring(0, 100));
            res.write(`data: ${JSON.stringify(payload)}\n\n`);
          }
        } catch (e) {
          console.error('Parse error:', e.message, 'Data:', dataStr.substring(0, 100));
        }
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Error proxying to Siliconflow:', err);
    res.write(`data: ${JSON.stringify({ error: 'Service error' })}\n\n`);
    res.end();
  }
});

app.get('/', (req, res) => {
  res.send('Silkroad AI proxy running');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
