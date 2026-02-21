// ui-controller.js - UI控制模块
const { ipcRenderer } = require('electron');
const { logToTerminal } = require('../api-utils.js');

class UIController {
    constructor(config) {
        this.config = config;
        this.subtitleTimeout = null;
        this.bubbleVisible = false;  // 气泡框显示状态
        this.bubbleUpdateInterval = null;  // 气泡框位置更新定时器

        // 气泡框位置平滑处理
        this.bubbleCurrentX = 0;
        this.bubbleCurrentY = 0;
        this.bubbleTargetX = 0;
        this.bubbleTargetY = 0;
    }

    // 初始化UI控制
    initialize() {
        this.setupMouseIgnore();
        this.setupChatBoxEvents();
    }

    // 设置鼠标穿透
    setupMouseIgnore() {
        const updateMouseIgnore = () => {
            if (!global.currentModel) return;

            const shouldIgnore = !global.currentModel.containsPoint(
                global.pixiApp.renderer.plugins.interaction.mouse.global
            );
            ipcRenderer.send('set-ignore-mouse-events', {
                ignore: shouldIgnore,
                options: { forward: true }
            });
        };

        document.addEventListener('mousemove', updateMouseIgnore);
    }

    // 设置聊天框事件
    setupChatBoxEvents() {
        const chatInput = document.getElementById('chat-input');
        const textChatContainer = document.getElementById('text-chat-container');
        const submitBtn = document.getElementById('chat-send-btn');
        const historyContainer = document.getElementById('history-container');

        if (!chatInput || !textChatContainer || !submitBtn) return;

        // 聊天框事件
        textChatContainer.addEventListener('mouseenter', () => {
            ipcRenderer.send('set-ignore-mouse-events', {
                ignore: false,
                options: { forward: false }
            });
        });

        textChatContainer.addEventListener('mouseleave', () => {
            ipcRenderer.send('set-ignore-mouse-events', {
                ignore: true,
                options: { forward: true }
            });
        });

        chatInput.addEventListener('focus', () => {
            ipcRenderer.send('set-ignore-mouse-events', {
                ignore: false,
                options: { forward: false }
            });
        });

        chatInput.addEventListener('blur', () => {
            ipcRenderer.send('set-ignore-mouse-events', {
                ignore: true,
                options: { forward: true }
            });
        });

        // 🔥 历史记录容器事件（与聊天框同样的逻辑）
        if (historyContainer) {
            historyContainer.addEventListener('mouseenter', () => {
                ipcRenderer.send('set-ignore-mouse-events', {
                    ignore: false,
                    options: { forward: false }
                });
            });

            historyContainer.addEventListener('mouseleave', () => {
                ipcRenderer.send('set-ignore-mouse-events', {
                    ignore: true,
                    options: { forward: true }
                });
            });
        }
    }

    // 显示字幕
    showSubtitle(text, duration = null) {
        // 检查字幕是否启用
        if (this.config && this.config.subtitle_labels && this.config.subtitle_labels.enabled === false) {
            return;
        }

        const container = document.getElementById('subtitle-container');
        const subtitleText = document.getElementById('subtitle-text');

        if (!container || !subtitleText) return;

        // 清除之前的定时器
        if (this.subtitleTimeout) {
            clearTimeout(this.subtitleTimeout);
            this.subtitleTimeout = null;
        }

        subtitleText.textContent = text;
        container.style.display = 'block';
        container.scrollTop = container.scrollHeight;

        // 如果指定了持续时间，设置自动隐藏
        if (duration) {
            this.subtitleTimeout = setTimeout(() => {
                this.hideSubtitle();
            }, duration);
        }
    }

    // 隐藏字幕
    hideSubtitle() {
        const container = document.getElementById('subtitle-container');
        if (container) {
            container.style.display = 'none';
        }

        if (this.subtitleTimeout) {
            clearTimeout(this.subtitleTimeout);
            this.subtitleTimeout = null;
        }
    }

    // 更新气泡框位置，使其跟随模型
    updateBubblePosition() {
        const bubbleContainer = document.getElementById('bubble-container');
        if (!bubbleContainer || !this.bubbleVisible) return;

        if (!global.currentModel) return;

        const model = global.currentModel;
        const canvas = global.pixiApp.view;

        // 获取模型的边界框
        const bounds = model.getBounds();
        const modelX = bounds.x + bounds.width / 2;
        const modelY = bounds.y;

        // 将模型坐标转换为屏幕坐标
        const screenX = modelX * canvas.width / global.pixiApp.screen.width;
        const screenY = modelY * canvas.height / global.pixiApp.screen.height;

        // 平滑移动
        this.bubbleTargetX = screenX;
        this.bubbleTargetY = screenY - 100;

        this.bubbleCurrentX += (this.bubbleTargetX - this.bubbleCurrentX) * 0.1;
        this.bubbleCurrentY += (this.bubbleTargetY - this.bubbleCurrentY) * 0.1;

        bubbleContainer.style.left = this.bubbleCurrentX + 'px';
        bubbleContainer.style.top = this.bubbleCurrentY + 'px';
    }

    // 开始气泡框更新循环
    startBubbleUpdateLoop() {
        if (this.bubbleUpdateInterval) {
            clearInterval(this.bubbleUpdateInterval);
        }

        this.bubbleUpdateInterval = setInterval(() => {
            this.updateBubblePosition();
        }, 16);
    }

    // 停止气泡框更新循环
    stopBubbleUpdateLoop() {
        if (this.bubbleUpdateInterval) {
            clearInterval(this.bubbleUpdateInterval);
            this.bubbleUpdateInterval = null;
        }
    }

    // 显示气泡框
    showBubble() {
        const bubbleContainer = document.getElementById('bubble-container');
        if (bubbleContainer) {
            bubbleContainer.style.display = 'block';
            this.bubbleVisible = true;

            // 初始化位置
            if (!this.bubbleUpdateInterval) {
                const model = global.currentModel;
                const canvas = global.pixiApp.view;

                if (model && canvas) {
                    const bounds = model.getBounds();
                    this.bubbleCurrentX = (bounds.x + bounds.width / 2) * canvas.width / global.pixiApp.screen.width;
                    this.bubbleCurrentY = bounds.y * canvas.height / global.pixiApp.screen.height - 100;
                }

                this.startBubbleUpdateLoop();
            }
        }
    }

    // 隐藏气泡框
    hideBubble() {
        const bubbleContainer = document.getElementById('bubble-container');
        if (bubbleContainer) {
            bubbleContainer.style.display = 'none';
            this.bubbleVisible = false;
            this.stopBubbleUpdateLoop();
        }
    }

    // 切换气泡框
    toggleBubble() {
        if (this.bubbleVisible) {
            this.hideBubble();
        } else {
            this.showBubble();
        }
    }

    // 显示工具气泡
    showToolBubble(toolName, parameters) {
        const bubblesContainer = document.getElementById('tool-bubbles-container');
        if (!bubblesContainer) return;

        // 创建新的气泡元素
        const bubble = document.createElement('div');
        bubble.className = 'tool-bubble';

        // 格式化参数
        let paramsText = '';
        if (parameters && typeof parameters === 'object') {
            try {
                const paramsObj = JSON.parse(parameters);
                paramsText = Object.values(paramsObj).join(', ');
            } catch (e) {
                paramsText = parameters;
            }
        } else if (parameters) {
            paramsText = parameters;
        }

        bubble.textContent = `AI调用了：${toolName} 工具 输入参数：${paramsText}`;
        bubblesContainer.appendChild(bubble);

        // 自动移除
        setTimeout(() => {
            bubble.classList.add('removing');
            setTimeout(() => {
                if (bubble.parentNode) {
                    bubble.parentNode.removeChild(bubble);
                }
            }, 600);
        }, 5000);
    }

    // 显示歌词气泡
    showLyricsBubble(text) {
        const lyricsContainer = document.getElementById('lyrics-bubble-container');
        const lyricsText = document.getElementById('lyrics-bubble-text');

        if (!lyricsContainer || !lyricsText) return;

        lyricsText.textContent = text;
        lyricsContainer.style.display = 'block';
        this.updateBubblePosition(); // 确保歌词气泡跟随模型

        // 5秒后自动隐藏
        setTimeout(() => {
            this.hideLyricsBubble();
        }, 5000);
    }

    // 隐藏歌词气泡
    hideLyricsBubble() {
        const lyricsContainer = document.getElementById('lyrics-bubble-container');
        if (lyricsContainer) {
            lyricsContainer.style.display = 'none';
        }
    }

    // 更新聊天框样式
    updateChatBoxStyle(styleName, styleNumber) {
        const chatContainer = document.getElementById('text-chat-container');
        if (chatContainer) {
            chatContainer.setAttribute('data-style', styleNumber);
            console.log(`聊天框样式: ${styleName} (样式${styleNumber})`);
            logToTerminal('info', `聊天框样式: ${styleName} (样式${styleNumber})`);
        }
    }
}

module.exports = { UIController };
