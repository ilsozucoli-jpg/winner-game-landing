// JWT token generation for game play tracking

function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generateRandomSignature(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(String.fromCharCode(...array));
}

interface GameTokenPayload {
  type: 'game' | 'stage';
  userId: string;
  sponsorId?: string;
  stage?: number;
  iat: number;
  jti: string;
}

function generateJti(): string {
  return crypto.randomUUID();
}

export function generateGameToken(userId: string, sponsorId: string): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  
  const payload: GameTokenPayload = {
    type: 'game',
    userId,
    sponsorId,
    iat: Math.floor(Date.now() / 1000),
    jti: generateJti(),
  };
  
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = generateRandomSignature();
  
  return `${header}.${encodedPayload}.${signature}`;
}

export function generateStageToken(userId: string, stage: number): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  
  const payload: GameTokenPayload = {
    type: 'stage',
    userId,
    stage,
    iat: Math.floor(Date.now() / 1000),
    jti: generateJti(),
  };
  
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = generateRandomSignature();
  
  return `${header}.${encodedPayload}.${signature}`;
}
