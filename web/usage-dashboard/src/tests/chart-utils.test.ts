import { processChartData } from '../lib/chart-utils'
import { type UsageData } from '@/lib/client'

describe('chart-utils', () => {
  describe('processChartData', () => {
    it('should return empty array for undefined input', () => {
      expect(processChartData(undefined)).toEqual([])
    })

    it('should group usage data by date and sum credits', () => {
      const mockData: UsageData[] = [
        { timestamp: '2024-03-15T10:30:00Z', credits_used: 1.5, message_id: 1, report_name: 'test' },
        { timestamp: '2024-03-15T14:20:00Z', credits_used: 2.5, message_id: 2, report_name: 'test' },
        { timestamp: '2024-03-16T09:00:00Z', credits_used: 3.0, message_id: 3, report_name: 'test' }
      ]

      const expected = [
        { date: '2024-03-15T00:00:00.000Z', credits: 4 },
        { date: '2024-03-16T00:00:00.000Z', credits: 3 }
      ]

      expect(processChartData(mockData)).toEqual(expected)
    })

    it('should round credits to 2 decimal places', () => {
      const mockData: UsageData[] = [
        { timestamp: '2024-03-15T10:30:00Z', credits_used: 1.567, message_id: 1, report_name: 'test' },
        { timestamp: '2024-03-15T14:20:00Z', credits_used: 2.123, message_id: 2, report_name: 'test' }
      ]

      const expected = [
        { date: '2024-03-15T00:00:00.000Z', credits: 3.69 }
      ]

      expect(processChartData(mockData)).toEqual(expected)
    })

    it('should sort results by date', () => {
      const mockData: UsageData[] = [
        { timestamp: '2024-03-16T10:30:00Z', credits_used: 1.0, message_id: 1, report_name: 'test' },
        { timestamp: '2024-03-14T14:20:00Z', credits_used: 2.0, message_id: 2, report_name: 'test' },
        { timestamp: '2024-03-15T09:00:00Z', credits_used: 3.0, message_id: 3, report_name: 'test' }
      ]

      const expected = [
        { date: '2024-03-14T00:00:00.000Z', credits: 2 },
        { date: '2024-03-15T00:00:00.000Z', credits: 3 },
        { date: '2024-03-16T00:00:00.000Z', credits: 1 }
      ]

      expect(processChartData(mockData)).toEqual(expected)
    })
  })
}) 