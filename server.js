const express = require('express');
const mariadb = require('mariadb');
const path = require('path');
const bodyParser = require('body-parser'); 
const app = express();
const port = 80;
const replica_ip = '34.60.40.213:80';


// Create a MariaDB connection pool
const pool =
mariadb.createPool({
host: '127.0.0.1', // Use IP address to force TCP connection
port: 3306, // Ensure this is the correct port user: 'your_username', // Replace with your MariaDB
user : 'jimit',
password: 'secret', // Replace with your MariaDB password
database: 'db', // Our database name created above
connectionLimit: 5
});
// Set EJS as the view engine and set the views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Use body-parser middleware to parse form data (if you prefer explicit usage)
app.use(bodyParser.json())
app.use (bodyParser.urlencoded ({ extended: true }));

//exposed endpoint, /greeting. When a GET request is made to that endpoint, the server should respond with a webpage featuring the text, “Hello World!”.
app.get('/greeting', (req, res) => {
    res.send('<h1>Hello World!</h1>');
});


// Set up two additional endpoints, /register and /list, on the web service created in step I.
// The first should take a JSON-formatted POST request with the argument “username”, and insert a user with that name into the database. For example, {"username": "Aman"}
// The second should respond to any incoming GET requests with a JSON-formatted list with argument "users" of the usernames in its associated database. For example, {"users" : ["Aman", "Abdu"] }
// Finally, add another endpoint, /clear, which removes all users from your database upon receiving a POST request.

app.post('/register', async (req, res) => {
    const { username } = req.body;
    //const username = req.body.username;
    let conn;
    try {
        if (username === undefined || username === '') {
            return res.status(400).send('Username is required');
        }
        conn = await pool.getConnection();
        await conn.query('INSERT INTO Users (username) VALUES (?)', [username]);

        // Finally, set up a second cloud instance with the same endpoints, and a replica of the database you created in step II. Users registered in either instance should appear in the other's response when a request to /list is made. Pursue a WRITE ALL data replication strategy, as depicted in the slides, to establish consistency.
        // call the replica instance's /register endpoint
        await fetch(`http://${replica_ip}/register`, { method: 'POST', body: JSON.stringify({ username }), headers: { 'Content-Type': 'application/json' } });

        res.status(200).send('User registered successfully');
    } catch (err) {
        res.status(500).json({ error: 'Error registering user: ${err}' });
    } finally {
        if (conn) conn.release();
    }
}
);
app.get('/list', async (req, res) => {
    let conn;
    try {
        console.log('Received request to clear users');
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT username FROM Users');
        // output for example {"users" : ["Aman", "Abdu"] }
        const users = rows.map(row => row.username);
        res.json({ users });
    } catch (err) {
        console.error('Error retrieving users:', err);
        res.status(500).json({ error: 'Error retrieving users: ${err}' });
    } finally {
        if (conn) conn.release();
    }
}
);
app.post('/clear', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query('DELETE FROM Users');
        res.status(200).send('All users cleared');
        
    } catch (err) {
        res.status(500).json({ error: 'Error clearing users: ${err}' });
    } finally {
        if (conn) conn.release();
    }
});
// Alternatively, you can use Express's built-in parsing:
//app.use (express.urlencoded({ extended: true }));
// Route: Display form and customer table
// app.get('/', async (req, res) => {
// let conn;
// try {
// conn = await pool.getConnection();
// // Get all customers from the table
// const customers = await conn.query('SELECT * FROM customers');
//  res.render('index', { customers });
// } catch (err) {
// res.status(500).send('Error retrieving customers: ${err}');
// } finally {
// if (conn) conn.release();
// }
// });
// // Route: Add a new customer
// app.post('/add', async (req, res) => {
// const name = req.body.name;
// // Generate a random balance between 100 and 10,000 (two decimal places)
// const balance = (Math.random() * (10000 - 100) + 100).toFixed(2);
// let conn;
// try {
// conn = await pool.getConnection();
// await conn.query('INSERT INTO customers (name, balance) VALUES (?, ?)', [name, balance]);
// res.redirect('/');
// } catch (err) {
// res.status (500).send('Error adding customer: ${err}');
// } finally {
// if (conn) conn.release();
// if (conn) conn.release();
// }
// });
app.listen(port, () => {
    console.log(`Server is running on http://34.66.10.116:${port}`);
   });