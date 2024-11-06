import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChartContent } from '../usage-chart/ChartContent'
import '@testing-library/jest-dom'

// Mock recharts as it doesn't play well with Jest/Testing Library
vi.mock('recharts', () => ({
  ResponsiveContainer: vi.fn(({ children }) => children),
  BarChart: vi.fn(({ children }) => <div data-testid="bar-chart">{children}</div>),
  Bar: vi.fn(),
  XAxis: vi.fn(),
  YAxis: vi.fn(),
  CartesianGrid: vi.fn(),
  Tooltip: vi.fn(),
}))

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
    report_name: 'Weekly Report',
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
      {component}
    </QueryClientProvider>
  )
}

describe('ChartContent', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('displays loading state initially', () => {
    renderWithProviders(<ChartContent />)
    expect(screen.getByTestId('chart-loading')).toBeInTheDocument()
  })

  it('displays error state when query fails', async () => {
    const errorQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          queryFn: () => {
            throw new Error('Failed to fetch data')
          },
        },
      },
    })

    render(
      <QueryClientProvider client={errorQueryClient}>
        <ChartContent />
      </QueryClientProvider>
    )
    
    expect(await screen.findByTestId('chart-error')).toBeInTheDocument()
    expect(screen.getByText('Error loading chart data: Failed to fetch data')).toBeInTheDocument()
  })

  it('renders chart with data successfully', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(['usageData'], mockUsageData)

    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <ChartContent />
      </QueryClientProvider>
    )
    
    const chartContent = await screen.findByTestId('chart-content')
    expect(chartContent).toBeInTheDocument()
    expect(screen.queryByTestId('chart-loading')).not.toBeInTheDocument()
  })
}) 