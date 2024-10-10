const puppeteer = require('puppeteer');
const fs = require('fs');

const url = 'https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_games';

async function scrapeGames() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        console.log('Navigating to page...');
        await page.goto(url, { waitUntil: 'networkidle0' });

        console.log('Waiting for content to load...');
        await page.waitForSelector('table.roundy', { timeout: 10000 });

        console.log('Parsing page content...');
        const games = await page.evaluate(() => {
            const games = [];
            
            console.log('Searching for tables...');
            const tables = document.querySelectorAll('table.roundy');
            console.log(`Found ${tables.length} tables with class 'roundy'`);

            let mainSeriesTable = null;

            for (const table of tables) {
                const firstHeader = table.querySelector('th');
                if (firstHeader && firstHeader.textContent && firstHeader.textContent.includes('Gen')) {
                    mainSeriesTable = table;
                    console.log('Found main series table');
                    break;
                }
            }

            if (!mainSeriesTable) {
                console.error('Main series table not found');
                return games;
            }

            const rows = mainSeriesTable.querySelectorAll('tr');
            console.log(`Found ${rows.length} rows in the main series table`);

            let currentGeneration = 0;
            const regions = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar', 'Paldea'];

            const getTextContent = (element) => element && element.textContent ? element.textContent.trim() : null;
            const getImageSrc = (element) => {
                const img = element ? element.querySelector('img') : null;
                return img ? img.src : null;
            };

            rows.forEach((row, index) => {
                try {
                    if (index === 0) return; // Skip header row

                    const columns = row.querySelectorAll('td, th');
                    console.log(`Row ${index}: ${columns.length} columns`);

                    // Check if this row defines a new generation
                    const generationCell = columns[0];
                    if (generationCell && generationCell.tagName === 'TH') {
                        const genMatch = generationCell.textContent ? generationCell.textContent.match(/\d+/) : null;
                        if (genMatch) {
                            currentGeneration = parseInt(genMatch[0]);
                            console.log(`Found new generation: ${currentGeneration}`);
                        }
                        return; // Skip to next row
                    }

                    // Check if this row starts a new game
                    if (columns[0] && columns[0].hasAttribute('rowspan')) {
                        const titleElement = columns[0].querySelector('b');
                        if (titleElement) {
                            const fullTitle = getTextContent(titleElement);
                            const japaneseTitle = getTextContent(columns[0].querySelector('big > b'));
                            const versions = fullTitle.includes(' and ') ? fullTitle.split(' and ') : [fullTitle];
                            
                            versions.forEach(version => {
                                const game = {
                                    id: version.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                                    title: version,
                                    japaneseTitle,
                                    releaseDate: {},
                                    generation: currentGeneration,
                                    region: regions[currentGeneration - 1] || 'Unknown',
                                    platforms: [],
                                    developers: ["Game Freak"],
                                    publishers: ["Nintendo"],
                                    versions: [version],
                                    languages: ["English", "Japanese", "French", "German", "Italian", "Spanish"],
                                    playerCount: {
                                        singlePlayer: true,
                                        multiPlayer: {
                                            local: true,
                                            online: false
                                        }
                                    },
                                    features: [
                                        "Turn-based battles",
                                        "Pokémon catching",
                                        "Gym battles",
                                        "Elite Four",
                                        "Trading"
                                    ],
                                    pokedexCount: currentGeneration === 1 ? 151 : undefined,
                                    newPokemon: currentGeneration === 1 ? 151 : undefined,
                                    boxArtUrl: getImageSrc(columns[0]),
                                    remakes: [],
                                    prequels: [],
                                    sequels: []
                                };

                                console.log(`Processing game: ${game.title}`);
                                games.push(game);
                            });
                        }
                    }

                    // Update platform and release date for all current games
                    const platformCell = columns[columns.length - 2];
                    const releaseDateCell = columns[columns.length - 1];

                    games.forEach(game => {
                        if (platformCell) {
                            const platform = getTextContent(platformCell);
                            if (platform && !game.platforms.includes(platform)) {
                                game.platforms.push(platform);
                            }
                        }
                        
                        if (releaseDateCell) {
                            const releaseDates = releaseDateCell.innerHTML ? releaseDateCell.innerHTML.split('<br>') : [];
                            releaseDates.forEach(dateInfo => {
                                const [date, region] = dateInfo.split('<small>').map(s => s.replace(/<\/?small>/g, '').trim());
                                if (region && region.includes('Japan')) game.releaseDate.japan = date;
                                else if (region && region.includes('North America')) game.releaseDate.northAmerica = date;
                                else if (region && region.includes('Australia')) game.releaseDate.australia = date;
                                else if (region && region.includes('Europe')) game.releaseDate.europe = date;
                            });
                        }
                    });
                } catch (rowError) {
                    console.error(`Error processing row ${index}:`, rowError);
                }
            });

            console.log(`Total games found: ${games.length}`);
            return games;
        });

        console.log(`Found ${games.length} games`);

        if (games.length === 0) {
            console.log('No games found. Capturing page content...');
            await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
            const pageContent = await page.content();
            fs.writeFileSync('debug-page-content.html', pageContent);
            console.log('Debug information saved to debug-screenshot.png and debug-page-content.html');
        } else {
            // Write the data to a JSON file
            fs.writeFileSync('pokemon_games.json', JSON.stringify(games, null, 2));
            console.log('Scraping complete. Data saved to pokemon_games.json');
        }

    } catch (error) {
        console.error('Error scraping data:', error);
        console.log('Capturing error state...');
        await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
        const pageContent = await page.content();
        fs.writeFileSync('error-page-content.html', pageContent);
        console.log('Error information saved to error-screenshot.png and error-page-content.html');
    } finally {
        await browser.close();
    }
}

scrapeGames();