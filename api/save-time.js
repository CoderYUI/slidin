const fs = require('fs').promises;
const path = require('path');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const filePath = path.join(process.cwd(), 'time.json');
        let times = [];
        
        try {
            const fileContent = await fs.readFile(filePath, 'utf8');
            times = JSON.parse(fileContent);
        } catch (error) {
            // File doesn't exist yet, that's ok
        }

        times.push(req.body);
        await fs.writeFile(filePath, JSON.stringify(times, null, 2));
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error saving time:', error);
        res.status(500).json({ message: 'Error saving time' });
    }
}
