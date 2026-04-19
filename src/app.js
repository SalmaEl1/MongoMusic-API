require('dotenv').config();

const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const albumRoutes = require('./routes/albumRoutes');
const artistRoutes = require('./routes/artistRoutes');
const songRoutes = require('./routes/songRoutes');
const statsRoutes = require('./routes/statsRoutes');
const logger = require('./middlewares/logger');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(express.json());
app.use(logger);
app.use(express.static(path.join(__dirname, '../public')));
app.use('/vendor/bootstrap-icons', express.static(path.join(__dirname, '../node_modules/bootstrap-icons')));

app.get('/health', (req, res) => {
  res.status(200).json({
    error: false,
    message: 'Mongo Music API is running.',
    documentation: '/api-docs'
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.use('/songs', songRoutes);
app.use('/artists', artistRoutes);
app.use('/albums', albumRoutes);
app.use('/stats', statsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
