import { Request, Response, NextFunction } from 'express'
import { adminAuth } from '../config/firebaseAdmin'

export interface AuthRequest extends Request {
  user?: {
    uid: string
    email: string
  }
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // Allow OPTIONS requests to pass through for CORS preflight
  if (req.method === 'OPTIONS') {
    return next()
  }

  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split('Bearer ')[1]
    if (!token) return res.status(401).json({ error: 'No token provided' })
    const decodedToken = await adminAuth.verifyIdToken(token)

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
    }

    next()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Auth middleware error:', message)
    return res.status(401).json({ error: 'Invalid token' })
  }
}