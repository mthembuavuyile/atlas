const { capabilityRegistry } = require('../capabilities');

class WidgetController {
    async execute(req, res) {
        try {
            const { tool, args = {} } = req.body;
            
            if (!tool) {
                return res.status(400).json({ error: 'Tool name is required' });
            }

            const result = await capabilityRegistry.execute(tool, args);
            return res.json(result);
        } catch (error) {
            console.error(`[Widget Controller Error] ${error.message}`);
            return res.status(500).json({ error: 'Widget execution failed. Please try again.' });
        }
    }
}

module.exports = new WidgetController();
