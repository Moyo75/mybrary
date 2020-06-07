const express = require('express');
const router = express.Router();
const path = require('path');

const Book = require('../models/book');
const Author = require('../models/author');
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];

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
router.post('/', async (req, res) => {
  // res.send('Create Book');

  const book = new Book({
    title: req.body.title,
    description: req.body.description,
    publishedDate: new Date(req.body.publishedDate),
    pageCount: req.body.pageCount,
    createdAt: req.body.createdAt,
    author: req.body.author,
  });
  // console.log(req.body.cover);

  saveCover(book, req.body.cover);

  try {
    const newBook = await book.save();
    res.redirect(`books/${newBook.id}`);
  } catch {
    renderNewPage(res, book, true);
  }
});

// Book by id route
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('author').exec();
    res.render('books/show', { book: book });
  } catch {
    res.redirect('/');
  }
});

// Edit book route
router.get('/:id/edit', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    renderEditPage(res, book);
  } catch {
    res.redirect('/');
  }
});

// Update book route
router.put('/:id', async (req, res) => {
  let book;

  try {
    book = await Book.findById(req.params.id);
    book.title = req.body.title;
    book.author = req.body.author;
    book.publishedDate = new Date(req.body.publishedDate);
    book.title = req.body.title;
    book.pageCount = req.body.pageCount;
    book.description = req.body.description;

    if (req.body.cover != null && req.body.cover != '') {
      saveCover(book, req.body.cover);
    }
    await book.save();
    res.redirect(`/books/${book.id}`);
  } catch (error) {
    console.log(error);

    if (book != null) {
      renderEditPage(res, book, true);
    } else {
      res.redirect('/');
    }
  }
});

// Delete book route
router.delete('/:id', async (req, res) => {
  let book;
  try {
    book = await Book.findById(req.params.id);
    await book.remove();
    res.redirect('/books');
  } catch {
    if (book != null) {
      res.render(`/books/show`, {
        book: book,
        errorMessage: 'Could not delete book',
      });
    } else {
      res.redirect('/');
    }
  }
});

async function renderNewPage(res, book, hasError = false) {
  renderFormPage(res, book, 'new', hasError);
}

async function renderEditPage(res, book, hasError = false) {
  renderFormPage(res, book, 'edit', hasError);
}

async function renderFormPage(res, book, form, hasError = false) {
  try {
    const authors = await Author.find({});
    const params = {
      authors: authors,
      book: book,
    };
    if (hasError) {
      if (form === 'edit') {
        params.errorMessage = 'Error updating book';
      } else {
        params.errorMessage = 'Error creating book';
      }
    }
    res.render(`books/${form}`, params);
  } catch {
    res.redirect('/books');
  }
}

// save cover
function saveCover(book, coverEncoded) {
  if (coverEncoded == null) return;
  const cover = JSON.parse(coverEncoded);
  if (cover != null && imageMimeTypes.includes(cover.type)) {
    book.coverImage = new Buffer.from(cover.data, 'base64');
    book.coverImageType = cover.type;
  }
}

module.exports = router;
