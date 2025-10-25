// ========================================
// GLOBAL VARIABLES
// ========================================
let currentStep = 1;
const totalSteps = 6;
let stakeholders = [];
let outcomes = [];
let valuations = [];

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
    console.log('nextStep called, current:', currentStep);
    if (currentStep < totalSteps) {
        currentStep++;
        updateStep();
    }
};

window.previousStep = function() {
    console.log('previousStep called, current:', currentStep);
    if (currentStep > 1) {
        currentStep--;
        updateStep();
    }
};

window.goToStep = function(stepNumber) {
    console.log('goToStep called:', stepNumber);
    if (stepNumber >= 1 && stepNumber <= totalSteps) {
        currentStep = stepNumber;
        updateStep();
    }
};

function updateStep() {
    console.log('Updating to step:', currentStep);
    
    const allSteps = document.querySelectorAll('.step-content');
    allSteps.forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    
    const currentContent = document.getElementById(`step${currentStep}`);
    if (currentContent) {
        currentContent.classList.add('active');
        currentContent.style.display = 'block';
        console.log('Showing step:', currentStep);
    } else {
        console.error('Step element not found:', `step${currentStep}`);
    }
    
    const stepButtons = document.querySelectorAll('.step');
    stepButtons.forEach((step, index) => {
        if (index + 1 === currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
    
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) {
        prevBtn.style.display = currentStep === 1 ? 'none' : 'inline-flex';
    }
    
    if (nextBtn) {
        if (currentStep === totalSteps) {
            nextBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'inline-flex';
        }
    }
    
    // Update tables based on current step
    if (currentStep === 2) {
        updateStakeholderTable();
    } else if (currentStep === 3) {
        updateOutcomeTable();
    } else if (currentStep === 4) {
        updateValuationTable();
    } else if (currentStep === 5) {
        calculateAndShowResults();
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
    
    showToast('✅ เพิ่มผู้มีส่วนได้ส่วนเสียสำเร็จ!');
};

window.deleteStakeholder = function(id) {
    if (confirm('คุณต้องการลบข้อมูลนี้หรือไม่?')) {
        stakeholders = stakeholders.filter(s => s.id !== id);
        updateStakeholderTable();
        updateOutcomeStakeholderOptions();
        showToast('✅ ลบข้อมูลสำเร็จ');
    }
};

function updateStakeholderTable() {
    const tbody = document.getElementById('stakeholderTableBody');
    if (!tbody) return;
    
    if (stakeholders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">ยังไม่มีข้อมูล (คลิก "เพิ่มผู้มีส่วนได้ส่วนเสีย" เพื่อเริ่มต้น)</td></tr>';
        return;
    }
    
    tbody.innerHTML = stakeholders.map(s => `
        <tr>
            <td>${s.name}</td>
            <td>${s.count.toLocaleString()}</td>
            <td><span style="background: #dbeafe; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem;">${s.type}</span></td>
            <td>${s.description || '-'}</td>
            <td>
                <button type="button" class="btn btn-danger" style="padding: 6px 12px; font-size: 0.85rem;" onclick="deleteStakeholder(${s.id})">
                    🗑️ ลบ
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
    
    select.innerHTML = '<option value="">-- เลือก --</option>' +
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
        duration: 1
    };
    
    outcomes.push(outcome);
    updateOutcomeTable();
    closeModal('outcomeModal');
    
    showToast('✅ เพิ่มผลลัพธ์สำเร็จ!');
};

window.deleteOutcome = function(id) {
    if (confirm('คุณต้องการลบข้อมูลนี้หรือไม่?')) {
        outcomes = outcomes.filter(o => o.id !== id);
        updateOutcomeTable();
        showToast('✅ ลบข้อมูลสำเร็จ');
    }
};

function updateOutcomeTable() {
    const tbody = document.getElementById('outcomeTableBody');
    if (!tbody) return;
    
    if (outcomes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">ยังไม่มีข้อมูล (คลิก "เพิ่มผลลัพธ์" เพื่อเริ่มต้น)</td></tr>';
        return;
    }
    
    tbody.innerHTML = outcomes.map(o => `
        <tr>
            <td>${o.stakeholder}</td>
            <td>${o.name}</td>
            <td><span style="background: ${o.type === 'ผลกระทบเชิงบวก' ? '#d1fae5' : '#fee2e2'}; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem;">${o.type}</span></td>
            <td>${o.indicator}</td>
            <td>
                <button type="button" class="btn btn-danger" style="padding: 6px 12px; font-size: 0.85rem;" onclick="deleteOutcome(${o.id})">
                    🗑️ ลบ
                </button>
            </td>
        </tr>
    `).join('');
}

// ========================================
// VALUATION FUNCTIONS (STEP 4)
// ========================================

function updateValuationTable() {
    const tbody = document.getElementById('valuationTableBody');
    if (!tbody) return;
    
    if (outcomes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #64748b;"><div style="font-size: 1.2rem; margin-bottom: 8px;">📋 ยังไม่มีผลลัพธ์</div><div>กรุณากลับไปขั้นตอนที่ 3 เพื่อเพิ่มผลลัพธ์ก่อน</div></td></tr>';
        return;
    }
    
    tbody.innerHTML = outcomes.map(outcome => `
        <tr>
            <td style="font-weight: 500;">${outcome.name}</td>
            <td>
                <input type="number" 
                       id="quantity_${outcome.id}" 
                       class="form-control" 
                       style="width: 120px; padding: 8px; font-size: 0.95rem;"
                       placeholder="0"
                       min="0"
                       value="${outcome.quantity || ''}"
                       onchange="saveValuation(${outcome.id}, 'quantity', this.value)">
            </td>
            <td>
                <input type="number" 
                       id="unitValue_${outcome.id}" 
                       class="form-control" 
                       style="width: 120px; padding: 8px; font-size: 0.95rem;"
                       placeholder="0"
                       min="0"
                       value="${outcome.unitValue || ''}"
                       onchange="saveValuation(${outcome.id}, 'unitValue', this.value)">
            </td>
            <td>
                <input type="number" 
                       id="deadweight_${outcome.id}" 
                       class="form-control" 
                       style="width: 100px; padding: 8px; font-size: 0.95rem;"
                       placeholder="0"
                       min="0"
                       max="100"
                       value="${outcome.deadweight || ''}"
                       onchange="saveValuation(${outcome.id}, 'deadweight', this.value)">
            </td>
            <td>
                <input type="number" 
                       id="attribution_${outcome.id}" 
                       class="form-control" 
                       style="width: 100px; padding: 8px; font-size: 0.95rem;"
                       placeholder="0"
                       min="0"
                       max="100"
                       value="${outcome.attribution || ''}"
                       onchange="saveValuation(${outcome.id}, 'attribution', this.value)">
            </td>
            <td>
                <input type="number" 
                       id="displacement_${outcome.id}" 
                       class="form-control" 
                       style="width: 100px; padding: 8px; font-size: 0.95rem;"
                       placeholder="0"
                       min="0"
                       max="100"
                       value="${outcome.displacement || ''}"
                       onchange="saveValuation(${outcome.id}, 'displacement', this.value)">
            </td>
            <td>
                <input type="number" 
                       id="duration_${outcome.id}" 
                       class="form-control" 
                       style="width: 100px; padding: 8px; font-size: 0.95rem;"
                       placeholder="1"
                       min="1"
                       value="${outcome.duration || 1}"
                       onchange="saveValuation(${outcome.id}, 'duration', this.value)">
            </td>
        </tr>
    `).join('');
}

window.saveValuation = function(outcomeId, field, value) {
    const outcome = outcomes.find(o => o.id === outcomeId);
    if (outcome) {
        outcome[field] = parseFloat(value) || 0;
        console.log(`Saved ${field} = ${outcome[field]} for outcome:`, outcome.name);
    }
};

// ========================================
// CALCULATION FUNCTIONS (STEP 5)
// ========================================

function calculateAndShowResults() {
    if (outcomes.length === 0) {
        return;
    }
    
    let totalValue = 0;
    let results = [];
    
    outcomes.forEach(outcome => {
        // Calculate impact value
        const initialValue = (outcome.quantity || 0) * (outcome.unitValue || 0);
        const deadweightFactor = 1 - ((outcome.deadweight || 0) / 100);
        const attributionFactor = 1 - ((outcome.attribution || 0) / 100);
        const displacementFactor = 1 - ((outcome.displacement || 0) / 100);
        
        const netImpact = initialValue * deadweightFactor * attributionFactor * displacementFactor;
        
        // Calculate NPV (simplified - should use discount rate)
        const duration = outcome.duration || 1;
        const npv = netImpact * duration;
        
        totalValue += npv;
        
        results.push({
            outcome: outcome,
            initialValue: initialValue,
            netImpact: netImpact,
            npv: npv
        });
    });
    
    // Update summary cards
    const sroiRatio = document.getElementById('sroiRatio');
    const netImpactEl = document.getElementById('netImpact');
    const totalNPV = document.getElementById('totalNPV');
    
    if (sroiRatio) sroiRatio.textContent = '0.00 : 1'; // Needs investment amount
    if (netImpactEl) netImpactEl.textContent = '฿' + totalValue.toLocaleString('th-TH', {maximumFractionDigits: 0});
    if (totalNPV) totalNPV.textContent = '฿' + totalValue.toLocaleString('th-TH', {maximumFractionDigits: 0});
    
    // Update summary table
    updateSummaryTable(results);
}

function updateSummaryTable(results) {
    const tbody = document.getElementById('summaryTableBody');
    if (!tbody) return;
    
    if (results.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">ไม่มีข้อมูล</td></tr>';
        return;
    }
    
    tbody.innerHTML = results.map(r => `
        <tr>
            <td>${r.outcome.stakeholder}</td>
            <td>${r.outcome.name}</td>
            <td>${r.outcome.type}</td>
            <td>฿${r.initialValue.toLocaleString('th-TH', {maximumFractionDigits: 0})}</td>
            <td>${r.outcome.deadweight || 0}%</td>
            <td>${r.outcome.attribution || 0}%</td>
            <td>${r.outcome.displacement || 0}%</td>
            <td>฿${r.netImpact.toLocaleString('th-TH', {maximumFractionDigits: 0})}</td>
            <td>฿${r.npv.toLocaleString('th-TH', {maximumFractionDigits: 0})}</td>
        </tr>
    `).join('');
}

// ========================================
// TOAST NOTIFICATION
// ========================================

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

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ========================================
// PDF GENERATION
// ========================================

window.generatePDF = function() {
    alert('ฟังก์ชันสร้าง PDF กำลังพัฒนา\nจะเปิดใช้งานในเร็วๆ นี้');
};

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
        submitBtn.innerHTML = '⏳ กำลังเข้าสู่ระบบ...';
        submitBtn.disabled = true;
        
        try {
            const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js');
            
            const userCredential = await signInWithEmailAndPassword(window.auth, email, password);
            
            showAlert('loginAlert', '✅ เข้าสู่ระบบสำเร็จ!', 'success');
            
            localStorage.setItem('userName', userCredential.user.displayName || email);
            localStorage.setItem('userEmail', userCredential.user.email);
            
            setTimeout(() => showMainApp(), 500);
            
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
            
            localStorage.setItem('userName', result.user.displayName || result.user.email);
            localStorage.setItem('userEmail', result.user.email);
            
            showAlert('loginAlert', '✅ เข้าสู่ระบบด้วย Google สำเร็จ!', 'success');
            
            setTimeout(() => showMainApp(), 500);
            
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
                localStorage.clear();
                document.getElementById('authScreen').style.display = 'flex';
                document.getElementById('mainApp').style.display = 'none';
                currentStep = 1;
                stakeholders = [];
                outcomes = [];
                updateStep();
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
        document.getElementById('mainApp').style.display = 'block';
        
        currentStep = 1;
        setTimeout(() => updateStep(), 100);
    };

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
                localStorage.setItem('userName', user.displayName || user.email);
                localStorage.setItem('userEmail', user.email);
                showMainApp();
            } else {
                document.getElementById('authScreen').style.display = 'flex';
                document.getElementById('mainApp').style.display = 'none';
            }
        });
    }
    
    console.log('✅ SROI-BU Application initialized');
}

// ========================================
// INITIALIZE APP
// ========================================

console.log('App.js loaded');

if (window.auth) {
    initializeAuth();
} else {
    window.addEventListener('firebaseReady', () => {
        initializeAuth();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => updateStep(), 100);
    });
} else {
    setTimeout(() => updateStep(), 100);
}
