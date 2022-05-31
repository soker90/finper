import LinearProgress from '@mui/material/LinearProgress'
import { content } from './styles'

const Loader = () => (
    <div css={content}>
        <LinearProgress color="primary"/>
    </div>
)

export default Loader
