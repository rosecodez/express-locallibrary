const asyncHandler = require('express-async-handler');
const Author = require('../models/author');
const Book = require('../models/book');

// Display list of all Authors.
exports.author_list = asyncHandler(async (req, res, next) => {
  try {
    // Retrieve all authors
    const allAuthors = await Author.find().sort({ family_name: 1 }).exec();

    // Log the data for each author
    allAuthors.forEach((author) => {
      console.log(`Author: ${author.name}, Date of Birth: ${author.date_of_birth}, Date of Death: ${author.date_of_death}`);
    });

    // Render the view with the author list
    res.render('author_list', {
      title: 'Author List',
      author_list: allAuthors,
    });
  } catch (err) {
    // Handle any errors
    console.error('Error fetching author list:', err);
    next(err);
  }
});

// Display detail page for a specific Author.
exports.author_detail = asyncHandler(async (req, res, next) => {
  // Get details of author and all their books (in parallel)
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, 'title summary').exec(),
  ]);

  if (author === null) {
    // No results.
    const err = new Error('Author not found');
    err.status = 404;
    return next(err);
  }

  res.render('author_detail', {
    title: 'Author Detail',
    author,
    author_books: allBooksByAuthor,
  });
});

// Display Author create form on GET.
exports.author_create_get = asyncHandler(async (req, res, next) => {
  res.send('NOT IMPLEMENTED: Author create GET');
});

// Handle Author create on POST.
exports.author_create_post = asyncHandler(async (req, res, next) => {
  res.send('NOT IMPLEMENTED: Author create POST');
});

// Display Author delete form on GET.
exports.author_delete_get = asyncHandler(async (req, res, next) => {
  res.send('NOT IMPLEMENTED: Author delete GET');
});

// Handle Author delete on POST.
exports.author_delete_post = asyncHandler(async (req, res, next) => {
  res.send('NOT IMPLEMENTED: Author delete POST');
});

// Display Author update form on GET.
exports.author_update_get = asyncHandler(async (req, res, next) => {
  res.send('NOT IMPLEMENTED: Author update GET');
});

// Handle Author update on POST.
exports.author_update_post = asyncHandler(async (req, res, next) => {
  res.send('NOT IMPLEMENTED: Author update POST');
});
