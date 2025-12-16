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
const MODEL_ID = process.env.MODEL_ID || 'moonshotai/Kimi-K2-Instruct';

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  console.log('Received message:', message);

  if (!SILICON_API_KEY) {
    console.warn('SILICONFLOW_API_KEY is not set in environment');
  }

  try {
    // Forward request to Siliconflow chat completion endpoint
    const endpoint = `${SILICON_BASE.replace(/\/$/, '')}/chat/completions`;

    const payload = {
      model: MODEL_ID,
      messages: [
        { 
          role: 'system', 
          content: 'You are a helpful assistant knowledgeable about the Silk Road history. Answer the user\'s questions clearly and concisely in plain text. Do not generate repetitive patterns or unrelated tables.' 
        },
        { role: 'user', content: message }
      ],
      max_tokens: 512,
      temperature: 0.3,
      top_p: 0.9,
      frequency_penalty: 0.5,
    };

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
      throw new Error('Upstream API error');
    }

    const data = await resp.json();

    // Try common response shapes
    let replyText = '';
    if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
      // e.g., { choices: [{ text: '...' }] }
      replyText = data.choices[0].text || data.choices[0].message?.content || '';
    } else if (data.output && Array.isArray(data.output) && data.output.length > 0) {
      // alternative shape
      replyText = data.output[0].content || data.output[0].text || '';
    } else if (data.reply) {
      replyText = data.reply;
    } else {
      replyText = JSON.stringify(data);
    }

    res.json({ reply: replyText });
  } catch (err) {
    console.error('Error proxying to Siliconflow:', err);
    // Fallback small local answer
    let fallback = '抱歉，智能助手暂时无法连接到模型服务，请稍后重试。';
    res.json({ reply: fallback });
  }
});

app.get('/', (req, res) => {
  res.send('Silkroad AI proxy running');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
