// ========================================
// Mock Database (ใช้ LocalStorage แทน Database จริง)
// ========================================
const DB = {
    // Get all users
    getUsers: function() {
        const users = localStorage.getItem('sroi_users');
        return users ? JSON.parse(users) : [];
    },
    
    // Save all users
    saveUsers: function(users) {
        localStorage.setItem('sroi_users', JSON.stringify(users));
    },
    
    // Find user by email
    findUserByEmail: function(email) {
        const users = this.getUsers();
        return users.find(u => u.email === email);
    },
    
    // Add new user
    addUser: function(user) {
        const users = this.getUsers();
        users.push(user);
        this.saveUsers(users);
    },
    
    // Update user
    updateUser: function(email, updates) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.email === email);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            this.saveUsers(users);
            return users[index];
        }
        return null;
    }
};

// ========================================
// Email Service Simulation
// ========================================
const EmailService = {
    // Simulate sending email (in production, this should call a real email API)
    sendPasswordEmail: function(email, password, name) {
        console.log('='.repeat(50));
        console.log('📧 Sending Email to:', email);
        console.log('Subject: รหัสผ่านสำหรับเข้าใช้งาน SROI Calculator');
        console.log('-'.repeat(50));
        console.log(`สวัสดีคุณ ${name},\n`);
        console.log('ขอบคุณที่สมัครใช้งาน SROI Calculator');
        console.log(`รหัสผ่านของคุณคือ: ${password}\n`);
        console.log('กรุณาเก็บรหัสผ่านนี้ไว้อย่างปลอดภัย');
        console.log('คุณสามารถเข้าสู่ระบบได้ที่หน้าเว็บไซต์');
        console.log('='.repeat(50));
        
        // In production, you would call an API like:
        // fetch('/api/send-email', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ email, password, name })
        // });
        
        return true;
    }
};

// ========================================
// Authentication Service
// ========================================
const AuthService = {
    // Generate random password
    generatePassword: function(length = 8) {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    },
    
    // Register new user
    register: async function(name, email, organization = '') {
        // Check if user already exists
        const existingUser = DB.findUserByEmail(email);
        if (existingUser) {
            throw new Error('อีเมลนี้ถูกใช้งานแล้ว');
        }
        
        // Generate password
        const password = this.generatePassword();
        
        // Create user object
        const user = {
            id: Date.now(),
            name: name,
            email: email,
            organization: organization,
            password: password, // In production, this should be hashed!
            createdAt: new Date().toISOString()
        };
        
        // Save to database
        DB.addUser(user);
        
        // Send email with password
        EmailService.sendPasswordEmail(email, password, name);
        
        return {
            success: true,
            message: 'สมัครสมาชิกสำเร็จ! รหัสผ่านได้ถูกส่งไปยังอีเมลของคุณแล้ว'
        };
    },
    
    // Login user
    login: function(email, password) {
        const user = DB.findUserByEmail(email);
        
        if (!user) {
            throw new Error('ไม่พบบัญชีผู้ใช้นี้');
        }
        
        if (user.password !== password) {
            throw new Error('รหัสผ่านไม่ถูกต้อง');
        }
        
        // Generate token (simplified version)
        const token = btoa(JSON.stringify({
            userId: user.id,
            email: user.email,
            timestamp: Date.now()
        }));
        
        return {
            success: true,
            token: token,
            userName: user.name,
            email: user.email
        };
    },
    
    // Verify token
    verifyToken: function(token) {
        try {
            const data = JSON.parse(atob(token));
            const user = DB.findUserByEmail(data.email);
            return user ? { valid: true, user: user } : { valid: false };
        } catch (e) {
            return { valid: false };
        }
    }
};

// ========================================
// Application State
// ========================================
const appState = {
    isLoggedIn: false,
    currentUser: null,
    currentStep: 1,
    projectData: {
        projectName: '',
        organization: '',
        projectDescription: '',
        startDate: '',
        endDate: '',
        totalBudget: 0,
        evaluationPeriod: 3,
        sroiType: 'evaluative'
    },
    stakeholders: [],
    outcomes: [],
    impactFactors: {},
    calculationParams: {
        discountRate: 3,
        dropOffRate: 0
    },
    results: {
        totalInvestment: 0,
        totalBenefits: 0,
        netPresentValue: 0,
        sroiRatio: 0,
        irr: 0,
        paybackPeriod: 0
    },
    charts: {}
};

// ========================================
// Initialize Demo Users (สำหรับทดสอบ)
// ========================================
function initializeDemoUsers() {
    const users = DB.getUsers();
    if (users.length === 0) {
        // Create demo user
        DB.addUser({
            id: 1,
            name: 'ผู้ดูแลระบบ',
            email: 'admin@sroi.com',
            organization: 'Bangkok University',
            password: 'admin123',
            createdAt: new Date().toISOString()
        });
        console.log('✅ Demo user created: admin@sroi.com / admin123');
    }
}

// ========================================
// Navigation Functions
// ========================================
function goToStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.step-content').forEach(step => {
        step.classList.remove('active');
    });
    
    // Show target step
    const targetStep = document.getElementById(`step${stepNumber}`);
    if (targetStep) {
        targetStep.classList.add('active');
    }
    
    // Update navigation
    document.querySelectorAll('.step-nav-item').forEach((item, index) => {
        item.classList.remove('active', 'completed');
        if (index + 1 === stepNumber) {
            item.classList.add('active');
        } else if (index + 1 < stepNumber) {
            item.classList.add('completed');
        }
    });
    
    appState.currentStep = stepNumber;
    updateProgressBar();
    
    // Update buttons
    updateNavigationButtons();
    
    // If going to step 5, calculate results
    if (stepNumber === 5) {
        calculateResults();
        renderCharts();
    }
}

function updateProgressBar() {
    const progress = (appState.currentStep / 6) * 100;
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = progress + '%';
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) {
        prevBtn.style.display = appState.currentStep === 1 ? 'none' : 'inline-flex';
    }
    
    if (nextBtn) {
        nextBtn.textContent = appState.currentStep === 6 ? 'เสร็จสิ้น' : 'ถัดไป →';
    }
}

function nextStep() {
    if (validateCurrentStep()) {
        if (appState.currentStep < 6) {
            goToStep(appState.currentStep + 1);
        }
    }
}

function previousStep() {
    if (appState.currentStep > 1) {
        goToStep(appState.currentStep - 1);
    }
}

function validateCurrentStep() {
    const step = appState.currentStep;
    
    if (step === 1) {
        const projectName = document.getElementById('projectName');
        const organization = document.getElementById('organization');
        const totalBudget = document.getElementById('totalBudget');
        
        if (!projectName || !projectName.value) {
            alert('กรุณากรอกชื่อโครงการ');
            return false;
        }
        if (!organization || !organization.value) {
            alert('กรุณากรอกชื่อองค์กร');
            return false;
        }
        if (!totalBudget || !totalBudget.value || parseFloat(totalBudget.value) <= 0) {
            alert('กรุณากรอกงบประมาณที่ถูกต้อง');
            return false;
        }
        
        saveProjectData();
    }
    
    if (step === 2) {
        if (appState.stakeholders.length === 0) {
            alert('กรุณาเพิ่มผู้มีส่วนได้ส่วนเสียอย่างน้อย 1 รายการ');
            return false;
        }
    }
    
    if (step === 3) {
        if (appState.outcomes.length === 0) {
            alert('กรุณาเพิ่มผลลัพธ์อย่างน้อย 1 รายการ');
            return false;
        }
    }
    
    if (step === 4) {
        saveCalculationParams();
    }
    
    return true;
}

// ========================================
// Step 1: Project Data
// ========================================
function saveProjectData() {
    appState.projectData = {
        projectName: document.getElementById('projectName')?.value || '',
        organization: document.getElementById('organization')?.value || '',
        projectDescription: document.getElementById('projectDescription')?.value || '',
        startDate: document.getElementById('startDate')?.value || '',
        endDate: document.getElementById('endDate')?.value || '',
        totalBudget: parseFloat(document.getElementById('totalBudget')?.value || 0),
        evaluationPeriod: parseInt(document.getElementById('evaluationPeriod')?.value || 3),
        sroiType: document.getElementById('sroiType')?.value || 'evaluative'
    };
}

// ========================================
// Step 2: Stakeholders
// ========================================
function addStakeholder() {
    const nameInput = document.getElementById('stakeholderName');
    const countInput = document.getElementById('stakeholderCount');
    const descInput = document.getElementById('stakeholderDescription');
    
    if (!nameInput || !countInput) {
        alert('ไม่พบฟอร์มกรอกข้อมูล');
        return;
    }
    
    const name = nameInput.value.trim();
    const count = parseInt(countInput.value);
    const description = descInput ? descInput.value.trim() : '';
    
    if (!name) {
        alert('กรุณากรอกชื่อผู้มีส่วนได้ส่วนเสีย');
        return;
    }
    
    if (!count || count <= 0) {
        alert('กรุณากรอกจำนวนคนที่ถูกต้อง');
        return;
    }
    
    const stakeholder = {
        id: Date.now(),
        name: name,
        count: count,
        description: description
    };
    
    appState.stakeholders.push(stakeholder);
    renderStakeholdersTable();
    updateOutcomeStakeholderDropdown();
    
    // Clear form
    nameInput.value = '';
    countInput.value = '';
    if (descInput) descInput.value = '';
}

function removeStakeholder(id) {
    if (confirm('คุณต้องการลบผู้มีส่วนได้ส่วนเสียนี้ใช่หรือไม่?')) {
        appState.stakeholders = appState.stakeholders.filter(s => s.id !== id);
        appState.outcomes = appState.outcomes.filter(o => o.stakeholderId !== id);
        renderStakeholdersTable();
        updateOutcomeStakeholderDropdown();
    }
}

function renderStakeholdersTable() {
    const tbody = document.getElementById('stakeholdersTableBody');
    if (!tbody) return;
    
    if (appState.stakeholders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">ยังไม่มีข้อมูล</td></tr>';
        return;
    }
    
    tbody.innerHTML = appState.stakeholders.map(s => `
        <tr>
            <td>${s.name}</td>
            <td>${s.count}</td>
            <td>${s.description || '-'}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="removeStakeholder(${s.id})">ลบ</button>
            </td>
        </tr>
    `).join('');
}

// ========================================
// Step 3: Outcomes
// ========================================
function updateOutcomeStakeholderDropdown() {
    const select = document.getElementById('outcomeStakeholder');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- เลือกกลุ่ม --</option>';
    appState.stakeholders.forEach(s => {
        const option = document.createElement('option');
        option.value = s.id;
        option.textContent = s.name;
        select.appendChild(option);
    });
}

function addOutcome() {
    const stakeholderSelect = document.getElementById('outcomeStakeholder');
    const dimensionSelect = document.getElementById('outcomeDimension');
    const nameInput = document.getElementById('outcomeName');
    const descInput = document.getElementById('outcomeDescription');
    
    if (!stakeholderSelect || !dimensionSelect || !nameInput) {
        alert('ไม่พบฟอร์มกรอกข้อมูล');
        return;
    }
    
    const stakeholderId = parseInt(stakeholderSelect.value);
    const dimension = dimensionSelect.value;
    const name = nameInput.value.trim();
    const description = descInput ? descInput.value.trim() : '';
    
    if (!stakeholderId) {
        alert('กรุณาเลือกผู้มีส่วนได้ส่วนเสีย');
        return;
    }
    
    if (!name) {
        alert('กรุณากรอกชื่อผลลัพธ์');
        return;
    }
    
    const stakeholder = appState.stakeholders.find(s => s.id === stakeholderId);
    if (!stakeholder) {
        alert('ไม่พบข้อมูลผู้มีส่วนได้ส่วนเสีย');
        return;
    }
    
    const outcome = {
        id: Date.now(),
        stakeholderId: stakeholderId,
        stakeholderName: stakeholder.name,
        dimension: dimension,
        name: name,
        description: description,
        value: 0,
        deadweight: 0,
        attribution: 0,
        displacement: 0
    };
    
    appState.outcomes.push(outcome);
    renderOutcomesTable();
    renderValuationList();
    
    // Clear form
    nameInput.value = '';
    if (descInput) descInput.value = '';
}

function removeOutcome(id) {
    if (confirm('คุณต้องการลบผลลัพธ์นี้ใช่หรือไม่?')) {
        appState.outcomes = appState.outcomes.filter(o => o.id !== id);
        renderOutcomesTable();
        renderValuationList();
    }
}

function renderOutcomesTable() {
    const tbody = document.getElementById('outcomesTableBody');
    if (!tbody) return;
    
    if (appState.outcomes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">ยังไม่มีข้อมูล</td></tr>';
        return;
    }
    
    const dimensionLabels = {
        'economic': 'เศรษฐกิจ',
        'social': 'สังคม',
        'environmental': 'สิ่งแวดล้อม'
    };
    
    tbody.innerHTML = appState.outcomes.map(o => `
        <tr>
            <td>${o.stakeholderName}</td>
            <td>${o.name}</td>
            <td>${dimensionLabels[o.dimension] || o.dimension}</td>
            <td>${o.description || '-'}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="removeOutcome(${o.id})">ลบ</button>
            </td>
        </tr>
    `).join('');
}

// ========================================
// Step 4: Valuation
// ========================================
function renderValuationList() {
    const container = document.getElementById('valuationList');
    if (!container) return;
    
    if (appState.outcomes.length === 0) {
        container.innerHTML = '<p style="color: var(--color-text-light);">กรุณาเพิ่มผลลัพธ์ในขั้นตอนที่ 3 ก่อน</p>';
        return;
    }
    
    container.innerHTML = appState.outcomes.map(outcome => `
        <div class="form-group" style="border: 1px solid var(--color-border); padding: var(--space-md); border-radius: var(--radius-md); margin-bottom: var(--space-md);">
            <h4 style="color: var(--color-primary); margin-bottom: var(--space-sm);">${outcome.stakeholderName} - ${outcome.name}</h4>
            <div class="grid grid-2">
                <div class="form-group">
                    <label class="form-label">มูลค่า (บาท)</label>
                    <input type="number" class="form-control" value="${outcome.value}" 
                           onchange="updateOutcomeValue(${outcome.id}, 'value', this.value)" min="0" step="0.01">
                </div>
                <div class="form-group">
                    <label class="form-label">Deadweight (%)</label>
                    <input type="number" class="form-control" value="${outcome.deadweight}" 
                           onchange="updateOutcomeValue(${outcome.id}, 'deadweight', this.value)" min="0" max="100" step="1">
                </div>
                <div class="form-group">
                    <label class="form-label">Attribution (%)</label>
                    <input type="number" class="form-control" value="${outcome.attribution}" 
                           onchange="updateOutcomeValue(${outcome.id}, 'attribution', this.value)" min="0" max="100" step="1">
                </div>
                <div class="form-group">
                    <label class="form-label">Displacement (%)</label>
                    <input type="number" class="form-control" value="${outcome.displacement}" 
                           onchange="updateOutcomeValue(${outcome.id}, 'displacement', this.value)" min="0" max="100" step="1">
                </div>
            </div>
        </div>
    `).join('');
}

function updateOutcomeValue(outcomeId, field, value) {
    const outcome = appState.outcomes.find(o => o.id === outcomeId);
    if (outcome) {
        outcome[field] = parseFloat(value) || 0;
    }
}

function saveCalculationParams() {
    const discountRate = document.getElementById('discountRate');
    const dropOffRate = document.getElementById('dropOffRate');
    
    if (discountRate) {
        appState.calculationParams.discountRate = parseFloat(discountRate.value) / 100 || 0.03;
    }
    if (dropOffRate) {
        appState.calculationParams.dropOffRate = parseFloat(dropOffRate.value) / 100 || 0;
    }
}

// ========================================
// Step 5: Calculate Results
// ========================================
function calculateResults() {
    // Total Investment
    appState.results.totalInvestment = appState.projectData.totalBudget;
    
    // Calculate benefits
    let totalBenefits = 0;
    const years = appState.projectData.evaluationPeriod;
    const discountRate = appState.calculationParams.discountRate;
    const dropOffRate = appState.calculationParams.dropOffRate;
    
    appState.outcomes.forEach(outcome => {
        const stakeholder = appState.stakeholders.find(s => s.id === outcome.stakeholderId);
        if (!stakeholder) return;
        
        // Calculate net impact
        const netImpact = outcome.value * stakeholder.count *
                         (1 - outcome.deadweight / 100) *
                         (1 - outcome.attribution / 100) *
                         (1 - outcome.displacement / 100);
        
        // Calculate present value over years
        for (let year = 1; year <= years; year++) {
            const yearImpact = netImpact * Math.pow(1 - dropOffRate, year - 1);
            const pv = yearImpact / Math.pow(1 + discountRate, year);
            totalBenefits += pv;
        }
    });
    
    appState.results.totalBenefits = totalBenefits;
    appState.results.netPresentValue = totalBenefits - appState.results.totalInvestment;
    appState.results.sroiRatio = appState.results.totalInvestment > 0 
        ? totalBenefits / appState.results.totalInvestment 
        : 0;
    
    // Calculate IRR (simplified)
    appState.results.irr = calculateIRR();
    
    // Calculate payback period
    appState.results.paybackPeriod = calculatePaybackPeriod();
    
    // Display results
    displayResults();
}

function calculateIRR() {
    // Simplified IRR calculation
    const investment = appState.results.totalInvestment;
    const benefit = appState.results.totalBenefits;
    const years = appState.projectData.evaluationPeriod;
    
    if (investment === 0 || years === 0) return 0;
    
    const avgAnnualBenefit = benefit / years;
    const irr = (avgAnnualBenefit - investment) / investment;
    
    return irr;
}

function calculatePaybackPeriod() {
    const investment = appState.results.totalInvestment;
    const annualBenefit = appState.results.totalBenefits / appState.projectData.evaluationPeriod;
    
    if (annualBenefit === 0) return 0;
    
    return investment / annualBenefit;
}

function displayResults() {
    // Update result cards
    const resultInvestment = document.getElementById('resultInvestment');
    const resultBenefits = document.getElementById('resultBenefits');
    const resultNPV = document.getElementById('resultNPV');
    const resultSROI = document.getElementById('resultSROI');
    const resultIRR = document.getElementById('resultIRR');
    const resultPayback = document.getElementById('resultPayback');
    
    if (resultInvestment) resultInvestment.textContent = formatCurrency(appState.results.totalInvestment);
    if (resultBenefits) resultBenefits.textContent = formatCurrency(appState.results.totalBenefits);
    if (resultNPV) resultNPV.textContent = formatCurrency(appState.results.netPresentValue);
    if (resultSROI) resultSROI.textContent = appState.results.sroiRatio.toFixed(2) + ' : 1';
    if (resultIRR) resultIRR.textContent = (appState.results.irr * 100).toFixed(2) + '%';
    if (resultPayback) resultPayback.textContent = appState.results.paybackPeriod.toFixed(1) + ' ปี';
    
    // Update SROI display
    const sroiNumerator = document.getElementById('sroiNumerator');
    const sroiDenominator = document.getElementById('sroiDenominator');
    const sroiResult = document.getElementById('sroiResult');
    const sroiInterpretation = document.getElementById('sroiInterpretation');
    
    if (sroiNumerator) sroiNumerator.textContent = formatCurrency(appState.results.totalBenefits);
    if (sroiDenominator) sroiDenominator.textContent = formatCurrency(appState.results.totalInvestment);
    if (sroiResult) sroiResult.textContent = appState.results.sroiRatio.toFixed(2) + ' : 1';
    if (sroiInterpretation) {
        sroiInterpretation.textContent = `ทุก 1 บาทที่ลงทุน สร้างผลตอบแทนทางสังคม ${appState.results.sroiRatio.toFixed(2)} บาท`;
    }
    
    // Update summary table
    renderSummaryTable();
}

function renderSummaryTable() {
    const tbody = document.getElementById('summaryTableBody');
    if (!tbody) return;
    
    if (appState.outcomes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">ไม่มีข้อมูล</td></tr>';
        return;
    }
    
    const dimensionLabels = {
        'economic': 'เศรษฐกิจ',
        'social': 'สังคม',
        'environmental': 'สิ่งแวดล้อม'
    };
    
    tbody.innerHTML = appState.outcomes.map(outcome => {
        const stakeholder = appState.stakeholders.find(s => s.id === outcome.stakeholderId);
        const initialValue = outcome.value * (stakeholder?.count || 0);
        const netImpact = initialValue *
                         (1 - outcome.deadweight / 100) *
                         (1 - outcome.attribution / 100) *
                         (1 - outcome.displacement / 100);
        
        // Calculate PV
        const years = appState.projectData.evaluationPeriod;
        const discountRate = appState.calculationParams.discountRate;
        const dropOffRate = appState.calculationParams.dropOffRate;
        
        let pv = 0;
        for (let year = 1; year <= years; year++) {
            const yearImpact = netImpact * Math.pow(1 - dropOffRate, year - 1);
            pv += yearImpact / Math.pow(1 + discountRate, year);
        }
        
        return `
            <tr>
                <td>${outcome.stakeholderName}</td>
                <td>${outcome.name}</td>
                <td>${dimensionLabels[outcome.dimension]}</td>
                <td>${formatCurrency(initialValue)}</td>
                <td>${outcome.deadweight}%</td>
                <td>${outcome.attribution}%</td>
                <td>${outcome.displacement}%</td>
                <td>${formatCurrency(netImpact)}</td>
                <td>${formatCurrency(pv)}</td>
            </tr>
        `;
    }).join('');
}

// ========================================
// Charts
// ========================================
function renderCharts() {
    renderStakeholderChart();
    renderDimensionChart();
    renderComparisonChart();
    renderTrendChart();
}

function renderStakeholderChart() {
    const canvas = document.getElementById('stakeholderChart');
    if (!canvas) return;
    
    // Destroy existing chart
    if (appState.charts.stakeholderChart) {
        appState.charts.stakeholderChart.destroy();
    }
    
    // Group outcomes by stakeholder
    const stakeholderData = {};
    appState.outcomes.forEach(outcome => {
        if (!stakeholderData[outcome.stakeholderName]) {
            stakeholderData[outcome.stakeholderName] = 0;
        }
        const stakeholder = appState.stakeholders.find(s => s.id === outcome.stakeholderId);
        const value = outcome.value * (stakeholder?.count || 0);
        stakeholderData[outcome.stakeholderName] += value;
    });
    
    const labels = Object.keys(stakeholderData);
    const data = Object.values(stakeholderData);
    
    appState.charts.stakeholderChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#1e3a8a',
                    '#3b82f6',
                    '#f59e0b',
                    '#10b981',
                    '#ef4444',
                    '#8b5cf6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function renderDimensionChart() {
    const canvas = document.getElementById('dimensionChart');
    if (!canvas) return;
    
    if (appState.charts.dimensionChart) {
        appState.charts.dimensionChart.destroy();
    }
    
    const dimensionData = {
        'economic': 0,
        'social': 0,
        'environmental': 0
    };
    
    appState.outcomes.forEach(outcome => {
        const stakeholder = appState.stakeholders.find(s => s.id === outcome.stakeholderId);
        const value = outcome.value * (stakeholder?.count || 0);
        dimensionData[outcome.dimension] += value;
    });
    
    const dimensionLabels = {
        'economic': 'เศรษฐกิจ',
        'social': 'สังคม',
        'environmental': 'สิ่งแวดล้อม'
    };
    
    appState.charts.dimensionChart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: Object.keys(dimensionData).map(k => dimensionLabels[k]),
            datasets: [{
                data: Object.values(dimensionData),
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function renderComparisonChart() {
    const canvas = document.getElementById('comparisonChart');
    if (!canvas) return;
    
    if (appState.charts.comparisonChart) {
        appState.charts.comparisonChart.destroy();
    }
    
    appState.charts.comparisonChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['การลงทุน', 'ผลประโยชน์'],
            datasets: [{
                label: 'มูลค่า (บาท)',
                data: [appState.results.totalInvestment, appState.results.totalBenefits],
                backgroundColor: ['#ef4444', '#10b981']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderTrendChart() {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;
    
    if (appState.charts.trendChart) {
        appState.charts.trendChart.destroy();
    }
    
    const years = appState.projectData.evaluationPeriod;
    const labels = ['ปีที่ 0'];
    const data = [-appState.results.totalInvestment];
    
    let cumulative = -appState.results.totalInvestment;
    
    for (let year = 1; year <= years; year++) {
        labels.push(`ปีที่ ${year}`);
        
        let yearBenefit = 0;
        appState.outcomes.forEach(outcome => {
            const stakeholder = appState.stakeholders.find(s => s.id === outcome.stakeholderId);
            const netImpact = outcome.value * (stakeholder?.count || 0) *
                             (1 - outcome.deadweight / 100) *
                             (1 - outcome.attribution / 100) *
                             (1 - outcome.displacement / 100);
            
            const yearImpact = netImpact * Math.pow(1 - appState.calculationParams.dropOffRate, year - 1);
            const pv = yearImpact / Math.pow(1 + appState.calculationParams.discountRate, year);
            yearBenefit += pv;
        });
        
        cumulative += yearBenefit;
        data.push(cumulative);
    }
    
    appState.charts.trendChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'มูลค่าปัจจุบันสุทธิสะสม',
                data: data,
                borderColor: '#1e3a8a',
                backgroundColor: 'rgba(30, 58, 138, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

// ========================================
// PDF Generation
// ========================================
function generatePDF() {
    alert('กำลังสร้างรายงาน PDF...');
    
    // This is a placeholder - you would need to implement actual PDF generation
    // using jsPDF library with proper Thai font support
    
    console.log('Generating PDF with data:', {
        project: appState.projectData,
        stakeholders: appState.stakeholders,
        outcomes: appState.outcomes,
        results: appState.results
    });
}

// ========================================
// Utility Functions
// ========================================
function formatCurrency(value) {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// ========================================
// Initialize Application
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize demo users
    initializeDemoUsers();
    
    // Initialize navigation buttons
    updateNavigationButtons();
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput && !startDateInput.value) {
        startDateInput.value = today;
    }
    
    if (endDateInput && !endDateInput.value) {
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        endDateInput.value = nextYear.toISOString().split('T')[0];
    }
    
    console.log('✅ SROI Calculator initialized');
    console.log('📝 Demo account: admin@sroi.com / admin123');
});
