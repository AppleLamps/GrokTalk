import { VercelRequest, VercelResponse } from '@vercel/node';
import cors from 'cors';

const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://grok-talk.vercel.app',
  'https://grok-talk.vercel.app'
];

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:8081', 'http://localhost:3000', 'http://localhost:5173');
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const corsMiddleware = cors(corsOptions);

function runMiddleware(req: VercelRequest, res: VercelResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function applyCors(req: VercelRequest, res: VercelResponse) {
  await runMiddleware(req, res, corsMiddleware);
}
