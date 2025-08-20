const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Configure your database connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mealprepdb',
});

// Generic function to import CSV
function importCSV(filePath, tableName, columns) {
    return new Promise((resolve, reject) => {
        const data = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                const rowData = columns.map((col) => row[col] || null); // Handle missing or empty values
                data.push(rowData);
            })
            .on('end', () => {
                console.log(`Parsed ${data.length} rows from ${filePath}`);
                if (data.length === 0) {
                    console.log(`No data found in ${filePath}. Skipping import.`);
                    resolve();
                    return;
                }

                const placeholders = columns.map(() => '?').join(', ');
                const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

                connection.beginTransaction((err) => {
                    if (err) return reject(err);

                    data.forEach((row, index) => {
                        connection.query(sql, row, (error) => {
                            if (error) {
                                console.error(`Error importing row ${index + 1}:`, error.message);
                                connection.rollback(() => reject(error));
                                return;
                            }

                            if (index === data.length - 1) {
                                connection.commit((commitErr) => {
                                    if (commitErr) return reject(commitErr);
                                    console.log(`Data imported into ${tableName}`);
                                    resolve();
                                });
                            }
                        });
                    });
                });
            })
            .on('error', (error) => {
                console.error(`Error reading file ${filePath}:`, error.message);
                reject(error);
            });
    });
}

// Call the function for your tables
async function runMigration() {
    try {
        await importCSV(
            path.join(__dirname, 'data', 'recipes.csv'),
            'Recipes',
            ['recipe_id', 'name', 'description', 'serving_size', 'servings']
        );
        console.log('Recipes migration completed.');

        await importCSV(
            path.join(__dirname, 'data', 'ingredients.csv'),
            'Ingredients',
            ['ingredient_id', 'ingredient_name']
        );
        console.log('Ingredients migration completed.');

        await importCSV(
            path.join(__dirname, 'data', 'recipe_ingredients.csv'),
            'RecipeIngredients',
            ['recipe_id', 'ingredient_id']
        );
        console.log('RecipeIngredients migration completed.');

        await importCSV(
            path.join(__dirname, 'data', 'steps.csv'),
            'Steps',
            ['recipe_id', 'step_number', 'step_description']
        );
        console.log('Steps migration completed.');

        await importCSV(
            path.join(__dirname, 'data', 'tags.csv'),
            'Tags',
            ['tag_name']
        );
        console.log('Tags migration completed.');

        await importCSV(
            path.join(__dirname, 'data', 'recipe_tags.csv'),
            'RecipeTags',
            ['recipe_id', 'tag_name']
        );
        console.log('RecipeTags migration completed.');

        await importCSV(
            path.join(__dirname, 'data', 'search_terms.csv'),
            'SearchTerms',
            ['search_term']
        );
        console.log('SearchTerms migration completed.');

        await importCSV(
            path.join(__dirname, 'data', 'recipe_search_terms.csv'),
            'RecipeSearchTerms',
            ['recipe_id', 'search_term']
        );
        console.log('RecipeSearchTerms migration completed.');

        connection.end();
    } catch (error) {
        console.error('Migration error:', error);
        connection.end();
    }
}

runMigration();
