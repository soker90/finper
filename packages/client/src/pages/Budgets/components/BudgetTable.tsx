import {Grid} from '@mui/material'
import {TableMaterial} from '@soker90/react-mui-table'
import {EditOutlined} from '@ant-design/icons'
import {useState} from 'react'

import {format} from 'utils/index'
import ModalEdit from './ModalEdit'

const BudgetTable = ({budgets, title}: { budgets: any, title: string }) => {
    const [selectedBudget, setSelectedBudget] = useState<{ category: string, amount: number } | null>(null)
    const handleEdit = (item: any) => {
        setSelectedBudget({category: item.category, amount: item?.budgets?.[0]?.amount || 0})
    }
    const handleCloseEdit = () => {
        setSelectedBudget(null)
    }

    return (
        <Grid item xs={12} lg={6}>
            <TableMaterial
                columns={[
                    {title: 'Categoría', render: ({name}) => name},
                    {title: 'Real', render: ({budgets}) => format.euro(budgets[0].real)},
                    {title: 'Estimado', render: ({budgets}) => format.euro(budgets[0].amount)}
                ]}
                data={budgets}
                title={title}
                actions={[
                    {
                        onClick: handleEdit,
                        tooltip: 'Editar',
                        icon: EditOutlined
                    }
                ]}
            />
            {selectedBudget && <ModalEdit onClose={handleCloseEdit} budget={selectedBudget}/>}
        </Grid>
    )
}

export default BudgetTable
