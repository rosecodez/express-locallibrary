const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
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
exports.author_create_get = (req, res, next) => {
  res.render('author_form', { title: 'Create Author' });
};

// Handle Author create on POST.
exports.author_create_post = [
  // Validate and sanitize fields.
  body('first_name')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('First name must be specified.')
    .isAlphanumeric()
    .withMessage('First name has non-alphanumeric characters.'),
  body('family_name')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('Family name must be specified.')
    .isAlphanumeric()
    .withMessage('Family name has non-alphanumeric characters.'),
  body('date_of_birth', 'Invalid date of birth')
    .optional({ values: 'falsy' })
    .isISO8601()
    .toDate(),
  body('date_of_death', 'Invalid date of death')
    .optional({ values: 'falsy' })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create Author object with escaped and trimmed data
    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.render('author_form', {
        title: 'Create Author',
        author,
        errors: errors.array(),
      });
    } else {
      // Data from form is valid.

      // Save author.
      await author.save();
      // Redirect to new author record.
      res.redirect(author.url);
    }
  }),
];

// Display Author delete form on GET.
exports.author_delete_get = asyncHandler(async (req, res, next) => {
  // Get details of author and all their books (in parallel)
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, 'title summary').exec(),
  ]);
  // if there is no author in the database return to page
  if (author === null) {
    // No results.
    res.redirect('/catalog/authors');
  }

  res.render('author_delete', {
    title: 'Delete Author',
    author,
    author_books: allBooksByAuthor,
  });
});

// Handle Author delete on POST.
exports.author_delete_post = asyncHandler(async (req, res, next) => {
  // Get details of author and all their books (in parallel)
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, 'title summary').exec(),
  ]);

  if (allBooksByAuthor.length > 0) {
    // Author has books. Render in same way as for GET route.
    res.render('author_delete', {
      title: 'Delete Author',
      author,
      author_books: allBooksByAuthor,
    });
  } else {
    // Author has no books. Delete object and redirect to the list of authors.
    await Author.findByIdAndDelete(req.body.authorid);
    res.redirect('/catalog/authors');
  }
});

// Display Author update form on GET.
exports.author_update_get = asyncHandler(async (req, res, next) => {
  // Get details of author and all associated books (in parallel)
  const [author, booksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }).exec(),
  ]);

  if (author === null) {
    // No results.
    const err = new Error('Author not found');
    err.status = 404;
    return next(err);
  }

  res.render('author_form', {
    title: 'Update Author',
    author,
    author_books: booksByAuthor,
  });
});

// Handle Author update on POST.
exports.author_update_post = [
  // Validate and sanitize fields.
  body('first_name', 'First name must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('family_name', 'Family name must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601().toDate(),
  body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601().toDate(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create Author object with escaped and trimmed data (and the old id!)
    const author = new Author({
      _id: req.params.id, // This is required, or a new ID will be assigned!
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      const author_books = await Book.find({ author: req.params.id }).exec();
      res.render('author_form', {
        title: 'Update Author',
        author,
        author_books,
        errors: errors.array(),
      });
    } else {
      // Data from form is valid. Update the record.
      await Author.findByIdAndUpdate(req.params.id, author);
      // Redirect to author detail page.
      res.redirect(author.url);
    }
  }),
];
