type AuthErrorLike = {
  code?: string
  status?: number
}

const messages: Record<string, string> = {
  invalid_credentials: '邮箱或密码不正确，请重新检查。',
  email_not_confirmed: '请先打开验证邮件，完成邮箱验证。',
  user_already_exists: '这个邮箱已经注册，可以直接登录。',
  weak_password: '密码强度不足，请使用至少 8 位字符。',
  over_email_send_rate_limit: '邮件发送得有些频繁，请稍后再试。',
  over_request_rate_limit: '尝试次数较多，请稍后再试。',
  same_password: '新密码不能和原密码相同。',
}

export function getAuthErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const { code, status } = error as AuthErrorLike
    if (code && messages[code]) return messages[code]
    if (status === 429) return '操作过于频繁，请稍后再试。'
  }

  return '暂时无法完成操作，请检查网络后重试。'
}
