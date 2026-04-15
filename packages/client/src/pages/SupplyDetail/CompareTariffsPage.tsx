import { useParams, useNavigate } from 'react-router'
import { Alert, Button, Skeleton, Stack } from '@mui/material'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useTariffsComparison } from 'hooks/useTariffsComparison'
import { useSupply } from 'hooks'

import WinnerCard from './components/WinnerCard'
import TariffComparisonTable from './components/TariffComparisonTable'
import TariffPageHeader from './components/TariffPageHeader'
import AnalysisDisclaimer from './components/AnalysisDisclaimer'

const CompareTariffsPage = () => {
  const { supplyId } = useParams<{ supplyId: string }>()
  const navigate = useNavigate()

  const { supply, property } = useSupply(supplyId)
  const { comparison, error, isLoading } = useTariffsComparison(supplyId)

  const winner = comparison?.[0]

  if (error) {
    return (
      <Stack spacing={2} sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Alert severity='error' variant='filled'>
          {error.response?.data?.message || 'Error al obtener la comparativa de tarifas.'}
        </Alert>
        <Button size='small' startIcon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Volver</Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={3}>
      <TariffPageHeader
        propertyName={property ? property.name : ''}
        supply={supply}
        onBack={() => navigate(-1)}
      />

      {isLoading
        ? <Skeleton variant='rectangular' height={160} sx={{ borderRadius: 2 }} />
        : winner && <WinnerCard winner={winner} />}

      <TariffComparisonTable comparison={comparison} isLoading={isLoading} />

      <AnalysisDisclaimer />
    </Stack>
  )
}

export default CompareTariffsPage
