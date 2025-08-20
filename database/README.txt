i ran the code and all was fine but in case you faced any 
problems here are some solutions:


in case the database isnt there for you:
write in the terminal mysql -e "source /home/coder/project/midterm/schema.sql"
then write this in terminal node migration.js

to run the website write node app.js

when i was opening the website on vs code i had no problem 
using the drop down menu but on coursera lab it wasnt working as expected
so in case you faced this problem go to those links to see all visualizations:

localhost:3000/query?query=popularVegetarian
localhost:3000/query?query=specificIngredient
localhost:3000/query?query=commonLowCalorieTag
localhost:3000/query?query=topSteps
localhost:3000/query?query=topIngredients
localhost:3000/query?query=mealType
localhost:3000/query?query=topTagsForTopIngredients
localhost:3000/query?query=tagsForChocolateRecipes
localhost:3000/search-page
localhost:3000/meal-planner
localhost:3000/favorites-page