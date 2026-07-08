// Konfigurasi Waktu Looping
var BATCH_TIME = 5.5 * 60 * 1000; // Skrip berjalan selama 5,5 Menit
var JEDA_WAKTU = 1 * 60 * 1000;   // Jeda 1 Menit sebelum eksekusi selanjutnya

// FUNGSI UTAMA (JALANKAN FUNGSI INI PERTAMA KALI)
function mulaiProsesSistematis() {
  // Bersihkan pengaturan dan trigger sisa dari eksekusi sebelumnya
  bersihkanSemuaTrigger();
  PropertiesService.getUserProperties().deleteAllProperties();
  
  Logger.log("Memulai proses sistematis Drive...");
  prosesSebagian(); // Mulai siklus pertama
}

// FUNGSI SIKLUS (JANGAN DIJALANKAN MANUAL)
function prosesSebagian() {
  var startTime = Date.now();
  var props = PropertiesService.getUserProperties();
  
  // 1. Inisialisasi Folder Induk
  var root = DriveApp.getRootFolder();
  var folderLuar = dapatkanAtauBuatFolder(root, "File Dari Luar");
  var folderGoogle = dapatkanAtauBuatFolder(root, "File Format Google");
  
  // 2. Inisialisasi/Buka Spreadsheet Mapping
  var ssId = props.getProperty("SPREADSHEET_ID");
  var sheet;
  if (!ssId) {
    var ss = SpreadsheetApp.create("Mapping File Drive - Hasil Rapih");
    sheet = ss.getActiveSheet();
    sheet.appendRow(["Nama File", "Ukuran File (Bytes)", "Path (Lokasi Asli)", "URL File", "Status Kepemilikan", "Tindakan Sistem"]);
    props.setProperty("SPREADSHEET_ID", ss.getId());
  } else {
    sheet = SpreadsheetApp.openById(ssId).getActiveSheet();
  }
  
  var emailSaya = Session.getActiveUser().getEmail();
  var tokenOAuth = ScriptApp.getOAuthToken();
  
  // 3. Sistem Melanjutkan dari Titik Terakhir (Continuation Token)
  var fileToken = props.getProperty("FILE_TOKEN");
  var files = fileToken ? DriveApp.continueFileIterator(fileToken) : DriveApp.getFiles();
  
  while (files.hasNext()) {
    // --- PENGECEKAN BATAS WAKTU (LOOPING) ---
    if (Date.now() - startTime > BATCH_TIME) {
      // Simpan titik terakhir dan buat jadwal untuk 1 menit ke depan
      props.setProperty("FILE_TOKEN", files.getContinuationToken());
      ScriptApp.newTrigger("prosesSebagian").timeBased().after(JEDA_WAKTU).create();
      Logger.log("Batas waktu eksekusi tercapai. Berhenti sejenak dan akan dilanjutkan dalam 1 menit...");
      return; 
    }
    
    var file = files.next();
    var name = file.getName();
    var size = file.getSize();
    var url = file.getUrl();
    var id = file.getId();
    var mimeType = file.getMimeType();
    
    // Cek kepemilikan file
    var ownerEmail = "";
    try { ownerEmail = file.getOwner() ? file.getOwner().getEmail() : "Tidak Diketahui"; } catch(e) { ownerEmail = "Luar/Sistem"; }
    var isMine = (ownerEmail === emailSaya);
    
    // Hindari memproses spreadsheet mapping ini sendiri atau folder target
    if (name === "Mapping File Drive - Hasil Rapih" || name === "File Dari Luar" || name === "File Format Google") continue;
    
    var pathAsli = dapatkanPathFile(file);
    
    // Klasifikasi Tipe File
    var formatWeb = isFormatWeb(mimeType);
    var formatDokumenBiasa = isFormatDokumenGoogle(mimeType);

    // --- LOGIKA PEMROSESAN FILE ---
    
    // KONDISI A: FORMAT WEB KHUSUS (Form, Sites, Maps, Vids)
    if (formatWeb) {
      try {
        file.moveTo(folderGoogle); // Langsung pindahkan
        sheet.appendRow([name, size, pathAsli, url, isMine ? "Pribadi" : "Dibagikan Ke Saya", "Dipindahkan langsung ke 'File Format Google'"]);
      } catch(e) {
        // Jika Google menolak memindahkan karena file milik orang lain, buatkan Shortcut
        var shortcut = DriveApp.createShortcut(id);
        shortcut.moveTo(folderGoogle);
        sheet.appendRow([name, size, pathAsli, url, "Dibagikan Ke Saya", "Dibuatkan Shortcut di 'File Format Google' (Aturan Izin Google)"]);
      }
    } 
    // KONDISI B: BUKAN FORMAT WEB & DIBAGIKAN KE SAYA (Luar)
    else if (!isMine) {
      if (formatDokumenBiasa) {
        prosesDanKonversiFileLuar(file, folderLuar, mimeType, id, name, tokenOAuth);
        sheet.appendRow([name, size, pathAsli, url, "Dibagikan Ke Saya", "Dikonversi ke 'File Dari Luar' & Dibiarkan di Shared with me"]);
      } else {
        // File PDF, Gambar, dll dari luar
        file.makeCopy(name, folderLuar);
        sheet.appendRow([name, size, pathAsli, url, "Dibagikan Ke Saya", "Disalin ke 'File Dari Luar' & Dibiarkan di Shared with me"]);
      }
    } 
    // KONDISI C: BUKAN FORMAT WEB & MILIK PRIBADI
    else if (isMine) {
      if (formatDokumenBiasa) {
        file.moveTo(folderGoogle);
        sheet.appendRow([name, size, pathAsli, url, "Pribadi (Format Google)", "Dipindahkan ke 'File Format Google'"]);
      } else {
        sheet.appendRow([name, size, pathAsli, url, "Pribadi (Non-Google)", "Dibiarkan di tempat"]);
      }
    }
  }
  
  // 4. JIKA SEMUA FILE SELESAI DIPROSES
  bersihkanSemuaTrigger();
  props.deleteAllProperties();
  Logger.log("Semua proses selesai dengan tuntas! Mapping dapat dilihat di Spreadsheet Anda.");
}

// --- FUNGSI-FUNGSI PENDUKUNG ---

function bersihkanSemuaTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
}

function dapatkanAtauBuatFolder(parentFolder, namaFolder) {
  var folders = parentFolder.getFoldersByName(namaFolder);
  if (folders.hasNext()) return folders.next();
  return parentFolder.createFolder(namaFolder);
}

function dapatkanPathFile(file) {
  var path = [];
  var parents = file.getParents();
  while (parents.hasNext()) {
    var parent = parents.next();
    path.unshift(parent.getName());
    parents = parent.getParents();
  }
  return path.length > 0 ? "Root/" + path.join("/") : "Tidak diketahui (Shared/Shortcut)";
}

// Deteksi Google Forms, Sites, Maps, Vids
function isFormatWeb(mimeType) {
  var webMimes = [
    "application/vnd.google-apps.form",
    "application/vnd.google-apps.site",
    "application/vnd.google-apps.map",
    "application/vnd.google-apps.vid"
  ];
  return webMimes.indexOf(mimeType) > -1;
}

// Deteksi Docs, Sheets, Slides, Drawings (Bisa dikonversi)
function isFormatDokumenGoogle(mimeType) {
  var docMimes = [MimeType.GOOGLE_DOCS, MimeType.GOOGLE_SHEETS, MimeType.GOOGLE_SLIDES, MimeType.GOOGLE_DRAWINGS];
  return docMimes.indexOf(mimeType) > -1;
}

function prosesDanKonversiFileLuar(file, targetFolder, mimeType, id, name, token) {
  try {
    var url, ext;
    if (mimeType === MimeType.GOOGLE_DOCS) {
      url = "https://docs.google.com/feeds/download/documents/export/Export?id=" + id + "&exportFormat=docx"; ext = ".docx";
    } else if (mimeType === MimeType.GOOGLE_SHEETS) {
      url = "https://docs.google.com/spreadsheets/d/" + id + "/export?format=xlsx"; ext = ".xlsx";
    } else if (mimeType === MimeType.GOOGLE_SLIDES) {
      url = "https://docs.google.com/presentation/d/" + id + "/export/pptx"; ext = ".pptx";
    } else if (mimeType === MimeType.GOOGLE_DRAWINGS) {
      url = "https://docs.google.com/drawings/d/" + id + "/export/png"; ext = ".png";
    }
    var response = UrlFetchApp.fetch(url, {headers: {Authorization: "Bearer " + token}});
    targetFolder.createFile(response.getBlob().setName(name + ext));
  } catch(e) {
    Logger.log("Gagal konversi " + name + ". Mencoba salin langsung.");
    try { file.makeCopy(name, targetFolder); } catch(err) {}
  }
}
