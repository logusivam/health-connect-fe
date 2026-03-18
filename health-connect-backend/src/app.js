import express from 'express';
import cors from 'cors';
import v1Routes from './routes/v1/index.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Parses incoming JSON requests

// Mount V1 API Routes
app.use('/api/v1', v1Routes);

export default app;