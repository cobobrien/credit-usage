import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { UsageTableHeader } from './TableHeader'
import { type Table as TableType } from '@tanstack/react-table'
import { type UsageData } from '@/lib/client'

interface TableLoadingProps {
  table: TableType<UsageData>
  columnCount: number
}

export function TableLoading({ table, columnCount }: TableLoadingProps) {
  return (
    <Card className="w-full" data-testid="usage-table-loading">
      <CardContent>
        <Table>
          <UsageTableHeader headerGroups={table.getHeaderGroups()} />
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                {Array.from({ length: columnCount }).map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton className="h-4 w-[80%]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 