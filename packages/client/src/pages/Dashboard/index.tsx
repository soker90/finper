import MuiTable from '@soker90/react-mui-table'

const DashboardDefault = () => {
  return (
        <MuiTable
            columns={[
              {
                title: 'Columna 1',
                field: 'column'
              },
              {
                title: 'Columna 2',
                field: 'date',
                render: () => 'd'
              },
              {
                title: 'Columna 3',
                field: 'column3'
              }
            ]}
            data={[{ column: 'Valor 1', date: new Date(1609428038070), column3: 'Otro valor' }]}
            title="Mi tabla"
            refresh={() => {
            }}
            onRowClick={() => {
            }}
            count={3}
        />
  )
}

export default DashboardDefault
