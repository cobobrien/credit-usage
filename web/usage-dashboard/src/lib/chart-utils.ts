import { startOfDay, parseISO } from 'date-fns'
import { type UsageData } from '@/lib/client'

interface DailyUsage {
  date: string;
  credits: number;
}

export function processChartData(data: UsageData[] | undefined): DailyUsage[] {
  if (!data) return []

  // Group credits by date
  const dailyUsage = data.reduce((acc: { [key: string]: number }, curr) => {
    const date = startOfDay(parseISO(curr.timestamp)).toISOString()
    acc[date] = (acc[date] || 0) + curr.credits_used
    return acc
  }, {})

  // Convert to array and sort by date
  return Object.entries(dailyUsage)
    .map(([date, credits]): DailyUsage => ({
      date,
      credits: Number(credits.toFixed(2))
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
} 
