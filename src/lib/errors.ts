const ERROR_MAP: [RegExp, string][] = [
  [/invalid login credentials/i, 'Incorrect email or password.'],
  [/user already registered/i, 'An account with this email already exists.'],
  [/password should be at least/i, 'Password must be at least 8 characters.'],
  [/row.level security/i, "You don't have permission to do that."],
  [/email not confirmed/i, 'Please verify your email before logging in.'],
];

export function mapSupabaseError(error: any): string {
  const msg = typeof error === 'string' ? error : error?.message || '';
  for (const [pattern, friendly] of ERROR_MAP) {
    if (pattern.test(msg)) return friendly;
  }
  return 'Something went wrong. Please try again.';
}
