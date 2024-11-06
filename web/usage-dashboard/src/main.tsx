import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import UsageChart from '@/components/usage-chart'
import UsageTable from '@/components/usage-table'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="w-3/4 mx-auto my-8">
          <UsageChart />
          <div className="mt-8">
            <UsageTable />
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
