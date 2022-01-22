import express from 'express';
import pg from 'pg';
import aws from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';

let pgConnectionConfigs;

const { Pool } = pg;

// test to see if the env var is set. Then we know we are in Heroku
if (process.env.DATABASE_URL) {
  // pg will take in the entire value and use it to connect
  pgConnectionConfigs = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  };
} else {
  // this is the same value as before
  pgConnectionConfigs = {
    user: 'Chan Keet',
    host: 'localhost',
    database: 'Chan Keet',
    port: 5432,
  };
}
const pool = new Pool(pgConnectionConfigs);


const PORT = process.env.PORT || 3004;

// Initialise Express
const app = express();
app.use(express.static('uploads'));

const s3 = new aws.S3({
  accessKeyId: process.env.ACCESSKEYID,
  secretAccessKey: process.env.SECRETACCESSKEY,
});

const multerUpload = multer({
  storage: multerS3({
    s3,
    bucket: 'heroku-example-bucket1',
    acl: 'public-read',
    metadata: (request, file, callback) => {
      callback(null, { fieldName: file.fieldname });
    },
    key: (request, file, callback) => {
      callback(null, Date.now().toString());
    },
  }),
});

app.set('view engine', 'ejs');

app.get('/bananas', (request, response) => {

  const responseText = `This is a random number: ${Math.random()}`;

  console.log('request came in', responseText);

  const data = { responseText };

  response.render('bananas', data);
});

app.get('/cats', (request, response) => {
  console.log('request came in');
  pool.query('SELECT * from cats').then((result) => {
    console.log(result.rows[0].name);
    response.send(result.rows);  
  }).catch((error) => {
    console.error('Error executing query', error.stack);
    response.status(503).send(result.rows);
  });;
});

app.get('/recipe', (req, res) => {
  res.render('recipe');
})

app.post('/recipe', multerUpload.single('photo'), (request, response) => {
  console.log(request.file);
  response.send(request.file);
});

app.listen(PORT);
