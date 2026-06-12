// ==========================================
// CENTRAL DATA PLATFORM (STATE SIMULATION)
// ==========================================
let lowonganKerja = [
    { id: 201, title: "Penjaga Stand Salad Jelly", umkm: "Salad Corner", category: "Kuliner", salary: 1000000, desc: "Menjaga booth penjualan es salad sore hari di wilayah kampus." },
    { id: 202, title: "Content Delivery Admin", umkm: "Batik Digital Agency", category: "Digital", salary: 750000, desc: "Mengunggah video promosi UMKM berkala via smartphone." }
];

let lamaranMahasiswa = [];
let pelamarMasukUmkm = [];
let currentUser = null;

// Skenario Default Paket UMKM (Aturan baru: bayar 50k dapat 5 kuota)
let umkmPackage = { status: "Belum Aktif", quota: 0 };

function formatRupiah(angka) {
    return "Rp " + angka.toLocaleString('id-ID');
}

// ==========================================
// USER GATEWAY AUTHENTICATION
// ==========================================
function switchAuthTab(type) {
    const formLogin = document.getElementById('loginForm');
    const formReg = document.getElementById('registerForm');
    const tabLogin = document.getElementById('tabLogin');
    const tabReg = document.getElementById('tabRegister');
    if (type === 'login') {
        formLogin.classList.remove('hidden'); formReg.classList.add('hidden');
        tabLogin.classList.add('active'); tabReg.classList.remove('active');
    } else {
        formLogin.classList.add('hidden'); formReg.classList.remove('hidden');
        tabLogin.classList.remove('active'); tabReg.classList.add('active');
    }
}

document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    alert("Akun Bebas berhasil terdaftar! Silakan pindah ke tab Masuk.");
    switchAuthTab('login');
    document.getElementById('registerForm').reset();
});

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const role = document.getElementById('loginRole').value;
    
    currentUser = { name: email.split('@')[0].toUpperCase(), email: email, role: role };
    
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    document.getElementById('txtUserGreeting').innerText = `Halo, ${currentUser.name} (${role.toUpperCase()})`;
    
    setupDashboardPeran();
});

function logout() {
    currentUser = null;
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('authPage').classList.remove('hidden');
}
// ==========================================
// CORE LAYOUT MANIPULATION
// ==========================================
function setupDashboardPeran() {
    if (currentUser.role === 'mahasiswa') {
        document.getElementById('viewMahasiswa').classList.remove('hidden');
        document.getElementById('viewUmkm').classList.add('hidden');
        
        document.getElementById('mhsProfName').innerText = currentUser.name;
        document.getElementById('mhsProfEmail').innerText = currentUser.email;
        
        renderDaftarKerjaMahasiswa(lowonganKerja);
        renderTabelKomisiMahasiswa();
    } else {
        document.getElementById('viewMahasiswa').classList.add('hidden');
        document.getElementById('viewUmkm').classList.remove('hidden');
        
        document.getElementById('umkmProfName').innerText = currentUser.name;
        document.getElementById('umkmProfEmail').innerText = currentUser.email;
        
        updateUmkmQuotaUI();
        renderDaftarPelamarUmkm();
    }
}

// ==========================================
// MAHASISWA LOGIC & UPLOAD VALIDATION PDF
// ==========================================
function renderDaftarKerjaMahasiswa(data) {
    const grid = document.getElementById('jobGridMahasiswa'); grid.innerHTML = '';
    data.forEach(job => {
        grid.innerHTML += `
            <div class="job-card">
                <div>
                    <span class="job-badge">${job.category}</span>
                    <h3 style="margin-top:4px;">${job.title}</h3>
                    <div class="umkm-name">🏢 UMKM: ${job.umkm}</div>
                    <div class="salary">${formatRupiah(job.salary)}</div>
                    <p style="font-size:12px; color:#475569;">${job.desc}</p>
                </div>
                <button class="btn btn-primary btn-block" style="margin-top:12px;" onclick="openApplyModal(${job.id})">Lamar Kerja</button>
            </div>`;
    });
}

function openApplyModal(id) {
    document.getElementById('applyModal').classList.remove('hidden');
    document.getElementById('modalJobId').value = id;
    document.getElementById('fileError').style.display = 'none';
}

function closeModal() { document.getElementById('applyModal').classList.add('hidden'); document.getElementById('applyForm').reset(); }

document.getElementById('applyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const jId = parseInt(document.getElementById('modalJobId').value);
    const targetJob = lowonganKerja.find(x => x.id === jId);
    
    const fileInput = document.getElementById('applicantCv');
    const major = document.getElementById('applicantMajor').value;
    const phone = document.getElementById('applicantContact').value;

    // VALIDASI UKURAN FILE CLIENT-SIDE MAKSIMAL 2MB (2.097.152 Bytes)
    if (fileInput.files.length > 0) {
        const sizeInBytes = fileInput.files[0].size;
        if (sizeInBytes > 2097152) {
            document.getElementById('fileError').style.display = 'block';
            return; // Menghentikan eksekusi jika melebihi 2MB
        }
    }

    const fileName = fileInput.files[0].name;
    const komisiPotong = targetJob.salary * 0.05; // 5% komisi aturan baru
    const gajiBersih = targetJob.salary - komisiPotong;

    // Simpan Data State Sementara
    lamaranMahasiswa.unshift({ title: targetJob.title, umkm: targetJob.umkm, salaryGros: targetJob.salary, status: "Diterima" });
    pelamarMasukUmkm.unshift({ jobTitle: targetJob.title, applicantName: currentUser.name, applicantMajor: major, contact: phone, cvName: fileName });

    // TRIGGER NOTIFIKASI INFO POTONGAN GAJI VIA EMAIL OTOMATIS
    document.getElementById('emailNotificationBox').classList.remove('hidden');
    document.getElementById('emailNotificationContent').innerHTML = `
        Halo <strong>${currentUser.name}</strong>,<br><br>
        Kami informasikan bahwa Anda telah diterima di <strong>${targetJob.umkm}</strong> pada posisi <strong>${targetJob.title}</strong>.<br>
        Sesuai regulasi split payment, gaji pertama Anda sebesar <strong>${formatRupiah(targetJob.salary)}</strong> dikenakan 
        potongan administrasi web otomatis 5% senilai <strong>${formatRupiah(komisiPotong)}</strong>.<br>
        Total sisa bersih kompensasi pertama Anda adalah <strong>${formatRupiah(gajiBersih)}</strong>.<br>
        <em>*Potongan 5% ini hanya berlaku di awal masuk kerja saja untuk UMKM yang sama.</em>
    `;

    alert("Pendaftaran Berhasil! Berkas CV PDF Anda berhasil diunggah.");
    closeModal();
    renderTabelKomisiMahasiswa();
});

function closeEmailAlert() { document.getElementById('emailNotificationBox').classList.add('hidden'); }

function renderTabelKomisiMahasiswa() {
    const tbody = document.getElementById('applicationStatusTable'); tbody.innerHTML = '';
    if(lamaranMahasiswa.length === 0){
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b;">Belum ada riwayat lamaran kerja.</td></tr>`; return;
    }
    lamaranMahasiswa.forEach(app => {
        const pot = app.salaryGros * 0.05;
        tbody.innerHTML += `
            <tr>
                <td><strong>${app.title}</strong></td>
                <td>${app.umkm}</td>
                <td>${formatRupiah(app.salaryGros)}</td>
                <td style="color:#ef4444; font-weight:600;">-${formatRupiah(pot)} (5%)</td>
                <td style="color:#10b981; font-weight:bold;">${formatRupiah(app.salaryGros - pot)}</td>
                <td><span style="background:#dcfce7; color:#15803d; padding:2px 6px; border-radius:10px; font-weight:bold; font-size:12px;">${app.status}</span></td>
            </tr>`;
    });
}

// ==========================================
// UMKM MANAGEMENT & SUBSCRIPTION SYSTEM
// ==========================================
function simulasiAktivasiPaket() {
    const method = prompt("Pilih Metode Pembayaran Berlangganan:\nKetik 'DANA' atau 'BRI'").toUpperCase();
    if(method !== 'DANA' && method !== 'BRI') {
        alert("Pilihan metode tidak valid! Transaksi dibatalkan.");
        return;
    }

    let invoiceMsg = method === 'DANA' 
        ? "Silakan Transfer Rp 50.000 ke akun DANA: 087845135558 (a.n. Ita Wulandari)" 
        : "Silakan Transfer Rp 50.000 ke rekening BRI: 8067-0103-5259-533 (a.n. Masita Ayuni)";

    const konfirmasi = confirm(`${invoiceMsg}\n\nApakah Anda sudah menyelesaikan pembayaran?`);
    if(konfirmasi) {
        umkmPackage.status = "Aktif";
        umkmPackage.quota += 5; // Diberikan jatah 5x posting loker
        alert("Pembayaran Berhasil Diverifikasi! Anda mendapatkan kuota 5 kali posting lowongan.");
        updateUmkmQuotaUI();
    }
}

function updateUmkmQuotaUI() {
    const txt = document.getElementById('txtQuota');
    txt.innerText = `${umkmPackage.quota}x Posting`;
    txt.style.color = umkmPackage.quota > 0 ? "#10b981" : "#ef4444";
}

document.getElementById('jobForm').addEventListener('submit', function(e) {
    e.preventDefault();
    if(umkmPackage.quota <= 0) {
        alert("Gagal Terbit! Kuota iklan Anda 0. Silakan beli paket Rp50.000 (5x Posting) di panel kiri terlebih dahulu.");
        return;
    }

    const title = document.getElementById('jobTitle').value;
    const cat = document.getElementById('jobCategory').value;
    const salary = parseInt(document.getElementById('jobSalaryNum').value);
    const desc = document.getElementById('jobDesc').value;

    lowonganKerja.unshift({ id: Date.now(), title: title, umkm: currentUser.name, category: cat, salary: salary, desc: desc });
    
    umkmPackage.quota -= 1; // Kurangi satu kuota terpakai
    alert(`Sukses! Menggunakan 1 Kuota Mitra. Sisa Kuota Iklan Anda: ${umkmPackage.quota}x`);
    
    document.getElementById('jobForm').reset();
    updateUmkmQuotaUI();
});

function renderDaftarPelamarUmkm() {
    const box = document.getElementById('umkmApplicants'); box.innerHTML = '';
    if(pelamarMasukUmkm.length === 0){
        box.innerHTML = '<p style="color:#64748b; font-size:14px;">Belum ada berkas pendaftaran pekerja yang masuk.</p>'; return;
    }
    pelamarMasukUmkm.forEach(p => {
        box.innerHTML += `
            <div class="applicant-card">
                <div>
                    <h4 style="color:#3b82f6;">${p.applicantName}</h4>
                    <p style="font-size:13px; color:#334155;">Jurusan: ${p.applicantMajor} | Posisi: <strong>${p.jobTitle}</strong></p>
                    <p style="font-size:12px; color:#10b981;">📄 Lampiran Dokumen: <u>${p.cvName}</u> (Maksimal 2MB Checked)</p>
                </div>
                <a href="https://wa.me/${p.contact}" target="_blank" class="btn btn-secondary" style="font-size:12px; text-decoration:none;">Hubungi via WA</a>
            </div>`;
    });
}

function filterLowongan() {
    const sTerm = document.getElementById('searchJob').value.toLowerCase();
    const cat = document.getElementById('filterCategory').value;
    const filtered = lowonganKerja.filter(j => {
        const matchSearch = j.title.toLowerCase().includes(sTerm) || j.umkm.toLowerCase().includes(sTerm);
        const matchCat = (cat === 'Semua') || (j.category === cat);
        return matchSearch && matchCat;
    });
    renderDaftarKerjaMahasiswa(filtered);
}
// Global State tambahan untuk menyimpan nama file CV Mahasiswa yang login
let namaCvTersimpan = ""; 

// FUNGSI UNTUK MENANGANI UPLOAD CV DI PROFIL MAHASISWA
function handleProfileCvUpload() {
    const fileInput = document.getElementById('profileCvInput');
    const errorText = document.getElementById('profileFileError');
    const statusText = document.getElementById('cvStatusText');

    errorText.style.display = 'none';

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        
        // 1. Validasi Ekstensi Berkas (Wajib .pdf)
        if (file.type !== "application/pdf") {
            errorText.innerText = "*Gagal! Format file harus berupa PDF.";
            errorText.style.display = 'block';
            fileInput.value = ""; // Reset input
            return;
        }

        // 2. Validasi Ukuran Berkas Maksimal 2MB (2 * 1024 * 1024 Bytes)
        if (file.size > 2097152) {
            errorText.innerText = "*Gagal! Ukuran file PDF melebihi batas maksimal 2MB.";
            errorText.style.display = 'block';
            fileInput.value = ""; // Reset input
            return;
        }

        // Jika lolos validasi, simpan nama filenya ke sistem simulasi
        namaCvTersimpan = file.name;
        
        // Ubah tampilan badge status menjadi hijau (Berhasil)
        statusText.className = "badge-cv-status status-uploaded";
        statusText.innerHTML = `📄 ${file.name}`;
        
        alert("CV Utama Anda berhasil disimpan di profil sistem!");
    }
}

// Tambahkan pembersihan status CV saat mahasiswa logout
// Sisipkan kode ini di dalam fungsi logout() yang sudah kamu miliki sebelumnya:
function logout() {
    currentUser = null;
    namaCvTersimpan = ""; // Reset data CV saat keluar
    
    // Kembalikan ke tampilan default awal
    const statusText = document.getElementById('cvStatusText');
    if(statusText) {
        statusText.className = "badge-cv-status status-empty";
        statusText.innerText = "Belum Ada CV";
    }
    
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('authPage').classList.remove('hidden');
}