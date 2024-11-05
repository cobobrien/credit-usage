interface UsageData {
  message_id: number
  timestamp: string
  report_name: string | null
  credits_used: number
}

export const fetchUsageData = async (): Promise<UsageData[]> => {
  const response = await fetch('http://127.0.0.1:8000/usage')
  if (!response.ok) {
    throw new Error('Network response was not ok')
  }
  const data = await response.json()
  return data.usage
}

export type { UsageData }
