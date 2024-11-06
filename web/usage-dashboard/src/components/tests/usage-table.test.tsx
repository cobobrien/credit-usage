import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import UsageTable from '../usage-table'
import { fetchUsageData } from '../../lib/client'
import '@testing-library/jest-dom'

vi.mock('../../lib/client')

const mockUsageData = [
  {
    message_id: 1,
    timestamp: '2024-03-20T10:00:00Z',
    report_name: 'Daily Report',
    credits_used: 10
  },
  {
    message_id: 2,
    timestamp: '2024-03-20T11:00:00Z',
    report_name: null,
    credits_used: 5
  }
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

describe('UsageTable', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('displays loading state initially', () => {
    vi.mocked(fetchUsageData).mockImplementation(() => new Promise(() => {}))
    renderWithProviders(<UsageTable />)
    expect(screen.getByTestId('usage-table-loading')).toBeInTheDocument()
  })

  it('displays error state when fetch fails', async () => {
    const error = new Error('Failed to fetch data')
    vi.mocked(fetchUsageData).mockRejectedValue(error)
    
    renderWithProviders(<UsageTable />)
    
    expect(await screen.findByTestId('usage-table-error')).toBeInTheDocument()
    expect(screen.getByText(`Error loading usage data: ${error.message}`)).toBeInTheDocument()
  })

  it('renders table with data successfully', async () => {
    vi.mocked(fetchUsageData).mockResolvedValue(mockUsageData)
    
    renderWithProviders(<UsageTable />)
    
    expect(await screen.findByTestId('usage-table-content')).toBeInTheDocument()
    expect(screen.queryByTestId('usage-table-loading')).not.toBeInTheDocument()
    
    expect(screen.getByTestId('usage-table-header')).toBeInTheDocument()
    
    expect(screen.getByText('Daily Report')).toBeInTheDocument()
    expect(screen.getByText('10.00')).toBeInTheDocument()
    expect(screen.getByText('5.00')).toBeInTheDocument()
    
    expect(screen.getByText('20-03-2024 10:00')).toBeInTheDocument()
    expect(screen.getByText('20-03-2024 11:00')).toBeInTheDocument()
  })
}) 