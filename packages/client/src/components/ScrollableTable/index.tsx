import { ReactNode } from 'react'
import { Table, TableContainer, SxProps, Theme } from '@mui/material'
import { MainCard } from 'components'

interface Props {
  children: ReactNode
  stickyHeader?: boolean
  size?: 'small' | 'medium'
  /** Extra sx applied to the inner `<Table>` */
  sx?: SxProps<Theme>
  /** Extra sx applied to the `<TableContainer>` */
  containerSx?: SxProps<Theme>
  /** When provided, wraps the table in a `<MainCard>` */
  title?: string
  /** Slot rendered in the `CardHeader` action area (e.g. chips, buttons) */
  secondary?: ReactNode
  /** Extra sx applied to the `<MainCard>` wrapper */
  cardSx?: SxProps<Theme>
}

const ScrollableTable = ({
  children,
  stickyHeader = false,
  size = 'medium',
  sx,
  containerSx,
  title,
  secondary,
  cardSx
}: Props) => {
  const container = (
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
  )

  if (title !== undefined) {
    return (
      <MainCard title={title} secondary={secondary} content={false} sx={cardSx}>
        {container}
      </MainCard>
    )
  }

  return container
}

export default ScrollableTable
