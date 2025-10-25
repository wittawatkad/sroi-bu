// Smooth Scrolling
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

// Navbar Background on Scroll
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (navbar && window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    } else if (navbar) {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Animated Counter
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target + '+';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start) + '+';
        }
    }, 16);
}

// Intersection Observer for Counter Animation
const observerOptions = {
    threshold: 0.5
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counters = entry.target.querySelectorAll('.counter');
            counters.forEach(counter => {
                const target = parseInt(counter.getAttribute('data-target'));
                animateCounter(counter, target);
            });
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

const statsSection = document.querySelector('.stats');
if (statsSection) {
    observer.observe(statsSection);
}

// Typing Effect
function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Initialize typing effect when page loads
window.addEventListener('load', () => {
    const heroTitle = document.querySelector('.hero h1');
    if (heroTitle) {
        const originalText = heroTitle.textContent;
        typeWriter(heroTitle, originalText, 100);
    }
});

// ========================================
// FIREBASE AUTHENTICATION
// ========================================

// Helper function to show alerts
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

// Handle Registration with Firebase
async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const organization = document.getElementById('registerOrganization').value.trim();
    const password = generatePassword(); // Generate a 8-character password
    
    if (!name || !email) {
        showAlert('registerAlert', '❌ กรุณากรอกชื่อและอีเมล', 'error');
        return;
    }
    
    // Show loading
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '⏳ กำลังสมัครสมาชิก...';
    submitBtn.disabled = true;
    
    try {
        const { createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js');
        
        // Create user with generated password
        const userCredential = await createUserWithEmailAndPassword(window.auth, email, password);
        
        // Update profile with name
        await updateProfile(userCredential.user, {
            displayName: name
        });
        
        // Send password reset email so user can set their own password
        await sendPasswordResetEmail(window.auth, email);
        
        showAlert('registerAlert', `✅ สมัครสมาชิกสำเร็จ! อีเมลสำหรับตั้งรหัสผ่านได้ถูกส่งไปยัง ${email} แล้ว`, 'success');
        
        // Clear form
        document.getElementById('registerName').value = '';
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerOrganization').value = '';
        
        // Switch to login after 3 seconds
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
}

// Handle Login with Firebase
async function handleLogin(event) {
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
        
        // Store user info
        localStorage.setItem('userName', userCredential.user.displayName || email);
        localStorage.setItem('userEmail', userCredential.user.email);
        
        // Show main app
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
}

// Handle Google Sign-in
async function handleGoogleSignIn() {
    try {
        const { GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js');
        
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(window.auth, provider);
        
        // Store user info
        localStorage.setItem('userName', result.user.displayName || result.user.email);
        localStorage.setItem('userEmail', result.user.email);
        
        showAlert('loginAlert', '✅ เข้าสู่ระบบด้วย Google สำเร็จ!', 'success');
        
        // Show main app
        setTimeout(() => {
            showMainApp();
        }, 500);
        
    } catch (error) {
        console.error('Google Sign-in Error:', error);
        
        let errorMessage = '❌ เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google';
        
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = '❌ คุณได้ปิดหน้าต่างการเข้าสู่ระบบ';
        } else if (error.code === 'auth/cancelled-popup-request') {
            return; // User cancelled, don't show error
        }
        
        showAlert('loginAlert', errorMessage, 'error');
    }
}

// Handle Logout
function handleLogout() {
    if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
        window.auth.signOut().then(() => {
            localStorage.removeItem('userName');
            localStorage.removeItem('userEmail');
            
            document.getElementById('authScreen').style.display = 'flex';
            document.getElementById('mainApp').style.display = 'none';
        });
    }
}

// Show Main App
function showMainApp() {
    const userName = localStorage.getItem('userName');
    const userNameDisplay = document.getElementById('userNameDisplay');
    
    if (userNameDisplay) {
        userNameDisplay.textContent = `สวัสดี, ${userName}`;
    }
    
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
}

// Toggle between login and register forms
function toggleForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

// Generate random password
function generatePassword(length = 8) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

// Check authentication status on load
window.addEventListener('load', () => {
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
});

// Mobile Menu Toggle
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (navMenu && menuToggle) {
        if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
            navMenu.classList.remove('active');
        }
    }
});

// Fade-in animation on scroll
const fadeElements = document.querySelectorAll('.fade-in');

const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

fadeElements.forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    fadeObserver.observe(element);
});

// Back to top button
const backToTopButton = document.querySelector('.back-to-top');

if (backToTopButton) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopButton.style.display = 'block';
        } else {
            backToTopButton.style.display = 'none';
        }
    });

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

console.log('SROI-BU Application initialized with Firebase Authentication');
