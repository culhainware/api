const hapi = require('hapi');
const mongoose = require('mongoose');
const { graphqlHapi, graphiqlHapi } = require('apollo-server-hapi');
const schema = require('./graphql/schema');
const Painting = require('./models/Painting');
const firebaseAdmin = require('firebase-admin');

/* swagger section */
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
const Pack = require('./package');

mongoose.connect('mongodb://cware-adm:qwe123!@ds263520.mlab.com:63520/culhainware-modern-api');

var serviceAccount = require("unity-asset-bundles-firebase-adminsdk-2910z-cccc31651b.json");

firebaseAdmin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://unity-asset-bundles.firebaseio.com"
});

try {

    mongoose.connection.once('open', () =>{
        console.log('connected to db');
    });
}
catch(exc) {
    console.log('Failed');
}

const server = hapi.server({
    port: 4000,
    host: 'localhost'
});

const init = async () => {
    
    server.route
    ([
        {
            method: 'GET',
            path: '/',
            handler: (req, res) =>
            {
                return '<p>My modern API</p>';
            }
        },
        {
            method: 'GET',
            path: '/api/v1/paintings',
            config: {
                description: 'Get all the paintings',
                tags: ['api', 'v1', 'painting']
            },
            handler: (req, res) =>
            {
                return Painting.find();
            }
        },
        {
            method: 'POST',
            path: '/api/v1/paintings',
            config: {
                description: 'Post a painting',
                tags: ['api', 'v1', 'painting']
            },
            handler: (req, res) =>
            {
                const {name, url, technique} = req.payload;
                const painting = new Painting({
                    name, 
                    url,
                    technique
                });

                return painting.save();
            }
        }
    ]);

    await server.register({
        plugin: graphiqlHapi,
        options: {
            path: '/graphiql',
            graphiqlOptions: {
                endpointURL: '/graphql'
            },
            route: {
                cors: true
            }
        }
    });

    await server.register({
        plugin: graphqlHapi,
        options: {
            path: '/graphql',
            graphqlOptions: {
                schema
            },
            route: {
                cors: true
            }
        }
    });

    await server.register([
        Inert,
        Vision,
        {
            plugin: HapiSwagger,
            options: {
                info: {
                    title: 'Paintings API Documentation',
                    version: Pack.version
                }
            }
        }
    ]);

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

init();