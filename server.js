if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
  }

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt')
const morgan = require('morgan');
const cors = require('cors');
const flash = require('express-flash')
const passport = require('passport');
const session = require('express-session');
const methodOverride = require('method-override')
const { readData, writeData } = require('./data');
const users = require('./users'); 


const app = express();
const port = 3000;

const initializePassport = require('./passport-config')
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)

// view engine setup
app.set('view engine', 'ejs');

// middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev')); // logging
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());

app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name: req.user.name })
  })
  
  app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
  })
  
  app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  }))
  
  app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs')
  })
  
  app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      users.push({
        id: Date.now().toString(),
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
      })
      res.redirect('/login')
    } catch {
      res.redirect('/register')
    }
  })
  
  app.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('/login')
  })
  
  function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
  
    res.redirect('/login')
  }
  
  function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/')
    }
    next()
  }

app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.post('/books', (req, res) => {
    const data = readData();
    const newBook = req.body;
    newBook.id = data.books.length;
    data.books.push(newBook);
    writeData(data);
    res.send(newBook);
});

app.get('/books', (req, res) => {
    const data = readData();
    let { author, sortBy, page, pageSize } = req.query;
    let books = [...data.books];

    if (author) {
        books = books.filter(book => book.author.toLowerCase() === author.toLowerCase());
    }

    if (sortBy) {
        if (sortBy === 'title') {
            books.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortBy === 'year') {
            books.sort((a, b) => a.year - b.year);
        }
    }

    if (page && pageSize) {
        page = parseInt(page, 10);
        pageSize = parseInt(pageSize, 10);
        const start = (page - 1) * pageSize;
        books = books.slice(start, start + pageSize);
    }

    res.send(books);
});

app.get('/books/:id', (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id, 10);
    const book = data.books[id];
    if (book) {
        res.send(book);
    } else {
        res.status(404).send({ message: 'Book not found' });
    }
});

app.put('/books/:id', (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id, 10);
    const updatedBook = req.body;
    if (id >= 0 && id < data.books.length) {
        updatedBook.id = id;
        data.books[id] = updatedBook;
        writeData(data);
        res.send(updatedBook);
    } else {
        res.status(404).send({ message: 'Book not found' });
    }
});

app.delete('/books/:id', (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id, 10);
    if (id >= 0 && id < data.books.length) {
        const deletedBook = data.books.splice(id, 1)[0];
        writeData(data);
        res.send(deletedBook);
    } else {
        res.status(404).send({ message: 'Book not found' });
    }
});

app.use((req, res, next) => {
    res.status(404).send({ message: 'Route not found' });
});

// app.use((err, req, res, next) => {
//     console.error(err);
//     res.status(500).send({ message: 'Server error' });
// });

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
});
