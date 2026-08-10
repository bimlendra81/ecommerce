import { useState } from 'react'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_RE = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=#]*)?$/i
const PHONE_RE = /^[+()\-\s\d]{7,20}$/

export const field = {
  required: (label = 'This field') => (value) =>
    value == null || String(value).trim() === '' ? `${label} is required` : null,
  email: (label = 'Email') => (value) => {
    if (value == null || String(value).trim() === '') return null
    return EMAIL_RE.test(String(value).trim())
      ? null
      : `${label} must be a valid email address`
  },
  minLen: (min, label) => (value) => {
    if (value == null || String(value).trim() === '') return null
    return String(value).trim().length >= min
      ? null
      : `${label} must be at least ${min} characters`
  },
  maxLen: (max, label) => (value) => {
    if (value == null || String(value).trim() === '') return null
    return String(value).trim().length <= max
      ? null
      : `${label} must be at most ${max} characters`
  },
  exactLen: (len, label) => (value) => {
    if (value == null || String(value).trim() === '') return `${label} is required`
    return String(value).trim().length === len
      ? null
      : `${label} must be exactly ${len} characters`
  },
  number: (label) => (value) => {
    if (value == null || String(value).trim() === '') return null
    return Number.isFinite(Number(value)) ? null : `${label} must be a number`
  },
  int: (label) => (value) => {
    if (value == null || String(value).trim() === '') return null
    return Number.isInteger(Number(value)) ? null : `${label} must be a whole number`
  },
  min: (min, label) => (value) => {
    if (value == null || String(value).trim() === '') return null
    return Number(value) >= min ? null : `${label} must be at least ${min}`
  },
  max: (max, label) => (value) => {
    if (value == null || String(value).trim() === '') return null
    return Number(value) <= max ? null : `${label} must be at most ${max}`
  },
  matches: (otherName, label) => (value, values) => {
    if (value == null || String(value).trim() === '') return null
    return String(value) === String(values[otherName] ?? '')
      ? null
      : `${label} does not match`
  },
  url: (label) => (value) => {
    if (value == null || String(value).trim() === '') return null
    return URL_RE.test(String(value).trim()) ? null : `${label} must be a valid URL`
  },
  phone: (label) => (value) => {
    if (value == null || String(value).trim() === '') return null
    return PHONE_RE.test(String(value).trim())
      ? null
      : `${label} must be a valid phone number`
  },
}

export function validateFields(rules, values) {
  const fieldErrors = {}
  for (const [fieldName, validators] of Object.entries(rules)) {
    for (const rule of validators || []) {
      const err = rule(values[fieldName], values)
      if (err) {
        fieldErrors[fieldName] = err
        break
      }
    }
  }
  return { fieldErrors, isValid: Object.keys(fieldErrors).length === 0 }
}

export function useFormErrors() {
  const [fieldErrors, setFieldErrors] = useState({})

  function validate(rules, values) {
    const result = validateFields(rules, values)
    setFieldErrors(result.fieldErrors)
    return result.isValid
  }

  function clear(fieldName) {
    setFieldErrors((prev) => {
      if (!(fieldName in prev)) return prev
      const next = { ...prev }
      delete next[fieldName]
      return next
    })
  }

  function reset() {
    setFieldErrors({})
  }

  return { fieldErrors, validate, clear, reset }
}
