const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Luganda Movies API',
            version: '1.0.0',
            description: 'API documentation for Luganda Movies streaming platform - Watch your favorite international movies translated to Luganda by Uganda\'s best VJs',
            contact: {
                name: 'Luganda Movies Support',
                email: 'support@lugandamovies.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development server'
            },
            {
                url: 'https://api.lugandamovies.com',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                VJ: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        name: { type: 'string', example: 'VJ Junior' },
                        slug: { type: 'string', example: 'vj-junior' },
                        bio: { type: 'string', example: 'Top Luganda movie translator' },
                        avatar: { type: 'string', example: 'https://example.com/avatar.jpg' },
                        moviesCount: { type: 'number', example: 150 },
                        rating: { type: 'number', example: 4.5 },
                        specialties: { 
                            type: 'array', 
                            items: { type: 'string' },
                            example: ['Action', 'Comedy']
                        }
                    }
                },
                Movie: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        title: { type: 'string', example: 'Fast & Furious 9' },
                        originalTitle: { type: 'string', example: 'F9: The Fast Saga' },
                        vjName: { type: 'string', example: 'VJ Junior' },
                        vjId: { type: 'string' },
                        poster: { type: 'string', example: 'https://image.tmdb.org/t/p/w500/poster.jpg' },
                        backdrop: { type: 'string' },
                        genre: { 
                            type: 'array', 
                            items: { type: 'string' },
                            example: ['Action', 'Thriller']
                        },
                        year: { type: 'number', example: 2021 },
                        duration: { type: 'number', example: 143 },
                        rating: {
                            type: 'object',
                            properties: {
                                imdb: { type: 'number', example: 5.2 },
                                translationRating: { type: 'number', example: 4.5 }
                            }
                        },
                        video: {
                            type: 'object',
                            properties: {
                                quality: { type: 'string', example: 'HD' },
                                size: { type: 'string', example: '1.2GB' },
                                url: { type: 'string' }
                            }
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'error' },
                        message: { type: 'string', example: 'Error message' }
                    }
                },
                Success: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'success' },
                        message: { type: 'string', example: 'Operation successful' }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Health',
                description: 'Health check and system status endpoints'
            },
            {
                name: 'VJs',
                description: 'VJ (Video Jockey) translator endpoints'
            },
            {
                name: 'Movies',
                description: 'Movie catalog and search endpoints'
            },
            {
                name: 'Watch Progress',
                description: 'User watch progress tracking'
            },
            {
                name: 'Playlist',
                description: 'User playlist management'
            },
            {
                name: 'Authentication',
                description: 'User authentication and authorization'
            },
            {
                name: 'Payments',
                description: 'Payment and subscription endpoints'
            },
            {
                name: 'Cache',
                description: 'Cache management endpoints'
            }
        ]
    },
    apis: [
        './server/routes/*.js',
        './server/server.js'
    ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
