import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ChartLoading() {
  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  )
} 