// ======================================================================
// GOOGLE APPS SCRIPT - HBD TO YOU DATABASE
// ======================================================================
// 
// CARA INSTALL / DEPLOY:
// 1. Buka browser dan pergi ke: https://script.google.com/
// 2. Klik tombol "New project" (Proyek baru).
// 3. Hapus semua kode bawaan yang ada di editor, lalu PASTE semua kode dari file ini ke sana.
// 4. (Opsional) Jika Anda ingin menyimpan file di folder spesifik, isi ID folder Google Drive
//    Anda di variabel FOLDER_ID di bawah ini. Jika dikosongkan (""), file akan disimpan di
//    halaman utama (My Drive).
// 5. Simpan proyek dengan menekan ikon Disket atau Ctrl+S. Beri nama proyek bebas (contoh: "HBD Database").
// 6. Di pojok kanan atas, klik tombol biru "Deploy" -> Pilih "New deployment".
// 7. Pada ikon gear (Select type), centang "Web app".
// 8. Isi deskripsi (bebas, misal: "V1").
// 9. Pada "Execute as", pilih "Me" (email Anda).
// 10. PENTING! Pada "Who has access", ubah menjadi "Anyone" (Siapa saja).
// 11. Klik "Deploy". 
// 12. Google akan meminta otorisasi akun. Klik "Authorize access", pilih akun Google Anda,
//     lalu jika muncul peringatan "Google hasn't verified this app", klik "Advanced" (Lanjutan)
//     dan pilih "Go to ... (unsafe)". Izinkan semua akses (Google Drive dan Spreadsheet).
// 13. Setelah selesai, Anda akan mendapatkan URL Web App (berupa link panjang https://script.google.com/macros/s/.../exec).
// 14. COPY URL tersebut.
// 15. Buka file interactions.js di VSCode Anda, cari bagian atas file:
//     const GAS_URL = "ISI_URL_WEB_APP_DISINI";
// 16. Ganti teks "ISI_URL_WEB_APP_DISINI" dengan URL yang baru saja Anda copy. Selesai!
// ======================================================================

const FOLDER_ID = "1_8nV-JuPPG8WR0d3DMQQIS8zTm0bCw-W"; // Folder HBD

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // ================== HANDLE QUIZ ==================
    if (data.type === 'quiz') {
      const sheetName = "Hasil Quiz HBD";
      let spreadsheet;
      
      // Cari apakah spreadsheet sudah ada
      const files = DriveApp.getFilesByName(sheetName);
      if (files.hasNext()) {
        spreadsheet = SpreadsheetApp.open(files.next());
      } else {
        // Buat baru jika belum ada
        spreadsheet = SpreadsheetApp.create(sheetName);
        spreadsheet.getActiveSheet().appendRow(["Waktu", "Skor", "Detail Jawaban"]);
        
        // Pindahkan ke folder jika FOLDER_ID diisi
        if (FOLDER_ID) {
          const folder = DriveApp.getFolderById(FOLDER_ID);
          const file = DriveApp.getFileById(spreadsheet.getId());
          file.moveTo(folder);
        }
      }
      
      const sheet = spreadsheet.getActiveSheet();
      let answerText = "";
      data.answers.forEach(function(a, i) {
        answerText += (i+1) + ". " + a.question + "\n   Jawaban: " + a.chosen + (a.isCorrect ? " (✅)" : " (❌)") + "\n\n";
      });
      
      // Masukkan baris baru
      sheet.appendRow([data.timestamp, data.score, answerText]);
      
      return ContentService.createTextOutput(JSON.stringify({status: "success"}))
        .setMimeType(ContentService.MimeType.JSON);
    } 
    
    // ================== HANDLE LOVE MESSAGE ==================
    else if (data.type === 'love_message') {
      const sheetName = "Pesan Cinta HBD";
      let spreadsheet;
      
      const files = DriveApp.getFilesByName(sheetName);
      if (files.hasNext()) {
        spreadsheet = SpreadsheetApp.open(files.next());
      } else {
        spreadsheet = SpreadsheetApp.create(sheetName);
        spreadsheet.getActiveSheet().appendRow(["Waktu", "Pesan"]);
        
        if (FOLDER_ID) {
          const folder = DriveApp.getFolderById(FOLDER_ID);
          const file = DriveApp.getFileById(spreadsheet.getId());
          file.moveTo(folder);
        }
      }
      
      spreadsheet.getActiveSheet().appendRow([data.timestamp, data.message]);
      return ContentService.createTextOutput(JSON.stringify({status: "success"}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // ================== HANDLE VOICE & PHOTO ==================
    else if (data.type === 'voice' || data.type === 'photo') {
      // Decode Base64 menjadi file aslinya
      const byteCharacters = Utilities.base64Decode(data.data);
      const blob = Utilities.newBlob(byteCharacters, data.mimeType, data.filename);
      let file;
      
      if (FOLDER_ID) {
        const folder = DriveApp.getFolderById(FOLDER_ID);
        file = folder.createFile(blob);
      } else {
        file = DriveApp.createFile(blob);
      }
      
      return ContentService.createTextOutput(JSON.stringify({status: "success", url: file.getUrl()}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (err) {
    // Tangkap error jika ada kesalahan parsing atau penyimpanan
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Opsional: Untuk mengecek apakah link aktif (saat dibuka di browser)
function doGet(e) {
  return ContentService.createTextOutput("Web App Aktif! Menerima POST request.");
}
