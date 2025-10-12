import multer from 'multer';
import path from 'path';

// Configure storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Files will be saved in the 'public/uploads' directory.
    // Make sure this directory exists.
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    // Create a unique filename to prevent overwrites
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Initialize multer with the storage configuration
const upload = multer({ storage: storage });

/**
 * Controller to handle single file upload.
 * It uses multer middleware to process the 'photo' field from the form data.
 */
export const uploadSingleFile = (req, res) => {
  // The 'upload.single('photo')' middleware should be applied on the route.
  // If the middleware runs successfully, the file is available at req.file.
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  // Construct the URL to access the file
  // This assumes your server serves static files from the 'public' directory.
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  // Send back the URL of the uploaded file
  res.status(200).json({
    message: 'File uploaded successfully',
    url: fileUrl
  });
};

export const multerUpload = upload;