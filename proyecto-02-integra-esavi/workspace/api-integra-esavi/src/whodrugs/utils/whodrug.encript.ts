import { EncryptionTransformer } from 'typeorm-encrypted';
import * as dotenv from 'dotenv';
dotenv.config();

// TODO: encapsulate
export const encriptionTransformer = new EncryptionTransformer({
  key: process.env.WHD_TRANSFORM_KEY,
  algorithm: 'aes-256-cbc',
  ivLength: 16,
  iv: process.env.WHD_TRANSFORM_IV,
});
