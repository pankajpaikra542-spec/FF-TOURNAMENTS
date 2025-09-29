// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyDDuqLprmwkAXPHxyft31Nf_XnM3JaFgnI",
    authDomain: "ffmax-1a509.firebaseapp.com",
    databaseURL: "https://ffmax-1a509-default-rtdb.firebaseio.com",
    projectId: "ffmax-1a509",
    storageBucket: "ffmax-1a509.appspot.com",
    messagingSenderId: "216916500863",
    appId: "1:216916500863:web:9f7006952cf6a6e75dba4b",
    measurementId: "G-61W6JSW0XB"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// DOM Elements
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const loginMessage = document.getElementById("loginMessage");
const signupMessage = document.getElementById("signupMessage");

const tournamentContainer = document.getElementById("tournamentContainer");
const modeCards = document.querySelectorAll(".mode-card");
const selectedModeSpan = document.getElementById("selectedMode");
const soloFields = document.querySelector(".solo-fields");
const squadFields = document.querySelector(".squad-fields");
const payButton = document.getElementById("payButton");
const entryFeeDisplay = document.getElementById("entryFeeDisplay");
const totalAmount = document.getElementById("totalAmount");

const successMessage = document.getElementById("successMessage");
const successDetails = document.getElementById("successDetails");

// Active mode tracking
let selectedMode = "solo";
let entryFee = 30;

// Auth Tab Switching
loginTab.addEventListener("click", () => {
    loginTab.classList.add("active");
    signupTab.classList.remove("active");
    loginForm.style.display = "flex";
    signupForm.style.display = "none";
});

signupTab.addEventListener("click", () => {
    signupTab.classList.add("active");
    loginTab.classList.remove("active");
    signupForm.style.display = "flex";
    loginForm.style.display = "none";
});

// Auth Functions
loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    try {
        await auth.signInWithEmailAndPassword(email, password);
        loginMessage.textContent = "Login successful!";
        loginMessage.className = "auth-message success";
        tournamentContainer.style.display = "block";
        document.getElementById("authSection").style.display = "none";
    } catch (error) {
        loginMessage.textContent = error.message;
        loginMessage.className = "auth-message error";
    }
});

signupBtn.addEventListener("click", async () => {
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    try {
        await auth.createUserWithEmailAndPassword(email, password);
        signupMessage.textContent = "Signup successful!";
        signupMessage.className = "auth-message success";
        tournamentContainer.style.display = "block";
        document.getElementById("authSection").style.display = "none";
    } catch (error) {
        signupMessage.textContent = error.message;
        signupMessage.className = "auth-message error";
    }
});

// Mode Selection
modeCards.forEach(card => {
    card.addEventListener("click", () => {
        modeCards.forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        selectedMode = card.getAttribute("data-mode");
        entryFee = parseInt(card.getAttribute("data-fee"));
        selectedModeSpan.textContent = selectedMode.toUpperCase();
        entryFeeDisplay.textContent = `₹${entryFee}`;
        totalAmount.textContent = `₹${entryFee + 10}`;

        // Show/hide form sections
        if (selectedMode === "solo") {
            soloFields.style.display = "block";
            squadFields.style.display = "none";
        } else {
            soloFields.style.display = "none";
            squadFields.style.display = "block";
        }
    });
});

// Utility: Mobile Validation
function validateMobile(number) {
    const regex = /^[6-9]\d{9}$/;
    return regex.test(number);
}

// Reset Tournament Form
function resetTournamentForm() {
    document.getElementById("tournamentForm").reset();
    successMessage.style.display = "none";
    tournamentContainer.style.display = "block";
    selectedMode = "solo";
    modeCards.forEach(c => c.classList.remove("active"));
    document.querySelector(".mode-card[data-mode='solo']").classList.add("active");
    selectedModeSpan.textContent = "SOLO";
    entryFee = 30;
    entryFeeDisplay.textContent = `₹${entryFee}`;
    totalAmount.textContent = `₹${entryFee + 10}`;
    soloFields.style.display = "block";
    squadFields.style.display = "none";
}

// Load Razorpay Script Dynamically
function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
        if (document.querySelector("script[src='https://checkout.razorpay.com/v1/checkout.js']")) {
            resolve(true);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => reject(false);
        document.body.appendChild(script);
    });
}

// Collect Form Data
function collectFormData() {
    if (!auth.currentUser) {
        alert("User not logged in!");
        return null;
    }
    let data = { mode: selectedMode, userEmail: auth.currentUser.email };
    if (selectedMode === "solo") {
        const playerName = document.getElementById("playerName").value.trim();
        const mobile = document.getElementById("mobile").value.trim();
        if (!playerName || !mobile) { alert("Fill all fields!"); return null; }
        if (!validateMobile(mobile)) { alert("Enter valid mobile number!"); return null; }
        data.players = [{ name: playerName, mobile }];
    } else {
        const leaderName = document.getElementById("teamLeaderName").value.trim();
        const leaderMobile = document.getElementById("teamMobile").value.trim();
        const player1 = document.getElementById("player1").value.trim();
        const player2 = document.getElementById("player2").value.trim();
        const player3 = document.getElementById("player3").value.trim();
        if (!leaderName || !leaderMobile || !player1 || !player2 || !player3) {
            alert("Fill all fields!"); return null;
        }
        if (!validateMobile(leaderMobile)) { alert("Enter valid leader mobile!"); return null; }
        data.players = [
            { name: leaderName, mobile: leaderMobile },
            { name: player1 }, { name: player2 }, { name: player3 }
        ];
    }
    data.amount = entryFee + 10;
    data.timestamp = Date.now();
    return data;
}

// Save Data to Firebase
function saveToFirebase(data) {
    const ref = database.ref(`tournaments/${selectedMode}`);
    const newEntry = ref.push();
    newEntry.set(data, error => {
        if (error) {
            alert("Error saving registration data!");
            console.error(error);
        } else {
            console.log("Data saved successfully!");
        }
    });
}

// Pay & Register
payButton.addEventListener("click", async () => {
    const formData = collectFormData();
    if (!formData) return;

    payButton.disabled = true;
    payButton.textContent = "Processing...";

    try {
        await loadRazorpayScript();

        // Create order on backend
        const response = await fetch("/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: formData.amount })
        });

        if (!response.ok) throw new Error("Server error. Try again!");
        const orderData = await response.json();

        const options = {
            key: "YOUR_RAZORPAY_KEY", // Add your key here
            amount: orderData.amount,
            currency: "INR",
            name: "FreeFire Tournament",
            description: `Payment for ${selectedMode.toUpperCase()} mode`,
            order_id: orderData.id,
            handler: function (res) {
                // Payment successful → save to Firebase
                saveToFirebase(formData);
                tournamentContainer.style.display = "none";
                successMessage.style.display = "block";
                successDetails.textContent = `Your registration for ${selectedMode.toUpperCase()} mode has been confirmed.`;
                payButton.disabled = false;
                payButton.textContent = "Pay & Register";
            },
            theme: { color: "#8a3ffd" }
        };

        const rzp = new Razorpay(options);

        rzp.on("payment.failed", function () {
            alert("Payment failed. Please try again.");
            payButton.disabled = false;
            payButton.textContent = "Pay & Register";
        });

        rzp.on("checkout.dismiss", function () {
            payButton.disabled = false;
            payButton.textContent = "Pay & Register";
        });

        rzp.open();
    } catch (err) {
        alert("Error loading payment gateway. Try again later.");
        console.error(err);
        payButton.disabled = false;
        payButton.textContent = "Pay & Register";
    }
});