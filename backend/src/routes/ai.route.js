import express from 'express'
import { chatWithAI,getChatHistory,getChatSession} from '../controllers/ai.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.post('/chat',verifyJWT,chatWithAI)
router.get('/chat-sessions', verifyJWT, getChatHistory);
router.get('/chat-sessions/:sessionId', verifyJWT, getChatSession);

export default router