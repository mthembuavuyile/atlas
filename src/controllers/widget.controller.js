const widgetService = require('../services/widget.service');

class WidgetController {
    async execute(req, res) {
        try {
            const { tool, args = {} } = req.body;
            
            if (!tool) {
                return res.status(400).json({ error: 'Tool name is required' });
            }

            let result;
            
            // Map the tool name from the LLM to our widgetService methods
            switch (tool) {
                case 'get_current_time':
                    result = await widgetService.getCurrentTime(args.timezone);
                    break;
                case 'convert_units':
                    result = await widgetService.convertUnits(args.value, args.from, args.to);
                    break;
                case 'search_places':
                    result = await widgetService.searchPlaces(args.query, args.near);
                    break;
                case 'fetch_webpage':
                    result = await widgetService.fetchWebpage(args.url);
                    break;
                case 'get_weather':
                    result = await widgetService.getWeather(args.city);
                    break;
                case 'get_crypto_price':
                    result = await widgetService.getCryptoPrice(args.coin);
                    break;
                case 'get_bible_verse':
                    result = await widgetService.getBibleVerse(args.reference);
                    break;
                case 'search_images':
                    result = await widgetService.searchImages(args.query);
                    break;
                case 'get_space_news':
                    result = await widgetService.getSpaceNews(args.topic);
                    break;
                case 'get_reddit_posts':
                    result = await widgetService.getRedditPosts(args.subreddit);
                    break;
                case 'define_word':
                    result = await widgetService.defineWord(args.word);
                    break;
                case 'convert_currency':
                    result = await widgetService.convertCurrency(args.amount, args.from, args.to);
                    break;
                case 'solve_math':
                    result = await widgetService.solveMath(args.expression, args.operation);
                    break;
                case 'tell_joke':
                    result = await widgetService.tellJoke();
                    break;
                case 'give_advice':
                    result = await widgetService.giveAdvice();
                    break;
                case 'scan_ocr':
                    result = await widgetService.scanOcr();
                    break;
                default:
                    result = { error: `Unknown tool: ${tool}` };
            }

            return res.json(result);
        } catch (error) {
            console.error(`[Widget Controller Error] ${error.message}`);
            return res.status(500).json({ error: 'Widget execution failed. Please try again.' });
        }
    }
}

module.exports = new WidgetController();
