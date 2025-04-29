const express = require('express');
const app = express();
const path = require('path');

const PORT = process.env.PORT || 3000;

// Serve static files from current directory
app.use(express.static(__dirname));

// Serve summary.html as homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'summary.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
