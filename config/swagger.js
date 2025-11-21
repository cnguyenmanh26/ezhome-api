const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Ezhome Boosthais API",
      version: "1.0.0",
      description: "API Documentation for Ezhome Boosthais Backend",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "refreshToken",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "User ID",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email",
            },
            name: {
              type: "string",
              description: "User name",
            },
            phone: {
              type: "string",
              description: "User phone number",
            },
            avatar: {
              type: "string",
              description: "User avatar URL",
            },
            role: {
              type: "string",
              enum: ["user", "admin"],
              description: "User role",
              example: "user",
            },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            password: {
              type: "string",
              format: "password",
              example: "password123",
            },
            name: {
              type: "string",
              example: "John Doe",
            },
            phone: {
              type: "string",
              example: "0987654321",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            password: {
              type: "string",
              format: "password",
              example: "password123",
            },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Login successful",
            },
            accessToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            user: {
              $ref: "#/components/schemas/User",
            },
          },
        },
        RegisterResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "User registered successfully",
            },
            user: {
              $ref: "#/components/schemas/User",
            },
          },
        },
        RefreshTokenRequest: {
          type: "object",
          properties: {
            refreshToken: {
              type: "string",
              description: "Refresh token (optional if using cookie)",
            },
          },
        },
        RefreshTokenResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Token refreshed successfully",
            },
            accessToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Error message",
            },
          },
        },
        ProtectedResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "This is a protected route",
            },
            user: {
              type: "object",
              properties: {
                userId: {
                  type: "string",
                },
                email: {
                  type: "string",
                },
              },
            },
          },
        },
        Room: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Room ID",
            },
            title: {
              type: "string",
              example: "Phòng trọ đẹp tại Cầu Giấy",
            },
            description: {
              type: "string",
              example: "Phòng trọ rộng rãi, thoáng mát",
            },
            rentPrice: {
              type: "number",
              example: 3000000,
            },
            area: {
              type: "number",
              example: 25,
            },
            media: {
              type: "object",
              properties: {
                images: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      url: {
                        type: "string",
                      },
                      public_id: {
                        type: "string",
                      },
                    },
                  },
                },
                videos: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      url: {
                        type: "string",
                      },
                      public_id: {
                        type: "string",
                      },
                    },
                  },
                },
                link360: {
                  type: "string",
                },
              },
            },
            address: {
              type: "object",
              properties: {
                city: {
                  type: "string",
                  example: "Hà Nội",
                },
                district: {
                  type: "string",
                  example: "Cầu Giấy",
                },
                street: {
                  type: "string",
                  example: "Dương Quảng Hàm",
                },
              },
            },
            utilities: {
              type: "object",
              properties: {
                furnitureDetails: {
                  type: "string",
                  example: "Đầy đủ nội thất",
                },
                electricityCost: {
                  type: "number",
                  example: 3500,
                },
                waterCost: {
                  type: "number",
                  example: 20000,
                },
                wifiCost: {
                  type: "number",
                  example: 100000,
                },
                parkingCost: {
                  type: "number",
                  example: 0,
                },
              },
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Booking: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Booking ID",
            },
            user: {
              type: "string",
              description: "User ID",
            },
            room: {
              type: "string",
              description: "Room ID",
            },
            totalAmount: {
              type: "number",
              example: 3000000,
            },
            status: {
              type: "string",
              enum: ["pending", "completed", "cancelled"],
              example: "pending",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Authentication",
        description: "Authentication endpoints",
      },
      {
        name: "Protected",
        description: "Protected routes requiring authentication",
      },
      {
        name: "Users",
        description: "User management endpoints",
      },
      {
        name: "Rooms",
        description: "Room management endpoints",
      },
      {
        name: "Bookings",
        description: "Booking management endpoints",
      },
    ],
  },
  apis: ["./routes/*.js", "./controllers/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

const swaggerSetup = (app) => {
  const swaggerOptions = {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Ezhome Boosthais API Documentation",
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: "none",
    },
  };

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, swaggerOptions)
  );

  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
};

module.exports = { swaggerSetup, swaggerSpec };

