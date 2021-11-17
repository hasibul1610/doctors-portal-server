const express = require('express');
const app = express();
const cors = require('cors')
const { MongoClient } = require('mongodb');
const admin = require("firebase-admin");

app.use(cors());
app.use(express.json());

require('dotenv').config();

const port = process.env.port || 5000;





const serviceAccount = require('./doctors-portal-d87af-firebase-adminsdk-37cz8-2af4e9e207.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function verifyToken(req, res, next) {
    if (req.headers?.authorization) {
        const token = req.headers.authorization.split('Bearer ')[1];
        // console.log(token);
        try {
            const user = await admin.auth().verifyIdToken(token)
            // console.log(user.email)
            req.email = user.email;
        }
        catch {

        }
    }
    // console.log(req.headers.authorization.split('Bearer')[1]);
    next()
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ernke.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
async function run() {
    try {
        await client.connect();
        const appointmentCollection = client.db('doctorsPortal').collection('appointment');
        const adminCollection = client.db('doctorsPortal').collection('admin');
        // console.log('DB connected');


        app.post('/addAppointment', async (req, res) => {
            const appointment = req.body;
            const result = await appointmentCollection.insertOne(appointment);
            // console.log(result);
            res.send(result.acknowledged)
        })



        //get
        app.get('/appointments', verifyToken, async (req, res) => {
            // console.log(req.email);
            // console.log(req.query.email);

            if (req.email && req.email === req.query.email) {
                const cursor = appointmentCollection.find({})
                const appointments = await cursor.toArray();
                res.json(appointments);
            } else {
                res.status(401).json([{ message: 'Unauthorized' }])
            }

        })

        // adminCollection.insertOne({ email: 'bcse.hasibul@gmail.com' })
        app.get('/isAdmin', async (req, res) => {
            const email = req.query.email;
            if (email) {
                const cursor = adminCollection.find({ email: email })
                const isAdmin = await cursor.toArray();
                res.send(isAdmin.length > 0);
            }
            // console.log(isAdmin)

        })

    }
    finally {

    }
}

run().catch(console.dir)

app.get('/', (req, res) => {
    res.send("Doctors Portal Server Running");
})

app.listen(port, () => {
    console.log('Server On Port', port);
})