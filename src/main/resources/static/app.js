const firebaseConfig = {
    apiKey: "AIzaSyDpj4HI0qbfvt1hdYaci9fQIlFfXTdXgZs",
    authDomain: "youngkcal-99d8f.firebaseapp.com",
    projectId: "youngkcal-99d8f",
    storageBucket: "youngkcal-99d8f.firebasestorage.app",
    messagingSenderId: "794829236107",
    appId: "1:794829236107:web:f3d2d83bc2064a9e45b18e",
    measurementId: "G-VMR7EPWB7F"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    // State
    let employees = [];
    let schedules = [];
    let currentDate = new Date();
    let viewMode = 'daily';
    let salaryChartInstance = null;
    let adminPassword = '0000';
    let defaultWage = 10320;
    let currentSalaryData = []; // For Excel and Payslips
    let passwordTargetAction = 'salary';
    let pendingScheduleId = null;
    let presets = [];
    
    let dayOfWeekChartInstance = null;
    
    const defaultInventoryItems = [
        { id: 'veg', name: '야채' },
        { id: 'sauce', name: '소스' },
        { id: 'frozen', name: '냉동제품' },
        { id: 'poke-bowl', name: '포케 용기' },
        { id: 'bento-box', name: '도시락 용기' },
        { id: 'oil', name: '식용유' },
        { id: 'bag-l', name: '배달 봉투 (대)' },
        { id: 'bag-m', name: '배달 봉투 (중)' },
        { id: 'bag-s', name: '배달 봉투 (소)' }
    ];
    let inventoryData = {};
    let disposalData = {};
    let inventoryCheckData = null;
    let handoverData = [];
    let localInventoryEdits = {}; // To preserve unsaved changes across renders
    
    const TIMELINE_START = 9;
    const TIMELINE_END = 24; // 09:00 ~ 24:00 (midnight)
    const TIMELINE_HOURS = TIMELINE_END - TIMELINE_START;

    // DOM Elements - Controls
    const empNameInput = document.getElementById('emp-name');
    const empPinInput = document.getElementById('emp-pin');
    const empWageInput = document.getElementById('emp-wage');
    const addEmpBtn = document.getElementById('add-emp-btn');
    const employeeListEl = document.getElementById('employee-list');
    
    // DOM Elements - Schedule Form
    const scheduleModeRadios = document.querySelectorAll('input[name="sched-mode"]');
    const singleDateWrapper = document.getElementById('single-date-wrapper');
    const recurringDateWrapper = document.getElementById('recurring-date-wrapper');
    const scheduleDateInput = document.getElementById('schedule-date');
    const scheduleStartDateInput = document.getElementById('schedule-start-date');
    const scheduleEndDateInput = document.getElementById('schedule-end-date');
    const weekdayCheckboxes = document.querySelectorAll('.weekday-selector input[type="checkbox"]');
    
    const scheduleEmpSelect = document.getElementById('schedule-emp');
    const schedulePreset = document.getElementById('schedule-preset');
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    const addScheduleBtn = document.getElementById('add-schedule-btn');
    
    // DOM Elements - Board Header
    const prevDateBtn = document.getElementById('prev-date-btn');
    const nextDateBtn = document.getElementById('next-date-btn');
    const todayBtn = document.getElementById('today-btn');
    const boardDateDisplay = document.getElementById('board-date-display');
    const currentDateEl = document.getElementById('current-date');
    
    // DOM Elements - View Toggles
    const viewDailyBtn = document.getElementById('view-daily-btn');
    const viewWeeklyBtn = document.getElementById('view-weekly-btn');
    const viewMonthlyBtn = document.getElementById('view-monthly-btn');
    const viewSalaryBtn = document.getElementById('view-salary-btn');
    const viewInventoryBtn = document.getElementById('view-inventory-btn');
    const clearSchedulesBtn = document.getElementById('clear-schedules-btn');
    
    // DOM Elements - Views
    const viewContainerDaily = document.getElementById('view-container-daily');
    const viewContainerWeekly = document.getElementById('view-container-weekly');
    const viewContainerMonthly = document.getElementById('view-container-monthly');
    const viewContainerSalary = document.getElementById('view-container-salary');
    const viewContainerInventory = document.getElementById('view-container-inventory');
    const viewContainerDisposal = document.getElementById('view-container-disposal');
    const viewContainerHandover = document.getElementById('view-container-handover');
    
    const viewHandoverBtn = document.getElementById('view-handover-btn');
    const handoverEmpSelect = document.getElementById('handover-emp-select');
    const handoverContentInput = document.getElementById('handover-content-input');
    const addHandoverBtn = document.getElementById('add-handover-btn');
    const handoverListContainer = document.getElementById('handover-list-container');
    
    const timeHeader = document.getElementById('time-header');
    const timelineGrid = document.getElementById('timeline-grid');
    const weeklyThead = document.getElementById('weekly-thead');
    const weeklyTbody = document.getElementById('weekly-tbody');
    const monthlyGrid = document.getElementById('monthly-grid');
    const adminMonthlyGrid = document.getElementById('admin-monthly-grid');
    const salaryTbody = document.getElementById('salary-tbody');
    const inventoryTbody = document.getElementById('inventory-tbody');

    // Modal Elements
    const mobileDailyModal = document.getElementById('mobile-daily-detail-modal');
    const mobileDailyTitle = document.getElementById('mobile-daily-title');
    const mobileDailyList = document.getElementById('mobile-daily-list');
    const closeMobileDailyBtn = document.getElementById('close-mobile-daily-btn');

    // DOM Elements - Modal
    const passwordModal = document.getElementById('password-modal');
    const salaryPasswordInput = document.getElementById('salary-password-input');
    const confirmPasswordBtn = document.getElementById('confirm-password-btn');
    const cancelPasswordBtn = document.getElementById('cancel-password-btn');

    const changePasswordModal = document.getElementById('change-password-modal');
    const openChangePwBtn = document.getElementById('open-change-pw-btn');
    const currentPwInput = document.getElementById('current-pw-input');
    const newPwInput = document.getElementById('new-pw-input');
    const confirmNewPwInput = document.getElementById('confirm-new-pw-input');
    const confirmChangePwBtn = document.getElementById('confirm-change-pw-btn');
    const cancelChangePwBtn = document.getElementById('cancel-change-pw-btn');
    
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const payslipModal = document.getElementById('payslip-modal');
    const closePayslipBtn = document.getElementById('close-payslip-btn');
    const payslipTitle = document.getElementById('payslip-title');
    const payslipDailyTbody = document.getElementById('payslip-daily-tbody');
    const payslipWeeklyTbody = document.getElementById('payslip-weekly-tbody');
    const payslipTotalAmount = document.getElementById('payslip-total-amount');
    const payslipModalClose = document.getElementById('payslip-modal-close');

    // DOM Elements - My Salary Auth
    const viewMySalaryBtn = document.getElementById('view-my-salary-btn');
    const mySalaryAuthModal = document.getElementById('my-salary-auth-modal');
    const mySalaryEmpSelect = document.getElementById('my-salary-emp-select');
    const mySalaryPinInput = document.getElementById('my-salary-pin-input');
    const cancelMySalaryBtn = document.getElementById('cancel-my-salary-btn');
    const confirmMySalaryBtn = document.getElementById('confirm-my-salary-btn');

    // DOM Elements - Edit Employee Modal
    const editEmpModal = document.getElementById('edit-emp-modal');
    const editEmpNameInput = document.getElementById('edit-emp-name');
    const editEmpPinInput = document.getElementById('edit-emp-pin');
    const editEmpWageInput = document.getElementById('edit-emp-wage');
    const editEmpColorsContainer = document.getElementById('edit-emp-colors');
    const toggleResignEmpBtn = document.getElementById('toggle-resign-emp-btn');
    const cancelEditEmpBtn = document.getElementById('cancel-edit-emp-btn');
    const confirmEditEmpBtn = document.getElementById('confirm-edit-emp-btn');
    const showResignedCb = document.getElementById('show-resigned-cb');
    
    // DOM Elements - Edit Schedule Modal
    const editScheduleModal = document.getElementById('edit-schedule-modal');
    const editSchedDateWrapper = document.getElementById('edit-sched-date-wrapper');
    const editSchedDateInput = document.getElementById('edit-sched-date');
    const editSchedWeekdayWrapper = document.getElementById('edit-sched-weekday-wrapper');
    const editSchedWeekdaySelect = document.getElementById('edit-sched-weekday');
    const editSchedEmpName = document.getElementById('edit-sched-emp-name');
    const editSchedEmpColor = document.getElementById('edit-sched-emp-color');
    const editSchedStartInput = document.getElementById('edit-sched-start');
    const editSchedEndInput = document.getElementById('edit-sched-end');
    const cancelEditSchedBtn = document.getElementById('cancel-edit-sched-btn');
    const confirmEditSchedBtn = document.getElementById('confirm-edit-sched-btn');

    // DOM Elements - Quick Add Schedule Modal
    const quickAddModal = document.getElementById('quick-add-schedule-modal');
    const quickAddDateInput = document.getElementById('quick-add-date');
    const quickAddEmpSelect = document.getElementById('quick-add-emp');
    const quickAddPresetSelect = document.getElementById('quick-add-preset');
    const quickAddStartInput = document.getElementById('quick-add-start');
    const quickAddEndInput = document.getElementById('quick-add-end');
    const cancelQuickAddTopBtn = document.getElementById('cancel-quick-add-top-btn');
    const cancelQuickAddBtn = document.getElementById('cancel-quick-add-btn');
    const confirmQuickAddBtn = document.getElementById('confirm-quick-add-btn');
    const deleteEditSchedBtn = document.getElementById('delete-edit-sched-btn');
    
    // DOM Elements - Preset Manage
    const managePresetsBtn = document.getElementById('manage-presets-btn');
    const presetManageModal = document.getElementById('preset-manage-modal');
    const newPresetName = document.getElementById('new-preset-name');
    const newPresetStart = document.getElementById('new-preset-start');
    const newPresetEnd = document.getElementById('new-preset-end');
    const addPresetBtn = document.getElementById('add-preset-btn');
    const updatePresetBtn = document.getElementById('update-preset-btn');
    const cancelEditPresetBtn = document.getElementById('cancel-edit-preset-btn');
    const presetListEl = document.getElementById('preset-list');
    const closePresetManageBtn = document.getElementById('close-preset-manage-btn');
    
    // DOM Elements - Confirm Modal
    const confirmModal = document.getElementById('confirm-modal');
    const confirmModalMessage = document.getElementById('confirm-modal-message');
    const cancelConfirmBtn = document.getElementById('cancel-confirm-btn');
    const okConfirmBtn = document.getElementById('ok-confirm-btn');
    let currentConfirmCallback = null;
    let editingPresetId = null;
    
    // DOM Elements - Disposal Amount Modal
    const disposalModal = document.getElementById('disposal-amount-modal');
    const disposalItemNameEl = document.getElementById('disposal-item-name');
    const disposalCurrentQtyEl = document.getElementById('disposal-current-qty');
    const disposalQtyInput = document.getElementById('disposal-qty-input');
    const disposalMemoInput = document.getElementById('disposal-memo-input');
    const closeDisposalModalBtn = document.getElementById('close-disposal-modal-btn');
    const cancelDisposalBtn = document.getElementById('cancel-disposal-btn');
    const confirmDisposalBtn = document.getElementById('confirm-disposal-btn');
    let currentDisposalItem = null;
    
    // Handover Check Modal
    const handoverCheckModal = document.getElementById('handover-check-modal');
    const handoverCheckEmpSelect = document.getElementById('handover-check-emp-select');
    const confirmHandoverBtn = document.getElementById('confirm-handover-btn');
    const cancelHandoverBtn = document.getElementById('cancel-handover-btn');
    const closeHandoverModalBtn = document.getElementById('close-handover-modal-btn');
    
    let pendingHandoverCheckId = null;

    // Rules Modal & Settings
    const viewRulesBtn = document.getElementById('view-rules-btn');
    const viewContainerRules = document.getElementById('view-container-rules');
    const rulesModal = document.getElementById('rules-modal');
    const closeRulesModalBtn = document.getElementById('close-rules-modal-btn');
    const closeRulesBtn = document.getElementById('close-rules-btn');
    const handoverRulesDisplay = document.getElementById('handover-rules-display');
    const handoverClosingDisplay = document.getElementById('handover-closing-display');
    const adminRulesInput = document.getElementById('admin-rules-input');
    const adminClosingInput = document.getElementById('unique-admin-closing-input');
    const saveRulesBtn = document.getElementById('save-rules-btn');

    const manageCategoryBtn = document.getElementById('manage-category-btn');
    const categoryManageModal = document.getElementById('category-manage-modal');
    const closeCategoryManageBtn = document.getElementById('close-category-manage-btn');
    const newCategoryNameInput = document.getElementById('new-category-name');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const categoryListEl = document.getElementById('category-list');
    const newInventoryCategorySelect = document.getElementById('new-inventory-category');
    let inventoryCategories = [];

    function showConfirm(msg, callback) {
        confirmModalMessage.textContent = msg;
        currentConfirmCallback = callback;
        confirmModal.style.display = 'flex';
    }

    window.showToast = function(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.style.cssText = `
            background: ${type === 'success' ? 'var(--primary-color)' : 'var(--danger)'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        `;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Trigger animation
        requestAnimationFrame(() => {
            setTimeout(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
            }, 10);
        });
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 3000);
    };

    if (cancelConfirmBtn) {
        cancelConfirmBtn.addEventListener('click', () => {
            confirmModal.style.display = 'none';
            currentConfirmCallback = null;
        });
    }

    if (okConfirmBtn) {
        okConfirmBtn.addEventListener('click', () => {
            confirmModal.style.display = 'none';
            if (currentConfirmCallback) {
                currentConfirmCallback();
                currentConfirmCallback = null;
            }
        });
    }
    
    function closeDisposalModal() {
        disposalModal.style.display = 'none';
        currentDisposalItem = null;
    }
    
    if (closeDisposalModalBtn) closeDisposalModalBtn.addEventListener('click', closeDisposalModal);
    if (cancelDisposalBtn) cancelDisposalBtn.addEventListener('click', closeDisposalModal);
    
    if (confirmDisposalBtn) {
        confirmDisposalBtn.addEventListener('click', async () => {
            if (!currentDisposalItem) return;
            const id = currentDisposalItem.id;
            const data = inventoryData[id];
            if (!data) return;
            
            const currentQty = currentDisposalItem.currentQty;
            const disposalQty = parseInt(disposalQtyInput.value) || 0;
            const memo = disposalMemoInput.value;
            
            if (disposalQty <= 0) {
                alert('폐기할 수량을 1개 이상 입력해주세요.');
                return;
            }
            if (disposalQty > currentQty) {
                alert('현재 수량보다 많은 수량을 폐기할 수 없습니다.');
                return;
            }
            
            const disposalId = 'disp_' + Date.now();
            const disposalPayload = {
                id: disposalId,
                itemId: id,
                name: data.name,
                quantity: disposalQty,
                memo: memo,
                archivedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            const newQty = currentQty - disposalQty;
            const resetPayload = {
                quantity: newQty,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // If new quantity is 0, user might want to reset dates
            if (newQty === 0) {
                resetPayload.receivedDate = '';
                resetPayload.openedDate = '';
                resetPayload.actionDate = '';
                // resetPayload.memo = ''; // Keep inventory memo separate, don't clear it
                resetPayload.isOrdered = false;
                resetPayload.status = 'danger';
            }

            try {
                confirmDisposalBtn.textContent = '처리 중...';
                await db.collection('disposals').doc(disposalId).set(disposalPayload);
                await db.collection('inventory').doc(id).set(resetPayload, { merge: true });
                closeDisposalModal();
            } catch(e) {
                console.error('Error archiving disposal', e);
                alert('처리 실패');
            } finally {
                confirmDisposalBtn.textContent = '폐기 확정';
            }
        });
    }


    
    let editingEmpId = null;
    let editingEmpSelectedColor = null;
    let editingEmpIsResigned = false;
    const colors = [
        ['#ef4444', '#b91c1c'], ['#f97316', '#c2410c'], ['#10b981', '#047857'],
        ['#06b6d4', '#0e7490'], ['#3b82f6', '#1d4ed8'], ['#6366f1', '#4338ca'],
        ['#a855f7', '#7e22ce'], ['#ec4899', '#be185d']
    ];

    init();

    function init() {
        const todayStr = formatDateString(new Date());
        scheduleDateInput.value = todayStr;
        scheduleStartDateInput.value = todayStr;
        
        let endD = new Date();
        endD.setMonth(endD.getMonth() + 1);
        scheduleEndDateInput.value = formatDateString(endD);

        updateAppHeaderDate();
        renderTimeHeader();

        // Firebase Listeners
        db.collection('employees').onSnapshot(snapshot => {
            employees = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                employees.push({
                    id: doc.id,
                    name: data.name,
                    hourlyWage: data.hourlyWage || defaultWage,
                    color1: data.color1 || colors[0][0],
                    color2: data.color2 || colors[0][1],
                    isResigned: data.isResigned || false,
                    applyHolidayAllowance: data.applyHolidayAllowance || false,
                    excludeSalary: data.excludeSalary || false
                });
            });
            renderEmployees();
            updateBoard();
        });
        
        // Schedules
        db.collection('schedules').onSnapshot(snapshot => {
            schedules = [];
            snapshot.forEach(doc => {
                schedules.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            updateBoard();
        });
        
        // Presets
        db.collection('presets').onSnapshot(snapshot => {
            presets = [];
            snapshot.forEach(doc => {
                presets.push({ id: doc.id, ...doc.data() });
            });
            updatePresetSelects();
            renderPresetManageList();
        });

        db.collection('inventory').onSnapshot(snapshot => {
            inventoryData = {};
            snapshot.forEach(doc => {
                inventoryData[doc.id] = { ...doc.data(), id: doc.id };
            });
            if (viewMode === 'inventory') {
                renderInventory();
            }
        });
        
        db.collection('settings').doc('inventoryCategories').onSnapshot(doc => {
            if (doc.exists && doc.data().list) {
                inventoryCategories = doc.data().list;
            } else {
                inventoryCategories = ['소스', '야채', '냉동식품', '기타']; // 기본 카테고리
                db.collection('settings').doc('inventoryCategories').set({ list: inventoryCategories });
            }
            renderInventoryCategories();
            if (viewMode === 'inventory') renderInventory();
        });
        // Disposals
        db.collection('disposals').onSnapshot(snapshot => {
            disposalData = {};
            snapshot.forEach(doc => {
                disposalData[doc.id] = doc.data();
            });
            if (viewMode === 'disposal') {
                renderDisposalArchive();
            }
        });
        
        // Inventory Check
        db.collection('settings').doc('inventoryCheck').onSnapshot(doc => {
            if (doc.exists) {
                inventoryCheckData = doc.data();
            } else {
                inventoryCheckData = null;
            }
            if (viewMode === 'inventory' || viewMode === 'disposal') {
                renderInventoryCheckStatus();
            }
        });

        // Handovers
        db.collection('handovers').orderBy('createdAt', 'desc').limit(50).onSnapshot(snapshot => {
            handoverData = [];
            snapshot.forEach(doc => {
                handoverData.push({ id: doc.id, ...doc.data() });
            });
            if (viewMode === 'handover') {
                renderHandovers();
            } else if (viewMode === 'daily') {
                renderDailyHandover(formatDateString(currentDate));
            }
        });
        
        // Rules
        db.collection('settings').doc('rules').onSnapshot((doc) => {
            let content = '';
            let closing = '';
            const defaultContent = `영칼로리포케 부산경성대부경대점 기본 규칙\n\n[위생]\n모자 필히 착용 (머리카락 빠지지 않게 착용 필수)\n음식 조리 시 마스크 착용 (매장 내 기본형/투명마스크용 구비)\n맨 손으로 음식 만지지 않기 (비닐장갑 or 니트릴 장갑 착용)\n화장실 이용 시 앞치마 벗고 가기\n\n[복지]\n기본 음료 한잔 제공 ( * 라떼, 단백질음료, 콤부차 제외)\n4시간 미만 근무 시\n- 샌드위치 제공\n4시간 초과 근무 시\n- 한끼 식사 제공\n\n🚫무단 취식 적발 시 알바비 차감🚫`;
            const defaultClosing = `🪟 홀\n1. 테이블 전체 닦기\n2. 의자 올리기\n3. 홀 바닥 청소\n4. 키오스크 전원 OFF\n5. 홀 물 디스펜서 청소\n6. 영업 마감 후 노트북 전원 OFF\n\n🍳 주방\n1. 식기 및 조리도구 설거지\n2. 작업대 테이블 3개 전체 청소\n3. 화구 청소 및 냉장고 청결 유지\n4. 바닥 청소\n  - 금요일 : 오픈 클리너 사용\n  - 토요일 : 물 청소\n5. 바닥 물기 제거\n\n✅ 마무리\n0. 일요일 오전 근무자에게 인수인계 사항 전달\n1. 싱크대 음식물 배수구 청소\n2. 설거지 구역 청소\n  - 화구 세정제로 기름 제거\n3. 가스 전원 OFF\n4. 일반 쓰레기 압축\n5. 일반/음식물 쓰레기통 초파리 퇴치제 사용\n6. 입구 간판 회수\n7. 캡스 경비 요청`;
            
            if (doc.exists) {
                content = doc.data().content || '';
                closing = doc.data().closing || '';
            } else {
                content = defaultContent;
                closing = defaultClosing;
                db.collection('settings').doc('rules').set({ content, closing });
            }
            if (handoverRulesDisplay) {
                let displayHtml = content
                    .replace(/영칼로리포케 부산경성대부경대점 기본 규칙/g, '<strong style="font-size: 1.1rem; color: var(--primary);">영칼로리포케 부산경성대부경대점 기본 규칙</strong>')
                    .replace(/\[위생\]/g, '<strong style="color: #10b981;">[위생]</strong>')
                    .replace(/\[복지\]/g, '<strong style="color: #3b82f6;">[복지]</strong>')
                    .replace(/🚫무단 취식 적발 시 알바비 차감🚫/g, '<strong style="color: var(--danger);">🚫무단 취식 적발 시 알바비 차감🚫</strong>');
                handoverRulesDisplay.innerHTML = displayHtml;
            }
            if (adminRulesInput && document.activeElement !== adminRulesInput) {
                adminRulesInput.value = content;
            }

            if (handoverClosingDisplay) {
                let displayClosingHtml = closing
                    .replace(/🪟 홀/g, '<strong style="color: #3b82f6;">🪟 홀</strong>')
                    .replace(/🍳 주방/g, '<strong style="color: #f59e0b;">🍳 주방</strong>')
                    .replace(/✅ 마무리/g, '<strong style="color: #ec4899;">✅ 마무리</strong>');
                handoverClosingDisplay.innerHTML = displayClosingHtml;
            }
            if (adminClosingInput && document.activeElement !== adminClosingInput) {
                adminClosingInput.value = closing.replace(/^📌 마감 청소 안내\n*/, '');
            }
        });
        
        // Configs
        db.collection('settings').doc('admin').onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                adminPassword = data.password || '0000';
                defaultWage = data.defaultWage !== undefined ? data.defaultWage : 10320;
                const wageInput = document.getElementById('emp-wage');
                if (wageInput) {
                    wageInput.placeholder = `기본 ${defaultWage}`;
                    if(wageInput.value === '' || wageInput.value == 10320 || wageInput.value == 10030) {
                        wageInput.value = defaultWage;
                    }
                }
            } else {
                adminPassword = '0000';
                defaultWage = 10320;
            }
        });
    }

    const openDefaultWageBtn = document.getElementById('open-default-wage-btn');
    const defaultWageModal = document.getElementById('default-wage-modal');
    const cancelDefaultWageBtn = document.getElementById('cancel-default-wage-btn');
    const confirmDefaultWageBtn = document.getElementById('confirm-default-wage-btn');
    const defaultWageInput = document.getElementById('default-wage-input');

    if (openDefaultWageBtn) {
        openDefaultWageBtn.addEventListener('click', () => {
            defaultWageInput.value = defaultWage;
            defaultWageModal.style.display = 'flex';
        });
    }

    if (cancelDefaultWageBtn) {
        cancelDefaultWageBtn.addEventListener('click', () => {
            defaultWageModal.style.display = 'none';
        });
    }

    if (confirmDefaultWageBtn) {
        confirmDefaultWageBtn.addEventListener('click', async () => {
            const wage = defaultWageInput.value;
            const parsed = parseInt(wage.trim(), 10);
            if (!isNaN(parsed) && parsed >= 0) {
                await db.collection('settings').doc('admin').set({ defaultWage: parsed }, { merge: true });
                defaultWageModal.style.display = 'none';
            } else {
                alert('유효한 숫자를 입력해주세요.');
            }
        });
    }

    if (closeMobileDailyBtn) {
        closeMobileDailyBtn.addEventListener('click', () => {
            mobileDailyModal.style.display = 'none';
        });
    }

    // Initialize Selects Listeners
    // Modal Event Listeners
    cancelPasswordBtn.addEventListener('click', () => {
        passwordModal.style.display = 'none';
        salaryPasswordInput.value = '';
    });

    confirmPasswordBtn.addEventListener('click', checkPassword);
    salaryPasswordInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') checkPassword();
    });

    function checkPassword() {
        const pwd = salaryPasswordInput.value;
        if(pwd === adminPassword) {
            passwordModal.style.display = 'none';
            salaryPasswordInput.value = '';
            
            if (passwordTargetAction === 'salary') {
                setViewMode('salary');
            } else if (passwordTargetAction === 'manage-presets') {
                presetManageModal.style.display = 'flex';
            } else if (passwordTargetAction === 'clear') {
                executeClearSchedules();
            } else if (passwordTargetAction === 'delete-schedule') {
                if (pendingScheduleId) {
                    removeSchedule(pendingScheduleId);
                    pendingScheduleId = null;
                }
            } else if (passwordTargetAction === 'edit-schedule') {
                if (pendingScheduleId) {
                    const sched = schedules.find(s => s.id === pendingScheduleId);
                    if (sched) {
                        editSchedEmpName.textContent = sched.empName;
                        editSchedEmpColor.style.background = sched.color1;
                        
                        editSchedStartInput.value = sched.start;
                        editSchedEndInput.value = sched.end;
                        
                        if (viewMode === 'daily') {
                            editSchedDateWrapper.style.display = 'none';
                            editSchedWeekdayWrapper.style.display = 'none';
                        } else if (viewMode === 'weekly') {
                            editSchedDateWrapper.style.display = 'none';
                            editSchedWeekdayWrapper.style.display = 'block';
                            
                            editSchedWeekdaySelect.innerHTML = '';
                            const weekDates = getWeekDates(currentDate);
                            weekDates.forEach(d => {
                                const dStr = formatDateString(d);
                                const option = document.createElement('option');
                                option.value = dStr;
                                option.textContent = `${dStr} (${getDayName(d)})`;
                                if (dStr === sched.date) option.selected = true;
                                editSchedWeekdaySelect.appendChild(option);
                            });
                        } else if (viewMode === 'monthly' || viewMode === 'salary') {
                            editSchedDateWrapper.style.display = 'block';
                            editSchedWeekdayWrapper.style.display = 'none';
                            editSchedDateInput.value = sched.date;
                        }

                        editScheduleModal.style.display = 'flex';
                    }
                }
            }
        } else {
            alert('비밀번호가 일치하지 않습니다.');
            salaryPasswordInput.value = '';
        }
    }

    openChangePwBtn.addEventListener('click', () => {
        changePasswordModal.style.display = 'flex';
    });

    cancelChangePwBtn.addEventListener('click', () => {
        changePasswordModal.style.display = 'none';
        currentPwInput.value = '';
        newPwInput.value = '';
        confirmNewPwInput.value = '';
    });

    confirmChangePwBtn.addEventListener('click', async () => {
        const current = currentPwInput.value;
        const newPw = newPwInput.value;
        const confirmPw = confirmNewPwInput.value;

        if (current !== adminPassword) {
            alert('현재 비밀번호가 일치하지 않습니다.');
            return;
        }
        if (newPw.length !== 4) {
            alert('새 비밀번호는 4자리여야 합니다.');
            return;
        }
        if (newPw !== confirmPw) {
            alert('새 비밀번호가 서로 일치하지 않습니다.');
            return;
        }

        try {
            await db.collection('settings').doc('admin').set({ password: newPw }, { merge: true });
            alert('비밀번호가 성공적으로 변경되었습니다.');
            changePasswordModal.style.display = 'none';
            currentPwInput.value = '';
            newPwInput.value = '';
            confirmNewPwInput.value = '';
        } catch (e) {
            console.error('Error updating password', e);
            alert('비밀번호 변경에 실패했습니다.');
        }
    });

    // Event Listeners
    addEmpBtn.addEventListener('click', addEmployee);
    empNameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addEmployee(); });
    
    scheduleModeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if(e.target.value === 'single') {
                singleDateWrapper.style.display = 'block';
                recurringDateWrapper.style.display = 'none';
            } else {
                singleDateWrapper.style.display = 'none';
                recurringDateWrapper.style.display = 'block';
            }
        });
    });

    addScheduleBtn.addEventListener('click', addSchedule);
    
    if (managePresetsBtn) {
        managePresetsBtn.addEventListener('click', () => {
            presetManageModal.style.display = 'flex';
        });
    }
    
    if (closePresetManageBtn) {
        closePresetManageBtn.addEventListener('click', () => {
            presetManageModal.style.display = 'none';
        });
    }
    
    if (addPresetBtn) {
        addPresetBtn.addEventListener('click', async () => {
            const name = newPresetName.value.trim();
            const start = newPresetStart.value;
            const end = newPresetEnd.value;
            
            if (!name || !start || !end) {
                alert('프리셋 이름과 시간을 모두 입력해주세요.');
                return;
            }
            
            try {
                await db.collection('presets').add({
                    name, start, end, createdAt: new Date()
                });
                newPresetName.value = '';
            } catch (e) {
                console.error('Error adding preset', e);
            }
        });
    }

    if (updatePresetBtn) {
        updatePresetBtn.addEventListener('click', async () => {
            if (!editingPresetId) return;
            const name = newPresetName.value.trim();
            const start = newPresetStart.value;
            const end = newPresetEnd.value;
            
            if (!name || !start || !end) {
                alert('프리셋 이름과 시간을 모두 입력해주세요.');
                return;
            }
            
            try {
                await db.collection('presets').doc(editingPresetId).update({
                    name, start, end
                });
                resetPresetForm();
            } catch (e) {
                console.error('Error updating preset', e);
            }
        });
    }

    if (cancelEditPresetBtn) {
        cancelEditPresetBtn.addEventListener('click', () => {
            resetPresetForm();
        });
    }

    function resetPresetForm() {
        editingPresetId = null;
        newPresetName.value = '';
        newPresetStart.value = '09:00';
        newPresetEnd.value = '14:00';
        addPresetBtn.style.display = 'block';
        updatePresetBtn.style.display = 'none';
        cancelEditPresetBtn.style.display = 'none';
    }
    
    function renderPresetDropdown() {
        if (!schedulePreset) return;
        const currentVal = schedulePreset.value;
        schedulePreset.innerHTML = '<option value="">직접 입력</option>';
        presets.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            schedulePreset.appendChild(opt);
        });
        if (currentVal && presets.some(p => p.id === currentVal)) {
            schedulePreset.value = currentVal;
        }
    }
    
    function renderPresetManageList() {
        if (!presetListEl) return;
        presetListEl.innerHTML = '';
        presets.forEach(p => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            li.style.padding = '0.5rem';
            li.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
            li.innerHTML = `
                <span style="flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    <strong>${p.name}</strong> <span style="color:var(--text-muted); font-size:0.85rem; margin-left:0.5rem;">${p.start} ~ ${p.end}</span>
                </span>
                <div style="display: flex; gap: 0.2rem;">
                    <button class="edit-preset-btn btn text" style="color:var(--text-muted); padding:0.2rem 0.5rem; font-size: 0.9rem;" data-id="${p.id}">✏️</button>
                    <button class="delete-preset-btn btn text" style="color:var(--danger); padding:0.2rem 0.5rem; font-size: 1.1rem;" data-id="${p.id}">&times;</button>
                </div>
            `;
            li.querySelector('.edit-preset-btn').addEventListener('click', (e) => {
                const pid = e.target.dataset.id;
                const targetPreset = presets.find(pr => pr.id === pid);
                if (targetPreset) {
                    editingPresetId = pid;
                    newPresetName.value = targetPreset.name;
                    newPresetStart.value = targetPreset.start;
                    newPresetEnd.value = targetPreset.end;
                    
                    addPresetBtn.style.display = 'none';
                    updatePresetBtn.style.display = 'block';
                    cancelEditPresetBtn.style.display = 'block';
                }
            });
            li.querySelector('.delete-preset-btn').addEventListener('click', (e) => {
                const pid = e.target.dataset.id;
                showConfirm('이 프리셋을 삭제하시겠습니까?', async () => {
                    await db.collection('presets').doc(pid).delete();
                });
            });
            presetListEl.appendChild(li);
        });
    }
    
    if (schedulePreset) {
        schedulePreset.addEventListener('change', (e) => {
            const val = e.target.value;
            const p = presets.find(pr => pr.id === val);
            if (p) {
                startTimeInput.value = p.start;
                endTimeInput.value = p.end;
            }
        });
    }
    
    prevDateBtn.addEventListener('click', () => changeDate(-1));
    nextDateBtn.addEventListener('click', () => changeDate(1));
    todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        updateBoard();
    });
    
    const addInventoryBtn = document.getElementById('add-inventory-btn');
    const newInventoryNameInput = document.getElementById('new-inventory-name');
    
    if (addInventoryBtn) {
        addInventoryBtn.addEventListener('click', async () => {
            const name = document.getElementById('new-inventory-name').value.trim();
            const category = document.getElementById('new-inventory-category') ? document.getElementById('new-inventory-category').value : 'none';
            if (!name) return;
            try {
                await db.collection('inventory').add({
                    name: name,
                    category: (category === 'none' || category === 'all') ? '' : category,
                    quantity: 0,
                    threshold: 0,
                    isOrdered: false,
                    status: 'good',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                document.getElementById('new-inventory-name').value = '';
                // Don't reset category filter so they can keep adding to the same category
            } catch (e) {
                console.error('Error adding inventory', e);
            }
        });
    }

    viewDailyBtn.addEventListener('click', () => setViewMode('daily'));
    viewWeeklyBtn.addEventListener('click', () => setViewMode('weekly'));
    viewMonthlyBtn.addEventListener('click', () => setViewMode('monthly'));
    viewInventoryBtn.addEventListener('click', () => setViewMode('inventory'));
    if (viewHandoverBtn) viewHandoverBtn.addEventListener('click', () => setViewMode('handover'));
    viewSalaryBtn.addEventListener('click', () => {
        if (viewMode === 'salary') return;
        passwordTargetAction = 'salary';
        passwordModal.style.display = 'flex';
        salaryPasswordInput.focus();
    });
    
    const toggleDisposalBtn = document.getElementById('toggle-disposal-btn');
    const backToInventoryBtn = document.getElementById('back-to-inventory-btn');
    if (toggleDisposalBtn) {
        toggleDisposalBtn.addEventListener('click', () => setViewMode('disposal'));
    }
    if (backToInventoryBtn) {
        backToInventoryBtn.addEventListener('click', () => setViewMode('inventory'));
    }
    
    clearSchedulesBtn.addEventListener('click', () => {
        passwordTargetAction = 'clear';
        passwordModal.style.display = 'flex';
        salaryPasswordInput.focus();
    });

    if (cancelEditSchedBtn) {
        cancelEditSchedBtn.addEventListener('click', () => {
            editScheduleModal.style.display = 'none';
            pendingScheduleId = null;
        });
    }

    if (deleteEditSchedBtn) {
        deleteEditSchedBtn.addEventListener('click', () => {
            showConfirm('해당 근무를 삭제하시겠습니까?', () => {
                if (pendingScheduleId) {
                    removeSchedule(pendingScheduleId);
                    editScheduleModal.style.display = 'none';
                    pendingScheduleId = null;
                }
            });
        });
    }

    if (confirmEditSchedBtn) {
        confirmEditSchedBtn.addEventListener('click', async () => {
            const start = editSchedStartInput.value;
            const end = editSchedEndInput.value;
            
            let newDate = null;
            if (viewMode === 'weekly') {
                newDate = editSchedWeekdaySelect.value;
            } else if (viewMode === 'monthly' || viewMode === 'salary') {
                newDate = editSchedDateInput.value;
            }
            
            if (!start || !end) { alert('시간을 입력해주세요.'); return; }
            if (pendingScheduleId) {
                try {
                    confirmEditSchedBtn.textContent = '저장 중...';
                    const updateData = { start, end };
                    if (newDate) updateData.date = newDate;
                    
                    await db.collection('schedules').doc(pendingScheduleId).update(updateData);
                    editScheduleModal.style.display = 'none';
                    pendingScheduleId = null;
                } catch (e) {
                    console.error(e);
                    alert('수정에 실패했습니다.');
                } finally {
                    confirmEditSchedBtn.textContent = '저장';
                }
            }
        });
    }

    // Quick Add Modal Logic
    function closeQuickAddModal() {
        quickAddModal.style.display = 'none';
        quickAddDateInput.value = '';
        quickAddEmpSelect.value = '';
        quickAddStartInput.value = '09:00';
        quickAddEndInput.value = '14:00';
    }

    if (cancelQuickAddTopBtn) cancelQuickAddTopBtn.addEventListener('click', closeQuickAddModal);
    if (cancelQuickAddBtn) cancelQuickAddBtn.addEventListener('click', closeQuickAddModal);
    
    if (quickAddPresetSelect) {
        quickAddPresetSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            const p = presets.find(pr => pr.id === val);
            if (p) {
                quickAddStartInput.value = p.start;
                quickAddEndInput.value = p.end;
            }
        });
    }

    if (confirmQuickAddBtn) {
        confirmQuickAddBtn.addEventListener('click', async () => {
            const dateStr = quickAddDateInput.value;
            const empId = quickAddEmpSelect.value;
            const start = quickAddStartInput.value;
            const end = quickAddEndInput.value;
            
            if (!empId) { alert('근무자를 선택해주세요.'); return; }
            if (!start || !end) { alert('시간을 입력해주세요.'); return; }
            
            const emp = employees.find(e => e.id === empId);
            if (!emp) return;
            
            try {
                confirmQuickAddBtn.textContent = '등록 중...';
                await db.collection('schedules').add({
                    date: dateStr,
                    empId: emp.id,
                    empName: emp.name,
                    start, end,
                    color1: emp.color1,
                    color2: emp.color2
                });
                closeQuickAddModal();
            } catch (e) {
                console.error(e);
                alert('스케줄 추가 실패');
            } finally {
                confirmQuickAddBtn.textContent = '등록';
            }
        });
    }

    async function executeClearSchedules() {
        let msg = '초기화하시겠습니까?';
        let toDelete = [];

        if (viewMode === 'daily') {
            msg = '현재 날짜의 모든 스케줄을 클라우드에서 삭제합니다. 진행하시겠습니까?';
            const dateStr = formatDateString(currentDate);
            toDelete = schedules.filter(s => s.date === dateStr);
        } else if (viewMode === 'weekly') {
            msg = '현재 주간의 모든 스케줄을 클라우드에서 삭제합니다. 진행하시겠습니까?';
            const weekDates = getWeekDates(currentDate).map(d => formatDateString(d));
            toDelete = schedules.filter(s => weekDates.includes(s.date));
        } else {
            msg = '현재 월의 모든 스케줄을 클라우드에서 삭제합니다. 진행하시겠습니까?';
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            toDelete = schedules.filter(s => {
                const d = new Date(s.date);
                return d.getFullYear() === year && d.getMonth() === month;
            });
        }
            
        if(confirm(msg)) {
            try {
                const batch = db.batch();
                toDelete.forEach(s => {
                    batch.delete(db.collection('schedules').doc(s.id));
                });
                await batch.commit();
            } catch (e) {
                console.error(e);
            }
        }
    }

    // Helpers
    const publicHolidays = [
        '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18', '2026-03-01', '2026-05-05', '2026-05-24', '2026-06-06', '2026-08-15', '2026-09-24', '2026-09-25', '2026-09-26', '2026-10-03', '2026-10-09', '2026-12-25',
        '2027-01-01', '2027-02-06', '2027-02-07', '2027-02-08', '2027-03-01', '2027-05-05', '2027-05-13', '2027-06-06', '2027-08-15', '2027-09-14', '2027-09-15', '2027-09-16', '2027-10-03', '2027-10-09', '2027-12-25'
    ];

    function isPublicHoliday(dateStr) {
        return publicHolidays.includes(dateStr);
    }

    function formatDateString(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    function getDayName(date) {
        return ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    }
    
    function changeDate(dir) {
        if (viewMode === 'daily') {
            currentDate.setDate(currentDate.getDate() + dir);
        } else if (viewMode === 'weekly') {
            currentDate.setDate(currentDate.getDate() + (dir * 7));
        } else {
            currentDate.setMonth(currentDate.getMonth() + dir);
        }
        updateBoard();
    }
    
    function setViewMode(mode) {
        viewMode = mode;
        viewDailyBtn.classList.remove('active');
        viewWeeklyBtn.classList.remove('active');
        viewMonthlyBtn.classList.remove('active');
        viewSalaryBtn.classList.remove('active');
        viewInventoryBtn.classList.remove('active');
        if (viewRulesBtn) viewRulesBtn.classList.remove('active');
        if (viewHandoverBtn) viewHandoverBtn.classList.remove('active');
        
        viewContainerDaily.style.display = 'none';
        viewContainerWeekly.style.display = 'none';
        viewContainerMonthly.style.display = 'none';
        viewContainerSalary.style.display = 'none';
        viewContainerInventory.style.display = 'none';
        if (viewContainerRules) viewContainerRules.style.display = 'none';
        if (viewContainerDisposal) viewContainerDisposal.style.display = 'none';
        if (viewContainerHandover) viewContainerHandover.style.display = 'none';
        document.getElementById('date-controls-wrapper').style.visibility = 'visible'; // show board controls by default

        if (mode === 'daily') {
            viewDailyBtn.classList.add('active');
            viewContainerDaily.style.display = 'block';
        } else if (mode === 'weekly') {
            viewWeeklyBtn.classList.add('active');
            viewContainerWeekly.style.display = 'block';
        } else if (mode === 'monthly') {
            viewMonthlyBtn.classList.add('active');
            viewContainerMonthly.style.display = 'block';
        } else if (mode === 'salary') {
            viewSalaryBtn.classList.add('active');
            viewContainerSalary.style.display = 'block';
        } else if (mode === 'inventory') {
            viewInventoryBtn.classList.add('active');
            viewContainerInventory.style.display = 'block';
            document.getElementById('date-controls-wrapper').style.visibility = 'hidden'; // hide board controls for inventory
            renderInventoryCheckStatus();
            renderInventory(); // Load inventory data
        } else if (mode === 'disposal') {
            viewInventoryBtn.classList.add('active'); // Keep inventory tab highlighted
            if (viewContainerDisposal) viewContainerDisposal.style.display = 'block';
            document.getElementById('date-controls-wrapper').style.visibility = 'hidden'; 
            renderInventoryCheckStatus();
            renderDisposalArchive();
        } else if (mode === 'rules') {
            if (viewRulesBtn) viewRulesBtn.classList.add('active');
            if (viewContainerRules) viewContainerRules.style.display = 'block';
            document.getElementById('date-controls-wrapper').style.visibility = 'hidden';
        } else if (mode === 'handover') {
            if (viewHandoverBtn) viewHandoverBtn.classList.add('active');
            if (viewContainerHandover) viewContainerHandover.style.display = 'block';
            document.getElementById('date-controls-wrapper').style.visibility = 'hidden'; 
            renderHandovers();
        }
        
        if (mode !== 'inventory' && mode !== 'disposal' && mode !== 'rules' && mode !== 'handover') {
            updateBoard();
        }
    }
    
    function getWeekDates(baseDate) {
        const dates = [];
        const current = new Date(baseDate);
        const day = current.getDay();
        const diff = current.getDate() - day + (day === 0 ? -6 : 1);
        current.setDate(diff);
        
        for(let i=0; i<7; i++) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }

    function updateAppHeaderDate() {
        const today = new Date();
        currentDateEl.textContent = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')} (${getDayName(today)})`;
    }

    function updateBoard() {
        if (viewMode === 'daily') {
            const dateStr = formatDateString(currentDate);
            boardDateDisplay.textContent = `${dateStr} (${getDayName(currentDate)})`;
            renderTimeline(dateStr);
            renderDailyHandover(dateStr);
        } else if (viewMode === 'weekly') {
            const weekDates = getWeekDates(currentDate);
            // 한국/국제 표준(ISO 8601) 기준: 해당 주의 목요일이 속한 월을 기준으로 주차를 계산
            const thursday = weekDates[3]; 
            const yearStr = String(thursday.getFullYear()).slice(2);
            const month = thursday.getMonth() + 1;
            
            // 목요일의 날짜(1~31)를 7로 나누어 올림하면 정확한 주차가 나옴
            const weekOfMonth = Math.floor((thursday.getDate() - 1) / 7) + 1;
            
            boardDateDisplay.textContent = `${yearStr}년 ${month}월 ${weekOfMonth}주차`;
            renderWeeklyTable(weekDates);
        } else {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            boardDateDisplay.textContent = `${year}년 ${month}월`;
            if (viewMode === 'monthly') {
                renderMonthlyCalendar(currentDate);
            } else if (viewMode === 'salary') {
                renderSalaryView(currentDate);
            }
        }
        
        if (viewMode === 'salary' && adminMonthlyGrid) {
                renderAdminCalendar(currentDate);
        }
        scheduleDateInput.value = formatDateString(currentDate);
    }
    
    // --- Inventory Categories ---
    if (manageCategoryBtn) {
        manageCategoryBtn.addEventListener('click', () => {
            categoryManageModal.style.display = 'flex';
        });
    }
    
    if (closeCategoryManageBtn) {
        closeCategoryManageBtn.addEventListener('click', () => {
            categoryManageModal.style.display = 'none';
        });
    }
    
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', async () => {
            const name = newCategoryNameInput.value.trim();
            if (!name) return;
            if (inventoryCategories.includes(name)) {
                alert('이미 존재하는 카테고리입니다.');
                return;
            }
            try {
                await db.collection('settings').doc('inventoryCategories').set({
                    list: firebase.firestore.FieldValue.arrayUnion(name)
                }, { merge: true });
                newCategoryNameInput.value = '';
            } catch (e) {
                console.error(e);
                alert('카테고리 추가 실패');
            }
        });
    }
    
    window.deleteInventoryCategory = async function(catName) {
        showConfirm(`'${catName}' 카테고리를 정말 삭제하시겠습니까?`, async () => {
            try {
                await db.collection('settings').doc('inventoryCategories').set({
                    list: firebase.firestore.FieldValue.arrayRemove(catName)
                }, { merge: true });
            } catch (e) {
                console.error(e);
                alert('카테고리 삭제 실패');
            }
        });
    };

    function renderInventoryCategories() {
        if (categoryListEl) {
            categoryListEl.innerHTML = '';
            inventoryCategories.forEach(cat => {
                const li = document.createElement('li');
                li.style.cssText = 'padding: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;';
                li.innerHTML = `
                    <span>${cat}</span>
                    <button class="btn text" style="color: var(--danger); padding: 0.2rem 0.5rem;" onclick="deleteInventoryCategory('${cat}')">삭제</button>
                `;
                categoryListEl.appendChild(li);
            });
        }
        
        if (newInventoryCategorySelect) {
            const prevValue = newInventoryCategorySelect.value;
            newInventoryCategorySelect.innerHTML = '<option value="all" selected>전체 보기</option><option value="none">구분 없음</option>';
            inventoryCategories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.textContent = cat;
                newInventoryCategorySelect.appendChild(opt);
            });
            if (prevValue && (inventoryCategories.includes(prevValue) || prevValue === 'none' || prevValue === 'all')) {
                newInventoryCategorySelect.value = prevValue;
            }
        }
    }

    // --- Inventory Management ---
    window.recalcInventoryStatus = function(id) {
        const row = document.getElementById(`inv-row-${id}`);
        if (!row) return;
        const qty = parseInt(row.querySelector('.inv-qty').value) || 0;
        const thres = parseInt(row.querySelector('.inv-threshold').value) || 0;
        const isOrdered = row.querySelector('.inv-ordered').checked;
        const badgeContainer = row.querySelector('.inv-badge-container');
        
        if (isOrdered) {
            badgeContainer.innerHTML = `<span class="status-badge status-ordered">배송 중<br>🚚</span>`;
        } else if (qty < thres) {
            badgeContainer.innerHTML = `<span class="status-badge status-danger">부족<br>(발주요망)</span>`;
        } else {
            badgeContainer.innerHTML = `<span class="status-badge status-good">충분<br>(여유)</span>`;
        }
    };
    
    window.updateLocalEdit = function(id, field, value, isCheckbox = false) {
        if (!localInventoryEdits[id]) localInventoryEdits[id] = {};
        localInventoryEdits[id][field] = value;
        if (field === 'quantity' || field === 'threshold' || field === 'isOrdered') {
            recalcInventoryStatus(id);
        }
    };

    window.saveAllInventory = async function() {
        const ids = Object.keys(localInventoryEdits);
        if (ids.length === 0) {
            alert('저장할 변경사항이 없습니다.');
            return;
        }
        const saveAllBtn = document.getElementById('save-all-inventory-btn');
        if(saveAllBtn) {
            saveAllBtn.textContent = '저장 중...';
            saveAllBtn.disabled = true;
        }
        
        const batch = db.batch();
        ids.forEach(id => {
            const data = inventoryData[id] || { name: '알 수 없음' };
            const edits = localInventoryEdits[id];
            
            const newName = edits.name !== undefined ? edits.name : (data.name || '');
            const newCategory = edits.category !== undefined ? edits.category : (data.category || '');
            const qty = edits.quantity !== undefined ? edits.quantity : (data.quantity || 0);
            const thres = edits.threshold !== undefined ? edits.threshold : (data.threshold || 0);
            const isOrdered = edits.isOrdered !== undefined ? edits.isOrdered : (data.isOrdered || false);
            
            let status = 'good';
            if (isOrdered) status = 'ordered';
            else if (qty < thres) status = 'danger';

            const payload = {
                name: newName,
                category: newCategory === 'none' ? '' : newCategory,
                quantity: qty,
                threshold: thres,
                isOrdered: isOrdered,
                status: status,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            if (edits.receivedDate !== undefined) payload.receivedDate = edits.receivedDate;
            if (edits.openedDate !== undefined) payload.openedDate = edits.openedDate;
            if (edits.actionDate !== undefined) payload.actionDate = edits.actionDate;
            if (edits.memo !== undefined) payload.memo = edits.memo;

            batch.set(db.collection('inventory').doc(id), payload, { merge: true });
        });
        
        try {
            await batch.commit();
            localInventoryEdits = {}; // Clear all local edits
            showToast('✅ 전체 재고가 성공적으로 저장되었습니다!');
            if(saveAllBtn) {
                saveAllBtn.textContent = '일괄 저장 ✓';
                setTimeout(() => {
                    saveAllBtn.textContent = '💾 변경사항 일괄 저장';
                    saveAllBtn.disabled = false;
                }, 2000);
            }
        } catch (e) {
            console.error('Error saving all inventory', e);
            alert('일괄 저장에 실패했습니다.');
            if(saveAllBtn) {
                saveAllBtn.textContent = '💾 변경사항 일괄 저장';
                saveAllBtn.disabled = false;
            }
        }
    };

    window.saveInventoryItem = async function(id) {
        const row = document.getElementById(`inv-row-${id}`);
        if (!row) return;
        
        const btn = row.querySelector('.save-inv-btn');
        const originalText = btn.textContent;
        btn.textContent = '저장중...';
        btn.disabled = true;

        const data = inventoryData[id] || { name: '알 수 없음' };
        
        const newName = row.querySelector('.inv-name') ? row.querySelector('.inv-name').value.trim() || data.name : data.name;
        const catSelect = row.querySelector('.inv-category');
        const newCategory = catSelect ? (catSelect.value === 'none' ? '' : catSelect.value) : (data.category || '');
        
        const qty = parseInt(row.querySelector('.inv-qty').value) || 0;
        const thres = parseInt(row.querySelector('.inv-threshold').value) || 0;
        const isOrdered = row.querySelector('.inv-ordered').checked;
        
        let status = 'good';
        if (isOrdered) status = 'ordered';
        else if (qty < thres) status = 'danger';

        const payload = {
            id: id,
            name: newName,
            category: newCategory,
            quantity: qty,
            threshold: thres,
            isOrdered: isOrdered,
            status: status,
            receivedDate: row.querySelector('.inv-received').value,
            openedDate: row.querySelector('.inv-opened').value,
            actionDate: row.querySelector('.inv-action').value,
            memo: row.querySelector('.inv-memo').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Alert removed
        try {
            await db.collection('inventory').doc(id).set(payload, { merge: true });
            delete localInventoryEdits[id]; // Clear local edit for this item
            showToast(`✅ ${newName} 품목이 저장되었습니다!`);
            btn.textContent = '저장됨 ✓';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
            }, 2000);
        } catch(e) {
            console.error('Error saving inventory', e);
            btn.textContent = '실패';
            btn.disabled = false;
        }
    };
    
    window.archiveDisposal = function(id) {
        const row = document.getElementById(`inv-row-${id}`);
        if (!row) return;
        
        const qty = parseInt(row.querySelector('.inv-qty').value) || 0;
        const memo = row.querySelector('.inv-memo').value;
        const data = inventoryData[id];
        if (!data) return;
        
        if (qty <= 0) {
            alert('현재 수량이 0개입니다. 폐기할 항목이 없습니다.');
            return;
        }

        currentDisposalItem = { id, currentQty: qty };
        disposalItemNameEl.textContent = data.name;
        disposalCurrentQtyEl.textContent = qty;
        disposalQtyInput.max = qty;
        disposalQtyInput.value = qty; // Default to all
        disposalMemoInput.value = ''; // Do not load inventory memo, keep it separate
        
        disposalModal.style.display = 'flex';
    };
    
    window.deleteDisposalRecord = async function(dispId) {
        showConfirm('이 폐기 기록을 완전히 삭제하시겠습니까?', async () => {
            try {
                await db.collection('disposals').doc(dispId).delete();
            } catch(e) {
                console.error('Error deleting disposal record', e);
            }
        });
    };

    window.deleteInventoryItem = async function(id) {
        showConfirm('정말 이 품목 자체를 삭제하시겠습니까? (재고 목록에서 영구 삭제됩니다)', async () => {
            try {
                await db.collection('inventory').doc(id).delete();
                delete inventoryData[id];
                renderInventory();
            } catch (e) {
                console.error('Error deleting inventory', e);
            }
        });
    };

    function renderDisposalArchive() {
        const tbody = document.getElementById('disposal-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        const mobileList = document.getElementById('mobile-disposal-list');
        if (mobileList) mobileList.innerHTML = '';

        const items = Object.values(disposalData).sort((a, b) => {
            const timeA = a.archivedAt ? a.archivedAt.toMillis() : 0;
            const timeB = b.archivedAt ? b.archivedAt.toMillis() : 0;
            return timeB - timeA; // Descending order (newest first)
        });

        items.forEach(data => {
            let dateStr = '';
            let dateOnlyStr = '';
            if (data.archivedAt) {
                const d = data.archivedAt.toDate();
                dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                dateOnlyStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            }

            // 1. Desktop Row
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dateStr}</td>
                <td style="font-weight: 600;">${data.name}</td>
                <td>${data.quantity || 0}</td>
                <td style="text-align: left;">${data.memo || ''}</td>
                <td><button class="btn outline-danger btn-sm" onclick="deleteDisposalRecord('${data.id}')">삭제</button></td>
            `;
            tbody.appendChild(tr);

            // 2. Mobile Card
            if (mobileList) {
                const card = document.createElement('div');
                card.className = 'mobile-inventory-card';
                card.innerHTML = `
                    <div class="mobile-inventory-card-header">
                        <span style="color: var(--text-muted); font-size: 0.85rem;">폐기일: ${dateOnlyStr}</span>
                        <button class="btn outline-danger btn-sm" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;" onclick="deleteDisposalRecord('${data.id}')">삭제</button>
                    </div>
                    <div style="font-size: 1.1rem; font-weight: bold; margin-bottom: 0.3rem;">${data.name} <span style="font-size:0.9rem; color:var(--text-muted); font-weight:normal;">(수량: ${data.quantity || 0})</span></div>
                    <div style="background: rgba(0,0,0,0.3); padding: 0.8rem; border-radius: 4px; border-left: 2px solid var(--danger); font-size: 0.85rem; color: #ddd; margin-top: 0.5rem;">${data.memo || '사유 없음'}</div>
                `;
                mobileList.appendChild(card);
            }
        });
    }

    const checkBanner = document.getElementById('inventory-check-banner');
    const checkIcon = document.getElementById('inventory-check-icon');
    const checkTitle = document.getElementById('inventory-check-title');
    const checkDesc = document.getElementById('inventory-check-desc');
    const checkBtn = document.getElementById('complete-inventory-check-btn');

    function renderInventoryCheckStatus() {
        if (!checkBanner) return;
        
        const todayStr = formatDateString(new Date());
        let isCheckedToday = false;
        let checkedTimeStr = '';

        if (inventoryCheckData && inventoryCheckData.lastCheckedDate === todayStr) {
            isCheckedToday = true;
            if (inventoryCheckData.checkedAt) {
                const d = inventoryCheckData.checkedAt.toDate();
                checkedTimeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            }
        }

        if (isCheckedToday) {
            checkBanner.style.background = 'rgba(16, 185, 129, 0.1)';
            checkBanner.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            checkIcon.textContent = '✅';
            checkTitle.textContent = `오늘(${todayStr}) 재고 점검: 완료 (${checkedTimeStr})`;
            checkTitle.style.color = '#10b981';
            checkDesc.textContent = '점검이 완료되었습니다. 고생하셨습니다!';
            checkBtn.textContent = '점검 취소';
            checkBtn.className = 'btn outline-danger';
        } else {
            checkBanner.style.background = 'rgba(239, 68, 68, 0.1)';
            checkBanner.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            checkIcon.textContent = '🔴';
            checkTitle.textContent = `오늘(${todayStr}) 재고 점검: 미완료`;
            checkTitle.style.color = 'white';
            checkDesc.textContent = '오전 근무자는 재고 확인 후 우측 버튼을 눌러주세요.';
            checkBtn.textContent = '점검 완료하기';
            checkBtn.className = 'btn primary';
        }
    }

    if (checkBtn) {
        checkBtn.addEventListener('click', async () => {
            const todayStr = formatDateString(new Date());
            const isCurrentlyChecked = inventoryCheckData && inventoryCheckData.lastCheckedDate === todayStr;

            checkBtn.disabled = true;
            try {
                if (isCurrentlyChecked) {
                    if (confirm('오늘의 재고 점검 상태를 미완료로 되돌리시겠습니까?')) {
                        await db.collection('settings').doc('inventoryCheck').set({
                            lastCheckedDate: '',
                            checkedAt: null
                        });
                    }
                } else {
                    await db.collection('settings').doc('inventoryCheck').set({
                        lastCheckedDate: todayStr,
                        checkedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            } catch (e) {
                console.error(e);
                alert('처리 실패');
            } finally {
                checkBtn.disabled = false;
            }
        });
    }

    if (newInventoryCategorySelect) {
        newInventoryCategorySelect.addEventListener('change', renderInventory);
    }

    function renderInventory() {
        if (!inventoryTbody) return;
        inventoryTbody.innerHTML = '';
        
        const getStatusHtml = (status) => {
            if (status === 'ordered') return `<span class="status-badge status-ordered">배송 중<br>🚚</span>`;
            if (status === 'danger') return `<span class="status-badge status-danger">부족<br>(발주요망)</span>`;
            return `<span class="status-badge status-good">충분<br>(여유)</span>`;
        };
        
        const categoryFilter = document.getElementById('new-inventory-category') ? document.getElementById('new-inventory-category').value : 'all';
        
        const items = Object.values(inventoryData).filter(data => {
            if (categoryFilter === 'all') return true;
            if (categoryFilter === 'none') return !data.category || data.category === '';
            return data.category === categoryFilter;
        }).sort((a, b) => {
            const catA = a.category || 'zzz'; // push no category to bottom
            const catB = b.category || 'zzz';
            if (catA < catB) return -1;
            if (catA > catB) return 1;
            
            if (a.createdAt && b.createdAt) return a.createdAt.toMillis() - b.createdAt.toMillis();
            return a.name.localeCompare(b.name);
        });

        const mobileInventoryList = document.getElementById('mobile-inventory-list');
        if (mobileInventoryList) mobileInventoryList.innerHTML = '';

        items.forEach(data => {
            const edits = localInventoryEdits[data.id] || {};
            const merged = { ...data, ...edits };
            
            const qty = merged.quantity || 0;
            const thres = merged.threshold || 0;
            const isOrdered = merged.isOrdered ? 'checked' : '';
            
            let currentStatus = 'good';
            if (merged.isOrdered) currentStatus = 'ordered';
            else if (qty < thres) currentStatus = 'danger';
            
            let catOptions = `<option value="none">구분 없음</option>`;
            inventoryCategories.forEach(cat => {
                const selected = merged.category === cat ? 'selected' : '';
                catOptions += `<option value="${cat}" ${selected}>${cat}</option>`;
            });

            // 1. Desktop Row
            const tr = document.createElement('tr');
            tr.id = `inv-row-${data.id}`;
            const catSelect = `<select class="inv-category" onchange="updateLocalEdit('${data.id}', 'category', this.value)" style="padding: 0.4rem; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white; width: 100%; font-size: 0.85rem;">${catOptions}</select>`;
            tr.innerHTML = `
                <td>${catSelect}</td>
                <td style="text-align: left; padding-left: 0.5rem; padding-right: 0.5rem;">
                    <input type="text" class="inv-name" value="${merged.name}" oninput="updateLocalEdit('${data.id}', 'name', this.value)" style="padding: 0.4rem; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: white; width: 100%; font-weight: 600; font-size: 0.95rem;">
                </td>
                <td>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 0.3rem;">
                        <input type="number" class="inv-qty inv-qty-input" value="${qty}" min="0" oninput="updateLocalEdit('${data.id}', 'quantity', parseInt(this.value)||0)">
                        <span style="color: var(--text-muted);">/</span>
                        <input type="number" class="inv-threshold inv-qty-input" value="${thres}" min="0" oninput="updateLocalEdit('${data.id}', 'threshold', parseInt(this.value)||0)" title="경고 기준 수량">
                    </div>
                </td>
                <td>
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 0.4rem;">
                        <div class="inv-badge-container">${getStatusHtml(currentStatus)}</div>
                        <label style="font-size: 0.75rem; color: var(--text-muted); cursor: pointer;">
                            <input type="checkbox" class="inv-ordered" onchange="updateLocalEdit('${data.id}', 'isOrdered', this.checked)" ${isOrdered}> 발주 완료
                        </label>
                    </div>
                </td>
                <td><input type="date" class="inv-received" value="${merged.receivedDate || ''}" onchange="updateLocalEdit('${data.id}', 'receivedDate', this.value)"></td>
                <td><input type="date" class="inv-opened" value="${merged.openedDate || ''}" onchange="updateLocalEdit('${data.id}', 'openedDate', this.value)"></td>
                <td><input type="date" class="inv-action" value="${merged.actionDate || ''}" onchange="updateLocalEdit('${data.id}', 'actionDate', this.value)"></td>
                <td><input type="text" class="inv-memo" value="${merged.memo || ''}" placeholder="메모 (사유 등)" oninput="updateLocalEdit('${data.id}', 'memo', this.value)"></td>
                <td>
                    <div style="display: flex; gap: 0.2rem; justify-content: center; margin-bottom: 0.3rem;">
                        <button class="btn primary btn-sm save-inv-btn" onclick="saveInventoryItem('${data.id}')">저장</button>
                        <button class="btn outline-danger btn-sm" onclick="deleteInventoryItem('${data.id}')" title="목록에서 삭제">삭제</button>
                    </div>
                    <button class="btn secondary btn-sm" style="width: 100%; font-size: 0.75rem; padding: 0.2rem;" onclick="archiveDisposal('${data.id}')">🗑️ 폐기 이관</button>
                </td>
            `;
            inventoryTbody.appendChild(tr);

            // 2. Mobile Card
            if (mobileInventoryList) {
                const card = document.createElement('div');
                card.className = 'mobile-inventory-card';
                card.innerHTML = `
                    <div class="mobile-inventory-card-header">
                        <select onchange="updateLocalEdit('${data.id}', 'category', this.value)" style="width: auto; padding: 0.3rem; font-size: 0.8rem; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2); color: var(--text-muted); border-radius: 4px;">${catOptions}</select>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            ${getStatusHtml(currentStatus)}
                            <label style="font-size: 0.75rem; color: var(--text-muted); cursor: pointer;"><input type="checkbox" onchange="updateLocalEdit('${data.id}', 'isOrdered', this.checked)" ${isOrdered}> 발주</label>
                        </div>
                    </div>
                    <input type="text" value="${merged.name}" oninput="updateLocalEdit('${data.id}', 'name', this.value)" style="font-size: 1.1rem; font-weight: bold; background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,0.2); border-radius: 0; padding: 0.2rem 0; color: white;">
                    
                    <div class="mobile-inventory-card-row" style="margin-top: 0.5rem;">
                        <span class="mobile-inventory-card-label">수량 / 기준</span>
                        <div style="display: flex; gap: 0.3rem; align-items: center;">
                            <input type="number" value="${qty}" min="0" oninput="updateLocalEdit('${data.id}', 'quantity', parseInt(this.value)||0)" style="width: 60px; text-align: center;">
                            <span style="color: var(--text-muted);">/</span>
                            <input type="number" value="${thres}" min="0" oninput="updateLocalEdit('${data.id}', 'threshold', parseInt(this.value)||0)" style="width: 60px; text-align: center;">
                        </div>
                    </div>
                    
                    <div class="mobile-inventory-card-row">
                        <span class="mobile-inventory-card-label">입고일</span>
                        <input type="date" value="${merged.receivedDate || ''}" onchange="updateLocalEdit('${data.id}', 'receivedDate', this.value)">
                    </div>
                    <div class="mobile-inventory-card-row">
                        <span class="mobile-inventory-card-label">개봉일</span>
                        <input type="date" value="${merged.openedDate || ''}" onchange="updateLocalEdit('${data.id}', 'openedDate', this.value)">
                    </div>
                    <div class="mobile-inventory-card-row">
                        <span class="mobile-inventory-card-label">손질/조리일</span>
                        <input type="date" value="${merged.actionDate || ''}" onchange="updateLocalEdit('${data.id}', 'actionDate', this.value)">
                    </div>
                    <div class="mobile-inventory-card-row">
                        <span class="mobile-inventory-card-label">메모</span>
                        <input type="text" value="${merged.memo || ''}" placeholder="메모 입력" oninput="updateLocalEdit('${data.id}', 'memo', this.value)">
                    </div>
                    
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                        <button class="btn primary" style="flex: 1;" onclick="saveInventoryItem('${data.id}')">저장</button>
                        <button class="btn outline-danger" onclick="deleteInventoryItem('${data.id}')">삭제</button>
                        <button class="btn secondary" onclick="archiveDisposal('${data.id}')">폐기</button>
                    </div>
                `;
                mobileInventoryList.appendChild(card);
            }
        });
    }

    // --- Handovers ---
    if (addHandoverBtn) {
        addHandoverBtn.addEventListener('click', async () => {
            const empId = handoverEmpSelect.value;
            const content = handoverContentInput.value.trim();
            
            if (!empId) {
                alert('작성자를 선택해주세요.'); return;
            }
            if (!content) {
                alert('인수인계 내용을 입력해주세요.'); return;
            }
            
            const emp = employees.find(e => e.id === empId);
            if (!emp) return;

            addHandoverBtn.disabled = true;
            try {
                await db.collection('handovers').add({
                    empId: emp.id,
                    empName: emp.name,
                    content: content,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    checkedBy: [] // Array of employee names who checked it
                });
                handoverContentInput.value = '';
                handoverEmpSelect.value = '';
            } catch (e) {
                console.error(e);
                alert('등록 실패');
            } finally {
                addHandoverBtn.disabled = false;
            }
        });
    }

    window.checkHandover = function(id) {
        pendingHandoverCheckId = id;
        if (handoverCheckEmpSelect) handoverCheckEmpSelect.value = '';
        if (handoverCheckModal) handoverCheckModal.style.display = 'flex';
    };

    if (confirmHandoverBtn) {
        confirmHandoverBtn.addEventListener('click', async () => {
            if (!pendingHandoverCheckId) return;
            const empId = handoverCheckEmpSelect.value;
            if (!empId) {
                alert('확인자를 선택해주세요.');
                return;
            }
            
            const emp = employees.find(e => e.id === empId);
            if (!emp) return;
            
            try {
                await db.collection('handovers').doc(pendingHandoverCheckId).update({
                    checkedBy: firebase.firestore.FieldValue.arrayUnion(emp.name)
                });
                if (handoverCheckModal) handoverCheckModal.style.display = 'none';
                pendingHandoverCheckId = null;
            } catch (e) {
                console.error(e);
                alert('확인 처리 실패');
            }
        });
    }

    if (cancelHandoverBtn) cancelHandoverBtn.addEventListener('click', () => { if (handoverCheckModal) handoverCheckModal.style.display = 'none'; pendingHandoverCheckId = null; });
    if (closeHandoverModalBtn) closeHandoverModalBtn.addEventListener('click', () => { if (handoverCheckModal) handoverCheckModal.style.display = 'none'; pendingHandoverCheckId = null; });

    window.deleteHandover = async function(id) {
        showConfirm('이 인수인계 기록을 삭제하시겠습니까?', async () => {
            try {
                await db.collection('handovers').doc(id).delete();
            } catch (e) {
                console.error(e);
                alert('삭제 실패');
            }
        });
    };

    // --- Rules ---
    if (viewRulesBtn) viewRulesBtn.addEventListener('click', () => setViewMode('rules'));
    if (closeRulesModalBtn) closeRulesModalBtn.addEventListener('click', () => rulesModal.style.display = 'none');
    if (closeRulesBtn) closeRulesBtn.addEventListener('click', () => rulesModal.style.display = 'none');
    
    if (saveRulesBtn) {
        saveRulesBtn.addEventListener('click', async () => {
            saveRulesBtn.textContent = '저장 중...';
            try {
                const updatedContent = document.getElementById('admin-rules-input').value;
                const updatedClosing = document.getElementById('unique-admin-closing-input').value;
                
                await db.collection('settings').doc('rules').set({ 
                    content: updatedContent,
                    closing: updatedClosing
                }, { merge: true });
                
                showToast(`✅ 매장 매뉴얼 저장됨! (기본: ${updatedContent.length}자, 마감: ${updatedClosing.length}자)`);
            } catch (e) {
                console.error(e);
                alert('저장 실패: ' + e.message);
            } finally {
                saveRulesBtn.textContent = '저장';
            }
        });
    }

    function renderDailyHandover(dateStr) {
        const dailyHandoverList = document.getElementById('daily-handover-list');
        if (!dailyHandoverList) return;
        dailyHandoverList.innerHTML = '';
        
        // Filter handovers: either created on this dateStr, OR unchecked
        const relevantHandovers = handoverData.filter(item => {
            if (!item.createdAt) return false;
            const d = item.createdAt.toDate();
            const itemDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const isUnchecked = !item.checkedBy || item.checkedBy.length === 0;
            return itemDateStr === dateStr || isUnchecked;
        });

        if (relevantHandovers.length === 0) {
            dailyHandoverList.innerHTML = '<div class="empty-state" style="position:static;"><p>오늘 작성되거나 미확인된 인수인계가 없습니다.</p></div>';
            return;
        }

        const cardsContainer = document.createElement('div');
        cardsContainer.style.display = 'flex';
        cardsContainer.style.flexDirection = 'column';
        cardsContainer.style.gap = '0.8rem';
        
        relevantHandovers.forEach(item => {
            const card = document.createElement('div');
            card.className = 'glass-panel';
            card.style.padding = '1rem';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.gap = '0.5rem';
            
            const isChecked = item.checkedBy && item.checkedBy.length > 0;
            if (!isChecked) {
                card.style.border = '1px solid var(--danger)';
            }

            let timeStr = '';
            if (item.createdAt) {
                const d = item.createdAt.toDate();
                timeStr = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            }
            
            const checkedByStr = isChecked 
                ? `<div style="font-size: 0.8rem; color: #10b981;">✅ 확인자: ${item.checkedBy.join(', ')}</div>`
                : `<div style="font-size: 0.8rem; color: var(--danger); font-weight: bold;">🔴 미확인</div>`;
            
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; font-size: 0.95rem; color: ${!isChecked ? 'var(--danger)' : 'white'};">${item.empName} <span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">(${timeStr})</span></span>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 0.8rem; border-radius: 4px; border-left: 2px solid ${!isChecked ? 'var(--danger)' : 'var(--primary)'}; white-space: pre-wrap; font-size: 0.85rem;">${item.content}</div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.3rem;">
                    ${checkedByStr}
                    <button class="btn ${!isChecked ? 'primary' : 'outline-light'} btn-sm" onclick="checkHandover('${item.id}')" style="font-size: 0.75rem; padding: 2px 8px;">✅ 확인</button>
                </div>
            `;
            cardsContainer.appendChild(card);
        });
        dailyHandoverList.appendChild(cardsContainer);
    }

    function renderHandovers() {
        if (!handoverListContainer) return;
        handoverListContainer.innerHTML = '';
        
        if (handoverData.length === 0) {
            handoverListContainer.innerHTML = '<div class="empty-state" style="position:static;"><p>작성된 인수인계가 없습니다.</p></div>';
            return;
        }
        
        // Group by Date
        const grouped = {};
        handoverData.forEach(item => {
            let dateKey = '날짜 미상';
            let timeStr = '';
            if (item.createdAt) {
                const d = item.createdAt.toDate();
                dateKey = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
                timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            }
            if (!grouped[dateKey]) grouped[dateKey] = [];
            item._timeStr = timeStr;
            grouped[dateKey].push(item);
        });
        
        const todayStr = `${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월 ${new Date().getDate()}일`;

        for (const [dateKey, items] of Object.entries(grouped)) {
            const groupHeader = document.createElement('div');
            groupHeader.style.marginTop = '1.5rem';
            groupHeader.style.marginBottom = '1rem';
            groupHeader.style.display = 'flex';
            groupHeader.style.alignItems = 'center';
            groupHeader.style.gap = '0.5rem';
            
            const isToday = dateKey === todayStr;
            
            groupHeader.innerHTML = `
                <h4 style="color: white; margin: 0; font-size: 1.1rem; font-weight: 600;">📅 ${dateKey}</h4>
                ${isToday ? '<span style="background: var(--primary); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;">오늘</span>' : ''}
            `;
            handoverListContainer.appendChild(groupHeader);
            
            const cardsContainer = document.createElement('div');
            cardsContainer.style.display = 'flex';
            cardsContainer.style.flexDirection = 'column';
            cardsContainer.style.gap = '1rem';
            
            items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'glass-panel';
                card.style.padding = '1.2rem';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.gap = '0.8rem';
                card.style.position = 'relative';
                
                const isChecked = item.checkedBy && item.checkedBy.length > 0;
                
                if (!isChecked) {
                    card.style.border = '1px solid var(--danger)';
                    card.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.2)';
                }
                
                const checkedByStr = isChecked 
                    ? `<div style="font-size: 0.85rem; color: #10b981; font-weight: 500;">✅ 확인자: ${item.checkedBy.join(', ')}</div>`
                    : `<div style="font-size: 0.85rem; color: var(--danger); font-weight: bold; display: flex; align-items: center; gap: 0.3rem;"><span>🔴</span> 아직 아무도 확인하지 않음!</div>`;
                
                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="font-weight: 600; font-size: 1.05rem; color: ${!isChecked ? 'var(--danger)' : 'white'};">${item.empName}</span>
                            <span style="font-size: 0.85rem; color: var(--text-muted); background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">${item._timeStr} 작성</span>
                        </div>
                        <button class="btn outline-danger btn-sm" onclick="deleteHandover('${item.id}')" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">삭제</button>
                    </div>
                    
                    <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 6px; border-left: 3px solid ${!isChecked ? 'var(--danger)' : 'var(--primary)'}; white-space: pre-wrap; font-size: 0.95rem; line-height: 1.5;">${item.content}</div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                        ${checkedByStr}
                        <button class="btn ${!isChecked ? 'primary' : 'outline-light'} btn-sm" onclick="checkHandover('${item.id}')" style="font-size: 0.85rem; font-weight: 500;">✅ 확인하기</button>
                    </div>
                `;
                cardsContainer.appendChild(card);
            });
            handoverListContainer.appendChild(cardsContainer);
        }
    }

    // --- CRUD ---
    async function addEmployee() {
        const name = empNameInput.value.trim();
        let pin = empPinInput.value.trim();
        if (pin.length !== 4) pin = '0000';
        const wageStr = empWageInput.value.trim();
        const wage = wageStr === '' ? defaultWage : parseInt(wageStr, 10);
        const applyHolidayAllowance = document.getElementById('emp-holiday-allowance').checked;
        const excludeSalary = document.getElementById('emp-exclude-salary').checked;
        
        if (!name) return;
        if (employees.some(e => e.name === name)) {
            alert('이미 존재하는 근무자입니다.'); return;
        }
        
        let colorIdx = 0;
        if(employees.length > 0) {
            const lastColor = employees[employees.length-1].color1;
            const idx = colors.findIndex(c => c[0] === lastColor);
            colorIdx = (idx + 1) % colors.length;
        }
        const colorPair = colors[colorIdx];
        
        empNameInput.value = '';
        empPinInput.value = '';
        
        try {
            await db.collection('employees').add({
                name,
                pin,
                hourlyWage: wage,
                color1: colorPair[0],
                color2: colorPair[1],
                applyHolidayAllowance: applyHolidayAllowance,
                excludeSalary: excludeSalary
            });
            alert(`'${name}' 근무자가 등록되었습니다.`);
        } catch (e) {
            console.error(e);
            alert('근무자 등록에 실패했습니다.');
        }
    }

    async function removeEmployee(id) {
        if(!confirm('이 근무자와 연관된 모든 스케줄이 클라우드에서 삭제됩니다. 계속하시겠습니까?')) return;
        
        try {
            await db.collection('employees').doc(id).delete();
            const empScheds = schedules.filter(s => s.empId === id);
            if(empScheds.length > 0) {
                const batch = db.batch();
                empScheds.forEach(s => {
                    batch.delete(db.collection('schedules').doc(s.id));
                });
                await batch.commit();
            }
        } catch (e) {
            console.error(e);
        }
    }

    function renderEmployees() {
        employeeListEl.innerHTML = '';
        scheduleEmpSelect.innerHTML = '<option value="" disabled selected>근무자를 선택하세요</option>';
        if (quickAddEmpSelect) quickAddEmpSelect.innerHTML = '<option value="" disabled selected>근무자를 선택하세요</option>';
        if (handoverEmpSelect) handoverEmpSelect.innerHTML = '<option value="" disabled selected>작성자 선택</option>';
        if (handoverCheckEmpSelect) handoverCheckEmpSelect.innerHTML = '<option value="" disabled selected>이름 선택</option>';
        if (mySalaryEmpSelect) mySalaryEmpSelect.innerHTML = '<option value="" disabled selected>이름 선택</option>';
        
        const showResigned = showResignedCb.checked;
        
        employees.forEach(emp => {
            // 퇴사자 필터링
            if (emp.isResigned && !showResigned) return;
            
            const li = document.createElement('li');
            li.className = 'employee-item';
            if (emp.isResigned) li.classList.add('resigned-emp');
            
            li.style.setProperty('--item-color', emp.color1);
            li.innerHTML = `<span style="display: flex; align-items: center;">${emp.name}${emp.isResigned ? '<span style="background: var(--danger); color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-left: 0.5rem; font-weight: bold;">퇴사</span>' : ''}</span><button class="btn-delete-emp" data-id="${emp.id}">&times;</button>`;
            
            li.addEventListener('click', (e) => {
                if(e.target.classList.contains('btn-delete-emp')) return;
                openEditEmpModal(emp);
            });
            
            li.querySelector('.btn-delete-emp').addEventListener('click', (e) => removeEmployee(e.target.dataset.id));
            employeeListEl.appendChild(li);
            
            // 드롭다운에는 퇴사자 무조건 제외
            if (!emp.isResigned) {
                const option = document.createElement('option');
                option.value = emp.id;
                option.textContent = emp.name;
                scheduleEmpSelect.appendChild(option);
                
                if (quickAddEmpSelect) {
                    const qaOption = document.createElement('option');
                    qaOption.value = emp.id;
                    qaOption.textContent = emp.name;
                    quickAddEmpSelect.appendChild(qaOption);
                }
                
                if (handoverEmpSelect) {
                    const hoOption = document.createElement('option');
                    hoOption.value = emp.id;
                    hoOption.textContent = emp.name;
                    handoverEmpSelect.appendChild(hoOption);
                }

                if (handoverCheckEmpSelect) {
                    const hcOption = document.createElement('option');
                    hcOption.value = emp.id;
                    hcOption.textContent = emp.name;
                    handoverCheckEmpSelect.appendChild(hcOption);
                }

                if (mySalaryEmpSelect) {
                    const msOption = document.createElement('option');
                    msOption.value = emp.id;
                    msOption.textContent = emp.name;
                    mySalaryEmpSelect.appendChild(msOption);
                }
            }
        });
    }

    showResignedCb.addEventListener('change', renderEmployees);

    function openEditEmpModal(emp) {
        editingEmpId = emp.id;
        editingEmpIsResigned = !!emp.isResigned;
        editingEmpSelectedColor = [emp.color1, emp.color2];
        
        if (emp) {
            editEmpNameInput.value = emp.name;
            editEmpPinInput.value = emp.pin || '0000';
            editEmpWageInput.value = emp.hourlyWage || 10030;
            document.getElementById('edit-emp-holiday-allowance').checked = emp.applyHolidayAllowance !== false;
            document.getElementById('edit-emp-exclude-salary').checked = !!emp.excludeSalary;
        }
        
        if (editingEmpIsResigned) {
            toggleResignEmpBtn.textContent = '퇴사 취소 (복구)';
            toggleResignEmpBtn.className = 'btn outline-primary w-full';
        } else {
            toggleResignEmpBtn.textContent = '퇴사 처리';
            toggleResignEmpBtn.className = 'btn outline-danger w-full';
        }

        editEmpColorsContainer.innerHTML = '';
        colors.forEach(cPair => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.background = cPair[0];
            if (cPair[0] === emp.color1) swatch.classList.add('selected');
            
            swatch.addEventListener('click', () => {
                document.querySelectorAll('#edit-emp-colors .color-swatch').forEach(el => el.classList.remove('selected'));
                swatch.classList.add('selected');
                editingEmpSelectedColor = cPair;
            });
            editEmpColorsContainer.appendChild(swatch);
        });
        
        editEmpModal.style.display = 'flex';
    }

    toggleResignEmpBtn.addEventListener('click', async () => {
        if (!editingEmpId) return;
        const confirmMsg = editingEmpIsResigned 
            ? '해당 직원을 다시 복구하시겠습니까?' 
            : '해당 직원을 퇴사 처리하시겠습니까? (과거 기록은 보존됩니다)';
        
        if (!confirm(confirmMsg)) return;

        try {
            await db.collection('employees').doc(editingEmpId).update({
                isResigned: !editingEmpIsResigned
            });
            editEmpModal.style.display = 'none';
        } catch (e) {
            console.error(e);
            alert('상태 변경에 실패했습니다.');
        }
    });

    cancelEditEmpBtn.addEventListener('click', () => {
        editEmpModal.style.display = 'none';
        editingEmpId = null;
    });

    confirmEditEmpBtn.addEventListener('click', async () => {
        if (!editingEmpId) return;
        const newName = editEmpNameInput.value.trim();
        let newPin = editEmpPinInput.value.trim();
        if (newPin.length !== 4) newPin = '0000';
        const newWageStr = editEmpWageInput.value.trim();
        const newWage = newWageStr === '' ? defaultWage : parseInt(newWageStr, 10);
        if (!newName) return;

        try {
            confirmEditEmpBtn.textContent = '저장 중...';
            // Update employee
            const applyHolidayAllowance = document.getElementById('edit-emp-holiday-allowance').checked;
            const excludeSalary = document.getElementById('edit-emp-exclude-salary').checked;
            await db.collection('employees').doc(editingEmpId).update({
                name: newName,
                pin: newPin,
                hourlyWage: newWage,
                color1: editingEmpSelectedColor[0],
                color2: editingEmpSelectedColor[1],
                applyHolidayAllowance: applyHolidayAllowance,
                excludeSalary: excludeSalary
            });
            
            // Update schedules
            const empScheds = schedules.filter(s => s.empId === editingEmpId);
            if (empScheds.length > 0) {
                const batch = db.batch();
                empScheds.forEach(s => {
                    batch.update(db.collection('schedules').doc(s.id), {
                        empName: newName,
                        color1: editingEmpSelectedColor[0],
                        color2: editingEmpSelectedColor[1]
                    });
                });
                await batch.commit();
            }
            editEmpModal.style.display = 'none';
        } catch (e) {
            console.error(e);
            alert('저장에 실패했습니다.');
        } finally {
            confirmEditEmpBtn.textContent = '저장';
        }
    });

    async function addSchedule() {
        const mode = document.querySelector('input[name="sched-mode"]:checked').value;
        const empId = scheduleEmpSelect.value;
        const start = startTimeInput.value;
        const end = endTimeInput.value;
        
        if (!empId || !start || !end) {
            alert('근무자와 시간을 입력해주세요.'); return;
        }

        const emp = employees.find(e => e.id === empId);
        if(!emp) return;

        let datesToAdd = [];

        if (mode === 'single') {
            const date = scheduleDateInput.value;
            if (!date) { alert('날짜를 입력해주세요.'); return; }
            datesToAdd.push(date);
            currentDate = new Date(date);
        } else {
            const sDateStr = scheduleStartDateInput.value;
            const eDateStr = scheduleEndDateInput.value;
            if(!sDateStr || !eDateStr) { alert('기간을 입력해주세요.'); return; }
            
            const checkedDays = Array.from(weekdayCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => parseInt(cb.value));
            
            if (checkedDays.length === 0) { alert('반복할 요일을 하나 이상 선택해주세요.'); return; }

            const sDate = new Date(sDateStr);
            const eDate = new Date(eDateStr);
            if (sDate > eDate) { alert('시작일이 종료일보다 늦을 수 없습니다.'); return; }

            let cur = new Date(sDate);
            while(cur <= eDate) {
                if (checkedDays.includes(cur.getDay())) {
                    datesToAdd.push(formatDateString(cur));
                }
                cur.setDate(cur.getDate() + 1);
            }
            
            if (datesToAdd.length === 0) {
                alert('지정된 기간 내에 선택한 요일이 없습니다.'); return;
            }
            currentDate = new Date(sDateStr);
        }

        addScheduleBtn.disabled = true;
        addScheduleBtn.textContent = '저장 중...';

        try {
            const batch = db.batch();
            datesToAdd.forEach(dateStr => {
                const newDocRef = db.collection('schedules').doc();
                batch.set(newDocRef, {
                    date: dateStr,
                    empId,
                    empName: emp.name,
                    start,
                    end,
                    color1: emp.color1,
                    color2: emp.color2
                });
            });
            await batch.commit();
        } catch (e) {
            console.error(e);
        } finally {
            addScheduleBtn.disabled = false;
            addScheduleBtn.textContent = '스케줄 등록';
        }
    }
    
    async function removeSchedule(id) {
        try {
            await db.collection('schedules').doc(id).delete();
        } catch (e) {
            console.error(e);
        }
    }

    // --- Renders ---
    function renderTimeHeader() {
        timeHeader.innerHTML = '';
        for (let i = TIMELINE_START; i < TIMELINE_END; i++) {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = `${String(i % 24).padStart(2, '0')}:00`;
            timeHeader.appendChild(slot);
        }
        timelineGrid.style.setProperty('--timeline-hours', TIMELINE_HOURS);
    }

    function renderTimeline(dateStr) {
        timelineGrid.innerHTML = '';
        const mobileList = document.getElementById('mobile-daily-list');
        if (mobileList) mobileList.innerHTML = '';

        if (employees.length === 0) {
            timelineGrid.innerHTML = '<div class="empty-state"><p>등록된 근무자가 없습니다.</p></div>'; 
            if (mobileList) mobileList.innerHTML = '<div class="empty-state"><p>등록된 근무자가 없습니다.</p></div>';
            return;
        }

        const dailySchedules = schedules.filter(s => s.date === dateStr);
        let hasSchedules = false;

        const activeEmployeesForDay = employees.filter(emp => {
            const hasScheds = dailySchedules.some(s => s.empId === emp.id);
            return !(emp.isResigned && !hasScheds);
        });

        const sortedEmployees = [...activeEmployeesForDay].sort((a, b) => {
            const aScheds = dailySchedules.filter(s => s.empId === a.id);
            const bScheds = dailySchedules.filter(s => s.empId === b.id);
            if (aScheds.length > 0 && bScheds.length === 0) return -1;
            if (aScheds.length === 0 && bScheds.length > 0) return 1;
            if (aScheds.length > 0 && bScheds.length > 0) {
                const aMin = aScheds.map(s => s.start).sort()[0];
                const bMin = bScheds.map(s => s.start).sort()[0];
                return aMin.localeCompare(bMin);
            }
            return 0;
        });

        sortedEmployees.forEach(emp => {
            const lane = document.createElement('div');
            lane.className = 'timeline-lane';
            lane.innerHTML = `<div class="lane-label">${emp.name}</div>`;
            
            const empSchedules = dailySchedules.filter(s => s.empId === emp.id).sort((a,b) => a.start.localeCompare(b.start));
            if (empSchedules.length > 0) hasSchedules = true;

            empSchedules.forEach(sched => {
                const sH = parseInt(sched.start.split(':')[0]);
                const sM = parseInt(sched.start.split(':')[1]);
                let eH = parseInt(sched.end.split(':')[0]);
                const eM = parseInt(sched.end.split(':')[1]);
                
                if (eH < sH || (eH === sH && eM < sM)) {
                    eH += 24;
                }
                
                const block = createScheduleBlock(sched, sH, sM, eH, eM);
                if (block) lane.appendChild(block);
                
                // Render mobile card
                if (mobileList) {
                    const card = document.createElement('div');
                    card.className = 'mobile-schedule-card';
                    card.style.setProperty('--item-color', sched.color1);
                    
                    const diff = (eH - sH) + (eM - sM)/60;
                    
                    card.innerHTML = `
                        <div>
                            <div class="emp-name">${sched.empName}</div>
                            <div class="duration">${diff}시간 근무</div>
                        </div>
                        <div style="text-align: right;">
                            <div class="time-range" style="font-size: 1.1rem; font-weight: bold; color: white;">${sched.start} ~ ${sched.end}</div>
                        </div>
                    `;
                    mobileList.appendChild(card);
                }
            });
            timelineGrid.appendChild(lane);
        });
        
        if (!hasSchedules) {
            timelineGrid.insertAdjacentHTML('beforeend', `<div class="empty-state" style="position:absolute;width:100%;pointer-events:none"><p>${dateStr} 스케줄 없음.</p></div>`);
            if (mobileList) mobileList.innerHTML = `<div class="empty-state"><p>${dateStr} 스케줄 없음.</p></div>`;
        }
    }
    
    function createScheduleBlock(sched, sHour, sMin, eHour, eMin) {
        let startDec = sHour + (sMin / 60);
        let endDec = eHour + (eMin / 60);
        
        if (startDec < TIMELINE_START) startDec = TIMELINE_START;
        if (endDec > TIMELINE_END) endDec = TIMELINE_END;
        if (startDec >= endDec) return null;
        
        const block = document.createElement('div');
        block.className = 'schedule-block';
        block.style.left = `${((startDec - TIMELINE_START) / TIMELINE_HOURS) * 100}%`;
        block.style.width = `${((endDec - startDec) / TIMELINE_HOURS) * 100}%`;
        block.style.setProperty('--bg-color-1', sched.color1);
        block.style.setProperty('--bg-color-2', sched.color2);
        block.innerHTML = `<span>${sched.start}~${sched.end}</span><button class="delete-schedule" data-id="${sched.id}">&times;</button>`;
        block.querySelector('.delete-schedule').addEventListener('click', (e) => {
            e.stopPropagation(); 
            showConfirm('해당 근무를 삭제하시겠습니까?', () => {
                pendingScheduleId = e.target.dataset.id;
                passwordTargetAction = 'delete-schedule';
                passwordModal.style.display = 'flex';
            });
        });
        block.addEventListener('dblclick', () => {
            pendingScheduleId = sched.id;
            passwordTargetAction = 'edit-schedule';
            passwordModal.style.display = 'flex';
        });
        return block;
    }

    function renderWeeklyTable(weekDates) {
        weeklyThead.innerHTML = '';
        weeklyTbody.innerHTML = '';
        
        const mobileList = document.getElementById('mobile-weekly-list');
        if (mobileList) mobileList.innerHTML = '';

        if (employees.length === 0) {
            weeklyTbody.innerHTML = '<tr><td colspan="8" class="empty-state">등록된 근무자가 없습니다.</td></tr>'; 
            if (mobileList) mobileList.innerHTML = '<div class="empty-state">등록된 근무자가 없습니다.</div>';
            return;
        }

        const trHeader = document.createElement('tr');
        trHeader.innerHTML = '<th>근무자</th>';
        const todayStr = formatDateString(new Date());
        
        weekDates.forEach(d => {
            const dateStr = formatDateString(d);
            const isToday = dateStr === todayStr;
            const th = document.createElement('th');
            if (isToday) th.classList.add('today-header');
            
            let dateColor = '';
            if (d.getDay() === 0 || isPublicHoliday(dateStr)) dateColor = 'color: #ef4444;';
            else if (d.getDay() === 6) dateColor = 'color: #3b82f6;';
            
            th.innerHTML = `<div style="${dateColor}">${getDayName(d)}</div><div style="font-size:0.8rem;margin-top:0.2rem;">${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}</div>`;
            trHeader.appendChild(th);
        });
        weeklyThead.appendChild(trHeader);

        const weekDateStrs = weekDates.map(d => formatDateString(d));
        const weeklySchedules = schedules.filter(s => weekDateStrs.includes(s.date));

        const activeEmployeesForWeek = employees.filter(emp => {
            const hasScheds = weeklySchedules.some(s => s.empId === emp.id);
            return !(emp.isResigned && !hasScheds);
        });

        const sortedEmployees = [...activeEmployeesForWeek].sort((a, b) => {
            const aScheds = weeklySchedules.filter(s => s.empId === a.id);
            const bScheds = weeklySchedules.filter(s => s.empId === b.id);
            if (aScheds.length > 0 && bScheds.length === 0) return -1;
            if (aScheds.length === 0 && bScheds.length > 0) return 1;
            if (aScheds.length > 0 && bScheds.length > 0) {
                const aMin = aScheds.map(s => s.start).sort()[0];
                const bMin = bScheds.map(s => s.start).sort()[0];
                return aMin.localeCompare(bMin);
            }
            return 0;
        });

        // Desktop / Tablet 렌더링
        sortedEmployees.forEach(emp => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td class="emp-name-col" style="border-left: 4px solid ${emp.color1}">${emp.name}</td>`;
            weekDates.forEach(date => {
                const td = document.createElement('td');
                const empDayScheds = schedules.filter(s => s.empId === emp.id && s.date === formatDateString(date)).sort((a,b) => a.start.localeCompare(b.start));
                empDayScheds.forEach(sched => {
                    const item = document.createElement('div');
                    item.className = 'weekly-schedule-item';
                    item.style.setProperty('--bg-color-1', sched.color1);
                    item.style.setProperty('--bg-color-2', sched.color2);
                    item.innerHTML = `${sched.start}~${sched.end}<button class="delete-weekly-btn" data-id="${sched.id}">&times;</button>`;
                    item.querySelector('.delete-weekly-btn').addEventListener('click', (e) => {
                        e.stopPropagation(); 
                        showConfirm('해당 근무를 삭제하시겠습니까?', () => {
                            pendingScheduleId = e.target.dataset.id;
                            passwordTargetAction = 'delete-schedule';
                            passwordModal.style.display = 'flex';
                        });
                    });
                    item.addEventListener('dblclick', () => {
                        pendingScheduleId = sched.id;
                        passwordTargetAction = 'edit-schedule';
                        passwordModal.style.display = 'flex';
                    });
                    td.appendChild(item);
                });
                if(empDayScheds.length === 0) { td.style.color = 'var(--panel-border)'; td.textContent = '-'; }
                tr.appendChild(td);
            });
            weeklyTbody.appendChild(tr);
        });

        // Mobile 렌더링 (날짜별로 그룹화하여 세로 리스트 출력)
        if (mobileList) {
            weekDates.forEach(date => {
                const dStr = formatDateString(date);
                const dayScheds = weeklySchedules.filter(s => s.date === dStr).sort((a,b) => a.start.localeCompare(b.start));
                
                const isToday = dStr === todayStr;
                
                let titleColor = isToday ? 'var(--primary)' : 'white';
                if (!isToday && (date.getDay() === 0 || isPublicHoliday(dStr))) titleColor = '#ef4444';
                else if (!isToday && date.getDay() === 6) titleColor = '#3b82f6';

                const dayHeader = document.createElement('div');
                dayHeader.style.marginTop = '1.5rem';
                dayHeader.style.marginBottom = '0.8rem';
                dayHeader.style.display = 'flex';
                dayHeader.style.alignItems = 'center';
                dayHeader.style.gap = '0.5rem';
                
                dayHeader.innerHTML = `
                    <h4 style="color: ${titleColor}; margin: 0; font-size: 1.1rem; font-weight: 600;">📅 ${dStr} (${getDayName(date)})</h4>
                    ${isToday ? '<span style="background: var(--primary); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;">오늘</span>' : ''}
                `;
                mobileList.appendChild(dayHeader);

                if (dayScheds.length === 0) {
                    const empty = document.createElement('div');
                    empty.className = 'empty-state';
                    empty.style.position = 'static';
                    empty.style.padding = '1rem';
                    empty.style.background = 'rgba(0,0,0,0.2)';
                    empty.innerHTML = '일정 없음';
                    mobileList.appendChild(empty);
                } else {
                    const cardsContainer = document.createElement('div');
                    cardsContainer.style.display = 'flex';
                    cardsContainer.style.flexDirection = 'column';
                    cardsContainer.style.gap = '0.8rem';

                    dayScheds.forEach(sched => {
                        const card = document.createElement('div');
                        card.className = 'mobile-schedule-card';
                        card.style.setProperty('--item-color', sched.color1);
                        
                        const sH = parseInt(sched.start.split(':')[0]);
                        const sM = parseInt(sched.start.split(':')[1]);
                        let eH = parseInt(sched.end.split(':')[0]);
                        const eM = parseInt(sched.end.split(':')[1]);
                        if (eH < sH || (eH === sH && eM < sM)) eH += 24;
                        const diff = (eH - sH) + (eM - sM)/60;
                        
                        card.innerHTML = `
                            <div>
                                <div class="emp-name">${sched.empName}</div>
                                <div class="duration">${diff}시간 근무</div>
                            </div>
                            <div style="text-align: right;">
                                <div class="time-range" style="font-size: 1.1rem; font-weight: bold; color: white;">${sched.start} ~ ${sched.end}</div>
                            </div>
                        `;
                        cardsContainer.appendChild(card);
                    });
                    mobileList.appendChild(cardsContainer);
                }
            });
        }
    }

    function renderMonthlyCalendar(baseDate) {
        monthlyGrid.innerHTML = '';
        const year = baseDate.getFullYear();
        const month = baseDate.getMonth();
        const todayStr = formatDateString(new Date());

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        let startOffset = firstDay.getDay(); 
        
        for (let i = 0; i < 42; i++) {
            const cell = document.createElement('div');
            cell.className = 'monthly-day';
            
            const cellDate = new Date(year, month, 1 - startOffset + i);
            const dateStr = formatDateString(cellDate);
            
            let isCurrentMonth = cellDate.getMonth() === month;
            if (!isCurrentMonth) cell.classList.add('other-month');
            if (dateStr === todayStr) cell.classList.add('today');
            
            let dayNumClass = 'monthly-day-number';
            if (cellDate.getDay() === 0 || isPublicHoliday(dateStr)) dayNumClass += ' sunday';
            else if (cellDate.getDay() === 6) dayNumClass += ' saturday';

            cell.innerHTML = `<div class="${dayNumClass}">${cellDate.getDate()}</div>`;
            
            const dayScheds = schedules.filter(s => s.date === dateStr).sort((a,b) => a.start.localeCompare(b.start));
            dayScheds.forEach(sched => {
                const item = document.createElement('div');
                item.className = 'monthly-schedule-item';
                item.style.setProperty('--bg-color-1', sched.color1);
                item.style.setProperty('--bg-color-2', sched.color2);
                item.title = `${sched.empName} ${sched.start}~${sched.end}`;
                item.innerHTML = `
                    ${sched.empName} (${sched.start}~${sched.end})
                    <button class="delete-monthly-btn" data-id="${sched.id}">&times;</button>
                `;
                item.querySelector('.delete-monthly-btn').addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    showConfirm('해당 근무를 삭제하시겠습니까?', () => {
                        pendingScheduleId = e.target.dataset.id;
                        passwordTargetAction = 'delete-schedule';
                        passwordModal.style.display = 'flex';
                    });
                });
                // Handle PC double click
                item.addEventListener('dblclick', (e) => {
                    e.preventDefault();
                    if (window.innerWidth <= 768) {
                        // Let cell click handle it on mobile
                    } else {
                        pendingScheduleId = sched.id;
                        passwordTargetAction = 'edit-schedule';
                        passwordModal.style.display = 'flex';
                    }
                });

                // On mobile, just let the tap pass through to the cell
                cell.appendChild(item);
            });
            
            // Mobile detail view on click
            cell.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    document.querySelectorAll('.monthly-day').forEach(el => el.classList.remove('selected-day'));
                    cell.classList.add('selected-day');
                    showMobileMonthlyDetail(dateStr, dayScheds);
                }
            });

            monthlyGrid.appendChild(cell);
        }

        // On mobile, auto-select today (or the 1st of the month if today is not in view)
        if (window.innerWidth <= 768) {
            let targetCell = monthlyGrid.querySelector('.monthly-day.today');
            if (!targetCell) {
                // If today is not in this month, select the 1st day of the month
                targetCell = Array.from(monthlyGrid.querySelectorAll('.monthly-day')).find(c => !c.classList.contains('other-month'));
            }
            if (targetCell) {
                targetCell.click();
            } else {
                document.getElementById('mobile-monthly-detail').style.display = 'none';
            }
        } else {
            document.getElementById('mobile-monthly-detail').style.display = 'none';
        }
    }
    
    function showMobileMonthlyDetail(dateStr, dayScheds) {
        const detailContainer = document.getElementById('mobile-monthly-detail');
        const detailTitle = document.getElementById('mobile-monthly-detail-title');
        const detailList = document.getElementById('mobile-monthly-detail-list');
        
        detailContainer.style.display = 'block';
        const [y, m, d] = dateStr.split('-');
        detailTitle.textContent = `${parseInt(m)}월 ${parseInt(d)}일 일정`;
        detailList.innerHTML = '';
        
        if (dayScheds.length === 0) {
            detailList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 1rem 0;">일정이 없습니다.</div>';
            return;
        }
        
        dayScheds.forEach(sched => {
            const card = document.createElement('div');
            card.className = 'mobile-schedule-card';
            card.style.setProperty('--item-color', sched.color1);
            
            const sH = parseInt(sched.start.split(':')[0]);
            const sM = parseInt(sched.start.split(':')[1]);
            let eH = parseInt(sched.end.split(':')[0]);
            const eM = parseInt(sched.end.split(':')[1]);
            if (eH < sH || (eH === sH && eM < sM)) eH += 24;
            const diff = (eH - sH) + (eM - sM)/60;
            
            card.innerHTML = `
                <div>
                    <div class="emp-name">${sched.empName}</div>
                    <div class="duration">${diff}시간 근무</div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                    <div class="time-range" style="font-size: 1.1rem; font-weight: bold; color: white;">${sched.start} ~ ${sched.end}</div>
                    <button class="btn outline-danger btn-sm mobile-sched-delete-btn" data-id="${sched.id}" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">삭제</button>
                </div>
            `;
            
            card.querySelector('.mobile-sched-delete-btn').addEventListener('click', (e) => {
                e.stopPropagation(); 
                showConfirm('해당 근무를 삭제하시겠습니까?', () => {
                    pendingScheduleId = e.target.dataset.id;
                    passwordTargetAction = 'delete-schedule';
                    passwordModal.style.display = 'flex';
                });
            });
            
            detailList.appendChild(card);
        });
    }

    function renderAdminCalendar(baseDate) {
        adminMonthlyGrid.innerHTML = '';
        const year = baseDate.getFullYear();
        const month = baseDate.getMonth();
        const todayStr = formatDateString(new Date());

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        let startOffset = firstDay.getDay(); 
        
        for (let i = 0; i < 42; i++) {
            const cell = document.createElement('div');
            cell.className = 'monthly-day';
            cell.style.cursor = 'pointer';
            
            const cellDate = new Date(year, month, 1 - startOffset + i);
            const dateStr = formatDateString(cellDate);
            
            let isCurrentMonth = cellDate.getMonth() === month;
            if (!isCurrentMonth) cell.classList.add('other-month');
            if (dateStr === todayStr) cell.classList.add('today');

            let dayNumClass = 'monthly-day-number';
            if (cellDate.getDay() === 0 || isPublicHoliday(dateStr)) dayNumClass += ' sunday';
            else if (cellDate.getDay() === 6) dayNumClass += ' saturday';
            
            cell.innerHTML = `<div class="${dayNumClass}">${cellDate.getDate()}</div>`;
            
            const dayScheds = schedules.filter(s => s.date === dateStr).sort((a,b) => a.start.localeCompare(b.start));
            dayScheds.forEach(sched => {
                const item = document.createElement('div');
                item.className = 'monthly-schedule-item';
                item.style.setProperty('--bg-color-1', sched.color1);
                item.style.setProperty('--bg-color-2', sched.color2);
                item.title = `${sched.empName} ${sched.start}~${sched.end}`;
                item.innerHTML = `
                    ${sched.empName} (${sched.start}~${sched.end})
                `;
                
                // Admin Double Click Edit
                item.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    pendingScheduleId = sched.id;
                    editSchedDateInput.value = sched.date;
                    editSchedDateWrapper.style.display = 'block';
                    editSchedWeekdayWrapper.style.display = 'none';
                    passwordTargetAction = 'edit-schedule';
                    passwordModal.style.display = 'flex';
                });
                
                // Admin Delete Button - Optional: we can just rely on dbl click, but let's add delete button
                item.innerHTML += `<button class="delete-monthly-btn" data-id="${sched.id}">&times;</button>`;
                item.querySelector('.delete-monthly-btn').addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    showConfirm('해당 근무를 삭제하시겠습니까?', () => {
                        pendingScheduleId = e.target.dataset.id;
                        passwordTargetAction = 'delete-schedule';
                        passwordModal.style.display = 'flex';
                    });
                });
                
                cell.appendChild(item);
            });
            
            // Admin Calendar cell click to Quick Add
            cell.addEventListener('click', (e) => {
                // Ignore if clicked on schedule item (they have their own handler)
                if (e.target.closest('.monthly-schedule-item')) return;
                
                quickAddDateInput.value = dateStr;
                quickAddModal.style.display = 'flex';
                
                // Populate presets dynamically
                if (quickAddPresetSelect) {
                    quickAddPresetSelect.innerHTML = '<option value="">직접 입력</option>';
                    presets.forEach(p => {
                        const opt = document.createElement('option');
                        opt.value = p.id;
                        opt.textContent = `${p.name} (${p.start}~${p.end})`;
                        quickAddPresetSelect.appendChild(opt);
                    });
                }
            });

            adminMonthlyGrid.appendChild(cell);
        }
    }

    // --- Salary Calculation ---
    function getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    }

    function calculateDuration(start, end) {
        const sH = parseInt(start.split(':')[0]);
        const sM = parseInt(start.split(':')[1]);
        let eH = parseInt(end.split(':')[0]);
        const eM = parseInt(end.split(':')[1]);
        
        if (eH < sH || (eH === sH && eM < sM)) {
            eH += 24; // spans midnight
        }
        
        let diffHours = (eH - sH) + (eM - sM)/60;
        
        let restDeduction = 0;
        if (diffHours >= 8) restDeduction = 1;
        else if (diffHours >= 4) restDeduction = 0.5;

        return {
            gross: diffHours,
            rest: restDeduction,
            net: diffHours - restDeduction
        };
    }

    function calculateMonthlyTotalSalary(year, month) {
        const monthScheds = schedules.filter(s => {
            const d = new Date(s.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });

        let totalMonthSalary = 0;
        let totalMonthBase = 0;
        let totalMonthAllowance = 0;

        employees.forEach(emp => {
            if (emp.excludeSalary) return;
            const empScheds = monthScheds.filter(s => s.empId === emp.id);
            if (empScheds.length === 0) return;
            
            const wage = emp.hourlyWage || defaultWage;
            let totalNet = 0;
            let weeklyHours = {};

            empScheds.forEach(sched => {
                const dur = calculateDuration(sched.start, sched.end);
                totalNet += dur.net;

                const weekNo = getWeekNumber(new Date(sched.date));
                if(!weeklyHours[weekNo]) weeklyHours[weekNo] = 0;
                weeklyHours[weekNo] += dur.net;
            });

            let totalAllowance = 0;
            if (emp.applyHolidayAllowance !== false) {
                Object.keys(weeklyHours).forEach(weekNo => {
                    const hrs = weeklyHours[weekNo];
                    if(hrs >= 15) {
                        const cappedHrs = Math.min(hrs, 40);
                        totalAllowance += (cappedHrs / 40) * 8 * wage;
                    }
                });
            }

            const basePay = totalNet * wage;
            totalMonthBase += basePay;
            totalMonthAllowance += totalAllowance;
            totalMonthSalary += basePay + totalAllowance;
        });

        return {
            total: totalMonthSalary,
            base: totalMonthBase,
            allowance: totalMonthAllowance
        };
    }

    function calculateEmployeeSalaryData(emp, year, month) {
        const monthScheds = schedules.filter(s => {
            const d = new Date(s.date);
            return d.getFullYear() === year && d.getMonth() === month && s.empId === emp.id;
        }).sort((a,b) => a.date.localeCompare(b.date));

        const wage = emp.hourlyWage || defaultWage;
        
        let totalGross = 0;
        let totalRest = 0;
        let totalNet = 0;
        
        let weeklyHours = {};
        let dailyBreakdown = [];

        monthScheds.forEach(sched => {
            const dur = calculateDuration(sched.start, sched.end);
            totalGross += dur.gross;
            totalRest += dur.rest;
            totalNet += dur.net;

            const weekNo = getWeekNumber(new Date(sched.date));
            if(!weeklyHours[weekNo]) weeklyHours[weekNo] = 0;
            weeklyHours[weekNo] += dur.net;

            dailyBreakdown.push({
                date: sched.date,
                time: `${sched.start}~${sched.end}`,
                gross: dur.gross,
                rest: dur.rest,
                net: dur.net,
                pay: dur.net * wage
            });
        });

        let totalAllowance = 0;
        let weeklyBreakdown = [];
        
        const appliesAllowance = emp.applyHolidayAllowance !== false;
        
        Object.keys(weeklyHours).forEach(weekNo => {
            const hrs = weeklyHours[weekNo];
            let isQualified = false;
            let allowance = 0;
            if(hrs >= 15 && appliesAllowance) {
                isQualified = true;
                const cappedHrs = Math.min(hrs, 40);
                allowance = (cappedHrs / 40) * 8 * wage;
                totalAllowance += allowance;
            }
            weeklyBreakdown.push({
                weekNo: weekNo,
                hours: hrs,
                isQualified: isQualified,
                allowance: allowance
            });
        });

        const estimatedSalary = (totalNet * wage) + totalAllowance;
        
        return { emp, wage, totalGross, totalRest, totalNet, totalAllowance, estimatedSalary, dailyBreakdown, weeklyBreakdown };
    }

    function renderSalaryView(baseDate) {
        salaryTbody.innerHTML = '';
        const mobileSalaryList = document.getElementById('mobile-salary-list');
        if (mobileSalaryList) mobileSalaryList.innerHTML = '';

        if(employees.length === 0) {
            salaryTbody.innerHTML = '<tr><td colspan="7" class="empty-state">등록된 근무자가 없습니다.</td></tr>'; 
            if (mobileSalaryList) mobileSalaryList.innerHTML = '<div class="empty-state">등록된 근무자가 없습니다.</div>';
            return;
        }

        const year = baseDate.getFullYear();
        const month = baseDate.getMonth();

        // Get schedules for this month
        const monthScheds = schedules.filter(s => {
            const d = new Date(s.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });

        currentSalaryData = []; // Clear array
        let currentMonthTotal = 0;
        let currentMonthBase = 0;
        let currentMonthAllowance = 0;
        let currentMonthSavedTotal = 0;

        employees.forEach(emp => {
            const empScheds = monthScheds.filter(s => s.empId === emp.id).sort((a,b) => a.date.localeCompare(b.date));
            
            // 퇴사자이면서 이번 달에 스케줄(근무 기록)이 하나도 없다면 급여 대장에 표시하지 않음
            if (emp.isResigned && empScheds.length === 0) return;

            const wage = emp.hourlyWage || defaultWage;
            
            // Keep raw data for modal
            const rawData = calculateEmployeeSalaryData(emp, year, month);
            
            // Calculate totals for stats widget (excluding excluded salary)
            const estimatedSalary = rawData.estimatedSalary;
            if (!emp.excludeSalary) {
                currentMonthTotal += estimatedSalary;
                currentMonthBase += (rawData.totalNet * rawData.wage);
                currentMonthAllowance += rawData.totalAllowance;
            } else {
                currentMonthSavedTotal += estimatedSalary;
            }

            // Push to excel data
            currentSalaryData.push({
                이름: emp.name + (emp.excludeSalary ? ' (급여제외)' : ''),
                '시급(원)': emp.excludeSalary ? '0 (절감액계산용: ' + rawData.wage + ')' : rawData.wage,
                '총 근무(시간)': rawData.totalGross.toFixed(1),
                '휴게 공제(시간)': rawData.totalRest.toFixed(1),
                '순 근무(시간)': rawData.totalNet.toFixed(1),
                '주휴수당(원)': emp.excludeSalary ? 0 : Math.round(rawData.totalAllowance),
                '예상 총 월급(원)': emp.excludeSalary ? 0 : Math.round(estimatedSalary),
                '절감액(원)': emp.excludeSalary ? Math.round(estimatedSalary) : 0,
                
                // Keep raw data for modal
                _raw: rawData
            });


            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            if(emp.isResigned) tr.style.opacity = '0.5';
            
            const appliesAllowance = emp.applyHolidayAllowance !== false;
            const badgeHtml = appliesAllowance 
                ? '<span style="background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">ON</span>' 
                : '<span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">OFF</span>';

            const salaryAmountHtml = emp.excludeSalary 
                ? `<span style="text-decoration: line-through; color: var(--text-muted);">${Math.round(estimatedSalary).toLocaleString()}원</span>
                   <span style="display: block; font-size: 0.8rem; color: #10b981; margin-top: 2px;">(절감액)</span>`
                : `${Math.round(estimatedSalary).toLocaleString()}원`;

            tr.innerHTML = `
                <td class="emp-name-col" style="border-left: 4px solid ${emp.color1}">
                    <strong style="display: flex; align-items: center;">${emp.name}${emp.isResigned ? '<span style="background: var(--danger); color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-left: 0.5rem;">퇴사</span>' : ''}${emp.excludeSalary ? '<span style="background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-left: 0.5rem;">급여제외</span>' : ''}</strong><br>
                    <span style="font-size:0.8rem; color:var(--text-muted)">${rawData.wage.toLocaleString()}원/시</span>
                </td>
                <td>${rawData.totalGross.toFixed(1)}시간</td>
                <td class="deduction-amount">-${rawData.totalRest.toFixed(1)}시간</td>
                <td><strong>${rawData.totalNet.toFixed(1)}시간</strong></td>
                <td>${badgeHtml}</td>
                <td class="allowance-amount">${emp.excludeSalary ? `<span style="text-decoration: line-through; color: var(--text-muted);">+${Math.round(rawData.totalAllowance).toLocaleString()}원</span>` : `+${Math.round(rawData.totalAllowance).toLocaleString()}원`}</td>
                <td class="salary-amount">${salaryAmountHtml}</td>
            `;
            const rowDataToPass = currentSalaryData[currentSalaryData.length-1]._raw;
            tr.addEventListener('click', () => openPayslipModal(rowDataToPass));
            salaryTbody.appendChild(tr);

            // Render Mobile Card
            const mobileSalaryList = document.getElementById('mobile-salary-list');
            if (mobileSalaryList) {
                const card = document.createElement('div');
                card.className = 'mobile-inventory-card';
                card.style.cursor = 'pointer';
                if(emp.isResigned) card.style.opacity = '0.5';
                
                card.innerHTML = `
                    <div class="mobile-inventory-card-header" style="border-left: 4px solid ${emp.color1}; padding-left: 0.8rem;">
                        <div style="font-weight: 600; font-size: 1.1rem;">
                            ${emp.name}
                            ${emp.isResigned ? '<span style="background: var(--danger); color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-left: 0.5rem;">퇴사</span>' : ''}
                            ${emp.excludeSalary ? '<span style="background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-left: 0.5rem;">급여제외</span>' : ''}
                        </div>
                        <div style="font-size:0.85rem; color:var(--text-muted);">${rawData.wage.toLocaleString()}원/시</div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-top: 0.5rem;">
                        <span style="color: var(--text-muted);">순 근무시간:</span>
                        <strong style="color: white;">${rawData.totalNet.toFixed(1)}시간</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                        <span style="color: var(--text-muted);">주휴수당:</span>
                        <span style="color: #10b981;">${badgeHtml} +${emp.excludeSalary ? 0 : Math.round(rawData.totalAllowance).toLocaleString()}원</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 1.1rem; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed rgba(255,255,255,0.1);">
                        <span style="color: white;">예상 월급:</span>
                        <strong style="color: var(--accent);">${salaryAmountHtml}</strong>
                    </div>
                `;
                card.addEventListener('click', () => openPayslipModal(rowDataToPass));
                mobileSalaryList.appendChild(card);
            }
        });

        // Update Stats Widget
        const statsWidget = document.getElementById('salary-stats-widget');
        const statsCurrentTotal = document.getElementById('stats-current-total');
        const statsCompareText = document.getElementById('stats-compare-text');
        const statsSavedTotal = document.getElementById('stats-saved-total');
        
        if (currentMonthTotal > 0 || schedules.length > 0) {
            statsWidget.style.display = 'block';
            statsCurrentTotal.textContent = Math.round(currentMonthTotal).toLocaleString() + '원';
            if (statsSavedTotal) statsSavedTotal.textContent = Math.round(currentMonthSavedTotal).toLocaleString() + '원';

            // Calculate previous month total
            let prevYear = year;
            let prevMonth = month - 1;
            if (prevMonth < 0) {
                prevMonth = 11;
                prevYear--;
            }
            const prevMonthData = calculateMonthlyTotalSalary(prevYear, prevMonth);
            const prevMonthTotal = prevMonthData.total;
            
            if (prevMonthTotal === 0) {
                statsCompareText.textContent = '전월 데이터 없음';
                statsCompareText.style.color = 'var(--text-muted)';
            } else {
                const diff = currentMonthTotal - prevMonthTotal;
                const percent = (Math.abs(diff) / prevMonthTotal) * 100;
                
                if (diff > 0) {
                    statsCompareText.innerHTML = `<span style="color: var(--danger);">${percent.toFixed(1)}% 증가 🔺</span>`;
                } else if (diff < 0) {
                    statsCompareText.innerHTML = `<span style="color: var(--primary);">${percent.toFixed(1)}% 감소 🔻</span>`;
                } else {
                    statsCompareText.innerHTML = `<span style="color: white;">전월과 동일 (-)</span>`;
                }
            }

            // Draw Chart.js (Past 6 months trend)
            const ctx = document.getElementById('salaryChart').getContext('2d');
            if (salaryChartInstance) {
                salaryChartInstance.destroy(); // Prevent overlay/memory leak
            }

            // Calculate past 6 months data
            const labels = [];
            const dataBase = [];
            const dataAllowance = [];
            for (let i = 5; i >= 0; i--) {
                let y = year;
                let m = month - i;
                if (m < 0) {
                    m += 12;
                    y--;
                }
                const mData = (i === 0) ? { total: currentMonthTotal, base: currentMonthBase, allowance: currentMonthAllowance } : calculateMonthlyTotalSalary(y, m);
                labels.push(`${m + 1}월`);
                dataBase.push(Math.round(mData.base));
                dataAllowance.push(Math.round(mData.allowance));
            }

            // Render Chart
            salaryChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: '기본 급여',
                            data: dataBase,
                            backgroundColor: dataBase.map((val, idx) => idx === 5 ? 'rgba(99, 102, 241, 0.8)' : 'rgba(255, 255, 255, 0.2)'),
                            borderColor: dataBase.map((val, idx) => idx === 5 ? 'rgba(99, 102, 241, 1)' : 'rgba(255, 255, 255, 0.4)'),
                            borderWidth: 1,
                            borderRadius: dataAllowance.map(a => a > 0 ? 0 : 6)
                        },
                        {
                            label: '주휴수당',
                            data: dataAllowance,
                            backgroundColor: dataAllowance.map((val, idx) => idx === 5 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 0.3)'),
                            borderColor: dataAllowance.map((val, idx) => idx === 5 ? 'rgba(16, 185, 129, 1)' : 'rgba(16, 185, 129, 0.5)'),
                            borderWidth: 1,
                            borderRadius: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, labels: { color: 'rgba(255,255,255,0.7)' } },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + context.parsed.y.toLocaleString() + '원';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            stacked: true,
                            grid: { display: false },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)', padding: 10 }
                        },
                        y: {
                            stacked: true,
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)',
                                callback: function(value) {
                                    return (value / 10000).toLocaleString() + '만';
                                }
                            }
                        }
                    }
                }
            });

            // Day of Week Chart (요일별 인건비 지출 평균)
            if (dayOfWeekChartInstance) dayOfWeekChartInstance.destroy();
            const dowCtx = document.getElementById('dayOfWeekChart').getContext('2d');
            
            const dowTotals = [0,0,0,0,0,0,0]; // 일,월,화,수,목,금,토
            const dowCounts = [0,0,0,0,0,0,0];
            
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for(let i=1; i<=daysInMonth; i++) {
                const d = new Date(year, month, i);
                dowCounts[d.getDay()]++;
            }
            
            monthScheds.forEach(s => {
                const emp = employees.find(e => e.id === s.empId);
                if(emp && !emp.excludeSalary) {
                    const hrs = calculateDuration(s.start, s.end).net;
                    const wage = parseInt(emp.wage) || defaultWage;
                    const dateObj = new Date(s.date);
                    dowTotals[dateObj.getDay()] += (hrs * wage);
                }
            });
            
            const dowAverages = dowTotals.map((total, idx) => dowCounts[idx] > 0 ? Math.round(total / dowCounts[idx]) : 0);
            
            dayOfWeekChartInstance = new Chart(dowCtx, {
                type: 'bar',
                data: {
                    labels: ['일', '월', '화', '수', '목', '금', '토'],
                    datasets: [{
                        label: '평균 지출액(원)',
                        data: dowAverages,
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    layout: { padding: { bottom: 15, top: 10 } },
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            grid: { color: 'rgba(255,255,255,0.1)' }, 
                            ticks: { 
                                color: 'rgba(255,255,255,0.7)',
                                callback: function(value) { return (value / 10000).toLocaleString() + '만'; }
                            } 
                        },
                        x: { 
                            grid: { display: false }, 
                            ticks: { color: 'rgba(255,255,255,0.7)', padding: 10 } 
                        }
                    }
                }
            });

        } else {
            statsWidget.style.display = 'none';
        }
    }

    // Modal and Excel Logic
    function openMobileDailyModal(dateStr) {
        mobileDailyTitle.textContent = `${dateStr} 스케줄`;
        mobileDailyList.innerHTML = '';
        
        const dayScheds = schedules.filter(s => s.date === dateStr).sort((a,b) => a.start.localeCompare(b.start));
        
        if (dayScheds.length === 0) {
            mobileDailyList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem 0;">일정이 없습니다.</div>';
        } else {
            dayScheds.forEach(sched => {
                const div = document.createElement('div');
                div.style.cssText = `
                    background: linear-gradient(135deg, ${sched.color1}, ${sched.color2});
                    padding: 0.8rem 1rem;
                    border-radius: 8px;
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-weight: 500;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                `;
                div.innerHTML = `
                    <span>${sched.empName}</span>
                    <span style="font-family: var(--font-mono);">${sched.start} ~ ${sched.end}</span>
                `;
                mobileDailyList.appendChild(div);
            });
        }
        
        mobileDailyModal.style.display = 'flex';
    }

    function openPayslipModal(data) {
        payslipTitle.textContent = `${data.emp.name} 님의 급여 명세서`;
        
        // Daily
        payslipDailyTbody.innerHTML = '';
        data.dailyBreakdown.forEach(d => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 0.5rem 0.2rem; border-bottom: 1px solid var(--panel-border); text-align: center; white-space: nowrap;">${d.date.slice(5).replace('-', '.')}</td>
                <td style="padding: 0.5rem 0.2rem; border-bottom: 1px solid var(--panel-border); text-align: center;">
                    <div style="white-space: nowrap;">${d.time}</div>
                    <div style="color:var(--text-muted); font-size:0.75em; white-space: nowrap;">(${d.gross.toFixed(1)}h)</div>
                </td>
                <td style="padding: 0.5rem 0.2rem; border-bottom: 1px solid var(--panel-border); text-align: center;">
                    <div style="white-space: nowrap;">${d.net.toFixed(1)}h</div>
                    <div style="color:var(--danger); font-size:0.75em; white-space: nowrap;">(-${d.rest}h)</div>
                </td>
                <td style="padding: 0.5rem 0.2rem; border-bottom: 1px solid var(--panel-border); text-align: right; white-space: nowrap;">${Math.round(d.pay).toLocaleString()}원</td>
            `;
            payslipDailyTbody.appendChild(tr);
        });
        if(data.dailyBreakdown.length === 0) payslipDailyTbody.innerHTML = '<tr><td colspan="4" class="empty-state">내역 없음</td></tr>';

        // Weekly
        payslipWeeklyTbody.innerHTML = '';
        if (data.emp.applyHolidayAllowance === false) {
            payslipWeeklyTbody.innerHTML = '<tr><td colspan="4" class="empty-state" style="color: var(--danger);">설정에 의해 주휴수당 지급 대상에서 제외된 근무자입니다.</td></tr>';
        } else {
            data.weeklyBreakdown.forEach(w => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="padding: 0.5rem 0.2rem; border-bottom: 1px solid var(--panel-border); text-align: center; white-space: nowrap;">${w.weekNo}주차</td>
                    <td style="padding: 0.5rem 0.2rem; border-bottom: 1px solid var(--panel-border); text-align: center; white-space: nowrap;">${w.hours.toFixed(1)}h</td>
                    <td style="padding: 0.5rem 0.2rem; border-bottom: 1px solid var(--panel-border); text-align: center; white-space: nowrap;">${w.isQualified ? '<span style="color:var(--success)">O</span>' : '<span style="color:var(--danger)">X</span>'}</td>
                    <td style="padding: 0.5rem 0.2rem; border-bottom: 1px solid var(--panel-border); text-align: right; white-space: nowrap;">${Math.round(w.allowance).toLocaleString()}원</td>
                `;
                payslipWeeklyTbody.appendChild(tr);
            });
            if(data.weeklyBreakdown.length === 0) payslipWeeklyTbody.innerHTML = '<tr><td colspan="4" class="empty-state">내역 없음</td></tr>';
        }

        // Totals
        const payslipBaseTotal = document.getElementById('payslip-base-total');
        const payslipHolidayTotal = document.getElementById('payslip-holiday-total');
        if (payslipBaseTotal) payslipBaseTotal.textContent = Math.round(data.totalNet * data.wage).toLocaleString() + '원';
        if (payslipHolidayTotal) payslipHolidayTotal.textContent = Math.round(data.totalAllowance).toLocaleString() + '원';
        if (payslipTotalAmount) {
            if (data.emp.excludeSalary) {
                payslipTotalAmount.innerHTML = `<span style="text-decoration: line-through; color: var(--text-muted); font-size: 1.2rem;">${Math.round(data.estimatedSalary).toLocaleString()}원</span> <span style="color: #10b981; font-size: 1rem;">(절감액)</span>`;
            } else {
                payslipTotalAmount.textContent = Math.round(data.estimatedSalary).toLocaleString() + '원';
            }
        }

        payslipModal.style.display = 'flex';
    }

    if (closePayslipBtn) {
        closePayslipBtn.addEventListener('click', () => {
            payslipModal.style.display = 'none';
        });
    }

    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', () => {
            if (currentSalaryData.length === 0) {
                alert('다운로드할 데이터가 없습니다.');
                return;
            }
            // Remove _raw before export
            const exportData = currentSalaryData.map(d => {
                const copy = {...d};
                delete copy._raw;
                return copy;
            });

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "급여대장");
            
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            XLSX.writeFile(wb, `${year}년_${month}월_급여대장_YKS.xlsx`);
        });
    }

    if (viewMySalaryBtn) {
        viewMySalaryBtn.addEventListener('click', () => {
            if (window.innerWidth <= 1024) {
                // 사이드바 닫기 로직 임시 호출 (아래에 선언되어있으나 끌어다 씀, 호이스팅 안되므로 직접 조작하거나 무시)
                const viewToggles = document.querySelector('.view-toggles');
                const sidebarOverlay = document.getElementById('sidebar-overlay');
                if(viewToggles) viewToggles.classList.remove('open');
                if(sidebarOverlay) sidebarOverlay.style.display = 'none';
                document.body.style.overflow = '';
            }
            mySalaryPinInput.value = '';
            if (mySalaryEmpSelect.options.length > 1) {
                mySalaryEmpSelect.selectedIndex = 0;
            }
            mySalaryAuthModal.style.display = 'flex';
        });
    }

    if (cancelMySalaryBtn) {
        cancelMySalaryBtn.addEventListener('click', () => {
            mySalaryAuthModal.style.display = 'none';
        });
    }

    if (confirmMySalaryBtn) {
        confirmMySalaryBtn.addEventListener('click', () => {
            const empId = mySalaryEmpSelect.value;
            const pin = mySalaryPinInput.value.trim();
            if (!empId) { alert('이름을 선택해주세요.'); return; }
            if (!pin || pin.length !== 4) { alert('PIN 번호 4자리를 입력해주세요.'); return; }

            const emp = employees.find(e => e.id === empId);
            if (!emp) return;

            const correctPin = emp.pin || '0000';
            if (pin === correctPin) {
                // Success
                mySalaryAuthModal.style.display = 'none';
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const rawData = calculateEmployeeSalaryData(emp, year, month);
                openPayslipModal(rawData);
            } else {
                alert('비밀번호가 일치하지 않습니다.');
            }
        });
    }

    // 모바일 사이드바 메뉴 로직
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const viewToggles = document.querySelector('.view-toggles');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const boardHeader = document.querySelector('.board-header');
    
    function closeMobileSidebar() {
        if(viewToggles) viewToggles.classList.remove('open');
        if(sidebarOverlay) sidebarOverlay.style.display = 'none';
        document.body.style.overflow = '';
        
        // 애니메이션(0.3s) 후 원래 위치로 복귀시켜 데스크탑 레이아웃 꼬임 방지
        setTimeout(() => {
            if (window.innerWidth <= 1024 && viewToggles && boardHeader) {
                // 모바일일때만 복귀? 아니 항상 원래자리로
                boardHeader.appendChild(viewToggles);
            }
        }, 300);
    }
    
    function openMobileSidebar() {
        // 모바일에서 stacking context(z-index)나 overflow: hidden에 갇히지 않도록 body 최상단으로 이동!
        if(viewToggles) document.body.appendChild(viewToggles);
        
        // 약간의 딜레이 후 클래스 추가 (DOM 이동 후 transition 적용을 위해)
        requestAnimationFrame(() => {
            if(viewToggles) viewToggles.classList.add('open');
            if(sidebarOverlay) sidebarOverlay.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', openMobileSidebar);
    }
    
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', closeMobileSidebar);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeMobileSidebar);
    }
    
    // 모바일 사이드바 안의 메뉴 버튼을 클릭하면 창이 닫히도록 설정
    if (viewToggles) {
        const navBtns = viewToggles.querySelectorAll('.btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (window.innerWidth <= 1024) {
                    closeMobileSidebar();
                }
            });
        });
    }

});
