import express from 'express';
import cors from 'cors';
import { errorMiddleware } from '@packages/error-handler/error-middleware';
import cookieParser from 'cookie-parser';
import router from './routes/auth.router';
import swaggerUI from 'swagger-ui-express';
const swaggerDocument = require('./swagger.json');
const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 6001;

const app = express();
app.use(cors({
  origin: ['http://localhost:3000'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser())

app.get('/', (req, res) => {
    res.send({ 'message': 'Hello API'});
});

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

app.get('/docs-json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
});

//Routes
app.use("/api",router);

app.use(errorMiddleware);

const server = app.listen(port, () => {
    console.log(`🔐 Auth service is running http://${host}:${port}/`);
    console.log(`🔐 API Docs are available at http://${host}:${port}/docs`);
});

server.on('error', (err) => {
    console.error('Server error:', err);
});

