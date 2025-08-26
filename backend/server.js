import express from 'express';
import cors from 'cors'; 
import mysql from 'mysql';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'; 
import coockieParser from 'cookie-parser';
const salt=10;

const app = express();
app.use(express.json());
app.use(cors());
app.use(coockieParser());

const db = mysql.createConnection({
    host: 'localhost',
    user:  'root',
    password: 'admin123',
    database: 'wash'
});

// Test database connection
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        return;
    }
    console.log('Connected to MySQL database');
});
 
app.post('/signup', (req, res)=>{
    const sql= "INSERT INTO users (`firstName`, `lastName`, `contact`, `email`, `password`) VALUES (?)";
    bcrypt.hash(req.body.password.toString(), salt, (err, hash)=>{
        if(err) {
            return res.json({Error: "Error hashing password"});
        }
        const values = [
            req.body.firstName,
            req.body.lastName,
            req.body.contact,
            req.body.email,
            hash
        ];
        db.query(sql, [values], (err, data)=>{
            if(err) return res.json({Error: "Error inserting user"});
            return res.json({message: "User created successfully"});
        });
    });
});

app.post('/login', (req, res) => {
    console.log("Login request received:", req.body); // Log the incoming request
    const sql= "SELECT * FROM users WHERE email = ?"
    db.query(sql, [req.body.email], (err, data)=>{
        if(err) return res.json({Error: "Error fetching user"});
        console.log("Database response:", data); // Log the database response
        if(data.length > 0){
          bcrypt.compare(req.body.password.toString(), data[0].password, (err, response)=>{
            if(err) return res.json({Error: "Error comparing passwords"});
            if(response){
               const user = {
                 id: data[0].id,
                 firstName: data[0].firstName,
                 lastName: data[0].lastName,
                 email: data[0].email,
                 contact: data[0].contact,
                 role: data[0].role || 'user'
               };
               const token = jwt.sign({ id: data[0].id }, 'your_jwt_secret', { expiresIn: '1h' });
               console.log("Login successful, returning:", {message: "Login successful", token, user});
               return res.status(200).json({message: "Login successful", token, user});
            } else {
                return res.status(400).json({message: "Wrong email or password"});
            }
          });
        } else {
            return res.status(400).json({message: "User not found"});
        }
    });
});

app.get('/', (req, res) => {
    res.send('Server is running!');
});

app.listen(8800, () => {
    console.log("Connected to backend!");
});
