import { computed, ref, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { builtinPromptTemplates } from '../config/prompts'
import type {
  CustomPrompt,
  PromptActionResult,
  PromptFilter,
  PromptSortOptions,
  PromptTemplate
} from '../types/settings'
import { PromptCategory, PromptPriority } from '../types/settings'
import {
  createPrompt,
  duplicatePrompt,
  exportPrompts,
  filterPrompts,
  getPromptStats,
  processImportData,
  sortPrompts,
  validateImportData,
  validatePrompt
} from '../utils/promptUtils'

export function usePromptManagement(
  customPrompts: Ref<CustomPrompt[]>,
  selectedPromptTemplate: Ref<PromptTemplate>,
  localSystemPrompt: Ref<string>,
  newPromptName: Ref<string>,
  newPromptContent: Ref<string>,
  newPromptDescription: Ref<string>,
  newPromptCategory: Ref<PromptCategory>,
  newPromptPriority: Ref<PromptPriority>,
  newPromptTags: Ref<string[]>,
  showAddPromptPopover: Ref<boolean>,
  promptFilter: Ref<PromptFilter>,
  promptSortOptions: Ref<PromptSortOptions>,
  showSuccessToast: () => void
) {
  const { t } = useI18n()

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const saveCustomPrompts = () => {
    localStorage.setItem('customPrompts', JSON.stringify(customPrompts.value))
  }

  /**
   * 处理模板变更
   */
  const handleTemplateChange = () => {
    const template = selectedPromptTemplate.value

    if (template === 'none') {
      localSystemPrompt.value = ''
    } else if (builtinPromptTemplates[template]) {
      localSystemPrompt.value = builtinPromptTemplates[template].content
    } else {
      const customPrompt = customPrompts.value.find(p => p.id === template)
      if (customPrompt) {
        localSystemPrompt.value = customPrompt.content

        customPrompt.usageCount++
        customPrompt.updatedAt = Date.now()
        saveCustomPrompts()
      }
    }

    localStorage.setItem('lastSelectedTemplate', template)
  }

  const saveNewPrompt = () => {
    const validation = validatePrompt({
      name: newPromptName.value,
      content: newPromptContent.value,
      description: newPromptDescription.value,
      category: newPromptCategory.value,
      priority: newPromptPriority.value,
      tags: newPromptTags.value
    })

    if (!validation.isValid) {
      error.value = validation.errors.join(', ')
      return
    }

    const newPrompt = createPrompt({
      name: newPromptName.value,
      content: newPromptContent.value,
      description: newPromptDescription.value,
      category: newPromptCategory.value,
      priority: newPromptPriority.value,
      tags: newPromptTags.value
    })

    customPrompts.value.push(newPrompt)
    saveCustomPrompts()

    selectedPromptTemplate.value = newPrompt.id
    localSystemPrompt.value = newPrompt.content
    localStorage.setItem('lastSelectedTemplate', newPrompt.id)

    resetNewPromptForm()
    showAddPromptPopover.value = false
    showSuccessToast()
  }

  const resetNewPromptForm = () => {
    newPromptName.value = ''
    newPromptContent.value = ''
    newPromptDescription.value = ''
    newPromptCategory.value = PromptCategory.CUSTOM
    newPromptPriority.value = PromptPriority.MEDIUM
    newPromptTags.value = []
    error.value = null
  }

  const saveSystemPrompt = () => {
    localStorage.setItem('systemPrompt', localSystemPrompt.value)

    if (!selectedPromptTemplate.value.startsWith('custom_')) {
      const newPrompt = createPrompt({
        name: t('customPrompt'),
        content: localSystemPrompt.value,
        category: PromptCategory.CUSTOM,
        priority: PromptPriority.MEDIUM
      })

      customPrompts.value.push(newPrompt)
      saveCustomPrompts()
      selectedPromptTemplate.value = newPrompt.id
      localStorage.setItem('lastSelectedTemplate', newPrompt.id)
    } else {
      const currentPrompt = customPrompts.value.find(p => p.id === selectedPromptTemplate.value)
      if (currentPrompt) {
        currentPrompt.content = localSystemPrompt.value
        currentPrompt.updatedAt = Date.now()
        saveCustomPrompts()
      }
    }

    showSuccessToast()
  }

  /**
   * 重置系统提示词
   */
  const resetSystemPrompt = () => {
    selectedPromptTemplate.value = 'none'
    localSystemPrompt.value = builtinPromptTemplates.none.content
    localStorage.removeItem('systemPrompt')
    localStorage.removeItem('lastSelectedTemplate')
  }

  const deletePrompt = (promptId: string) => {
    const index = customPrompts.value.findIndex(p => p.id === promptId)
    if (index > -1) {
      customPrompts.value.splice(index, 1)
      saveCustomPrompts()

      if (selectedPromptTemplate.value === promptId) {
        selectedPromptTemplate.value = 'none'
        localSystemPrompt.value = builtinPromptTemplates.none.content
        localStorage.setItem('lastSelectedTemplate', 'none')
      }

      showSuccessToast()
    }
  }

  const confirmDeletePrompt = () => {
    if (window.confirm(t('confirmDeletePrompt'))) {
      deletePrompt(selectedPromptTemplate.value)
    }
  }

  const duplicateCurrentPrompt = () => {
    const currentPrompt = customPrompts.value.find(p => p.id === selectedPromptTemplate.value)
    if (currentPrompt) {
      const duplicated = duplicatePrompt(currentPrompt)
      customPrompts.value.push(duplicated)
      saveCustomPrompts()
      showSuccessToast()
    }
  }

  /**
   * 切换提示词收藏状态
   */
  const togglePromptFavorite = (promptId: string) => {
    const prompt = customPrompts.value.find(p => p.id === promptId)
    if (prompt) {
      prompt.isFavorite = !prompt.isFavorite
      prompt.updatedAt = Date.now()
      saveCustomPrompts()
    }
  }

  const togglePromptActive = (promptId: string) => {
    const prompt = customPrompts.value.find(p => p.id === promptId)
    if (prompt) {
      prompt.isActive = !prompt.isActive
      prompt.updatedAt = Date.now()
      saveCustomPrompts()
    }
  }

  const exportPromptsData = () => {
    try {
      const exportData = exportPrompts(customPrompts.value)
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prompts-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showSuccessToast()
    } catch (error) {
      console.error('导出失败:', error)
    }
  }

  const importPromptsData = (file: File) => {
    return new Promise<PromptActionResult>(resolve => {
      const reader = new FileReader()
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target?.result as string)
          const validation = validateImportData(data)

          if (!validation.success) {
            resolve(validation)
            return
          }

          const importedPrompts = processImportData(data)
          customPrompts.value.push(...importedPrompts)
          saveCustomPrompts()

          resolve({
            success: true,
            message: `成功导入 ${importedPrompts.length} 个提示词`
          })
          showSuccessToast()
        } catch (error) {
          resolve({
            success: false,
            message: `文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`
          })
        }
      }
      reader.readAsText(file)
    })
  }

  const filteredPrompts = computed(() => {
    return filterPrompts(customPrompts.value, promptFilter.value)
  })

  const sortedPrompts = computed(() => {
    return sortPrompts(filteredPrompts.value, promptSortOptions.value)
  })

  const promptStats = computed(() => {
    return getPromptStats(customPrompts.value)
  })

  /**
   * 验证提示词表单
   */
  const isPromptFormValid = computed(() => {
    return newPromptName.value.trim() !== '' && newPromptContent.value.trim() !== ''
  })

  const isSystemPromptValid = computed(() => {
    return localSystemPrompt.value.trim() !== ''
  })

  const getCurrentCustomPrompt = () => {
    return customPrompts.value.find(p => p.id === selectedPromptTemplate.value)
  }

  const isCustomPrompt = computed(() => {
    return selectedPromptTemplate.value.startsWith('custom_')
  })

  /**
   * 检查是否为内置提示词
   */
  const isBuiltinPrompt = computed(() => {
    return !!builtinPromptTemplates[selectedPromptTemplate.value]
  })

  return {
    isLoading,
    error,
    filteredPrompts,
    sortedPrompts,
    promptStats,

    handleTemplateChange,
    saveSystemPrompt,
    resetSystemPrompt,

    saveNewPrompt,
    deletePrompt,
    confirmDeletePrompt,
    duplicateCurrentPrompt,
    togglePromptFavorite,
    togglePromptActive,

    exportPromptsData,
    importPromptsData,

    resetNewPromptForm,

    isPromptFormValid,
    isSystemPromptValid,
    getCurrentCustomPrompt,
    isCustomPrompt,
    isBuiltinPrompt
  }
}
