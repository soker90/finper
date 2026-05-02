import { memo, ReactNode, useMemo } from 'react'
import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  SxProps,
  Theme
} from '@mui/material'
import { Link } from 'react-router'
import { MainCard } from 'components'
import { Column, Action } from './types'

// ─── Shared container ────────────────────────────────────────────────────────

interface ContainerProps {
  containerSx?: SxProps<Theme>
  stickyHeader: boolean
  size: 'small' | 'medium'
  sx?: SxProps<Theme>
  children: ReactNode
}

const TableWrapper = memo(({ containerSx, stickyHeader, size, sx, children }: ContainerProps) => (
  <TableContainer
    sx={[
      {
        width: '100%',
        overflowX: 'auto',
        position: 'relative',
        display: 'block',
        maxWidth: '100%'
      },
      ...(Array.isArray(containerSx) ? containerSx : containerSx ? [containerSx] : [])
    ]}
  >
    <Table
      stickyHeader={stickyHeader}
      size={size}
      sx={[
        { '& td, & th': { whiteSpace: 'nowrap' } },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : [])
      ]}
    >
      {children}
    </Table>
  </TableContainer>
))

// ─── Declarative head ─────────────────────────────────────────────────────────

interface DeclarativeHeadProps<T> {
  columns: Column<T>[]
  hasActions: boolean
}

const DeclarativeHead = <T,>({ columns, hasActions }: DeclarativeHeadProps<T>) => (
  <TableHead>
    <TableRow>
      {columns.map((col) => (
        <TableCell key={col.id} align={col.align ?? 'left'} width={col.width}>
          {col.label}
        </TableCell>
      ))}
      {hasActions && <TableCell align='right'>Acciones</TableCell>}
    </TableRow>
  </TableHead>
)

// ─── Action cell ─────────────────────────────────────────────────────────────

function ActionCell<T> ({ row, actions }: { row: T; actions: Action<T>[] }) {
  return (
    <TableCell align='right' sx={{ py: 0.5 }}>
      {actions.map(({ icon: Icon, tooltip, onClick, to, disabled, color }) => {
        const isDisabled = typeof disabled === 'function' ? disabled(row) : (disabled ?? false)
        return (
          <Tooltip key={tooltip} title={tooltip}>
            <span>
              <IconButton
                size='large'
                color={color}
                disabled={isDisabled}
                aria-label={tooltip}
                {...(onClick ? { onClick: () => onClick(row) } : {})}
                {...(to ? { component: Link, to: to(row) } : {})}
              >
                <Icon />
              </IconButton>
            </span>
          </Tooltip>
        )
      })}
    </TableCell>
  )
}

// ─── Declarative body ─────────────────────────────────────────────────────────

interface DeclarativeBodyProps<T> {
  data: T[]
  columns: Column<T>[]
  actions?: Action<T>[]
  keyExtractor?: (row: T, index: number) => string
  rowSx?: (row: T) => SxProps<Theme>
  emptyText: string
  emptyNode?: ReactNode
}

const DeclarativeBody = <T,>({
  data,
  columns,
  actions,
  keyExtractor,
  rowSx,
  emptyText,
  emptyNode
}: DeclarativeBodyProps<T>) => {
  const colSpan = columns.length + (actions && actions.length > 0 ? 1 : 0)

  if (data.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={colSpan} align='center'>
            {emptyNode ?? (
              <Typography color='text.secondary' py={2}>
                {emptyText}
              </Typography>
            )}
          </TableCell>
        </TableRow>
      </TableBody>
    )
  }

  return (
    <TableBody>
      {data.map((row, index) => {
        const rowStyle: SxProps<Theme> = { '&:last-child td, &:last-child th': { border: 0 } }
        const extraStyle = rowSx ? rowSx(row) : undefined

        return (
          <TableRow
            hover
            key={keyExtractor ? keyExtractor(row, index) : index}
            sx={extraStyle ? [rowStyle, extraStyle] as SxProps<Theme> : rowStyle}
          >
            {columns.map((col) => (
              <TableCell key={col.id} align={col.align ?? 'left'}>
                {col.render ? col.render(row) : col.field != null ? String(row[col.field] ?? '') : null}
              </TableCell>
            ))}
            {actions && actions.length > 0 && <ActionCell row={row} actions={actions} />}
          </TableRow>
        )
      })}
    </TableBody>
  )
}

// ─── Public API ──────────────────────────────────────────────────────────────

interface BaseProps {
  title?: string
  secondary?: ReactNode
  cardSx?: SxProps<Theme>
  stickyHeader?: boolean
  size?: 'small' | 'medium'
  sx?: SxProps<Theme>
  containerSx?: SxProps<Theme>
}

type DeclarativeProps<T> = BaseProps & {
  columns: Column<T>[]
  data: T[]
  actions?: Action<T>[]
  keyExtractor?: (row: T, index: number) => string
  rowSx?: (row: T) => SxProps<Theme>
  emptyText?: string
  emptyNode?: ReactNode
  children?: never
}

type RawProps = BaseProps & {
  children: ReactNode
  columns?: never
  data?: never
  actions?: never
  keyExtractor?: never
  rowSx?: never
  emptyText?: never
  emptyNode?: never
}

type Props<T> = DeclarativeProps<T> | RawProps

function ScrollableTableInner<T> (props: Props<T>) {
  const {
    title,
    secondary,
    cardSx,
    stickyHeader = false,
    size = 'medium',
    sx,
    containerSx
  } = props

  const columns = 'columns' in props ? props.columns : undefined
  const actionsLength = 'actions' in props ? props.actions?.length : 0

  const head = useMemo(() => {
    if (!columns) return null
    return <DeclarativeHead columns={columns} hasActions={!!actionsLength} />
  }, [columns, actionsLength])

  const inner = 'columns' in props && props.columns && props.data !== undefined
    ? (
      <>
        {head}
        <DeclarativeBody
          data={props.data}
          columns={props.columns}
          actions={props.actions}
          keyExtractor={props.keyExtractor}
          rowSx={props.rowSx}
          emptyText={props.emptyText ?? 'No se han encontrado datos'}
          emptyNode={props.emptyNode}
        />
      </>
      )
    : ('children' in props ? props.children : null)

  const table = (
    <TableWrapper
      containerSx={containerSx}
      stickyHeader={stickyHeader}
      size={size}
      sx={sx}
    >
      {inner}
    </TableWrapper>
  )

  if (title !== undefined) {
    return (
      <MainCard title={title} secondary={secondary} content={false} sx={cardSx}>
        {table}
      </MainCard>
    )
  }

  return table
}

// Re-export types for consumers
export type { Column, Action } from './types'

const ScrollableTable = memo(ScrollableTableInner) as typeof ScrollableTableInner

export default ScrollableTable
