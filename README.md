# NotionTodistBot
 Automates certain process between Notion and Todoist
 Automates certain process between Notion and Todoist. Using Node, and JS to perform API calls.

## Simple program built because Automate.io is rather expensive.
I wanted some basic automation between Notion and Todoist. I looked into Automate.io and found it pretty spendy for the number of actions that I would need to perform each day.

Thus this bot was born. 

## Functions 
1. On Notion I have a database that acts as a sort of Kanban board. When I move or create a page in the "Today" section (which I use for projects I am working on that day) The bot then will add a task with the same name to Todoist (if one is not already there)
2. When a task, that has a corresponding page in Notion, is completed in Todoist, the bot will then move that page into the "Completed Today" section.
