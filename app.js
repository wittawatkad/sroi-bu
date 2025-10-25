// ========================================
// COMPLETE SROI CALCULATOR WITH FIREBASE
// ========================================

// Global Variables
let currentStep = 1;
const totalSteps = 6;
let currentProject = null;
let projects = [];
let userProfile = null;

// Project Data Structure
const projectData = {
    id: null,
    name: '',
    description: '',
    organization: '',
    startDate: '',
    endDate: '',
    budget: 0,
    discountRate: 3,
    stakeholders: [],
    outcomes: [],
    status: 'draft', // 'draft' or 'completed'
    sroiRatio: 0,
    totalNPV: 0,
    createdAt: null,
    updatedAt: null,
    userId: null
};

// Step Completion Status
const stepStatus = {
    step1: false,
    step2: false,
    step3: false,
    step4: false,
    step5: false
};

// ========================================
// FIREBASE INITIALIZATION
// ========================================

let db = null;

async function initializeFirestore() {
    try {
        const { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy } = 
            await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        if (window.app) {
            db = getFirestore(window.app);
            console.log('✅ Firestore initialized');
            
            // Load user data
            await loadUserProfile();
            await loadProjects();
        }
    } catch (error) {
        console.error('Firestore initialization error:', error);
    }
}

// ========================================
// USER PROFILE FUNCTIONS
// ========================================

window.openProfile = function() {
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('profileSection').style.display = 'block';
    
    // Load existing profile
    if (userProfile) {
        document.getElementById('profileName').value = userProfile.name || '';
        document.getElementById('profileEmail').value = userProfile.email || '';
        document.getElementById('profileOrganization').value = userProfile.organization || '';
        document.getElementById('profilePosition').value = userProfile.position || '';
        document.getElementById('profilePhone').value = userProfile.phone || '';
        document.getElementById('profileDepartment').value = userProfile.department || '';
        document.getElementById('profileAddress').value = userProfile.address || '';
    } else {
        // Set email from localStorage
        document.getElementById('profileEmail').value = localStorage.getItem('userEmail') || '';
    }
};

window.closeProfile = function() {
    document.getElementById('profileSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
};

window.saveProfile = async function(event) {
    event.preventDefault();
    
    const profileData = {
        name: document.getElementById('profileName').value.trim(),
        email: document.getElementById('profileEmail').value.trim(),
        organization: document.getElementById('profileOrganization').value.trim(),
        position: document.getElementById('profilePosition').value.trim(),
        phone: document.getElementById('profilePhone').value.trim(),
        department: document.getElementById('profileDepartment').value.trim(),
        address: document.getElementById('profileAddress').value.trim(),
        updatedAt: new Date().toISOString()
    };
    
    try {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const userId = window.auth.currentUser.uid;
        await setDoc(doc(db, 'users', userId), profileData);
        
        userProfile = profileData;
        localStorage.setItem('userName', profileData.name);
        
        showAlert('profileAlert', '✅ บันทึกข้อมูลสำเร็จ!', 'success');
        
        setTimeout(() => {
            closeProfile();
        }, 1500);
        
    } catch (error) {
        console.error('Save profile error:', error);
        showAlert('profileAlert', '❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    }
};

async function loadUserProfile() {
    if (!window.auth.currentUser) return;
    
    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const userId = window.auth.currentUser.uid;
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            userProfile = docSnap.data();
            localStorage.setItem('userName', userProfile.name);
        }
    } catch (error) {
        console.error('Load profile error:', error);
    }
}

// ========================================
// DASHBOARD FUNCTIONS
// ========================================

window.showDashboard = function() {
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('profileSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    
    updateDashboardStats();
    displayProjects();
};

window.createNewProject = function() {
    // Reset project data
    currentProject = JSON.parse(JSON.stringify(projectData));
    currentProject.id = 'proj_' + Date.now();
    currentProject.createdAt = new Date().toISOString();
    currentProject.userId = window.auth.currentUser.uid;
    
    // Reset step status
    Object.keys(stepStatus).forEach(key => stepStatus[key] = false);
    updateStepIndicators();
    
    // Go to Step 1
    currentStep = 1;
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    updateStep();
};

window.openProject = async function(projectId) {
    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const docRef = doc(db, 'projects', projectId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            currentProject = { id: projectId, ...docSnap.data() };
            
            // Load data into forms
            loadProjectData();
            
            // Show main app
            document.getElementById('dashboardSection').style.display = 'none';
            document.getElementById('mainApp').style.display = 'block';
            
            currentStep = 1;
            updateStep();
        }
    } catch (error) {
        console.error('Open project error:', error);
        alert('❌ ไม่สามารถเปิดโครงการได้');
    }
};

window.deleteProject = async function(projectId) {
    if (!confirm('คุณต้องการลบโครงการนี้หรือไม่?\nการดำเนินการนี้ไม่สามารถย้อนกลับได้')) {
        return;
    }
    
    try {
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        await deleteDoc(doc(db, 'projects', projectId));
        
        projects = projects.filter(p => p.id !== projectId);
        
        showToast('✅ ลบโครงการสำเร็จ');
        displayProjects();
        updateDashboardStats();
        
    } catch (error) {
        console.error('Delete project error:', error);
        alert('❌ ไม่สามารถลบโครงการได้');
    }
};

async function loadProjects() {
    if (!window.auth.currentUser) return;
    
    try {
        const { collection, query, where, getDocs, orderBy } = 
            await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const userId = window.auth.currentUser.uid;
        const q = query(
            collection(db, 'projects'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        projects = [];
        
        querySnapshot.forEach((doc) => {
            projects.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`Loaded ${projects.length} projects`);
        
    } catch (error) {
        console.error('Load projects error:', error);
    }
}

function displayProjects() {
    const tbody = document.getElementById('projectsTableBody');
    if (!tbody) return;
    
    if (projects.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 60px; color: #94a3b8;">
                    <div style="font-size: 3rem; margin-bottom: 16px;">📭</div>
                    <div style="font-size: 1.2rem; margin-bottom: 8px;">ยังไม่มีโครงการ</div>
                    <div style="font-size: 0.95rem;">คลิก "สร้างโครงการใหม่" เพื่อเริ่มต้น</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = projects.map(project => `
        <tr>
            <td>
                <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">${project.name || 'ไม่มีชื่อ'}</div>
                <div style="font-size: 0.85rem; color: #64748b;">${project.description || '-'}</div>
            </td>
            <td style="white-space: nowrap;">
                ${project.createdAt ? new Date(project.createdAt).toLocaleDateString('th-TH') : '-'}
            </td>
            <td>
                <span class="status-badge ${project.status === 'completed' ? 'status-completed' : 'status-draft'}">
                    ${project.status === 'completed' ? '✅ เสร็จสมบูรณ์' : '⏳ กำลังดำเนินการ'}
                </span>
            </td>
            <td style="white-space: nowrap;">
                ฿${(project.budget || 0).toLocaleString('th-TH')}
            </td>
            <td style="font-weight: 600; color: #2563eb;">
                ${project.sroiRatio ? project.sroiRatio.toFixed(2) + ' : 1' : '-'}
            </td>
            <td>
                <div class="action-buttons">
                    <button type="button" class="btn btn-primary btn-icon" onclick="openProject('${project.id}')" title="เปิดโครงการ">
                        📂
                    </button>
                    <button type="button" class="btn btn-danger btn-icon" onclick="deleteProject('${project.id}')" title="ลบโครงการ">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateDashboardStats() {
    const total = projects.length;
    const inProgress = projects.filter(p => p.status === 'draft').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const avgSROI = completed > 0 
        ? (projects.filter(p => p.sroiRatio).reduce((sum, p) => sum + p.sroiRatio, 0) / completed)
        : 0;
    
    document.getElementById('totalProjects').textContent = total;
    document.getElementById('inProgressProjects').textContent = inProgress;
    document.getElementById('completedProjects').textContent = completed;
    document.getElementById('avgSROI').textContent = avgSROI.toFixed(2);
}

window.filterProjects = function() {
    const searchText = document.getElementById('searchProject').value.toLowerCase();
    const status = document.getElementById('filterStatus').value;
    
    const rows = document.querySelectorAll('#projectsTableBody tr');
    
    rows.forEach(row => {
        const projectName = row.cells[0]?.textContent.toLowerCase() || '';
        const projectStatus = row.cells[2]?.textContent.includes('เสร็จสมบูรณ์') ? 'completed' : 'draft';
        
        const matchSearch = projectName.includes(searchText);
        const matchStatus = !status || projectStatus === status;
        
        row.style.display = (matchSearch && matchStatus) ? '' : 'none';
    });
};

// ========================================
// PROJECT DATA FUNCTIONS
// ========================================

async function saveProjectData() {
    if (!currentProject || !db) return;
    
    try {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        currentProject.updatedAt = new Date().toISOString();
        
        await setDoc(doc(db, 'projects', currentProject.id), currentProject);
        
        console.log('Project saved:', currentProject.id);
        
    } catch (error) {
        console.error('Save project error:', error);
    }
}

function loadProjectData() {
    if (!currentProject) return;
    
    // Load Step 1 data
    document.getElementById('projectName').value = currentProject.name || '';
    document.getElementById('projectDescription').value = currentProject.description || '';
    document.getElementById('projectOrganization').value = currentProject.organization || '';
    document.getElementById('projectStartDate').value = currentProject.startDate || '';
    document.getElementById('projectEndDate').value = currentProject.endDate || '';
    document.getElementById('projectBudget').value = currentProject.budget || '';
    document.getElementById('discountRate').value = currentProject.discountRate || 3;
    
    // Update step status
    if (currentProject.name) stepStatus.step1 = true;
    if (currentProject.stakeholders?.length > 0) stepStatus.step2 = true;
    if (currentProject.outcomes?.length > 0) stepStatus.step3 = true;
    
    updateStepIndicators();
}

// ========================================
// STEP NAVIGATION
// ========================================

window.nextStep = function() {
    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            currentStep++;
            updateStep();
        }
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
        currentStep = stepNumber;
        updateStep();
    }
};

function updateStep() {
    // Hide all steps
    document.querySelectorAll('.step-content').forEach(el => {
        el.classList.remove('active');
        el.style.display = 'none';
    });
    
    // Show current step
    const currentContent = document.getElementById(`step${currentStep}`);
    if (currentContent) {
        currentContent.classList.add('active');
        currentContent.style.display = 'block';
    }
    
    // Update step buttons
    document.querySelectorAll('.step').forEach((el, index) => {
        el.classList.remove('active');
        if (index + 1 === currentStep) {
            el.classList.add('active');
        }
    });
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) prevBtn.style.display = currentStep === 1 ? 'none' : 'inline-flex';
    if (nextBtn) nextBtn.style.display = currentStep === totalSteps ? 'none' : 'inline-flex';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateCurrentStep() {
    if (currentStep === 1) {
        const name = document.getElementById('projectName').value.trim();
        const budget = document.getElementById('projectBudget').value;
        
        if (!name || !budget) {
            alert('❌ กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
            return false;
        }
        
        // Save Step 1 data
        currentProject.name = name;
        currentProject.description = document.getElementById('projectDescription').value.trim();
        currentProject.organization = document.getElementById('projectOrganization').value.trim();
        currentProject.startDate = document.getElementById('projectStartDate').value;
        currentProject.endDate = document.getElementById('projectEndDate').value;
        currentProject.budget = parseFloat(budget);
        currentProject.discountRate = parseFloat(document.getElementById('discountRate').value) || 3;
        
        stepStatus.step1 = true;
        saveProjectData();
    }
    
    updateStepIndicators();
    return true;
}

function updateStepIndicators() {
    document.querySelectorAll('.step').forEach((el, index) => {
        const stepKey = `step${index + 1}`;
        el.classList.remove('completed');
        
        if (stepStatus[stepKey]) {
            el.classList.add('completed');
        }
    });
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function showAlert(elementId, message, type = 'error') {
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
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.innerHTML = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: 'Sarabun', sans-serif;
        font-weight: 500;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// ========================================
// AUTHENTICATION
// ========================================

window.handleLogout = function() {
    if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
        window.auth.signOut().then(() => {
            localStorage.clear();
            location.reload();
        });
    }
};

window.showMainApp = function() {
    const userName = localStorage.getItem('userName');
    const userNameDisplay = document.getElementById('userNameDisplay');
    
    if (userNameDisplay) {
        userNameDisplay.textContent = `สวัสดี, ${userName}`;
    }
    
    document.getElementById('authScreen').style.display = 'none';
    
    // Show dashboard by default
    showDashboard();
};

// ========================================
// INITIALIZATION
// ========================================

console.log('🚀 SROI Calculator with Firebase loaded');

if (window.auth) {
    window.auth.onAuthStateChanged((user) => {
        if (user) {
            initializeFirestore();
            localStorage.setItem('userEmail', user.email);
            showMainApp();
        } else {
            document.getElementById('authScreen').style.display = 'flex';
        }
    });
}
