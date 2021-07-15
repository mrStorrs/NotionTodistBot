import { Client } from "@notionhq/client"; //used to access notions api.
import fetch from "node-fetch"; //used for making https requests
import * as KEYS from "./secret.js"; //holds api keys.
import uuid4 from "uuid4";

//notion information
const notion = new Client({ auth: KEYS.NOTION_API_KEY });
const databaseId = KEYS.NOTION_DB_KEY;

var last_notion = 0;
var last_tasks = 0;
var notion_task_dict = {};
var todoist_task_arr = [];
var notion_synced = false;
var todoist_synced = false;

//search for updates every 15 seconds. 
setInterval(function () {
    findNotionChanges();
    findTodoistChanges();
    check_if_synced();
}, 15000);

/**
 * Monitors Notion for changes in pages.
 */
async function findNotionChanges() {
    try{
        const response = await notion.databases.query({
            database_id: databaseId,
            filter: {
                "property": "Status",
                "select": {
                    "equals" : "Today"
                }
            }
        });
    }catch (error){
        console.log(error)
        return null; //stop function, error found while attempting to access notion API
    }
    //what to do if changes are found.
    if(JSON.stringify(response) != JSON.stringify(last_notion)){
        console.log("Notion pages do not match, updating pages")
        notion_task_dict = {}; //reset dict 
        last_notion = response;

        //find plain text titles of each task, then add to a dictionary to be checked against tasks.
        for(var x = 0; x < response.results.length; x++){
            var title = response.results[x].properties.Name.title[0].plain_text
            var notion_page_id = response.results[x].id
            notion_task_dict[title] = [0, notion_page_id];      
        };
        console.log(notion_task_dict);
        notion_synced = true;
    //What to do if no changes are found
    } else {
        console.log("No notion changes found")
    }
}

/**
 * Monitors Todoist for changes in tasks.
 */
async function findTodoistChanges() {
    fetch('https://api.todoist.com/rest/v1/tasks', {
        headers: { 'Authorization': "Bearer fefa5ac86a7b1f9b5feb0ef62d556d7a6c97ef37" }
        })  
        .then(response => {
            return response.json();
        })
        .then(tasks => {
            //what to do if changes are found.
            if (JSON.stringify(last_tasks) != JSON.stringify(tasks)) {
                console.log("tasks do not match, updating tasks")
                todoist_task_arr = []; //reset arr holding todoist tasks
                last_tasks = tasks;

                //find plain text titles of each task, then add to an array to be checked against tasks.
                for (var x = 0; x < tasks.length; x++) {
                    var title = tasks[x].content
                    todoist_task_arr.push(title);
                };
                console.log(todoist_task_arr);
                todoist_synced = true; 
            //What to do if no changes are found
            } else { 
                console.log("No todoist changes found") 
            }
        })
        .catch(error => {
            console.error('Error:', error);
        })
}

/**
 * Adds a task to Todoist from a notion page.
 * @param  {String} title The name of the notion page to be added as a task in todoist.
 */
function add_task(title) {
    todoist_synced = false; //todoist list is no longer synced. 
    console.log("adding task: " + title);
    fetch('https://api.todoist.com/rest/v1/tasks', {
        method: 'POST', // or 'PUT'
        body: JSON.stringify({"content": title}),
        headers: { 
            "Content-Type": "application/json",
            "X-Request-Id": uuid4(), 
            'Authorization': KEYS.TODOIST_API_KEY
        },
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

/**
 * Checks if Notion pages are synced with Todoist Tasks. Then performs various func based on results.
 */
function check_if_synced(){
    if(notion_synced && todoist_synced){
        for(var title in notion_task_dict){
            if (!todoist_task_arr.includes(title)){
                if (notion_task_dict[title][0] == 0){
                    todoist_synced = false;
                    console.log("New notion page found running add_task")
                    add_task(title);
                    notion_task_dict[title][0] = 1;
                } else if (notion_task_dict[title][0] == 1){
                    notion_synced = false;
                    change_status_notion(notion_task_dict[title][1]);
                }
            }
        }
    }
}

/**
 * Changes the status of a notion page to the "Today Done" Section when it is removed from todoist
 * @param  {String} notion_page_id The id of the page being moved 
 */
async function change_status_notion(notion_page_id){
    console.log("hey this is the page id: " + notion_page_id)
    const response = await notion.pages.update({
        page_id: notion_page_id,
        properties: {
            'Status': {
                select: {
                    id : '6b457f8b-55b9-445a-b0ef-accd717121ef'
                }
            },
        },
    });
    console.log(response);
}
