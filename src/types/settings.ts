/**
 * 设置相关的类型定义
 */

export enum PromptCategory {
  GENERAL = 'general',
  CODING = 'coding',
  WRITING = 'writing',
  ANALYSIS = 'analysis',
  CREATIVE = 'creative',
  BUSINESS = 'business',
  EDUCATION = 'education',
  CUSTOM = 'custom'
}

export enum PromptPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface CustomPrompt {
  id: string
  name: string
  content: string
  description?: string
  category: PromptCategory
  priority: PromptPriority
  tags: string[]
  createdAt: number
  updatedAt: number
  isActive: boolean
  usageCount: number
  isFavorite: boolean
}

/**
 * 内置提示词模板接口
 */
export interface BuiltinPromptTemplate {
  id: string
  name: string
  content: string
  description: string
  category: PromptCategory
  temperature: number
  isReadonly: boolean
}

export type PromptTemplate = 'none' | 'my' | string

export interface PromptFilter {
  category?: PromptCategory
  priority?: PromptPriority
  tags?: string[]
  searchText?: string
  isFavorite?: boolean
  isActive?: boolean
}

export interface PromptSortOptions {
  field: 'name' | 'createdAt' | 'updatedAt' | 'usageCount' | 'priority'
  order: 'asc' | 'desc'
}

/**
 * 提示词导入导出数据格式
 */
export interface PromptExportData {
  version: string
  exportedAt: number
  prompts: CustomPrompt[]
}

export interface PromptValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface SettingsState {
  showApiKey: boolean
  showApiKeyPopover: boolean
  showAddPromptPopover: boolean
  showPromptImportDialog: boolean
  showPromptExportDialog: boolean
  localApiKey: string
  localSystemPrompt: string
  showSuccessMessage: boolean
  isFullscreen: boolean
  selectedPromptTemplate: PromptTemplate
  newPromptName: string
  newPromptContent: string
  newPromptDescription: string
  newPromptCategory: PromptCategory
  newPromptPriority: PromptPriority
  newPromptTags: string[]
  customPrompts: CustomPrompt[]
  promptFilter: PromptFilter
  promptSortOptions: PromptSortOptions
}

export interface ApiKeyState {
  showApiKey: boolean
  showApiKeyPopover: boolean
  localApiKey: string
}

/**
 * 提示词管理操作类型
 */
export type PromptAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'duplicate'
  | 'favorite'
  | 'activate'
  | 'deactivate'
  | 'export'
  | 'import'

export interface PromptActionResult {
  success: boolean
  message: string
  data?: unknown
}

export interface PromptManagementState {
  showAddPromptPopover: boolean
  localSystemPrompt: string
  isFullscreen: boolean
  selectedPromptTemplate: PromptTemplate
  newPromptName: string
  newPromptContent: string
  customPrompts: CustomPrompt[]
}

export interface ToastState {
  showSuccessMessage: boolean
  message?: string
}
