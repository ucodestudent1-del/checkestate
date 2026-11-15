declare module "@prisma/client" {
  export class PrismaClient {
    constructor(options?: { log?: string[] });
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $transaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
    [key: string]: any;
  }
  export { PrismaClient as default };
}