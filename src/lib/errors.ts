const ERROR_MAP: [RegExp, string][] = [
  [/invalid login credentials/i, 'Incorrect email or password.'],
  [/user already registered/i, 'An account with this email already exists.'],
  [/password should be at least/i, 'Password must be at least 8 characters.'],
  [/row.level security/i, "You don't have permission to do that."],
  [/email not confirmed/i, 'Please verify your email before logging in.'],
  [/over_email_send_rate_limit/i, 'Too many attempts. Please wait a minute and try again.'],
  [/rate limit/i, 'Too many attempts. Please wait a moment and try again.'],
  [/weak_password/i, 'Password is too weak. Please use a stronger password.'],
  [/email_address_invalid/i, 'Please enter a valid email address.'],
];

export function mapSupabaseError(error: any): string {
  const msg = typeof error === 'string' ? error : error?.message || error?.error_description || '';
  const code = error?.code || error?.error || '';
  const combined = `${msg} ${code}`;
  for (const [pattern, friendly] of ERROR_MAP) {
    if (pattern.test(combined)) return friendly;
  }
  console.error('Unmapped Supabase error:', JSON.stringify(error));
  return msg || 'Something went wrong. Please try again.';
}
