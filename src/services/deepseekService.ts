import { handleError, logger } from '@/utils/logger'
import i18n from '../i18n'
import { getApiKey } from './configService'
import { AIStreamResponse, Message } from './types'

const API_URL = 'https://api.deepseek.com/chat/completions'

let abortController: AbortController | null = null

export function abortCurrentRequest() {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
}

const getHeaders = () => {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error(i18n.global.t('configureApiKey'))
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
}

const getSystemPrompt = (): string => {
  const lastSelectedTemplate = localStorage.getItem('lastSelectedTemplate')
  if (lastSelectedTemplate === 'none') {
    return ''
  }
  const savedSystemPrompt = localStorage.getItem('systemPrompt')
  return savedSystemPrompt || ''
}

export async function getAIStreamResponse(
  messages: Message[],
  onChunk: (chunk: string) => void
): Promise<void> {
  let buffer = ''
  let isReading = true

  try {
    abortController = new AbortController()
    const signal = abortController.signal

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        model: 'deepseek-reasoner',
        messages: [
          {
            role: 'system',
            content: getSystemPrompt()
          },
          ...messages
        ],

        stream: true
      }),
      signal
    })

    if (!response.ok) {
      throw new Error(i18n.global.t('httpError', { status: response.status }))
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error(i18n.global.t('streamError'))
    }

    while (isReading) {
      const { done, value } = await reader.read()
      if (done) {
        onChunk('[DONE]')
        isReading = false
        break
      }

      buffer += new TextDecoder().decode(value)
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonData = line.slice(6)
          if (jsonData === '[DONE]') {
            onChunk('[DONE]')
            isReading = false
            return
          }
          try {
            const parsedData: AIStreamResponse = JSON.parse(jsonData)
            const content = parsedData.choices[0]?.delta?.content
            if (content) {
              onChunk(content)
            }
          } catch (error) {
            handleError(error, i18n.global.t('jsonParseError'), 'DeepSeekService')
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn(i18n.global.t('requestAborted'), error, 'DeepSeekService')
      onChunk('[ABORTED]')
    } else {
      handleError(error, i18n.global.t('aiResponseError'), 'DeepSeekService')
      throw error
    }
  } finally {
    abortController = null
  }
}

export async function getAIResponse(
  userMessage: string,
  language = 'zh',
  temperature = 0.5
): Promise<string> {
  try {
    const languageInstruction = language === 'zh' ? '请用中文回复。' : '请用英文回复。'

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个智能助手，可以回答各种问题并提供帮助。${languageInstruction}`
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature,
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error(i18n.global.t('httpError', { status: response.status }))
    }

    const data = await response.json()

    if (data && data.choices && data.choices.length > 0) {
      return data.choices[0].message?.content || ''
    } else {
      throw new Error(i18n.global.t('invalidAiResponse'))
    }
  } catch (error) {
    handleError(error, i18n.global.t('aiResponseError'), 'DeepSeekService')
    if (error instanceof Error) {
      if (error.message.startsWith('HTTP 错误')) {
        throw new Error(i18n.global.t('apiError', { error: error.message }))
      } else if (error.message === i18n.global.t('invalidAiResponse')) {
        throw error
      } else {
        throw new Error(i18n.global.t('networkConnectionError'))
      }
    }
    throw new Error(i18n.global.t('unknownError'))
  }
}

export async function optimizeText(text: string): Promise<string> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              '你是一个顶级的文本优化助手，请优化文本使其更自然流畅、标点符号使用更正确、更符合用户的意图，优化后的文本请直接返回，不要添加任何解释。'
          },
          {
            role: 'user',
            content: `请优化文本：\n"${text}"`
          }
        ],
        temperature: 0.5,
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error(i18n.global.t('httpError', { status: response.status }))
    }

    const data = await response.json()

    if (data && data.choices && data.choices.length > 0) {
      return data.choices[0].message?.content || ''
    } else {
      throw new Error(i18n.global.t('invalidAiResponse'))
    }
  } catch (error) {
    handleError(error, i18n.global.t('textOptimizationError'), 'DeepSeekService')
    throw error
  }
}
