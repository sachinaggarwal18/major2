"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDB = connectToDB;
const mongoose_1 = __importDefault(require("mongoose"));
function connectToDB() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        throw new Error('MONGO_URI is not defined in the environment variables');
    }
    return mongoose_1.default.connect(mongoUri)
        .then(() => {
        console.log('Connected to DB');
        return mongoose_1.default;
    })
        .catch((error) => {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    });
}
exports.default = connectToDB;
