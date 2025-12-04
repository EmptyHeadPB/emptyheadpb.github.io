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
    },
    mobileBreakpoint: 768
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
    theme: 'dark',
    isMobile: false
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
    detectDeviceType();
    loadState();
    initEventListeners();
    initParticles();
    updateStatisticsDisplay();
    showWelcomeNotification();
    setupMobileOptimizations();
});

// ===== ОПРЕДЕЛЕНИЕ ТИПА УСТРОЙСТВА =====
function detectDeviceType() {
    state.isMobile = window.innerWidth <= CONFIG.mobileBreakpoint;
    // Адаптируем размер QR-кода для мобильных
    if (state.isMobile) {
        state.qrSize = 256; // Меньший размер по умолчанию для мобильных
        const smallSizeInput = document.querySelector('input[name="qr-size"][value="256"]');
        if (smallSizeInput) {
            smallSizeInput.checked = true;
        }
    }
}

// ===== МОБИЛЬНЫЕ ОПТИМИЗАЦИИ =====
function setupMobileOptimizations() {
    // Предотвращаем масштабирование при фокусе на поле ввода
    elements.qrText.addEventListener('focus', () => {
        if (state.isMobile) {
            setTimeout(() => {
                window.scrollTo(0, 0);
            }, 100);
        }
    });

    // Закрываем клавиатуру по клику вне поля ввода
    document.addEventListener('click', (e) => {
        if (state.isMobile && e.target !== elements.qrText) {
            elements.qrText.blur();
        }
    });

    // Адаптируем размер QR-кода при изменении ориентации
    window.addEventListener('resize', () => {
        detectDeviceType();
    });

    // Предотвращаем скролл страницы при прокрутке внутри textarea
    elements.qrText.addEventListener('touchmove', (e) => {
        e.stopPropagation();
    }, { passive: true });
}

// ===== УПРАВЛЕНИЕ СОСТОЯНИЕМ =====
function loadState() {
    const saved = localStorage.getItem(CONFIG.storageKey);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            state.generatedCount = data.generatedCount || 0;
            state.totalSaved = data.totalSaved || 0;
            state.theme = data.theme || 'dark';

            // Проверяем количество за сегодня
            const today = new Date().toDateString();
            state.todayCount = data.lastDate === today ? (data.todayCount || 0) : 0;

            applyTheme();
        } catch (e) {
            console.error('Ошибка загрузки состояния:', e);
        }
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
    document.querySelector('meta[name="theme-color"]').setAttribute('content', state.theme === 'dark' ? '#0a0a1a' : '#f1f5f9');
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    saveState();
    
    // Анимация кнопки
    elements.themeToggle.style.transform = 'scale(0.9)';
    setTimeout(() => {
        elements.themeToggle.style.transform = 'scale(1)';
    }, 150);
    
    showNotification('Тема изменена', `Активирована ${state.theme === 'dark' ? 'тёмная' : 'светлая'} тема`, 'info');
}

// ===== ЧАСТИЦЫ ФОНА =====
function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const particleCount = state.isMobile ? 20 : 40;

    for (let i = 0; i < particleCount; i++) {
        createParticle(container);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    const size = Math.random() * (state.isMobile ? 2 : 3) + 1;
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
    const duration = Math.random() * 30 + 20;
    const delay = Math.random() * 5;

    particle.style.animation = `
        floatParticle ${duration}s infinite ease-in-out ${delay}s
    `;

    container.appendChild(particle);

    // Удаляем старые частицы
    if (container.children.length > 100) {
        container.removeChild(container.firstChild);
    }
}

// Добавляем CSS для анимации частиц
const particleStyle = document.createElement('style');
particleStyle.textContent = `
    @keyframes floatParticle {
        0%, 100% { transform: translate(0, 0) rotate(0deg); }
        25% { transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) rotate(90deg); }
        50% { transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) rotate(180deg); }
        75% { transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) rotate(270deg); }
    }
`;
document.head.appendChild(particleStyle);

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
function initEventListeners() {
    // Генерация
    elements.generateBtn.addEventListener('click', generateQRCode);
    elements.qrText.addEventListener('input', handleTextInput);
    
    // Генерация по Enter (с Ctrl/Cmd)
    elements.qrText.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
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

    // Закрытие модального окна по Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.infoModal.classList.contains('active')) {
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

    // Свайп для закрытия модального окна на мобильных
    if (state.isMobile) {
        let startY;
        elements.infoModal.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });
        
        elements.infoModal.addEventListener('touchmove', (e) => {
            if (!startY) return;
            
            const currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            
            if (diff > 100) { // Свайп вниз на 100px
                hideModal(elements.infoModal);
            }
        });
    }
}

function handleTextInput() {
    const text = elements.qrText.value;

    // Ограничение длины
    if (text.length > CONFIG.maxTextLength) {
        elements.qrText.value = text.substring(0, CONFIG.maxTextLength);
        showNotification('Ограничение длины', `Максимальная длина текста: ${CONFIG.maxTextLength} символов`, 'error');
        return;
    }

    // Автогенерация при вводе URL (только на ПК)
    if (!state.isMobile && text.trim() && (text.includes('http') || text.includes('.') || text.length > 20)) {
        clearTimeout(window.typingTimer);
        window.typingTimer = setTimeout(() => {
            if (text.trim()) {
                generateQRCode();
            }
        }, 800);
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
            
            // Вибрация на мобильных
            if (state.isMobile && navigator.vibrate) {
                navigator.vibrate(100);
            }
        }
        return;
    }

    // Валидация URL
    if (text.includes('http') && !isValidUrl(text) && !text.startsWith('http')) {
        if (state.isMobile) {
            showNotification('Внимание', 'Текст похож на ссылку, но не начинается с http/https', 'warning');
            return;
        } else if (!confirm('Текст похож на ссылку, но не начинается с http/https. Все равно сгенерировать?')) {
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

        // Адаптируем размер для мобильных
        let size = state.qrSize;
        if (state.isMobile && size > 256) {
            size = 256;
        }

        // Создаем новый QR-код
        state.qrInstance = new QRCode(elements.qrcodeDiv, {
            text: text,
            width: size,
            height: size,
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
                
                // Прокручиваем к QR-коду на мобильных
                if (state.isMobile) {
                    setTimeout(() => {
                        elements.qrcodeDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                }
            } else {
                throw new Error('Canvas не создан');
            }

            showLoading(false);
        }, 300);

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
        
        // Вибрация на мобильных
        if (state.isMobile && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
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
        
        // Вибрация на мобильных
        if (state.isMobile && navigator.vibrate) {
            navigator.vibrate(50);
        }

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

    // Для мобильных устройств используем простой метод
    if (state.isMobile) {
        const dataURL = state.currentCanvas.toDataURL();
        const tempInput = document.createElement('input');
        tempInput.value = dataURL;
        document.body.appendChild(tempInput);
        tempInput.select();
        tempInput.setSelectionRange(0, 99999);
        
        try {
            document.execCommand('copy');
            showNotification('Скопировано', 'Ссылка на QR-код скопирована', 'success');
            
            // Вибрация на мобильных
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        } catch (e) {
            showNotification('Ошибка', 'Не удалось скопировать QR-код', 'error');
        }
        
        document.body.removeChild(tempInput);
        return;
    }

    // Для ПК используем Clipboard API
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
            
            // Fallback для браузеров без поддержки Clipboard API
            const dataURL = state.currentCanvas.toDataURL();
            const tempInput = document.createElement('input');
            tempInput.value = dataURL;
            document.body.appendChild(tempInput);
            tempInput.select();
            tempInput.setSelectionRange(0, 99999);

            try {
                document.execCommand('copy');
                showNotification('Скопировано', 'Ссылка на QR-код скопирована', 'info');
            } catch (e) {
                showNotification('Ошибка', 'Не удалось скопировать QR-код', 'error');
            }

            document.body.removeChild(tempInput);
        });
    });
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
                text: 'Создано с помощью SKQR Generator'
            });

            showNotification('Успешно', 'QR-код опубликован', 'success');

        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Ошибка публикации:', error);
                showNotification('Отменено', 'Публикация отменена', 'info');
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
    const sizeLabels = {
        '256': 'Маленький',
        '350': 'Средний',
        '450': 'Большой'
    };
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
    
    // Озвучиваем уведомления для скринридеров
    const ariaLive = document.createElement('div');
    ariaLive.className = 'sr-only';
    ariaLive.setAttribute('aria-live', 'assertive');
    ariaLive.textContent = `${title}: ${message}`;
    document.body.appendChild(ariaLive);
    setTimeout(() => ariaLive.remove(), 100);
}

function showWelcomeNotification() {
    setTimeout(() => {
        if (state.isMobile) {
            showNotification(
                'Добро пожаловать!',
                'Коснитесь поля ввода или выберите пример для создания QR-кода',
                'info'
            );
        } else {
            showNotification(
                'Добро пожаловать!',
                'Введите текст или ссылку для создания QR-кода',
                'info'
            );
        }
    }, 1000);
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
    
    // Короткая вибрация на мобильных при успешной генерации
    if (state.isMobile && navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// ===== МОДАЛЬНЫЕ ОКНА =====
function showModal(modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Фокусируемся на кнопке закрытия
    setTimeout(() => {
        modal.querySelector('.modal-close').focus();
    }, 100);
}

function hideModal(modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    
    // Возвращаем фокус на кнопку информации
    elements.infoBtn.focus();
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
    const defaultSize = state.isMobile ? 256 : CONFIG.defaultSize;
    const defaultSizeInput = document.querySelector(`input[name="qr-size"][value="${defaultSize}"]`);
    if (defaultSizeInput) {
        defaultSizeInput.checked = true;
        state.qrSize = defaultSize;
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

// Вызываем установку настроек по умолчанию после загрузки
setDefaultSettings();

// ===== ОБРАБОТКА ИЗМЕНЕНИЯ РАЗМЕРА ОКНА =====
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        detectDeviceType();
        // Перегенерируем QR-код с новым размером, если он есть
        if (state.currentCanvas && elements.qrText.value.trim()) {
            generateQRCode();
        }
    }, 250);
});