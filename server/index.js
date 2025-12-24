const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const SILICON_API_KEY = process.env.SILICONFLOW_API_KEY;
const SILICON_BASE = process.env.SILICONFLOW_API_URL || 'https://api.siliconflow.cn/v1';
const MODEL_ID = process.env.MODEL_ID || 'zai-org/GLM-4.6V';

app.post('/api/chat', async (req, res) => {
  const { message, images } = req.body;
  console.log('Received message:', message);
  console.log('Images count:', images?.length || 0);

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

    const payload = {
      model: MODEL_ID,
      messages: [
        {
          role: 'system',
          content: '你是丝绸之路智能助手，精通丝绸之路的历史、地理、文化和贸易。请用中文回答用户问题，回答要清晰简洁。当用户上传图片时，请仔细分析图片内容，并说明其与丝绸之路的关联。'
        },
        {
          role: 'user',
          content: userContent
        }
      ],
      max_tokens: 1024,
      temperature: 0.7,
      top_p: 0.9,
      stream: true  // 启用流式输出
    };

    console.log('Sending stream request to API');

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
      res.write(`data: ${JSON.stringify({ error: 'Upstream API error' })}\n\n`);
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
          console.log('Stream data:', JSON.stringify(data).substring(0, 200));

          // 尝试多种可能的格式
          let content = '';
          if (data.choices?.[0]?.delta?.content) {
            content = data.choices[0].delta.content;
          } else if (data.choices?.[0]?.delta?.reasoning_content) {
            content = data.choices[0].delta.reasoning_content;
          } else if (data.output?.[0]?.content) {
            content = data.output[0].content;
          } else if (data.content) {
            content = data.content;
          } else if (typeof data === 'string') {
            content = data;
          }

          if (content) {
            console.log('Sending content:', content.substring(0, 50));
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
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
