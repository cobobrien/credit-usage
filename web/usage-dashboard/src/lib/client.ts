interface UsageData {
  message_id: number
  timestamp: string
  report_name: string | null
  credits_used: number
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const fetchUsageData = async (): Promise<UsageData[]> => {
  const response = await fetch(`${API_BASE_URL}/usage`)
  if (!response.ok) {
    throw new Error('Network response was not ok')
  }
  const data = await response.json()
  return data.usage
}

export type { UsageData }
