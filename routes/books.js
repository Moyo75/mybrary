const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Book = require('../models/book');
const Author = require('../models/author');
const uploadPath = path.join('public', Book.coverImageBasePath);
// const imageMimeTypes = ['images/jpeg', 'images/png', 'images/jpg'];

// Disk storage
const storage = multer.diskStorage({
  destination: uploadPath,
  filename: (req, file, callback) => {
    callback(
      null,
      file.fieldname + '-' + Date.now() + '-' + path.extname(file.originalname)
    );
  },
});

// Init upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 100000 },
  fileFilter: (req, file, callback) => {
    checkFileType(file, callback);
  },
}).single('cover');

// All books route
router.get('/', async (req, res) => {
  // res.send('All Books');
  let query = Book.find();
  if (req.query.title && req.query.title != '') {
    query = query.regex('title', new RegExp(req.query.title, 'i'));
  }
  if (req.query.publishedBefore && req.query.publishedBefore != '') {
    query = query.lte('publishedDate', req.query.publishedBefore);
  }
  if (req.query.publishedAfter && req.query.publishedAfter != '') {
    query = query.gte('publishedDate', req.query.publishedAfter);
  }
  try {
    const books = await query.exec();
    // console.log(req.query);
    res.render('books/index', { books: books, searchOptions: req.query });
  } catch {
    res.redirect('/');
  }
});

// New book route
router.get('/new', async (req, res) => {
  // res.send('New Book');
  renderNewPage(res, new Book());
});

// Create book route
router.post('/', (req, res) => {
  // res.send('Create Book');

  upload(req, res, async (error) => {
    if (error) {
      res.render('', { errorMessage: error });
    } else {
      console.log('req.file: ', req.file);
      console.log('req.body: ', req.body);
      // console.log('req.body: ', req.body);

      if (!req.file) {
        res.render('', { errorMessage: 'Error: No file selected' });
      } else {
        const fileName = req.file.filename;
        // res.render('books', {
        //   errorMessage: 'File uploaded',
        //   file: `${uploadPath}/${req.file.filename}`,
        // });

        const book = new Book({
          title: req.body.title,
          description: req.body.description,
          publishedDate: new Date(req.body.publishedDate),
          pageCount: req.body.pageCount,
          createdAt: req.body.createdAt,
          coverImageName: fileName,
          author: req.body.author,
        });

        try {
          const newBook = await book.save();
          // res.redirect(`books/${newBook.id}`)
          res.redirect(`books`);
        } catch {
          if (book.coverImageName != null) {
            removeBookCover(book.coverImageName);
          }
          renderNewPage(res, book, true);
        }
      }
    }
  });
});

function removeBookCover(fileName) {
  fs.unlink(path.join(uploadPath, fileName), (error) => {
    if (error) console.log(error);
  });
}

async function renderNewPage(res, book, hasError = false) {
  try {
    const authors = await Author.find({});
    const params = {
      authors: authors,
      book: book,
    };
    if (hasError) params.errorMessage = 'Error creating book';
    res.render('books/new', params);
  } catch {
    res.redirect('/books');
  }
}

// check file type
function checkFileType(file, callback) {
  const filetypes = /jpeg|jpg|png|jfif/;

  const extname = filetypes.test(file.originalname);
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return callback(null, true);
  } else {
    callback('Error: Images only');
  }
}

module.exports = router;
