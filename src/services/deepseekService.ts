import { promptsConfig } from '../config/prompts'
import { AIStreamResponse, Message } from './types'

const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY

const API_URL = 'https://api.deepseek.com/chat/completions'

let abortController: AbortController | null = null

export function abortCurrentRequest() {
	if (abortController) {
		abortController.abort()
		abortController = null
	}
}

export async function getAIStreamResponse(
	messages: Message[],
	onChunk: (chunk: string) => void
): Promise<void> {
	let buffer = ''

	try {
		abortController = new AbortController()
		const signal = abortController.signal

		const response = await fetch(API_URL, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${API_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: 'deepseek-chat',
				messages: [
					// 系统提示
					{
						role: 'system',
						content: promptsConfig.my.content,
					},
					...messages, // 包含历史消息
				],
				temperature: promptsConfig.my.temperature,
				stream: true,
			}),
			signal,
		})

		if (!response.ok) {
			throw new Error(`HTTP 错误! 状态: ${response.status}`)
		}

		const reader = response.body?.getReader()
		if (!reader) {
			throw new Error('无法获取响应流')
		}

		while (true) {
			const { done, value } = await reader.read()
			if (done) {
				onChunk('[DONE]')
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
						return
					}
					try {
						const parsedData: AIStreamResponse = JSON.parse(jsonData)
						const content = parsedData.choices[0]?.delta?.content
						if (content) {
							onChunk(content)
						}
					} catch (error) {
						console.error('解析 JSON 时出错:', error)
					}
				}
			}
		}
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			console.warn('请求被中断')
			onChunk('[ABORTED]')
		} else {
			console.error('获取 AI 响应时出错:', error)
			throw error
		}
	} finally {
		abortController = null
	}
}

export async function getAIResponse(
	userMessage: string,
	language: string = 'zh',
	temperature: number = 0.5
): Promise<string> {
	try {
		const languageInstruction = language === 'zh' ? '请用中文回复。' : '请用英文回复。'

		const response = await fetch(API_URL, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${API_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: 'deepseek-chat',
				messages: [
					{
						role: 'system',
						content: `你是一个智能助手，可以回答各种问题并提供帮助。${languageInstruction}`,
					},
					{
						role: 'user',
						content: userMessage,
					},
				],
				temperature,
				stream: false,
			}),
		})

		if (!response.ok) {
			throw new Error(`HTTP 错误! 状态: ${response.status}`)
		}

		const data = await response.json()

		if (data && data.choices && data.choices.length > 0) {
			return data.choices[0].message?.content || ''
		} else {
			throw new Error('无效的 AI 响应格式')
		}
	} catch (error) {
		console.error('获取 AI 响应时出错:', error)
		if (error instanceof Error) {
			if (error.message.startsWith('HTTP 错误')) {
				throw new Error(`API 错误: ${error.message}`)
			} else if (error.message === '无效的 AI 响应格式') {
				throw error
			} else {
				throw new Error('无法连接到 AI 服务，请检查您的网络连接')
			}
		}
		throw new Error('生成建议待办事项时出现未知错误')
	}
}

export async function optimizeText(text: string): Promise<string> {
	try {
		const response = await fetch(API_URL, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${API_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: 'deepseek-chat',
				messages: [
					{
						role: 'system',
						content:
							'你是一个文本优化助手，可以优化用户的提问，帮助其更加清晰、专业和有条理。请直接返回优化后的文本，不要添加任何解释。',
					},
					{
						role: 'user',
						content: `请帮我优化以下文本的表达：\n${text}`,
					},
				],
				temperature: 0.7,
				stream: false,
			}),
		})

		if (!response.ok) {
			throw new Error(`HTTP 错误! 状态: ${response.status}`)
		}

		const data = await response.json()

		if (data && data.choices && data.choices.length > 0) {
			return data.choices[0].message?.content || ''
		} else {
			throw new Error('无效的 AI 响应格式')
		}
	} catch (error) {
		console.error('优化文本时出错:', error)
		throw error
	}
}
