import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  flexRender,
} from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { type UsageData, fetchUsageData } from '@/lib/client'
import { columns } from './columns'
import { UsageTableHeader } from './TableHeader'
import { TablePagination } from './TablePagination'
import { TableLoading } from './TableLoading'
import { TableError } from './TableError'

export function UsageTableContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sorting, setSorting] = useState<SortingState>(() => {
    const searchParams = new URLSearchParams(location.search)
    const sortParam = searchParams.get('sort')
    if (sortParam) {
      return sortParam.split(',').map(sort => {
        const [id, desc] = sort.split(':')
        return { id, desc: desc === 'desc' }
      })
    }
    return []
  })

  const { data, isLoading, isError, error } = useQuery<UsageData[], Error>({
    queryKey: ['usageData'],
    queryFn: fetchUsageData,
  })

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    if (sorting.length > 0) {
      const sortString = sorting
        .map(sort => `${sort.id}:${sort.desc ? 'desc' : 'asc'}`)
        .join(',')
      searchParams.set('sort', sortString)
    } else {
      searchParams.delete('sort')
    }
    navigate(`?${searchParams.toString()}`, { replace: true })
  }, [sorting, navigate, location.search])

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data: data || [],
    columns,
    state: { 
      sorting,
      pagination,
    },
    isMultiSortEvent: () => true,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  if (isLoading) {
    return <TableLoading table={table} columnCount={columns.length} />
  }

  if (isError) {
    return <TableError error={error} />
  }

  return (
    <Card className="w-full" data-testid="usage-table-content">
      <CardContent>
        <Table>
          <UsageTableHeader headerGroups={table.getHeaderGroups()} />
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination table={table} />
      </CardContent>
    </Card>
  )
} 
