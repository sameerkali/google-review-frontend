/** Cryptographically-random index into `chars` - Math.random() isn't
    specified to be unpredictable, and this generates real login passwords
    handed to business owners. */
function randomIndex(max: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % max;
}

export function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 10; i++) pw += chars[randomIndex(chars.length)];
  return pw;
}
