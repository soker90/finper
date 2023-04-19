import { TableMaterial } from '@soker90/react-mui-table'

import { MainCard } from 'components'
import { format } from 'utils'
import { PensionTransaction } from 'types'

const PensionTransactionsTable = ({ transactions }: { transactions: PensionTransaction[] }) => (
    <MainCard sx={{ mt: 2 }} content={false}>
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
        />
    </MainCard>
)

export default PensionTransactionsTable
