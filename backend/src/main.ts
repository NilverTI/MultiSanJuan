import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? [process.env.FRONTEND_URL]
        : ['http://localhost:3000', 'http://localhost:8000'],
    credentials: true,
  });

  app.use(helmet({
    contentSecurityPolicy: false,
  }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  const config = new DocumentBuilder()
    .setTitle('MULTI SAN JUAN API')
    .setDescription('API del sistema de inventario, ventas y caja')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/swagger', app, document);

  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/docs', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>MULTI SAN JUAN - API Docs</title>
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
          <style>
            :root { color-scheme: light; }
            * { box-sizing: border-box; }
            html, body {
              margin: 0;
              padding: 0;
              min-height: 100%;
              background: #f8fafc !important;
              color: #0f172a !important;
              font-family: 'Inter', 'Montserrat', 'Segoe UI', Arial, sans-serif;
            }
            body, button, input, select, textarea {
              font-family: 'Inter', 'Montserrat', 'Segoe UI', Arial, sans-serif;
            }
            #redoc-container,
            .redoc-wrap {
              min-height: 100vh;
              background: #f8fafc !important;
              color: #0f172a !important;
            }
            .redoc-wrap h1,
            .redoc-wrap h2,
            .redoc-wrap h3,
            .redoc-wrap h4,
            .redoc-wrap h5 {
              letter-spacing: 0;
            }
            .redoc-wrap table,
            .redoc-wrap hr {
              border-color: #e2e8f0 !important;
            }
            .redoc-wrap input[type="text"],
            .redoc-wrap input[type="search"] {
              background: #111c33 !important;
              border-color: #334155 !important;
              color: #f8fafc !important;
            }
            .redoc-wrap input::placeholder {
              color: #cbd5e1 !important;
              opacity: 1;
            }
            .redoc-wrap pre,
            .redoc-wrap textarea,
            .redoc-wrap [class*="codeBlock"],
            .redoc-wrap [class*="CodeBlock"] {
              background: #020617 !important;
              border: 1px solid #1e293b !important;
              color: #e5e7eb !important;
            }
            .redoc-wrap code {
              color: inherit;
              font-family: Consolas, 'SFMono-Regular', 'Roboto Mono', monospace;
            }
            .redoc-wrap [role="tablist"] button,
            .redoc-wrap .react-tabs__tab {
              background: #dbeafe !important;
              border: 1px solid #bfdbfe !important;
              color: #1e3a8a !important;
              font-weight: 700 !important;
            }
            .redoc-wrap [role="tablist"] button[aria-selected="true"],
            .redoc-wrap .react-tabs__tab--selected {
              background: #2563eb !important;
              border-color: #2563eb !important;
              color: #ffffff !important;
            }
            .redoc-wrap [class*="required"],
            .redoc-wrap [title="required"] {
              color: #dc2626 !important;
              font-weight: 700 !important;
            }
            .redoc-json .token.property,
            .redoc-json .token.attr-name {
              color: #bfdbfe !important;
            }
            .redoc-json .token.string,
            .redoc-json .token.number,
            .redoc-json .token.boolean {
              color: #86efac !important;
            }
            .redoc-json .token.punctuation {
              color: #e5e7eb !important;
            }
            @media (max-width: 700px) {
              html, body,
              .redoc-wrap {
                overflow-x: hidden !important;
              }
              .redoc-wrap h1 {
                font-size: 24px !important;
                line-height: 1.2 !important;
                white-space: normal !important;
                overflow-wrap: break-word;
              }
              .redoc-wrap h2 {
                font-size: 22px !important;
                line-height: 1.25 !important;
              }
              .redoc-wrap h3 {
                font-size: 20px !important;
                line-height: 1.3 !important;
              }
              .redoc-wrap a[href*="swagger-json"] {
                display: flex !important;
                align-items: center;
                width: fit-content;
                max-width: 100%;
                min-height: 34px;
                margin-top: 8px;
                padding: 7px 10px !important;
                font-size: 14px !important;
                white-space: normal !important;
              }
              .redoc-wrap pre,
              .redoc-wrap table {
                max-width: calc(100vw - 48px) !important;
                overflow-x: auto !important;
              }
            }
            a[href*="redocly.com"], a[href*="redoc.ly"] { display: none !important; }
            .nilver-badge {
              padding: 12px 15px;
              text-align: center;
              color: #cbd5e1;
              font-size: 13px;
              font-family: 'Inter', 'Montserrat', sans-serif;
              border-top: 1px solid #24324a;
              background: #0f172a;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
            }
            .nilver-badge img {
              height: 16px;
              width: auto;
              vertical-align: middle;
            }
            .nilver-badge a {
              color: #93c5fd;
              font-weight: 700;
              text-decoration: none;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .nilver-badge a:hover {
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div id="redoc-container"></div>
          <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
          <script>
            Redoc.init('/api/swagger-json', {
              theme: {
                colors: {
                  primary: { main: '#2563eb' },
                  success: { main: '#059669' },
                  warning: { main: '#d97706' },
                  error: { main: '#dc2626' },
                  text: { primary: '#0f172a', secondary: '#475569' },
                  border: { dark: '#94a3b8', light: '#e2e8f0' },
                  http: {
                    get: '#059669',
                    post: '#2563eb',
                    put: '#d97706',
                    delete: '#dc2626',
                    patch: '#7c3aed'
                  }
                },
                typography: {
                  fontFamily: "'Inter', 'Montserrat', 'Segoe UI', Arial, sans-serif",
                  fontSize: '15px',
                  lineHeight: '1.6',
                  headings: {
                    fontFamily: "'Inter', 'Montserrat', 'Segoe UI', Arial, sans-serif",
                    fontWeight: '700',
                    lineHeight: '1.25',
                    color: '#0f172a'
                  },
                  links: {
                    color: '#2563eb',
                    visited: '#1d4ed8',
                    hover: '#1e40af'
                  },
                  code: {
                    fontFamily: "Consolas, 'SFMono-Regular', 'Roboto Mono', monospace",
                    fontSize: '13px',
                    backgroundColor: '#e2e8f0',
                    color: '#0f172a'
                  }
                },
                sidebar: {
                  backgroundColor: '#0f172a',
                  textColor: '#dbeafe',
                  activeTextColor: '#93c5fd',
                  width: '300px'
                },
                rightPanel: {
                  backgroundColor: '#06101f',
                  textColor: '#f8fafc',
                  width: '40%'
                },
                codeBlock: {
                  backgroundColor: '#020617'
                },
                schema: {
                  linesColor: '#cbd5e1',
                  nestedBackground: '#f8fafc',
                  typeNameColor: '#2563eb',
                  typeTitleColor: '#0f172a',
                  requireLabelColor: '#dc2626',
                  labelsTextSize: '0.9em'
                }
              }
            }, document.getElementById('redoc-container'), function() {
              setTimeout(function() {
                var badge = document.querySelector('a[href*="redocly.com"], a[href*="redoc.ly"]');
                if (badge && badge.parentElement) {
                  var customBadge = document.createElement('div');
                  customBadge.className = 'nilver-badge';
                  customBadge.innerHTML = 'Hecho por <a href="https://nilverti.de" target="_blank"><img src="https://nilverti.de/img/ico/logo.png" alt="NILVER T.I Logo" /> NILVER T.I</a>';
                  badge.parentElement.appendChild(customBadge);
                }
              }, 500);
            });
          </script>
        </body>
      </html>
    `);
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`Application running on http://localhost:${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
