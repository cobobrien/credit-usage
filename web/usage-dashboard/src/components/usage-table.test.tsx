import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import UsageTable from './usage-table'
import { fetchUsageData } from '../lib/client'
import '@testing-library/jest-dom'

vi.mock('../lib/client')

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
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
}) 