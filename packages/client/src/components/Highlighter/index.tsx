import { useState } from 'react'

import { Box, CardActions, Divider, IconButton, Tooltip } from '@mui/material'

import { CodeOutlined, CopyOutlined } from '@ant-design/icons'

const Highlighter = () => {
  const [highlight, setHighlight] = useState(false)

  return (
        <Box sx={{ position: 'relative' }}>
            <CardActions sx={{ justifyContent: 'flex-end', p: 1, mb: highlight ? 1 : 0 }}>
                <Box sx={{ display: 'flex', position: 'inherit', right: 0, top: 6 }}>
                    <Tooltip title="Copy the source" placement="top-end">
                        <IconButton color="secondary" size="small" sx={{ fontSize: '0.875rem' }}>
                            <CopyOutlined/>
                        </IconButton>
                    </Tooltip>
                    <Divider orientation="vertical" variant="middle" flexItem sx={{ mx: 1 }}/>
                    <Tooltip title="Show the source" placement="top-end">
                        <IconButton
                            sx={{ fontSize: '0.875rem' }}
                            size="small"
                            color={highlight ? 'primary' : 'secondary'}
                            onClick={() => setHighlight(!highlight)}
                        >
                            <CodeOutlined/>
                        </IconButton>
                    </Tooltip>
                </Box>
            </CardActions>
        </Box>
  )
}

export default Highlighter
