import { Grid } from '@mui/material'
import { TableMaterial } from '@soker90/react-mui-table'
import { EditOutlined } from '@ant-design/icons'
import { useState } from 'react'

import { format } from 'utils/index'
import ModalEdit from './ModalEdit'
import { Budget } from 'types/budget'

const BudgetTable = ({ budgets, title }: { budgets: any, title: string }) => {
  const [selectedBudget, setSelectedBudget] = useState<{ category: string, amount: number, month: number, year: number } | null>(null)
  const handleEdit = (item: Budget) => {
    setSelectedBudget({
      category: item.id,
      amount: item?.budgets?.[0]?.amount,
      month: item?.budgets?.[0]?.month,
      year: item?.budgets?.[0]?.year
    })
  }
  const handleCloseEdit = () => {
    setSelectedBudget(null)
  }

  return (
        <>
            <Grid item xs={12} lg={6}>
                <TableMaterial
                    columns={[
                      { title: 'Categoría', field: 'name' },
                      { title: 'Real', render: ({ budgets }) => format.euro(budgets[0].real) },
                      { title: 'Estimado', render: ({ budgets }) => format.euro(budgets[0].amount) }
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
            </Grid>
            {selectedBudget && <ModalEdit onClose={handleCloseEdit} budget={selectedBudget}/>}
        </>
  )
}

export default BudgetTable

/*
const a =
    <div class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-12 MuiGrid-grid-md-6 MuiGrid-grid-lg-6 css-1vbxol5">
        <div class="MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation0 MuiCard-root css-1hk8ayy">
            <div class="MuiCardHeader-root css-nbt2v6">
                <div class="MuiCardHeader-content css-11qjisw"><span
                    class="MuiTypography-root MuiTypography-subtitle1 MuiCardHeader-title css-1rod83b">Product Sales</span>
                </div>
            </div>
            <hr class="MuiDivider-root MuiDivider-fullWidth css-d7wf4l">
                <div class="MuiGrid-root MuiGrid-container css-1ra0hzh">
                    <div class="MuiGrid-root MuiGrid-item css-1wxaqej">
                        <div
                            class="MuiGrid-root MuiGrid-container MuiGrid-spacing-xs-1 MuiGrid-direction-xs-column css-1yrb18f">
                            <div class="MuiGrid-root MuiGrid-item css-1wxaqej"><h6
                                class="MuiTypography-root MuiTypography-subtitle2 css-jn4qe1">Earning</h6></div>
                            <div class="MuiGrid-root MuiGrid-item css-1wxaqej"><h4
                                class="MuiTypography-root MuiTypography-h4 css-15dk3dn">20,569$</h4></div>
                        </div>
                    </div>
                    <div class="MuiGrid-root MuiGrid-item css-1wxaqej">
                        <div
                            class="MuiGrid-root MuiGrid-container MuiGrid-spacing-xs-1 MuiGrid-direction-xs-column css-1yrb18f">
                            <div class="MuiGrid-root MuiGrid-item css-1wxaqej"><h6
                                class="MuiTypography-root MuiTypography-subtitle2 css-jn4qe1">Yesterday</h6></div>
                            <div class="MuiGrid-root MuiGrid-item css-1wxaqej"><h4
                                class="MuiTypography-root MuiTypography-h4 css-15dk3dn">580$</h4></div>
                        </div>
                    </div>
                    <div class="MuiGrid-root MuiGrid-item css-1wxaqej">
                        <div
                            class="MuiGrid-root MuiGrid-container MuiGrid-spacing-xs-1 MuiGrid-direction-xs-column css-1yrb18f">
                            <div class="MuiGrid-root MuiGrid-item css-1wxaqej"><h6
                                class="MuiTypography-root MuiTypography-subtitle2 css-jn4qe1">This Week</h6></div>
                            <div class="MuiGrid-root MuiGrid-item css-1wxaqej"><h4
                                class="MuiTypography-root MuiTypography-h4 css-15dk3dn">5,789$</h4></div>
                        </div>
                    </div>
                </div>
                <div class="css-jjtu05">
                    <div data-simplebar="init" class="css-123ekno">
                        <div class="simplebar-wrapper" style="margin: 0px;">
                            <div class="simplebar-height-auto-observer-wrapper">
                                <div class="simplebar-height-auto-observer"></div>
                            </div>
                            <div class="simplebar-mask">
                                <div class="simplebar-offset" style="right: 0px; bottom: 0px;">
                                    <div class="simplebar-content-wrapper" tabindex="0" role="region"
                                         aria-label="scrollable content" style="height: 100%; overflow: hidden scroll;">
                                        <div class="simplebar-content" style="padding: 0px;">
                                            <div class="MuiTableContainer-root css-kge0eu">
                                                <table class="MuiTable-root css-13d9jw5">
                                                    <thead class="MuiTableHead-root css-1aj8rkm">
                                                    <tr class="MuiTableRow-root MuiTableRow-head css-1mwvjf9">
                                                        <th class="MuiTableCell-root MuiTableCell-head MuiTableCell-sizeMedium css-q4p5rk"
                                                            scope="col">Last Sales
                                                        </th>
                                                        <th class="MuiTableCell-root MuiTableCell-head MuiTableCell-sizeMedium css-11oq6f7"
                                                            scope="col">Product Name
                                                        </th>
                                                        <th class="MuiTableCell-root MuiTableCell-head MuiTableCell-alignRight MuiTableCell-sizeMedium css-1sy68bw"
                                                            scope="col">Price
                                                        </th>
                                                    </tr>
                                                    </thead>
                                                    <tbody class="MuiTableBody-root css-1pt5hah">
                                                    <tr class="MuiTableRow-root MuiTableRow-hover css-1mwvjf9">
                                                        <td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-p87hqv">
                                                            <span class="">2136</span></td>
                                                        <td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-vrwlhx">Head
                                                            Phone
                                                        </td>
                                                        <td class="MuiTableCell-root MuiTableCell-body MuiTableCell-alignRight MuiTableCell-sizeMedium css-rrus11">
                                                            <span>$ 926.23</span></td>
                                                    </tr>
                                                    <tr class="MuiTableRow-root MuiTableRow-hover css-1mwvjf9">
                                                        <td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-p87hqv">
                                                            <span class="">2546</span></td>
                                                        <td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-vrwlhx">Iphone
                                                            V
                                                        </td>
                                                        <td class="MuiTableCell-root MuiTableCell-body MuiTableCell-alignRight MuiTableCell-sizeMedium css-rrus11">
                                                            <span>$ 485.85</span></td>
                                                    </tr>
                                                    <tr class="MuiTableRow-root MuiTableRow-hover css-1mwvjf9">
                                                        <td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-p87hqv">
                                                            <span class="">2681</span></td>
                                                        <td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-vrwlhx">Jacket</td>
                                                        <td class="MuiTableCell-root MuiTableCell-body MuiTableCell-alignRight MuiTableCell-sizeMedium css-rrus11">
                                                            <span>$ 786.4</span></td>
                                                    </tr>
                                                    <tr class="MuiTableRow-root MuiTableRow-hover css-1mwvjf9">
                                                        <td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-p87hqv">
                                                            <span class="">2756</span></td>
                                                        <td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-vrwlhx">Head
                                                            Phone
                                                        </td>
                                                        <td class="MuiTableCell-root MuiTableCell-body MuiTableCell-alignRight MuiTableCell-sizeMedium css-rrus11">
                                                            <span>$ 563.45</span></td>
                                                    </tr>
                                                    <tr class="MuiTableRow-root MuiTableRow-hover css-1mwvjf9">
                                                        <td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-p87hqv">
                                                            <span class="">8765</span></td>
                                                        <td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-vrwlhx">Sofa</td>
                                                        <td class="MuiTableCell-root MuiTableCell-body MuiTableCell-alignRight MuiTableCell-sizeMedium css-rrus11">
                                                            <span>$ 769.45</span></td>
                                                    </tr>
                                                    <tr class="MuiTableRow-root MuiTableRow-hover css-1mwvjf9">
                                                        <td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-p87hqv">
                                                            <span class="">3652</span></td>
                                                        <td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-vrwlhx">Iphone
                                                            X
                                                        </td>
                                                        <td class="MuiTableCell-root MuiTableCell-body MuiTableCell-alignRight MuiTableCell-sizeMedium css-rrus11">
                                                            <span>$ 754.45</span></td>
                                                    </tr>
                                                    <tr class="MuiTableRow-root MuiTableRow-hover css-1mwvjf9">
                                                        <td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-p87hqv">
                                                            <span class="">7456</span></td>
                                                        <td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-vrwlhx">Jacket</td>
                                                        <td class="MuiTableCell-root MuiTableCell-body MuiTableCell-alignRight MuiTableCell-sizeMedium css-rrus11">
                                                            <span>$ 743.23</span></td>
                                                    </tr>
                                                    <tr class="MuiTableRow-root MuiTableRow-hover css-1mwvjf9">
                                                        <td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-p87hqv">
                                                            <span class="">6502</span></td>
                                                        <td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-vrwlhx">T-Shirt</td>
                                                        <td class="MuiTableCell-root MuiTableCell-body MuiTableCell-alignRight MuiTableCell-sizeMedium css-rrus11">
                                                            <span>$ 642.23</span></td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="simplebar-placeholder" style="width: auto; height: 436px;"></div>
                        </div>
                        <div class="simplebar-track simplebar-horizontal" style="visibility: hidden;">
                            <div class="simplebar-scrollbar" style="width: 0px; display: none;"></div>
                        </div>
                        <div class="simplebar-track simplebar-vertical" style="visibility: visible;">
                            <div class="simplebar-scrollbar"
                                 style="height: 192px; transform: translate3d(0px, 0px, 0px); display: block;"></div>
                        </div>
                    </div>
                </div>
        </div>
    </div>

 */
