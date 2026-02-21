// InputRouter.js - 输入路由
const fs = require('fs');
const path = require('path');
const { eventBus } = require('../../core/event-bus.js');
const { Events } = require('../../core/events.js');

/**
 * 负责路由不同来源的输入（语音/文本/弹幕）
 */
class InputRouter {
    constructor(conversationCore, gameIntegration, memoryManager, contextCompressor, memosClient, config) {
        this.conversationCore = conversationCore;
        this.gameIntegration = gameIntegration;
        this.memoryManager = memoryManager;
        this.contextCompressor = contextCompressor;
        this.memosClient = memosClient;  // 🔥 新增：MemOS 客户端
        this.config = config;

        // UI回调（稍后设置）
        this.showSubtitle = null;
        this.hideSubtitle = null;

        // LLM处理器（稍后设置）
        this.llmHandler = null;

        // BarrageManager引用（用于打断）
        this.barrageManager = null;

        // VoiceChatFacade 引用（用于记忆注入）
        this.voiceChatFacade = null;
    }

    /**
     * 设置 VoiceChatFacade 引用
     */
    setVoiceChatFacade(facade) {
        this.voiceChatFacade = facade;
    }

    /**
     * 设置BarrageManager引用
     */
    setBarrageManager(barrageManager) {
        this.barrageManager = barrageManager;
    }

    /**
     * 设置UI回调
     */
    setUICallbacks(showSubtitle, hideSubtitle) {
        this.showSubtitle = showSubtitle;
        this.hideSubtitle = hideSubtitle;
    }

    /**
     * 设置LLM处理器
     */
    setLLMHandler(handler) {
        this.llmHandler = handler;
    }

    /**
     * 处理语音输入
     */
    async handleVoiceInput(text) {
        // 🔥 用户语音输入时：打断弹幕处理 + 清空弹幕队列
        if (this.barrageManager) {
            this.barrageManager.setInterrupt();
            this.barrageManager.clearNormalQueue();
        }

        // 🔥 添加到对话历史记录
        if (global.conversationHistory) {
            global.conversationHistory.addUserMessage(text);
        }

        // 检查游戏模式
        if (this.gameIntegration.isGameModeActive()) {
            await this.gameIntegration.handleGameInput(text);
        } else {
            // 异步记忆检查，不阻塞对话流程
            if (this.config.memory?.enabled !== false) {
                this.memoryManager.checkAndSaveMemoryAsync(text);
            }


            // 🔥 新增：调用 MemOS 记忆检索并注入
            if (this.voiceChatFacade) {
                await this.voiceChatFacade.injectRelevantMemories(text);
            }


            // 发送到LLM
            await this.llmHandler(text);

            // 🔥 异步上下文压缩，不阻塞对话流程
            if (this.contextCompressor) {
                this.contextCompressor.checkAndCompressAsync().catch(error => {
                    console.error('上下文压缩异常:', error);
                });
            }
        }

        // 保存到记忆库
        this.saveToMemoryLog();
    }

    /**
     * 处理文本输入（来自聊天框）
     */
    async handleTextInput(text) {
        // 🔥 用户文本输入时：打断弹幕处理 + 清空弹幕队列
        if (this.barrageManager) {
            this.barrageManager.setInterrupt();
            this.barrageManager.clearNormalQueue();
        }

        // 显示用户消息
        this.addChatMessage('user', text);

        // 🔥 添加到对话历史记录
        if (global.conversationHistory) {
            global.conversationHistory.addUserMessage(text);
        }

        // 🔥 新增：调用 MemOS 记忆检索并注入
        if (this.voiceChatFacade) {
            await this.voiceChatFacade.injectRelevantMemories(text);
        }

        // 发送到LLM
        await this.llmHandler(text);

        // 触发用户消息已接收事件（用于心情系统）
        eventBus.emit(Events.USER_MESSAGE_RECEIVED);

        // 🔥 异步上下文压缩，不阻塞对话流程
        if (this.contextCompressor) {
            this.contextCompressor.checkAndCompressAsync().catch(error => {
                console.error('上下文压缩异常:', error);
            });
        }
    }

    /**
     * 处理弹幕输入
     */
    async handleBarrageInput(nickname, text) {
        // 弹幕处理逻辑通过BarrageManager完成
        // 这里只是一个占位方法，实际使用中通过handleBarrageMessage调用
    }

    /**
     * 添加聊天消息到界面
     */
    addChatMessage(role, content) {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            const messageElement = document.createElement('div');
            messageElement.innerHTML = `<strong>${role === 'user' ? '你' : 'Fake Neuro'}:</strong> ${content}`;
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    /**
     * 保存到记忆库
     */
    saveToMemoryLog() {
        const messages = this.conversationCore.getMessages();
        const lastUserMsg = messages.filter(m => m.role === 'user').pop();
        const lastAIMsg = messages.filter(m => m.role === 'assistant').pop();

        if (lastUserMsg && lastAIMsg) {
            const newContent = `【用户】: ${lastUserMsg.content}\n【Fake Neuro】: ${lastAIMsg.content}\n`;

            try {
                fs.appendFileSync(
                    path.join(__dirname, '..', '..', '..', 'AI记录室', '记忆库.txt'),
                    newContent,
                    'utf8'
                );
            } catch (error) {
                console.error('保存记忆库失败:', error);
            }
        }
    }
}

module.exports = { InputRouter };
