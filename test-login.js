const axios = require('axios');

const credentials = {
    username: 'marencocode',
    password: 'marencos6359:D'
};

axios.post('http://127.0.0.1:8000/api/login', credentials, {
    headers: { 'Accept': 'application/json' }
})
.then(response => {
    console.log('SUCCESS:', response.data);
})
.catch(error => {
    console.log('ERROR:', error.response ? error.response.data : error.message);
});
