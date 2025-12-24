<template>
  <div class="ancient-chat-view">
    <!-- 背景装饰 -->
    <div class="bg-pattern"></div>

    <div class="chat-container">
      <!-- 顶部标题栏 -->
      <header class="chat-header">
        <div class="header-decoration"></div>
        <div class="header-content">
          <div class="avatar-container">
            <div class="avatar-frame">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="chat-icon">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"/>
              <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14"/>
              <path d="M9 9H9.01"/>
              <path d="M15 9H15.01"/>
              </svg>
            </div>
            <div class="status-dot"></div>
          </div>
          <div class="title-section">
            <h1 class="title">{{ t.chat.title }}</h1>
            <p class="subtitle">{{ t.chat.subtitle }}</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-btn" @click="clearChat" :title="t.chat.clearChat">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </header>

      <!-- 消息区域 -->
      <div class="messages-area" ref="messagesContainer">
        <div class="messages-list">
          <div
            v-for="(msg, index) in messages"
            :key="index"
            class="message-item"
            :class="msg.role"
          >
            <!-- AI 消息 -->
            <template v-if="msg.role === 'assistant'">
              <div class="message-avatar ai-avatar">
                <div class="avatar-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"/>
                  </svg>
                </div>
              </div>
              <div class="message-bubble ai-bubble">
                <div v-if="msg.type === 'text'" class="bubble-content">
                  <div class="bubble-decoration"></div>
                  <p class="message-text">{{ msg.content }}</p>
                </div>
                <div v-else-if="msg.type === 'loading'" class="typing-indicator">
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                </div>
                <div v-else-if="msg.type === 'image'" class="image-content">
                  <img :src="msg.content" alt="AI发送的图片" class="chat-image" />
                </div>
                <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
              </div>
            </template>

            <!-- 用户消息 -->
            <template v-else>
              <div class="message-bubble user-bubble">
                <div v-if="msg.type === 'text'" class="bubble-content">
                  <p class="message-text">{{ msg.content }}</p>
                </div>
                <div v-else-if="msg.type === 'image'" class="image-content">
                  <img :src="msg.content" alt="用户发送的图片" class="chat-image" />
                  <button class="remove-image-btn" @click="removeMessage(index)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
              </div>
              <div class="message-avatar user-avatar">
                <div class="avatar-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 建议问题区域 -->
      <div class="suggestions-area" v-if="messages.length <= 1">
        <div class="suggestions-header">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="suggestions-icon">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <h3>{{ t.chat.suggested.title }}</h3>
        </div>
        <div class="suggestion-grid">
          <button
            v-for="(q, key) in suggestedQuestions"
            :key="key"
            class="suggestion-card"
            @click="sendMessage(q)"
          >
            <div class="card-icon">✦</div>
            <span class="card-text">{{ q }}</span>
          </button>
        </div>
      </div>

      <!-- 图片预览区域 -->
      <div class="image-previews" v-if="pendingImages.length > 0">
        <div class="preview-list">
          <div v-for="(img, index) in pendingImages" :key="index" class="image-preview">
            <img :src="img" alt="预览" />
            <button class="preview-remove" @click="removePendingImage(index)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <footer class="input-area">
        <div class="input-container">
          <!-- 图片上传按钮 -->
          <div class="upload-section">
            <input
              type="file"
              ref="fileInputRef"
              accept="image/*"
              multiple
              @change="handleFileSelect"
              style="display: none"
            />
            <button class="upload-btn" @click="triggerFileInput" :title="t.chat.uploadImage">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>
          </div>

          <!-- 文本输入框 -->
          <div class="input-wrapper">
            <textarea
              v-model="userInput"
              :placeholder="t.chat.placeholder"
              @keydown.enter.prevent="handleEnter"
              @keydown.enter.shift.prevent
              rows="1"
              ref="textareaRef"
              class="message-input"
            ></textarea>
            <div class="input-actions">
              <span class="char-count" :class="{ warning: userInput.length > 500 }">
                {{ userInput.length }}/2000
              </span>
            </div>
          </div>

          <!-- 发送按钮 -->
          <button
            class="send-btn"
            @click="handleSend"
            :disabled="(!userInput.trim() && pendingImages.length === 0) || isLoading"
            :class="{ active: userInput.trim() || pendingImages.length > 0 }"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>

        <!-- 底部提示 -->
        <div class="input-footer">
          <span class="footer-hint">{{ t.chat.inputHint }}</span>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  type: 'text' | 'loading' | 'image'
}

const messages = ref<Message[]>([])
const userInput = ref('')
const isLoading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const pendingImages = ref<string[]>([])

const suggestedQuestions = computed(() => {
  return [
    t.value.chat.suggested.q1,
    t.value.chat.suggested.q2,
    t.value.chat.suggested.q3,
    t.value.chat.suggested.q4
  ]
})

onMounted(() => {
  messages.value.push({
    role: 'assistant',
    content: t.value.chat.welcome,
    timestamp: Date.now(),
    type: 'text'
  })
})

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const adjustTextareaHeight = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = Math.min(textareaRef.value.scrollHeight, 150) + 'px'
  }
}

watch(userInput, () => {
  adjustTextareaHeight()
})

const handleEnter = (e: KeyboardEvent) => {
  if (!e.shiftKey) {
    handleSend()
  }
}

const clearChat = () => {
  messages.value = [{
    role: 'assistant',
    content: t.value.chat.welcome,
    timestamp: Date.now(),
    type: 'text'
  }]
}

const removeMessage = (index: number) => {
  messages.value.splice(index, 1)
}

const handleSend = () => {
  const text = userInput.value.trim()
  if ((!text && pendingImages.value.length === 0) || isLoading.value) return
  sendMessage(text)
}

// 图片上传处理
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files) return

  Array.from(files).forEach(file => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (result) {
          pendingImages.value.push(result)
        }
      }
      reader.readAsDataURL(file)
    }
  })

  // 清空input以允许重复选择同一文件
  target.value = ''
}

const removePendingImage = (index: number) => {
  pendingImages.value.splice(index, 1)
}

const sendMessage = async (text: string) => {
  // 先保存待发送的图片数据
  const imagesToSend = [...pendingImages.value]

  // 发送图片消息（前端显示）
  for (const img of imagesToSend) {
    messages.value.push({
      role: 'user',
      content: img,
      timestamp: Date.now(),
      type: 'image'
    })
  }

  // 发送文本消息
  if (text) {
    messages.value.push({
      role: 'user',
      content: text,
      timestamp: Date.now(),
      type: 'text'
    })
  }

  // 清空待发送图片
  pendingImages.value = []

  userInput.value = ''
  if (textareaRef.value) textareaRef.value.style.height = 'auto'
  scrollToBottom()

  // 添加加载状态
  isLoading.value = true
  const loadingMsgIndex = messages.value.push({
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
    type: 'loading'
  }) - 1
  scrollToBottom()

  // API 调用 - 流式输出
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text || '请分析这张图片，并说明其与丝绸之路的关联。',
        images: imagesToSend
      }),
    })

    if (!response.ok) {
      console.error('Response not ok:', response.status, response.statusText)
      throw new Error('Network response was not ok')
    }

    // 将 loading 消息转换为普通消息，准备接收流式内容
    messages.value[loadingMsgIndex] = {
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      type: 'text'
    }

    // 处理流式响应
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) throw new Error('No response body')

    let buffer = ''
    let receivedContent = false

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        console.log('Stream done, received content:', receivedContent)
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        const dataStr = trimmed.slice(6)
        if (dataStr === '[DONE]') continue

        try {
          const data = JSON.parse(dataStr)
          console.log('Frontend received:', data)

          if (data.content) {
            receivedContent = true
            messages.value[loadingMsgIndex].content += data.content
            scrollToBottom()
          }
          if (data.done) {
            isLoading.value = false
          }
          if (data.error) {
            messages.value[loadingMsgIndex].content = `${t.value.chat.error}: ${data.error}`
            isLoading.value = false
          }
        } catch (e) {
          console.error('Parse error:', e, 'Data:', dataStr)
        }
      }
    }

    // 如果没有收到任何内容，显示错误
    if (!receivedContent && messages.value[loadingMsgIndex].content === '') {
      messages.value[loadingMsgIndex].content = '未收到回复，请检查后端服务是否正常运行。'
    }
  } catch (error: any) {
    console.error('Fetch error:', error)
    const errMsg = error?.message ? ` ${error.message}` : ''
    messages.value[loadingMsgIndex] = {
      role: 'assistant',
      content: `${t.value.chat.error}${errMsg}`,
      timestamp: Date.now(),
      type: 'text'
    }
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.ancient-chat-view {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: $spacing-md;
  position: relative;
  overflow: hidden;
}

// 背景装饰
.bg-pattern {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 30%, rgba(212, 175, 55, 0.05) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(212, 175, 55, 0.03) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

.chat-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1000px;
  height: 100%;
  background: $bg-glass;
  backdrop-filter: $backdrop-blur-xl;
  border: 1px solid $border-color-medium;
  border-radius: $border-radius-xl;
  display: flex;
  flex-direction: column;
  box-shadow: $box-shadow-xl, $box-shadow-gold-soft;
  overflow: hidden;

  // 顶部金线装饰
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 40%;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      $color-gold 50%,
      transparent 100%
    );
    border-radius: 0 0 2px 2px;
  }
}

// 顶部标题栏
.chat-header {
  padding: $spacing-lg $spacing-xl;
  background: $gradient-card-subtle;
  border-bottom: 1px solid $border-color-medium;
  position: relative;

  .header-decoration {
    position: absolute;
    bottom: 0;
    left: $spacing-xl;
    right: $spacing-xl;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(212, 175, 55, 0.3) 30%,
      rgba(212, 175, 55, 0.3) 70%,
      transparent 100%
    );
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  .avatar-container {
    position: relative;
  }

  .avatar-frame {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: $gradient-ancient;
    border: 2px solid $border-color-medium;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: all $transition-duration-base $ease-ancient;

    &:hover {
      border-color: $color-gold;
      box-shadow: $box-shadow-gold-subtle;
      transform: scale(1.05);
    }

    .chat-icon {
      width: 28px;
      height: 28px;
      color: $color-gold;
    }
  }

  .status-dot {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    background: $color-jade;
    border: 2px solid $bg-secondary;
    border-radius: 50%;
    box-shadow: 0 0 8px rgba($color-jade, 0.5);
  }

  .title-section {
    .title {
      margin: 0;
      font-family: $font-family-serif;
      font-size: $font-size-xl;
      font-weight: $font-weight-semibold;
      color: $text-primary;
      letter-spacing: $letter-spacing-wide;
    }

    .subtitle {
      margin: $spacing-xs 0 0;
      font-size: $font-size-sm;
      color: $text-tertiary;
    }
  }

  .header-actions {
    margin-left: auto;
  }

  .action-btn {
    width: 36px;
    height: 36px;
    border-radius: $border-radius-base;
    background: transparent;
    border: 1px solid $border-color;
    color: $text-tertiary;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all $transition-duration-base $ease-ancient;

    svg {
      width: 18px;
      height: 18px;
    }

    &:hover {
      border-color: $border-color-medium;
      color: $color-cinnabar;
      background: rgba($color-cinnabar, 0.08);
    }
  }
}

// 消息区域
.messages-area {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-xl;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(
      180deg,
      rgba(212, 175, 55, 0.3) 0%,
      rgba(212, 175, 55, 0.15) 100%
    );
    border-radius: 2px;

    &:hover {
      background: linear-gradient(
        180deg,
        rgba(212, 175, 55, 0.5) 0%,
        rgba(212, 175, 55, 0.3) 100%
      );
    }
  }
}

.message-item {
  display: flex;
  gap: $spacing-md;
  max-width: 85%;
  animation: messageSlideIn $transition-duration-base $ease-ancient-out;

  @keyframes messageSlideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &.user {
    align-self: flex-end;
    flex-direction: row-reverse;
  }

  &.assistant {
    align-self: flex-start;
  }
}

.message-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;

  .avatar-inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &.ai-avatar .avatar-inner {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.05));
    border: 1px solid $border-color-medium;

    svg {
      width: 20px;
      height: 20px;
      color: $color-gold;
    }
  }

  &.user-avatar .avatar-inner {
    background: $bg-elevated;
    border: 1px solid $border-color;

    svg {
      width: 18px;
      height: 18px;
      color: $text-secondary;
    }
  }
}

.message-bubble {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;

  &.ai-bubble {
    align-items: flex-start;
  }

  &.user-bubble {
    align-items: flex-end;
  }
}

.bubble-content {
  padding: $spacing-md $spacing-lg;
  border-radius: $border-radius-lg;
  position: relative;
  word-break: break-word;
}

.ai-bubble .bubble-content {
  background: $gradient-ancient;
  border: 1px solid $border-color;
  border-radius: $border-radius-lg $border-radius-lg $border-radius-lg $border-radius-sm;

  .bubble-decoration {
    position: absolute;
    top: 0;
    left: 0;
    width: 40px;
    height: 2px;
    background: linear-gradient(
      90deg,
      $color-gold 0%,
      transparent 100%
    );
    border-radius: $border-radius-lg $border-radius-lg 0 0;
  }

  .message-text {
    color: $text-primary;
    margin: 0;
    line-height: $line-height-relaxed;
  }
}

.user-bubble .bubble-content {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.08));
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: $border-radius-lg $border-radius-lg $border-radius-sm $border-radius-lg;

  .message-text {
    color: $text-primary;
    margin: 0;
    line-height: $line-height-relaxed;
  }
}

.message-time {
  font-size: $font-size-xs;
  color: $text-muted;
  padding: 0 $spacing-sm;
}

// 图片消息
.image-content {
  position: relative;
  border-radius: $border-radius-base;
  overflow: hidden;
  display: inline-block;

  .chat-image {
    max-width: 280px;
    max-height: 280px;
    border-radius: $border-radius-base;
    display: block;
  }

  .remove-image-btn {
    position: absolute;
    top: $spacing-xs;
    right: $spacing-xs;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba($color-cinnabar, 0.9);
    border: none;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transition: all $transition-duration-fast $ease-ancient;

    svg {
      width: 14px;
      height: 14px;
    }
  }

  &:hover .remove-image-btn {
    opacity: 1;
  }
}

.user-bubble .image-content {
  background: transparent;
  border: none;
  padding: 0;
}

.ai-bubble .image-content {
  background: transparent;
  border: none;
  padding: 0;
}

// 加载动画
.typing-indicator {
  display: flex;
  gap: 6px;
  padding: $spacing-md;

  .dot {
    width: 8px;
    height: 8px;
    background: $color-gold;
    border-radius: 50%;
    animation: typingBounce 1.4s ease-in-out infinite;

    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
    &:nth-child(3) { animation-delay: 0s; }
  }
}

@keyframes typingBounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

// 建议问题区域
.suggestions-area {
  padding: 0 $spacing-xl $spacing-lg;

  .suggestions-header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;

    .suggestions-icon {
      width: 20px;
      height: 20px;
      color: $color-gold;
    }

    h3 {
      margin: 0;
      font-size: $font-size-sm;
      font-family: $font-family-serif;
      color: $text-secondary;
    }
  }

  .suggestion-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-md;
  }
}

.suggestion-card {
  background: $gradient-card-subtle;
  border: 1px solid $border-color;
  border-radius: $border-radius-lg;
  padding: $spacing-md;
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  cursor: pointer;
  transition: all $transition-duration-base $ease-ancient;
  text-align: left;

  .card-icon {
    width: 24px;
    height: 24px;
    color: $color-gold;
    font-size: $font-size-lg;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-text {
    font-size: $font-size-sm;
    color: $text-secondary;
    line-height: $line-height-base;
  }

  &:hover {
    background: rgba(212, 175, 55, 0.08);
    border-color: $border-color-medium;
    transform: translateY(-2px);
    box-shadow: $box-shadow-gold-subtle;

    .card-icon {
      color: $color-gold-light;
    }

    .card-text {
      color: $text-primary;
    }
  }
}

// 图片预览区域
.image-previews {
  padding: 0 $spacing-xl $spacing-sm;

  .preview-list {
    display: flex;
    gap: $spacing-sm;
    flex-wrap: wrap;
  }
}

.image-preview {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: $border-radius-base;
  overflow: hidden;
  border: 2px solid $border-color-medium;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .preview-remove {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba($color-cinnabar, 0.9);
    border: none;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all $transition-duration-fast;

    svg {
      width: 12px;
      height: 12px;
    }

    &:hover {
      background: $color-cinnabar;
      transform: scale(1.1);
    }
  }
}

// 输入区域
.input-area {
  padding: $spacing-lg $spacing-xl $spacing-xl;
  background: $gradient-card-subtle;
  border-top: 1px solid $border-color-medium;

  .input-container {
    display: flex;
    align-items: flex-end;
    gap: $spacing-sm;
    background: $bg-elevated;
    border: 1px solid $border-color;
    border-radius: $border-radius-xl;
    padding: $spacing-xs;
    transition: all $transition-duration-base $ease-ancient;

    &:focus-within {
      border-color: $border-color-medium;
      box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.1);
    }
  }

  .upload-section {
    flex-shrink: 0;
  }

  .upload-btn {
    width: 40px;
    height: 40px;
    border-radius: $border-radius-lg;
    background: transparent;
    border: none;
    color: $text-tertiary;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all $transition-duration-base $ease-ancient;

    svg {
      width: 22px;
      height: 22px;
    }

    &:hover {
      color: $color-gold;
      background: rgba(212, 175, 55, 0.08);
    }
  }

  .input-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .message-input {
    width: 100%;
    background: transparent;
    border: none;
    color: $text-primary;
    padding: $spacing-sm $spacing-md;
    font-family: inherit;
    font-size: $font-size-base;
    line-height: 1.5;
    resize: none;
    max-height: 150px;
    outline: none;

    &::placeholder {
      color: $text-muted;
    }
  }

  .input-actions {
    display: flex;
    align-items: center;
    padding: 0 $spacing-md;
  }

  .char-count {
    font-size: $font-size-xs;
    color: $text-muted;
    transition: color $transition-duration-fast;

    &.warning {
      color: $color-cinnabar;
    }
  }

  .send-btn {
    width: 44px;
    height: 44px;
    border-radius: $border-radius-lg;
    background: $bg-tertiary;
    border: 1px solid $border-color;
    color: $text-tertiary;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all $transition-duration-base $ease-ancient;
    flex-shrink: 0;

    svg {
      width: 22px;
      height: 22px;
      transition: transform $transition-duration-base $ease-ancient;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &:not(:disabled).active {
      background: rgba(212, 175, 55, 0.15);
      border-color: rgba(212, 175, 55, 0.3);
      color: $color-gold;
      box-shadow: $box-shadow-gold-subtle;

      svg {
        transform: translateX(2px) translateY(2px);
      }
    }
  }

  .input-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: $spacing-sm;
    padding: 0 $spacing-xs;
  }

  .footer-hint {
    font-size: $font-size-xs;
    color: $text-muted;
  }

  .shortcuts {
    display: flex;
    gap: $spacing-md;
  }

  .shortcut-hint {
    font-size: $font-size-xs;
    color: $text-muted;
    display: flex;
    align-items: center;
    gap: 4px;

    kbd {
      padding: 2px 6px;
      background: $bg-tertiary;
      border: 1px solid $border-color;
      border-radius: 4px;
      font-family: $font-family-code;
      font-size: $font-size-xs;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .chat-view {
    padding: 0;
  }

  .chat-container {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  .message-item {
    max-width: 95%;
  }

  .suggestion-grid {
    grid-template-columns: 1fr;
  }
}
</style>
