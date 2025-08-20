# meal-planner-recipe-database
A Node.js-based application for managing meal prep recipes, storing ingredient details, and linking recipes with their ingredients using MySQL.


# Meal Planner Recipe Database

## Overview
This project is a **meal prep recipe management system** built with **Node.js**, **Express**, and **MySQL**. It allows users to manage meal prep recipes, ingredients, and their relationships by using the **Food.com Recipes with Search Terms and Tags** dataset from **Kaggle**. The dataset includes over 230k recipes, ingredients, preparation steps, and tags.

The app includes features for:
- Managing recipes and ingredients.
- Importing data into the database from CSV files.
- Storing recipe details in a relational database with proper relationships between recipes and ingredients.
- Providing interactive visualizations to explore popular recipes and ingredients.

## Features
- **Recipe Management**: Add, edit, and delete recipes along with details like description, serving size, and ingredients.
- **Ingredient Management**: Store and link ingredients to recipes.
- **Search and Filter**: Users can search and filter recipes based on ingredients, tags, and other attributes.
- **Meal Planner**: Users can plan meals for the week by selecting favorite recipes.
- **Favorite Recipes**: Users can mark recipes as favorites for quick access.
- **Interactive Visualizations**: Visualize data on popular ingredients, recipes, and more using **Chart.js**.

## Technologies Used
- **Node.js**: Backend server for handling API requests.
- **Express.js**: Web framework for routing and serving the API.
- **MySQL**: Database for storing recipes, ingredients, and relationships.
- **EJS**: Templating engine for rendering HTML views.
- **Chart.js**: Library for creating interactive data visualizations.

## Project Structure
- **app.js**: Main server file that sets up routes and database connections.
- **migration.js**: Handles importing CSV data into the MySQL database.
- **schema.sql**: SQL schema for creating the database and tables.
- **public/**: Contains static files for the frontend.
- **views/**: Contains EJS templates for rendering the application views.

- **DBDocs**: https://dbdocs.io/
- **Chart.js**: https://www.chartjs.org/
