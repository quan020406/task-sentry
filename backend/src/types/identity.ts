/** 用户身份类型 */
export type IdentityType = 'student' | 'intern' | 'developer' | 'designer' | 'pm' | 'lead'

/** 所有合法身份 */
export const IDENTITY_TYPES: IdentityType[] = [
  'student',
  'intern',
  'developer',
  'designer',
  'pm',
  'lead',
]

/** 身份是否合法 */
export function isValidIdentity(value: string): value is IdentityType {
  return (IDENTITY_TYPES as string[]).includes(value)
}
