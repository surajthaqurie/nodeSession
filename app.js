const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');

// For saving session in Mongodb
const mongoDBSession = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');

const mongoURI = 'mongodb://localhost:27017/sessions';

const TWO_HOURS = 1000 * 60 * 60 * 2;

// Mongodb Connection
mongoose
    .connect(mongoURI, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true
    })
    .then((res) => {
        console.log('MongoDB Connected');
    });

    // For saving Session in Mongodb
const store = new mongoDBSession({
    uri: mongoURI,
    collection: 'mySession' // collection name for Session
})
const {
    PORT = 3000,
    NODE_ENV = 'development',

    SESS_NAME = 'sid',
    SESS_SECRET = 'ssh!quite,it\1asecret!', // cookies secret key
    SESS_LIFETIME = TWO_HOURS
} = process.env;


const IN_PROD = NODE_ENV == 'production';

const users = [
    { id: 1, name: 'Alex', email: 'alex@gmail.com', password: 'alex' },
    { id: 2, name: 'Max', email: 'max@gmail.com', password: 'secret' },
    { id: 3, name: 'Hagard', email: 'hagard@gmail.com', password: 'secret' },
]

const app = express();
app.use(bodyParser.urlencoded({
    extended: true
}))

// Use of Session call as a middleware
app.use(session({
    name: SESS_NAME,
    resave: false,
    saveUninitialized: false,
    secret: SESS_SECRET,
    store: store,    // storing Session in mongodb
    cookie: {
        maxAge: SESS_LIFETIME,
        sameSite: true, // 'strict'
        secure: IN_PROD
    }
}));

// Middleware for checking user logged in or not.
const redirectLogin = (req, res, next) => {
    if (!req.session.userId) {
        res.redirect('/login');
    } else {
        next();
    }
}

// Middleware for if user login  then redirect to home.
const redirectHome = (req, res, next) => {
    if (req.session.userId) {
        res.redirect('/home');
    } else {
        next();
    }
}

app.use((req, res, next) => {
    const { userId } = req.session;
    if (userId) {
        res.locals.user = users.find(
            user => user.id === userId
        )
    }
    next();
})

app.get('/', (req, res) => {
    // console.log(req.session);
    const { userId } = req.session;

    res.send(`
<html>
<head>
<title>Session</title>
</head>
<body>
<h1>Welcome!</h1>
${userId ? `
<a href ='/home'>Home </a><br/><br/>
<form method ='post' action='/logout'>
<button>Logout</button></form>`: `<a href ='/login'>Login</a>
<a href ='/register'>Register</a>
`}
</body>
</html>
`)
});

app.get('/home', redirectLogin, (req, res) => {
    const { user } = res.locals;
    console.log(req.sessionID);
    res.send(`
<html>
<head>
<title>Session</title>
</head>
<body>
<h1>Home!</h1>
<a href ='/'>Main </a>
<ul>
<li>Name:${user.name}</li>
<li>Email:${user.email}</li>
</ul>
</body>
</html>
`)
});

app.get('/profile', redirectLogin, (req, res) => {
    const { user } = res.locals;

});

app.get('/login', redirectHome, (req, res) => {

    // req.session.userId=
    res.send(`
    <html>
    <head>
    <title>Session</title>
    </head>
    <body>
    <h1>Login!</h1>
    <form method='post' action='/login'>
    <input type ='email' name='email' placeholder='Email' required/><br/><br/>
    <input type ='password' name='password' placeholder='Password' required/><br/><br/>
    <input type='submit'/>
    </form>
    <a href ='/register'>Register</a>

    </body>
    </html>
    `)

});
app.get('/register', redirectHome, (req, res) => {
    res.send(`
    <html>
    <head>
    <title>Session</title>
    </head>
    <body>
    <h1>Register!</h1>
    <form method='post' action='/register'>
    <input name='name' placeholder='Name' required/><br/><br/>
    <input type ='email' name='email' placeholder='Email' required/><br/><br/>
    <input type ='password' name='password' placeholder='Password' required/><br/><br/>
    <input type='submit'/>
    </form>
    <a href ='/login'>Login</a>

    </body>
    </html>
    `)
});

app.post('/login', redirectHome, (req, res) => {
    const { email, password } = req.body;

    if (email && password) {
        const user = users.find(user => user.email === email && user.password === password);
        if (user) {
            req.session.userId = user.id;
            return res.redirect('/home');
        }
    }
    res.redirect('/login');
});

app.post('/register', redirectHome, (req, res) => {
    const { name, email, password } = req.body;

    if (name && email && password) {
        const exists = users.some(
            user => user.email === email
        )
        if (!exists) {
            const user = {
                id: users.length + 1,
                name,
                password,
                email

            }
            user.push(user);

            req.session.userId = user.id;
            return res.redirect('home');
        }
    }
    res.redirect('/register');
});

app.post('/logout', redirectLogin, (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/home');
        }
        res.clearCookie(SESS_NAME);
        res.redirect('/login');
    })
});

app.listen(PORT, () => console.log(
    `http://localhost:${PORT}`
));


