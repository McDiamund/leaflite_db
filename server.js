const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Create a connection to the MySQL database
// const connection = mysql.createPool({
//     host: 'localhost', // Docker container name
//     user: 'root',
//     password: 'my-secret-pw', // MySQL root password
//     database: 'leaflite_db', // Name of your database
//     keepAliveInitialDelay: 1000,
//     enableKeepAlive: true
// });

// // Connect to the database
// connection.getConnection((err) => {
//     if (err) {
//         console.error('Error connecting to MySQL database:', err);
//         return;
//     }
//     console.log('Connected to MySQL database');
// });

// Define a route to handle HTTP GET requests
// app.get('/', (req, res) => {
//     // Perform a sample query
//     connection.query('SELECT 1 + 1 AS solution', (error, results, fields) => {
//         if (error) {
//             console.error('Error executing MySQL query:', error);
//             res.status(500).send('Error executing MySQL query');
//             return;
//         }
//         const solution = results[0].solution;
//         res.send(`The solution is: ${solution}`);
//     });
// });

app.post('/signup', async (req, res) => {

    const dbconnection = mysql.createConnection({
        host: 'localhost', // Docker container name
        user: 'root',
        password: 'my-secret-pw', // MySQL root password
        database: 'leaflite_db'
    });

    try {
        const { email, password } = req.body;

        const hashedPassword = (await bcrypt.hash(password, 10)); // Hash password
        const created_at = new Date();

        dbconnection.execute(`
          INSERT INTO 
            users (
                login_key, 
                email,
                created_at
            ) 
            
            VALUES (
                '${hashedPassword}',
                '${email}',
                '${created_at.toDateString()}'
            )
        `)

        dbconnection.end();

        res.status(201).send({'message': 'User signed up successfully'});
    } catch (error) {
        console.error('Error signing up user:', error);
        res.status(500).send({'message':'Error signing up user'});
    }
});

app.post('/signin', async (req, res) => {

    const dbconnection = mysql.createConnection({
        host: 'localhost', // Docker container name
        user: 'root',
        password: 'my-secret-pw', // MySQL root password
        database: 'leaflite_db',
    });

    try {
        const { email, password } = req.body;

        dbconnection.execute(`SELECT * FROM users WHERE email = '${email}'`, async (err,rows) => {
            if(err) throw err;

            if (rows.length === 1) {
                // User with provided email found
                const user = rows[0];
                const hashedPasswordFromDB = user.login_key;
        
                // Compare the hashed password from the database with the hashed password entered by the user
                const passwordMatch = await bcrypt.compare(password, hashedPasswordFromDB);
        
                if (passwordMatch) {
                    // Passwords match, user is authenticated
                    // Proceed with your authentication logic here
                    res.status(200).send({'user':user});
                    return;
                } else {
                    // Passwords do not match
                    res.status(500).send({'message':'Incorrect Password'});
                    return;
                    // Handle incorrect password case (e.g., inform the user)
                }
            } else {
                // No user with the provided email found
                res.status(500).send({'message':'User not found.'});
                return;
                // Handle case where user does not exist (e.g., inform the user)
            }
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).send({'message':'Error logging in user'});
    }
});

app.post('/devices/create', (req, res) => {

    const dbconnection = mysql.createConnection({
        host: 'localhost', // Docker container name
        user: 'root',
        password: 'my-secret-pw', // MySQL root password
        database: 'leaflite_db'
    });

    try {
        const { mac_address } = req.body;

        dbconnection.execute(`
          INSERT INTO 
            devices (
                device_code, 
                name, 
                water_level,
                mac_address
            ) 
            
            VALUES (
                '6798',
                'New Leaflite Device',
                ${0.1},
                '${mac_address}'
            )
        `)

        dbconnection.end();

        res.status(201).send('Device created successfully');
    } catch (error) {
        console.error('Error creating a device:', error);
        res.status(500).send('Error creating a device');
    }
});

app.post('/devices', async (req, res) => {

    const dbconnection = mysql.createConnection({
        host: 'localhost', // Docker container name
        user: 'root',
        password: 'my-secret-pw', // MySQL root password
        database: 'leaflite_db'
    });

    const { user_id } = req.body;

    try {

        dbconnection.execute(`SELECT * FROM devices WHERE user_id = ${parseInt(user_id)}`, async (err,rows) => {
            if(err) throw err;

            if (rows.length > 0) {
                res.status(200).send({'devices':rows}); 
            } else {
                res.status(500).send({'message':'No devices found.'});
                return;
            }

        })
      
    } catch (e) {
        console.error('Error getting devices:', error);
        res.status(500).send('Error getting devices'); 
    }
});

app.post('/devices/register', async (req, res) => {

    const dbconnection = mysql.createConnection({
        host: 'localhost', // Docker container name
        user: 'root',
        password: 'my-secret-pw', // MySQL root password
        database: 'leaflite_db'
    });

    try {
        const { user_id, device_code } = req.body;

        dbconnection.execute(`
            UPDATE devices 
            SET user_id = ${user_id}
            WHERE device_code = '${device_code}'
        `, async (err,rows) => {
            if(err) throw err;

            if (rows.length === 0) {
                res.status(404).json({ error: 'Device not found' });
                return;
            }
        })

        dbconnection.end();

        res.status(201).send('Device registered successfully');
    } catch (error) {
        console.error('Error registering a device:', error);
        res.status(500).send('Error registering a device');
    }

});

app.post('/devices/update', async (req, res) => {

    const dbconnection = mysql.createConnection({
        host: 'localhost', // Docker container name
        user: 'root',
        password: 'my-secret-pw', // MySQL root password
        database: 'leaflite_db'
    });

    try {
        const { device_id, name, water_level, detail_image } = req.body;

        dbconnection.execute(`
            UPDATE devices 
            SET name = '${name ?? ''}',
                water_level = ${water_level ?? 0},
                detail_image = '${detail_image ?? ''}'
            WHERE id = ${device_id}
        `, async (err,rows) => {
            if(err) throw err;

            if (rows.length === 0) {
                res.status(404).json({ error: 'Device not found' });
                return;
            }
        })

        dbconnection.end();

        res.status(201).send('Device updated successfully');
    } catch (error) {
        console.error('Error updating device:', error);
        res.status(500).send('Error updating device');
    }

});

app.post('/devices/delete', async (req, res) => {

    const dbconnection = mysql.createConnection({
        host: 'localhost', // Docker container name
        user: 'root',
        password: 'my-secret-pw', // MySQL root password
        database: 'leaflite_db'
    });

    try {
        const { device_id } = req.body;

        dbconnection.execute(`
            UPDATE devices 
            SET user_id = NULL
            WHERE id = ${parseInt(device_id)}
        `, async (err,rows) => {
            if(err) throw err;

            if (rows.length === 0) {
                res.status(404).json({ error: 'Device not found' });
                return;
            }
        })

        dbconnection.end();

        res.status(201).send({'message':'Device deleted successfully'});
    } catch (error) {
        console.error('Error deleting device:', error);
        res.status(500).send({'message':'Error deleting device'});
    }

});



// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});