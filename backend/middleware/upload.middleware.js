const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = path.join(__dirname, '../uploads');
    if (file.fieldname === 'logo') uploadPath = path.join(uploadPath, 'logos');
    else if (file.fieldname === 'template') uploadPath = path.join(uploadPath, 'templates');
    else if (file.fieldname === 'attachment') uploadPath = path.join(uploadPath, 'attachments');
    else if (file.fieldname === 'poDocument') uploadPath = path.join(uploadPath, 'po-docs');
    else if (file.fieldname === 'excel') uploadPath = path.join(uploadPath, 'excel');
    else uploadPath = path.join(uploadPath, 'misc');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    logo: ['image/jpeg', 'image/png', 'image/webp'],
    template: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf'],
    attachment: ['image/jpeg', 'image/png', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    poDocument: ['image/jpeg', 'image/png', 'application/pdf'],
    excel: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'],
  };

  const allowed = allowedTypes[file.fieldname] || ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error(`File type not allowed for ${file.fieldname}`), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = upload;
