/**
 * Joi validation schemas for all API inputs.
 *
 * Centralising validation in a single module keeps route handlers thin and
 * ensures consistent error messages across the API surface.
 */

import Joi from 'joi';
import { SUPPORTED_TICKERS, MIN_TRADE_QUANTITY, MAX_TRADE_QUANTITY } from '../config/index.js';

/** Login request body. */
const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .trim()
    .lowercase()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
});

/** Trade (buy/sell) request body. */
const tradeSchema = Joi.object({
  ticker: Joi.string()
    .uppercase()
    .valid(...SUPPORTED_TICKERS)
    .required()
    .messages({
      'any.only': `Ticker must be one of: ${SUPPORTED_TICKERS.join(', ')}`,
      'any.required': 'Stock ticker is required',
    }),
  quantity: Joi.number()
    .integer()
    .min(MIN_TRADE_QUANTITY)
    .max(MAX_TRADE_QUANTITY)
    .required()
    .messages({
      'number.min': `Minimum trade quantity is ${MIN_TRADE_QUANTITY}`,
      'number.max': `Maximum trade quantity is ${MAX_TRADE_QUANTITY}`,
      'any.required': 'Quantity is required',
    }),
});

/** Stock subscription via WebSocket. */
const subscriptionSchema = Joi.object({
  ticker: Joi.string()
    .uppercase()
    .valid(...SUPPORTED_TICKERS)
    .required()
    .messages({
      'any.only': `Ticker must be one of: ${SUPPORTED_TICKERS.join(', ')}`,
    }),
});

/**
 * Express middleware factory — validates `req.body` against the given schema.
 *
 * @param {Joi.ObjectSchema} schema
 * @returns {import('express').RequestHandler}
 */
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: messages,
      });
    }

    req.body = value; // Use sanitised values
    next();
  };
}

export { loginSchema, tradeSchema, subscriptionSchema, validate };
