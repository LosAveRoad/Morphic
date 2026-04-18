// src/app.ts
import express, { Application } from 'express';
import cors from 'cors';
import { RecommendController } from './api/controllers/recommend-controller';
import { ContentController } from './api/controllers/content-controller';
import { AuthController } from './api/controllers/auth-controller';
import { SessionManager } from './services/session-manager';
import { AuthService } from './services/auth-service';
import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './api/middleware/error-handler';
import { createRecommendationRoutes } from './api/routes/recommend-options';
import { createContentRoutes } from './api/routes/generate-content';
import { createAuthRoutes } from './api/routes/auth';

class App {
  public app: Application;
  public PORT: number;
  private sessionManager: SessionManager;
  private prisma: PrismaClient;

  constructor(
    recommendController?: RecommendController,
    contentController?: ContentController,
    authController?: AuthController,
    sessionManager?: SessionManager,
    prisma?: PrismaClient
  ) {
    this.app = express();
    this.PORT = parseInt(process.env.PORT || '3000', 10);
    this.sessionManager = sessionManager || new SessionManager();
    this.prisma = prisma || new PrismaClient();

    this.initializeMiddlewares();
    this.initializeRoutes(recommendController, contentController, authController);
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // CORS middleware
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }));

    // Body parser middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware
    this.app.use((req, res, next) => {
      const startTime = Date.now();

      // Log request
      logger.info('Incoming request', {
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
      });

      // Log response
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info('Request completed', {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
        });
      });

      next();
    });

    // Trust proxy (for accurate IP detection behind load balancers)
    this.app.set('trust proxy', true);
  }

  private initializeRoutes(
    recommendController?: RecommendController,
    contentController?: ContentController,
    authController?: AuthController
  ): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        service: 'cognitive-lab-backend',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      });
    });

    // API routes
    // Create auth controller if not provided
    const authService = new AuthService(this.prisma);
    const finalAuthController = authController || new AuthController(authService);
    this.app.use('/api/auth', createAuthRoutes(finalAuthController));
    this.app.use('/api/recommendations', createRecommendationRoutes(recommendController, this.sessionManager));
    this.app.use('/api/content', createContentRoutes(contentController, this.sessionManager));

    // API info endpoint
    this.app.get('/api', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Cognitive Lab Backend API',
        version: '1.0.0',
        endpoints: {
          auth: {
            path: '/api/auth',
            endpoints: {
              register: 'POST /api/auth/register',
              login: 'POST /api/auth/login',
              me: 'GET /api/auth/me',
              logout: 'POST /api/auth/logout',
            },
          },
          recommendations: {
            path: '/api/recommendations',
            method: 'POST',
            description: 'Get AI-powered interaction recommendations',
          },
          content: {
            path: '/api/content/generate',
            method: 'POST',
            description: 'Generate AI content based on selected option or user input',
          },
          health: {
            path: '/health',
            method: 'GET',
            description: 'Health check endpoint',
          },
        },
      });
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Cognitive Lab Backend API',
        version: '1.0.0',
        documentation: '/api',
        health: '/health',
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler - must be after all routes
    this.app.use(notFoundHandler);

    // Global error handler - must be last
    this.app.use(errorHandler);
  }

  public listen(): void {
    this.app.listen(this.PORT, () => {
      logger.info(`Server is running on port ${this.PORT}`, {
        port: this.PORT,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
      });
    });
  }

  public getApp(): Application {
    return this.app;
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const app = new App();
  app.listen();
}

export default App;