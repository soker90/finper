import { useMemo, useState } from 'react'
import {
  Box,
  Card,
  SxProps,
  Table,
  TablePagination
} from '@mui/material'
import styled from '@emotion/styled'

import NoData from './components/NoData'
import HeadTable from './components/HeadTable'
import BodyTable from './components/BodyTable'
import TitleTable from './components/TitleTable'
import { labelOfRows } from './utils'
import * as styles from './styles'
import { Action, Column } from './types'

export interface TableMaterialProps {
    sx?: SxProps;
    columns: Column[];
    actions?: Action[]
    data: object[];
    title?: string;
    refresh: ({ offset, limit }: { offset?: number, limit?: number }) => void;
    count?: number;
    onRowClick?: (row: object) => void;
    withCard?: boolean;
    href?: string;
    multiSelect?: (row: object) => boolean;
    onSelected?: (selected: object[]) => void;
    rowClass?: (row: object) => string;
    rowsPerPageOptions?: number[];
}

const TableMaterial = (
  {
    columns,
    actions,
    data = [],
    title,
    refresh,
    count = 0,
    onRowClick,
    withCard = true,
    href,
    multiSelect,
    onSelected,
    rowClass,
    rowsPerPageOptions,
    ...rest
  }: TableMaterialProps) => {
  const [page, setPage] = useState(0)
  const [limit, setLimit] = useState(rowsPerPageOptions?.[0] || 10)

  const handlePageChange = (event: any, newPage: any) => {
    setPage(newPage)
    refresh({
      offset: newPage * limit,
      limit
    })
  }

  const handleLimitChange = (event: any) => {
    setLimit(event.target.value)
    refresh({
      offset: page * event.target.value,
      limit: event.target.value
    })
  }

  const Wrapper = useMemo(() => (
    withCard
      ? styled(Card)`
          width: auto;
          overflowX: 'visible';
        `
      : styled.div`
          width: auto;
          overflowX: 'visible';
        `
  ), [withCard])

  return (
        <Wrapper
            {...rest}
        >
            <TitleTable title={title}/>
            <Box>
                <Table>
                    <HeadTable actions={actions} columns={columns} multiSelect={multiSelect}/>
                    <BodyTable
                        columns={columns}
                        actions={actions}
                        classes={styles}
                        data={data}
                        href={href}
                        onRowClick={onRowClick}
                        multiSelect={multiSelect}
                        onSelected={onSelected}
                        rowClass={rowClass}
                    />
                </Table>

                <NoData elements={data.length}/>
            </Box>
            {Boolean(count) &&
                (
                    <TablePagination
                        component='div'
                        count={count}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleLimitChange}
                        page={page}
                        rowsPerPage={limit}
                        rowsPerPageOptions={rowsPerPageOptions || [10, 20, 30]}
                        labelRowsPerPage='filas'
                        labelDisplayedRows={labelOfRows}
                    />
                )}
        </Wrapper>
  )
}

export default TableMaterial
