import { flexRender, HeaderGroup } from '@tanstack/react-table'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { type UsageData } from '@/lib/client'

interface UsageTableHeaderProps {
  headerGroups: HeaderGroup<UsageData>[]
}

export function UsageTableHeader({ headerGroups }: UsageTableHeaderProps) {
  return (
    <TableHeader>
      {headerGroups.map(headerGroup => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map(header => (
            <TableHead key={header.id}>
              {header.isPlaceholder ? null : (
                <div
                  className={`flex items-center ${
                    header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                  }`}
                  onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getCanSort() && (
                    {
                      asc: <ChevronUp className="ml-2 h-4 w-4" />,
                      desc: <ChevronDown className="ml-2 h-4 w-4" />,
                      false: <ChevronsUpDown className="ml-2 h-4 w-4" />,
                    }[header.column.getIsSorted() as string] ?? null
                  )}
                </div>
              )}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  )
}
