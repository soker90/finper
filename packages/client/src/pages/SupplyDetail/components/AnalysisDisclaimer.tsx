import { Typography } from '@mui/material'
import { MainCard } from 'components'

const AnalysisDisclaimer = () => (
  <MainCard
    sx={{ bgcolor: 'info.lighter', border: '1px solid', borderColor: 'info.light' }}
    contentSX={{ p: 3 }}
  >
    <Typography variant='subtitle2' gutterBottom fontWeight='700' color='info.main'>
      Sobre este análisis energético:
    </Typography>
    <Typography variant='body2' color='text.secondary'>
      Este informe no utiliza medias nacionales ni estimaciones genéricas. Hemos procesado cada una de tus
      facturas históricas registradas en <strong>Finper</strong> aplicando rigurosamente los términos de
      potencia, energía e impuestos de cada tarifa del mercado para darte una precisión del 100% sobre tu
      ahorro real.
    </Typography>
  </MainCard>
)

export default AnalysisDisclaimer
