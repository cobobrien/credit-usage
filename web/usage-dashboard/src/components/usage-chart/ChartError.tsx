import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ChartErrorProps {
  error: Error
}

export function ChartError({ error }: ChartErrorProps) {
  return (
    <div data-testid="chart-error">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error loading chart data: {error.message}</p>
        </CardContent>
      </Card>
    </div>
  )
} 
