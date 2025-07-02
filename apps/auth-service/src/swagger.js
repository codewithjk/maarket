
// import swaggerAutogen from "swagger-autogen";
const swaggerAutogen = require("swagger-autogen")();

const doc = {
    info: {
        title: "Auth Service API",
        description: "API documentation for the Auth Service",
        version: "1.0.0",
    },
    host: "localhost:6001",
    schemes: ["http"],
};

const outputFile = "./swagger.json";
const endpointsFiles = ["./routes/auth.router.ts"];

swaggerAutogen(outputFile, endpointsFiles, doc);