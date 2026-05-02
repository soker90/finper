import { TableMaterial } from '@soker90/react-mui-table'
import { EditOutlined } from '@ant-design/icons'
import { Box } from '@mui/material'

import { MainCard } from 'components'
import { format } from 'utils'
import { PensionTransaction } from 'types'

const PensionTransactionsTable = ({ transactions, onEdit }: {
  transactions: PensionTransaction[],
  onEdit: (transaction: PensionTransaction) => void
}) => (
  <MainCard sx={{ mt: 2 }} content={false}>
    <Box sx={{ width: '100%', overflowX: 'auto', '& td, & th': { whiteSpace: 'nowrap' } }}>
      <TableMaterial
        columns={[
          { title: 'Fecha', render: ({ date }) => format.date(date) },
          { title: 'Empresa (€)', render: ({ companyAmount }) => format.euro(companyAmount) },
          { title: 'Empresa (uds)', field: 'companyUnits' },
          { title: 'Empleado (€)', render: ({ employeeAmount }) => format.euro(employeeAmount) },
          { title: 'Empleado (uds)', field: 'employeeUnits' },
          { title: 'Valor ud.', render: ({ value }) => format.euro(value) }
        ]}
        data={transactions}
        title='Movimientos'
        actions={[{
          icon: EditOutlined,
          tooltip: 'Editar',
          onClick: onEdit
        }]}
      />
    </Box>
  </MainCard>
)

export default PensionTransactionsTable
