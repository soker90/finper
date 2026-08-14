import Joi from 'joi'
import Boom from '@hapi/boom'
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server'

const webauthnResponseSchema = Joi.object({
  id: Joi.string().required(),
  rawId: Joi.string().required(),
  response: Joi.object().required(),
  type: Joi.string().required(),
  clientExtensionResults: Joi.object().optional(),
  authenticatorAttachment: Joi.string().allow(null).optional()
}).unknown(true)

export const validateAuthenticationOptionsInput = (input: Record<string, unknown>): { username: string } => {
  const schema = Joi.object({
    username: Joi.string().lowercase().trim().required()
  })

  const { error, value } = schema.validate(input)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}

export const validateRegistrationVerifyInput = (input: Record<string, unknown>): {
  response: RegistrationResponseJSON
  challengeToken: string
  deviceLabel?: string
} => {
  const schema = Joi.object({
    response: webauthnResponseSchema.required(),
    challengeToken: Joi.string().required(),
    deviceLabel: Joi.string().trim().max(60).optional()
  })

  const { error, value } = schema.validate(input)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}

export const validateAuthenticationVerifyInput = (input: Record<string, unknown>): {
  response: AuthenticationResponseJSON
  challengeToken: string
} => {
  const schema = Joi.object({
    response: webauthnResponseSchema.required(),
    challengeToken: Joi.string().required()
  })

  const { error, value } = schema.validate(input)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}
