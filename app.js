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
    
    const TIMELINE_START = 9;
    const TIMELINE_END = 24; // 09:00 ~ 24:00 (midnight)
    const TIMELINE_HOURS = TIMELINE_END - TIMELINE_START;

    // DOM Elements - Controls
    const empNameInput = document.getElementById('emp-name');
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

    // DOM Elements - Edit Employee Modal
    const editEmpModal = document.getElementById('edit-emp-modal');
    const editEmpNameInput = document.getElementById('edit-emp-name');
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
    
    function showConfirm(msg, callback) {
        confirmModalMessage.textContent = msg;
        currentConfirmCallback = callback;
        confirmModal.style.display = 'flex';
    }

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
                inventoryData[doc.id] = doc.data();
            });
            if (viewMode === 'inventory') {
                renderInventory();
            }
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
    
    viewDailyBtn.addEventListener('click', () => setViewMode('daily'));
    viewWeeklyBtn.addEventListener('click', () => setViewMode('weekly'));
    viewMonthlyBtn.addEventListener('click', () => setViewMode('monthly'));
    viewInventoryBtn.addEventListener('click', () => setViewMode('inventory'));
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
    
    const addInventoryBtn = document.getElementById('add-inventory-btn');
    const newInventoryNameInput = document.getElementById('new-inventory-name');
    if (addInventoryBtn && newInventoryNameInput) {
        addInventoryBtn.addEventListener('click', async () => {
            const name = newInventoryNameInput.value.trim();
            if (!name) return;
            
            const id = 'inv_' + Date.now();
            const payload = {
                id,
                name,
                status: 'good',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            addInventoryBtn.disabled = true;
            try {
                await db.collection('inventory').doc(id).set(payload);
                newInventoryNameInput.value = '';
            } catch(e) {
                console.error(e);
                alert('추가 실패');
            } finally {
                addInventoryBtn.disabled = false;
            }
        });
    }

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
        
        viewContainerDaily.style.display = 'none';
        viewContainerWeekly.style.display = 'none';
        viewContainerMonthly.style.display = 'none';
        viewContainerSalary.style.display = 'none';
        viewContainerInventory.style.display = 'none';
        if (viewContainerDisposal) viewContainerDisposal.style.display = 'none';
        document.querySelector('.board-controls').style.display = 'flex'; // show board controls by default

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
            document.querySelector('.board-controls').style.display = 'none'; // hide board controls for inventory
            renderInventoryCheckStatus();
            renderInventory(); // Load inventory data
        } else if (mode === 'disposal') {
            viewInventoryBtn.classList.add('active'); // Keep inventory tab highlighted
            if (viewContainerDisposal) viewContainerDisposal.style.display = 'block';
            document.querySelector('.board-controls').style.display = 'none'; 
            renderInventoryCheckStatus();
            renderDisposalArchive();
        }
        
        if (mode !== 'inventory' && mode !== 'disposal') {
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
        } else if (viewMode === 'weekly') {
            const weekDates = getWeekDates(currentDate);
            const startStr = formatDateString(weekDates[0]);
            const endStr = formatDateString(weekDates[6]);
            boardDateDisplay.textContent = `${startStr} ~ ${endStr}`;
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
        } else if (qty <= thres) {
            badgeContainer.innerHTML = `<span class="status-badge status-danger">부족<br>(발주요망)</span>`;
        } else {
            badgeContainer.innerHTML = `<span class="status-badge status-good">충분<br>(여유)</span>`;
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
        
        const qty = parseInt(row.querySelector('.inv-qty').value) || 0;
        const thres = parseInt(row.querySelector('.inv-threshold').value) || 0;
        const isOrdered = row.querySelector('.inv-ordered').checked;
        
        let status = 'good';
        if (isOrdered) status = 'ordered';
        else if (qty <= thres) status = 'danger';

        const payload = {
            id: id,
            name: data.name,
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

        try {
            await db.collection('inventory').doc(id).set(payload, { merge: true });
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
        
        const items = Object.values(disposalData).sort((a, b) => {
            const timeA = a.archivedAt ? a.archivedAt.toMillis() : 0;
            const timeB = b.archivedAt ? b.archivedAt.toMillis() : 0;
            return timeB - timeA; // Descending order (newest first)
        });

        items.forEach(data => {
            const tr = document.createElement('tr');
            let dateStr = '';
            if (data.archivedAt) {
                const d = data.archivedAt.toDate();
                dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            }
            tr.innerHTML = `
                <td>${dateStr}</td>
                <td style="font-weight: 600;">${data.name}</td>
                <td>${data.quantity || 0}</td>
                <td style="text-align: left;">${data.memo || ''}</td>
                <td><button class="btn outline-danger btn-sm" onclick="deleteDisposalRecord('${data.id}')">삭제</button></td>
            `;
            tbody.appendChild(tr);
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

    function renderInventory() {
        if (!inventoryTbody) return;
        inventoryTbody.innerHTML = '';
        
        const getStatusHtml = (status) => {
            if (status === 'ordered') return `<span class="status-badge status-ordered">배송 중<br>🚚</span>`;
            if (status === 'danger') return `<span class="status-badge status-danger">부족<br>(발주요망)</span>`;
            return `<span class="status-badge status-good">충분<br>(여유)</span>`;
        };
        
        const items = Object.values(inventoryData).sort((a, b) => {
            if (a.createdAt && b.createdAt) return a.createdAt.toMillis() - b.createdAt.toMillis();
            return a.name.localeCompare(b.name);
        });

        items.forEach(data => {
            const tr = document.createElement('tr');
            tr.id = `inv-row-${data.id}`;
            const qty = data.quantity || 0;
            const thres = data.threshold || 0;
            const isOrdered = data.isOrdered ? 'checked' : '';
            
            tr.innerHTML = `
                <td style="font-weight: 600; text-align: left; padding-left: 1rem;">${data.name}</td>
                <td>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 0.3rem;">
                        <input type="number" class="inv-qty inv-qty-input" value="${qty}" min="0" oninput="recalcInventoryStatus('${data.id}')">
                        <span style="color: var(--text-muted);">/</span>
                        <input type="number" class="inv-threshold inv-qty-input" value="${thres}" min="0" oninput="recalcInventoryStatus('${data.id}')" title="경고 기준 수량">
                    </div>
                </td>
                <td>
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 0.4rem;">
                        <div class="inv-badge-container">${getStatusHtml(data.status)}</div>
                        <label style="font-size: 0.75rem; color: var(--text-muted); cursor: pointer;">
                            <input type="checkbox" class="inv-ordered" onchange="recalcInventoryStatus('${data.id}')" ${isOrdered}> 발주 완료
                        </label>
                    </div>
                </td>
                <td><input type="date" class="inv-received" value="${data.receivedDate || ''}"></td>
                <td><input type="date" class="inv-opened" value="${data.openedDate || ''}"></td>
                <td><input type="date" class="inv-action" value="${data.actionDate || ''}"></td>
                <td><input type="text" class="inv-memo" value="${data.memo || ''}" placeholder="메모 (사유 등)"></td>
                <td>
                    <div style="display: flex; gap: 0.2rem; justify-content: center; margin-bottom: 0.3rem;">
                        <button class="btn primary btn-sm save-inv-btn" onclick="saveInventoryItem('${data.id}')">저장</button>
                        <button class="btn outline-danger btn-sm" onclick="deleteInventoryItem('${data.id}')" title="목록에서 삭제">삭제</button>
                    </div>
                    <button class="btn secondary btn-sm" style="width: 100%; font-size: 0.75rem; padding: 0.2rem;" onclick="archiveDisposal('${data.id}')">🗑️ 폐기 이관</button>
                </td>
            `;
            inventoryTbody.appendChild(tr);
        });
    }

    // --- CRUD ---
    async function addEmployee() {
        const name = empNameInput.value.trim();
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
        
        try {
            await db.collection('employees').add({
                name,
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
        if (employees.length === 0) {
            timelineGrid.innerHTML = '<div class="empty-state"><p>등록된 근무자가 없습니다.</p></div>'; return;
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
            });
            timelineGrid.appendChild(lane);
        });
        
        if (!hasSchedules) {
            timelineGrid.insertAdjacentHTML('beforeend', `<div class="empty-state" style="position:absolute;width:100%;pointer-events:none"><p>${dateStr} 스케줄 없음.</p></div>`);
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
        if (employees.length === 0) {
            weeklyTbody.innerHTML = '<tr><td colspan="8" class="empty-state">등록된 근무자가 없습니다.</td></tr>'; return;
        }

        const trHeader = document.createElement('tr');
        trHeader.innerHTML = '<th>근무자</th>';
        const todayStr = formatDateString(new Date());

        weekDates.forEach(date => {
            const dStr = formatDateString(date);
            const cls = dStr === todayStr ? 'class="today-header"' : '';
            trHeader.insertAdjacentHTML('beforeend', `<th ${cls}><div>${getDayName(date)}</div><div style="font-size:0.8rem;margin-top:0.2rem;">${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}</div></th>`);
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
            
            cell.innerHTML = `<div class="monthly-day-number">${cellDate.getDate()}</div>`;
            
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
                        openMobileDailyModal(dateStr);
                    } else {
                        pendingScheduleId = sched.id;
                        passwordTargetAction = 'edit-schedule';
                        passwordModal.style.display = 'flex';
                    }
                });

                // Handle Mobile double tap
                let lastTap = 0;
                item.addEventListener('touchend', (e) => {
                    const currentTime = new Date().getTime();
                    const tapLength = currentTime - lastTap;
                    if (tapLength < 500 && tapLength > 0) {
                        // It's a double tap
                        e.preventDefault();
                        if (window.innerWidth <= 768) {
                            openMobileDailyModal(dateStr);
                        } else {
                            pendingScheduleId = sched.id;
                            passwordTargetAction = 'edit-schedule';
                            passwordModal.style.display = 'flex';
                        }
                    }
                    lastTap = currentTime;
                });
                cell.appendChild(item);
            });
            
            monthlyGrid.appendChild(cell);
        }
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
            
            cell.innerHTML = `<div class="monthly-day-number">${cellDate.getDate()}</div>`;
            
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

    function renderSalaryView(baseDate) {
        salaryTbody.innerHTML = '';
        if(employees.length === 0) {
            salaryTbody.innerHTML = '<tr><td colspan="7" class="empty-state">등록된 근무자가 없습니다.</td></tr>'; return;
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
            
            let totalGross = 0;
            let totalRest = 0;
            let totalNet = 0;
            
            // For weekly holiday allowance
            let weeklyHours = {};
            let dailyBreakdown = [];

            empScheds.forEach(sched => {
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

            // Calculate Holiday Allowance
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
            if (!emp.excludeSalary) {
                currentMonthTotal += estimatedSalary;
                currentMonthBase += (totalNet * wage);
                currentMonthAllowance += totalAllowance;
            } else {
                currentMonthSavedTotal += estimatedSalary;
            }

            // Push to excel data
            currentSalaryData.push({
                이름: emp.name + (emp.excludeSalary ? ' (급여제외)' : ''),
                '시급(원)': emp.excludeSalary ? '0 (절감액계산용: ' + wage + ')' : wage,
                '총 근무(시간)': totalGross.toFixed(1),
                '휴게 공제(시간)': totalRest.toFixed(1),
                '순 근무(시간)': totalNet.toFixed(1),
                '주휴수당(원)': emp.excludeSalary ? 0 : Math.round(totalAllowance),
                '예상 총 월급(원)': emp.excludeSalary ? 0 : Math.round(estimatedSalary),
                '절감액(원)': emp.excludeSalary ? Math.round(estimatedSalary) : 0,
                
                // Keep raw data for modal
                _raw: {
                    emp, wage, totalGross, totalRest, totalNet, totalAllowance, estimatedSalary, dailyBreakdown, weeklyBreakdown
                }
            });

            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            if(emp.isResigned) tr.style.opacity = '0.5';
            
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
                    <span style="font-size:0.8rem; color:var(--text-muted)">${wage.toLocaleString()}원/시</span>
                </td>
                <td>${totalGross.toFixed(1)}시간</td>
                <td class="deduction-amount">-${totalRest.toFixed(1)}시간</td>
                <td><strong>${totalNet.toFixed(1)}시간</strong></td>
                <td>${badgeHtml}</td>
                <td class="allowance-amount">${emp.excludeSalary ? `<span style="text-decoration: line-through; color: var(--text-muted);">+${Math.round(totalAllowance).toLocaleString()}원</span>` : `+${Math.round(totalAllowance).toLocaleString()}원`}</td>
                <td class="salary-amount">${salaryAmountHtml}</td>
            `;
            const rowData = currentSalaryData[currentSalaryData.length-1]._raw;
            tr.addEventListener('click', () => openPayslipModal(rowData));
            salaryTbody.appendChild(tr);
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
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
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
                        x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.7)' } }
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
                <td style="padding: 0.5rem; border-bottom: 1px solid var(--panel-border);">${d.date.slice(5)}</td>
                <td style="padding: 0.5rem; border-bottom: 1px solid var(--panel-border);">${d.time} <span style="color:var(--text-muted); font-size:0.8em">(${d.gross.toFixed(1)}h)</span></td>
                <td style="padding: 0.5rem; border-bottom: 1px solid var(--panel-border);">${d.net.toFixed(1)}h <span style="color:var(--danger); font-size:0.8em">(-${d.rest}h)</span></td>
                <td style="padding: 0.5rem; border-bottom: 1px solid var(--panel-border);">${Math.round(d.pay).toLocaleString()}원</td>
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
                    <td style="padding: 0.5rem; border-bottom: 1px solid var(--panel-border);">${w.weekNo}주차</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid var(--panel-border);">${w.hours.toFixed(1)}시간</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid var(--panel-border);">${w.isQualified ? '<span style="color:var(--success)">충족 (15h 이상)</span>' : '<span style="color:var(--danger)">미달</span>'}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid var(--panel-border);">${Math.round(w.allowance).toLocaleString()}원</td>
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
});
