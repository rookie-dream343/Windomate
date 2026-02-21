// ConversationHistory.js - 对话历史记录管理模块
const { eventBus } = require('../core/event-bus.js');
const { Events } = require('../core/events.js');

/**
 * 对话历史管理器
 * 负责记录和显示用户与AI的对话内容
 */
class ConversationHistory {
    constructor(config) {
        this.config = config;
        this.messages = [];
        this.isVisible = false;

        // 获取配置中的角色名称
        this.userLabel = config.subtitle_labels?.user || '用户';
        this.aiLabel = config.subtitle_labels?.ai || 'Haruro';

        // DOM 元素
        this.container = null;
        this.contentBox = null;
        this.toggleBtn = null;
        this.messagesContainer = null;
        this.clearBtn = null;

        // 初始化
        this.init();
    }

    /**
     * 初始化历史记录模块
     */
    init() {
        // 延迟执行，确保 DOM 已加载
        setTimeout(() => this.setupDOM(), 100);
    }

    /**
     * 设置 DOM 元素和事件监听
     */
    setupDOM() {
        // 获取 DOM 元素
        this.container = document.getElementById('history-container');
        this.contentBox = document.getElementById('history-content');
        this.toggleBtn = document.getElementById('history-toggle-btn');
        this.messagesContainer = document.getElementById('history-messages');
        this.clearBtn = document.getElementById('history-clear-btn');

        console.log('[ConversationHistory] DOM 查找结果:', {
            container: !!this.container,
            contentBox: !!this.contentBox,
            toggleBtn: !!this.toggleBtn,
            messagesContainer: !!this.messagesContainer,
            clearBtn: !!this.clearBtn
        });

        if (!this.container || !this.toggleBtn) {
            console.error('[ConversationHistory] 关键 DOM 元素未找到');
            return;
        }

        // 绑定切换按钮事件
        this.toggleBtn.addEventListener('click', (e) => {
            console.log('[ConversationHistory] 按钮被点击');
            e.preventDefault();
            e.stopPropagation();
            this.toggle();
        });

        // 绑定清空按钮事件
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.clear();
            });
        }

        console.log('[ConversationHistory] 对话历史模块已初始化');
    }

    /**
     * 切换历史记录显示/隐藏
     */
    toggle() {
        console.log('[ConversationHistory] toggle 被调用, 当前状态:', this.isVisible);
        this.isVisible = !this.isVisible;

        if (this.isVisible) {
            this.contentBox.classList.add('visible');
            this.toggleBtn.classList.add('active');
            // 滚动到底部显示最新消息
            this.scrollToBottom();
            console.log('[ConversationHistory] 显示历史记录');
        } else {
            this.contentBox.classList.remove('visible');
            this.toggleBtn.classList.remove('active');
            console.log('[ConversationHistory] 隐藏历史记录');
        }
    }

    /**
     * 显示历史记录
     */
    show() {
        if (!this.isVisible) {
            this.toggle();
        }
    }

    /**
     * 隐藏历史记录
     */
    hide() {
        if (this.isVisible) {
            this.toggle();
        }
    }

    /**
     * 添加用户消息
     * @param {string} content - 消息内容
     */
    addUserMessage(content) {
        this.addMessage('user', content);
    }

    /**
     * 添加 AI 消息
     * @param {string} content - 消息内容
     */
    addAIMessage(content) {
        this.addMessage('ai', content);
    }

    /**
     * 添加系统消息
     * @param {string} content - 消息内容
     */
    addSystemMessage(content) {
        this.addMessage('system', content);
    }

    /**
     * 添加消息到历史记录
     * @param {string} type - 消息类型 ('user', 'ai', 'system')
     * @param {string} content - 消息内容
     */
    addMessage(type, content) {
        const message = {
            type: type,
            content: content,
            timestamp: new Date()
        };

        this.messages.push(message);

        // 渲染消息到 DOM
        this.renderMessage(message);

        // 自动滚动到底部
        this.scrollToBottom();
    }

    /**
     * 渲染单条消息
     * @param {Object} message - 消息对象
     */
    renderMessage(message) {
        if (!this.messagesContainer) return;

        const messageEl = document.createElement('div');
        messageEl.className = `history-message ${message.type}`;

        // 创建发送者信息行
        const senderEl = document.createElement('div');
        senderEl.className = `history-message-sender ${message.type}`;

        // 设置发送者名称
        if (message.type === 'user') {
            senderEl.textContent = this.userLabel;
        } else if (message.type === 'ai') {
            senderEl.textContent = this.aiLabel;
        } else {
            senderEl.textContent = '系统';
        }

        // 创建时间
        const timeEl = document.createElement('span');
        timeEl.className = 'history-message-time';
        timeEl.textContent = this.formatTime(message.timestamp);
        senderEl.appendChild(timeEl);

        // 创建消息内容
        const contentEl = document.createElement('div');
        contentEl.className = 'history-message-content';
        contentEl.textContent = message.content;

        // 组装消息
        messageEl.appendChild(senderEl);
        messageEl.appendChild(contentEl);

        this.messagesContainer.appendChild(messageEl);
    }

    /**
     * 格式化时间
     * @param {Date} date - 日期对象
     * @returns {string} 格式化的时间字符串
     */
    formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    /**
     * 滚动到底部
     */
    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    /**
     * 清空历史记录
     */
    clear() {
        this.messages = [];
        if (this.messagesContainer) {
            this.messagesContainer.innerHTML = '';
        }
        console.log('对话历史已清空');
    }

    /**
     * 获取历史记录数量
     * @returns {number}
     */
    getCount() {
        return this.messages.length;
    }

    /**
     * 获取所有消息
     * @returns {Array}
     */
    getMessages() {
        return [...this.messages];
    }

    /**
     * 导出历史记录为文本
     * @returns {string}
     */
    exportToText() {
        return this.messages.map(msg => {
            const sender = msg.type === 'user' ? this.userLabel :
                         msg.type === 'ai' ? this.aiLabel : '系统';
            const time = this.formatTime(msg.timestamp);
            return `[${time}] ${sender}: ${msg.content}`;
        }).join('\n\n');
    }
}

module.exports = { ConversationHistory };
