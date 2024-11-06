import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import UsageTable from '../usage-table'
import { fetchUsageData } from '../../lib/client'
import '@testing-library/jest-dom'

vi.mock('../../lib/client')

const mockData = [
  { message_id: 1, timestamp: '2024-03-20T10:00:00Z', report_name: 'Daily Report', credits_used: 10 },
  { message_id: 2, timestamp: '2024-03-20T11:00:00Z', report_name: 'Daily Report', credits_used: 5 },
  { message_id: 3, timestamp: '2024-03-20T12:00:00Z', report_name: 'Weekly Report', credits_used: 15 },
  { message_id: 4, timestamp: '2024-03-20T13:00:00Z', report_name: 'Weekly Report', credits_used: 10 },
  { message_id: 5, timestamp: '2024-03-20T14:00:00Z', report_name: 'Daily Report', credits_used: 15 }
]

const renderWithProviders = (component: React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {component}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const setupTest = async () => {
  vi.mocked(fetchUsageData).mockResolvedValue(mockData)
  renderWithProviders(<UsageTable />)
  await screen.findByTestId('usage-table-content')

  const reportNameHeader = screen.getByRole('columnheader', { name: /report name/i })
  const creditsHeader = screen.getByRole('columnheader', { name: /credits used/i })
  const reportNameDiv = within(reportNameHeader).getByText('Report Name').closest('div')!
  const creditsDiv = within(creditsHeader).getByText('Credits Used').closest('div')!

  return { reportNameHeader, creditsHeader, reportNameDiv, creditsDiv }
}

const getRowData = () => {
  const rows = screen.getAllByRole('row').slice(1) // Skip header row
  return rows.map(row => {
    const cells = within(row).getAllByRole('cell')
    return {
      reportName: cells[2].textContent || '',
      creditsUsed: Number(cells[3].textContent?.replace('.00', ''))
    }
  })
}

describe('UsageTable Sorting', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('Single Column Sorting', () => {
    it('sorts report name column correctly', async () => {
      const { reportNameDiv, reportNameHeader } = await setupTest()
      
      // Initial state
      expect(getRowData().map(row => row.reportName))
        .toEqual(['Daily Report', 'Daily Report', 'Weekly Report', 'Weekly Report', 'Daily Report'])

      // Ascending sort
      fireEvent.click(reportNameDiv)
      await within(reportNameHeader).findByTestId('sort-asc')
      expect(getRowData().map(row => row.reportName))
        .toEqual(['Daily Report', 'Daily Report', 'Daily Report', 'Weekly Report', 'Weekly Report'])

      // Descending sort
      fireEvent.click(reportNameDiv)
      await within(reportNameHeader).findByTestId('sort-desc')
      expect(getRowData().map(row => row.reportName))
        .toEqual(['Weekly Report', 'Weekly Report', 'Daily Report', 'Daily Report', 'Daily Report'])
    })

    it('sorts credits used column correctly', async () => {
      const { creditsDiv, creditsHeader } = await setupTest()
      
      // Initial state
      expect(getRowData().map(row => row.creditsUsed))
        .toEqual([10, 5, 15, 10, 15])

      // Ascending sort
      fireEvent.click(creditsDiv)
      await within(creditsHeader).findByTestId('sort-asc')
      expect(getRowData().map(row => row.creditsUsed))
        .toEqual([5, 10, 10, 15, 15])

      // Descending sort
      fireEvent.click(creditsDiv)
      await within(creditsHeader).findByTestId('sort-desc')
      expect(getRowData().map(row => row.creditsUsed))
        .toEqual([15, 15, 10, 10, 5])
    })
  })

  describe('Multi-Column Sorting', () => {
    it('sorts by report name (asc) then credits (asc)', async () => {
      const { reportNameDiv, creditsDiv, reportNameHeader, creditsHeader } = await setupTest()

      fireEvent.click(reportNameDiv, { shiftKey: true })
      await within(reportNameHeader).findByTestId('sort-asc')

      fireEvent.click(creditsDiv, { shiftKey: true })
      await within(creditsHeader).findByTestId('sort-asc')

      expect(getRowData()).toEqual([
        { reportName: 'Daily Report', creditsUsed: 5 },
        { reportName: 'Daily Report', creditsUsed: 10 },
        { reportName: 'Daily Report', creditsUsed: 15 },
        { reportName: 'Weekly Report', creditsUsed: 10 },
        { reportName: 'Weekly Report', creditsUsed: 15 }
      ])
    })

    it('sorts by report name (asc) then credits (desc)', async () => {
      const { reportNameDiv, creditsDiv, reportNameHeader, creditsHeader } = await setupTest()

      fireEvent.click(reportNameDiv, { shiftKey: true })
      await within(reportNameHeader).findByTestId('sort-asc')

      fireEvent.click(creditsDiv, { shiftKey: true })
      await within(creditsHeader).findByTestId('sort-asc')
      fireEvent.click(creditsDiv, { shiftKey: true })
      await within(creditsHeader).findByTestId('sort-desc')

      expect(getRowData()).toEqual([
        { reportName: 'Daily Report', creditsUsed: 15 },
        { reportName: 'Daily Report', creditsUsed: 10 },
        { reportName: 'Daily Report', creditsUsed: 5 },
        { reportName: 'Weekly Report', creditsUsed: 15 },
        { reportName: 'Weekly Report', creditsUsed: 10 }
      ])
    })

    it('sorts by credits (asc) then report name (asc)', async () => {
      const { reportNameDiv, creditsDiv, reportNameHeader, creditsHeader } = await setupTest()

      fireEvent.click(creditsDiv, { shiftKey: true })
      await within(creditsHeader).findByTestId('sort-asc')

      fireEvent.click(reportNameDiv, { shiftKey: true })
      await within(reportNameHeader).findByTestId('sort-asc')

      expect(getRowData()).toEqual([
        { reportName: 'Daily Report', creditsUsed: 5 },
        { reportName: 'Daily Report', creditsUsed: 10 },
        { reportName: 'Weekly Report', creditsUsed: 10 },
        { reportName: 'Daily Report', creditsUsed: 15 },
        { reportName: 'Weekly Report', creditsUsed: 15 }
      ])
    })

    it('maintains secondary sort when primary sort is toggled', async () => {
      const { reportNameDiv, creditsDiv, reportNameHeader, creditsHeader } = await setupTest()

      fireEvent.click(reportNameDiv, { shiftKey: true })
      await within(reportNameHeader).findByTestId('sort-asc')
      fireEvent.click(creditsDiv, { shiftKey: true })
      await within(creditsHeader).findByTestId('sort-asc')

      fireEvent.click(reportNameDiv, { shiftKey: true })
      await within(reportNameHeader).findByTestId('sort-desc')

      expect(getRowData()).toEqual([
        { reportName: 'Weekly Report', creditsUsed: 10 },
        { reportName: 'Weekly Report', creditsUsed: 15 },
        { reportName: 'Daily Report', creditsUsed: 5 },
        { reportName: 'Daily Report', creditsUsed: 10 },
        { reportName: 'Daily Report', creditsUsed: 15 }
      ])
    })
  })
}) 