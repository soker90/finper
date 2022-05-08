import {Mongoose} from "mongoose";

export default async (mongoose: Mongoose, uri: string, options: any) => {
    mongoose.connect(uri, options);

    mongoose.connection.once('connected', () => {
        console.log('[arroyo-erp-models] Mongoose connected');
    });

    mongoose.connection.once('error', (err) => {
        console.log('[arroyo-erp-models] Mongoose error: ', err);
        throw err;
    });

    mongoose.connection.once('disconnected', () => {
        console.log('[arroyo-erp-models] Mongoose disconnected');
    });

    process.once('SIGINT', () => mongoose.connection.close(() => {
        console.error('[arroyo-erp-models] Mongoose disconnected');
        process.exit(0);
    }));
};