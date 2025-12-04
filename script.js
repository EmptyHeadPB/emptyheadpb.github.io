// ===== КОНФИГУРАЦИЯ =====
const CONFIG = {
    defaultSize: 256,
    defaultColor: 'dark',
    maxTextLength: 1000,
    storageKey: 'glassQR_data',
    colors: {
        dark: '#1e1b4b',
        primary: '#8a5cf6',
        accent: '#ec4899'
    }
};

// ===== СОСТОЯНИЕ ПРИЛОЖЕНИЯ =====
const state = {
    qrSize: CONFIG.defaultSize,
    qrColor: CONFIG.defaultColor,
    qrInstance: null,
    currentCanvas: null,
    generatedCount: 0,
    todayCount: 0,
    totalSaved: 0,
    lastGenerated: null,
    theme: 'dark'
};

// ===== DOM ЭЛЕМЕНТЫ =====
const elements = {
    // Ввод
    qrText: document.getElementById('qr-text'),
    generateBtn: document.getElementById('generate-btn'),

    // Настройки
    sizeInputs: document.querySelectorAll('input[name="qr-size"]'),
    colorInputs: document.querySelectorAll('input[name="qr-color"]'),

    // Вывод
    qrcodeDiv: document.getElementById('qrcode'),
    placeholder: document.getElementById('placeholder'),
    downloadBtn: document.getElementById('download-btn'),
    copyBtn: document.getElementById('copy-btn'),
    shareBtn: document.getElementById('share-btn'),
    refreshBtn: document.getElementById('refresh-btn'),

    // Информация
    sizeValue: document.getElementById('size-value'),
    colorValue: document.getElementById('color-value'),
    timeValue: document.getElementById('time-value'),

    // Статистика
    generatedCount: document.getElementById('generated-count'),
    todayCount: document.getElementById('today-count'),
    totalSaved: document.getElementById('total-saved'),

    // Тема
    themeToggle: document.getElementById('theme-toggle'),
    body: document.body,

    // Модальные окна
    infoBtn: document.getElementById('info-btn'),
    infoModal: document.getElementById('info-modal'),
    modalClose: document.getElementById('modal-close'),

    // Примеры
    exampleBtns: document.querySelectorAll('.example-btn'),

    // Уведомления
    notificationContainer: document.getElementById('notification-container')
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем состояние
    loadState();
    
    // Инициализация
    initEventListeners();
    initParticles();
    updateStatisticsDisplay();
    
    // Показываем приветственное уведомление с задержкой
    setTimeout(() => {
        showWelcomeNotification();
    }, 1500);
    
    // Устанавливаем настройки по умолчанию
    setDefaultSettings();
});

// ===== УПРАВЛЕНИЕ СОСТОЯНИЕМ =====
function loadState() {
    try {
        const saved = localStorage.getItem(CONFIG.storageKey);
        if (saved) {
            const data = JSON.parse(saved);
            state.generatedCount = data.generatedCount || 0;
            state.totalSaved = data.totalSaved || 0;
            state.theme = data.theme || 'dark';

            // Проверяем количество за сегодня
            const today = new Date().toDateString();
            state.todayCount = data.lastDate === today ? (data.todayCount || 0) : 0;

            applyTheme();
        }
    } catch (e) {
        console.error('Ошибка загрузки состояния:', e);
    }
}

function saveState() {
    const today = new Date().toDateString();
    const data = {
        generatedCount: state.generatedCount,
        totalSaved: state.totalSaved,
        todayCount: state.todayCount,
        lastDate: today,
        theme: state.theme,
        lastGenerated: state.lastGenerated
    };

    try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
    } catch (e) {
        console.error('Ошибка сохранения состояния:', e);
    }
}

// ===== ТЕМА =====
function applyTheme() {
    elements.body.setAttribute('data-theme', state.theme);
    const icon = elements.themeToggle.querySelector('i');
    icon.className = state.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    saveState();
    showNotification('Тема изменена', `Активирована ${state.theme === 'dark' ? 'тёмная' : 'светлая'} тема`, 'info');
}

// ===== ЧАСТИЦЫ ФОНА =====
function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const particleCount = window.innerWidth < 768 ? 20 : 30;

    for (let i = 0; i < particleCount; i++) {
        createParticle(container);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    const size = Math.random() * 2 + 1;
    const color = Math.random() > 0.5 ? 'var(--primary)' : 'var(--accent)';

    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.background = color;
    particle.style.opacity = Math.random() * 0.3 + 0.1;

    const x = Math.random() * 100;
    const y = Math.random() * 100;

    particle.style.left = `${x}%`;
    particle.style.top = `${y}%`;

    // Анимация движения
    const duration = Math.random() * 20 + 15;
    const delay = Math.random() * 5;

    particle.style.animation = `float ${duration}s infinite ease-in-out ${delay}s`;

    container.appendChild(particle);

    // Удаляем старые частицы
    if (container.children.length > 50) {
        container.removeChild(container.firstChild);
    }
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
function initEventListeners() {
    // Генерация
    elements.generateBtn.addEventListener('click', generateQRCode);
    elements.qrText.addEventListener('input', handleTextInput);
    elements.qrText.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            generateQRCode();
        }
    });

    // Настройки
    elements.sizeInputs.forEach(input => {
        input.addEventListener('change', handleSizeChange);
    });

    elements.colorInputs.forEach(input => {
        input.addEventListener('change', handleColorChange);
    });

    // Действия с QR-кодом
    elements.downloadBtn.addEventListener('click', downloadQRCode);
    elements.copyBtn.addEventListener('click', copyQRCode);
    elements.shareBtn.addEventListener('click', shareQRCode);
    elements.refreshBtn.addEventListener('click', () => generateQRCode(true));

    // Тема
    elements.themeToggle.addEventListener('click', toggleTheme);

    // Модальные окна
    elements.infoBtn.addEventListener('click', () => showModal(elements.infoModal));
    elements.modalClose.addEventListener('click', () => hideModal(elements.infoModal));

    // Закрытие модального окна по клику вне его
    elements.infoModal.addEventListener('click', (e) => {
        if (e.target === elements.infoModal) {
            hideModal(elements.infoModal);
        }
    });

    // Быстрые примеры
    elements.exampleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.dataset.text;
            elements.qrText.value = text;
            generateQRCode();

            // Анимация кнопки
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 150);

            showNotification('Пример загружен', 'Текст скопирован в поле ввода', 'info');
        });
    });

    // Футер ссылки
    document.getElementById('privacy-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        showNotification('Конфиденциальность', 'Все данные обрабатываются локально и никуда не передаются.', 'info');
    });

    // Автогенерация при выборе настроек
    elements.sizeInputs.forEach(input => {
        input.addEventListener('change', () => {
            if (elements.qrText.value.trim()) {
                generateQRCode();
            }
        });
    });

    elements.colorInputs.forEach(input => {
        input.addEventListener('change', () => {
            if (elements.qrText.value.trim()) {
                generateQRCode();
            }
        });
    });

    // Обработка касаний для предотвращения лагов
    document.addEventListener('touchstart', function() {}, {passive: true});
    document.addEventListener('touchmove', function() {}, {passive: true});
}

function handleTextInput() {
    const text = elements.qrText.value;

    // Ограничение длины
    if (text.length > CONFIG.maxTextLength) {
        elements.qrText.value = text.substring(0, CONFIG.maxTextLength);
        showNotification('Ограничение длины', `Максимальная длина текста: ${CONFIG.maxTextLength} символов`, 'error');
        return;
    }

    // Автогенерация при вводе URL
    if (text.trim() && (text.includes('http') || text.includes('.') || text.length > 20)) {
        clearTimeout(window.typingTimer);
        window.typingTimer = setTimeout(() => {
            if (text.trim()) {
                generateQRCode();
            }
        }, 1000);
    }
}

function handleSizeChange(e) {
    state.qrSize = parseInt(e.target.value);
    updateSizeDisplay();
}

function handleColorChange(e) {
    state.qrColor = e.target.value;
    updateColorDisplay();
}

// ===== ГЕНЕРАЦИЯ QR-КОДА =====
function generateQRCode(force = false) {
    const text = elements.qrText.value.trim();

    // Проверка ввода
    if (!text) {
        if (force) {
            showNotification('Внимание', 'Введите текст или ссылку для генерации QR-кода', 'error');
            elements.qrText.focus();
            elements.qrText.classList.add('shake');
            setTimeout(() => elements.qrText.classList.remove('shake'), 500);
        }
        return;
    }

    // Валидация URL
    if (text.includes('http') && !isValidUrl(text) && !text.startsWith('http')) {
        if (!confirm('Текст похож на ссылку, но не начинается с http/https. Все равно сгенерировать?')) {
            return;
        }
    }

    // Показываем загрузку
    showLoading(true);

    // Очищаем предыдущий QR-код
    if (state.qrInstance) {
        state.qrInstance.clear();
        elements.qrcodeDiv.innerHTML = '';
    }

    try {
        // Скрываем плейсхолдер
        elements.placeholder.style.display = 'none';
        elements.qrcodeDiv.style.display = 'flex';

        // Настройки цвета
        const colorDark = CONFIG.colors[state.qrColor] || CONFIG.colors.dark;

        // Создаем новый QR-код
        state.qrInstance = new QRCode(elements.qrcodeDiv, {
            text: text,
            width: Math.min(state.qrSize, window.innerWidth - 100),
            height: Math.min(state.qrSize, window.innerWidth - 100),
            colorDark: colorDark,
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        // Ждем генерации
        setTimeout(() => {
            const canvas = elements.qrcodeDiv.querySelector('canvas');
            if (canvas) {
                state.currentCanvas = canvas;

                // Добавляем стили к canvas
                canvas.style.borderRadius = '12px';
                canvas.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
                canvas.style.maxWidth = '100%';
                canvas.style.height = 'auto';

                // Обновляем информацию
                updateQRInfo();
                enableActions();

                // Увеличиваем счетчики
                incrementCounters();
                showSuccessNotification();
            } else {
                throw new Error('Canvas не создан');
            }

            showLoading(false);
        }, 200);

    } catch (error) {
        console.error('Ошибка генерации QR-кода:', error);
        showLoading(false);

        // Показываем плейсхолдер с ошибкой
        elements.placeholder.style.display = 'block';
        elements.placeholder.innerHTML = `
            <div class="placeholder-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h4>Ошибка генерации</h4>
            <p>Не удалось создать QR-код. Проверьте введенные данные.</p>
            <div class="placeholder-hint">
                <i class="fas fa-lightbulb"></i>
                <span>Попробуйте другой текст или ссылку</span>
            </div>
        `;

        showNotification('Ошибка', 'Не удалось сгенерировать QR-код', 'error');
    }
}

function showLoading(show) {
    if (show) {
        elements.generateBtn.disabled = true;
        elements.generateBtn.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <span>Генерация...</span>
        `;

        // Показываем плейсхолдер с загрузкой
        if (!elements.qrText.value.trim()) {
            elements.placeholder.style.display = 'block';
            elements.placeholder.innerHTML = `
                <div class="placeholder-icon">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <h4>Генерация QR-кода...</h4>
                <p>Пожалуйста, подождите</p>
            `;
        }
    } else {
        elements.generateBtn.disabled = false;
        elements.generateBtn.innerHTML = `
            <i class="fas fa-bolt"></i>
            <span>Сгенерировать QR-код</span>
        `;
    }
}

// ===== ИНФОРМАЦИЯ О QR-КОДЕ =====
function updateQRInfo() {
    const now = new Date();
    state.lastGenerated = now;

    // Размер
    const sizeLabels = {
        '256': 'Маленький (256×256px)',
        '350': 'Средний (350×350px)',
        '450': 'Большой (450×450px)'
    };
    elements.sizeValue.textContent = sizeLabels[state.qrSize] || `${state.qrSize}×${state.qrSize}px`;

    // Цвет
    const colorLabels = {
        'dark': 'Тёмный',
        'primary': 'Основной',
        'accent': 'Акцентный'
    };
    elements.colorValue.textContent = colorLabels[state.qrColor] || state.qrColor;

    // Время
    elements.timeValue.textContent = now.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function enableActions() {
    elements.downloadBtn.disabled = false;
    elements.copyBtn.disabled = false;
    elements.shareBtn.disabled = false;
}

// ===== ДЕЙСТВИЯ С QR-КОДОМ =====
function downloadQRCode() {
    if (!state.currentCanvas) {
        showNotification('Ошибка', 'QR-код не сгенерирован', 'error');
        return;
    }

    try {
        // Создаем имя файла
        const sizeLabel = state.qrSize === 256 ? 'small' : state.qrSize === 350 ? 'medium' : 'large';
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        const fileName = `QR-Code-${sizeLabel}-${timestamp}.png`;

        // Создаем ссылку для скачивания
        const link = document.createElement('a');
        link.download = fileName;
        link.href = state.currentCanvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Обновляем статистику
        state.totalSaved++;
        updateStatisticsDisplay();
        saveState();

        // Анимация кнопки
        const originalText = elements.downloadBtn.innerHTML;
        elements.downloadBtn.innerHTML = `
            <i class="fas fa-check"></i>
            <span>Скачано!</span>
        `;
        elements.downloadBtn.style.background = 'linear-gradient(135deg, var(--success), #16a34a)';

        setTimeout(() => {
            elements.downloadBtn.innerHTML = originalText;
            elements.downloadBtn.style.background = '';
        }, 2000);

        showNotification('Успешно', 'QR-код скачан', 'success');

    } catch (error) {
        console.error('Ошибка скачивания:', error);
        showNotification('Ошибка', 'Не удалось скачать QR-код', 'error');
    }
}

function copyQRCode() {
    if (!state.currentCanvas) {
        showNotification('Ошибка', 'QR-код не сгенерирован', 'error');
        return;
    }

    // Для мобильных устройств используем простой способ
    if (navigator.clipboard && window.isSecureContext) {
        state.currentCanvas.toBlob(blob => {
            const item = new ClipboardItem({ 'image/png': blob });

            navigator.clipboard.write([item]).then(() => {
                // Анимация кнопки
                const originalText = elements.copyBtn.innerHTML;
                elements.copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                elements.copyBtn.style.color = 'var(--success)';

                setTimeout(() => {
                    elements.copyBtn.innerHTML = originalText;
                    elements.copyBtn.style.color = '';
                }, 2000);

                showNotification('Скопировано', 'QR-код скопирован в буфер обмена', 'success');

            }).catch(err => {
                console.error('Ошибка копирования:', err);
                showNotification('Информация', 'Используйте кнопку скачивания', 'info');
            });
        });
    } else {
        // Fallback для старых браузеров
        showNotification('Информация', 'Нажмите кнопку скачивания для сохранения QR-кода', 'info');
    }
}

async function shareQRCode() {
    if (!state.currentCanvas) {
        showNotification('Ошибка', 'QR-код не сгенерирован', 'error');
        return;
    }

    if (navigator.share) {
        try {
            const blob = await new Promise(resolve => state.currentCanvas.toBlob(resolve));
            const file = new File([blob], 'qrcode.png', { type: 'image/png' });

            await navigator.share({
                files: [file],
                title: 'Мой QR-код',
                text: 'Создано с помощью QR Generator'
            });

            showNotification('Успешно', 'QR-код опубликован', 'success');

        } catch (error) {
            if (error.name !== 'AbortError') {
                showNotification('Информация', 'Публикация отменена', 'info');
            }
        }
    } else {
        // Fallback для браузеров без поддержки Web Share API
        showNotification('Информация', 'Функция публикации недоступна в вашем браузере', 'info');
    }
}

// ===== СТАТИСТИКА =====
function incrementCounters() {
    state.generatedCount++;

    const today = new Date().toDateString();
    state.todayCount++;

    updateStatisticsDisplay();
    saveState();
}

function updateStatisticsDisplay() {
    elements.generatedCount.textContent = state.generatedCount;
    elements.todayCount.textContent = state.todayCount;
    elements.totalSaved.textContent = state.totalSaved;
}

function updateSizeDisplay() {
    // Обновим позже в updateQRInfo
}

function updateColorDisplay() {
    // Обновим позже в updateQRInfo
}

// ===== УВЕДОМЛЕНИЯ =====
function showNotification(title, message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    const icon = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    }[type];

    notification.innerHTML = `
        <i class="notification-icon ${icon}"></i>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
    `;

    elements.notificationContainer.appendChild(notification);

    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 3000);
}

function showWelcomeNotification() {
    showNotification(
        'Добро пожаловать!',
        'Введите текст или ссылку для создания QR-кода',
        'info'
    );
}

function showSuccessNotification() {
    const notifications = [
        'QR-код успешно создан!',
        'Готово! Ваш QR-код сгенерирован.',
        'Идеально! QR-код готов к использованию.',
        'Успех! QR-код создан и готов к скачиванию.'
    ];

    const message = notifications[Math.floor(Math.random() * notifications.length)];
    showNotification('Отлично!', message, 'success');
}

// ===== МОДАЛЬНЫЕ ОКНА =====
function showModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ НАСТРОЕК ПО УМОЛЧАНИЮ =====
function setDefaultSettings() {
    // Устанавливаем выбранный размер
    const defaultSizeInput = document.querySelector(`input[name="qr-size"][value="${CONFIG.defaultSize}"]`);
    if (defaultSizeInput) {
        defaultSizeInput.checked = true;
        state.qrSize = CONFIG.defaultSize;
    }

    // Устанавливаем выбранный цвет
    const defaultColorInput = document.querySelector(`input[name="qr-color"][value="${CONFIG.defaultColor}"]`);
    if (defaultColorInput) {
        defaultColorInput.checked = true;
        state.qrColor = CONFIG.defaultColor;
    }

    // Очищаем поле ввода
    elements.qrText.value = '';

    // Показываем плейсхолдер
    elements.placeholder.style.display = 'block';
    elements.qrcodeDiv.style.display = 'none';

    // Отключаем кнопки действий
    elements.downloadBtn.disabled = true;
    elements.copyBtn.disabled = true;
    elements.shareBtn.disabled = true;
}

// ===== ОПТИМИЗАЦИЯ ДЛЯ МОБИЛЬНЫХ =====
// Предотвращаем зум при двойном тапе
document.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Фикс для iOS и Android
if ('ontouchstart' in window) {
    document.documentElement.style.cursor = 'pointer';
}
