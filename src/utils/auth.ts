import pkg from 'jsonwebtoken';
import * as dotenv from "dotenv";

dotenv.config();

const app_secret : any = process.env.APP_SECRET
const { verify } = pkg;

export interface AuthTokenPayload {  // 1
    userId: number;
}

export function decodeAuthHeader(authHeader: String): AuthTokenPayload { // 2
    const token = authHeader.replace("Bearer ", "");  // 3

    if (!token) {
        throw new Error("No token found");
    }
    return verify(token, app_secret) as AuthTokenPayload;  // 4
}