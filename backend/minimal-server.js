const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('ok'));
app.listen(5000, () => console.log('MINIMAL SERVER RUNNING ON 5000'));
