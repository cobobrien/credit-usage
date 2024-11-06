import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import UsageTable from '../usage-table'
import { fetchUsageData } from '../../lib/client'
import '@testing-library/jest-dom'

vi.mock('../../lib/client')

// Create a wrapper component to access current location
const LocationDisplay = () => {
  const location = useLocation()
  return <div data-testid="location-display">{location.search}</div>
}

const mockData = [
  { message_id: 1, timestamp: '2024-03-20T10:00:00Z', report_name: 'Daily Report', credits_used: 10 },
  { message_id: 2, timestamp: '2024-03-20T11:00:00Z', report_name: 'Weekly Report', credits_used: 5 },
]

const renderWithProviders = (component: React.ReactNode, initialUrl?: string) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialUrl ? [`/${initialUrl}`] : undefined}>
        {component}
        <LocationDisplay />
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

const setupTestWithUrl = async (initialUrl: string) => {
  vi.mocked(fetchUsageData).mockResolvedValue(mockData)
  renderWithProviders(<UsageTable />, initialUrl)
  
  // Wait for table to be fully loaded
  const table = await screen.findByTestId('usage-table-content')
  
  // Wait for table body to be populated
  const tbody = table.querySelector('tbody')
  if (!tbody) throw new Error('Table body not found')
  
  // Wait for cells to be rendered
  await within(tbody).findAllByRole('cell')

  // Get headers from the specific table
  const thead = table.querySelector('thead')

  const reportNameHeader = within(thead!).getByRole('columnheader', { name: /report name/i })
  const creditsHeader = within(thead!).getByRole('columnheader', { name: /credits used/i })
  const reportNameDiv = within(reportNameHeader).getByText('Report Name').closest('div')!
  const creditsDiv = within(creditsHeader).getByText('Credits Used').closest('div')!

  return { reportNameHeader, creditsHeader, reportNameDiv, creditsDiv }
}

describe('UsageTable URL Updates', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('starts with empty URL parameters', async () => {
    await setupTest()
    expect(screen.getByTestId('location-display')).toHaveTextContent('')
  })

  it('updates URL when single column sorting is applied', async () => {
    const { reportNameDiv } = await setupTest()

    fireEvent.click(reportNameDiv)
    expect(screen.getByTestId('location-display')).toHaveTextContent('?sort=report_name%3Aasc')

    fireEvent.click(reportNameDiv)
    expect(screen.getByTestId('location-display')).toHaveTextContent('?sort=report_name%3Adesc')

    fireEvent.click(reportNameDiv)
    expect(screen.getByTestId('location-display')).toHaveTextContent('')
  })

  it('updates URL with multiple sort parameters', async () => {
    const { reportNameDiv, creditsDiv } = await setupTest()

    fireEvent.click(reportNameDiv, { shiftKey: true })
    expect(screen.getByTestId('location-display')).toHaveTextContent('?sort=report_name%3Aasc')

    fireEvent.click(creditsDiv, { shiftKey: true })
    expect(screen.getByTestId('location-display')).toHaveTextContent('?sort=report_name%3Aasc%2Ccredits_used%3Aasc')
  })

  it('maintains correct URL order when toggling sort directions', async () => {
    const { reportNameDiv, creditsDiv } = await setupTest()

    fireEvent.click(reportNameDiv, { shiftKey: true })
    fireEvent.click(creditsDiv, { shiftKey: true })

    fireEvent.click(reportNameDiv, { shiftKey: true })
    expect(screen.getByTestId('location-display')).toHaveTextContent('?sort=report_name%3Adesc%2Ccredits_used%3Aasc')

    fireEvent.click(creditsDiv, { shiftKey: true })
    expect(screen.getByTestId('location-display')).toHaveTextContent('?sort=report_name%3Adesc%2Ccredits_used%3Adesc')
  })

  it('removes sort parameters from URL when clearing sorts', async () => {
    const { reportNameDiv, creditsDiv } = await setupTest()

    fireEvent.click(reportNameDiv, { shiftKey: true })
    fireEvent.click(creditsDiv, { shiftKey: true })

    fireEvent.click(reportNameDiv, { shiftKey: true })
    expect(screen.getByTestId('location-display')).toHaveTextContent('?sort=report_name%3Adesc%2Ccredits_used%3Aasc')

    fireEvent.click(reportNameDiv, { shiftKey: true })
    expect(screen.getByTestId('location-display')).toHaveTextContent('?sort=credits_used%3Aasc')

    fireEvent.click(creditsDiv, { shiftKey: true })
    expect(screen.getByTestId('location-display')).toHaveTextContent('?sort=credits_used%3Adesc')

    fireEvent.click(creditsDiv, { shiftKey: true })
    expect(screen.getByTestId('location-display')).toHaveTextContent('')
  })

  describe('Initial URL Parameters', () => {
    beforeEach(() => {
      vi.resetAllMocks()
    })

    it('applies single column sort from URL', async () => {
      const { reportNameHeader } = await setupTestWithUrl('?sort=report_name%3Aasc')
      // Wait for sort to be applied
      await within(reportNameHeader).findByTestId('sort-asc')
      
      expect(getRowData().map(row => row.reportName))
        .toEqual(['Daily Report', 'Weekly Report'])

      vi.resetAllMocks()
      const { reportNameHeader: descHeader } = await setupTestWithUrl('?sort=report_name%3Adesc')
      await within(descHeader).findByTestId('sort-desc')
      
      expect(getRowData().map(row => row.reportName))
        .toEqual(['Weekly Report', 'Daily Report'])
    })

    // it('applies multi-column sort from URL', async () => {
    //   const extendedMockData = [
    //     ...mockData,
    //     { message_id: 3, timestamp: '2024-03-20T12:00:00Z', report_name: 'Daily Report', credits_used: 15 },
    //     { message_id: 4, timestamp: '2024-03-20T13:00:00Z', report_name: 'Weekly Report', credits_used: 15 },
    //   ]
    //   vi.mocked(fetchUsageData).mockResolvedValue(extendedMockData)

    //   await setupTestWithUrl('?sort=report_name%3Aasc%2Ccredits_used%3Adesc')
    //   const data = await getRowData()
    //   expect(data).toEqual([
    //     { reportName: 'Daily Report', creditsUsed: 15 },
    //     { reportName: 'Daily Report', creditsUsed: 10 },
    //     { reportName: 'Weekly Report', creditsUsed: 15 },
    //     { reportName: 'Weekly Report', creditsUsed: 5 },
    //   ])
    // })

    // it('shows correct sort indicators when loading from URL', async () => {
    //   await setupTestWithUrl('?sort=report_name%3Aasc%2Ccredits_used%3Adesc')
      
    //   const reportNameHeader = screen.getByRole('columnheader', { name: /report name/i })
    //   const creditsHeader = screen.getByRole('columnheader', { name: /credits used/i })

    //   expect(within(reportNameHeader).getByTestId('sort-asc')).toBeInTheDocument()
    //   expect(within(creditsHeader).getByTestId('sort-desc')).toBeInTheDocument()
    // })

    // it('handles invalid sort parameters gracefully', async () => {
    //   // Test with invalid column name
    //   await setupTestWithUrl('?sort=invalid_column%3Aasc')
    //   const invalidColumnData = await getRowData()
    //   expect(invalidColumnData.map(row => row.reportName))
    //     .toEqual(['Daily Report', 'Weekly Report']) // Should show default order

    //   // Test with invalid sort direction
    //   await setupTestWithUrl('?sort=report_name%3Ainvalid')
    //   const invalidDirectionData = await getRowData()
    //   expect(invalidDirectionData.map(row => row.reportName))
    //     .toEqual(['Daily Report', 'Weekly Report']) // Should show default order

    //   // Test with malformed sort parameter
    //   await setupTestWithUrl('?sort=invalid_format')
    //   const invalidFormatData = await getRowData()
    //   expect(invalidFormatData.map(row => row.reportName))
    //     .toEqual(['Daily Report', 'Weekly Report']) // Should show default order
    // })
  })
}) 