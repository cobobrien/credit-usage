import { format, parseISO } from 'date-fns'
import { createColumnHelper } from '@tanstack/react-table'
import { type UsageData } from '@/lib/client'

const columnHelper = createColumnHelper<UsageData>()

export const columns = [
  columnHelper.accessor('message_id', {
    header: 'Message ID',
    cell: info => info.getValue(),
    enableSorting: false,
  }),
  columnHelper.accessor('timestamp', {
    header: 'Timestamp',
    cell: info => format(parseISO(info.getValue()), 'dd-MM-yyyy HH:mm'),
    enableSorting: false,
  }),
  columnHelper.accessor('report_name', {
    header: 'Report Name',
    cell: info => info.getValue() || '',
    enableSorting: true,
    sortDescFirst: false,
  }),
  columnHelper.accessor('credits_used', {
    header: 'Credits Used',
    cell: info => info.getValue().toFixed(2),
    enableSorting: true,
    sortDescFirst: false,
  }),
] 