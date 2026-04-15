let web3;
let userAccount = null;
let contractABI = null;
let contractInstance = null;

const logsDiv = document.getElementById('logs');
const connectBtn = document.getElementById('connectBtn');
const walletAddressDiv = document.getElementById('walletAddress');
const readResultDiv = document.getElementById('readResult');

// Add a log to the UI
function addLog(message, type = 'info') {
    const time = new Date().toLocaleTimeString();
    let classStr = 'log-msg';
    if (type === 'error') classStr = 'log-error';
    if (type === 'success') classStr = 'log-success';

    const p = document.createElement('div');
    p.className = 'log-entry';
    p.innerHTML = `<span class="log-time">[${time}]</span> <span class="${classStr}">${message}</span>`;
    
    logsDiv.prepend(p);
    console.log(`[${time}] ${type.toUpperCase()}: ${message}`);
}

// 1. Kutubxonani va ABI ni yuklash
window.addEventListener('load', async () => {
    addLog('DApp yuklanmoqda... Web3.js ' + typeof Web3 !== 'undefined' ? 'Topildi' : 'Topilmadi!');
    
    try {
        // ABI faylini yuklab olish
        const response = await fetch('contractABI.json');
        contractABI = await response.json();
        addLog('Smart-kontrakt ABI fayli muvaffaqiyatli yuklandi.', 'success');
    } catch (e) {
        addLog('ABI faylini yuklashda xatolik: ' + e.message, 'error');
    }

    // Default Sepolia contract for testing if none provided
    document.getElementById('contractAddress').value = "0x89D5db5F07119f18BcdA102A2fcF9cf5D20739e0"; 
});

// 2. MetaMask-ga ulanish
async function connectWallet() {
    if (window.ethereum) {
        try {
            addLog("MetaMask-ga ulanish so'ralmoqda...");
            
            // Web3 obyektini yaratish
            web3 = new Web3(window.ethereum);
            
            // Foydalanuvchidan ruxsat so'rash
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];
            
            walletAddressDiv.textContent = userAccount;
            walletAddressDiv.style.color = 'var(--success)';
            connectBtn.textContent = "Ulangan";
            connectBtn.classList.replace('btn-outline', 'btn-secondary');
            
            addLog(`Muvaffaqiyatli ulandi! Hamyon: ${userAccount}`, 'success');

            // Tarmoq o'zgarsa yoki akkaunt o'zgarsa
            window.ethereum.on('accountsChanged', (acts) => {
                userAccount = acts[0];
                walletAddressDiv.textContent = userAccount;
                addLog('Akkaunt o\'zgartirildi: ' + userAccount);
            });

        } catch (error) {
            addLog('Ulanish rad etildi yoki xatolik: ' + error.message, 'error');
        }
    } else {
        addLog('MetaMask topilmadi. Iltimos MetaMask o\'rnating!', 'error');
        alert('MetaMask topilmadi!');
    }
}

// Kontrakt obyektini yaratish funksiyasi
function getContract() {
    const address = document.getElementById('contractAddress').value.trim();
    if (!web3) {
        throw new Error("Oldin MetaMask-ga ulaning!");
    }
    if (!address) {
        throw new Error("Kontrakt adresini kiriting!");
    }
    if (!contractABI) {
        throw new Error("ABI yuklanmagan!");
    }
    
    // contract obyektini yaratish
    return new web3.eth.Contract(contractABI, address);
}

// 3. View funksiyani chaqirish (O'qish)
async function readContract() {
    try {
        readResultDiv.textContent = 'Yuklanmoqda...';
        const contract = getContract();
        
        addLog("Kontraktdan ma'lumot o'qish (call) boshlandi...");
        
        // view metodni chaqirish (get)
        const result = await contract.methods.get().call();
        
        readResultDiv.textContent = result.toString();
        addLog(`O'qish muvaffaqiyatli! Natija: ${result}`, 'success');
        
    } catch (error) {
        readResultDiv.textContent = 'Xatolik yuz berdi';
        addLog('O\'qishda xatolik (Error handling): ' + error.message, 'error');
    }
}

// 4. Send tranzaksiyasi (Yozish)
async function writeContract() {
    try {
        const contract = getContract();
        const value = document.getElementById('newValue').value;
        const gasLimit = document.getElementById('gasLimit').value;
        const gasPriceGwei = document.getElementById('gasPrice').value;
        
        if (!value) throw new Error("Yangi qiymatni kiriting!");
        
        // Gwei ni wei ga o'tkazish
        const gasPriceWei = web3.utils.toWei(gasPriceGwei.toString(), 'gwei');

        addLog(`Tranzaksiya tayyorlanmoqda... (Qiymat: ${value})`);
        addLog(`* Gas Limit: ${gasLimit}`);
        addLog(`* Gas Price: ${gasPriceGwei} gwei`);
        
        // send metodini chaqirish
        const tx = await contract.methods.set(value).send({
            from: userAccount,
            gas: gasLimit,
            gasPrice: gasPriceWei
        });
        
        addLog(`Tranzaksiya muvaffaqiyatli tasdiqlandi! Tx Hash: ${tx.transactionHash}`, 'success');
        
        // Yangilanganini ko'rish uchun o'qishni ishga tushirish
        readContract();

    } catch (error) {
        // Foydalanuvchiga xatolikni chiqarish mexanizmi
        if(error.code === 4001) {
            addLog("Foydalanuvchi tranzaksiyani bekor qildi (User Rejected).", 'error');
        } else {
            addLog("Tranzaksiyani yuborishda xatolik: " + error.message, 'error');
        }
    }
}
