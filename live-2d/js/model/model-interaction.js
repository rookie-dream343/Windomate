const { ipcRenderer } = require('electron');

// 模型交互控制器类
class ModelInteractionController {
    constructor() {
        this.model = null;
        this.app = null;
        this.interactionWidth = 0;
        this.interactionHeight = 0;
        this.interactionX = 0;
        this.interactionY = 0;
        this.isDragging = false;
        this.isDraggingChat = false;
        this.isDraggingHistory = false;  // 新增：对话历史面板拖动状态
        this.dragOffset = { x: 0, y: 0 };
        this.chatDragOffset = { x: 0, y: 0 };
        this.historyDragOffset = { x: 0, y: 0 };  // 新增：对话历史面板拖动偏移
        this.config = null;
    }

    // 初始化模型和应用
    init(model, app, config = null) {
        this.model = model;
        this.app = app;
        this.config = config;
        this.updateInteractionArea();
        this.setupInteractivity();
    }

    // 更新交互区域大小和位置
    updateInteractionArea() {
        if (!this.model) return;
        
        this.interactionWidth = this.model.width / 3;
        this.interactionHeight = this.model.height * 0.7;
        this.interactionX = this.model.x + (this.model.width - this.interactionWidth) / 2;
        this.interactionY = this.model.y + (this.model.height - this.interactionHeight) / 2;
    }

    // 设置交互性
    setupInteractivity() {
        if (!this.model) return;
        
        this.model.interactive = true;

        // 覆盖原始的containsPoint方法，自定义交互区域
        const originalContainsPoint = this.model.containsPoint;
        this.model.containsPoint = (point) => {
            
            const isOverModel = (
                currentModel && // 确保模型已加载
                point.x >= this.interactionX &&
                point.x <= this.interactionX + this.interactionWidth &&
                point.y >= this.interactionY &&
                point.y <= this.interactionY + this.interactionHeight
            );

            // 检查是否在交互区域内（聊天框、对话历史面板等）
            const pixiView = this.app.renderer.view;
            const canvasRect = pixiView.getBoundingClientRect();

            // 检查聊天框
            const chatContainer = document.getElementById('text-chat-container');
            let isOverInteractiveArea = false;

            if (chatContainer) {
                const chatRect = chatContainer.getBoundingClientRect();
                const chatLeftInPixi = (chatRect.left - canvasRect.left) * (pixiView.width / canvasRect.width);
                const chatRightInPixi = (chatRect.right - canvasRect.left) * (pixiView.width / canvasRect.width);
                const chatTopInPixi = (chatRect.top - canvasRect.top) * (pixiView.height / canvasRect.height);
                const chatBottomInPixi = (chatRect.bottom - canvasRect.top) * (pixiView.height / canvasRect.height);

                isOverInteractiveArea = (
                    point.x >= chatLeftInPixi &&
                    point.x <= chatRightInPixi &&
                    point.y >= chatTopInPixi &&
                    point.y <= chatBottomInPixi
                );
            }

            // 检查对话历史面板
            if (!isOverInteractiveArea) {
                const historyPanel = document.getElementById('chat-history-panel');
                if (historyPanel && historyPanel.style.display !== 'none') {
                    const panelRect = historyPanel.getBoundingClientRect();
                    const panelLeftInPixi = (panelRect.left - canvasRect.left) * (pixiView.width / canvasRect.width);
                    const panelRightInPixi = (panelRect.right - canvasRect.left) * (pixiView.width / canvasRect.width);
                    const panelTopInPixi = (panelRect.top - canvasRect.top) * (pixiView.height / canvasRect.height);
                    const panelBottomInPixi = (panelRect.bottom - canvasRect.top) * (pixiView.height / canvasRect.height);

                    isOverInteractiveArea = (
                        point.x >= panelLeftInPixi &&
                        point.x <= panelRightInPixi &&
                        point.y >= panelTopInPixi &&
                        point.y <= panelBottomInPixi
                    );
                }
            }

            // 检查对话历史按钮
            if (!isOverInteractiveArea) {
                const historyBtn = document.getElementById('chat-history-toggle');
                if (historyBtn) {
                    const btnRect = historyBtn.getBoundingClientRect();
                    const btnLeftInPixi = (btnRect.left - canvasRect.left) * (pixiView.width / canvasRect.width);
                    const btnRightInPixi = (btnRect.right - canvasRect.left) * (pixiView.width / canvasRect.width);
                    const btnTopInPixi = (btnRect.top - canvasRect.top) * (pixiView.height / canvasRect.height);
                    const btnBottomInPixi = (btnRect.bottom - canvasRect.top) * (pixiView.height / canvasRect.height);

                    isOverInteractiveArea = (
                        point.x >= btnLeftInPixi &&
                        point.x <= btnRightInPixi &&
                        point.y >= btnTopInPixi &&
                        point.y <= btnBottomInPixi
                    );
                }
            }

            return isOverModel || isOverInteractiveArea;
        };
        

        // 鼠标按下事件
        this.model.on('mousedown', (e) => {
            const point = e.data.global;
            if (this.model.containsPoint(point)) {
                this.isDragging = true;
                this.dragOffset.x = point.x - this.model.x;
                this.dragOffset.y = point.y - this.model.y;
                ipcRenderer.send('set-ignore-mouse-events', {
                    ignore: false
                });
            }
            
        });

        // 鼠标移动事件
        this.model.on('mousemove', (e) => {
            if (this.isDragging) {
                const newX = e.data.global.x - this.dragOffset.x;
                const newY = e.data.global.y - this.dragOffset.y;
                this.model.position.set(newX, newY);
                this.updateInteractionArea();
            }
        });

        // 全局鼠标释放事件
        window.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                // 保存模型位置
                this.saveModelPosition();
                setTimeout(() => {
                    if (!this.model.containsPoint(this.app.renderer.plugins.interaction.mouse.global)) {
                        ipcRenderer.send('set-ignore-mouse-events', {
                            ignore: true,
                            options: { forward: true }
                        });
                    }
                }, 100);
            }
        });

        const chatContainer = document.getElementById('text-chat-container');

        // 鼠标按下时开始拖动
        chatContainer.addEventListener('mousedown', (e) => {
            // 仅当点击聊天框背景或消息区域时触发拖动（避免误触输入框和按钮）
            if (e.target === chatContainer || e.target.id === 'chat-messages') {
                this.isDraggingChat = true;
                this.chatDragOffset.x = e.clientX - chatContainer.getBoundingClientRect().left;
                this.chatDragOffset.y = e.clientY - chatContainer.getBoundingClientRect().top;
                e.preventDefault(); // 防止文本选中
                ipcRenderer.send('set-ignore-mouse-events', {
                    ignore: false
                });
                
            }
        });

        // 鼠标移动时更新位置
        document.addEventListener('mousemove', (e) => {
            // 拖动聊天框
            if (this.isDraggingChat) {
                chatContainer.style.left = `${e.clientX - this.chatDragOffset.x}px`;
                chatContainer.style.top = `${e.clientY - this.chatDragOffset.y}px`;
            }

            // 拖动对话历史面板
            if (this.isDraggingHistory) {
                const historyPanel = document.getElementById('chat-history-panel');
                if (historyPanel) {
                    historyPanel.style.left = `${e.clientX - this.historyDragOffset.x}px`;
                    historyPanel.style.top = `${e.clientY - this.historyDragOffset.y}px`;
                    // 移除 bottom/right 定位，改用 left/top 绝对定位
                    historyPanel.style.bottom = 'auto';
                    historyPanel.style.right = 'auto';
                }
            }
        });

        // 鼠标释放时停止拖动
        document.addEventListener('mouseup', () => {
            // this.isDraggingChat = false;
            if (this.isDraggingChat) {
                this.isDraggingChat = false;
                setTimeout(() => {
                    if (!this.model.containsPoint(this.app.renderer.plugins.interaction.mouse.global)) {
                        ipcRenderer.send('set-ignore-mouse-events', {
                            ignore: true,
                            options: { forward: true }
                        });
                    }
                }, 100);
            }
        });

        // ========== 对话历史面板拖动功能 ==========
        const historyPanel = document.getElementById('chat-history-panel');

        if (historyPanel) {
            // 鼠标按下时开始拖动历史面板
            historyPanel.addEventListener('mousedown', (e) => {
                // 仅当点击面板头部区域时触发拖动
                if (e.target.closest('.chat-header')) {
                    this.isDraggingHistory = true;
                    const rect = historyPanel.getBoundingClientRect();
                    this.historyDragOffset.x = e.clientX - rect.left;
                    this.historyDragOffset.y = e.clientY - rect.top;
                    e.preventDefault();
                    ipcRenderer.send('set-ignore-mouse-events', {
                        ignore: false
                    });
                }
            });

            // 鼠标释放时停止拖动历史面板
            const stopHistoryDrag = () => {
                if (this.isDraggingHistory) {
                    this.isDraggingHistory = false;
                    setTimeout(() => {
                        if (!this.model.containsPoint(this.app.renderer.plugins.interaction.mouse.global)) {
                            ipcRenderer.send('set-ignore-mouse-events', {
                                ignore: true,
                                options: { forward: true }
                            });
                        }
                    }, 100);
                }
            };

            document.addEventListener('mouseup', stopHistoryDrag);
        }

// 拖动结束时，再次检查穿透状态
// window.addEventListener('mouseup', () => {
//     if (this.isDraggingChat) {
//         this.isDraggingChat = false;
//         this.updateMouseIgnore(); // 确保拖动结束后状态正确
//     }
// });

// 鼠标离开事件
// document.addEventListener('mouseout', () => {
//     if (!this.isDraggingChat) {
//         ipcRenderer.send('set-ignore-mouse-events', {
//             ignore: true,
//             options: { forward: true }
//         });
//     }
// });

        // 鼠标悬停事件
        this.model.on('mouseover', () => {
            if (this.model.containsPoint(this.app.renderer.plugins.interaction.mouse.global)) {
                ipcRenderer.send('set-ignore-mouse-events', {
                    ignore: false
                });
            }
        });

        // 鼠标离开事件
        this.model.on('mouseout', () => {
            if (!this.isDragging) {
                ipcRenderer.send('set-ignore-mouse-events', {
                    ignore: true,
                    options: { forward: true }
                });
            }
        });

        // 鼠标点击事件
        this.model.on('click', () => {
            if (this.model.containsPoint(this.app.renderer.plugins.interaction.mouse.global) && this.model.internalModel) {
                this.model.motion("Tap");
                this.model.expression();
            }
        });

        // 鼠标滚轮事件（缩放功能）
        window.addEventListener('wheel', (e) => {
            if (this.model.containsPoint(this.app.renderer.plugins.interaction.mouse.global)) {
                e.preventDefault();

                const scaleChange = e.deltaY > 0 ? 0.9 : 1.1;
                const currentScale = this.model.scale.x;
                const newScale = currentScale * scaleChange;

                const minScale = this.model.scale.x * 0.3;
                const maxScale = this.model.scale.x * 3.0;

                if (newScale >= minScale && newScale <= maxScale) {
                    this.model.scale.set(newScale);

                    const oldWidth = this.model.width / scaleChange;
                    const oldHeight = this.model.height / scaleChange;
                    const deltaWidth = this.model.width - oldWidth;
                    const deltaHeight = this.model.height - oldHeight;

                    this.model.x -= deltaWidth / 2;
                    this.model.y -= deltaHeight / 2;
                    this.updateInteractionArea();
                }
            }
        }, { passive: false });

        // 窗口大小改变事件
        window.addEventListener('resize', () => {
            if (this.app && this.app.renderer) {
                this.app.renderer.resize(window.innerWidth * 2, window.innerHeight * 2);
                this.app.stage.position.set(window.innerWidth / 2, window.innerHeight / 2);
                this.app.stage.pivot.set(window.innerWidth / 2, window.innerHeight / 2);
                this.updateInteractionArea();
            }
        });

        // 禁用右键菜单，防止右键点击导致意外行为
        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });

        // 在模型上也禁用右键菜单
        this.model.on('rightdown', (e) => {
            e.stopPropagation();
        });

        // ========== 文件拖拽功能 ==========
        this.setupFileDrop();
    }

    // 设置文件拖拽
    setupFileDrop() {
        // 阻止默认拖拽行为
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.body.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        // 拖拽进入时的视觉反馈
        document.addEventListener('dragenter', (e) => {
            if (this.isFileDrag(e)) {
                this.showDragHighlight(true);
            }
        });

        // 拖拽离开时移除视觉反馈
        document.addEventListener('dragleave', (e) => {
            if (e.clientX === 0 && e.clientY === 0) {
                this.showDragHighlight(false);
            }
        });

        // 拖拽结束时移除视觉反馈
        document.addEventListener('dragend', (e) => {
            this.showDragHighlight(false);
        });

        // 拖拽释放时处理文件
        document.addEventListener('drop', (e) => {
            this.showDragHighlight(false);

            // 调试信息显示到对话历史
            const debugMsg = (msg) => {
                console.log(msg);
                if (typeof window.addAIMessage === 'function') {
                    window.addAIMessage(`[DEBUG] ${msg}`);
                }
            };

            debugMsg('drop 事件触发');

            const files = e.dataTransfer?.files;
            if (!files || files.length === 0) {
                debugMsg('没有文件');
                return;
            }

            debugMsg(`文件: ${files[0].name}, 类型: ${files[0].type}`);

            this.handleDroppedFiles(files);
        });
    }

    // 检查是否是文件拖拽
    isFileDrag(e) {
        return e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files');
    }

    // 显示/隐藏拖拽高亮效果
    showDragHighlight(show) {
        if (!global.pixiApp || !global.pixiApp.view) return;

        if (show) {
            global.pixiApp.view.style.filter = 'brightness(1.2) drop-shadow(0 0 20px rgba(102, 126, 234, 0.8))';
            global.pixiApp.view.style.cursor = 'copy';
        } else {
            global.pixiApp.view.style.filter = '';
            global.pixiApp.view.style.cursor = '';
        }
    }

    // 处理拖放的文件
    async handleDroppedFiles(files) {
        const file = files[0];  // 只处理第一个文件

        const debugMsg = (msg) => {
            console.log(msg);
            if (typeof window.addAIMessage === 'function') {
                window.addAIMessage(`[DEBUG] ${msg}`);
            }
        };

        debugMsg(`开始处理文件: ${file.name}`);

        // 读取文件内容
        const reader = new FileReader();

        reader.onload = async (e) => {
            debugMsg('文件读取完成');
            const content = e.target.result;

            if (this.isImageFile(file)) {
                debugMsg('识别为图片文件');
                // 图片文件 - 发送给AI点评
                await this.handleImageDrop(file, content);
            } else if (this.isTextFile(file)) {
                debugMsg('识别为文本文件');
                // 文本文件 - 发送给AI总结
                await this.handleTextDrop(file, content);
            } else {
                debugMsg(`不支持的文件类型: ${file.type}`);
                // 其他文件类型
                this.showUnsupportedMessage(file);
            }
        };

        reader.onerror = () => {
            debugMsg('文件读取失败!');
        };

        if (this.isImageFile(file)) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    }

    // 判断是否是图片文件
    isImageFile(file) {
        return file.type.startsWith('image/');
    }

    // 判断是否是文本文件
    isTextFile(file) {
        const textTypes = ['text/plain', 'text/html', 'text/css', 'text/javascript',
                           'application/json', 'application/xml', 'text/markdown',
                           'text/csv', 'text/x-python-script'];
        return textTypes.includes(file.type) ||
               file.name.endsWith('.txt') ||
               file.name.endsWith('.md') ||
               file.name.endsWith('.json') ||
               file.name.endsWith('.js') ||
               file.name.endsWith('.py') ||
               file.name.endsWith('.css') ||
               file.name.endsWith('.html');
    }

    // 处理图片拖放 - AI点评
    async handleImageDrop(file, base64Content) {
        console.log('📸 检测到图片文件:', file.name);
        console.log('📸 global.voiceChat 存在:', !!global.voiceChat);
        console.log('📸 global.voiceChat.sendToLLM 存在:', !!(global.voiceChat && global.voiceChat.sendToLLM));

        // 提取base64数据（去掉data:image/xxx;base64,前缀）
        const base64Data = base64Content.split(',')[1];
        console.log('📸 base64Data 长度:', base64Data ? base64Data.length : 0);

        // 构建消息
        const prompt = `这是我拖给你的图片，请点评一下这张图片。`;

        // 添加用户消息到对话历史
        if (typeof window.addUserMessage === 'function') {
            window.addUserMessage(`[发送图片: ${file.name}]`);
        }

        // 显示提示
        if (global.showBubble) {
            global.showBubble();
        }

        try {
            // 调用 LLMHandler 的 sendToLLM，传入截图数据
            if (global.voiceChat && global.voiceChat.sendToLLM) {
                console.log('📸 开始调用 sendToLLM...');

                // 设置截图数据
                global.voiceChat.pendingScreenshot = {
                    base64: base64Data,
                    filename: file.name
                };
                console.log('📸 pendingScreenshot 已设置');

                // 发送给LLM处理
                await global.voiceChat.sendToLLM(prompt);
                console.log('📸 sendToLLM 调用完成');

                // 清除截图数据
                global.voiceChat.pendingScreenshot = null;
            } else {
                console.error('📸 global.voiceChat 或 sendToLLM 不存在!');
                if (typeof window.addAIMessage === 'function') {
                    window.addAIMessage('（系统未准备好，请稍后再试）');
                }
            }
        } catch (error) {
            console.error('📸 处理图片失败:', error);
            if (typeof window.addAIMessage === 'function') {
                window.addAIMessage(`（处理图片出错: ${error.message}）`);
            }
        }
    }

    // 处理文本文件拖放 - AI总结
    async handleTextDrop(file, textContent) {
        console.log('📄 检测到文本文件:', file.name);
        console.log('📄 文件内容长度:', textContent.length);
        console.log('📄 global.voiceChat 存在:', !!global.voiceChat);
        console.log('📄 global.voiceChat.sendToLLM 存在:', !!(global.voiceChat && global.voiceChat.sendToLLM));

        // 添加用户消息到对话历史
        if (typeof window.addUserMessage === 'function') {
            window.addUserMessage(`[发送文件: ${file.name}，请总结]`);
        }

        // 限制内容长度（避免token过多）
        const maxLength = 10000;
        let truncatedContent = textContent;
        if (textContent.length > maxLength) {
            truncatedContent = textContent.substring(0, maxLength) + '\n...（内容已截断）';
        }

        // 显示提示
        if (typeof window.addAIMessage === 'function') {
            window.addAIMessage(`（收到文件 ${file.name}，正在总结...）`);
        }

        const prompt = `这是我拖给你的文本文件"${file.name}"，请帮我总结一下主要内容：\n\n${truncatedContent}`;

        try {
            if (global.voiceChat && global.voiceChat.sendToLLM) {
                console.log('📄 开始调用 sendToLLM...');
                await global.voiceChat.sendToLLM(prompt);
                console.log('📄 sendToLLM 调用完成');
            } else {
                console.error('📄 global.voiceChat 或 sendToLLM 不存在!');
                if (typeof window.addAIMessage === 'function') {
                    window.addAIMessage('（系统未准备好，请稍后再试）');
                }
            }
        } catch (error) {
            console.error('📄 处理文本文件失败:', error);
            if (typeof window.addAIMessage === 'function') {
                window.addAIMessage(`（处理文件出错: ${error.message}）`);
            }
        }
    }

    // 显示不支持的文件类型消息
    showUnsupportedMessage(file) {
        console.log('不支持的文件类型:', file.type, file.name);

        if (typeof window.addAIMessage === 'function') {
            window.addAIMessage(`（抱歉，我不支持处理 ${file.name} 这种类型的文件。目前支持图片和文本文件。）`);
        }
    }


   // 设置嘴部动画
    setMouthOpenY(v) {
        if (!this.model) return;

        try {
            v = Math.max(0, Math.min(v, 3.0));
            const coreModel = this.model.internalModel.coreModel;

            // 同时尝试所有可能的组合，不要return，让所有的都执行
            try {
                coreModel.setParameterValueById('PARAM_MOUTH_OPEN_Y', v);
            } catch (e) {}

            try {
                coreModel.setParameterValueById('ParamMouthOpenY', v);
            } catch (e) {}

            try {
                coreModel.SetParameterValue('PARAM_MOUTH_OPEN_Y', v);
            } catch (e) {}

            try {
                coreModel.SetParameterValue('ParamMouthOpenY', v);
            } catch (e) {}

        } catch (error) {
            console.error('设置嘴型参数失败:', error);
        }
    }

    // 初始化模型位置和大小
    setupInitialModelProperties(scaleMultiplier = 2.3) {
        if (!this.model || !this.app) return;

        const scaleX = (window.innerWidth * scaleMultiplier) / this.model.width;
        const scaleY = (window.innerHeight * scaleMultiplier) / this.model.height;
        this.model.scale.set(Math.min(scaleX, scaleY));

        // 检查是否有保存的位置
        if (this.config && this.config.ui && this.config.ui.model_position && this.config.ui.model_position.remember_position) {
            const savedPos = this.config.ui.model_position;
            if (savedPos.x !== null && savedPos.y !== null) {
                // 使用保存的位置（相对比例转换为绝对坐标）
                this.model.x = savedPos.x * window.innerWidth;
                this.model.y = savedPos.y * window.innerHeight;
                console.log('加载保存的模型位置:', { x: this.model.x, y: this.model.y });
            } else {
                // 使用默认位置
                this.model.y = window.innerHeight * 0.8;
                this.model.x = window.innerWidth * 1.35;
            }
        } else {
            // 使用默认位置
            this.model.y = window.innerHeight * 0.8;
            this.model.x = window.innerWidth * 1.35;
        }

        this.updateInteractionArea();
    }

    // 保存模型位置到配置文件
    saveModelPosition() {
        if (!this.model || !this.config) return;

        // 检查是否启用位置记忆
        if (!this.config.ui || !this.config.ui.model_position || !this.config.ui.model_position.remember_position) {
            return;
        }

        // 计算相对位置（0-1之间的比例）
        const relativeX = this.model.x / window.innerWidth;
        const relativeY = this.model.y / window.innerHeight;

        // 更新配置对象
        this.config.ui.model_position.x = relativeX;
        this.config.ui.model_position.y = relativeY;

        // 发送IPC消息保存位置
        ipcRenderer.send('save-model-position', {
            x: relativeX,
            y: relativeY
        });

        console.log('保存模型位置:', { x: relativeX, y: relativeY });
    }
}

module.exports = { ModelInteractionController };