// ========================================
// GLOBAL VARIABLES
// ========================================
let currentStep = 1;
const totalSteps = 6;
let stakeholders = [];
let outcomes = [];
let valuations = [];

// ========================================
// STEP NAVIGATION FUNCTIONS
// ========================================

function nextStep() {
    if (currentStep < totalSteps) {
        currentStep++;
        updateStep();
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStep();
    }
}

function goToStep(stepNumber) {
    if (stepNumber >= 1 && stepNumber <= totalSteps) {
        currentStep = stepNumber;
        updateStep();
    }
}

function updateStep() {
    // Hide all step contents
    document.querySelectorAll('.step-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Show current step content
    const currentContent = document.getElementById(`step${currentStep}`);
    if (currentContent) {
        currentContent.classList.add('active');
    }
    
    // Update step navigation
    document.querySelectorAll('.step').forEach((step, index) => {
        if (index + 1 === currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
    
    // Update buttons
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
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// STAKEHOLDER FUNCTIONS
// ========================================

function addStakeholder() {
    const name = prompt('ชื่อกลุ่มผู้มีส่วนได้ส่วนเสีย:');
    if (!name) return;
    
    const count = prompt('จำนวนคน:');
    if (!count) return;
    
    const type = prompt('ประเภท (เช่น ผู้รับผลประโยชน์โดยตรง):');
    if (!type) return;
    
    const description = prompt('คำอธิบาย:');
    
    const stakeholder = {
        id: Date.now(),
        name: name,
        count: parseInt(count),
        type: type,
        description: description || ''
    };
    
    stakeholders.push(stakeholder);
    updateStakeholderTable();
}

function deleteStakeholder(id) {
    if (confirm('คุณต้องการลบข้อมูลนี้หรือไม่?')) {
        stakeholders = stakeholders.filter(s => s.id !== id);
        updateStakeholderTable();
    }
}

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
            <td>${s.count}</td>
            <td>${s.type}</td>
            <td>${s.description}</td>
            <td>
                <button type="button" class="btn btn-danger" style="padding: 4px 12px; font-size: 0.85rem;" onclick="deleteStakeholder(${s.id})">
                    ลบ
                </button>
            </td>
        </tr>
    `).join('');
}

// ========================================
// OUTCOME FUNCTIONS
// ========================================

function addOutcome() {
    if (stakeholders.length === 0) {
        alert('กรุณาเพิ่มผู้มีส่วนได้ส่วนเสียก่อน');
        return;
    }
    
    const stakeholderName = prompt('เลือกผู้มีส่วนได้ส่วนเสีย:\n' + stakeholders.map((s, i) => `${i + 1}. ${s.name}`).join('\n'));
    if (!stakeholderName) return;
    
    const outcomeName = prompt('ชื่อผลลัพธ์:');
    if (!outcomeName) return;
    
    const type = prompt('ประเภท (เช่น ผลกระทบเชิงบวก):');
    if (!type) return;
    
    const indicator = prompt('ตัวชี้วัด:');
    
    const outcome = {
        id: Date.now(),
        stakeholder: stakeholderName,
        name: outcomeName,
        type: type,
        indicator: indicator || ''
    };
    
    outcomes.push(outcome);
    updateOutcomeTable();
}

function deleteOutcome(id) {
    if (confirm('คุณต้องการลบข้อมูลนี้หรือไม่?')) {
        outcomes = outcomes.filter(o => o.id !== id);
        updateOutcomeTable();
    }
}

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
            <td>${o.type}</td>
            <td>${o.indicator}</td>
            <td>
                <button type="button" class="btn btn-danger" style="padding: 4px 12px; font-size: 0.85rem;" onclick="deleteOutcome(${o.id})">
                    ลบ
                </button>
            </td>
        </tr>
    `).join('');
}

// ========================================
// PDF GENERATION
// ========================================

function generatePDF() {
    alert('ฟังก์ชันสร้าง PDF กำลังพัฒนา\nจะเปิดใช้งานในเร็วๆ นี้');
    // TODO: Implement PDF generation with jsPDF
}

// ========================================
// SMOOTH SCROLLING
// ========================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ========================================
// FIREBASE AUTHENTICATION
// ========================================

function initializeAuth() {
    console.log('Initializing authentication...');
    
    // Helper function to show alerts
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

    // Handle Registration with Firebase
    window.handleRegister = async function(event) {
        event.preventDefault();
        
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const organization = document.getElementById('registerOrganization').value.trim();
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
            
            await updateProfile(userCredential.user, {
                displayName: name
            });
            
            await sendPasswordResetEmail(window.auth, email);
            
            showAlert('registerAlert', `✅ สมัครสมาชิกสำเร็จ! อีเมลสำหรับตั้งรหัสผ่านได้ถูกส่งไปยัง ${email} แล้ว`, 'success');
            
            document.getElementById('registerName').value = '';
            document.getElementById('registerEmail').value = '';
            document.getElementById('registerOrganization').value = '';
            
            setTimeout(() => {
                toggleForm();
            }, 3000);
            
        } catch (error) {
            console.error('Registration Error:', error);
            
            let errorMessage = '❌ เกิดข้อผิดพลาดในการสมัครสมาชิก';
            
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = '❌ อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = '❌ รูปแบบอีเมลไม่ถูกต้อง';
            } else if (error.code === 'auth/operation-not-allowed') {
                errorMessage = '❌ ระบบยังไม่เปิดให้สมัครสมาชิก กรุณาติดต่อผู้ดูแลระบบ';
            }
            
            showAlert('registerAlert', errorMessage, 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    };

    // Handle Login with Firebase
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
            
            setTimeout(() => {
                showMainApp();
            }, 500);
            
        } catch (error) {
            console.error('Login Error:', error);
            
            let errorMessage = '❌ เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
            
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage = '❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = '❌ รูปแบบอีเมลไม่ถูกต้อง';
            } else if (error.code === 'auth/user-disabled') {
                errorMessage = '❌ บัญชีนี้ถูกระงับการใช้งาน';
            }
            
            showAlert('loginAlert', errorMessage, 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    };

    // Handle Google Sign-in
    window.handleGoogleSignIn = async function() {
        try {
            const { GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js');
            
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(window.auth, provider);
            
            localStorage.setItem('userName', result.user.displayName || result.user.email);
            localStorage.setItem('userEmail', result.user.email);
            
            showAlert('loginAlert', '✅ เข้าสู่ระบบด้วย Google สำเร็จ!', 'success');
            
            setTimeout(() => {
                showMainApp();
            }, 500);
            
        } catch (error) {
            console.error('Google Sign-in Error:', error);
            
            let errorMessage = '❌ เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google';
            
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = '❌ คุณได้ปิดหน้าต่างการเข้าสู่ระบบ';
            } else if (error.code === 'auth/cancelled-popup-request') {
                return;
            }
            
            showAlert('loginAlert', errorMessage, 'error');
        }
    };

    // Handle Logout
    window.handleLogout = function() {
        if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
            window.auth.signOut().then(() => {
                localStorage.removeItem('userName');
                localStorage.removeItem('userEmail');
                
                document.getElementById('authScreen').style.display = 'flex';
                document.getElementById('mainApp').style.display = 'none';
                
                // Reset to step 1
                currentStep = 1;
                updateStep();
            });
        }
    };

    // Show Main App
    window.showMainApp = function() {
        const userName = localStorage.getItem('userName');
        const userNameDisplay = document.getElementById('userNameDisplay');
        
        if (userNameDisplay) {
            userNameDisplay.textContent = `สวัสดี, ${userName}`;
        }
        
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        // Initialize step 1
        currentStep = 1;
        updateStep();
    };

    // Toggle between login and register forms
    window.toggleForm = function() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        // Clear alerts
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

    // Generate random password
    function generatePassword(length = 12) {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    }

    // Check authentication status
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
    
    console.log('✅ SROI-BU Application initialized with Firebase Authentication');
}

// ========================================
// INITIALIZE APP
// ========================================

// Wait for Firebase to be ready
if (window.auth) {
    // Firebase already loaded
    initializeAuth();
} else {
    // Wait for firebaseReady event
    window.addEventListener('firebaseReady', () => {
        initializeAuth();
    });
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    // Set initial step
    updateStep();
    
    console.log('✅ App loaded successfully');
});
