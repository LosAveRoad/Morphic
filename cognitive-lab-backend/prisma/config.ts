import { PrismaClientTypegen } from "@prisma/client/edge";

const config: PrismaClientTypegen = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};

export default config;