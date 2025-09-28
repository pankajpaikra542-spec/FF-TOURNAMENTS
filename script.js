// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyDDuqLprmwkAXPHxyft31Nf_XnM3JaFgnI",
    authDomain: "ffmax-1a509.firebaseapp.com",
    databaseURL: "https://ffmax-1a509-default-rtdb.firebaseio.com",
    projectId: "ffmax-1a509",
    storageBucket: "ffmax-1a509.appspot.com",
    messagingSenderId: "216916500863",
    appId: "1:216916500863:web:9f7006952cf6a6e75dba4a",
    measurementId: "G-61W6JSW0XB"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const rtdb = firebase.database();

// DOM Elements
const authSection = document.getElementById('authSection');
const tournamentContainer = document.getElementById('tournamentContainer');
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginMessage = document.getElementById('loginMessage');
const signupMessage = document.getElementById('signupMessage');

// Mode Selection Elements
const modeCards = document.querySelectorAll('.mode-card');
const soloFields = document.querySelector('.solo-fields');
const squadFields = document.querySelector('.squad-fields');
const selectedModeElement = document.getElementById('selectedMode');
const entryFeeDisplay = document.getElementById('entryFeeDisplay');
const totalAmountElement = document.getElementById('totalAmount');

// Form Elements
const payButton = document.getElementById('payButton');
const successMessage = document.getElementById('successMessage');
const successDetails = document.getElementById('successDetails');

// Current Mode and Fee
let currentMode = 'solo';
let currentFee = 30;

// Auth Tab Switching
loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.style.display = 'flex';
    signupForm.style.display = 'none';
});

signupTab.addEventListener('click', () => {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupForm.style.display = 'flex';
    loginForm.style.display = 'none';
});

// Auth Functions
document.getElementById('signupBtn').addEventListener('click', () => {
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    if (!email || !password) {
        showMessage(signupMessage, 'Please fill all fields', 'error');
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then(user => {
            showMessage(signupMessage, '✅ Sign-up successful!', 'success');
            document.getElementById('signupForm').reset();
        })
        .catch(err => {
            showMessage(signupMessage, '❌ ' + err.message, 'error');
        });
});

document.getElementById('loginBtn').addEventListener('click', () => {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showMessage(loginMessage, 'Please fill all fields', 'error');
        return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
        .then(user => {
            showMessage(loginMessage, '✅ Login successful!', 'success');
            document.getElementById('loginForm').reset();
        })
        .catch(err => {
            showMessage(loginMessage, '❌ ' + err.message, 'error');
        });
});

// Auth State Listener
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        authSection.style.display = 'none';
        tournamentContainer.style.display = 'block';
    } else {
        // User is signed out
        authSection.style.display = 'block';
        tournamentContainer.style.display = 'none';
        successMessage.style.display = 'none';
    }
});

// Mode Selection
modeCards.forEach(card => {
    card.addEventListener('click', () => {
        // Remove active class from all cards
        modeCards.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked card
        card.classList.add('active');
        
        // Update current mode and fee
        currentMode = card.dataset.mode;
        currentFee = parseInt(card.dataset.fee);
        
        // Update UI
        selectedModeElement.textContent = currentMode.charAt(0).toUpperCase() + currentMode.slice(1);
        entryFeeDisplay.textContent = '₹' + currentFee;
        totalAmountElement.textContent = '₹' + (currentFee + 10); // Including processing fee
        
        // Show/hide appropriate form fields
        if (currentMode === 'solo') {
            soloFields.style.display = 'block';
            squadFields.style.display = 'none';
        } else {
            soloFields.style.display = 'none';
            squadFields.style.display = 'block';
        }
    });
});

// Registration Function
payButton.addEventListener('click', async () => {
    if (!auth.currentUser) {
        alert('Please login first');
        return;
    }

    const formData = { 
        mode: currentMode, 
        entryFee: currentFee,
        processingFee: 10,
        totalAmount: currentFee + 10,
        timestamp: new Date().toISOString(), 
        userId: auth.currentUser.uid,
        email: auth.currentUser.email
    };

    // Validate and collect data based on mode
    if (currentMode === 'solo') {
        const playerName = document.getElementById('playerName').value.trim();
        const mobile = document.getElementById('mobile').value.trim();
        
        if (!playerName || !mobile) { 
            alert('Please fill all fields'); 
            return; 
        }
        
        formData.players = [playerName]; 
        formData.mobile = mobile;
        formData.teamName = playerName + "'s Team";
    } else {
        const teamLeaderName = document.getElementById('teamLeaderName').value.trim();
        const teamMobile = document.getElementById('teamMobile').value.trim();
        const player1 = document.getElementById('player1').value.trim();
        const player2 = document.getElementById('player2').value.trim();
        const player3 = document.getElementById('player3').value.trim();
        
        if (!teamLeaderName || !teamMobile || !player1 || !player2 || !player3) { 
            alert('Please fill all fields'); 
            return; 
        }
        
        formData.players = [teamLeaderName, player1, player2, player3]; 
        formData.mobile = teamMobile;
        formData.teamName = document.getElementById('teamLeaderName').value.trim() + "'s Squad";
    }

    try {
        // Show loading state
        payButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        payButton.disabled = true;
        
        // Save to Firebase
        const newRegistrationRef = rtdb.ref("tournament_registrations").push();
        await newRegistrationRef.set(formData);
        
        // Show success message
        successMessage.style.display = 'block';
        successDetails.textContent = `Registration confirmed for ${currentMode} mode! Total amount paid: ₹${currentFee + 10}. Registration ID: ${newRegistrationRef.key}`;
        
        // Reset form
        document.getElementById('tournamentForm').reset();
        
        // Reset button
        payButton.innerHTML = '<i class="fas fa-lock"></i> Pay & Register';
        payButton.disabled = false;
        
    } catch (err) { 
        console.error(err); 
        alert('Failed to save registration. Please try again.'); 
        
        // Reset button on error
        payButton.innerHTML = '<i class="fas fa-lock"></i> Pay & Register';
        payButton.disabled = false;
    }
});

// Reset Form Function
function resetForm() { 
    successMessage.style.display = 'none'; 
    document.getElementById('tournamentForm').reset();
}

// Helper function to show messages
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = 'auth-message ' + type;
    element.style.display = 'block';
    
    // Hide message after 5 seconds
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Set initial payment summary
    entryFeeDisplay.textContent = '₹30';
    totalAmountElement.textContent = '₹40';
});