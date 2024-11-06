import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ResponsiveContainer 
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { Card, CardContent } from "@/components/ui/card"
import { type UsageData } from '@/lib/client'
import { ChartLoading } from './ChartLoading'
import { ChartError } from './ChartError'
import { processChartData } from '@/lib/chart-utils'

export function ChartContent() {
  const { data, isLoading, isError, error } = useQuery<UsageData[], Error>({
    queryKey: ['usageData'],
  })

  const chartData = useMemo(() => processChartData(data), [data])

  if (isLoading) {
    return <ChartLoading />
  }

  if (isError) {
    return <ChartError error={error} />
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="h-[300px]" data-testid="chart-content">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => format(parseISO(date), 'dd-MM-yyyy')}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => format(parseISO(date as string), 'dd-MM-yyyy')}
                formatter={(value) => [`${value} credits`, 'Credits Used']}
              />
              <Bar 
                dataKey="credits" 
                fill="#646cff" 
                name="Credits Used"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 