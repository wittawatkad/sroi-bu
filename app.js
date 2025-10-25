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
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    } else {
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

// Form Validation and Submission with Firebase
document.getElementById('registrationForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const organization = document.getElementById('organization').value.trim();
    
    // Basic validation
    if (!fullName || !email || !password || !organization) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }
    
    if (password.length < 6) {
        alert('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('รูปแบบอีเมลไม่ถูกต้อง');
        return;
    }
    
    try {
        // สร้างบัญชีผู้ใช้ใหม่ด้วย Firebase Authentication
        const { createUserWithEmailAndPassword, updateProfile } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js');
        
        const userCredential = await createUserWithEmailAndPassword(window.auth, email, password);
        
        // อัพเดทชื่อผู้ใช้
        await updateProfile(userCredential.user, {
            displayName: fullName
        });
        
        alert('สมัครสมาชิกสำเร็จ! ยินดีต้อนรับเข้าสู่ระบบ SROI-BU');
        console.log('User registered:', userCredential.user);
        
        // เคลียร์ฟอร์ม
        this.reset();
        
        // Optional: redirect หรือทำอะไรต่อหลังสมัครสำเร็จ
        // window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Registration Error:', error);
        
        // แสดงข้อความ error ที่เข้าใจง่าย
        let errorMessage = 'เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่อีกครั้ง';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
        } else if (error.code === 'auth/operation-not-allowed') {
            errorMessage = 'ระบบยังไม่เปิดให้สมัครสมาชิก กรุณาติดต่อผู้ดูแลระบบ';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้ กรุณาตรวจสอบการเชื่อมต่อ';
        }
        
        alert(errorMessage);
    }
});

// ฟังก์ชันสำหรับเข้าสู่ระบบ (ถ้ามีฟอร์ม login)
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        alert('กรุณากรอกอีเมลและรหัสผ่าน');
        return;
    }
    
    try {
        const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js');
        
        const userCredential = await signInWithEmailAndPassword(window.auth, email, password);
        
        alert('เข้าสู่ระบบสำเร็จ!');
        console.log('User logged in:', userCredential.user);
        
        // Optional: redirect to dashboard
        // window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Login Error:', error);
        
        let errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
        
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = 'บัญชีนี้ถูกระงับการใช้งาน';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'มีการพยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่';
        }
        
        alert(errorMessage);
    }
});

// Mobile Menu Toggle (ถ้ามี)
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
