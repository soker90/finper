import { useState } from 'react'
import { Box, CardContent, Collapse, Divider, Stack, Typography } from '@mui/material'
import { DownOutlined, UpOutlined } from '@ant-design/icons'
import { MainCard } from 'components'
import { TagHistoric } from 'types'
import { format } from 'utils'
import HistoricBarChart from '../HistoricBarChart'
import YearGrid from '../YearGrid'

interface HistoricCollapsibleProps {
  tagName: string
  tagHistoric: TagHistoric
}

const HistoricCollapsible = ({ tagName, tagHistoric }: HistoricCollapsibleProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <MainCard content={false}>
      {/* Cabecera clickable */}
      <Box
        onClick={() => setIsExpanded((prev) => !prev)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          py: 2,
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover': { bgcolor: 'action.hover' },
          transition: 'background-color 0.15s ease'
        }}
      >
        <Stack
          direction='row' spacing={2} sx={{
            alignItems: 'center'
          }}
        >
          <Typography
            variant='subtitle1' sx={{
              fontWeight: 600
            }}
          >Histórico completo
          </Typography>
          <Typography
            variant='body2' sx={{
              color: 'text.secondary'
            }}
          >
            {format.euro(tagHistoric.totalAmount)} acumulados
          </Typography>
        </Stack>
        <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
          {isExpanded ? <UpOutlined /> : <DownOutlined />}
        </Box>
      </Box>
      <Collapse in={isExpanded} timeout='auto' unmountOnExit>
        <Divider />
        <CardContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <HistoricBarChart tagName={tagName} years={tagHistoric.years} height={160} compact />
            <YearGrid tagName={tagName} years={tagHistoric.years} compact />
          </Stack>
        </CardContent>
      </Collapse>
    </MainCard>
  )
}

export default HistoricCollapsible
