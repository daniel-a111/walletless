import { env } from "process";

export const config = {
    // BASE_URL: `${env.HOST}:${env.PORT}`,
    // PORT: env.PORT,
    // HOST: env.HOST,
    // ALGO_ENDPOINT: env.ALGO_ENDPOINT,
    // IMAGE_VALIDATION: env.IMAGE_VALIDATION,
    // TOKEN_SECRET: env.TOKEN_SECRET,
    POSTGRES_URI: env.POSTGRES_URI || 'postgres://postgres:123123123@localhost:5432',
    // AWS_S3_ACCESS_KEY_ID: env.AWS_S3_ACCESS_KEY_ID,
    // AWS_S3_ACCESS_KEY: env.AWS_S3_ACCESS_KEY,
    // AWS_S3_REGION: env.AWS_S3_REGION,
    // AWS_S3_CATALOG_UPLOADS_BUCKET_NAME: env.AWS_S3_CATALOG_UPLOADS_BUCKET_NAME || 'mistrix-catalog-uploads',
    // SESSION_EXPIRATION_HOURS: env.SESSION_EXPIRATION_HOURS,
    // CURRENCY: env.CURRENCY,
    // INTEGRATION: env.INTEGRATION,
    // ENV: env.ENV,
    // MOCK_DATA: !!env.MOCK_DATA || false
}