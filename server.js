const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.static(__dirname));
app.use(express.json());

app.post('/save-time', (req, res) => {
    const filePath = path.join(__dirname, 'time.json');
    let times = [];
    
    // Read existing times
    if (fs.existsSync(filePath)) {
        times = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    
    // Add new time
    times.push(req.body);
    
    // Save back to file
    fs.writeFileSync(filePath, JSON.stringify(times, null, 2));
    
    res.json({ success: true });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
