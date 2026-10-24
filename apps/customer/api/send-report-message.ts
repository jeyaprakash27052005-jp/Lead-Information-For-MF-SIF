// Vercel serverless function: sends the health check-up report to the customer's WhatsApp / SMS (see ../../../server-lib/sendMessage.ts)
import { messageNodeHandler } from '../../../server-lib/sendMessage';

export default messageNodeHandler;
