const axios = require('axios');
const https = require('https');

const credentials = {
    username: 'marencocode',
    password: 'marencos6359:D'
};

const agent = new https.Agent({  
    rejectUnauthorized: false
});

axios.post('https://sapius.test/api/login', credentials, {
    headers: { 'Accept': 'application/json' },
    httpsAgent: agent
})
.then(response => {
    console.log('SUCCESS:', response.data);
})
.catch(error => {
    console.log('ERROR MESSAGE:', error.message);
    if (error.response) {
        console.log('STATUS:', error.response.status);
        console.log('DATA:', error.response.data);
    }
});
