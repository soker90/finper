import { useForm } from 'react-hook-form'
import {
  Button,
  FormHelperText,
  Grid,
  InputLabel,
  OutlinedInput,
  Stack
} from '@mui/material'

const AccountEdit = () => {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const onSubmit = handleSubmit(data => {
    console.log(data)
  })
  const error = false
  const loading = false
  return (
        <form onSubmit={onSubmit}>
            <Grid container spacing={3}>
                <Grid item md={6} xs={12}>
                    <Stack spacing={1}>
                        <InputLabel htmlFor="name">Nombre</InputLabel>
                        <OutlinedInput
                            id='name'
                            placeholder="Nombre de la cuenta"
                            fullWidth
                            error={!!errors.name}
                            {...register('name', { required: true, minLength: 3 })}
                        />
                        {errors.username && (
                            <FormHelperText error>
                                Introduce un nombre de cuenta válido
                            </FormHelperText>
                        )}
                    </Stack>
                </Grid>

                {error && (
                    <Grid item xs={12}>
                        <FormHelperText error>{error}</FormHelperText>
                    </Grid>
                )}

                <Grid item xs={12} md={12}>
                    <Button
                        disableElevation
                        disabled={loading}
                        fullWidth
                        size="large"
                        type="submit"
                        variant="contained"
                        color="error"
                    >
                        Desactivar
                    </Button>
                    <Button
                        disableElevation
                        disabled={loading}
                        fullWidth
                        size="large"
                        type="submit"
                        variant="contained"
                        color="primary"
                    >
                        Guardar
                    </Button>
                </Grid>
            </Grid>
        </form>
  )
}

export default AccountEdit
