const { exec } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

class ToolService {
  /**
   * Execute a shell command
   * @param {string} command 
   * @param {string} cwd 
   * @returns {Promise<{stdout: string, stderr: string}>}
   */
  async executeCommand(command, cwd = process.cwd()) {
    try {
      const { stdout, stderr } = await execPromise(command, { cwd });
      return { stdout, stderr };
    } catch (error) {
      throw new Error(`Command failed: ${error.message}\nStderr: ${error.stderr || ''}`);
    }
  }

  /**
   * Read file content
   * @param {string} filepath 
   * @returns {Promise<string>}
   */
  async readFile(filepath) {
    try {
      const fullPath = path.resolve(process.cwd(), filepath);
      const content = await fs.readFile(fullPath, 'utf8');
      return content;
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  /**
   * Write file content
   * @param {string} filepath 
   * @param {string} content 
   * @returns {Promise<void>}
   */
  async writeFile(filepath, content) {
    try {
      const fullPath = path.resolve(process.cwd(), filepath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, 'utf8');
    } catch (error) {
      throw new Error(`Failed to write file: ${error.message}`);
    }
  }
}

module.exports = new ToolService();
