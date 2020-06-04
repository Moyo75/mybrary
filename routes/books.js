const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

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
    // res.redirect(`books/${newBook.id}`)
    res.redirect(`books`);
  } catch {
    renderNewPage(res, book, true);
  }
});

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

// save cover
function saveCover(book, coverEncoded) {
  if (coverEncoded == null) return;
  const cover = JSON.parse(coverEncoded);
  if (cover != null && imageMimeTypes.includes(cover.type)) {
    book.coverImage = new Buffer.from(cover.data, 'base64');
    book.coverImageType = cover.type;

    console.log(`book.coverImage: ${book.coverImage}`);
    console.log(`book.coverImageType: ${book.coverImageType}`);
  }
}

module.exports = router;
