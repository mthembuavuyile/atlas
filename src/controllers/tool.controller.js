const toolService = require('../services/tool.service');

class ToolController {
  async execute(req, res) {
    try {
      const { tool, args } = req.body;

      if (!tool) {
        return res.status(400).json({ error: 'Tool name is required' });
      }

      let result;

      switch (tool) {
        case 'execute_command':
          if (!args || !args.command) {
            return res.status(400).json({ error: 'Command argument is required' });
          }
          result = await toolService.executeCommand(args.command, args.cwd);
          break;

        case 'read_file':
          if (!args || !args.filepath) {
            return res.status(400).json({ error: 'Filepath argument is required' });
          }
          result = await toolService.readFile(args.filepath);
          break;

        case 'write_file':
          if (!args || !args.filepath || args.content === undefined) {
            return res.status(400).json({ error: 'Filepath and content arguments are required' });
          }
          await toolService.writeFile(args.filepath, args.content);
          result = { success: true, message: `Successfully wrote to ${args.filepath}` };
          break;

        case 'web_search':
          if (!args || !args.query) {
            return res.status(400).json({ error: 'Query argument is required' });
          }
          result = await toolService.searchWeb(args.query, args.maxResults || 5);
          break;

        case 'fetch_page':
          if (!args || !args.url) {
            return res.status(400).json({ error: 'URL argument is required' });
          }
          result = await toolService.fetchPage(args.url);
          break;

        default:
          return res.status(400).json({ error: `Unknown tool: ${tool}` });
      }

      res.json({ status: 'success', data: result });
    } catch (error) {
      console.error(`[Tool Controller Error] ${error.message}`);
      res.status(500).json({ status: 'error', error: error.message });
    }
  }
}

module.exports = new ToolController();
