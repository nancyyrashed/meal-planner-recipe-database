// Import necessary modules
const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
// Static files and view engine setup
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: 'mealprepdb',
});

// Routes
// Render the homepage
app.get("/", (req, res) => {
  res.render("index", { chartData: null, selectedQuery: null });
});

// Render the Search and Filter Recipes page
app.get("/search-page", (req, res) => {
  res.render("search", { tags: [], searchTerms: [] });
});

// Render the Meal Planner page
app.get('/meal-planner', (req, res) => {
  res.render('meal-planner');
});

// Search recipes with filters
app.get("/search", async (req, res) => {
  const { tag, searchTerm, ingredient, sort, page = 1 } = req.query;

  const itemsPerPage = 10; // Number of items per page
  const offset = (page - 1) * itemsPerPage;

  // Build the SQL sort clause based on the sorting option
  let sortClause = "";
  if (sort === "alphabetical") {
    sortClause = "ORDER BY r.name ASC";
  } else if (sort === "servings") {
    sortClause = "ORDER BY r.servings DESC";
  }

  // SQL query to fetch recipes with filters applied
  let sql = `
    SELECT DISTINCT r.recipe_id, r.name, r.description, r.servings,
      GROUP_CONCAT(DISTINCT i.ingredient_name SEPARATOR ', ') AS ingredients
    FROM Recipes r
    LEFT JOIN RecipeTags rt ON r.recipe_id = rt.recipe_id
    LEFT JOIN Tags t ON rt.tag_name = t.tag_name
    LEFT JOIN RecipeSearchTerms rst ON r.recipe_id = rst.recipe_id
    LEFT JOIN SearchTerms st ON rst.search_term = st.search_term
    LEFT JOIN RecipeIngredients ri ON r.recipe_id = ri.recipe_id
    LEFT JOIN Ingredients i ON ri.ingredient_id = i.ingredient_id
    WHERE (t.tag_name = ? OR ? IS NULL)
      AND (st.search_term = ? OR ? IS NULL)
      AND (i.ingredient_name = ? OR ? IS NULL)
    GROUP BY r.recipe_id
    ${sortClause}
    LIMIT ? OFFSET ?;
  `;

  try {
    // Execute the SQL query
    const [rows] = await pool.query(sql, [
      tag || null,
      tag || null,
      searchTerm || null,
      searchTerm || null,
      ingredient || null,
      ingredient || null,
      itemsPerPage,
      offset,
    ]);

    // Fetch total count of matching recipes for pagination
    const [totalCount] = await pool.query(`
      SELECT COUNT(DISTINCT r.recipe_id) AS count
      FROM Recipes r
      LEFT JOIN RecipeTags rt ON r.recipe_id = rt.recipe_id
      LEFT JOIN Tags t ON rt.tag_name = t.tag_name
      LEFT JOIN RecipeSearchTerms rst ON r.recipe_id = rst.recipe_id
      LEFT JOIN SearchTerms st ON rst.search_term = st.search_term
      LEFT JOIN RecipeIngredients ri ON r.recipe_id = ri.recipe_id
      LEFT JOIN Ingredients i ON ri.ingredient_id = i.ingredient_id
      WHERE (t.tag_name = ? OR ? IS NULL)
        AND (st.search_term = ? OR ? IS NULL)
        AND (i.ingredient_name = ? OR ? IS NULL);
    `, [tag || null, tag || null, searchTerm || null, searchTerm || null, ingredient || null, ingredient || null]);

    res.json({ recipes: rows, totalCount: totalCount[0].count });
  } catch (error) {
    console.error("Error fetching search results:", error);
    res.status(500).json({ error: "An error occurred while fetching search results." });
  }
});

// Fetch filters for dropdowns (tags, search terms, ingredients)
app.get("/filters", async (req, res) => {
  try {
    const [tags] = await pool.query("SELECT DISTINCT tag_name FROM Tags");
    const [searchTerms] = await pool.query("SELECT DISTINCT search_term FROM SearchTerms");
    const [ingredients] = await pool.query("SELECT DISTINCT ingredient_name FROM Ingredients");
    res.json({ tags, searchTerms, ingredients });
  } catch (error) {
    console.error("Error fetching filters:", error);
    res.status(500).json({ error: "An error occurred while fetching filters." });
  }
});

// Add a recipe to favorites
app.post("/favorites/add", async (req, res) => {
  const { recipe_id } = req.body;
  try {
    console.log("Adding recipe to favorites:", recipe_id); // Debug log
    const [result] = await pool.query(
      "INSERT IGNORE INTO Favorites (recipe_id) VALUES (?)",
      [recipe_id]
    );
    if (result.affectedRows > 0) {
      res.json({ success: true, message: "Recipe added to favorites!" });
    } else {
      res.json({ success: false, message: "Recipe already in favorites." });
    }
  } catch (error) {
    console.error("Error adding recipe to favorites:", error);
    res.status(500).json({ success: false, message: "Error adding recipe to favorites." });
  }
});

// Remove a recipe from favorites
app.post("/favorites/remove", async (req, res) => {
  const { recipe_id } = req.body;
  try {
    await pool.query("DELETE FROM Favorites WHERE recipe_id = ?", [recipe_id]);
    res.json({ success: true, message: "Recipe removed from favorites!" });
  } catch (error) {
    console.error("Error removing recipe from favorites:", error);
    res.status(500).json({ success: false, message: "Error removing recipe from favorites." });
  }
});

// Save a meal to the meal planner
app.post('/meal-planner/save', async (req, res) => {
  const { day, meal, recipeId } = req.body;
  try {
    await pool.query(`
      INSERT INTO MealPlanner (day, meal_type, recipe_id)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE recipe_id = VALUES(recipe_id)
    `, [day, meal, recipeId]);

    res.json({ success: true, message: 'Meal plan saved successfully.' });
  } catch (error) {
    console.error('Error saving meal plan:', error);
    res.status(500).json({ success: false, message: 'Error saving meal plan.' });
  }
});

// Fetch saved meals from the meal planner
app.get('/meal-planner/fetch', async (req, res) => {
  try {
    const [mealPlan] = await pool.query(`
      SELECT day, meal_type, r.name AS recipe_name
      FROM MealPlanner mp
      JOIN Recipes r ON mp.recipe_id = r.recipe_id
    `);

    res.json({ mealPlan });
  } catch (error) {
    console.error('Error fetching meal plan:', error);
    res.status(500).json({ error: 'Error fetching meal plan.' });
  }
});

// Render the Favorites page
app.get("/favorites-page", (req, res) => {
  res.render("favorites");
});

// Fetch favorite recipes with optional filters and pagination
app.get('/favorites', async (req, res) => {
  const { tag = '', searchTerm = '', ingredient = '', sort = '', page = 1 } = req.query;
  const offset = (page - 1) * 10;
  const orderBy = sort === 'alphabetical' ? 'r.name ASC' : 'r.servings ASC';

  try {
    const query = `
      SELECT 
          r.recipe_id, 
          r.name, 
          r.description, 
          r.servings,
          GROUP_CONCAT(DISTINCT i.ingredient_name SEPARATOR ', ') AS ingredients
      FROM 
          Favorites f
      JOIN 
          Recipes r ON f.recipe_id = r.recipe_id
      LEFT JOIN 
          RecipeIngredients ri ON r.recipe_id = ri.recipe_id
      LEFT JOIN 
          Ingredients i ON ri.ingredient_id = i.ingredient_id
      WHERE 
          (1=1)
          AND (? = '' OR EXISTS (
              SELECT 1 FROM RecipeTags rt WHERE rt.recipe_id = r.recipe_id AND rt.tag_name = ?
          ))
          AND (? = '' OR EXISTS (
              SELECT 1 FROM RecipeSearchTerms rst WHERE rst.recipe_id = r.recipe_id AND rst.search_term = ?
          ))
          AND (? = '' OR EXISTS (
              SELECT 1 FROM RecipeIngredients ri WHERE ri.recipe_id = r.recipe_id AND EXISTS (
                  SELECT 1 FROM Ingredients i WHERE i.ingredient_id = ri.ingredient_id AND i.ingredient_name = ?
              )
          ))
      GROUP BY r.recipe_id
      ORDER BY ${orderBy}
      LIMIT 10 OFFSET ?;
    `;

    const [rows] = await pool.query(query, [
      tag, tag,
      searchTerm, searchTerm,
      ingredient, ingredient,
      offset,
    ]);

    const [totalCount] = await pool.query(`
      SELECT COUNT(DISTINCT r.recipe_id) AS count
      FROM Favorites f
      JOIN Recipes r ON f.recipe_id = r.recipe_id;
    `);

    res.json({ favorites: rows, totalPages: Math.ceil(totalCount[0].count / 10) });
  } catch (error) {
    console.error('Error fetching favorite recipes:', error);
    res.status(500).json({ error: 'Error fetching favorite recipes.' });
  }
});

// Clear all meal planner data
app.post('/meal-planner/clear', async (req, res) => {
  try {
    await pool.query('DELETE FROM MealPlanner');
    res.json({ success: true, message: 'Meal plan cleared successfully.' });
  } catch (error) {
    console.error('Error clearing meal plan:', error);
    res.status(500).json({ success: false, message: 'Error clearing meal plan.' });
  }
});


app.get("/query", async (req, res) => {
  const { query } = req.query;
  let sql = "";
  let chartData = {
    labels: [],
    datasets: [
      {
        label: "",
        data: [],
        backgroundColor: [],
        recipeNames: [],
      },
    ],
  };
  let selectedQuery = query || "popularVegetarian";

  const distinctColors = [
    "rgba(255, 99, 71, 0.7)",   // Tomato Red
    "rgba(30, 144, 255, 0.7)",  // Dodger Blue
    "rgba(50, 205, 50, 0.7)",   // Lime Green
    "rgba(255, 165, 0, 0.7)",   // Orange
    "rgba(138, 43, 226, 0.7)",  // Blue Violet
    "rgba(240, 128, 128, 0.7)", // Light Coral
    "rgba(0, 139, 139, 0.7)",   // Dark Cyan
    "rgba(255, 20, 147, 0.7)",  // Deep Pink
    "rgba(70, 130, 180, 0.7)",  // Steel Blue
    "rgba(154, 205, 50, 0.7)",  // Yellow Green
    "rgba(255, 215, 0, 0.7)",   // Gold
    "rgba(0, 100, 0, 0.7)",     // Dark Green
    "rgba(205, 92, 92, 0.7)",   // Indian Red
    "rgba(75, 0, 130, 0.7)",    // Indigo
    "rgba(255, 140, 0, 0.7)",   // Dark Orange
    "rgba(127, 255, 212, 0.7)", // Aquamarine
    "rgba(220, 20, 60, 0.7)",   // Crimson
    "rgba(139, 69, 19, 0.7)",   // Saddle Brown
    "rgba(0, 191, 255, 0.7)",   // Deep Sky Blue
    "rgba(34, 139, 34, 0.7)",   // Forest Green
];

  const singleColor = "rgba(54, 162, 235, 0.7)"; // Single color for 1st and 4th cases

  try {
    switch (query) {
      case "popularVegetarian":
        sql = `
          SELECT r.name AS Recipe, COUNT(rt.tag_name) AS Popularity
          FROM Recipes r
          JOIN RecipeTags rt ON r.recipe_id = rt.recipe_id
          WHERE rt.tag_name = 'vegetarian'
          GROUP BY r.recipe_id
          ORDER BY Popularity DESC
          LIMIT 5
        `;
        chartData.datasets[0].label = "Popularity";
        break;

      case "specificIngredient":
        sql = `
          SELECT i.ingredient_name AS Ingredient, 
                 COUNT(r.recipe_id) AS RecipeCount,
                 GROUP_CONCAT(r.name SEPARATOR ', ') AS RecipeNames
          FROM Recipes r
          JOIN RecipeIngredients ri ON r.recipe_id = ri.recipe_id
          JOIN Ingredients i ON ri.ingredient_id = i.ingredient_id
          WHERE i.ingredient_name IN ('garlic', 'olive oil')
          GROUP BY i.ingredient_name
        `;
        chartData.datasets[0].label = "Recipes by Ingredient";
        break;

      case "commonLowCalorieTag":
        sql = `
          SELECT rt.tag_name AS Tag, COUNT(*) AS Count
          FROM RecipeTags rt
          JOIN Recipes r ON r.recipe_id = rt.recipe_id
          WHERE rt.tag_name = 'low-calorie'
          GROUP BY rt.tag_name
          ORDER BY Count DESC
          LIMIT 1
        `;
        chartData.datasets[0].label = "Low-Calorie Recipes";
        break;

      case "topSteps":
        sql = `
          SELECT r.name AS Recipe, COUNT(s.step_number) AS Steps
          FROM Recipes r
          JOIN Steps s ON r.recipe_id = s.recipe_id
          GROUP BY r.recipe_id
          ORDER BY Steps DESC
          LIMIT 5
        `;
        chartData.datasets[0].label = "Number of Steps";
        break;

      case "topIngredients":
        sql = `
          SELECT i.ingredient_name AS Ingredient, COUNT(ri.ingredient_id) AS \`Usage\`
          FROM Ingredients i
          JOIN RecipeIngredients ri ON i.ingredient_id = ri.ingredient_id
          GROUP BY i.ingredient_name
          ORDER BY \`Usage\` DESC
          LIMIT 10
        `;
        chartData.datasets[0].label = "Most Used Ingredients";
        break;

      case "mealType":
        sql = `
          SELECT rt.tag_name AS MealType, 
                 COUNT(r.recipe_id) AS RecipeCount,
                 GROUP_CONCAT(r.name SEPARATOR ', ') AS RecipeNames
          FROM Recipes r
          JOIN RecipeTags rt ON r.recipe_id = rt.recipe_id
          WHERE rt.tag_name IN ('brunch', 'desserts')
          GROUP BY rt.tag_name
        `;
        chartData.datasets[0].label = "Recipes by Meal Type";
        break;

        case "topTagsForTopIngredients":
  sql = `
    WITH TopIngredients AS (
      SELECT i.ingredient_id, i.ingredient_name, COUNT(ri.ingredient_id) AS \`Usage\`
      FROM Ingredients i
      JOIN RecipeIngredients ri ON i.ingredient_id = ri.ingredient_id
      GROUP BY i.ingredient_id
      ORDER BY \`Usage\` DESC
      LIMIT 3
    )
    SELECT 
      rt.tag_name AS Tag, 
      COUNT(rt.recipe_id) AS TagCount
    FROM RecipeTags rt
    JOIN RecipeIngredients ri ON rt.recipe_id = ri.recipe_id
    JOIN TopIngredients ti ON ri.ingredient_id = ti.ingredient_id
    GROUP BY rt.tag_name
    ORDER BY TagCount DESC
    LIMIT 20;
  `;
  chartData.datasets[0].label = "Tags for Top Ingredients";
  break;

case "tagsForChocolateRecipes":
  sql = `
    SELECT 
      t.tag_name AS Tag,
      COUNT(*) AS Frequency
    FROM RecipeIngredients ri
    JOIN Ingredients i ON ri.ingredient_id = i.ingredient_id
    JOIN RecipeTags rt ON ri.recipe_id = rt.recipe_id
    JOIN Tags t ON rt.tag_name = t.tag_name
    WHERE i.ingredient_name LIKE '%chocolate%'
    GROUP BY t.tag_name
    ORDER BY Frequency DESC
    LIMIT 10;
  `;
  chartData.datasets[0].label = "Tags for Chocolate Recipes";
  break;


      default:
        res.redirect("/");
        return;
    }

    const [rows] = await pool.query(sql);

    rows.forEach((row, index) => {
        chartData.labels.push(row.Tag || row.Recipe || row.Ingredient || row.MealType); // Dynamically handle labels
        chartData.datasets[0].data.push(
          row.TagCount || row.Frequency || row.Popularity || row.Count || row.Steps || row.Usage || row.RecipeCount
        );
      
        // Apply color logic
        if (query === "popularVegetarian" || query === "topSteps") {
          chartData.datasets[0].backgroundColor.push(singleColor); // Single color for these cases
        } else {
          chartData.datasets[0].backgroundColor.push(distinctColors[index % distinctColors.length]); // Distinct colors for others
        }
      
        if (row.RecipeNames) {
          chartData.datasets[0].recipeNames = chartData.datasets[0].recipeNames || [];
          chartData.datasets[0].recipeNames.push(row.RecipeNames); // Ensure recipeNames is initialized and populated
        }
      });
      

    res.render("index", { chartData, selectedQuery });
  } catch (error) {
    console.error(error);
    res.render("index", { chartData, selectedQuery });
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
