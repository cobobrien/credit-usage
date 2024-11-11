import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import UsageChart from '@/components/usage-chart'
import UsageTable from '@/components/usage-table'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
      gcTime: 1000 * 60 * 30,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="w-3/4 mx-auto my-8">
          <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Credit Usage Dashboard</h1>
          <UsageChart />
          <div className="mt-8">
            <UsageTable />
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
