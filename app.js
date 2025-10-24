// Application State
const appState = {
    isLoggedIn: false,
    currentStep: 1,
    projectData: {
        projectName: '',
        projectObjective: '',
        projectActivity: '',
        projectBudget: 0,
        projectStartYear: '',
        projectDuration: 1,
        evaluationCode: '',
        evaluationDate: '',
        evaluationType: ''
    },
    stakeholders: [],
    impactFactors: {},
    calculationParams: {
        discountRate: 3,
        calculationYears: 5,
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

// Authentication
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === 'admin' && password === 'sroi2025') {
        appState.isLoggedIn = true;
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        document.getElementById('loginError').classList.add('hidden');
    } else {
        document.getElementById('loginError').classList.remove('hidden');
    }
}

function handleLogout() {
    if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
        appState.isLoggedIn = false;
        document.getElementById('loginPage').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }
}

// Navigation
function goToStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.step-content').forEach(step => {
        step.classList.remove('active');
    });
    
    // Show target step
    document.getElementById(`step${stepNumber}`).classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-step').forEach(step => {
        step.classList.remove('active');
        const stepNum = parseInt(step.dataset.step);
        if (stepNum === stepNumber) {
            step.classList.add('active');
        } else if (stepNum < stepNumber) {
            step.classList.add('completed');
        } else {
            step.classList.remove('completed');
        }
    });
    
    appState.currentStep = stepNumber;
    updateProgressBar();
    
    // If going to step 5, calculate results
    if (stepNumber === 5) {
        calculateResults();
        renderCharts();
    }
}

function updateProgressBar() {
    const progress = (appState.currentStep / 6) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
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
        const fields = ['projectName', 'projectObjective', 'projectActivity', 
                       'projectBudget', 'projectStartYear', 'projectDuration',
                       'evaluationCode', 'evaluationDate', 'evaluationType'];
        
        for (let field of fields) {
            const value = document.getElementById(field).value;
            if (!value || (field === 'projectBudget' && parseFloat(value) <= 0)) {
                alert('กรุณากรอกข้อมูลให้ครบถ้วน');
                return false;
            }
        }
        saveStep1Data();
    }
    
    if (step === 2) {
        if (appState.stakeholders.length === 0) {
            alert('กรุณาเพิ่มข้อมูลผู้มีส่วนได้ส่วนเสียอย่างน้อย 1 รายการ');
            return false;
        }
    }
    
    if (step === 3) {
        // Check if all outcomes have impact factors
        const allOutcomesHaveFactors = appState.stakeholders.every(s => {
            return appState.impactFactors[s.id] !== undefined;
        });
        
        if (!allOutcomesHaveFactors) {
            alert('กรุณากำหนดปัจจัยปรับค่าผลกระทบให้ครบทุกรายการ');
            return false;
        }
    }
    
    if (step === 4) {
        saveCalculationParams();
    }
    
    return true;
}

// Step 1: Save project data
function saveStep1Data() {
    appState.projectData = {
        projectName: document.getElementById('projectName').value,
        projectObjective: document.getElementById('projectObjective').value,
        projectActivity: document.getElementById('projectActivity').value,
        projectBudget: parseFloat(document.getElementById('projectBudget').value),
        projectStartYear: document.getElementById('projectStartYear').value,
        projectDuration: parseInt(document.getElementById('projectDuration').value),
        evaluationCode: document.getElementById('evaluationCode').value,
        evaluationDate: document.getElementById('evaluationDate').value,
        evaluationType: document.getElementById('evaluationType').value
    };
}

// Step 2: Stakeholder management
function addStakeholder() {
    const name = document.getElementById('stakeholderName').value;
    const quantity = parseInt(document.getElementById('stakeholderQuantity').value);
    const outcome = document.getElementById('stakeholderOutcome').value;
    const indicator = document.getElementById('stakeholderIndicator').value;
    const type = document.getElementById('stakeholderType').value;
    const financialProxy = parseFloat(document.getElementById('stakeholderFinancialProxy').value);
    
    if (!name || !quantity || !outcome || !indicator || !type || !financialProxy) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }
    
    const stakeholder = {
        id: Date.now(),
        name,
        quantity,
        outcome,
        indicator,
        type,
        financialProxy
    };
    
    appState.stakeholders.push(stakeholder);
    
    // Initialize impact factors
    appState.impactFactors[stakeholder.id] = {
        deadweight: 0,
        attribution: 0,
        displacement: 0
    };
    
    renderStakeholdersTable();
    renderStep3Content();
    clearStakeholderForm();
}

function clearStakeholderForm() {
    document.getElementById('stakeholderName').value = '';
    document.getElementById('stakeholderQuantity').value = '';
    document.getElementById('stakeholderOutcome').value = '';
    document.getElementById('stakeholderIndicator').value = '';
    document.getElementById('stakeholderType').value = '';
    document.getElementById('stakeholderFinancialProxy').value = '';
}

function removeStakeholder(id) {
    if (confirm('คุณต้องการลบข้อมูลนี้ใช่หรือไม่?')) {
        appState.stakeholders = appState.stakeholders.filter(s => s.id !== id);
        delete appState.impactFactors[id];
        renderStakeholdersTable();
        renderStep3Content();
    }
}

function renderStakeholdersTable() {
    const tbody = document.getElementById('stakeholdersTableBody');
    tbody.innerHTML = '';
    
    appState.stakeholders.forEach(stakeholder => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${stakeholder.name}</td>
            <td>${stakeholder.quantity}</td>
            <td>${stakeholder.outcome}</td>
            <td>${stakeholder.indicator}</td>
            <td>${stakeholder.type}</td>
            <td>${formatCurrency(stakeholder.financialProxy)}</td>
            <td>
                <button class="btn btn-danger" onclick="removeStakeholder(${stakeholder.id})" style="padding: 4px 8px; font-size: 0.8rem;">ลบ</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Step 3: Impact factors
function renderStep3Content() {
    const container = document.getElementById('impactFactorsContainer');
    container.innerHTML = '';
    
    appState.stakeholders.forEach(stakeholder => {
        const section = document.createElement('div');
        section.className = 'section';
        section.innerHTML = `
            <h3 class="section-title">${stakeholder.name} - ${stakeholder.outcome}</h3>
            
            <div class="form-group">
                <label class="form-label">Deadweight (ผลลัพธ์ส่วนเกิน)</label>
                <p style="font-size: 0.85rem; color: var(--color-text-light); margin-bottom: var(--space-sm);">ผลลัพธ์ที่จะเกิดขึ้นอยู่ดีแม้ไม่มีโครงการ</p>
                <select id="deadweight_${stakeholder.id}" class="form-control" onchange="updateImpactFactors(${stakeholder.id})">
                    <option value="0">0% - จะไม่เกิดเลยถ้าไม่มีโครงการ</option>
                    <option value="0.25">25% - จะเกิดเพียงเล็กน้อย</option>
                    <option value="0.5">50% - จะเกิดบางส่วน</option>
                    <option value="0.75">75% - จะเกิดส่วนใหญ่</option>
                    <option value="1">100% - จะเกิดทั้งหมดอยู่แล้ว</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Attribution (ผลจากปัจจัยอื่น)</label>
                <p style="font-size: 0.85rem; color: var(--color-text-light); margin-bottom: var(--space-sm);">สัดส่วนที่องค์กรอื่นหรือปัจจัยอื่นมีส่วนทำให้เกิดผลลัพธ์</p>
                <select id="attribution_${stakeholder.id}" class="form-control" onchange="updateImpactFactors(${stakeholder.id})">
                    <option value="0">0% - เกิดจากโครงการนี้เท่านั้น</option>
                    <option value="0.25">25% - องค์กรอื่นมีส่วนเล็กน้อย</option>
                    <option value="0.5">50% - องค์กรอื่นมีส่วนพอสมควร</option>
                    <option value="0.75">75% - องค์กรอื่นมีส่วนมาก</option>
                    <option value="1">100% - เกิดจากองค์กรอื่นทั้งหมด</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Displacement (ผลลัพธ์ทดแทน)</label>
                <p style="font-size: 0.85rem; color: var(--color-text-light); margin-bottom: var(--space-sm);">ผลลัพธ์เชิงบวกที่ถูกชดเชยด้วยผลลัพธ์เชิงลบ</p>
                <select id="displacement_${stakeholder.id}" class="form-control" onchange="updateImpactFactors(${stakeholder.id})">
                    <option value="0">0% - ไม่มีการแทนที่</option>
                    <option value="0.25">25% - มีการแทนที่เล็กน้อย</option>
                    <option value="0.5">50% - มีการแทนที่บางส่วน</option>
                    <option value="0.75">75% - มีการแทนที่มาก</option>
                    <option value="1">100% - มีการแทนที่ทั้งหมด</option>
                </select>
            </div>
            
            <div class="alert alert-success" id="netImpact_${stakeholder.id}">
                <strong>ผลกระทบสุทธิ:</strong> ${formatCurrency(stakeholder.quantity * stakeholder.financialProxy)}
            </div>
        `;
        container.appendChild(section);
    });
}

function updateImpactFactors(stakeholderId) {
    const deadweight = parseFloat(document.getElementById(`deadweight_${stakeholderId}`).value);
    const attribution = parseFloat(document.getElementById(`attribution_${stakeholderId}`).value);
    const displacement = parseFloat(document.getElementById(`displacement_${stakeholderId}`).value);
    
    appState.impactFactors[stakeholderId] = {
        deadweight,
        attribution,
        displacement
    };
    
    // Calculate and display net impact
    const stakeholder = appState.stakeholders.find(s => s.id === stakeholderId);
    if (stakeholder) {
        const netImpact = stakeholder.quantity * stakeholder.financialProxy * 
                         (1 - deadweight) * (1 - attribution) * (1 - displacement);
        
        const netImpactDiv = document.getElementById(`netImpact_${stakeholderId}`);
        netImpactDiv.innerHTML = `<strong>ผลกระทบสุทธิ:</strong> ${formatCurrency(netImpact)}`;
    }
}

// Step 4: Calculation parameters
function saveCalculationParams() {
    appState.calculationParams = {
        discountRate: parseFloat(document.getElementById('discountRate').value) / 100,
        calculationYears: parseInt(document.getElementById('calculationYears').value),
        dropOffRate: parseFloat(document.getElementById('dropOffRate').value) / 100
    };
}

// Step 5: Calculate SROI
function calculateResults() {
    const investment = appState.projectData.projectBudget;
    const years = appState.calculationParams.calculationYears;
    const discountRate = appState.calculationParams.discountRate;
    const dropOffRate = appState.calculationParams.dropOffRate;
    
    let totalPVBenefits = 0;
    const yearlyBenefits = [];
    
    // Calculate for each stakeholder
    appState.stakeholders.forEach(stakeholder => {
        const factors = appState.impactFactors[stakeholder.id];
        const baseImpact = stakeholder.quantity * stakeholder.financialProxy;
        
        // Apply impact factors
        const netImpact = baseImpact * 
                         (1 - factors.deadweight) * 
                         (1 - factors.attribution) * 
                         (1 - factors.displacement);
        
        // Calculate for each year
        for (let year = 1; year <= years; year++) {
            const yearImpact = netImpact * Math.pow(1 - dropOffRate, year - 1);
            const pv = yearImpact / Math.pow(1 + discountRate, year);
            totalPVBenefits += pv;
            
            if (!yearlyBenefits[year]) {
                yearlyBenefits[year] = 0;
            }
            yearlyBenefits[year] += yearImpact;
        }
    });
    
    const npv = totalPVBenefits - investment;
    const sroiRatio = investment > 0 ? totalPVBenefits / investment : 0;
    const irr = calculateIRR(investment, yearlyBenefits);
    const payback = calculatePaybackPeriod(investment, yearlyBenefits);
    
    appState.results = {
        totalInvestment: investment,
        totalBenefits: totalPVBenefits,
        netPresentValue: npv,
        sroiRatio: sroiRatio,
        irr: irr,
        paybackPeriod: payback
    };
    
    renderResults();
}

function calculateIRR(investment, yearlyBenefits) {
    // Use binary search to find IRR
    let low = -0.99;
    let high = 5.0;
    let tolerance = 0.0001;
    
    while (high - low > tolerance) {
        let mid = (low + high) / 2;
        let npv = -investment;
        
        for (let year = 1; year < yearlyBenefits.length; year++) {
            if (yearlyBenefits[year]) {
                npv += yearlyBenefits[year] / Math.pow(1 + mid, year);
            }
        }
        
        if (npv > 0) {
            low = mid;
        } else {
            high = mid;
        }
    }
    
    return (low + high) / 2;
}

function calculatePaybackPeriod(investment, yearlyBenefits) {
    let cumulative = 0;
    
    for (let year = 1; year < yearlyBenefits.length; year++) {
        if (yearlyBenefits[year]) {
            cumulative += yearlyBenefits[year];
            if (cumulative >= investment) {
                // Linear interpolation for more accurate payback
                const previousCumulative = cumulative - yearlyBenefits[year];
                const fraction = (investment - previousCumulative) / yearlyBenefits[year];
                return year - 1 + fraction;
            }
        }
    }
    
    return yearlyBenefits.length - 1; // Return max years if not paid back
}

function renderResults() {
    const results = appState.results;
    
    // Update result cards
    document.getElementById('resultInvestment').textContent = formatCurrency(results.totalInvestment);
    document.getElementById('resultBenefits').textContent = formatCurrency(results.totalBenefits);
    document.getElementById('resultNPV').textContent = formatCurrency(results.netPresentValue);
    document.getElementById('resultSROI').textContent = results.sroiRatio.toFixed(2) + ' : 1';
    document.getElementById('resultIRR').textContent = (results.irr * 100).toFixed(2) + '%';
    document.getElementById('resultPayback').textContent = results.paybackPeriod.toFixed(1) + ' ปี';
    
    // Update SROI display
    document.getElementById('sroiNumerator').textContent = formatCurrency(results.totalBenefits);
    document.getElementById('sroiDenominator').textContent = formatCurrency(results.totalInvestment);
    document.getElementById('sroiResult').textContent = results.sroiRatio.toFixed(2) + ' : 1';
    document.getElementById('sroiInterpretation').textContent = 
        `ทุก 1 บาทที่ลงทุน สร้างผลตอบแทนทางสังคม ${results.sroiRatio.toFixed(2)} บาท`;
    
    // Render summary table
    renderSummaryTable();
}

function renderSummaryTable() {
    const tbody = document.getElementById('summaryTableBody');
    tbody.innerHTML = '';
    
    const years = appState.calculationParams.calculationYears;
    const discountRate = appState.calculationParams.discountRate;
    const dropOffRate = appState.calculationParams.dropOffRate;
    
    appState.stakeholders.forEach(stakeholder => {
        const factors = appState.impactFactors[stakeholder.id];
        const baseValue = stakeholder.quantity * stakeholder.financialProxy;
        const netImpact = baseValue * 
                         (1 - factors.deadweight) * 
                         (1 - factors.attribution) * 
                         (1 - factors.displacement);
        
        let totalPV = 0;
        for (let year = 1; year <= years; year++) {
            const yearImpact = netImpact * Math.pow(1 - dropOffRate, year - 1);
            const pv = yearImpact / Math.pow(1 + discountRate, year);
            totalPV += pv;
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${stakeholder.name}</td>
            <td>${stakeholder.outcome}</td>
            <td>${stakeholder.type}</td>
            <td>${formatCurrency(baseValue)}</td>
            <td>${(factors.deadweight * 100).toFixed(0)}%</td>
            <td>${(factors.attribution * 100).toFixed(0)}%</td>
            <td>${(factors.displacement * 100).toFixed(0)}%</td>
            <td>${formatCurrency(netImpact)}</td>
            <td>${formatCurrency(totalPV)}</td>
        `;
        tbody.appendChild(row);
    });
}

// Charts
function renderCharts() {
    renderStakeholderDistributionChart();
    renderDimensionDistributionChart();
    renderImpactComparisonChart();
    renderTrendChart();
}

function renderStakeholderDistributionChart() {
    const ctx = document.getElementById('stakeholderChart');
    if (appState.charts.stakeholderChart) {
        appState.charts.stakeholderChart.destroy();
    }
    
    const data = appState.stakeholders.map(s => {
        const factors = appState.impactFactors[s.id];
        const baseValue = s.quantity * s.financialProxy;
        return baseValue * (1 - factors.deadweight) * (1 - factors.attribution) * (1 - factors.displacement);
    });
    
    const labels = appState.stakeholders.map(s => s.name);
    
    appState.charts.stakeholderChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderDimensionDistributionChart() {
    const ctx = document.getElementById('dimensionChart');
    if (appState.charts.dimensionChart) {
        appState.charts.dimensionChart.destroy();
    }
    
    const dimensions = {
        'เศรษฐกิจ': 0,
        'สังคม': 0,
        'สิ่งแวดล้อม': 0
    };
    
    appState.stakeholders.forEach(s => {
        const factors = appState.impactFactors[s.id];
        const value = s.quantity * s.financialProxy * 
                     (1 - factors.deadweight) * (1 - factors.attribution) * (1 - factors.displacement);
        dimensions[s.type] += value;
    });
    
    appState.charts.dimensionChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['เศรษฐกิจ', 'สังคม', 'สิ่งแวดล้อม'],
            datasets: [{
                data: [dimensions['เศรษฐกิจ'], dimensions['สังคม'], dimensions['สิ่งแวดล้อม']],
                backgroundColor: ['#2563eb', '#f97316', '#22c55e']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderImpactComparisonChart() {
    const ctx = document.getElementById('comparisonChart');
    if (appState.charts.comparisonChart) {
        appState.charts.comparisonChart.destroy();
    }
    
    const data = appState.stakeholders.map(s => {
        const factors = appState.impactFactors[s.id];
        const baseValue = s.quantity * s.financialProxy;
        return baseValue * (1 - factors.deadweight) * (1 - factors.attribution) * (1 - factors.displacement);
    });
    
    const labels = appState.stakeholders.map(s => s.name);
    
    appState.charts.comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'มูลค่าผลกระทบสุทธิ (บาท)',
                data: data,
                backgroundColor: '#1e3a8a'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.parsed.x);
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderTrendChart() {
    const ctx = document.getElementById('trendChart');
    if (appState.charts.trendChart) {
        appState.charts.trendChart.destroy();
    }
    
    const years = appState.calculationParams.calculationYears;
    const discountRate = appState.calculationParams.discountRate;
    const dropOffRate = appState.calculationParams.dropOffRate;
    
    const cumulativeNPV = [0]; // Year 0
    let cumulative = -appState.projectData.projectBudget; // Initial investment is negative
    
    for (let year = 1; year <= years; year++) {
        let yearBenefit = 0;
        
        appState.stakeholders.forEach(stakeholder => {
            const factors = appState.impactFactors[stakeholder.id];
            const netImpact = stakeholder.quantity * stakeholder.financialProxy * 
                             (1 - factors.deadweight) * (1 - factors.attribution) * (1 - factors.displacement);
            
            const yearImpact = netImpact * Math.pow(1 - dropOffRate, year - 1);
            const pv = yearImpact / Math.pow(1 + discountRate, year);
            yearBenefit += pv;
        });
        
        cumulative += yearBenefit;
        cumulativeNPV.push(cumulative);
    }
    
    const labels = [];
    for (let i = 0; i <= years; i++) {
        labels.push(`ปีที่ ${i}`);
    }
    
    appState.charts.trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'มูลค่าปัจจุบันสุทธิสะสม (บาท)',
                data: cumulativeNPV,
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
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.parsed.y);
                        }
                    }
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

// PDF Generation
function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add Thai font support (using default for simplicity)
    let yPos = 20;
    
    // Cover page
    doc.setFontSize(20);
    doc.text('SROI Report', 105, yPos, { align: 'center' });
    yPos += 10;
    doc.setFontSize(14);
    doc.text(appState.projectData.projectName, 105, yPos, { align: 'center' });
    yPos += 20;
    
    doc.setFontSize(10);
    doc.text(`Evaluation Code: ${appState.projectData.evaluationCode}`, 20, yPos);
    yPos += 7;
    doc.text(`Date: ${appState.projectData.evaluationDate}`, 20, yPos);
    yPos += 7;
    doc.text(`Type: ${appState.projectData.evaluationType}`, 20, yPos);
    yPos += 15;
    
    // Project Information
    doc.setFontSize(14);
    doc.text('1. Project Information', 20, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.text(`Budget: ${formatCurrency(appState.projectData.projectBudget)}`, 20, yPos);
    yPos += 7;
    doc.text(`Start Year: ${appState.projectData.projectStartYear}`, 20, yPos);
    yPos += 7;
    doc.text(`Duration: ${appState.projectData.projectDuration} years`, 20, yPos);
    yPos += 15;
    
    // SROI Results
    doc.setFontSize(14);
    doc.text('2. SROI Results', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    doc.text(`SROI Ratio: ${appState.results.sroiRatio.toFixed(2)} : 1`, 20, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.text(`Total Investment: ${formatCurrency(appState.results.totalInvestment)}`, 20, yPos);
    yPos += 7;
    doc.text(`Total Benefits (PV): ${formatCurrency(appState.results.totalBenefits)}`, 20, yPos);
    yPos += 7;
    doc.text(`Net Present Value: ${formatCurrency(appState.results.netPresentValue)}`, 20, yPos);
    yPos += 7;
    doc.text(`IRR: ${(appState.results.irr * 100).toFixed(2)}%`, 20, yPos);
    yPos += 7;
    doc.text(`Payback Period: ${appState.results.paybackPeriod.toFixed(1)} years`, 20, yPos);
    yPos += 15;
    
    // Interpretation
    doc.setFontSize(12);
    doc.text('Interpretation:', 20, yPos);
    yPos += 7;
    doc.setFontSize(10);
    
    let recommendation = '';
    if (appState.results.sroiRatio > 3) {
        recommendation = 'The project has very high social return. Recommended to continue and scale up.';
    } else if (appState.results.sroiRatio >= 1) {
        recommendation = 'The project has positive social return. Recommended to continue with improvements.';
    } else {
        recommendation = 'The project has lower social return than investment. Should consider improvements.';
    }
    
    const splitText = doc.splitTextToSize(recommendation, 170);
    doc.text(splitText, 20, yPos);
    yPos += splitText.length * 7 + 10;
    
    // New page for stakeholders
    doc.addPage();
    yPos = 20;
    doc.setFontSize(14);
    doc.text('3. Stakeholders & Outcomes', 20, yPos);
    yPos += 10;
    doc.setFontSize(9);
    
    appState.stakeholders.forEach((s, index) => {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
        doc.text(`${index + 1}. ${s.name} (${s.quantity} persons)`, 20, yPos);
        yPos += 5;
        doc.text(`   Outcome: ${s.outcome}`, 20, yPos);
        yPos += 5;
        doc.text(`   Type: ${s.type}`, 20, yPos);
        yPos += 5;
        doc.text(`   Value: ${formatCurrency(s.quantity * s.financialProxy)}`, 20, yPos);
        yPos += 8;
    });
    
    // Footer on last page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text('Developed by Faculty of Economics and Investment, Bangkok University', 105, 285, { align: 'center' });
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }
    
    // Save
    const filename = `SROI_Report_${appState.projectData.projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
    alert('รายงาน PDF ถูกสร้างเรียบร้อยแล้ว');
}

// Utility functions
function formatCurrency(value) {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

function initializeYearDropdown() {
    const select = document.getElementById('projectStartYear');
    for (let year = 2000; year <= 2030; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year + 543; // Convert to Buddhist Era
        select.appendChild(option);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Login
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Navigation
    document.querySelectorAll('.nav-step').forEach(step => {
        step.addEventListener('click', function() {
            const stepNum = parseInt(this.dataset.step);
            if (stepNum <= appState.currentStep + 1) {
                goToStep(stepNum);
            }
        });
    });
    
    // Initialize
    initializeYearDropdown();
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('evaluationDate').value = today;
});
