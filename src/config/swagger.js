const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const port = process.env.PORT || 5000;

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Mongo Music API',
      version: '1.0.0',
      description: 'REST API for managing songs, artists, albums, and music analytics.'
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Local development server'
      }
    ],
    components: {
      schemas: {
        ArtistInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              example: 'Radiohead'
            },
          }
        },
        Artist: {
          allOf: [
            {
              $ref: '#/components/schemas/ArtistInput'
            },
            {
              type: 'object',
              properties: {
                _id: {
                  type: 'string',
                  example: '67f2cb0cd6371983ba12a111'
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time'
                }
              }
            }
          ]
        },
        AlbumInput: {
          type: 'object',
          required: ['title', 'artist'],
          properties: {
            title: {
              type: 'string',
              example: 'OK Computer'
            },
            releaseDate: {
              type: 'string',
              format: 'date',
              example: '1997-05-21'
            },
            artist: {
              type: 'string',
              example: '67f2cb0cd6371983ba12a111'
            },
          }
        },
        Album: {
          allOf: [
            {
              $ref: '#/components/schemas/AlbumInput'
            },
            {
              type: 'object',
              properties: {
                _id: {
                  type: 'string',
                  example: '67f2cb0cd6371983ba12a222'
                },
                artist: {
                  oneOf: [
                    {
                      type: 'string'
                    },
                    {
                      $ref: '#/components/schemas/Artist'
                    }
                  ]
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time'
                }
              }
            }
          ]
        },
        SongInput: {
          type: 'object',
          required: ['title', 'duration', 'artist', 'album'],
          properties: {
            title: {
              type: 'string',
              example: 'Paranoid Android'
            },
            duration: {
              type: 'number',
              example: 386
            },
            releaseYear: {
              type: 'number',
              example: 1997
            },
            artist: {
              type: 'string',
              example: '67f2cb0cd6371983ba12a111'
            },
            album: {
              type: 'string',
              example: '67f2cb0cd6371983ba12a222'
            }
          }
        },
        Song: {
          allOf: [
            {
              $ref: '#/components/schemas/SongInput'
            },
            {
              type: 'object',
              properties: {
                _id: {
                  type: 'string',
                  example: '67f2cb0cd6371983ba12a333'
                },
                artist: {
                  oneOf: [
                    {
                      type: 'string'
                    },
                    {
                      $ref: '#/components/schemas/Artist'
                    }
                  ]
                },
                album: {
                  oneOf: [
                    {
                      type: 'string'
                    },
                    {
                      $ref: '#/components/schemas/Album'
                    }
                  ]
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time'
                }
              }
            }
          ]
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Descriptive error message'
            },
            status: {
              type: 'number',
              example: 400
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully.'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            total: {
              type: 'number',
              example: 25
            },
            page: {
              type: 'number',
              example: 1
            },
            limit: {
              type: 'number',
              example: 10
            },
            pages: {
              type: 'number',
              example: 3
            }
          }
        },
        SongsPerArtistStat: {
          type: 'object',
          properties: {
            artistId: {
              type: 'string'
            },
            artistName: {
              type: 'string'
            },
            songCount: {
              type: 'number'
            }
          }
        },
        AvgDurationPerAlbumStat: {
          type: 'object',
          properties: {
            albumId: {
              type: 'string'
            },
            albumTitle: {
              type: 'string'
            },
            averageDuration: {
              type: 'number'
            },
            songCount: {
              type: 'number'
            }
          }
        },
      }
    }
  },
  apis: [path.join(__dirname, '../routes/*.js')]
};

module.exports = swaggerJsdoc(options);
