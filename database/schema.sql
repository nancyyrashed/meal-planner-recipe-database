-- Create database
CREATE DATABASE mealprepdb;
USE mealprepdb;

-- Create table Recipes
CREATE TABLE Recipes (
    recipe_id INT PRIMARY KEY NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    serving_size VARCHAR(255) NOT NULL,
    servings INT NOT NULL
);

-- Create table Ingredients
CREATE TABLE Ingredients (
    ingredient_id INT PRIMARY KEY NOT NULL,
    ingredient_name VARCHAR(255) NULL
);

-- Create table RecipeIngredients
CREATE TABLE RecipeIngredients (
    recipe_id INT NOT NULL,
    ingredient_id INT NOT NULL,
    UNIQUE(recipe_id, ingredient_id),
    FOREIGN KEY (recipe_id) REFERENCES Recipes(recipe_id),
    FOREIGN KEY (ingredient_id) REFERENCES Ingredients(ingredient_id)
);

-- Create table Steps
CREATE TABLE Steps (
    recipe_id INT NOT NULL,
    step_number INT NOT NULL,
    step_description TEXT NOT NULL,
    UNIQUE(recipe_id, step_number),
    FOREIGN KEY (recipe_id) REFERENCES Recipes(recipe_id)
);

-- Create table SearchTerms
CREATE TABLE SearchTerms (
    search_term VARCHAR(255) PRIMARY KEY NOT NULL 
);

-- Create table RecipeSearchTerms
CREATE TABLE RecipeSearchTerms (
    recipe_id INT NOT NULL,
    search_term VARCHAR(255) NOT NULL,
    UNIQUE(recipe_id, search_term),
    FOREIGN KEY (recipe_id) REFERENCES Recipes(recipe_id),
    FOREIGN KEY (search_term) REFERENCES SearchTerms(search_term)
);

-- Create table Tags
CREATE TABLE Tags (
    tag_name VARCHAR(255) PRIMARY KEY NOT NULL 
);

-- Create table RecipeTags
CREATE TABLE RecipeTags (
    recipe_id INT NOT NULL,
    tag_name VARCHAR(255) NOT NULL,
    UNIQUE(recipe_id, tag_name),
    FOREIGN KEY (recipe_id) REFERENCES Recipes(recipe_id),
    FOREIGN KEY (tag_name) REFERENCES Tags(tag_name)
);

-- Create table Favorites
CREATE TABLE Favorites (
    favorite_id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,
    UNIQUE (recipe_id), 
    FOREIGN KEY (recipe_id) REFERENCES Recipes(recipe_id) ON DELETE CASCADE
);

-- Create table MealPlanner
CREATE TABLE MealPlanner (
    meal_plan_id INT AUTO_INCREMENT PRIMARY KEY,
    day VARCHAR(20) NOT NULL, 
    meal_type VARCHAR(20) NOT NULL, 
    recipe_id INT NOT NULL,
    UNIQUE (day, meal_type), 
    FOREIGN KEY (recipe_id) REFERENCES Recipes(recipe_id) ON DELETE CASCADE
);
