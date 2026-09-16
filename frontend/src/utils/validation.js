export const validateAmount = (value) => {
  const num = parseFloat(value)
  if (isNaN(num) || num <= 0) {
    return 'Сумма должна быть больше нуля'
  }
  return true
}

export const validateRequired = (value) => {
  if (!value || value.trim() === '') {
    return 'Это поле обязательно'
  }
  return true
}

export const validatePassword = (value) => {
  if (value.length < 8) {
    return 'Пароль должен содержать минимум 8 символов'
  }
  return true
}

export const validateLogin = (value) => {
  if (value.length < 3) {
    return 'Логин должен содержать минимум 3 символа'
  }
  return true
}
