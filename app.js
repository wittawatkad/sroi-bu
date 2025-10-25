// ========================================
// GLOBAL VARIABLES
// ========================================
let currentStep = 1;
const totalSteps = 6;
let stakeholders = [];
let outcomes = [];
let sroiChart = null;
let currentProjectId = null;
let currentUser = null;
let autoSaveTimeout = null;

// Step completion tracking
let completedSteps = {
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false
};

// ========================================
// FIREBASE FIRESTORE FUNCTIONS
// ========================================

async function saveProjectData() {
    if (!currentUser || !currentProjectId) return;

    // Clear previous timeout
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);

    // Update UI to show saving status
    updateSaveStatus('saving');

    // Set new timeout for auto-save (debounce)
    autoSaveTimeout = setTimeout(async () => {
        try {
            const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');

            const projectData = {
                userId: currentUser.uid,
                projectName: document.getElementById('projectName')?.value || 'โครงการใหม่',
                organization: document.getElementById('organization')?.value || '',
                duration: parseInt(document.getElementById('duration')?.value) || 1,
                startYear: parseInt(document.getElementById('startYear')?.value) || new Date().getFullYear(),
                objective: document.getElementById('objective')?.value || '',
                totalCost: parseFloat(document.getElementById('totalCost')?.value) || 0,
                discountRate: parseFloat(document.getElementById('discountRate')?.value) || 3.5,
                stakeholders: stakeholders,
                outcomes: outcomes,
                completedSteps: completedSteps,
                lastUpdated: new Date().toISOString(),
                updatedAt: new Date()
            };

            const projectRef = doc(window.db, 'projects', currentProjectId);
            await setDoc(projectRef, projectData, { merge: true });

            console.log('✅ Project auto-saved');
            updateProjectTitle();
            updateSaveStatus('saved');
        } catch (error) {
            console.error('Error saving project:', error);
            updateSaveStatus('error');
        }
    }, 1000); // Save after 1 second of no changes
}

function updateSaveStatus(status) {
    const statusIcon = document.getElementById('saveStatusIcon');
    const statusText = document.getElementById('saveStatusText');
    
    if (!statusIcon || !statusText) return;
    
    const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    
    switch(status) {
        case 'saving':
            statusIcon.textContent = '⏳';
            statusText.textContent = 'กำลังบันทึก...';
            break;
        case 'saved':
            statusIcon.textContent = '✅';
            statusText.textContent = `บันทึกล่าสุด: ${now}`;
            break;
        case 'error':
            statusIcon.textContent = '❌';
            statusText.textContent = 'บันทึกไม่สำเร็จ';
            break;
    }
}

async function saveAndBackToDashboard() {
    if (!currentUser || !currentProjectId) {
        backToDashboard();
        return;
    }

    try {
        // Force save immediately
        showToast('⏳ กำลังบันทึกโครงการ...');
        
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');

        const projectData = {
            userId: currentUser.uid,
            projectName: document.getElementById('projectName')?.value || 'โครงการใหม่',
            organization: document.getElementById('organization')?.value || '',
            duration: parseInt(document.getElementById('duration')?.value) || 1,
            startYear: parseInt(document.getElementById('startYear')?.value) || new Date().getFullYear(),
            objective: document.getElementById('objective')?.value || '',
            totalCost: parseFloat(document.getElementById('totalCost')?.value) || 0,
            discountRate: parseFloat(document.getElementById('discountRate')?.value) || 3.5,
            stakeholders: stakeholders,
            outcomes: outcomes,
            completedSteps: completedSteps,
            lastUpdated: new Date().toISOString(),
            updatedAt: new Date()
        };

        const projectRef = doc(window.db, 'projects', currentProjectId);
        await setDoc(projectRef, projectData, { merge: true });

        console.log('✅ Project saved successfully');
        showToast('✅ บันทึกโครงการสำเร็จ!');
        
        // Wait a bit then go back
        setTimeout(() => {
            backToDashboard();
        }, 500);
        
    } catch (error) {
        console.error('Error saving project:', error);
        showToast('❌ เกิดข้อผิดพลาดในการบันทึก');
    }
}

// Make it globally accessible
window.saveAndBackToDashboard = saveAndBackToDashboard;

async function loadProjectData(projectId) {
    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');

        const projectRef = doc(window.db, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);

        if (projectSnap.exists()) {
            const data = projectSnap.data();

            // Load basic info
            document.getElementById('projectName').value = data.projectName || '';
            document.getElementById('organization').value = data.organization || '';
            document.getElementById('duration').value = data.duration || 1;
            document.getElementById('startYear').value = data.startYear || new Date().getFullYear();
            document.getElementById('objective').value = data.objective || '';
            document.getElementById('totalCost').value = data.totalCost || 0;
            document.getElementById('discountRate').value = data.discountRate || 3.5;

            // Load stakeholders and outcomes
            stakeholders = data.stakeholders || [];
            outcomes = data.outcomes || [];
            completedSteps = data.completedSteps || {1: false, 2: false, 3: false, 4: false, 5: false, 6: false};

            // Update UI
            updateStakeholderTable();
            updateOutcomeTable();
            updateValuationTable();
            updateAdjustmentTable();
            updateProjectTitle();
            updateStepIndicators();
            updateDisplayCost();

            console.log('✅ Project data loaded');
        }
    } catch (error) {
        console.error('Error loading project:', error);
    }
}

async function loadUserProjects() {
    try {
        const { collection, query, where, getDocs, orderBy } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');

        const projectsRef = collection(window.db, 'projects');
        const q = query(
            projectsRef, 
            where('userId', '==', currentUser.uid),
            orderBy('updatedAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const projects = [];

        querySnapshot.forEach((doc) => {
            projects.push({
                id: doc.id,
                ...doc.data()
            });
        });

        displayProjects(projects);
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

function displayProjects(projects) {
    const grid = document.getElementById('projectsGrid');
    
    // Keep the "New Project" card
    const newProjectCard = `
        <div class="project-card new-project-card" id="newProjectCard">
            <div style="font-size: 3rem; margin-bottom: 16px;">➕</div>
            <div>สร้างโครงการใหม่</div>
        </div>
    `;

    const projectCards = projects.map(project => {
        const progress = calculateProjectProgress(project);
        const lastUpdated = formatDate(project.lastUpdated);

        return `
            <div class="project-card" data-project-id="${project.id}">
                <div class="project-card-header">
                    <div>
                        <div class="project-card-title">${project.projectName || 'โครงการไม่มีชื่อ'}</div>
                        <div class="project-card-meta">
                            ${project.organization || 'ไม่ระบุหน่วยงาน'} • อัพเดท ${lastUpdated}
                        </div>
                    </div>
                    <button class="btn btn-danger icon-btn" data-delete-id="${project.id}" title="ลบโครงการ">
                        🗑️
                    </button>
                </div>
                <div class="project-card-progress">
                    <div class="progress-label">ความคืบหน้า ${progress}%</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    grid.innerHTML = newProjectCard + projectCards;

    // Add event listeners after DOM is updated
    setTimeout(() => {
        // New project card click handler
        const newCard = document.getElementById('newProjectCard');
        if (newCard) {
            console.log('Attaching click handler to new project card');
            newCard.addEventListener('click', function(e) {
                console.log('New project card clicked!');
                e.preventDefault();
                e.stopPropagation();
                window.createNewProject();
            });
        }

        // Existing project cards click handlers
        document.querySelectorAll('.project-card[data-project-id]').forEach(card => {
            const projectId = card.getAttribute('data-project-id');
            card.addEventListener('click', function(e) {
                // Don't trigger if clicking delete button
                if (e.target.closest('[data-delete-id]')) {
                    return;
                }
                console.log('Opening project:', projectId);
                window.openProject(projectId);
            });
        });

        // Delete button handlers
        document.querySelectorAll('[data-delete-id]').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const projectId = this.getAttribute('data-delete-id');
                console.log('Deleting project:', projectId);
                window.deleteProject(projectId);
            });
        });
    }, 100);
}

function calculateProjectProgress(project) {
    if (!project.completedSteps) return 0;
    
    const completed = Object.values(project.completedSteps).filter(v => v === true).length;
    return Math.round((completed / totalSteps) * 100);
}

function formatDate(dateString) {
    if (!dateString) return 'ไม่ทราบ';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 1) return 'เมื่อสักครู่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
    
    return date.toLocaleDateString('th-TH');
}

async function createNewProject() {
    console.log('createNewProject called');
    console.log('currentUser:', currentUser);
    
    if (!currentUser) {
        alert('❌ กรุณาเข้าสู่ระบบก่อน');
        return;
    }

    try {
        console.log('Creating new project...');
        const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');

        const projectData = {
            userId: currentUser.uid,
            projectName: 'โครงการใหม่',
            organization: '',
            duration: 1,
            startYear: new Date().getFullYear(),
            objective: '',
            totalCost: 0,
            discountRate: 3.5,
            stakeholders: [],
            outcomes: [],
            completedSteps: {1: false, 2: false, 3: false, 4: false, 5: false, 6: false},
            createdAt: new Date(),
            updatedAt: new Date(),
            lastUpdated: new Date().toISOString()
        };

        const docRef = await collection(window.db, 'projects');
        const newDoc = await addDoc(docRef, projectData);

        console.log('Project created with ID:', newDoc.id);

        currentProjectId = newDoc.id;
        stakeholders = [];
        outcomes = [];
        completedSteps = {1: false, 2: false, 3: false, 4: false, 5: false, 6: false};

        showMainApp();
        showToast('✅ สร้างโครงการใหม่สำเร็จ!');
    } catch (error) {
        console.error('Error creating project:', error);
        alert('เกิดข้อผิดพลาดในการสร้างโครงการ: ' + error.message);
    }
}

// Make it globally accessible
window.createNewProject = createNewProject;

async function openProject(projectId) {
    currentProjectId = projectId;
    await loadProjectData(projectId);
    showMainApp();
}

// Make it globally accessible
window.openProject = openProject;

async function deleteProject(projectId) {
    if (!confirm('คุณต้องการลบโครงการนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) {
        return;
    }

    try {
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');

        const projectRef = doc(window.db, 'projects', projectId);
        await deleteDoc(projectRef);

        showToast('✅ ลบโครงการสำเร็จ');
        loadUserProjects();
    } catch (error) {
        console.error('Error deleting project:', error);
        alert('เกิดข้อผิดพลาดในการลบโครงการ: ' + error.message);
    }
}

// Make it globally accessible
window.deleteProject = deleteProject;

async function backToDashboard() {
    // Save before going back if there's a current project
    if (currentProjectId && currentUser) {
        try {
            showToast('⏳ กำลังบันทึกโครงการ...');
            
            const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');

            const projectData = {
                userId: currentUser.uid,
                projectName: document.getElementById('projectName')?.value || 'โครงการใหม่',
                organization: document.getElementById('organization')?.value || '',
                duration: parseInt(document.getElementById('duration')?.value) || 1,
                startYear: parseInt(document.getElementById('startYear')?.value) || new Date().getFullYear(),
                objective: document.getElementById('objective')?.value || '',
                totalCost: parseFloat(document.getElementById('totalCost')?.value) || 0,
                discountRate: parseFloat(document.getElementById('discountRate')?.value) || 3.5,
                stakeholders: stakeholders,
                outcomes: outcomes,
                completedSteps: completedSteps,
                lastUpdated: new Date().toISOString(),
                updatedAt: new Date()
            };

            const projectRef = doc(window.db, 'projects', currentProjectId);
            await setDoc(projectRef, projectData, { merge: true });

            console.log('✅ Project saved before returning to dashboard');
        } catch (error) {
            console.error('Error saving project:', error);
        }
    }
    
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'block';
    document.getElementById('dashboardContainer').style.display = 'block';
    
    currentProjectId = null;
    currentStep = 1;
    
    loadUserProjects();
}

// Make it globally accessible
window.backToDashboard = backToDashboard;

function showMainApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    currentStep = 1;
    setTimeout(() => updateStep(), 100);
}

function updateProjectTitle() {
    const projectName = document.getElementById('projectName')?.value || 'โครงการใหม่';
    const titleElement = document.getElementById('projectTitle');
    if (titleElement) {
        titleElement.textContent = projectName;
    }
}

function updateDisplayCost() {
    const totalCost = parseFloat(document.getElementById('totalCost')?.value) || 0;
    const displayElement = document.getElementById('displayCost');
    if (displayElement) {
        displayElement.textContent = '฿ ' + totalCost.toLocaleString();
    }
}

// ========================================
// STEP COMPLETION TRACKING
// ========================================

function checkStepCompletion(stepNumber) {
    let isComplete = false;

    switch(stepNumber) {
        case 1:
            const projectName = document.getElementById('projectName')?.value;
            const duration = document.getElementById('duration')?.value;
            const totalCost = document.getElementById('totalCost')?.value;
            isComplete = projectName && duration && totalCost && parseFloat(totalCost) > 0;
            break;
        case 2:
            isComplete = stakeholders.length > 0;
            break;
        case 3:
            isComplete = outcomes.length > 0;
            break;
        case 4:
            isComplete = outcomes.every(o => o.quantity > 0 && o.unitValue > 0 && o.duration > 0);
            break;
        case 5:
            const discountRate = document.getElementById('discountRate')?.value;
            isComplete = discountRate && parseFloat(discountRate) >= 0;
            break;
        case 6:
            isComplete = true; // Report step is always complete once reached
            break;
    }

    completedSteps[stepNumber] = isComplete;
    updateStepIndicators();
    saveProjectData();
}

function updateStepIndicators() {
    for (let i = 1; i <= totalSteps; i++) {
        const stepElement = document.querySelectorAll('.step')[i - 1];
        if (stepElement) {
            if (completedSteps[i]) {
                stepElement.classList.add('completed');
            } else {
                stepElement.classList.remove('completed');
            }
        }
    }
}

// ========================================
// MODAL FUNCTIONS
// ========================================

window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
};

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
};

window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id);
    }
});

// ========================================
// STEP NAVIGATION FUNCTIONS
// ========================================

window.nextStep = function() {
    checkStepCompletion(currentStep);
    
    if (currentStep < totalSteps) {
        currentStep++;
        updateStep();
    }
};

window.previousStep = function() {
    if (currentStep > 1) {
        currentStep--;
        updateStep();
    }
};

window.goToStep = function(stepNumber) {
    if (stepNumber >= 1 && stepNumber <= totalSteps) {
        checkStepCompletion(currentStep);
        currentStep = stepNumber;
        updateStep();
    }
};

function updateStep() {
    // Hide all steps
    const allSteps = document.querySelectorAll('.step-content');
    allSteps.forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    
    // Show current step
    const currentContent = document.getElementById(`step${currentStep}`);
    if (currentContent) {
        currentContent.classList.add('active');
        currentContent.style.display = 'block';
    }
    
    // Update step indicators
    const stepButtons = document.querySelectorAll('.step');
    stepButtons.forEach((step, index) => {
        if (index + 1 === currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
    
    // Update tables based on current step
    if (currentStep === 2) {
        updateStakeholderTable();
    } else if (currentStep === 3) {
        updateOutcomeTable();
    } else if (currentStep === 4) {
        updateValuationTable();
    } else if (currentStep === 5) {
        updateAdjustmentTable();
        updateDisplayCost();
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// STAKEHOLDER FUNCTIONS
// ========================================

window.addStakeholder = function() {
    openModal('stakeholderModal');
};

window.saveStakeholder = function() {
    const name = document.getElementById('stakeholderName').value.trim();
    const count = document.getElementById('stakeholderCount').value;
    const type = document.getElementById('stakeholderType').value;
    const description = document.getElementById('stakeholderDescription').value.trim();
    
    if (!name || !count || !type) {
        alert('❌ กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน');
        return;
    }
    
    const stakeholder = {
        id: Date.now(),
        name: name,
        count: parseInt(count),
        type: type,
        description: description
    };
    
    stakeholders.push(stakeholder);
    updateStakeholderTable();
    updateOutcomeStakeholderOptions();
    closeModal('stakeholderModal');
    checkStepCompletion(2);
    
    showToast('✅ เพิ่มผู้มีส่วนได้ส่วนเสียสำเร็จ!');
    saveProjectData();
};

window.deleteStakeholder = function(id) {
    if (confirm('คุณต้องการลบข้อมูลนี้หรือไม่?')) {
        stakeholders = stakeholders.filter(s => s.id !== id);
        updateStakeholderTable();
        updateOutcomeStakeholderOptions();
        checkStepCompletion(2);
        showToast('✅ ลบข้อมูลสำเร็จ');
        saveProjectData();
    }
};

function updateStakeholderTable() {
    const tbody = document.getElementById('stakeholderTableBody');
    if (!tbody) return;
    
    if (stakeholders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #94a3b8;">ยังไม่มีข้อมูล (คลิก "เพิ่มกลุ่มใหม่" เพื่อเริ่มต้น)</td></tr>';
        return;
    }
    
    tbody.innerHTML = stakeholders.map(s => `
        <tr>
            <td>${s.name}</td>
            <td>${s.count.toLocaleString()}</td>
            <td><span style="background: #dbeafe; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem;">${s.type}</span></td>
            <td>${s.description || '-'}</td>
            <td>
                <button type="button" class="btn btn-danger icon-btn" onclick="deleteStakeholder(${s.id})" title="ลบ">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
}

// ========================================
// OUTCOME FUNCTIONS
// ========================================

window.addOutcome = function() {
    if (stakeholders.length === 0) {
        alert('❌ กรุณาเพิ่มผู้มีส่วนได้ส่วนเสียก่อน');
        return;
    }
    
    updateOutcomeStakeholderOptions();
    openModal('outcomeModal');
};

function updateOutcomeStakeholderOptions() {
    const select = document.getElementById('outcomeStakeholder');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- เลือกกลุ่ม --</option>' +
        stakeholders.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
}

window.saveOutcome = function() {
    const stakeholder = document.getElementById('outcomeStakeholder').value;
    const name = document.getElementById('outcomeName').value.trim();
    const type = document.getElementById('outcomeType').value;
    const indicator = document.getElementById('outcomeIndicator').value.trim();
    
    if (!stakeholder || !name || !type || !indicator) {
        alert('❌ กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน');
        return;
    }
    
    const outcome = {
        id: Date.now(),
        stakeholder: stakeholder,
        name: name,
        type: type,
        indicator: indicator,
        quantity: 0,
        unitValue: 0,
        deadweight: 0,
        attribution: 0,
        displacement: 0,
        dropoff: 0,
        duration: 1
    };
    
    outcomes.push(outcome);
    updateOutcomeTable();
    closeModal('outcomeModal');
    checkStepCompletion(3);
    
    showToast('✅ เพิ่มผลลัพธ์สำเร็จ!');
    saveProjectData();
};

window.deleteOutcome = function(id) {
    if (confirm('คุณต้องการลบผลลัพธ์นี้หรือไม่?')) {
        outcomes = outcomes.filter(o => o.id !== id);
        updateOutcomeTable();
        updateValuationTable();
        checkStepCompletion(3);
        showToast('✅ ลบผลลัพธ์สำเร็จ');
        saveProjectData();
    }
};

function updateOutcomeTable() {
    const tbody = document.getElementById('outcomeTableBody');
    if (!tbody) return;
    
    if (outcomes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #94a3b8;">ยังไม่มีข้อมูล (คลิก "เพิ่มผลลัพธ์" เพื่อเริ่มต้น)</td></tr>';
        return;
    }
    
    tbody.innerHTML = outcomes.map(o => {
        const typeIcon = o.type === 'ผลกระทบเชิงบวก' ? '✅' : '⚠️';
        return `
            <tr>
                <td>${o.stakeholder}</td>
                <td>${o.name}</td>
                <td><span style="padding: 4px 12px; border-radius: 12px; font-size: 0.85rem;">${typeIcon} ${o.type}</span></td>
                <td>${o.indicator}</td>
                <td>
                    <button type="button" class="btn btn-danger icon-btn" onclick="deleteOutcome(${o.id})" title="ลบ">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ========================================
// VALUATION FUNCTIONS
// ========================================

function updateValuationTable() {
    const tbody = document.getElementById('valuationTableBody');
    if (!tbody) return;
    
    if (outcomes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #94a3b8;">ยังไม่มีข้อมูล (กรุณาเพิ่มผลลัพธ์ในขั้นตอนที่ 3)</td></tr>';
        return;
    }
    
    tbody.innerHTML = outcomes.map(o => {
        const totalValue = (o.quantity || 0) * (o.unitValue || 0);
        return `
            <tr>
                <td>${o.name}</td>
                <td>${o.stakeholder}</td>
                <td>
                    <input type="number" 
                           value="${o.quantity || 0}" 
                           min="0"
                           style="width: 100%; padding: 6px; border: 1px solid #e2e8f0; border-radius: 6px;"
                           onchange="updateOutcomeValue(${o.id}, 'quantity', this.value)">
                </td>
                <td>
                    <input type="number" 
                           value="${o.unitValue || 0}" 
                           min="0"
                           style="width: 100%; padding: 6px; border: 1px solid #e2e8f0; border-radius: 6px;"
                           onchange="updateOutcomeValue(${o.id}, 'unitValue', this.value)">
                </td>
                <td>
                    <input type="number" 
                           value="${o.duration || 1}" 
                           min="1"
                           style="width: 100%; padding: 6px; border: 1px solid #e2e8f0; border-radius: 6px;"
                           onchange="updateOutcomeValue(${o.id}, 'duration', this.value)">
                </td>
                <td style="text-align: right; font-weight: 600;">
                    ฿ ${totalValue.toLocaleString()}
                </td>
            </tr>
        `;
    }).join('');
}

window.updateOutcomeValue = function(id, field, value) {
    const outcome = outcomes.find(o => o.id === id);
    if (outcome) {
        outcome[field] = parseFloat(value) || 0;
        updateValuationTable();
        checkStepCompletion(4);
        saveProjectData();
    }
};

// ========================================
// ADJUSTMENT FACTORS TABLE
// ========================================

function updateAdjustmentTable() {
    const tbody = document.getElementById('adjustmentTableBody');
    if (!tbody) return;
    
    if (outcomes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #94a3b8;">ยังไม่มีข้อมูล</td></tr>';
        return;
    }
    
    tbody.innerHTML = outcomes.map(o => `
        <tr>
            <td>${o.name}</td>
            <td>
                <input type="number" 
                       value="${o.deadweight || 0}" 
                       min="0" 
                       max="100"
                       style="width: 100%; padding: 6px; border: 1px solid #e2e8f0; border-radius: 6px;"
                       onchange="updateAdjustmentFactor(${o.id}, 'deadweight', this.value)">
            </td>
            <td>
                <input type="number" 
                       value="${o.attribution || 0}" 
                       min="0" 
                       max="100"
                       style="width: 100%; padding: 6px; border: 1px solid #e2e8f0; border-radius: 6px;"
                       onchange="updateAdjustmentFactor(${o.id}, 'attribution', this.value)">
            </td>
            <td>
                <input type="number" 
                       value="${o.displacement || 0}" 
                       min="0" 
                       max="100"
                       style="width: 100%; padding: 6px; border: 1px solid #e2e8f0; border-radius: 6px;"
                       onchange="updateAdjustmentFactor(${o.id}, 'displacement', this.value)">
            </td>
            <td>
                <input type="number" 
                       value="${o.dropoff || 0}" 
                       min="0" 
                       max="100"
                       style="width: 100%; padding: 6px; border: 1px solid #e2e8f0; border-radius: 6px;"
                       onchange="updateAdjustmentFactor(${o.id}, 'dropoff', this.value)">
            </td>
        </tr>
    `).join('');
}

window.updateAdjustmentFactor = function(id, field, value) {
    const outcome = outcomes.find(o => o.id === id);
    if (outcome) {
        outcome[field] = parseFloat(value) || 0;
        saveProjectData();
    }
};

// ========================================
// SROI CALCULATION
// ========================================

window.calculateSROI = function() {
    // Validate inputs
    const totalCost = parseFloat(document.getElementById('totalCost')?.value) || 0;
    const discountRate = parseFloat(document.getElementById('discountRate')?.value) || 3.5;
    
    if (totalCost <= 0) {
        alert('❌ กรุณากรอกต้นทุนโครงการใน Step 1');
        return;
    }

    if (outcomes.length === 0) {
        alert('❌ กรุณาเพิ่มผลลัพธ์และกรอกข้อมูลการประเมินมูลค่า');
        return;
    }

    // Check if all outcomes have values
    const hasInvalidOutcome = outcomes.some(o => !o.quantity || !o.unitValue || !o.duration);
    if (hasInvalidOutcome) {
        alert('❌ กรุณากรอกข้อมูลการประเมินมูลค่าให้ครบถ้วนใน Step 4');
        return;
    }

    // Calculate NPV for each outcome
    const discountRateDecimal = discountRate / 100;
    let totalBenefitNPV = 0;
    const summaryData = [];

    outcomes.forEach(outcome => {
        const quantity = outcome.quantity || 0;
        const unitValue = outcome.unitValue || 0;
        const duration = outcome.duration || 1;
        const deadweight = (outcome.deadweight || 0) / 100;
        const attribution = (outcome.attribution || 0) / 100;
        const displacement = (outcome.displacement || 0) / 100;
        const dropoff = (outcome.dropoff || 0) / 100;

        const initialValue = quantity * unitValue;
        let npv = 0;

        // Calculate NPV for each year
        for (let year = 1; year <= duration; year++) {
            // Apply drop-off
            const dropoffFactor = Math.pow(1 - dropoff, year - 1);
            
            // Calculate adjusted value
            let yearValue = initialValue * dropoffFactor;
            yearValue = yearValue * (1 - deadweight);
            yearValue = yearValue * (1 - attribution);
            yearValue = yearValue * (1 - displacement);

            // Apply discount rate
            const discountFactor = Math.pow(1 + discountRateDecimal, year);
            const yearNPV = yearValue / discountFactor;

            npv += yearNPV;
        }

        totalBenefitNPV += npv;

        summaryData.push({
            name: outcome.name,
            quantity: quantity,
            unitValue: unitValue,
            initialValue: initialValue,
            deadweight: outcome.deadweight || 0,
            attribution: outcome.attribution || 0,
            displacement: outcome.displacement || 0,
            netValue: initialValue * (1 - deadweight) * (1 - attribution) * (1 - displacement),
            npv: npv
        });
    });

    // Calculate cost NPV (assuming cost is incurred in year 0)
    const totalCostNPV = totalCost;

    // Calculate SROI
    const netBenefit = totalBenefitNPV - totalCostNPV;
    const sroiRatio = totalCostNPV > 0 ? totalBenefitNPV / totalCostNPV : 0;

    // Calculate payback period (simplified)
    let cumulativeValue = 0;
    let paybackPeriod = 0;
    const projectDuration = parseInt(document.getElementById('duration')?.value) || 1;
    
    for (let year = 1; year <= projectDuration; year++) {
        outcomes.forEach(outcome => {
            const quantity = outcome.quantity || 0;
            const unitValue = outcome.unitValue || 0;
            const dropoff = (outcome.dropoff || 0) / 100;
            const dropoffFactor = Math.pow(1 - dropoff, year - 1);
            
            const yearValue = quantity * unitValue * dropoffFactor;
            cumulativeValue += yearValue;
        });

        if (cumulativeValue >= totalCost && paybackPeriod === 0) {
            paybackPeriod = year;
        }
    }

    if (paybackPeriod === 0 && cumulativeValue < totalCost) {
        paybackPeriod = projectDuration + Math.ceil((totalCost - cumulativeValue) / (cumulativeValue / projectDuration));
    }

    // Display results
    document.getElementById('sroiRatio').textContent = sroiRatio.toFixed(2) + ':1';
    document.getElementById('sroiValue').textContent = sroiRatio.toFixed(2);
    document.getElementById('totalBenefitNPV').textContent = '฿ ' + totalBenefitNPV.toLocaleString(undefined, {maximumFractionDigits: 0});
    document.getElementById('totalCostNPV').textContent = '฿ ' + totalCostNPV.toLocaleString(undefined, {maximumFractionDigits: 0});
    document.getElementById('netBenefit').textContent = '฿ ' + netBenefit.toLocaleString(undefined, {maximumFractionDigits: 0});
    document.getElementById('paybackPeriod').textContent = paybackPeriod + ' ปี';

    // Update summary table
    updateSummaryTable(summaryData);

    // Create chart
    createSROIChart(summaryData);

    // Show results section
    document.getElementById('resultsSection').style.display = 'block';

    checkStepCompletion(5);
    showToast('✅ คำนวณ SROI สำเร็จ!');
    saveProjectData();
};

function updateSummaryTable(data) {
    const tbody = document.getElementById('summaryTableBody');
    if (!tbody) return;

    tbody.innerHTML = data.map(item => `
        <tr>
            <td>${item.name}</td>
            <td style="text-align: right;">${item.quantity.toLocaleString()}</td>
            <td style="text-align: right;">฿ ${item.unitValue.toLocaleString()}</td>
            <td style="text-align: right;">฿ ${item.initialValue.toLocaleString()}</td>
            <td style="text-align: center;">${item.deadweight}%</td>
            <td style="text-align: center;">${item.attribution}%</td>
            <td style="text-align: center;">${item.displacement}%</td>
            <td style="text-align: right;">฿ ${item.netValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
            <td style="text-align: right; font-weight: 600; color: #10b981;">฿ ${item.npv.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
        </tr>
    `).join('');
}

function createSROIChart(data) {
    const ctx = document.getElementById('sroiChart');
    if (!ctx) return;

    // Destroy existing chart if any
    if (sroiChart) {
        sroiChart.destroy();
    }

    sroiChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.name),
            datasets: [{
                label: 'มูลค่าเริ่มต้น (฿)',
                data: data.map(d => d.initialValue),
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
            }, {
                label: 'มูลค่าสุทธิ (฿)',
                data: data.map(d => d.netValue),
                backgroundColor: 'rgba(245, 158, 11, 0.7)',
                borderColor: 'rgba(245, 158, 11, 1)',
                borderWidth: 1
            }, {
                label: 'NPV (฿)',
                data: data.map(d => d.npv),
                backgroundColor: 'rgba(16, 185, 129, 0.7)',
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'เปรียบเทียบมูลค่าผลลัพธ์แต่ละรายการ'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '฿ ' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// ========================================
// PDF GENERATION
// ========================================

// ========================================
// HTML REPORT GENERATION - แทน PDF
// ========================================

window.generatePDF = function() {
    try {
        // Validate data
        if (!document.getElementById('projectName')?.value) {
            alert('❌ กรุณากรอกชื่อโครงการก่อนสร้างรายงาน');
            return;
        }

        if (outcomes.length === 0) {
            alert('❌ กรุณาเพิ่มผลลัพธ์ก่อนสร้างรายงาน');
            return;
        }

        showToast('✅ สร้างรายงานสำเร็จ!');

        // สร้างหน้าต่างใหม่สำหรับแสดงรายงาน
        const reportWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
        
        // Get SROI values
        const sroiRatio = document.getElementById('sroiValue')?.textContent || '0.00';
        const totalBenefit = document.getElementById('totalBenefitNPV')?.textContent || '฿ 0';
        const totalCost = document.getElementById('totalCostNPV')?.textContent || '฿ 0';
        const netBenefit = document.getElementById('netBenefit')?.textContent || '฿ 0';
        const paybackPeriod = document.getElementById('paybackPeriod')?.textContent || '- ปี';

        // สร้าง HTML รายงาน
        const reportHTML = `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>รายงาน SROI - ${document.getElementById('projectName')?.value || 'โครงการ'}</title>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Sarabun', sans-serif;
            background: #f8fafc;
            color: #334155;
            line-height: 1.6;
            padding: 20px;
        }
        
        .report-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .report-header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        .report-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .report-subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .report-content {
            padding: 30px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section-header {
            background: #1e3a8a;
            color: white;
            padding: 15px 20px;
            margin: -30px -30px 20px -30px;
            font-size: 1.3rem;
            font-weight: 600;
        }
        
        .section:first-child .section-header {
            margin-top: 0;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 15px;
            margin: 20px 0;
        }
        
        .info-label {
            font-weight: 600;
            color: #475569;
        }
        
        .info-value {
            color: #1e293b;
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .table th {
            background: #f1f5f9;
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
            color: #475569;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .table td {
            padding: 12px 15px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .table tr:last-child td {
            border-bottom: none;
        }
        
        .table tr:hover {
            background: #f8fafc;
        }
        
        .sroi-highlight {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
        }
        
        .sroi-ratio {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .sroi-label {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .metric-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #3b82f6;
        }
        
        .metric-value {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 5px;
        }
        
        .metric-label {
            color: #64748b;
            font-size: 0.9rem;
        }
        
        .outcome-item {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #10b981;
        }
        
        .outcome-name {
            font-size: 1.1rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 10px;
        }
        
        .outcome-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            font-size: 0.9rem;
            color: #64748b;
        }
        
        .summary-box {
            background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%);
            padding: 25px;
            border-radius: 12px;
            margin: 30px 0;
        }
        
        .summary-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: #92400e;
            margin-bottom: 15px;
        }
        
        .summary-text {
            color: #92400e;
            line-height: 1.8;
        }
        
        .recommendations {
            background: #eff6ff;
            padding: 25px;
            border-radius: 12px;
            margin: 30px 0;
        }
        
        .recommendations-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 15px;
        }
        
        .recommendations ul {
            padding-left: 20px;
            color: #1e40af;
        }
        
        .recommendations li {
            margin: 8px 0;
            line-height: 1.6;
        }
        
        .footer {
            background: #f1f5f9;
            padding: 20px;
            text-align: center;
            color: #64748b;
            font-size: 0.9rem;
            margin-top: 40px;
        }
        
        .print-btn {
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            margin: 20px 0;
            font-family: 'Sarabun', sans-serif;
        }
        
        .print-btn:hover {
            background: #2563eb;
        }
        
        @media print {
            body { background: white; padding: 0; }
            .print-btn { display: none; }
            .report-container { box-shadow: none; }
        }
        
        .type-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        .type-positive {
            background: #dcfce7;
            color: #166534;
        }
        
        .type-negative {
            background: #fee2e2;
            color: #991b1b;
        }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="report-header">
            <h1 class="report-title">รายงาน SROI Calculator</h1>
            <p class="report-subtitle">Social Return on Investment</p>
            <p style="margin-top: 10px; opacity: 0.8;">สร้างเมื่อ: ${new Date().toLocaleDateString('th-TH', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</p>
        </div>

        <div class="report-content">
            <!-- Section 1: Project Information -->
            <div class="section">
                <div class="section-header">1. ข้อมูลโครงการและขอบเขตการประเมิน</div>
                <div class="info-grid">
                    <div class="info-label">ชื่อโครงการ:</div>
                    <div class="info-value">${document.getElementById('projectName')?.value || '-'}</div>
                    
                    <div class="info-label">องค์กร/หน่วยงาน:</div>
                    <div class="info-value">${document.getElementById('organization')?.value || '-'}</div>
                    
                    <div class="info-label">ระยะเวลาโครงการ:</div>
                    <div class="info-value">${document.getElementById('duration')?.value || 1} ปี</div>
                    
                    <div class="info-label">ปีที่เริ่มโครงการ:</div>
                    <div class="info-value">${document.getElementById('startYear')?.value || new Date().getFullYear()}</div>
                    
                    <div class="info-label">ต้นทุนโครงการทั้งหมด:</div>
                    <div class="info-value">฿ ${parseFloat(document.getElementById('totalCost')?.value || 0).toLocaleString()}</div>
                    
                    <div class="info-label">อัตราคิดลด (Discount Rate):</div>
                    <div class="info-value">${document.getElementById('discountRate')?.value || 3.5}%</div>
                </div>
                
                ${document.getElementById('objective')?.value ? `
                <div style="margin-top: 20px;">
                    <div class="info-label">วัตถุประสงค์:</div>
                    <div class="info-value" style="margin-top: 10px; padding: 15px; background: #f8fafc; border-radius: 8px; line-height: 1.8;">
                        ${document.getElementById('objective').value}
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- Section 2: Stakeholders -->
            <div class="section">
                <div class="section-header">2. ผู้มีส่วนได้ส่วนเสีย (Stakeholders)</div>
                ${stakeholders.length === 0 ? '<p style="color: #64748b; font-style: italic;">ยังไม่มีข้อมูล</p>' : `
                <table class="table">
                    <thead>
                        <tr>
                            <th>ลำดับ</th>
                            <th>ชื่อกลุ่ม</th>
                            <th>จำนวนคน</th>
                            <th>ประเภท</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stakeholders.map((s, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${s.name || '-'}</td>
                            <td>${(s.count || 0).toLocaleString()} คน</td>
                            <td>${s.type || '-'}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
                `}
            </div>

            <!-- Section 3: Outcomes -->
            <div class="section">
                <div class="section-header">3. ผลลัพธ์และตัวชี้วัด (Outcomes)</div>
                ${outcomes.length === 0 ? '<p style="color: #64748b; font-style: italic;">ยังไม่มีข้อมูล</p>' : `
                <div>
                    ${outcomes.map((o, index) => `
                    <div class="outcome-item">
                        <div class="outcome-name">
                            ${index + 1}. ${o.name}
                            <span class="type-badge ${o.type === 'ผลกระทบเชิงบวก' ? 'type-positive' : 'type-negative'}">
                                ${o.type === 'ผลกระทบเชิงบวก' ? '✅' : '⚠️'} ${o.type}
                            </span>
                        </div>
                        <div class="outcome-details">
                            <div><strong>กลุ่มเป้าหมาย:</strong> ${o.stakeholder}</div>
                            <div><strong>ตัวชี้วัด:</strong> ${o.indicator}</div>
                        </div>
                    </div>
                    `).join('')}
                </div>
                `}
            </div>

            <!-- Section 4: Valuation -->
            <div class="section">
                <div class="section-header">4. การประเมินมูลค่าทางการเงิน</div>
                ${outcomes.length === 0 || !outcomes.some(o => o.quantity > 0) ? 
                    '<p style="color: #64748b; font-style: italic;">ยังไม่มีข้อมูลการประเมินมูลค่า</p>' : `
                <table class="table">
                    <thead>
                        <tr>
                            <th>ผลลัพธ์</th>
                            <th style="text-align: right;">จำนวน</th>
                            <th style="text-align: right;">มูลค่า/หน่วย</th>
                            <th style="text-align: center;">ระยะเวลา</th>
                            <th style="text-align: right;">มูลค่ารวม</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${outcomes.filter(o => (o.quantity || 0) > 0).map(o => {
                            const totalValue = (o.quantity || 0) * (o.unitValue || 0);
                            return `
                            <tr>
                                <td>${o.name}</td>
                                <td style="text-align: right;">${(o.quantity || 0).toLocaleString()}</td>
                                <td style="text-align: right;">฿ ${(o.unitValue || 0).toLocaleString()}</td>
                                <td style="text-align: center;">${o.duration || 1} ปี</td>
                                <td style="text-align: right; font-weight: 600;">฿ ${totalValue.toLocaleString()}</td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                `}
            </div>

            <!-- Section 5: Adjustment Factors -->
            <div class="section">
                <div class="section-header">5. ปัจจัยปรับค่า (Adjustment Factors)</div>
                ${outcomes.length === 0 ? '<p style="color: #64748b; font-style: italic;">ยังไม่มีข้อมูล</p>' : `
                <table class="table">
                    <thead>
                        <tr>
                            <th>ผลลัพธ์</th>
                            <th style="text-align: center;">Deadweight (%)</th>
                            <th style="text-align: center;">Attribution (%)</th>
                            <th style="text-align: center;">Displacement (%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${outcomes.map(o => `
                        <tr>
                            <td>${o.name}</td>
                            <td style="text-align: center;">${o.deadweight || 0}%</td>
                            <td style="text-align: center;">${o.attribution || 0}%</td>
                            <td style="text-align: center;">${o.displacement || 0}%</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
                `}
            </div>

            <!-- Section 6: SROI Results -->
            <div class="section">
                <div class="section-header">6. ผลการคำนวณ SROI</div>
                
                <div class="sroi-highlight">
                    <div class="sroi-ratio">${sroiRatio}:1</div>
                    <div class="sroi-label">SROI Ratio</div>
                </div>

                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">${totalBenefit}</div>
                        <div class="metric-label">มูลค่าผลประโยชน์รวม (NPV)</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${totalCost}</div>
                        <div class="metric-label">ต้นทุนโครงการ</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${netBenefit}</div>
                        <div class="metric-label">ผลประโยชน์สุทธิ</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${paybackPeriod}</div>
                        <div class="metric-label">ระยะเวลาคืนทุน</div>
                    </div>
                </div>
            </div>

            <!-- Section 7: Summary -->
            <div class="section">
                <div class="section-header">7. สรุปและข้อเสนอแนะ</div>
                
                <div class="summary-box">
                    <div class="summary-title">สรุปผลการประเมิน</div>
                    <div class="summary-text">
                        ${(() => {
                            const sroiValue = parseFloat(sroiRatio);
                            if (sroiValue > 3) {
                                return `โครงการนี้มีผลตอบแทนทางสังคมในระดับ<strong>สูงมาก (Excellent)</strong> โดยสร้างมูลค่าทางสังคมมากกว่าการลงทุนถึง <strong>${sroiValue} เท่า</strong> ซึ่งแสดงให้เห็นว่าโครงการมีประสิทธิผลสูงและควรดำเนินการต่อไปหรือขยายผลให้กว้างขึ้น`;
                            } else if (sroiValue > 2) {
                                return `โครงการนี้มีผลตอบแทนทางสังคมในระดับ<strong>ดี (Good)</strong> สร้างมูลค่าเพิ่มเกินกว่าการลงทุนอย่างชัดเจน แนะนำให้ดำเนินการต่อไปและพิจารณาปรับปรุงเพื่อเพิ่มประสิทธิภาพ`;
                            } else if (sroiValue > 1) {
                                return `โครงการนี้มีผลตอบแทนทางสังคมในระดับที่<strong>ยอมรับได้ (Acceptable)</strong> มีมูลค่าเกินกว่าการลงทุน แต่ควรพิจารณาปรับปรุงเพื่อเพิ่มประสิทธิภาพให้ดีขึ้น`;
                            } else if (sroiValue === 1) {
                                return `โครงการนี้มีผลตอบแทนทางสังคม<strong>เท่ากับการลงทุน</strong> ควรพิจารณาปรับปรุงการดำเนินงานเพื่อเพิ่มมูลค่าทางสังคมให้มากขึ้น`;
                            } else {
                                return `โครงการนี้มีผลตอบแทนทางสังคม<strong>ต่ำกว่าการลงทุน</strong> ควรทบทวนและปรับปรุงแนวทางการดำเนินงานอย่างจริงจัง`;
                            }
                        })()}
                    </div>
                </div>

                <div class="recommendations">
                    <div class="recommendations-title">ข้อเสนอแนะเพิ่มเติม</div>
                    <ul>
                        <li>ควรติดตามประเมินผลอย่างต่อเนื่องเพื่อปรับปรุงประสิทธิภาพของโครงการ</li>
                        <li>พิจารณาขยายผลโครงการไปยังกลุ่มเป้าหมายอื่นๆ ที่มีศักยภาพ</li>
                        <li>เก็บรวบรวมข้อมูลเพิ่มเติมเพื่อเพิ่มความแม่นยำในการประเมินผลกระทบ</li>
                        <li>สร้างเครือข่ายพันธมิตรเพื่อเพิ่มประสิทธิผลและลดต้นทุนการดำเนินงาน</li>
                        <li>พัฒนาระบบการติดตามและรายงานผลอย่างเป็นระบบ</li>
                    </ul>
                </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <button class="print-btn" onclick="window.print()">🖨️ พิมพ์รายงาน</button>
            </div>
        </div>

        <div class="footer">
            สร้างโดย SROI Calculator | Bangkok University | ${new Date().toLocaleDateString('th-TH')}
        </div>
    </div>
</body>
</html>
        `;

        // เขียน HTML ลงในหน้าต่างใหม่
        reportWindow.document.write(reportHTML);
        reportWindow.document.close();

        checkStepCompletion(6);
        saveProjectData();

    } catch (error) {
        console.error('Error generating report:', error);
        alert('❌ เกิดข้อผิดพลาดในการสร้างรายงาน: ' + error.message);
    }
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

function showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// ========================================
// FIREBASE AUTHENTICATION
// ========================================

function initializeAuth() {
    console.log('Initializing authentication...');
    
    window.showAlert = function(elementId, message, type = 'error') {
        const alertElement = document.getElementById(elementId);
        if (alertElement) {
            alertElement.innerHTML = `
                <div style="padding: 12px; margin-bottom: 16px; border-radius: 6px; 
                     background: ${type === 'success' ? '#d1fae5' : '#fee2e2'};
                     color: ${type === 'success' ? '#065f46' : '#991b1b'};
                     border: 1px solid ${type === 'success' ? '#a7f3d0' : '#fecaca'};">
                    ${message}
                </div>
            `;
            setTimeout(() => {
                alertElement.innerHTML = '';
            }, 5000);
        }
    };

    window.handleRegister = async function(event) {
        event.preventDefault();
        
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = generatePassword();
        
        if (!name || !email) {
            showAlert('registerAlert', '❌ กรุณากรอกชื่อและอีเมล', 'error');
            return;
        }
        
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '⏳ กำลังสมัครสมาชิก...';
        submitBtn.disabled = true;
        
        try {
            const { createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js');
            
            const userCredential = await createUserWithEmailAndPassword(window.auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });
            await sendPasswordResetEmail(window.auth, email);
            
            showAlert('registerAlert', `✅ สมัครสมาชิกสำเร็จ! อีเมลสำหรับตั้งรหัสผ่านได้ถูกส่งไปยัง ${email} แล้ว`, 'success');
            
            document.getElementById('registerName').value = '';
            document.getElementById('registerEmail').value = '';
            document.getElementById('registerOrganization').value = '';
            
            setTimeout(() => toggleForm(), 3000);
            
        } catch (error) {
            console.error('Registration Error:', error);
            let errorMessage = '❌ เกิดข้อผิดพลาดในการสมัครสมาชิก';
            
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = '❌ อีเมลนี้ถูกใช้งานแล้ว';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = '❌ รูปแบบอีเมลไม่ถูกต้อง';
            }
            
            showAlert('registerAlert', errorMessage, 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    };

    window.handleLogin = async function(event) {
        event.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            showAlert('loginAlert', '❌ กรุณากรอกอีเมลและรหัสผ่าน', 'error');
            return;
        }
        
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner"></span> กำลังเข้าสู่ระบบ...';
        submitBtn.disabled = true;
        
        try {
            const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js');
            
            const userCredential = await signInWithEmailAndPassword(window.auth, email, password);
            currentUser = userCredential.user;
            
            showAlert('loginAlert', '✅ เข้าสู่ระบบสำเร็จ!', 'success');
            
            setTimeout(() => showDashboard(), 500);
            
        } catch (error) {
            console.error('Login Error:', error);
            let errorMessage = '❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง';
            showAlert('loginAlert', errorMessage, 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    };

    window.handleGoogleSignIn = async function() {
        try {
            const { GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js');
            
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(window.auth, provider);
            currentUser = result.user;
            
            showAlert('loginAlert', '✅ เข้าสู่ระบบด้วย Google สำเร็จ!', 'success');
            
            setTimeout(() => showDashboard(), 500);
            
        } catch (error) {
            console.error('Google Sign-in Error:', error);
            if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
                showAlert('loginAlert', '❌ เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google', 'error');
            }
        }
    };

    window.handleLogout = function() {
        if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
            window.auth.signOut().then(() => {
                currentUser = null;
                currentProjectId = null;
                stakeholders = [];
                outcomes = [];
                completedSteps = {1: false, 2: false, 3: false, 4: false, 5: false, 6: false};
                
                document.getElementById('authScreen').style.display = 'flex';
                document.getElementById('dashboardScreen').style.display = 'none';
                document.getElementById('mainApp').style.display = 'none';
            });
        }
    };

    function showDashboard() {
        const userName = currentUser.displayName || currentUser.email;
        
        document.getElementById('userNameDisplay').textContent = `สวัสดี, ${userName}`;
        document.getElementById('userNameDisplay2').textContent = `${userName}`;
        
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('dashboardScreen').style.display = 'block';
        document.getElementById('dashboardContainer').style.display = 'block';
        document.getElementById('mainApp').style.display = 'none';
        
        loadUserProjects();
    }

    window.toggleForm = function() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        const loginAlert = document.getElementById('loginAlert');
        const registerAlert = document.getElementById('registerAlert');
        if (loginAlert) loginAlert.innerHTML = '';
        if (registerAlert) registerAlert.innerHTML = '';
        
        if (loginForm.style.display === 'none') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        }
    };

    function generatePassword(length = 12) {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    }

    if (window.auth) {
        window.auth.onAuthStateChanged((user) => {
            if (user) {
                currentUser = user;
                showDashboard();
            } else {
                document.getElementById('authScreen').style.display = 'flex';
                document.getElementById('dashboardScreen').style.display = 'none';
                document.getElementById('mainApp').style.display = 'none';
            }
        });
    }
    
    console.log('✅ SROI-BU Application initialized with Firestore');
}

// ========================================
// INITIALIZE APP
// ========================================

console.log('App.js loaded with full Firestore integration');

if (window.auth && window.db) {
    initializeAuth();
} else {
    window.addEventListener('firebaseReady', () => {
        initializeAuth();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (currentProjectId) {
                updateStep();
            }
        }, 100);
    });
} else {
    setTimeout(() => {
        if (currentProjectId) {
            updateStep();
        }
    }, 100);
}
