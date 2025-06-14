import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAIResponse } from '../services/deepseekService'
import type { Todo } from '../types/todo'
import { handleError, logger } from '../utils/logger'
import { useErrorHandler } from './useErrorHandler'
import { useTodos } from './useTodos'

export function useTodoManagement() {
  const { t } = useI18n()
  const { todos, addTodo, addMultipleTodos, toggleTodo, removeTodo, saveTodos } = useTodos()
  const { showError, error: duplicateError } = useErrorHandler()

  const filter = ref('active')
  const searchQuery = ref('')
  const isGenerating = ref(false)
  const suggestedTodos = ref<string[]>([])
  const showSuggestedTodos = ref(false)
  const isSorting = ref(false)
  const MAX_TODO_LENGTH = 50

  const isLoading = computed(() => isSorting.value)

  const filteredTodos = computed(() => {
    try {
      const filtered = todos.value
      if (!Array.isArray(filtered)) {
        logger.error('Invalid todos data structure', filtered, 'TodoManagement')
        return []
      }

      const statusFilterFn =
        filter.value === 'active'
          ? (todo: Todo) => todo && !todo.completed
          : filter.value === 'completed'
            ? (todo: Todo) => todo && todo.completed
            : (todo: Todo) => todo !== null && todo !== undefined

      let result = filtered.filter(statusFilterFn)

      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        result = result.filter(todo => {
          if (!todo) {
            return false
          }

          const titleMatch = todo.text.toLowerCase().includes(query)

          const tagsMatch = todo.tags?.some(tag => tag.toLowerCase().includes(query)) || false
          return titleMatch || tagsMatch
        })
      }

      return result
    } catch (error) {
      handleError(error, 'Error in filteredTodos computed', 'TodoManagement')
      return []
    }
  })

  const hasActiveTodos = computed(() => {
    return todos.value.some(todo => todo && !todo.completed)
  })

  const generateSuggestedTodos = async () => {
    isGenerating.value = true
    try {
      const response = await getAIResponse(`${t('generateSuggestionsPrompt')}`, 'zh', 1.5)
      suggestedTodos.value = response
        .split(',')
        .filter((todo: string) => todo.trim() !== '')
        .slice(0, 5)
      showSuggestedTodos.value = true
    } catch (error) {
      handleError(error, t('generateSuggestionsError'), 'TodoManagement')
      showError(error instanceof Error ? error.message : t('generateSuggestionsError'))
    } finally {
      isGenerating.value = false
    }
  }

  const confirmSuggestedTodos = () => {
    const duplicates = addMultipleTodos(
      suggestedTodos.value.map(todo => ({
        text: todo
      }))
    )
    if (duplicates.length > 0) {
      showError(`${t('duplicateError')}：${duplicates.join(', ')}`)
    }
    showSuggestedTodos.value = false
    suggestedTodos.value = []
  }

  const cancelSuggestedTodos = () => {
    showSuggestedTodos.value = false
    suggestedTodos.value = []
  }

  const updateSuggestedTodo = (index: number, newText: string) => {
    suggestedTodos.value[index] = newText
  }

  const sortActiveTodosWithAI = async () => {
    isSorting.value = true

    const originalTodos = [...todos.value]

    try {
      const activeTodos = todos.value.filter(todo => todo && !todo.completed)
      if (activeTodos.length <= 1) {
        showError(t('noActiveTodosError'))
        return
      }

      const todoTexts = activeTodos.map((todo, index) => `${index + 1}. ${todo.text}`).join('\n')
      const prompt = `${t('sortPrompt')}:\n${todoTexts}`
      const response = await getAIResponse(prompt, 'zh', 0.1)

      if (!response) {
        throw new Error(t('aiEmptyResponseError'))
      }

      const newOrder = response.split(',').map(str => {
        const num = parseInt(str.trim(), 10)
        if (isNaN(num) || num < 1 || num > activeTodos.length) {
          throw new Error(`Invalid sort index: ${str}`)
        }
        return num
      })

      if (newOrder.length !== activeTodos.length) {
        throw new Error(t('aiSortMismatchError'))
      }

      const uniqueIndices = new Set(newOrder)
      if (uniqueIndices.size !== newOrder.length) {
        throw new Error('Duplicate indices in AI response')
      }

      const sortedActiveTodos = newOrder.map(index => activeTodos[index - 1])
      let sortedIndex = 0

      todos.value = todos.value.map(todo => {
        if (!todo || todo.completed) {
          return todo
        }
        return sortedActiveTodos[sortedIndex++] || todo
      })

      saveTodos()
      logger.info(
        'AI sort completed successfully',
        { originalCount: activeTodos.length },
        'TodoManagement'
      )
    } catch (error) {
      todos.value = originalTodos
      handleError(error, t('aiSortError'), 'TodoManagement')
      showError(error instanceof Error ? error.message : t('aiSortError'))
    } finally {
      isSorting.value = false
    }
  }

  const handleAddTodo = (text: string, tags: string[]) => {
    if (text && text.trim() !== '') {
      const success = addTodo(text, tags)
      if (!success) {
        showError(t('duplicateError'))
      }
    } else {
      showError(t('emptyTodoError'))
    }
  }

  return {
    filter,
    searchQuery,
    filteredTodos,
    hasActiveTodos,
    isGenerating,
    isSorting,
    isLoading,
    suggestedTodos,
    showSuggestedTodos,
    MAX_TODO_LENGTH,
    duplicateError,
    generateSuggestedTodos,
    confirmSuggestedTodos,
    cancelSuggestedTodos,
    updateSuggestedTodo,
    sortActiveTodosWithAI,
    handleAddTodo,
    toggleTodo,
    removeTodo
  }
}
