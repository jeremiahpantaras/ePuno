import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

// 🛑 THIS MUST BE CALLED BEFORE IMPORTING YOUR ROUTES OR FIREBASE
dotenv.config();

// ✅ NOW you can import the rest of your app
import apiRoutes from './routes';

const app = express()
const PORT = process.env.PORT || 5001

// ==========================================
// 🛠️ CORS: Handle preflight and set headers
// ==========================================
app.use((req: Request, res: Response, next: NextFunction) => {
  res.set('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.set('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    res.status(204).send()
    return
  }

  next()
})

app.use(express.json())

app.use('/api', apiRoutes)

app.get('/', (req: Request, res: Response) => {
  res.send('ePuno Backend is running smoothly!')
})

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`)
})