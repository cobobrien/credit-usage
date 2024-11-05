import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TableErrorProps {
  error: Error
}

export function TableError({ error }: TableErrorProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Error</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-red-500">Error loading usage data: {error.message}</p>
      </CardContent>
    </Card>
  )
} 