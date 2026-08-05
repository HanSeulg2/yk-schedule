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
    let currentSalaryData = []; // For Excel and Payslips
    let passwordTargetAction = 'salary';

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
    const clearSchedulesBtn = document.getElementById('clear-schedules-btn');
    
    // DOM Elements - Views
    const viewContainerDaily = document.getElementById('view-container-daily');
    const viewContainerWeekly = document.getElementById('view-container-weekly');
    const viewContainerMonthly = document.getElementById('view-container-monthly');
    const viewContainerSalary = document.getElementById('view-container-salary');
    
    const timeHeader = document.getElementById('time-header');
    const timelineGrid = document.getElementById('timeline-grid');
    const weeklyThead = document.getElementById('weekly-thead');
    const weeklyTbody = document.getElementById('weekly-tbody');
    const monthlyGrid = document.getElementById('monthly-grid');
    const salaryTbody = document.getElementById('salary-tbody');

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

    // DOM Elements - Edit Employee Modal
    const editEmpModal = document.getElementById('edit-emp-modal');
    const editEmpNameInput = document.getElementById('edit-emp-name');
    const editEmpWageInput = document.getElementById('edit-emp-wage');
    const editEmpColorsContainer = document.getElementById('edit-emp-colors');
    const toggleResignEmpBtn = document.getElementById('toggle-resign-emp-btn');
    const cancelEditEmpBtn = document.getElementById('cancel-edit-emp-btn');
    const confirmEditEmpBtn = document.getElementById('confirm-edit-emp-btn');
    const showResignedCb = document.getElementById('show-resigned-cb');
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
        db.collection('employees').onSnapshot((snapshot) => {
            employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderEmployees();
            updateBoard();
        });

        db.collection('schedules').onSnapshot((snapshot) => {
            schedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            updateBoard();
        });

        db.collection('settings').doc('admin').onSnapshot((doc) => {
            if (doc.exists && doc.data().password) {
                adminPassword = doc.data().password;
            } else {
                adminPassword = '0000';
            }
        });
    }

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
            } else if (passwordTargetAction === 'clear') {
                executeClearSchedules();
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
    
    prevDateBtn.addEventListener('click', () => changeDate(-1));
    nextDateBtn.addEventListener('click', () => changeDate(1));
    todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        updateBoard();
    });
    
    viewDailyBtn.addEventListener('click', () => setViewMode('daily'));
    viewWeeklyBtn.addEventListener('click', () => setViewMode('weekly'));
    viewMonthlyBtn.addEventListener('click', () => setViewMode('monthly'));
    viewSalaryBtn.addEventListener('click', () => {
        if (viewMode === 'salary') return;
        passwordTargetAction = 'salary';
        passwordModal.style.display = 'flex';
        salaryPasswordInput.focus();
    });
    
    clearSchedulesBtn.addEventListener('click', () => {
        passwordTargetAction = 'clear';
        passwordModal.style.display = 'flex';
        salaryPasswordInput.focus();
    });

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
        
        viewContainerDaily.style.display = 'none';
        viewContainerWeekly.style.display = 'none';
        viewContainerMonthly.style.display = 'none';
        viewContainerSalary.style.display = 'none';

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
        }
        updateBoard();
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
        scheduleDateInput.value = formatDateString(currentDate);
    }

    // --- CRUD ---
    async function addEmployee() {
        const name = empNameInput.value.trim();
        const wage = parseInt(empWageInput.value.trim()) || 10030;
        
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
                color2: colorPair[1]
            });
        } catch (e) {
            console.error(e);
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
            }
        });
    }

    showResignedCb.addEventListener('change', renderEmployees);

    function openEditEmpModal(emp) {
        editingEmpId = emp.id;
        editingEmpIsResigned = !!emp.isResigned;
        editingEmpSelectedColor = [emp.color1, emp.color2];
        editEmpNameInput.value = emp.name;
        editEmpWageInput.value = emp.hourlyWage || 10030;
        
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
        const newWage = parseInt(editEmpWageInput.value.trim()) || 10030;
        if (!newName) return;

        try {
            confirmEditEmpBtn.textContent = '저장 중...';
            // Update employee
            await db.collection('employees').doc(editingEmpId).update({
                name: newName,
                hourlyWage: newWage,
                color1: editingEmpSelectedColor[0],
                color2: editingEmpSelectedColor[1]
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
        for (let i = 0; i < 24; i++) {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = `${String(i).padStart(2, '0')}:00`;
            timeHeader.appendChild(slot);
        }
    }

    function renderTimeline(dateStr) {
        timelineGrid.innerHTML = '';
        if (employees.length === 0) {
            timelineGrid.innerHTML = '<div class="empty-state"><p>등록된 근무자가 없습니다.</p></div>'; return;
        }

        const dailySchedules = schedules.filter(s => s.date === dateStr);
        let hasSchedules = false;

        employees.forEach(emp => {
            const lane = document.createElement('div');
            lane.className = 'timeline-lane';
            lane.innerHTML = `<div class="lane-label">${emp.name}</div>`;
            
            const empSchedules = dailySchedules.filter(s => s.empId === emp.id);
            if (empSchedules.length > 0) hasSchedules = true;

            empSchedules.forEach(sched => {
                const sH = parseInt(sched.start.split(':')[0]);
                const sM = parseInt(sched.start.split(':')[1]);
                const eH = parseInt(sched.end.split(':')[0]);
                const eM = parseInt(sched.end.split(':')[1]);
                
                let spansMidnight = (eH < sH || (eH === sH && eM < sM));
                if (spansMidnight) {
                    lane.appendChild(createScheduleBlock(sched, sH, sM, 24, 0));
                    lane.appendChild(createScheduleBlock(sched, 0, 0, eH, eM));
                } else {
                    lane.appendChild(createScheduleBlock(sched, sH, sM, eH, eM));
                }
            });
            timelineGrid.appendChild(lane);
        });
        
        if (!hasSchedules) {
            timelineGrid.insertAdjacentHTML('beforeend', `<div class="empty-state" style="position:absolute;width:100%;pointer-events:none"><p>${dateStr} 스케줄 없음.</p></div>`);
        }
    }
    
    function createScheduleBlock(sched, sHour, sMin, eHour, eMin) {
        const startDec = sHour + (sMin / 60);
        const endDec = eHour + (eMin / 60);
        const block = document.createElement('div');
        block.className = 'schedule-block';
        block.style.left = `${(startDec / 24) * 100}%`;
        block.style.width = `${((endDec - startDec) / 24) * 100}%`;
        block.style.setProperty('--bg-color-1', sched.color1);
        block.style.setProperty('--bg-color-2', sched.color2);
        block.innerHTML = `<span>${sched.start}~${sched.end}</span><button class="delete-schedule" data-id="${sched.id}">&times;</button>`;
        block.querySelector('.delete-schedule').addEventListener('click', (e) => {
            e.stopPropagation(); removeSchedule(e.target.dataset.id);
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

        employees.forEach(emp => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td class="emp-name-col" style="border-left: 4px solid ${emp.color1}">${emp.name}</td>`;
            weekDates.forEach(date => {
                const td = document.createElement('td');
                const empDayScheds = schedules.filter(s => s.empId === emp.id && s.date === formatDateString(date));
                empDayScheds.forEach(sched => {
                    const item = document.createElement('div');
                    item.className = 'weekly-schedule-item';
                    item.style.setProperty('--bg-color-1', sched.color1);
                    item.style.setProperty('--bg-color-2', sched.color2);
                    item.innerHTML = `${sched.start}~${sched.end}<button class="delete-weekly-btn" data-id="${sched.id}">&times;</button>`;
                    item.addEventListener('click', () => {
                        alert(`근무자: ${emp.name}\n시간: ${sched.start} ~ ${sched.end}`);
                    });
                    item.querySelector('.delete-weekly-btn').addEventListener('click', (e) => { e.stopPropagation(); removeSchedule(e.target.dataset.id); });
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
            
            const dayScheds = schedules.filter(s => s.date === dateStr);
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
                item.addEventListener('click', () => {
                    alert(`근무자: ${sched.empName}\n일자: ${dateStr}\n시간: ${sched.start} ~ ${sched.end}`);
                });
                item.querySelector('.delete-monthly-btn').addEventListener('click', (e) => {
                    e.stopPropagation(); removeSchedule(e.target.dataset.id);
                });
                cell.appendChild(item);
            });
            
            monthlyGrid.appendChild(cell);
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

        employees.forEach(emp => {
            const empScheds = monthScheds.filter(s => s.empId === emp.id);
            if (empScheds.length === 0) return;
            
            const wage = emp.hourlyWage || 10030;
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
            Object.keys(weeklyHours).forEach(weekNo => {
                const hrs = weeklyHours[weekNo];
                if(hrs >= 15) {
                    const cappedHrs = Math.min(hrs, 40);
                    totalAllowance += (cappedHrs / 40) * 8 * wage;
                }
            });

            totalMonthSalary += (totalNet * wage) + totalAllowance;
        });

        return totalMonthSalary;
    }

    function renderSalaryView(baseDate) {
        salaryTbody.innerHTML = '';
        if(employees.length === 0) {
            salaryTbody.innerHTML = '<tr><td colspan="6" class="empty-state">등록된 근무자가 없습니다.</td></tr>'; return;
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

        employees.forEach(emp => {
            const empScheds = monthScheds.filter(s => s.empId === emp.id).sort((a,b) => a.date.localeCompare(b.date));
            
            // 퇴사자이면서 이번 달에 스케줄(근무 기록)이 하나도 없다면 급여 대장에 표시하지 않음
            if (emp.isResigned && empScheds.length === 0) return;

            const wage = emp.hourlyWage || 10030;
            
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
            Object.keys(weeklyHours).forEach(weekNo => {
                const hrs = weeklyHours[weekNo];
                let isQualified = false;
                let allowance = 0;
                if(hrs >= 15) {
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
            currentMonthTotal += estimatedSalary;

            // Push to excel data
            currentSalaryData.push({
                이름: emp.name,
                '시급(원)': wage,
                '총 근무(시간)': totalGross.toFixed(1),
                '휴게 공제(시간)': totalRest.toFixed(1),
                '순 근무(시간)': totalNet.toFixed(1),
                '주휴수당(원)': Math.round(totalAllowance),
                '예상 총 월급(원)': Math.round(estimatedSalary),
                
                // Keep raw data for modal
                _raw: {
                    emp, wage, totalGross, totalRest, totalNet, totalAllowance, estimatedSalary, dailyBreakdown, weeklyBreakdown
                }
            });

            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            if(emp.isResigned) tr.style.opacity = '0.5';
            tr.innerHTML = `
                <td class="emp-name-col" style="border-left: 4px solid ${emp.color1}">
                    <strong style="display: flex; align-items: center;">${emp.name}${emp.isResigned ? '<span style="background: var(--danger); color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-left: 0.5rem;">퇴사</span>' : ''}</strong><br>
                    <span style="font-size:0.8rem; color:var(--text-muted)">${wage.toLocaleString()}원/시</span>
                </td>
                <td>${totalGross.toFixed(1)}시간</td>
                <td class="deduction-amount">-${totalRest.toFixed(1)}시간</td>
                <td><strong>${totalNet.toFixed(1)}시간</strong></td>
                <td class="allowance-amount">+${Math.round(totalAllowance).toLocaleString()}원</td>
                <td class="salary-amount">${Math.round(estimatedSalary).toLocaleString()}원</td>
            `;
            tr.addEventListener('click', () => openPayslipModal(currentSalaryData[currentSalaryData.length-1]._raw));
            salaryTbody.appendChild(tr);
        });

        // Update Stats Widget
        const statsWidget = document.getElementById('salary-stats-widget');
        const statsCurrentTotal = document.getElementById('stats-current-total');
        const statsCompareText = document.getElementById('stats-compare-text');
        
        if (currentMonthTotal > 0 || schedules.length > 0) {
            statsWidget.style.display = 'block';
            statsCurrentTotal.textContent = Math.round(currentMonthTotal).toLocaleString() + '원';

            // Calculate previous month total
            let prevYear = year;
            let prevMonth = month - 1;
            if (prevMonth < 0) {
                prevMonth = 11;
                prevYear--;
            }
            const prevMonthTotal = calculateMonthlyTotalSalary(prevYear, prevMonth);
            
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
            const data = [];
            for (let i = 5; i >= 0; i--) {
                let y = year;
                let m = month - i;
                if (m < 0) {
                    m += 12;
                    y--;
                }
                const mTotal = (i === 0) ? currentMonthTotal : calculateMonthlyTotalSalary(y, m);
                labels.push(`${m + 1}월`);
                data.push(Math.round(mTotal));
            }

            // Render Chart
            salaryChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '인건비 총액 (원)',
                        data: data,
                        backgroundColor: data.map((val, idx) => idx === 5 ? 'rgba(99, 102, 241, 0.8)' : 'rgba(255, 255, 255, 0.2)'),
                        borderColor: data.map((val, idx) => idx === 5 ? 'rgba(99, 102, 241, 1)' : 'rgba(255, 255, 255, 0.4)'),
                        borderWidth: 1,
                        borderRadius: 6,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.parsed.y.toLocaleString() + '원';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)',
                                callback: function(value) {
                                    return (value / 10000).toLocaleString() + '만';
                                }
                            }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                        }
                    }
                }
            });

        } else {
            statsWidget.style.display = 'none';
        }
    }

    // Modal and Excel Logic
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

        // Totals
        const payslipBaseTotal = document.getElementById('payslip-base-total');
        const payslipHolidayTotal = document.getElementById('payslip-holiday-total');
        if (payslipBaseTotal) payslipBaseTotal.textContent = Math.round(data.totalNet * data.wage).toLocaleString() + '원';
        if (payslipHolidayTotal) payslipHolidayTotal.textContent = Math.round(data.totalAllowance).toLocaleString() + '원';
        if (payslipTotalAmount) payslipTotalAmount.textContent = Math.round(data.estimatedSalary).toLocaleString() + '원';

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
