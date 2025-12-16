<template>
  <div class="chat-view">
    <div class="chat-container">
      <header class="chat-header">
        <div class="header-content">
          <div class="icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="chat-icon">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 7H13V13H11V7ZM11 15H13V17H11V15Z" />
              <path d="M8.5 11.5C8.5 12.33 9.17 13 10 13H14C14.83 13 15.5 12.33 15.5 11.5V10.5C15.5 9.67 14.83 9 14 9H10C9.17 9 8.5 9.67 8.5 10.5V11.5Z" opacity="0.5"/>
            </svg>
          </div>
          <div class="title-area">
            <h1>{{ t.chat.title }}</h1>
            <p>{{ t.chat.subtitle }}</p>
          </div>
        </div>
      </header>

      <div class="messages-area" ref="messagesContainer">
        <div v-for="(msg, index) in messages" :key="index" class="message-wrapper" :class="msg.role">
          <div class="avatar">
            <div v-if="msg.role === 'assistant'" class="ai-avatar">AI</div>
            <div v-else class="user-avatar">Me</div>
          </div>
          <div class="message-content">
            <div class="bubble">
              <p v-if="msg.type === 'text'">{{ msg.content }}</p>
              <div v-else-if="msg.type === 'loading'" class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
            <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
          </div>
        </div>
      </div>

      <div class="suggestions-area" v-if="messages.length <= 1">
        <h3>{{ t.chat.suggested.title }}</h3>
        <div class="suggestion-chips">
          <button 
            v-for="(q, key) in suggestedQuestions" 
            :key="key" 
            class="chip"
            @click="sendMessage(q)"
          >
            {{ q }}
          </button>
        </div>
      </div>

      <footer class="input-area">
        <div class="input-wrapper">
          <textarea 
            v-model="userInput" 
            :placeholder="t.chat.placeholder"
            @keydown.enter.prevent="handleEnter"
            rows="1"
            ref="textareaRef"
          ></textarea>
          <button class="send-btn" @click="handleSend" :disabled="!userInput.trim() || isLoading">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="send-icon">
              <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" />
            </svg>
          </button>
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
  type: 'text' | 'loading'
}

const messages = ref<Message[]>([])
const userInput = ref('')
const isLoading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const suggestedQuestions = computed(() => {
  return [
    t.value.chat.suggested.q1,
    t.value.chat.suggested.q2,
    t.value.chat.suggested.q3,
    t.value.chat.suggested.q4
  ]
})

onMounted(() => {
  // Add welcome message
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
    textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px'
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

const handleSend = () => {
  const text = userInput.value.trim()
  if (!text || isLoading.value) return
  sendMessage(text)
}

const sendMessage = async (text: string) => {
  userInput.value = ''
  if (textareaRef.value) textareaRef.value.style.height = 'auto'

  // Add user message
  messages.value.push({
    role: 'user',
    content: text,
    timestamp: Date.now(),
    type: 'text'
  })
  scrollToBottom()

  // Add loading state
  isLoading.value = true
  const loadingMsgIndex = messages.value.push({
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
    type: 'loading'
  }) - 1
  scrollToBottom()

  // API call
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: text }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    const responseText = data.reply;

    // Replace loading message with actual response
    messages.value[loadingMsgIndex] = {
      role: 'assistant',
      content: responseText,
      timestamp: Date.now(),
      type: 'text'
    }
  } catch (error: any) {
    console.error('Error fetching chat response:', error);
    const errMsg = error?.message ? ` ${error.message}` : '';
    messages.value[loadingMsgIndex] = {
      role: 'assistant',
      content: `${t.value.chat.error}${errMsg}`,
      timestamp: Date.now(),
      type: 'text'
    }
  } finally {
    isLoading.value = false;
    scrollToBottom();
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;
@use 'sass:color' as color;

.chat-view {
  width: 100%;
  height: 100%;
  background-color: $bg-primary;
  display: flex;
  justify-content: center;
  padding: $spacing-md;
  box-sizing: border-box;
}

.chat-container {
  width: 100%;
  max-width: 900px;
  height: 100%;
  background-color: $bg-secondary;
  border-radius: $border-radius-lg;
  display: flex;
  flex-direction: column;
  border: 1px solid $border-color;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.chat-header {
  padding: $spacing-lg;
  border-bottom: 1px solid $border-color;
  background: rgba($bg-secondary, 0.95);
  backdrop-filter: blur(10px);

  .header-content {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  .icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: $border-radius-base;
    background: rgba($color-gold, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-gold;

    .chat-icon {
      width: 28px;
      height: 28px;
    }
  }

  .title-area {
    h1 {
      margin: 0;
      font-size: 1.25rem;
      color: $text-primary;
      font-weight: 600;
    }

    p {
      margin: 4px 0 0;
      font-size: 0.875rem;
      color: $text-secondary;
    }
  }
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba($text-secondary, 0.2);
    border-radius: 3px;
  }
}

.message-wrapper {
  display: flex;
  gap: $spacing-md;
  max-width: 85%;

  &.user {
    align-self: flex-end;
    flex-direction: row-reverse;

    .bubble {
      background-color: $color-gold;
      color: $bg-primary;
      border-radius: 18px 18px 4px 18px;
    }

    .timestamp {
      text-align: right;
    }
  }

  &.assistant {
    align-self: flex-start;

    .bubble {
      background-color: $bg-tertiary;
      color: $text-primary;
      border: 1px solid $border-color;
      border-radius: 18px 18px 18px 4px;
    }
  }
}

.avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;

  .ai-avatar {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, $color-gold, color.adjust($color-gold, $lightness: -20%));
    color: $bg-primary;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .user-avatar {
    width: 100%;
    height: 100%;
    background: $bg-tertiary;
    color: $text-secondary;
    border: 1px solid $border-color;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bubble {
  padding: 12px 16px;
  line-height: 1.5;
  font-size: 0.95rem;
  position: relative;
  word-break: break-word;

  p {
    margin: 0;
  }
}

.timestamp {
  font-size: 0.75rem;
  color: $text-secondary;
  opacity: 0.7;
  margin: 0 4px;
}

.suggestions-area {
  padding: 0 $spacing-lg $spacing-lg;
  
  h3 {
    font-size: 0.875rem;
    color: $text-secondary;
    margin-bottom: $spacing-sm;
    font-weight: normal;
  }

  .suggestion-chips {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
  }

  .chip {
    background: $bg-tertiary;
    border: 1px solid $border-color;
    color: $text-primary;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: $color-gold;
      color: $color-gold;
      background: rgba($color-gold, 0.05);
    }
  }
}

.input-area {
  padding: $spacing-lg;
  background: $bg-secondary;
  border-top: 1px solid $border-color;

  .input-wrapper {
    display: flex;
    gap: $spacing-sm;
    background: $bg-tertiary;
    padding: 8px;
    border-radius: 24px;
    border: 1px solid $border-color;
    transition: border-color 0.2s;

    &:focus-within {
      border-color: $color-gold;
    }

    textarea {
      flex: 1;
      background: transparent;
      border: none;
      color: $text-primary;
      padding: 8px 12px;
      font-family: inherit;
      font-size: 0.95rem;
      resize: none;
      max-height: 120px;
      outline: none;

      &::placeholder {
        color: $text-secondary;
      }
    }

    .send-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: $color-gold;
      color: $bg-primary;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;

      &:disabled {
        background: $bg-primary;
        color: $text-secondary;
        cursor: not-allowed;
      }

      &:not(:disabled):hover {
        transform: scale(1.05);
        background: color.adjust($color-gold, $lightness: 5%);
      }

      .send-icon {
        width: 20px;
        height: 20px;
      }
    }
  }
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;

  span {
    width: 6px;
    height: 6px;
    background: $text-secondary;
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;

    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
  }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
</style>
