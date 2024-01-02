const express = require('express')
const mysql = require('mysql')
const cors = require('cors')

const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');




const fs = require('fs'); // Require the fs module

const app = express();

app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    user: "uug7lgitqfwgeck0",
    host: "b9s1llmzy21ystbkhocz-mysql.services.clever-cloud.com",
    password: "Hz9FpR7PilNtJPe9aiCh",
    database: "b9s1llmzy21ystbkhocz"
})


// getting user logs

// posting register
app.post("/register", async (req, res) => {
    const firstname = req.body.firstname
    const lastname = req.body.lastname
    const username = req.body.username
    const contact = req.body.contact
    const datebirth = req.body.datebirth
    const email = req.body.email
    const password = req.body.password
    const role = req.body.role

    const saltRounds = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    db.query(
        "INSERT INTO imageusers (firstname, lastname, username, contact, datebirth, email, password, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [firstname, lastname, username, contact, datebirth, email, hashedPassword, role],
        (err, result) => {
            if (err) {
                console.error("Error in /register:", hashedPassword);
                return res.status(500).json({ error: "Registration failed" });
            } else {
                // Log the plain and hashed passwords
                console.log("The plain password:", password);
                console.log("Hashed password:", hashedPassword);

                // Check if the password matches the hashed password
                bcrypt.compare(password, hashedPassword, (compareErr, compareResult) => {
                    if (compareErr) {
                        console.error("Error comparing passwords:", compareErr);
                        return res.status(500).json({ error: "Registration failed" });
                    }

                    if (compareResult) {
                        // Passwords match, you can log or perform additional actions here
                        console.log("Password and hashed password match!");
                    } else {
                        console.log("Password and hashed password do not match.");
                    }

                    // Continue with the rest of your logic
                    sendEmailVerification(email, password, username);
                    res.status(200).json({ success: "Registration successful" });
                });
            }
        }
    );
});

app.put('/all/new-password/:username', async (req, res) => {
    const username = req.params.username
    const newpassword = req.body.newpassword

    const saltRounds = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newpassword, saltRounds);

    db.query("UPDATE imageusers SET password = ? WHERE username = ?", 
    [hashedPassword, username], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            res.status(500).json({ error: "Database error" });
          } else {
            res.status(200).json(result);
            console.log("The plain password:", newpassword);
            console.log("Hashed password:", hashedPassword);
          }
    })
})

app.get('/assignusers', (req, res) => {
    db.query("SELECT * FROM assignusers", (err, result) => {
        if(err) throw err;
        res.send(result)
    })

})


// Sending email verification
function sendEmailVerification(email, password, username) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'imageinterior03@gmail.com',
        pass: 'tvtbvntxnmhproet',
      },
    });
  
    const mailOptions = {
      from: 'imageinterior03@gmail.com',
      to: email,
      subject: 'Image Interior Account - Change your password',
      text: 
      
      `Welcome to Image Interior Company! We are thrilled to have you as a member of our community.

      To ensure the security of your account, please log in using the following temporary password:
      
      ${password}. This is your username ${username}. This is the website https://imageinterior.netlify.app/.

      Once logged in, we recommend changing your password immediately for enhanced security.

      Thank you. If you have any questions or concerns, please do not hesitate to contact our support team.

      Best Regards,
      Image Interior Team`,
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Email sending failed: ' + error.message);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  }

// posting user logs
app.post('/userlogs' , (req, res) => {
    const role = req.body.role
    const email = req.body.email
    const date = req.body.date
    const time = req.body.time
    const username = req.body.username
    const logout = req.body.logout
    const modify = req.body.modify
   
 
    db.query(
        "INSERT INTO userlogs (role, username, email, date, time, logout, modify) VALUE (?, ?, ?, ?, ?, ?, ?)", 
        [role, username, email, date, time, logout, modify],
         (err, result) => {
            console.error(err)

        })
})
// getting user logs
app.get('/userlogs/all' , (req, res) => {
    db.query("SELECT * FROM userlogs", (err, result) => {
        if (err) {
            console.error(err);
            throw err;
          }
          console.log(result); 
          res.send(result);
    })
})
// getting user logs by date
app.get('/userlogs/all/:date', (req, res) => {
    db.query("SELECT * FROM userlogs WHERE date = ?",[req.params.date], (err, result) => {
        if(!err) 
        res.send(result)
        else
        console.log(err)
    })
})
// posting logins

app.post('/login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const role = req.body.role;
    const username = req.body.username;

    db.query(
        "SELECT * FROM imageusers WHERE email = ?",
        [email],
        async (err, result) => {
            if (err) {
                console.error("Error in /login:", err);
                return res.status(500).json({ error: "Login failed" });
            }

            if (result.length > 0) {
                const user = result[0];

                // Compare the provided password with the stored hashed password
                const validPassword = await bcrypt.compare(password, user.password);

                if (validPassword) {
                    console.log("Login successful!");

                    return res.json({
                        role: user.role,
                        username: user.username,
                    });
                } else {
                    console.log("Invalid password");
                    return res.json("User not found");
                }
            } else {
                console.log("User not found");
                return res.json("User not found" );
            }
        }
    );
});


// getting all data from imageusers db
app.get("/all", (req, res) => {
    db.query("SELECT * FROM imageusers ", (err, result) => {
        if(err) throw err;
        res.send(result)
    })
})

// getting all data by id
app.get('/all/:id', (req, res) => {
    db.query("SELECT * FROM imageusers WHERE id = ?",[req.params.id], (err, result) => {
        if(!err) 
        res.send(result)
        else
        console.log(err)
    })
})
app.get('/all/:username', (req, res) => {
    const username = req.params.username
    db.query("SELECT * FROM imageusers WHERE username = ?",[username], (err, result) => {
        if(!err) 
        res.send(result)
        else
        console.log(err)
    })
})
// deleting data by id
app.delete('/all/:id', (req, res) => {
    db.query("DELETE FROM imageusers WHERE id = ?",[req.params.id], (err, result) => {
        if(!err) 
        res.send('Deleted Successfully')
        else
        console.log(err)
    })
})
// posting files to adminupload
app.post("/adminupload", (req, res) => {

    const filename = req.body.filename
    const filesize = req.body.filesize
    const filetype = req.body.filetype
    const fileurl = req.body.fileurl
    const user = req.body.user
    const username = req.body.username

    db.query(
    "INSERT INTO adminupload (filename, filetype, filesize, fileurl, user, username) VALUES (?, ?, ?, ?, ?, ?)", 
    [filename, filetype, filesize, fileurl, user,username],
     (err, result) => {
        console.log(err)
        
    })

})

app.get('/adminupload/all/', (req, res) => {  
 
    db.query(
    "SELECT * FROM  adminupload ", 
     (err, result) => {
        
        if (err) {
            console.error("Database error:", err);
            res.status(500).json({ error: "Database error" });
          } else {
            res.status(200).json(result);
          }
       
        
    })
})


// getting files from adminupload
app.get('/adminupload/all/:username', (req, res) => {  
    const username = req.params.username
    db.query(
    "SELECT * FROM  adminupload WHERE username = ?", 
    [username],
     (err, result) => {
        
        if (err) {
            console.error("Database error:", err);
            res.status(500).json({ error: "Database error" });
          } else {
            res.status(200).json(result);
          }
       
        
    })
})
app.get('/adminupload/download/:id', (req, res) => {
    db.query("SELECT * FROM adminupload WHERE id = ?",[req.params.id], (err, result) => {
        if(!err) 
        res.send(result)
        else
        console.log(err)
    })
})




// get secure URL

app.get('adminupload/download/:id', (req, res) => {
    const id = req.params.id

    db.query('SELECT * FROM adminupload WHERE  id = ?',
    [id], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error retrieving file');
          } else {
            if (result.length === 0) {
              res.status(404).send('File not found');
            } else {
              const fileRecord = result[0];
              res.attachment(fileRecord.filename);
               res.redirect(fileRecord.fileurl);
            }
          }
    })
})

//creating project 
app.post("/create", (req, res) => {

   const name = req.body.name
   const owner = req.body.owner
   const projnumber = req.body.projnumber
   const description = req.body.description
   const startdate = req.body.startdate
   const enddate = req.body.enddate
   const mobnumber = req.body.mobnumber
   const email = req.body.email
   const address = req.body.address
   

    db.query(
    "INSERT INTO createproj (name, owner, projnumber, description, startdate, enddate, mobnumber, email, address) VALUES (? ,? ,?, ?, ?, ?, ?, ?, ?)", 
    [name, owner, projnumber, description, startdate, enddate, mobnumber, email, address],
     (err, result) => {
        console.log(err)
        
    })
    
})


//gettinmg all the proj details

app.get("/create/all", (req, res) => {
    db.query("SELECT * FROM createproj ", (err, result) => {
        if(err) throw err;
        res.send(result)
    })
})

// getting all data by id
app.get('/create/all/:id', (req, res) => {
    db.query("SELECT * FROM createproj WHERE id = ?",[req.params.id], (err, result) => {
        if(!err) 
        res.send(result)
        else
        console.log(err)
    })
})
app.get('/create/all/name/:name', (req, res) => {
    const name = req.params.name
    db.query("SELECT * FROM createproj WHERE name = ?",[name], (err, result) => {
        if(!err) 
        res.send(result)
        else
        console.log(err)
    })
})




// deleting projects 
app.delete('/create/all/:id', (req, res) => {
    db.query("DELETE FROM createproj WHERE id = ?",[req.params.id], (err, result) => {
        if(!err) 
        res.send('Deleted Successfully')
        else
        console.log(err)
    })
})

// assigning 

app.post('/assign', (req, res) => {
    const id = req.body.id
    const name = req.body.name
    const projname = req.body.projname
    const role  = req.body.role
    db.query('INSERT INTO assigning (name, role , projID, projname) VALUES (?, ?, ?, ?)', 
    [name, role, id, projname],(err, result) => {
        console.log(err)
    })
})



app.get('/assign/all', (req, res) => {
    db.query("SELECT * FROM assigning", (err, result) => {
        if(err) throw err;
        res.send(result)
    })
})

// getting files from adminupload
app.get('/assign/all/:username', (req, res) => {  
    const username = req.params.username
    db.query(
    "SELECT * FROM  assigning WHERE name = ?", 
    [username],
     (err, result) => {
        
        if (err) {
            console.error("Database error:", err);
            res.status(500).json({ error: "Database error" });
          } else {
            res.status(200).json(result);
          }
       
        
    })
})
app.get('/assign/all/projname/:projname', (req, res) => {  
    const projname = req.params.projname
    db.query(
    "SELECT * FROM  assigning WHERE projname = ?", 
    [projname],
     (err, result) => {
        
        if (err) {
            console.error("Database error:", err);
            res.status(500).json({ error: "Database error" });
          } else {
            res.status(200).json(result);
          }
       
        
    })
})

// getting all data by id
app.get('/assign/all/test/:id', (req, res) => {
    db.query("SELECT * FROM assigning WHERE id = ?",[req.params.id], (err, result) => {
        if(!err) 
        res.send(result)
        else
        console.log(err)
    })
})
app.get('/assign/all/filter/', (req, res) => {
    db.query('SELECT DISTINCT name FROM assigning', (err, result) => {
        if (!err) 
            res.send(result);
        else
            console.log(err);
    });
});

app.get('/assign/all/duplicate/:name/:projname', (req, res) => {
    const name = req.params.name
    const projname = req.params.projname
    db.query('SELECT * FROM assigning WHERE name = ? AND projname = ?', [name, projname], (err, result) => {
        if(!err) 
        res.send(result)
        else
        console.log(err)
    })
})

app.delete('/assign/all/:id', (req, res) => {
    db.query("DELETE FROM assigning WHERE id = ?",[req.params.id], (err, result) => {
        if(!err) 
        res.send('Deleted Successfully')
        else
        console.log(err)
    })
})

app.get('/assign/all/projectID/:projID', (req, res) => {
    const projID = req.params.projID
    db.query('SELECT *  FROM assigning WHERE projID = ?', [projID],(err, result) => {
        if (!err) 
            res.send(result);
        else
            console.log(err);
    });
});

app.delete('/assign/all/projectID/:projID', (req, res) => {
    const projID = req.params.projID
    db.query("DELETE FROM assigning WHERE projID = ?",[projID], (err, result) => {
        if(!err) 
        res.send('Deleted Successfully')
        else
        console.log(err)
    })
})

app.post("/collabupload", (req, res) => {

    const filename = req.body.filename
    const filesize = req.body.filesize
    const filetype = req.body.filetype
    const fileurl = req.body.fileurl
    const user = req.body.user
    const username = req.body.username
    const projID = req.body.projID
    const projname = req.body.projname
    const date = req.body.date
    const comment = req.body.comment
    db.query(
    "INSERT INTO collabupload (filename, filetype, filesize, fileurl, user, username, projID, projname, date, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
    [filename, filetype, filesize, fileurl, user,username, projID, projname, date, comment],
     (err, result) => {
        console.log(err)
        
    })

})

app.get('/collabupload/all/', (req, res) => {  
 
    db.query(
    "SELECT * FROM  collabupload", 
     (err, result) => {
        
        if (err) {
            console.error("Database error:", err);
            res.status(500).json({ error: "Database error" });
          } else {
            res.status(200).json(result);
          }
       
        
    })
})

app.get('/collabupload/all/:projID', (req, res) => {
    const projID = req.params.projID
    db.query("SELECT * FROM collabupload WHERE projID = ?",
    [projID], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            res.status(500).json({ error: "Database error" });
          } else {
            res.status(200).json(result);
          }
    })
})

app.get('/collabupload/all/:projname/:username', (req, res) => {  
    const projname = req.params.projname
    const username = req.params.username
    db.query(
    "SELECT * FROM  collabupload WHERE projname = ? AND username = ?", 
    [projname, username],
     (err, result) => {
        
        if (err) {
            console.error("Database error:", err);
            res.status(500).json({ error: "Database error" });
          } else {
            res.status(200).json(result);
          }
       
        
    })
})

// deleting files

app.delete('/collabupload/all/:id', (req, res) => {
    db.query("DELETE FROM collabupload WHERE id = ?",[req.params.id], (err, result) => {
        if(!err) 
        res.send('Deleted Successfully')
        else
        console.log(err)
    })
})

// role

app.post("/role", (req, res) => {
    const rolename = req.body.rolename
    const description = req.body.description
    const accessfiles = req.body.accessfiles
    const deletefiles = req.body.deletefiles
    const downloadfiles = req.body.downloadfiles
    const uploadfiles = req.body.uploadfiles
    const addusers = req.body.addusers
    const removeusers = req.body.removeusers
    const addproject = req.body.addproject
    const assignusers = req.body.assignusers
    const deleteproject = req.body.deleteproject
    const deleteassign = req.body.deleteassign
    const allowreports = req.body.allowreports
    const accesstools = req.body.accesstools

    db.query(
    `INSERT INTO role (rolename, description, 
    accessfiles, deletefiles, downloadfiles, 
    uploadfiles, adduser	, removeuser, 
    addproject, assignusers, deleteproject, 
    deleteassign, allowreports, accesstools) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [rolename, description, 
    accessfiles, deletefiles, 
    downloadfiles,uploadfiles, 
    addusers, removeusers, 
    addproject, assignusers, 
    deleteproject, deleteassign, 
    allowreports, accesstools],
     (err, result) => {
        console.log(err)
        
    })

})

app.get('/role/all', (req, res) => {
    db.query(
        "SELECT * FROM  role", 
         (err, result) => {
            
            if (err) {
                console.error("Database error:", err);
                res.status(500).json({ error: "Database error" });
              } else {
                res.status(200).json(result);
              }
           
            
        })
})

app.get('/role/all/:rolename', (req, res) => {
    const rolename = req.params.rolename;
    db.query(
        "SELECT * FROM  role WHERE rolename = ?", 
         [rolename], (err, result) => {
            
            if (err) {
                console.error("Database error:", err);
                res.status(500).json({ error: "Database error" });
              } else {
                res.status(200).json(result);
              }
           
            
        })
})

app.put('/role/update/:id', (req, res) => {
    const id = req.params.id;
    const accessfiles = req.body.accessfiles
    const deletefiles = req.body.deletefiles
    const downloadfiles = req.body.downloadfiles
    const uploadfiles = req.body.uploadfiles
    const addusers = req.body.addusers
    const removeusers = req.body.removeusers
    const addproject = req.body.addproject
    const assignusers = req.body.assignusers
    const deleteproject = req.body.deleteproject
    const deleteassign = req.body.deleteassign
    const allowreports = req.body.allowreports
 
    
    db.query(
        `UPDATE role SET 
        accessfiles = ?, 
        deletefiles = ?, 
        downloadfiles = ?, 
        uploadfiles = ?, 
        adduser = ?, 
        removeuser = ?, 
        addproject = ?, 
        assignusers = ?, 
        deleteproject = ?, 
        deleteassign = ?, 
        allowreports = ? 
        WHERE id = ?`,
        [accessfiles, deletefiles, downloadfiles, uploadfiles, addusers, removeusers, addproject, assignusers, deleteproject, deleteassign, allowreports, id],
        (err, result) => {
            if (err) {
                console.error("Database error:", err);
                res.status(500).json({ error: "Database error" });
            } else {
                res.status(200).json(result);
            }
        }
    );
})


app.listen(3306), () => {
    console.log('listening...')
}