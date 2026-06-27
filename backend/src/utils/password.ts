import bcrypt from 'bcryptjs'

/** 加密轮数（cost factor），10 是推荐值，兼顾安全与性能 */
const SALT_ROUNDS = 10

/**
 * 加密密码
 * @param plainPassword 明文密码
 * @returns 哈希后的密码
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS)
  return bcrypt.hash(plainPassword, salt)
}

/**
 * 验证密码
 * @param plainPassword 明文密码
 * @param hashedPassword 哈希密码
 * @returns 是否匹配
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword)
}
